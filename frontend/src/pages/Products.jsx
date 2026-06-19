import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Info } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products catalogue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ name: '', sku: '', price: '', quantity: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU code is required';
    
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Price must be a positive number';
    }
    
    const qtyNum = parseInt(formData.quantity);
    if (isNaN(qtyNum) || qtyNum < 0) {
      errors.quantity = 'Stock quantity must be a non-negative integer';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
    };

    try {
      if (modalMode === 'create') {
        await api.post('/products', payload);
        showToast('Product added successfully!', 'success');
      } else {
        await api.put(`/products/${selectedProduct.id}`, payload);
        showToast('Product updated successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      const errMsg = error.response?.data?.detail || 'Failed to save product.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      showToast('Product deleted successfully.', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      const errMsg = error.response?.data?.detail || 'Failed to delete product.';
      showToast(errMsg, 'error');
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Product Catalogue</h1>
          <p>Track, manage, and configure items available in inventory.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={styles.searchBar}>
        <div style={styles.searchContainer}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', background: 'transparent', padding: '0.25rem 0.5rem' }}
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={styles.loading}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Syncing warehouse catalogue...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <Package size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No Products Found</h3>
            <p>We couldn't find any products matching your query.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU Code</th>
                  <th>Unit Price</th>
                  <th>Available Stock</th>
                  <th>Inventory Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  let badgeClass = 'badge-success';
                  let statusText = 'In Stock';
                  if (product.quantity === 0) {
                    badgeClass = 'badge-danger';
                    statusText = 'Out of Stock';
                  } else if (product.quantity <= 5) {
                    badgeClass = 'badge-warning';
                    statusText = 'Low Stock';
                  }

                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={styles.productCell}>
                          <div style={styles.avatar}>
                            <Package size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500, letterSpacing: '0.05em' }}>
                        {product.sku}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        ${product.price.toFixed(2)}
                      </td>
                      <td>{product.quantity} units</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{statusText}</span>
                      </td>
                      <td>
                        <div style={styles.actions}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem' }}
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem' }}
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Product' : 'Modify Product Details'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Ultra-Wide Monitor"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Catalog Code</label>
            <input
              type="text"
              name="sku"
              className="form-input"
              placeholder="e.g. MON-34-UW"
              value={formData.sku}
              onChange={handleInputChange}
              required
            />
            {formErrors.sku && <span style={styles.errorText}>{formErrors.sku}</span>}
          </div>

          <div style={styles.formRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                className="form-input"
                placeholder="299.99"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
              {formErrors.price && <span style={styles.errorText}>{formErrors.price}</span>}
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Starting Stock Quantity</label>
              <input
                type="number"
                name="quantity"
                className="form-input"
                placeholder="50"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
              {formErrors.quantity && <span style={styles.errorText}>{formErrors.quantity}</span>}
            </div>
          </div>

          <div style={styles.modalActions}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : modalMode === 'create' ? 'Save Product' : 'Apply Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  searchBar: {
    marginBottom: '1.5rem',
    padding: '0.75rem 1.25rem',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 1rem',
    textAlign: 'center',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'var(--primary-glow)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-glass-active)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-glass)',
  },
  errorText: {
    fontSize: '0.75rem',
    color: 'var(--danger)',
    marginTop: '0.25rem',
    display: 'block',
  },
};
