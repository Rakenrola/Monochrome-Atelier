import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  // Active Tab & Form States
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'create'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    staySignedIn: true
  
  
  });

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetError, setResetError] = useState('');

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeTab === 'create' && !formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    alert(
      activeTab === 'signin'
        ? `Signed in successfully as ${formData.email}`
        : `Account created successfully for ${formData.fullName}`
    );

    navigate('/');
  };

  // Forgot Password Submission Handler
  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetError('');
    setResetSubmitted(true);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-black)',
        minHeight: 'calc(100vh - 120px)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '60px 20px'
      }}
    >
      {/* Centered Auth Card Container */}
      <div
        className="animate-hero-entry"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-dark)',
          padding: '45px 36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          margin: '0 auto'
        }}
      >
        {/* Header Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            borderBottom: '1px solid var(--border-dark)',
            paddingBottom: '14px',
            marginBottom: '35px'
          }}
        >
          <button
            type="button"
            className="btn-tech"
            onClick={() => {
              setActiveTab('signin');
              setErrors({});
            }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              fontWeight: activeTab === 'signin' ? '700' : '400',
              cursor: 'pointer',
              padding: 0,
              borderBottom: activeTab === 'signin' ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            SIGN IN
          </button>

          <button
            type="button"
            className="btn-tech"
            onClick={() => {
              setActiveTab('create');
              setErrors({});
            }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              fontWeight: activeTab === 'create' ? '700' : '400',
              cursor: 'pointer',
              padding: 0,
              borderBottom: activeTab === 'create' ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTab === 'create' && (
            <div className="animate-elevate">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: errors.fullName ? '1px solid #ffffff' : '1px solid var(--border-dark)',
                  color: 'var(--text-primary)',
                  padding: '12px 0',
                  fontSize: '0.88rem',
                  outline: 'none',
                  letterSpacing: '0.05em'
                }}
              />
              {errors.fullName && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                  * {errors.fullName}
                </div>
              )}
            </div>
          )}

          {/* Email Field */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: errors.email ? '1px solid #ffffff' : '1px solid var(--border-dark)',
                color: 'var(--text-primary)',
                padding: '12px 0',
                fontSize: '0.88rem',
                outline: 'none',
                letterSpacing: '0.05em'
              }}
            />
            {errors.email && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                * {errors.email}
              </div>
            )}
          </div>

          {/* Password Field with Vector SVG Eye Toggle */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: errors.password ? '1px solid #ffffff' : '1px solid var(--border-dark)',
                color: 'var(--text-primary)',
                padding: '12px 35px 12px 0',
                fontSize: '0.88rem',
                outline: 'none',
                letterSpacing: '0.05em'
              }}
            />

            {/* Vector Eye Icon Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 0,
                top: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>

            {errors.password && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                * {errors.password}
              </div>
            )}
          </div>

          {/* Options Row: Right-aligned using margin-left: auto */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '5px'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={formData.staySignedIn}
                onChange={(e) => setFormData({ ...formData, staySignedIn: e.target.checked })}
                style={{ accentColor: 'var(--text-primary)', cursor: 'pointer' }}
              />
              Stay signed in
            </label>

            {activeTab === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(true);
                  setResetSubmitted(false);
                  setResetError('');
                }}
                style={{
                  marginLeft: 'auto', // Forces alignment to far right
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  textDecoration: 'underline',
                  fontSize: '0.72rem',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  padding: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                Forgot your password?
              </button>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn-tech"
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'var(--text-primary)',
              color: '#000000',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              textAlign: 'center',
              marginTop: '10px'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#cccccc')}
            onMouseOut={(e) => (e.target.style.backgroundColor = 'var(--text-primary)')}
          >
            {activeTab === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-dark)' }}></div>
            <span style={{ padding: '0 15px', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-dark)' }}></div>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="btn-tech"
            onClick={() => alert('Redirecting to Google Authentication...')}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-dark)',
              fontSize: '0.75rem',
              fontWeight: '600',
              letterSpacing: '0.12em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => (e.target.style.borderColor = 'var(--text-primary)')}
            onMouseOut={(e) => (e.target.style.borderColor = 'var(--border-dark)')}
          >
            <span style={{ fontWeight: 'bold' }}>G</span> CONTINUE WITH GOOGLE
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsForgotModalOpen(false)}>
          <div className="shipping-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.15em', fontWeight: '600' }}>RESET PASSWORD</h2>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            {resetSubmitted ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '15px', letterSpacing: '0.05em' }}>
                  RECOVERY LINK DISPATCHED
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '30px' }}>
                  We have sent instructions to <strong>{resetEmail}</strong> to reset your hardware account credentials.
                </p>
                <button
                  type="button"
                  className="btn-tech"
                  onClick={() => setIsForgotModalOpen(false)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'var(--text-primary)',
                    color: '#000000',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    cursor: 'pointer'
                  }}
                >
                  RETURN TO LOGIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6', letterSpacing: '0.05em' }}>
                  Enter your registered account email. We will send a secure password reset link to your inbox.
                </p>

                <div>
                  <input
                    type="email"
                    placeholder="Account Email Address"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: resetError ? '1px solid #ffffff' : '1px solid var(--border-dark)',
                      color: 'var(--text-primary)',
                      padding: '12px 0',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  {resetError && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase' }}>
                      * {resetError}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-tech"
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'var(--text-primary)',
                    color: '#000000',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    letterSpacing: '0.2em',
                    cursor: 'pointer',
                    marginTop: '15px'
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#cccccc')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = 'var(--text-primary)')}
                >
                  SEND RESET LINK
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}