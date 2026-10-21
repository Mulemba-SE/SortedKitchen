import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function GoogleAuthCallback({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processAuth = () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const role = params.get('role');

      if (token) {
        onLogin(token);
        // Redirect based on role
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        // If no token, redirect back to login with error
        navigate('/login');
      }
    };

    processAuth();
  }, [location, navigate, onLogin]);

  return (
    <div className="auth-callback-loading">
      <div className="loading-spinner"></div>
      <p>Verifying your Google account...</p>
    </div>
  );
}

export default GoogleAuthCallback;