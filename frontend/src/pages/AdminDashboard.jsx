import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { clearAuth } from '../store/authSlice';
import { clearCart } from '../store/cartSlice';

const panelStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-dark)'
};

function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('products');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/account" replace />;
  }

  const handleLogout = () => {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.removeItem('authToken');
      storage.removeItem('authUser');
    }

    dispatch(clearAuth());
    dispatch(clearCart());
    navigate('/login', { replace: true });
  };

  const tabStyle = (selected) => ({
    padding: '10px 15px',
    backgroundColor: selected ? 'var(--text-primary)' : 'transparent',
    color: selected ? 'var(--bg-black)' : 'var(--text-primary)',
    border: '1px solid var(--border-light)',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    cursor: 'pointer'
  });

  const sectionName = activeTab === 'products' ? 'PRODUCTS' : 'USERS';

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: '44px 20px 80px',
        backgroundColor: 'var(--bg-black)',
        color: 'var(--text-primary)'
      }}
    >
      <section
        className="animate-hero-entry"
        style={{ maxWidth: '1400px', margin: '0 auto' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '28px'
          }}
        >
          <div>
            <p
              style={{
                marginBottom: '10px',
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                letterSpacing: '0.22em'
              }}
            >
              GADGETGO / ADMINISTRATION
            </p>
            <h1
              style={{
                fontSize: '1.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase'
              }}
            >
              Admin Dashboard
            </h1>
          </div>

          <button
            type="button"
            className="btn-tech"
            onClick={handleLogout}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              fontSize: '0.68rem',
              fontWeight: '700',
              letterSpacing: '0.14em',
              cursor: 'pointer'
            }}
          >
            LOG OUT
          </button>
        </div>

        <div style={{ ...panelStyle, padding: '18px', marginBottom: '18px' }}>
          <div
            role="tablist"
            aria-label="Admin dashboard sections"
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
          >
            {[
              ['products', 'PRODUCTS'],
              ['users', 'USERS']
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={tabStyle(activeTab === tab)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section
          role="tabpanel"
          aria-label={`${sectionName} management`}
          style={{
            ...panelStyle,
            minHeight: '220px',
            display: 'grid',
            placeItems: 'center',
            padding: '32px'
          }}
        >
          <div style={{ maxWidth: '460px', textAlign: 'center' }}>
            <p
              style={{
                marginBottom: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                letterSpacing: '0.2em'
              }}
            >
              {sectionName} MANAGEMENT
            </p>
            <h2
              style={{
                marginBottom: '12px',
                fontSize: '1rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase'
              }}
            >
              Management tools unavailable
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                lineHeight: 1.7
              }}
            >
              {sectionName === 'PRODUCTS'
                ? 'Product records and editing controls are not available in this dashboard.'
                : 'User records and editing controls are not available in this dashboard.'}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default AdminDashboard;
