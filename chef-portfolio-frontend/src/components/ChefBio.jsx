import React, { useEffect, useRef, useState } from 'react';

function ChefBio({ isAdmin = false, isLoggedIn = false, onLogout = () => {} }) {
  const [activeNavItem, setActiveNavItem] = useState('about');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      if (event.key === 'Escape') setAccountMenuOpen(false);
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

  const handleNavLinkClick = (key) => {
    setActiveNavItem(key);
    setMobileNavOpen(false);
  };

  const timelineEvents = [
    {
      year: '2010',
      title: 'Culinary School',
      description: 'Graduated with honors from Le Cordon Bleu, mastering the fundamentals of French cuisine.'
    },
    {
      year: '2012',
      title: 'Sous Chef at Le Petit Bistro',
      description: 'Honed skills in a fast-paced environment, managing kitchen staff and menu creation.'
    },
    {
      year: '2015',
      title: 'Executive Chef at The Golden Spoon',
      description: 'Led the team to earn the restaurant\'s first Michelin star.'
    },
    {
      year: '2018',
      title: 'Global Culinary Tour',
      description: 'Traveled through Asia and South America to study diverse flavor profiles and techniques.'
    },
    {
      year: '2020',
      title: 'Founded Chef Booking',
      description: 'Launched a private dining experience to bring restaurant-quality food to intimate settings.'
    }
  ];

  return (
    <div className="bio-page-wrapper">
      <section className="bio-top-container">
        <header className="showcase-header">
          <div className="showcase-brand">
            <span className="showcase-brand-logo-wrap">
              <img src="/images/brand-logo-256.png" alt="Sorted Kitchen" className="showcase-brand-logo" />
            </span>
            <p>Sorted Kitchen</p>
          </div>
          <nav className="showcase-nav">
            <a href="/#home" className={activeNavItem === 'home' ? 'active' : ''} onClick={() => handleNavLinkClick('home')}>
              <span className="showcase-nav-icon" aria-hidden="true">&#8962;</span>
              <span className="showcase-nav-label">Home</span>
            </a>
            <div className="showcase-nav-dropdown">
              <a href="/menu" className={`showcase-nav-trigger ${activeNavItem === 'menus' ? 'active' : ''}`} onClick={() => handleNavLinkClick('menus')}>
                <span className="showcase-nav-icon" aria-hidden="true">&#9776;</span>
                <span className="showcase-nav-label">Menus</span>
              </a>
              <ul className="showcase-nav-dropdown-menu" aria-label="Menu categories">
                <li><a href="/menu?category=breakfast"><span className="showcase-nav-label">Breakfast</span></a></li>
                <li><a href="/menu?category=main"><span className="showcase-nav-label">Lunch</span></a></li>
                <li><a href="/menu?category=main"><span className="showcase-nav-label">Dinner</span></a></li>
                <li><a href="/menu?category=snacks"><span className="showcase-nav-label">Snacks</span></a></li>
                <li><a href="/menu?category=salad"><span className="showcase-nav-label">Salad</span></a></li>
              </ul>
            </div>
            <a href="/gallery" className={activeNavItem === 'gallery' ? 'active' : ''} onClick={() => handleNavLinkClick('gallery')}>
              <span className="showcase-nav-icon" aria-hidden="true">&#9635;</span>
              <span className="showcase-nav-label">Gallery</span>
            </a>
            <a href="/#services" className={activeNavItem === 'services' ? 'active' : ''} onClick={() => handleNavLinkClick('services')}>
              <span className="showcase-nav-icon" aria-hidden="true">&#10022;</span>
              <span className="showcase-nav-label">Services</span>
            </a>
            <a href="/bio" className={activeNavItem === 'about' ? 'active' : ''} onClick={() => handleNavLinkClick('about')}>
              <span className="showcase-nav-icon" aria-hidden="true">i</span>
              <span className="showcase-nav-label">About</span>
            </a>
            <a href="#contact" className={activeNavItem === 'contact' ? 'active' : ''} onClick={() => handleNavLinkClick('contact')}>
              <span className="showcase-nav-icon" aria-hidden="true">&#9993;</span>
              <span className="showcase-nav-label">Contact</span>
            </a>
          </nav>
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
                <img src="/images/brand-logo-256.png" alt="Sorted Kitchen" />
              </span>
              <span className="showcase-mobile-brand-text">Sorted Kitchen</span>
            </div>
            <a href="/#home" onClick={() => handleNavLinkClick('home')}>Home</a>
            <a href="/menu" onClick={() => handleNavLinkClick('menus')}>Food</a>
            <a href="/gallery" onClick={() => handleNavLinkClick('gallery')}>Gallery</a>
            <a href="/#services" onClick={() => handleNavLinkClick('services')}>Services</a>
            <a href="/bio" onClick={() => handleNavLinkClick('about')}>About</a>
            <a href="#contact" onClick={() => handleNavLinkClick('contact')}>Contact</a>
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

        <div className="bio-hero">
          
          <h1>The Chef's Journey</h1>
          <p className="bio-subtitle">A timeline of passion, discipline, and unforgettable dining experiences.</p>
        </div>
      </section>

      <section className="bio-content-shell">
        <div className="bio-intro-grid">
          <div className="bio-intro-media">
            <img src="/images/capture-900.jpg" alt="Chef portrait" loading="lazy" decoding="async" />
          </div>
          <div className="bio-intro-copy">
            <h2>Craft, Hospitality, and Flavor</h2>
            <p>
              Chef Evans blends classical technique with bold, modern taste. Every menu is designed around seasonal ingredients,
              guest preferences, and a service style that feels warm, polished, and personal.
            </p>
            <p>
              From intimate dinners to multi-course celebrations, the goal is always the same: memorable food and a seamless,
              stress-free experience for every guest at the table.
            </p>
            <div className="bio-quick-stats" aria-label="Chef highlights">
              <div className="bio-stat">
                <span className="bio-stat-value">15+</span>
                <span className="bio-stat-label">Years Experience</span>
              </div>
              <div className="bio-stat">
                <span className="bio-stat-value">300+</span>
                <span className="bio-stat-label">Private Events</span>
              </div>
              <div className="bio-stat">
                <span className="bio-stat-value">50+</span>
                <span className="bio-stat-label">Signature Menus</span>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-container">
          <h2 className="timeline-title">Career Timeline</h2>
          <div className="timeline">
            {timelineEvents.map((event, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-year">{event.year}</span>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="showcase-footer" id="contact">
        <div className="showcase-footer-top">
          <div className="showcase-footer-col">
            <h3>Contact Us</h3>
            <p>T. +1 234 056 7899</p>
            <p>M. sortedkitchen@example.com</p>
          </div>
          <div className="showcase-footer-col">
            <h3>Address</h3>
            <p>Riverside Drive, Nairobi</p>
            <p>00100 . Kenya</p>
          </div>
          <div className="showcase-footer-col">
            <h3>Opening Hours</h3>
            <p>Everyday : From 12.30 To 23.00</p>
            <p>Kitchen Closes At 22.00</p>
          </div>
        </div>

        <div className="showcase-footer-mid">
          <span className="showcase-footer-line" aria-hidden="true"></span>
          <div className="showcase-footer-brand">
            <span>Sorted Kitchen</span>
          </div>
          <span className="showcase-footer-line" aria-hidden="true"></span>
        </div>

        <div className="showcase-footer-bottom">
          <div className="showcase-footer-socials">
            <a href="#contact">TikTok</a>
            <span aria-hidden="true">&#9674;</span>
            <a href="#contact">Facebook</a>
            <span aria-hidden="true">&#9674;</span>
            <a href="#contact">Instagram</a>
          </div>
          <p>&copy; 2026 Sorted Kitchen, All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default ChefBio;
