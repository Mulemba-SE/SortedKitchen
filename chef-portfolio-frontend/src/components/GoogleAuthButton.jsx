import React from 'react';

function GoogleAuthButton() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <a className="google-auth-link" href={`${apiUrl}/api/auth/google/start`}>
      Continue with Google
    </a>
  );
}

export default GoogleAuthButton;
