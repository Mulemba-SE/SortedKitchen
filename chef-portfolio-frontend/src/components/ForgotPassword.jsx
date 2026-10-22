import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import './auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not request a password reset. Please try again.');
        return;
      }
      setMessage(data.message || 'If an account with that email exists, a password reset link will be sent.');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="sk-auth">
      <section className="sk-auth__card" aria-labelledby="forgot-password-title">
        <div className="sk-auth__brand">
          <span className="sk-auth__logo"><img src="/images/brand-logo-256.png" alt="" /></span>
          <span className="sk-auth__brand-name">Sorted Kitchen</span>
        </div>
        <h1 id="forgot-password-title" className="sk-auth__title">Forgot your password?</h1>
        <p className="sk-auth__subtitle">Enter the email address on your account and we’ll send you a reset link.</p>
        <form className="sk-auth__form" onSubmit={handleSubmit}>
          <div className="sk-auth__field">
            <label htmlFor="forgot-password-email">Email</label>
            <div className="sk-auth__control">
              <Mail className="sk-auth__icon" size={20} aria-hidden="true" />
              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>
          </div>
          {error && <p className="sk-auth__message is-error" role="alert">{error}</p>}
          {message && <p className="sk-auth__message is-info" role="status">{message}</p>}
          <button type="submit" className="sk-auth__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="sk-auth__switch"><Link to="/login">Back to sign in</Link></p>
      </section>
    </main>
  );
}

export default ForgotPassword;
