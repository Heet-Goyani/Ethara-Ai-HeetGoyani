import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, ShoppingCart, ShoppingBag, PlusCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function CreateOrder({ navigateTo, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, available_stock: 0, price: 0, name: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products')
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (error) {
        console.error('Error fetching data for checkout:', error);
        showToast('Failed to load customers/products metadata.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddProductRow = () => {
    setOrderItems((prev) => [
      ...prev,
      { product_id: '', quantity: 1, available_stock: 0, price: 0, name: '' }
    ]);
  };

  const handleRemoveProductRow = (index) => {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index, productId) => {
    if (!productId) {
      setOrderItems((prev) => {
        const updated = [...prev];
        updated[index] = { product_id: '', quantity: 1, available_stock: 0, price: 0, name: '' };
        return updated;
      });
      return;
    }

    const selectedProduct = products.find((p) => p.id === parseInt(productId));
    if (!selectedProduct) return;

    // Check if this product is already selected in another row
    const isDuplicate = orderItems.some((item, idx) => item.product_id === parseInt(productId) && idx !== index);
    if (isDuplicate) {
      showToast('This product has already been added to the order. Adjust its quantity instead.', 'warning');
      return;
    }

    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        product_id: selectedProduct.id,
        quantity: Math.min(updated[index].quantity, selectedProduct.quantity || 1), // Clamp quantity to stock
        available_stock: selectedProduct.quantity,
        price: selectedProduct.price,
        name: selectedProduct.name
      };
      return updated;
    });
  };

  const handleQuantityChange = (index, value) => {
    const qty = parseInt(value) || 1;
    setOrderItems((prev) => {
      const updated = [...prev];
      // Quantities cannot exceed stock (unless stock is 0, clamp to 1 for validation warning)
      const maxQty = Math.max(updated[index].available_stock, 0);
      updated[index].quantity = Math.max(1, Math.min(qty, maxQty));
      return updated;
    });
  };

  // Calculate live order total
  const orderTotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer.', 'error');
      return;
    }

    // Filter out rows with no product selected
    const validItems = orderItems.filter((item) => item.product_id !== '');
    if (validItems.length === 0) {
      showToast('Please add at least one valid product item to the order.', 'error');
      return;
    }

    // Verify stock constraints before dispatching API call
    for (const item of validItems) {
      if (item.available_stock <= 0) {
        showToast(`Product "${item.name}" is completely out of stock.`, 'error');
        return;
      }
      if (item.quantity > item.available_stock) {
        showToast(`Insufficient stock for "${item.name}". Max available is ${item.available_stock}.`, 'error');
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: validItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      await api.post('/orders', payload);
      showToast('Order created successfully and stock adjusted.', 'success');
      navigateTo('orders');
    } catch (error) {
      console.error('Error placing order:', error);
      const errMsg = error.response?.data?.detail || 'Failed to place order.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Configuring terminal data engines...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigateTo('orders')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>Create Operational Order</h1>
            <p>Select target customer and configure line-items for stock verification.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.formLayout}>
        <div style={styles.leftCol}>
          {/* Customer Selection Frame */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={18} color="var(--primary)" /> Customer Selection
            </h2>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Client Association</label>
              {customers.length === 0 ? (
                <div style={styles.warningBox}>
                  <AlertCircle size={16} />
                  <span>No customers found in system directory. <span onClick={() => navigateTo('customers')} style={styles.hyperlink}>Register a customer first.</span></span>
                </div>
              ) : (
                <select
                  className="form-input"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  style={styles.selectInput}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Product Items Frame */}
          <div className="glass-card">
            <div style={styles.sectionTitleRow}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} color="var(--primary)" /> Invoice Line Items
              </h2>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleAddProductRow}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {orderItems.map((item, index) => (
              <div key={index} style={styles.itemRow}>
                {/* Product Dropdown */}
                <div style={{ flex: 3 }}>
                  <label className="form-label">Select Product</label>
                  <select
                    className="form-input"
                    value={item.product_id}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    required
                    style={styles.selectInput}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price.toFixed(2)} | {p.quantity} units left)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Indicator */}
                <div style={{ flex: 1.5 }}>
                  <label className="form-label">Available Stock</label>
                  <input
                    type="text"
                    className="form-input"
                    value={item.product_id ? `${item.available_stock} units` : '--'}
                    disabled
                    style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)' }}
                  />
                </div>

                {/* Quantity Input */}
                <div style={{ flex: 1.5 }}>
                  <label className="form-label">Qty Ordered</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={item.available_stock || 1}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    disabled={!item.product_id}
                    required
                    style={{ textAlign: 'center' }}
                  />
                </div>

                {/* Pricing subtotal */}
                <div style={{ flex: 1.5, textAlign: 'right' }}>
                  <label className="form-label">Subtotal</label>
                  <div style={styles.subtotalVal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.2rem' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleRemoveProductRow(index)}
                    disabled={orderItems.length === 1}
                    style={{ padding: '0.6rem' }}
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side checkout overview panel */}
        <div style={styles.rightCol}>
          <div className="glass-card" style={styles.summarySticky}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              Checkout Summary
            </h2>
            
            <div style={styles.summaryRow}>
              <span>Selected Customer</span>
              <span style={{ fontWeight: 600 }}>
                {selectedCustomerId ? customers.find((c) => c.id === parseInt(selectedCustomerId))?.name : '--'}
              </span>
            </div>

            <div style={styles.summaryRow}>
              <span>Product Line Items</span>
              <span style={{ fontWeight: 600 }}>
                {orderItems.filter((i) => i.product_id !== '').length} Added
              </span>
            </div>

            <div style={{ ...styles.summaryRow, margin: '1.5rem 0', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Invoice Total</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)' }}>
                ${orderTotal.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem' }}
                disabled={submitting || !selectedCustomerId}
              >
                <ShoppingCart size={18} /> {submitting ? 'Confirming Order...' : 'Submit Sales Order'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => navigateTo('orders')}
                disabled={submitting}
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '2rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  formLayout: {
    display: 'grid',
    gridTemplateColumns: '3fr 1.3fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  leftCol: {},
  rightCol: {},
  summarySticky: {
    position: 'sticky',
    top: '2rem',
  },
  sectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  itemRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.25rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  subtotalVal: {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontWeight: 600,
    fontSize: '1rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  selectInput: {
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' class='lucide lucide-chevron-down'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '12px',
    paddingRight: '2.5rem',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--warning-glow)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    color: 'var(--warning)',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  hyperlink: {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: '#ffffff',
  },
};
