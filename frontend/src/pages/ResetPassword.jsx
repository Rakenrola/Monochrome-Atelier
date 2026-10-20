import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is invalid or incomplete. Request a new one.');
      return;
    }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError('Password must be at least 8 characters and no more than 72 bytes.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        password
      });
      setMessage(response.data.message || 'Your password has been reset.');
      setIsComplete(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to reset your password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        backgroundColor: 'var(--bg-black)',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px'
      }}
    >
      <section
        className="animate-hero-entry"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-dark)',
          padding: '45px 36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
        }}
      >
        <h1
          style={{
            fontSize: '1.1rem',
            letterSpacing: '0.15em',
            fontWeight: '600',
            borderBottom: '1px solid var(--border-dark)',
            paddingBottom: '18px',
            marginBottom: '28px'
          }}
        >
          SET A NEW PASSWORD
        </h1>

        {isComplete ? (
          <>
            <p role="status" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {message}
            </p>
            <Link
              to="/login"
              className="btn-tech"
              style={{
                display: 'block',
                marginTop: '28px',
                padding: '16px',
                backgroundColor: 'var(--text-primary)',
                color: '#000000',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.15em'
              }}
            >
              RETURN TO SIGN IN
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Choose a new password with at least 8 characters.
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NEW PASSWORD</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-dark)',
                  color: 'var(--text-primary)',
                  padding: '12px 0',
                  outline: 'none'
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CONFIRM PASSWORD</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-dark)',
                  color: 'var(--text-primary)',
                  padding: '12px 0',
                  outline: 'none'
                }}
              />
            </label>
            {error && (
              <p role="alert" style={{ color: 'var(--text-primary)', fontSize: '0.75rem', lineHeight: '1.5' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-tech"
              style={{
                width: '100%',
                padding: '16px',
                marginTop: '8px',
                backgroundColor: 'var(--text-primary)',
                color: '#000000',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.15em',
                cursor: isSubmitting ? 'wait' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
