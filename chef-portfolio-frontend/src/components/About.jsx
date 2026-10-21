import React, { useEffect, useState } from 'react';

function About({ isLoggedIn = false }) {
  const [bio, setBio] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${apiUrl}/api/bio`)
      .then(res => res.json())
      .then(data => setBio(data?.content || ''))
      .catch(err => console.error('Error loading bio:', err));
  }, []);

  return (
    <section className="about" id="about-intro">
      <div className="about-text">
        <h2>Elevate your dinner party!</h2>
        <p>
          {bio || 'As your personal chef for the evening, I will curate a delicious menu for single or multi day events for 2 to 50 guests. Each meal is customized to your unique preferences and prepared in the comfort of your home. Sorted Kitchen will work with you to create a unique menu that is sure to satisfy your guests palates. To ensure our clients experience an unforgettable evening, I may employ a sous chef as well as servers for your event. Optional add-on services are available.'}
        </p>
        {isLoggedIn && (
          <div className="about-cta-wrap">
            <a className="btn-primary about-cta" href="/booking">Book Now</a>
          </div>
        )}
      </div>
      <div className="about-media">
        <div className="about-image">
          <img
            src="/images/capture-900.jpg"
            alt="Private dining setup"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="about-social">
          <a href="#" aria-label="Facebook" className="social-icon social-icon-facebook">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v5h3v-5h3l1-3h-4V9c0-.6.4-1 1-1z" />
            </svg>
          </a>
          <a href="#" aria-label="X" className="social-icon social-icon-x">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path d="M18.9 4h-2.7l-4 4.6L8.5 4H3.9l6 7.8L3.5 20h2.7l4.9-5.6 4.3 5.6h4.6l-6.3-8.2L18.9 4z" />
            </svg>
          </a>
          <a href="#" aria-label="YouTube" className="social-icon social-icon-youtube">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path d="M22 8.5a3 3 0 0 0-2.1-2.1C18.3 6 12 6 12 6s-6.3 0-7.9.4A3 3 0 0 0 2 8.5 31 31 0 0 0 2 12a31 31 0 0 0 .1 3.5 3 3 0 0 0 2.1 2.1c1.6.4 7.9.4 7.9.4s6.3 0 7.9-.4a3 3 0 0 0 2.1-2.1c.2-1.1.1-3.5.1-3.5s0-2.4-.1-3.5zM10 15V9l5 3-5 3z" />
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="social-icon social-icon-instagram">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <rect x="4" y="4" width="16" height="16" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17" cy="7" r="1" />
            </svg>
          </a>
          <a href="#" aria-label="TikTok" className="social-icon social-icon-tiktok">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path d="M14 4c.7 1.9 2.1 3.1 4 3.3V10c-1.6-.1-3-0.7-4-1.6V15a5 5 0 1 1-4-4.9v2.7a2.5 2.5 0 1 0 2 2.4V4h2z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

export default About;
