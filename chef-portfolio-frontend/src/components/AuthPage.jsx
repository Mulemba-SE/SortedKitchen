import { createElement, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { getTokenRole } from '../utils/authStorage';
import './auth.css';

const COPY = {
  login: {
    title: 'Welcome Back!',
    subtitle: 'Sign in to your account to continue',
    submit: 'Sign In',
    submitting: 'Signing in...',
    googleText: 'signin_with',
    switchText: "Don't have an account?",
    switchLabel: 'Create one',
    switchTo: '/signup',
    endpoint: '/api/auth/login'
  },
  signup: {
    title: 'Create Your Account',
    subtitle: 'Sign up to start booking with Sorted Kitchen',
    submit: 'Create Account',
    submitting: 'Creating account...',
    googleText: 'signup_with',
    switchText: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: '/login',
    endpoint: '/api/auth/signup'
  }
};

function Field({ id, label, icon: Icon, trailing, ...inputProps }) {
  return (
    <div className="sk-auth__field">
      <label htmlFor={id}>{label}</label>
      <div className="sk-auth__control">
        {createElement(Icon, { className: 'sk-auth__icon', size: 20, 'aria-hidden': true })}
        <input id={id} className={trailing ? 'has-trailing' : undefined} {...inputProps} />
        {trailing}
      </div>
    </div>
  );
}

function PasswordField({ id, label, autoComplete, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      id={id}
      label={label}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required
      trailing={(
        <button
          type="button"
          className="sk-auth__eye"
          onClick={() => setVisible((previous) => !previous)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
        </button>
      )}
    />
  );
}

function AuthPage({ mode = 'login', onLogin }) {
  const copy = COPY[mode] || COPY.login;
  const isSignup = mode === 'signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Google's button needs a pixel width, so match it to the card.
  const googleWrapRef = useRef(null);
  const [googleWidth, setGoogleWidth] = useState(340);
  useEffect(() => {
    const element = googleWrapRef.current;
    if (!element) return undefined;
    const update = () => {
      const width = Math.floor(element.clientWidth);
      if (width > 0) setGoogleWidth(Math.min(400, Math.max(200, width)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const finishAuth = (data, rememberMe) => {
    onLogin(data.token, rememberMe);
    const role = data.user?.role || getTokenRole(data.token);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  const postJson = async (path, body) => {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (isSignup) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const body = isSignup ? { name, email, password } : { email, password };
      const { ok, data } = await postJson(copy.endpoint, body);
      if (!ok || !data.token) {
        setError(data.error || (isSignup ? 'Signup failed' : 'Invalid credentials'));
        return;
      }
      finishAuth(data, isSignup ? true : remember);
    } catch {
      setError('Unable to reach the server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setNotice('');
    try {
      const { ok, data } = await postJson('/api/auth/google', {
        credential: credentialResponse.credential
      });
      if (!ok || !data.token) {
        setError(data.error || 'Google sign-in failed');
        return;
      }
      finishAuth(data, true);
    } catch {
      setError('Unable to reach the server for Google sign-in');
    }
  };

  return (
    <main className="sk-auth">
      <div className="sk-auth__card">
        <div className="sk-auth__brand">
          <span className="sk-auth__logo">
            <img src="/images/brand-logo-256.png" alt="" />
          </span>
          <span className="sk-auth__brand-name">Sorted Kitchen</span>
        </div>

        <h1 className="sk-auth__title">{copy.title}</h1>
        <p className="sk-auth__subtitle">{copy.subtitle}</p>

        <div className="sk-auth__tabs" role="tablist" aria-label="Account">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={!isSignup ? 'is-active' : undefined}
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={isSignup ? 'is-active' : undefined}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="sk-auth__form" onSubmit={handleSubmit}>
          {isSignup && (
            <Field
              id="auth-name"
              label="Full Name"
              icon={User}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          )}

          <Field
            id="auth-email"
            label="Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
          />

          <PasswordField
            id="auth-password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {isSignup && (
            <PasswordField
              id="auth-confirm"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          )}

          {!isSignup && (
            <div className="sk-auth__row">
              <label className="sk-auth__remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link className="sk-auth__link" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
          )}

          {error && <p className="sk-auth__message is-error" role="alert">{error}</p>}
          {notice && <p className="sk-auth__message is-info" role="status">{notice}</p>}

          <button type="submit" className="sk-auth__submit" disabled={isSubmitting}>
            {isSubmitting ? copy.submitting : copy.submit}
          </button>
        </form>

        <div className="sk-auth__divider"><span>or</span></div>

        <div className="sk-auth__google" ref={googleWrapRef}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In was unsuccessful')}
            theme="outline"
            size="large"
            shape="pill"
            text={copy.googleText}
            logo_alignment="center"
            width={googleWidth}
          />
        </div>

        <p className="sk-auth__switch">
          {copy.switchText} <Link to={copy.switchTo}>{copy.switchLabel}</Link>
        </p>
      </div>
    </main>
  );
}

export default AuthPage;
