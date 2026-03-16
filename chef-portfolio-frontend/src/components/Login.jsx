import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error || 'Invalid credentials');
        return;
      }

      const data = await response.json();
      if (!data.token) {
        setError('Login failed');
        return;
      }

      onLogin(data.token);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Unable to reach the server');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="showcase-brand">
            <span className="showcase-brand-logo-wrap">
              <img src="/images/brand-logo.png" alt="Sorted Kitchen" className="showcase-brand-logo" />
            </span>
            <p>Sorted Kitchen</p>
          </div>
        </div>
        <h2>Login</h2>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="auth-actions">
          <button type="submit" className="btn-primary auth-submit-btn">Login</button>
          <button type="button" className="forgot-password auth-ghost-btn">Forgot password?</button>
        </div>
        <p className="auth-switch">
          No account? <Link to="/signup">Create one</Link>
        </p>
        <a href="/" className="auth-home-link">Back to Home</a>
      </form>
    </div>
  );
}

export default Login;
