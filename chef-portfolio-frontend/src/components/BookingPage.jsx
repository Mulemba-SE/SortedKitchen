import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BookingForm from './BookingForm';

function BookingPage({ isAdmin = false, isLoggedIn = false, onLogout = () => {} }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const occasion = params.get('occasion') || '';
  const [activeNavItem, setActiveNavItem] = useState('booking');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const handleDocPointerDown = (event) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocPointerDown);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleDocPointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileNavLinkClick = (item) => {
    setActiveNavItem(item);
    setMobileNavOpen(false);
  };

  return (
    <section className="booking-page-wrapper">
      <div className="booking-top-container">
        <header className={`showcase-header ${isHeaderScrolled ? 'is-scrolled' : ''}`}>
          <div className="showcase-brand">
            <span className="showcase-brand-logo-wrap">
              <img src="/images/brand-logo.png" alt="Sorted Kitchen" className="showcase-brand-logo" />
            </span>
            <p>Sorted Kitchen</p>
          </div>
          <button
            type="button"
            className={`showcase-mobile-toggle ${mobileNavOpen ? 'active' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="showcase-header-actions">
            {!isLoggedIn && <a href="/login" className="showcase-btn">Log In</a>}
            {isLoggedIn && (
              <div className="showcase-account-menu" ref={accountMenuRef}>
                <button
                  type="button"
                  className="showcase-account-trigger"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-label="Account menu"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                >
                  <span className="showcase-account-indicator" aria-hidden="true">
                    <svg className="showcase-account-icon" viewBox="0 0 24 24" focusable="false">
                      <circle cx="12" cy="8" r="4"></circle>
                      <path d="M4.5 19.5a7.5 7.5 0 0 1 15 0"></path>
                    </svg>
                  </span>
                </button>
                {accountMenuOpen && (
                  <ul className="showcase-account-dropdown" role="menu" aria-label="Account options">
                    {isAdmin ? (
                      <li role="none">
                        <a href="/admin" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Admin Panel</a>
                      </li>
                    ) : (
                      <li role="none">
                        <button type="button" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Account Settings</button>
                      </li>
                    )}
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onLogout();
                          window.location.href = '/login';
                        }}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
            {isLoggedIn && <a href="/booking" className="showcase-btn">Book Now</a>}
          </div>
        </header>
        <div
          className={`showcase-mobile-overlay ${mobileNavOpen ? 'open' : ''}`}
          aria-hidden={!mobileNavOpen}
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="showcase-mobile-panel" onClick={(event) => event.stopPropagation()}>
            <div className="showcase-mobile-brand">
              <span className="showcase-mobile-brand-logo">
                <img src="/images/brand-logo.png" alt="Sorted Kitchen" />
              </span>
              <span className="showcase-mobile-brand-text">Sorted Kitchen</span>
            </div>
            <a href="/#home" onClick={() => handleMobileNavLinkClick('home')}>Home</a>
            <a href="/menu" onClick={() => handleMobileNavLinkClick('menus')}>Food</a>
            <a href="/gallery" onClick={() => handleMobileNavLinkClick('gallery')}>Gallery</a>
            <a href="/#services" onClick={() => handleMobileNavLinkClick('services')}>Services</a>
            <a href="/#about" onClick={() => handleMobileNavLinkClick('about')}>About</a>
            <a href="/#contact" onClick={() => handleMobileNavLinkClick('contact')}>Contact</a>
            <div className="showcase-mobile-actions">
              {!isLoggedIn && (
                <a
                  href="/login"
                  className="showcase-mobile-login"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Log In
                </a>
              )}
              {isLoggedIn && <a href="/booking" onClick={() => setMobileNavOpen(false)}>Book Now</a>}
              {(isAdmin || isLoggedIn) && (
                <div className="showcase-mobile-actions-row">
                  {isAdmin && (
                    <a
                      href="/admin"
                      className="showcase-mobile-admin"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      Admin Panel
                    </a>
                  )}
                  {isLoggedIn && (
                    <button
                      type="button"
                      className="showcase-mobile-logout"
                      onClick={() => {
                        setMobileNavOpen(false);
                        onLogout();
                        window.location.href = '/login';
                      }}
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="booking-page-banner">
          <div className="booking-page-banner-content">
            <h1>Book Your Experience</h1>
            <p>
              Tell us the occasion and we will craft the perfect experience for your guests.
            </p>
          </div>
        </div>
      </div>

      <BookingForm embedded defaultOccasion={occasion} />

      <div className="showcase-footer-curve" aria-hidden="true">
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none">
          <path d="M0,110 C240,0 480,0 720,0 C960,0 1200,0 1440,110 L1440,110 L0,110 Z" fill="#000000" />
        </svg>
      </div>
      <footer className="showcase-footer" id="contact">
        <div className="showcase-footer-content">
          <div className="showcase-footer-column">
            <h3>Let's do it together</h3>
            <a href="#careers">Careers</a>
            <a href="#partners">Sorted Kitchen for Partners</a>
            <a href="#couriers">Couriers</a>
            <a href="#business">Sorted Kitchen Business</a>
          </div>
          <div className="showcase-footer-column">
            <h3>Links of interest</h3>
            <a href="#about">About us</a>
            <a href="#faq">FAQ</a>
            <a href="#prime">Sorted Prime</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact us</a>
            <a href="#security">Security</a>
            <a href="#profile">Profile</a>
          </div>
          <div className="showcase-footer-column">
            <h3>Follow us</h3>
            <a href="#instagram">Instagram</a>
            <a href="#tiktok">TikTok</a>
            <a href="#facebook">Facebook</a>
            <a href="#youtube">Youtube</a>
          </div>
          <div className="showcase-footer-column showcase-footer-apps">
            <div className="showcase-footer-badges">
              <button type="button" className="showcase-footer-badge">Download on the App Store</button>
              <button type="button" className="showcase-footer-badge">Get it on Google Play</button>
            </div>
            <div className="showcase-footer-policies">
              <a href="#terms">Terms &amp; Conditions</a>
              <a href="#privacy">Privacy Policy</a>
              <a href="#cookies">Cookies Policy</a>
            </div>
          </div>
        </div>
        <div className="showcase-footer-bottom">
          <p>2026 Sorted Kitchen, All Rights Reserved</p>
        </div>
      </footer>
    </section>
  );
}

export default BookingPage;
