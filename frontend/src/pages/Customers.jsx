import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, User, Mail, Phone, Calendar } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Customers({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showToast('Failed to load customers catalogue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', phone: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
    };

    try {
      await api.post('/customers', payload);
      showToast('Customer registered successfully!', 'success');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error registering customer:', error);
      const errMsg = error.response?.data?.detail || 'Failed to register customer.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This operation cannot be undone.')) return;

    try {
      await api.delete(`/customers/${customerId}`);
      showToast('Customer record deleted.', 'success');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      const errMsg = error.response?.data?.detail || 'Failed to delete customer.';
      showToast(errMsg, 'error');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Customer Directory</h1>
          <p>Register, inspect, and manage active customer profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Register Customer
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
            placeholder="Search by name or email address..."
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
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Syncing customer directory...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={styles.emptyState}>
            <User size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>No Customers Registered</h3>
            <p>Register your first client to start logging transactional data.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Client Information</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={styles.customerCell}>
                        <div style={styles.avatar}>
                          <User size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{customer.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="var(--text-muted)" />
                        <span>{customer.email}</span>
                      </div>
                    </td>
                    <td>
                      {customer.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={14} color="var(--text-muted)" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>--</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div style={styles.actions}>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem' }}
                          onClick={() => handleDelete(customer.id)}
                          title="Delete Customer Profile"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. john.doe@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {formErrors.email && <span style={styles.errorText}>{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="text"
              name="phone"
              className="form-input"
              placeholder="e.g. +1 (555) 123-4567"
              value={formData.phone}
              onChange={handleInputChange}
            />
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
              {submitting ? 'Registering...' : 'Register Profile'}
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
  customerCell: {
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
