import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { clearAuth } from '../store/authSlice';
import { clearCart } from '../store/cartSlice';

export default function Account() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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

  const detailStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(110px, 0.7fr) 1.3fr',
    gap: '16px',
    padding: '18px 0',
    borderBottom: '1px solid var(--border-dark)',
    fontSize: '0.78rem',
    letterSpacing: '0.08em'
  };

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'var(--bg-black)',
        color: 'var(--text-primary)',
        padding: '56px 24px 100px'
      }}
    >
      <section
        className="animate-hero-entry"
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          border: '1px solid var(--border-dark)',
          backgroundColor: 'var(--bg-card)',
          padding: 'clamp(24px, 6vw, 48px)'
        }}
      >
        <p
          style={{
            marginBottom: '12px',
            color: 'var(--text-muted)',
            fontSize: '0.65rem',
            letterSpacing: '0.22em'
          }}
        >
          GADGETGO / CUSTOMER
        </p>
        <h1
          style={{
            marginBottom: '10px',
            fontSize: '1.5rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
          }}
        >
          My Account
        </h1>
        <p
          style={{
            marginBottom: '34px',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            lineHeight: 1.7
          }}
        >
          You are signed in. Your account details are shown below.
        </p>

        <div style={{ borderTop: '1px solid var(--border-dark)' }}>
          <div style={detailStyle}>
            <span style={{ color: 'var(--text-muted)' }}>USERNAME</span>
            <span style={{ overflowWrap: 'anywhere' }}>{user.username}</span>
          </div>
          <div style={detailStyle}>
            <span style={{ color: 'var(--text-muted)' }}>EMAIL</span>
            <span style={{ overflowWrap: 'anywhere' }}>{user.email}</span>
          </div>
          <div style={{ ...detailStyle, borderBottom: 'none' }}>
            <span style={{ color: 'var(--text-muted)' }}>ACCOUNT TYPE</span>
            <span style={{ textTransform: 'uppercase' }}>{user.role || 'customer'}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-tech"
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: '28px',
            padding: '15px',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.2em',
            cursor: 'pointer'
          }}
        >
          LOG OUT
        </button>
      </section>
    </main>
  );
}