import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Trash2, Calendar, FileText, Plus, User } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Orders({ navigateTo, showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Details Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load orders history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this order? Ordered inventory quantities will be restored to warehouse stock.')) return;

    try {
      await api.delete(`/orders/${orderId}`);
      showToast('Order cancelled. Stock inventory restored.', 'success');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('Failed to cancel order.', 'error');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Order Registry</h1>
          <p>Inspect, audit, and log consumer orders and sales invoices.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigateTo('create-order')}>
          <Plus size={18} /> Create New Order
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={styles.loading}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Syncing order registry...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={styles.emptyState}>
            <ShoppingCart size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No Orders Placed</h3>
            <p>Ready to log operations? Click "Create New Order" to initialize checkout.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Total Items</th>
                  <th>Total Invoice</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0);
                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={styles.orderCell}>
                          <div style={styles.avatar}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Invoice #{order.id}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UUID reference</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                          <User size={14} color="var(--text-muted)" />
                          <span>{order.customer.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={14} color="var(--text-muted)" />
                          <span>{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>{itemCount} item(s)</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td>
                        <div style={styles.actions}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem' }}
                            onClick={() => handleOpenDetails(order)}
                            title="Inspect Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem' }}
                            onClick={() => handleDelete(order.id)}
                            title="Cancel Order (Restores Stock)"
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

      {/* Invoice details modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? `Invoice Summary - Order #${selectedOrder.id}` : ''}
      >
        {selectedOrder && (
          <div>
            {/* Customer Details Frame */}
            <div style={styles.invoiceSection}>
              <h4 style={styles.sectionHeader}>Customer Details</h4>
              <div style={styles.infoGrid}>
                <div>
                  <span style={styles.infoLabel}>Full Name:</span>
                  <span style={styles.infoValue}>{selectedOrder.customer.name}</span>
                </div>
                <div>
                  <span style={styles.infoLabel}>Email Address:</span>
                  <span style={styles.infoValue}>{selectedOrder.customer.email}</span>
                </div>
                <div>
                  <span style={styles.infoLabel}>Phone Contact:</span>
                  <span style={styles.infoValue}>{selectedOrder.customer.phone || 'N/A'}</span>
                </div>
                <div>
                  <span style={styles.infoLabel}>Order Timestamp:</span>
                  <span style={styles.infoValue}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={styles.invoiceSection}>
              <h4 style={styles.sectionHeader}>Line Items Details</h4>
              <div className="table-container">
                <table className="glass-table" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU Code</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.product.name}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{item.product.sku}</td>
                        <td>${item.price_at_order.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${(item.price_at_order * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grand Total frame */}
            <div style={styles.totalBlock}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Summary Total:</span>
                <div style={styles.totalValue}>${selectedOrder.total_amount.toFixed(2)}</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
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
  orderCell: {
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
  invoiceSection: {
    marginBottom: '1.5rem',
    padding: '1rem',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
  },
  sectionHeader: {
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--primary)',
    marginBottom: '0.75rem',
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem 1rem',
  },
  infoLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  totalBlock: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '1.25rem',
    borderTop: '1px solid var(--border-glass)',
    marginTop: '1.5rem',
  },
  totalValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--success)',
    letterSpacing: '-0.02em',
  },
};
