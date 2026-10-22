import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import './auth.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  const [tokenState, setTokenState] = useState(resetToken ? 'checking' : 'invalid');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const controller = new AbortController();
    if (!resetToken) {
      return () => controller.abort();
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/auth/reset-password/${encodeURIComponent(resetToken)}`, {
          signal: controller.signal
        });
        setTokenState(response.ok ? 'valid' : 'invalid');
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not validate the reset link. Check your connection and try again.');
          setTokenState('unavailable');
        }
      }
    };
    validateToken();
    return () => controller.abort();
  }, [apiUrl, resetToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password/${encodeURIComponent(resetToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not reset your password. Request a new reset link and try again.');
        if (response.status === 400) setTokenState('invalid');
        return;
      }
      setSuccess(data.message || 'Password reset successfully. You can now sign in.');
      setTokenState('used');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="sk-auth">
      <section className="sk-auth__card" aria-labelledby="reset-password-title">
        <div className="sk-auth__brand">
          <span className="sk-auth__logo"><img src="/images/brand-logo-256.png" alt="" /></span>
          <span className="sk-auth__brand-name">Sorted Kitchen</span>
        </div>
        <h1 id="reset-password-title" className="sk-auth__title">Reset your password</h1>
        {tokenState === 'checking' ? (
          <p className="sk-auth__subtitle" role="status">Checking your reset link...</p>
        ) : tokenState === 'invalid' ? (
          <>
            <p className="sk-auth__message is-error" role="alert">This reset link is invalid, expired, or already used.</p>
            <p className="sk-auth__switch"><Link to="/forgot-password">Request a new reset link</Link></p>
          </>
        ) : tokenState === 'unavailable' ? (
          <>
            <p className="sk-auth__message is-error" role="alert">{error}</p>
            <p className="sk-auth__switch"><Link to="/forgot-password">Request a new reset link</Link></p>
          </>
        ) : tokenState === 'used' ? (
          <>
            <p className="sk-auth__message is-info" role="status">{success}</p>
            <p className="sk-auth__switch"><Link to="/login">Continue to sign in</Link></p>
          </>
        ) : (
          <>
            <p className="sk-auth__subtitle">Choose a new password for your account.</p>
            <form className="sk-auth__form" onSubmit={handleSubmit}>
              <div className="sk-auth__field">
                <label htmlFor="reset-password">New password</label>
                <div className="sk-auth__control">
                  <Lock className="sk-auth__icon" size={20} aria-hidden="true" />
                  <input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
              </div>
              <div className="sk-auth__field">
                <label htmlFor="reset-password-confirm">Confirm new password</label>
                <div className="sk-auth__control">
                  <Lock className="sk-auth__icon" size={20} aria-hidden="true" />
                  <input
                    id="reset-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
              </div>
              {error && <p className="sk-auth__message is-error" role="alert">{error}</p>}
              <button type="submit" className="sk-auth__submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save new password'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
