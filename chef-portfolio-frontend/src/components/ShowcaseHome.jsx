import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const transformCloudinary = (url, width = 640) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto:eco,w_${width}/`);
  }
  return url;
};

function ShowcaseHome({ isAdmin = false, isLoggedIn = false, onLogout = () => {} }) {
  const [meals, setMeals] = useState([]);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState('s-1');
  const accountMenuRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${apiUrl}/api/meals`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const nonSocialMeals = list.filter(
          (meal) => !(typeof meal?.socialUrl === 'string' && meal.socialUrl.trim().length > 0)
        );
        setMeals(nonSocialMeals.slice(0, 4).map((meal) => ({
          ...meal,
          imageUrl: transformCloudinary(meal.imageUrl)
        })));
      })
      .catch(() => setMeals([]));
  }, [apiUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncActiveNavFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveNavItem(hash || 'home');
    };

    syncActiveNavFromHash();
    window.addEventListener('hashchange', syncActiveNavFromHash);
    return () => window.removeEventListener('hashchange', syncActiveNavFromHash);
  }, []);

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
    const handleResize = () => {
      if (window.innerWidth > 980) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMobileNavLinkClick = (item) => {
    setActiveNavItem(item);
    setMobileNavOpen(false);
  };

  const fallbackMeals = [
    {
      _id: 'm-1',
      title: 'Seared Filet Mignon',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      _id: 'm-2',
      title: 'Lemon Herb Salmon',
      imageUrl: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      _id: 'm-3',
      title: 'Vegan Buddha Bowl',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      _id: 'm-4',
      title: 'Caprese Salad',
      imageUrl: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
  ];

  const services = [
    {
      id: 's-1',
      title: 'In-Home Fine Dining',
      description:
        'A fully customized restaurant-style experience prepared and served in the comfort of your home. Ideal for romantic dinners, anniversaries, or intimate celebrations.',
      imageUrl:
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-2',
      title: 'Dinner Parties & Group Events',
      description:
        'Multi-course meals designed for birthdays, family gatherings, or special celebrations. The chef handles everything from preparation to plating and cleanup.',
      imageUrl:
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-3',
      title: 'Weekly Meal Prep',
      description:
        'Fresh, healthy meals prepared in advance for busy individuals or families. Menus are tailored to dietary needs and packaged for convenient reheating.',
      imageUrl:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-4',
      title: 'Corporate & Executive Dining',
      description:
        'Professional catering for business meetings, executive lunches, and small corporate events with refined presentation and service.',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-5',
      title: 'Specialized Dietary Services',
      description:
        'Custom menus for vegan, vegetarian, gluten-free, keto, halal, or other dietary requirements, ensuring nutrition and flavor go hand in hand.',
      imageUrl:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-6',
      title: 'Cooking Classes',
      description:
        'Interactive cooking sessions where guests learn techniques, recipes, and plating skills, great for team-building or private lessons.',
      imageUrl:
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-7',
      title: 'Event Catering (Small-Scale)',
      description:
        'Elegant catering for intimate weddings, engagement parties, or private celebrations with personalized menu planning.',
      imageUrl:
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-8',
      title: 'Vacation Chef Services',
      description:
        'Personal chef services at holiday homes or Airbnb stays, allowing guests to relax while enjoying freshly prepared meals.',
      imageUrl:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      id: 's-9',
      title: 'Airbnb Private Services',
      description:
        'On-site private chef services for Airbnb stays, including custom menus, grocery handling, and full in-kitchen service.',
      imageUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
  ];

  const chefAtWorkShots = [
    {
      id: 'present',
      label: 'Presentation',
      alt: 'Presenting a plated dish',
      src: '/images/capture-900.jpg',
      description: 'Food presentation and final touches.',
    },
    {
      id: 'prep',
      label: 'Prep',
      alt: 'Preparing ingredients on a cutting board',
      src: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Mise en place, knife work, and prep.',
    },
    {
      id: 'flame',
      label: 'Cooking',
      alt: 'Cooking over high heat in a pan',
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Heat, timing, and control on the stove.',
    },
    {
      id: 'plating',
      label: 'Plating',
      alt: 'Plating a dish with fresh herbs',
      src: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Plating, garnish, and balance.',
    },
    {
      id: 'details',
      label: 'Details',
      alt: 'Finishing touches on a plate',
      src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Saucing, textures, and presentation.',
    },
    {
      id: 'clean',
      label: 'Clean-Up',
      alt: 'Cleaning a kitchen work surface',
      src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Clean kitchen, clean service.',
    },
    {
      id: 'service',
      label: 'Service',
      alt: 'Serving food at the counter',
      src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Warm delivery, polished service.',
    },
    {
      id: 'taste',
      label: 'Taste Test',
      alt: 'Tasting a dish during cooking',
      src: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=70&fm=webp',
      description: 'Taste, adjust, and perfect.',
    },
  ];


  const dishes = meals.length ? meals : fallbackMeals;
  const topRecipes = [...dishes, ...fallbackMeals].slice(0, 6);
  const showcaseDishPool = [...dishes, ...fallbackMeals];
  const showcaseDishes = Array.from({ length: 6 }, (_, index) => (
    showcaseDishPool[index % showcaseDishPool.length]
  ));
  const activeService = services.find((service) => service.id === activeServiceId) || services[0];
  const leftShowcaseDish = showcaseDishes[0];
  const centerShowcaseDishes = showcaseDishes.slice(1, 5);
  const rightShowcaseDish = showcaseDishes[5];

  const chefPhotoMeta = React.useMemo(
    () =>
      chefAtWorkShots.map(() => ({
        rating: (Math.round((4.2 + Math.random() * 0.8) * 10) / 10).toFixed(1),
        favorite: Math.random() > 0.55,
      })),
    []
  );

  const toggleServiceDetails = (serviceId) => {
    setActiveServiceId((previous) => (previous === serviceId ? null : serviceId));
  };

  return (
    <main className="showcase-page">
      <div className="showcase-top-container">
      <header className="showcase-header">
        <div className="showcase-brand">
          <span className="showcase-brand-logo-wrap">
            <img src="/images/brand-logo-256.png" alt="Sorted Kitchen" className="showcase-brand-logo" />
          </span>
          <p>Sorted Kitchen</p>
        </div>
        {isLoggedIn ? (
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
        ) : (
          <Link to="/login" className="showcase-mobile-login-btn">Log In</Link>
        )}
        <div className="showcase-header-actions">
          {!isLoggedIn && <Link to="/login" className="showcase-btn">Log In</Link>}
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
                      <Link to="/admin" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Admin Panel</Link>
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
          {isLoggedIn && <Link to="/booking" className="showcase-btn">Book Now</Link>}
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
          <Link to="/menu" onClick={() => handleMobileNavLinkClick('menus')}>Food</Link>
          <Link to="/gallery" onClick={() => handleMobileNavLinkClick('gallery')}>Gallery</Link>
          <a href="#services" onClick={() => handleMobileNavLinkClick('services')}>Services</a>
          <a href="#about" onClick={() => handleMobileNavLinkClick('about')}>About</a>
          <a href="#contact" onClick={() => handleMobileNavLinkClick('contact')}>Contact</a>
          <div className="showcase-mobile-actions">
            {!isLoggedIn && (
              <Link
                to="/login"
                className="showcase-mobile-login"
                onClick={() => setMobileNavOpen(false)}
              >
                Log In
              </Link>
            )}
            {isLoggedIn && <Link to="/booking" onClick={() => setMobileNavOpen(false)}>Book Now</Link>}
            {(isAdmin || isLoggedIn) && (
              <div className="showcase-mobile-actions-row">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="showcase-mobile-admin"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Admin Panel
                  </Link>
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

      <section className="showcase-hero" id="home">
        <div className="showcase-hero-title-block">
          <h1>Sorted Kitchen</h1>
          <p>Explore my signature gourmet dishes</p>
          <div className="showcase-hero-nav" role="navigation" aria-label="Primary">
            <a href="#home" className={activeNavItem === 'home' ? 'active' : ''} onClick={() => setActiveNavItem('home')}>
              <span className="showcase-hero-nav-icon" aria-hidden="true">
                <img src="/icons/home.svg" alt="" className="showcase-hero-nav-icon-svg" />
              </span>
              <span className="showcase-hero-nav-label">Home</span>
            </a>
            <Link to="/menu" className={activeNavItem === 'menus' ? 'active' : ''} onClick={() => setActiveNavItem('menus')}>
              <span className="showcase-hero-nav-icon" aria-hidden="true">
                <img src="/icons/menus.svg" alt="" className="showcase-hero-nav-icon-svg" />
              </span>
              <span className="showcase-hero-nav-label">Menus</span>
            </Link>
            <Link to="/gallery" className={activeNavItem === 'gallery' ? 'active' : ''} onClick={() => setActiveNavItem('gallery')}>
              <span className="showcase-hero-nav-icon" aria-hidden="true">
                <img src="/icons/gallery.svg" alt="" className="showcase-hero-nav-icon-svg" />
              </span>
              <span className="showcase-hero-nav-label">Gallery</span>
            </Link>
            <a href="#services" className={activeNavItem === 'services' ? 'active' : ''} onClick={() => setActiveNavItem('services')}>
              <span className="showcase-hero-nav-icon" aria-hidden="true">
                <img src="/icons/services.svg" alt="" className="showcase-hero-nav-icon-svg" />
              </span>
              <span className="showcase-hero-nav-label">Services</span>
            </a>
            <a href="#about" className={activeNavItem === 'about' ? 'active' : ''} onClick={() => setActiveNavItem('about')}>
              <span className="showcase-hero-nav-icon" aria-hidden="true">
                <img src="/icons/about.svg" alt="" className="showcase-hero-nav-icon-svg" />
              </span>
              <span className="showcase-hero-nav-label">About</span>
            </a>
            <a href="#contact" className={activeNavItem === 'contact' ? 'active' : ''} onClick={() => setActiveNavItem('contact')}>
              <span className="showcase-hero-nav-icon" aria-hidden="true">
                <img src="/icons/contact.svg" alt="" className="showcase-hero-nav-icon-svg" />
              </span>
              <span className="showcase-hero-nav-label">Contact</span>
            </a>
          </div>
        </div>
      </section>
      </div>
        
      

      <div className="showcase-top-recipes-container">
        <section className="showcase-top-recipes-band" aria-label="Top Recipes">
          <header className="showcase-top-recipes-header">
          </header> 

          <div className="showcase-top-recipes-carousel">
            <div className="showcase-top-recipes-grid">
              {topRecipes.map((recipe, index) => (
                  <article
                    key={`top-row-1-${recipe._id}-${index}`}
                    className={`showcase-top-recipe-item ${index === 1 ? 'featured' : ''}`}
                  >
                    <div className="showcase-top-recipe-card">
                      <div className="showcase-top-recipe-media">
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          fetchPriority={index === 0 ? 'high' : 'auto'}
                          decoding="async"
                        />
                      </div>
                      <div className="showcase-top-recipe-meta">
                        <h3>{recipe.title}</h3>
                        <Link to="/menu" className="showcase-top-recipe-btn">View Recipe</Link>
                      </div>
                    </div>
                  </article>
              ))}
            </div>
          </div>

        </section>
      </div>

      <div className="showcase-wave-divider" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path className="showcase-wave-path-desktop" d="M0,78 C240,108 480,108 720,78 C960,48 1200,48 1440,78 L1440,120 L0,120 Z"></path>
          <path className="showcase-wave-path-mobile" d="M0,90 Q720,30 1440,90 L1440,120 L0,120 Z"></path>
        </svg>
      </div>

      <div className="showcase-services-container">
        <section className="showcase-how" id="services">
          <h2>Gourmet Chef <em>Services</em></h2>
          <article className="showcase-service-expanded-mobile" aria-live="polite">
            <div className="showcase-service-expanded-mobile-media">
              <img src={activeService.imageUrl} alt={activeService.title} loading="lazy" decoding="async" />
            </div>
            <div className="showcase-service-expanded-mobile-meta">
              <h3>{activeService.title}</h3>
              <p>{activeService.description}</p>
              <div className="showcase-service-link-wrap">
                <Link to="/booking" className="showcase-service-link">Book Service</Link>
              </div>
            </div>
          </article>
          <div className="showcase-services-grid">
            {services.map((service) => (
            <article
              key={service.id}
              className={`showcase-service-item ${activeServiceId === service.id ? 'is-active' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={activeServiceId === service.id}
              onClick={() => toggleServiceDetails(service.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleServiceDetails(service.id);
                }
              }}
            >
              <div className="showcase-service-card">
                <div className="showcase-service-media">
                  <Link to="/booking" className="showcase-service-media-link" aria-label={`Book ${service.title}`}>
                    <img src={service.imageUrl} alt={service.title} loading="lazy" decoding="async" />
                  </Link>
                </div>
                <div className="showcase-service-meta">
                  <h3>{service.title}</h3>
                  <p className="showcase-service-desc">{service.description}</p>
                  <div className="showcase-service-cta">
                    <Link to="/booking" className="showcase-service-link">Book Service</Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>

      <div className="showcase-wave-divider showcase-wave-divider-dark" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path className="showcase-wave-dark-path-desktop" d="M0,78 C240,108 480,108 720,78 C960,48 1200,48 1440,78 L1440,120 L0,120 Z"></path>
          <path className="showcase-wave-dark-path-mobile" d="M0,90 Q720,30 1440,90 L1440,120 L0,120 Z"></path>
        </svg>
      </div>

      <section className="showcase-welcome" id="about">
        <div className="showcase-welcome-content">
          <h2 className="showcase-welcome-title">Chef At Work</h2>
          <p className="showcase-welcome-intro">
            <span className="showcase-welcome-image-inline" aria-hidden="true">
              <img src="/images/capture-900.jpg" alt="" loading="lazy" decoding="async" />
            </span>
            Welcome to Sorted Kitchen, where tradition meets creativity on every plate. We bring bold Kenyan influences together with refined culinary techniques to create unforgettable dining moments tailored just for you. From carefully selected fresh ingredients to beautifully crafted dishes, every meal is prepared with passion, precision, and attention to detail.
            Whether you are enjoying an intimate dinner, hosting friends, celebrating a special occasion, or simply looking to elevate your everyday dining experience, our goal is to deliver exceptional flavors and memorable moments. At Sorted Kitchen, we believe food is more than a meal - it is an experience that brings people together, tells a story, and leaves a lasting impression.
          </p>

          
        </div>
        <div className="showcase-welcome-figure" aria-hidden="true">
          <img src="/images/capture-900.jpg" alt="" loading="lazy" decoding="async" />
        </div>
      </section>

      <div className="showcase-welcome-photos-wrap">
        <div className="showcase-welcome-photos showcase-welcome-photos-full" aria-label="Chef at work photos">
          {chefAtWorkShots.map((shot, index) => {
            const tags = [
              'Luxury Dining',
              'Authentic Cuisine',
              'Kenyan Flavors',
              'Modern Cooking',
              'Culinary Art',
              'Gourmet Experience',
              "Chef's Table",
              'Signature Dishes',
            ];
            const tag = tags[index % tags.length];
            const meta = chefPhotoMeta[index];
            return (
              <figure key={shot.id} className="showcase-welcome-photo-card">
                <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
                <figcaption className="showcase-welcome-photo-meta">
                  <span className="showcase-welcome-photo-tag">{tag}</span>
                  <span className="showcase-welcome-photo-rating" aria-label={`Rated ${meta.rating} stars`}>
                    ★ {meta.rating}
                  </span>
                  <span
                    className={`showcase-welcome-photo-favorite ${meta.favorite ? 'is-favorite' : ''}`}
                    aria-label={meta.favorite ? 'Favorite' : 'Not favorite'}
                    aria-hidden="true"
                  >
                    {meta.favorite ? '♥' : '♡'}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
          <Link to="/bio" className="showcase-btn showcase-welcome-cta-btn">Learn More About Me</Link>
        </div>

        <section className="showcase-dishes" id="menus">
          <div className="showcase-faq">
            <h2 className="showcase-faq-title">FAQs</h2>
            <ol className="showcase-faq-list">
            <li>
              <h3>How do I book a chef?</h3>
              <p>Use the Book Service button to choose your date, service type, and preferences. We’ll confirm availability and finalize your menu.</p>
            </li>
            <li>
              <h3>Do you accommodate dietary needs?</h3>
              <p>Yes. We offer vegan, vegetarian, gluten-free, halal, and allergy-aware menus tailored to your needs.</p>
            </li>
            <li>
              <h3>How far in advance should I book?</h3>
              <p>For weekends and events, we recommend booking at least 1–2 weeks in advance to secure your preferred date.</p>
            </li>
            <li>
              <h3>What’s included in the service?</h3>
              <p>Menu planning, ingredient sourcing, cooking, plating, and kitchen clean-up are included unless otherwise stated.</p>
            </li>
            <li>
              <h3>Can you cook at my Airbnb or vacation rental?</h3>
              <p>Absolutely. We provide on-site private chef services for stays and retreats.</p>
            </li>
            <li>
              <h3>What areas do you serve?</h3>
              <p>We serve Nairobi and surrounding areas. For longer travel requests, please contact us for a custom quote.</p>
            </li>
          </ol>
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
    </main>
  );
}

export default ShowcaseHome;













