import React, { useState, useEffect } from 'react';

function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if already seen in this session
      const hasSeenPopup = sessionStorage.getItem('newsletterSeen');
      if (!hasSeenPopup) {
        setIsVisible(true);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('newsletterSeen', 'true');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for subscribing!");
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="newsletter-popup-overlay">
      <div className="newsletter-popup">
        <button className="close-popup" onClick={handleClose}>&times;</button>
        <h3>Join Our Culinary Circle</h3>
        <p>Subscribe to receive exclusive offers, seasonal menu updates, and chef's secrets.</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Your email address" required />
          <button type="submit" className="btn-primary">Subscribe</button>
        </form>
      </div>
    </div>
  );
}

export default NewsletterPopup;