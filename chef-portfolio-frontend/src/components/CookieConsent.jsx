import React, { useState, useEffect } from 'react';

function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner">
      <p>We use cookies to enhance your dining experience. By continuing to visit this site you agree to our use of cookies.</p>
      <button className="btn-primary small" onClick={handleAccept}>Accept</button>
    </div>
  );
}

export default CookieConsent;