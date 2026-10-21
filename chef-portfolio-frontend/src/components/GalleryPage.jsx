import React, { useEffect, useRef, useState } from 'react';

function GalleryPage({ isAdmin = false, isLoggedIn = false, onLogout = () => {} }) {
  const [meals, setMeals] = useState([]);
  const [activeNavItem, setActiveNavItem] = useState('gallery');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [mealsError, setMealsError] = useState('');
  const [socialPreviews, setSocialPreviews] = useState({});
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isGalleryDropdownOpen, setIsGalleryDropdownOpen] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const accountMenuRef = useRef(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/meals`)
      .then((res) => res.json())
      .then((data) => {
        setMeals(Array.isArray(data) ? data : []);
        setMealsError('');
      })
      .catch((err) => {
        console.error('Error loading meals:', err);
        setMealsError('Unable to load meals right now.');
      })
      .finally(() => setIsLoadingMeals(false));
  }, [apiUrl]);

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

  const transformCloudinary = (url) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/f_auto,q_auto:eco,w_700/');
    }
    return url;
  };

  const hasSocialUrl = (meal) => typeof meal?.socialUrl === 'string' && meal.socialUrl.trim().length > 0;
  const galleryMeals = meals.filter((meal) => !hasSocialUrl(meal));

  const dishes = galleryMeals.map((meal) => ({
    id: meal._id,
    name: meal.title,
    description: meal.description,
    imageUrl: transformCloudinary(meal.imageUrl),
  }));
  const isGalleryEmpty = !isLoadingMeals && !mealsError && dishes.length === 0;
  const showAdminEmptyMessage = isGalleryEmpty && isAdmin;
  const showGuestPlaceholders = isGalleryEmpty && !isAdmin;

  const getExcerpt = (text) => {
    if (!text) return 'No description is available for this dish yet.';
    if (text.length <= 180) return text;
    return `${text.slice(0, 180).trim()}...`;
  };

  const getSocialPlatform = (url) => {
    if (!url) return 'Social';
    const lower = url.toLowerCase();
    if (lower.includes('tiktok.com')) return 'TikTok';
    if (lower.includes('instagram.com')) return 'Instagram';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
    return 'Social';
  };

  const socialVideos = meals
    .filter((meal) => {
      if (!hasSocialUrl(meal)) return false;
      const lower = meal.socialUrl.toLowerCase();
      return (
        lower.includes('tiktok.com') ||
        lower.includes('instagram.com') ||
        lower.includes('youtube.com') ||
        lower.includes('youtu.be')
      );
    })
    .map((meal) => ({
      id: meal._id,
      title: meal.title || 'Social highlight',
      url: meal.socialUrl,
      thumbnail: transformCloudinary(meal.imageUrl),
      platform: getSocialPlatform(meal.socialUrl),
    }));
  const isSocialVideosEmpty = !isLoadingMeals && !mealsError && socialVideos.length === 0;
  const showAdminSocialEmptyMessage = isSocialVideosEmpty && isAdmin;
  const showGuestSocialPlaceholders = isSocialVideosEmpty && !isAdmin;

  useEffect(() => {
    if (socialVideos.length === 0) return;

    let isActive = true;
    const fetchPreviews = async () => {
      const updates = {};
      await Promise.allSettled(
        socialVideos.map(async (video) => {
          if (!video.url) return;
          if (Object.prototype.hasOwnProperty.call(socialPreviews, video.url)) return;
          try {
            const response = await fetch(
              `${apiUrl}/api/social-preview?url=${encodeURIComponent(video.url)}`
            );
            if (!response.ok) {
              updates[video.url] = { error: true };
              return;
            }
            const data = await response.json();
            updates[video.url] = data;
          } catch (err) {
            console.warn('Social preview fetch failed:', err);
            updates[video.url] = { error: true };
          }
        })
      );

      if (!isActive || Object.keys(updates).length === 0) return;
      setSocialPreviews((prev) => ({ ...prev, ...updates }));
    };

    fetchPreviews();

    return () => {
      isActive = false;
    };
  }, [apiUrl, socialVideos, socialPreviews]);

  return (
    <section className="gallery-page-wrapper">
      <div className="gallery-top-container">
        <header className={`showcase-header ${isHeaderScrolled ? 'is-scrolled' : ''}`}>
          <div className="showcase-brand">
            <span className="showcase-brand-logo-wrap">
              <img src="/images/brand-logo-256.png" alt="Sorted Kitchen" className="showcase-brand-logo" />
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
                <img src="/images/brand-logo-256.png" alt="Sorted Kitchen" />
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

        <div className="gallery-header-links">
          <div className="gallery-hero-breadcrumbs" aria-label="Breadcrumb">
            <span className="gallery-hero-breadcrumb-prefix">
              <a href="/" className="gallery-hero-breadcrumb-link">Home</a>
              <span className="gallery-hero-breadcrumb-sep" aria-hidden="true">{'>'}</span>
            </span>
            <span className="gallery-hero-breadcrumb-group">
              <span className="gallery-hero-breadcrumb-current">Gallery</span>
              <button
                type="button"
                className="gallery-hero-breadcrumb-toggle"
                aria-label="Toggle Videos link"
                aria-expanded={isGalleryDropdownOpen}
                aria-controls="gallery-breadcrumb-videos"
                onClick={() => setIsGalleryDropdownOpen((prev) => !prev)}
              >
                <svg className="gallery-hero-breadcrumb-toggle-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </span>
            {isGalleryDropdownOpen && (
              <span className="gallery-hero-breadcrumb-dropdown" id="gallery-breadcrumb-videos">
                <a
                  href="#gallery-tiktok-section"
                  className="gallery-hero-breadcrumb-link"
                >
                  Videos
                </a>
              </span>
            )}
          </div>
        </div>

        <div className="gallery-page-banner">
          <div className="gallery-page-banner-content">
            <div className="gallery-hero-layout">
              <div className="gallery-hero-copy">
                <div className="gallery-hero-copy-text">
                <h1>Culinary Gallery</h1>
                <div className="gallery-hero-copy-image">
                  <img
                    src="/images/image2-900.jpg"
                    alt="Chef-crafted dishes"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p>
                  A visual journey through chef-crafted dishes, seasonal specials,
                  and the moments that make Sorted Kitchen unforgettable.
                  Explore the artistry behind every plate — from vibrant seasonal ingredients to carefully prepared signature dishes. 
                  Our gallery captures the passion, creativity, and attention to detail that define the Sorted Kitchen experience, highlighting the flavors, textures, and presentations that turn every meal into a memorable occasion.
                </p>
                </div>
                <div className="gallery-hero-visual">
                  <div className="gallery-hero-visual-tilt">
                    <img
                      src="/images/image2-900.jpg"
                      alt="Chef-crafted dishes"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mealsError && <p className="helper-text error">{mealsError}</p>}
      {showAdminEmptyMessage && (
        <p className="helper-text gallery-empty-state">
          No gallery dishes yet. Add a dish without a social URL to show it here.
        </p>
      )}

      <section className="gallery-portfolio-section" aria-label="Gallery portfolio">
        <h2 className="gallery-page-grid-title">Portfolio</h2>
        <div className="gallery-page-grid">
          {dishes.map((dish) => (
            <article key={dish.id} className="gallery-page-card">
              {dish.imageUrl ? (
                <img src={dish.imageUrl} alt={dish.name} loading="lazy" decoding="async" />
              ) : (
                <div
                  className="gallery-page-placeholder"
                  role="img"
                  aria-label={`Image placeholder for ${dish.name}`}
                ></div>
              )}
              <div className="gallery-page-caption">
                <span className="gallery-page-title">{dish.name}</span>
                <p className="gallery-page-excerpt">{getExcerpt(dish.description)}</p>
              </div>
            </article>
          ))}
          {showGuestPlaceholders &&
            Array.from({ length: 6 }).map((_, index) => (
              <article
                key={`gallery-empty-template-${index}`}
                className="gallery-page-card gallery-page-card-faded"
                aria-hidden="true"
              >
                <div className="gallery-page-placeholder"></div>
                <div className="gallery-page-caption">
                  <div className="gallery-page-skeleton-title"></div>
                  <div className="gallery-page-skeleton-line"></div>
                  <div className="gallery-page-skeleton-line gallery-page-skeleton-line-short"></div>
                </div>
              </article>
            ))}
        </div>
      </section>

      <div className="gallery-wave-stack" aria-hidden="true">
        <div className="gallery-wave-icon" aria-hidden="true">
          <img src="/images/brand-logo-256.png" alt="" className="gallery-wave-icon-img" loading="lazy" decoding="async" />
        </div>
        <div className="gallery-wave-divider">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,42 Q240,92 480,100 T960,80 T1440,104 V120 H0 Z"></path>
          </svg>
        </div>
      </div>

      <section
        className="gallery-tiktok-section"
        id="gallery-tiktok-section"
        aria-label="TikTok videos"
      >
        <h2 className="gallery-tiktok-grid-title">The Art of Cooking</h2>
        <div className="gallery-tiktok-grid">
          {socialVideos.map((video) => {
            const preview = socialPreviews[video.url];
            const thumbnail = preview?.thumbnail_url || video.thumbnail;
            return (
              <a
                key={video.id}
                className="gallery-tiktok-card"
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${video.platform} video`}
              >
                <div className="gallery-tiktok-thumb">
                  {thumbnail ? (
                    <img src={thumbnail} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className="gallery-tiktok-placeholder" role="img" aria-label={`${video.platform} video`}></div>
                  )}
                  <span className="gallery-tiktok-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <polygon points="7,5 19,12 7,19"></polygon>
                    </svg>
                  </span>
                </div>
              </a>
            );
          })}
          {showGuestSocialPlaceholders &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`gallery-social-template-${index}`}
                className="gallery-tiktok-card gallery-tiktok-card-faded"
                aria-hidden="true"
              >
                <div className="gallery-tiktok-thumb">
                  <div className="gallery-tiktok-placeholder"></div>
                </div>
                <div className="gallery-tiktok-skeleton-lines">
                  <div className="gallery-tiktok-skeleton-line"></div>
                  <div className="gallery-tiktok-skeleton-line gallery-tiktok-skeleton-line-short"></div>
                </div>
              </div>
            ))}
          {showAdminSocialEmptyMessage && (
            <p className="helper-text gallery-social-empty-state">Add a TikTok, Instagram, or YouTube URL in the admin dashboard to show videos here.</p>
          )}
        </div>
      </section>

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

export default GalleryPage;
