import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Dashboard({ showToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" style={styles.spinner}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Gathering business intelligence...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: <Package size={24} color="var(--primary)" />,
      description: 'Items in catalogue',
      glow: 'rgba(99, 102, 241, 0.15)',
    },
    {
      title: 'Active Customers',
      value: stats?.total_customers || 0,
      icon: <Users size={24} color="var(--secondary)" />,
      description: 'Registered clients',
      glow: 'rgba(168, 85, 247, 0.15)',
    },
    {
      title: 'Orders Processed',
      value: stats?.total_orders || 0,
      icon: <ShoppingCart size={24} color="var(--success)" />,
      description: 'Sales completed',
      glow: 'rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.low_stock_count || 0,
      icon: <AlertTriangle size={24} color={stats?.low_stock_count > 0 ? 'var(--danger)' : 'var(--success)'} />,
      description: 'Inventory levels <= 5',
      glow: stats?.low_stock_count > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
    },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Control Dashboard</h1>
          <p>Real-time analytics and inventory operational overview.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchStats} style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div style={styles.grid}>
        {statCards.map((card, idx) => (
          <div 
            key={idx} 
            className="glass-card" 
            style={{ ...styles.card, '--glow': card.glow }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>{card.title}</span>
              <div style={styles.cardIcon}>{card.icon}</div>
            </div>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardDesc}>{card.description}</div>
          </div>
        ))}
      </div>

      {/* Main Panel Content */}
      <div style={styles.contentRow}>
        {/* Low Stock Warning Panel */}
        <div className="glass-card" style={styles.leftCol}>
          <div style={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="var(--warning)" />
              <h2>Critical Stock Warnings</h2>
            </div>
            <span className="badge badge-warning">{stats?.low_stock_count || 0} Alert(s)</span>
          </div>

          {stats?.low_stock_products.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.checkmarkBg}>✓</div>
              <h3>Inventory Healthy</h3>
              <p>All catalogued products have stock levels above safety threshold.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 500 }}>{product.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{product.sku}</td>
                      <td>{product.quantity} units</td>
                      <td>
                        <span className={`badge ${product.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Operational Analytics Mock Summary */}
        <div className="glass-card" style={styles.rightCol}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h2>Warehouse Health</h2>
          </div>
          
          <div style={styles.metricItem}>
            <div style={styles.metricLabel}>
              <span>Stock Distribution</span>
              <span>84% Capacity</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: '84%', background: 'linear-gradient(to right, var(--primary), var(--secondary))' }}></div>
            </div>
          </div>

          <div style={styles.metricItem}>
            <div style={styles.metricLabel}>
              <span>Order Fulfill Rate</span>
              <span>100% Target</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: '100%', background: 'var(--success)' }}></div>
            </div>
          </div>

          <div style={styles.metricItem}>
            <div style={styles.metricLabel}>
              <span>System Latency</span>
              <span>Optimal (42ms)</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: '92%', background: 'var(--success)' }}></div>
            </div>
          </div>

          <div style={styles.activityFeed}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Recent Activity</h3>
            <div style={styles.feedItem}>
              <div style={styles.feedBullet}></div>
              <div>
                <div style={styles.feedText}>System started up successfully</div>
                <div style={styles.feedTime}>Just now</div>
              </div>
            </div>
            <div style={styles.feedItem}>
              <div style={{ ...styles.feedBullet, background: 'var(--success)' }}></div>
              <div>
                <div style={styles.feedText}>Database sync checks completed</div>
                <div style={styles.feedTime}>5 mins ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.05)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  card: {
    position: 'relative',
    boxShadow: 'var(--shadow-premium), 0 0 30px var(--glow, rgba(99, 102, 241, 0.05))',
    transition: 'var(--transition-smooth)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardIcon: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    padding: '0.5rem',
    borderRadius: '10px',
  },
  cardValue: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '0.25rem',
    letterSpacing: '-0.02em',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  contentRow: {
    display: 'grid',
    gridTemplateColumns: '3fr 2fr',
    gap: '1.5rem',
  },
  leftCol: {
    minHeight: '350px',
  },
  rightCol: {
    minHeight: '350px',
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '3rem 1rem',
    height: '80%',
  },
  checkmarkBg: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'var(--success-glow)',
    color: 'var(--success)',
    fontSize: '1.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  metricItem: {
    marginBottom: '1.25rem',
  },
  metricLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
    fontWeight: 500,
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 1s ease-out',
  },
  activityFeed: {
    marginTop: 'auto',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-glass)',
  },
  feedItem: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    fontSize: '0.85rem',
  },
  feedBullet: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    marginTop: '5px',
  },
  feedText: {
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  feedTime: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    marginTop: '2px',
  },
};

// Insert keyframes for spinner in a style tag
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
