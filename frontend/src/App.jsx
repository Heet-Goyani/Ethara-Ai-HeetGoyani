import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Menu, 
  X,
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Trigger global toast alert
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const navigateTo = (view) => {
    setCurrentView(view);
    setSidebarOpen(false); // Close responsive sidebar
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard showToast={showToast} />;
      case 'products':
        return <Products showToast={showToast} />;
      case 'customers':
        return <Customers showToast={showToast} />;
      case 'orders':
        return <Orders navigateTo={navigateTo} showToast={showToast} />;
      case 'create-order':
        return <CreateOrder navigateTo={navigateTo} showToast={showToast} />;
      default:
        return <Dashboard showToast={showToast} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'products', name: 'Products', icon: <Package size={20} /> },
    { id: 'customers', name: 'Customers', icon: <Users size={20} /> },
    { id: 'orders', name: 'Orders', icon: <ShoppingCart size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <div style={styles.logo}>
          <Database size={22} color="var(--primary)" />
          <span style={styles.logoText}>ETHARA<span>.IO</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          style={styles.menuToggle}
          aria-label="Toggle Navigation Menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={styles.logo}>
          <Database size={24} color="var(--primary)" />
          <span style={styles.logoText}>ETHARA<span>.IO</span></span>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id}>
                <div
                  className={`sidebar-link ${currentView === item.id || (item.id === 'orders' && currentView === 'create-order') ? 'active' : ''}`}
                  onClick={() => navigateTo(item.id)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.systemStatus}>
            <div style={styles.statusDot}></div>
            <span>Backend Connected</span>
          </div>
          <div style={styles.versionInfo}>Production Build v1.0.0</div>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="main-content">
        {renderActiveView()}
      </main>

      {/* Toast Notification Mount */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2.5rem',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.05em',
    span: {
      color: 'var(--primary)',
    }
  },
  menuToggle: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarFooter: {
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-glass)',
    marginTop: 'auto',
  },
  systemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginBottom: '0.25rem',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    boxShadow: '0 0 10px var(--success)',
    animation: 'pulse-glow 2s infinite',
  },
  versionInfo: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
};
