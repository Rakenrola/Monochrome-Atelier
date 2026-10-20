import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive Screen Check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Read live cart badge count
  const cartItems = useSelector((state) => state.cart?.items || []);
  const user = useSelector((state) => state.auth?.user);
  const isAdmin = user?.role === 'admin';
  const totalCartCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  return (
    <header
      style={{
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-dark)',
        position: 'sticky',
        top: 0,
        zIndex: 999
      }}
    >
      {/* Top Shipping Announcement Bar */}
      <div
        style={{
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          textAlign: 'center',
          padding: '6px 12px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER $200 &gt;
      </div>

      {/* Main Bar: Grid layout on Desktop (1fr auto 1fr), Flexbox layout on Mobile */}
      <nav
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : '1fr auto 1fr',
          justifyContent: isMobile ? 'space-between' : 'normal',
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '16px 24px',
          width: '100%'
        }}
      >
        {/* 1. LEFT SECTION: LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
          >
            <span
              style={{
                fontSize: isMobile ? '1.05rem' : '1.2rem',
                letterSpacing: '0.24em',
                fontWeight: '800',
                color: 'var(--text-primary)',
                lineHeight: '1'
              }}
            >
              GADGETGO
            </span>
            <span
              style={{
                fontSize: '0.5rem',
                letterSpacing: '0.3em',
                color: 'var(--text-muted)',
                marginTop: '3px',
                textTransform: 'uppercase'
              }}
            >
              MONOCHROME ATELIER
            </span>
          </Link>
        </div>

        {/* 2. CENTER SECTION: DESKTOP CATEGORY LINKS */}
        {!isMobile && !isAdmin && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px'
            }}
          >
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              STORE
            </Link>
            <a
              href="#catalog"
              className={`nav-link ${location.hash === '#catalog' ? 'active' : ''}`}
            >
              HARDWARE
            </a>
            <span className="nav-link" style={{ opacity: 0.35, cursor: 'not-allowed' }}>
              APPAREL
            </span>
            <span className="nav-link" style={{ opacity: 0.35, cursor: 'not-allowed' }}>
              ATELIER
            </span>
          </div>
        )}

        {/* 3. RIGHT SECTION: ACCOUNT, CART & 3-LINE HAMBURGER (Pinned Right) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: isMobile ? '14px' : '22px'
          }}
        >
          {user && (
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? '80px' : '140px', // Truncates with "..." if username is too long
                display: 'inline-block'
              }}
              title={`Signed in as ${user.username}`}
            >
              HI, {user.username}
            </span>
          )}
          <Link
            to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'}
            className={`nav-link ${
              (user &&
                location.pathname ===
                  (user.role === 'admin' ? '/admin' : '/account')) ||
              (!user && location.pathname === '/login')
                ? 'active'
                : ''
            }`}
            style={{ fontSize: '0.72rem' }}
          >
            {user?.role === 'admin' ? 'ADMIN' : user ? 'ACCOUNT' : 'SIGN IN'}
          </Link>

          {!isAdmin && (
            <Link
              to="/cart"
              className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem' }}
            >
              CART
              <span
                key={totalCartCount}
                className={`cart-count-badge ${totalCartCount > 0 ? 'has-items' : ''}`}
              >
                {totalCartCount}
              </span>
            </Link>
          )}

          {/* 3-LINE HAMBURGER TOGGLE (Mobile Only) */}
          {isMobile && !isAdmin && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0 4px 6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ width: '20px', height: '2px', backgroundColor: 'var(--text-primary)', transition: 'all 0.3s' }}></span>
              <span style={{ width: '20px', height: '2px', backgroundColor: 'var(--text-primary)', transition: 'all 0.3s' }}></span>
              <span style={{ width: '20px', height: '2px', backgroundColor: 'var(--text-primary)', transition: 'all 0.3s' }}></span>
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE COLLAPSIBLE DRAWER */}
      {isMobile && !isAdmin && mobileMenuOpen && (
        <div
          className="animate-elevate"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-dark)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              letterSpacing: '0.2em',
              fontWeight: '600'
            }}
          >
            STORE
          </Link>
          <a
            href="#catalog"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              letterSpacing: '0.2em'
            }}
          >
            HARDWARE
          </a>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.2em', opacity: 0.35 }}>
            APPAREL
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.2em', opacity: 0.35 }}>
            ATELIER
          </span>
        </div>
      )}
    </header>
  );
}