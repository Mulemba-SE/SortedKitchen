import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function MenuPage({ isAdmin = false, isLoggedIn = false, onLogout = () => {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [meals, setMeals] = useState([]);
  const [activeNavItem, setActiveNavItem] = useState('menus');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filtersDocked, setFiltersDocked] = useState(false);
  const [likedRecipes, setLikedRecipes] = useState(() => new Set());
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const location = useLocation();
  const navigate = useNavigate();
  const accountMenuRef = useRef(null);
  const filtersRef = useRef(null);
  const filtersSentinelRef = useRef(null);
  const selectedCategory = (new URLSearchParams(location.search).get('category') || '').toLowerCase();
  const categoryOptions = ['main', 'breakfast', 'lunch', 'dinner', 'salad', 'snacks'];

  const normalizeCategory = (category) => {
    const normalized = (category || '').toLowerCase();
    if (normalized === 'lunch' || normalized === 'dinner') return 'main';
    return normalized === 'snacks' ? 'snack' : normalized;
  };

  useEffect(() => {
    fetch(`${apiUrl}/api/meals`)
      .then(res => res.json())
      .then(data => setMeals(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading meals:', err));
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
    let ticking = false;

    const updateDockState = () => {
      const sentinelEl = filtersSentinelRef.current;
      if (!sentinelEl) return;
      const headerEl = document.querySelector('.menu-page-wrapper .showcase-header');
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
      const sentinelTop = sentinelEl.getBoundingClientRect().top;
      const dockNow = sentinelTop <= headerHeight + 4;
      const releaseNow = sentinelTop >= headerHeight + 16;
      setFiltersDocked((prev) => (prev ? !releaseNow : dockNow));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateDockState();
        ticking = false;
      });
    };

    updateDockState();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);



  const handleMobileNavLinkClick = (item) => {
    setActiveNavItem(item);
    setMobileNavOpen(false);
  };

  const transformCloudinary = (url) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/f_auto,q_auto:eco,w_640/');
    }
    return url;
  };

  const getCategoryLabel = (item) => {
    const rawCategory = (item?.category || '').toLowerCase();
    if (rawCategory.includes('breakfast')) return 'Breakfast';
    if (rawCategory.includes('salad')) return 'Salad';
    if (rawCategory.includes('snack')) return 'Snacks';
    if (rawCategory.includes('lunch')) return 'Lunch';
    if (rawCategory.includes('dinner')) return 'Dinner';
    if (rawCategory.includes('main')) {
      const mainText = `${item?.title || ''} ${item?.description || ''}`.toLowerCase();
      if (/(steak|salmon|roast|grill|filet|mignon)/.test(mainText)) return 'Dinner';
      return 'Lunch';
    }

    const text = `${item?.title || ''} ${item?.description || ''}`.toLowerCase();
    if (/(breakfast|waffle|pancake|omelet|egg|toast)/.test(text)) return 'Breakfast';
    if (/(salad|greens|caesar|vinaigrette)/.test(text)) return 'Salad';
    if (/(snack|fries|chips|brownie|cookie|bites|wings)/.test(text)) return 'Snacks';
    if (/(dinner|steak|salmon|roast|grill|filet|mignon)/.test(text)) return 'Dinner';
    return 'Lunch';
  };

  const formatRecipeTitle = (title = '') => (
    title
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );

  const renderMealCard = (item, index, keyPrefix = 'meal') => (
    <article key={`${keyPrefix}-${index}`} className="menu-item menu-item-card">
      <div className="menu-item-image">
        {item.imageUrl ? (
          <img
            src={transformCloudinary(item.imageUrl)}
            alt={item.title || 'Meal image'}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="menu-item-image-fallback">No image</div>
        )}
      </div>

      <div className="menu-item-meta">{getCategoryLabel(item)}</div>
      <p className="menu-item-title">{formatRecipeTitle(item.title)}</p>
    </article>
  );

  const handleViewRecipe = (item) => {
    const category = normalizeCategory(getCategoryLabel(item));
    const params = new URLSearchParams(location.search);
    params.set('category', category);
    navigate({ pathname: '/menu', search: `?${params.toString()}` });
    setSearchTerm(item.title || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderRelatedRecipeCard = (item, index) => (
    <article key={`related-${index}`} className="menu-item related-recipe-card">
      <div className="menu-item-image">
        {item.imageUrl ? (
          <img
            src={transformCloudinary(item.imageUrl)}
            alt={item.title || 'Meal image'}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="menu-item-image-fallback">No image</div>
        )}
      </div>

      <div className="menu-item-meta">{getCategoryLabel(item)}</div>
      <p className="menu-item-title">{formatRecipeTitle(item.title)}</p>
      <div className="related-recipe-actions">
        <button type="button" className="related-recipe-btn" onClick={() => handleViewRecipe(item)}>
          View Recipe
        </button>
      </div>
    </article>
  );

  const renderCategory = (title, items) => {
    const filteredItems = items.filter(item => {
      const titleText = item.title?.toLowerCase() || '';
      const descriptionText = item.description?.toLowerCase() || '';
      const matchesSearch = titleText.includes(searchTerm.toLowerCase()) ||
                            descriptionText.includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory ||
        normalizeCategory(getCategoryLabel(item)) === normalizeCategory(selectedCategory);
      return matchesSearch && matchesCategory;
    });

    if (filteredItems.length === 0) return null;

    return (
      <div className="menu-category">
        <h3>{title}</h3>
        <div className="menu-items">
          {filteredItems.map((item, index) => (
            renderMealCard(item, index)
          ))}
        </div>
      </div>
    );
  };

  const handleCategoryFilter = (category) => {
    const params = new URLSearchParams(location.search);
    params.set('category', category);
    navigate({ pathname: '/menu', search: `?${params.toString()}` });
  };

  const toggleLikeRecipe = (title) => {
    setLikedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const fallbackRelatedRecipes = [
    {
      title: 'Seared Filet Mignon',
      description: 'Tender filet mignon seared to perfection with herb butter and seasonal vegetables.',
      category: 'main',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      title: 'Lemon Herb Salmon',
      description: 'Fresh salmon with bright lemon zest and aromatic herbs, served with crisp greens.',
      category: 'main',
      imageUrl: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      title: 'Vegan Buddha Bowl',
      description: 'Colorful grains, roasted vegetables, and creamy dressing for a wholesome balanced meal.',
      category: 'salad',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
    {
      title: 'Caprese Salad',
      description: 'Ripe tomatoes, fresh mozzarella, basil, and olive oil for a light Mediterranean favorite.',
      category: 'salad',
      imageUrl: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=640&q=65&fm=webp',
    },
  ];

  const relatedDishes = meals.length ? meals.slice(0, 4) : fallbackRelatedRecipes;

  const highlightRecipes = [
    {
      title: 'Mulemba',
      tag: 'Chicken',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=960&q=70&fm=webp',
    },
    {
      title: 'Nyama Choma',
      tag: 'Grill',
      imageUrl: 'https://images.unsplash.com/photo-1529511582893-2d7e684dd128?auto=format&fit=crop&w=960&q=70&fm=webp',
    },
    {
      title: 'Tilapia Fry',
      tag: 'Traditional',
      imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=960&q=70&fm=webp',
    },
  ];
  const menuCategoryChips = [
    { id: 'chicken', label: 'Chicken', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965296.png' },
    { id: 'halal', label: 'Halal', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965334.png' },
    { id: 'burgers', label: 'Burgers', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965377.png' },
    { id: 'local', label: 'Local food', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965261.png' },
    { id: 'snacks', label: 'Snacks', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965318.png' },
    { id: 'desserts', label: 'Desserts', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965282.png' },
    { id: 'pizza', label: 'Pizza', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965340.png' },
    { id: 'grill', label: 'Grill', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965361.png' },
    { id: 'breakfast', label: 'Breakfast', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965310.png' },
    { id: 'tea', label: 'Tea & coffee', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965237.png' },
    { id: 'traditional', label: 'Traditional', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5965/5965256.png' },
    { id: 'ice', label: 'Ice cream', iconUrl: 'https://cdn-icons-png.flaticon.com/512/6639/6639713.png' },
  ];

  return (
    <div className={`menu-page-wrapper${filtersDocked ? ' filters-docked' : ''}`}>
      <div className="menu-top-container">
        <header className="showcase-header">
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
        <div className="menu-hero">
          <div className="menu-hero-breadcrumbs" aria-label="Breadcrumb">
            <a href="/" className="menu-hero-breadcrumb-link">Home</a>
            <span className="menu-hero-breadcrumb-sep" aria-hidden="true">{'>'}</span>
            <span className="menu-hero-breadcrumb-current">Food</span>
          </div>
          <div className="menu-hero-title">Food</div>
          <div className="menu-hero-categories" aria-label="Food categories">
            <button type="button" className="menu-hero-arrow" aria-label="Scroll categories left">
              <span aria-hidden="true">{'<'}</span>
            </button>
            <div className="menu-hero-track">
              {menuCategoryChips.map((chip) => (
                <button key={chip.id} type="button" className="menu-hero-chip">
                  <span className="menu-hero-chip-icon" aria-hidden="true">
                    <img src={chip.iconUrl} alt="" className="menu-hero-chip-icon-img" />
                  </span>
                  <span className="menu-hero-chip-label">{chip.label}</span>
                </button>
              ))}
            </div>
            <button type="button" className="menu-hero-arrow" aria-label="Scroll categories right">
              <span aria-hidden="true">{'>'}</span>
            </button>
          </div>
          <div className="menu-hero-filters-sentinel" ref={filtersSentinelRef} aria-hidden="true"></div>
          <div className="menu-hero-filters" aria-label="Filters" ref={filtersRef}>
            <button type="button" className="menu-hero-filter">
              Food type
              <span className="menu-hero-filter-caret" aria-hidden="true">{'\u25BE'}</span>
            </button>
            <button type="button" className="menu-hero-filter">
              Sort by
              <span className="menu-hero-filter-caret" aria-hidden="true">{'\u25BE'}</span>
            </button>
            <button type="button" className="menu-hero-filter menu-hero-filter-highlight">
              <span className="menu-hero-filter-icon" aria-hidden="true">
                <img
                  src="https://cdn-icons-png.flaticon.com/128/91/91202.png"
                  alt=""
                  className="menu-hero-filter-crown-img"
                />
              </span>
              Top Rated
            </button>
          </div>
          <div className="menu-hero-filters-spacer" aria-hidden="true"></div>
        </div>
      </div>

      <div className="full-menu-container">
        <p className="menu-grid-title">All Recipes</p>
        <section className="menu-highlight-grid" aria-label="Featured recipes">
          {highlightRecipes.map((recipe, index) => (
            <article key={`${recipe.title}-${index}`} className="menu-highlight-card">
              <div className="menu-highlight-image">
                <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" decoding="async" />
              </div>
              <div className="menu-highlight-info">
                <div className="menu-highlight-title-row">
                  <p className="menu-highlight-title">{recipe.title}</p>
                  <div className="menu-highlight-meta">
                    <button
                      type="button"
                      className={`menu-highlight-like${likedRecipes.has(recipe.title) ? ' is-liked' : ''}`}
                      aria-pressed={likedRecipes.has(recipe.title)}
                      aria-label={`Like ${recipe.title}`}
                      onClick={() => toggleLikeRecipe(recipe.title)}
                    >
                      <svg
                        className="menu-highlight-like-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M7.5 10.5V21h8.2c.7 0 1.3-.4 1.6-1l2.1-4.9c.2-.5.3-1 .2-1.5-.2-.7-.8-1.2-1.6-1.2h-5.5l.5-3.1c.1-.4 0-.8-.3-1.1L11 5.5 7.8 9c-.2.2-.3.5-.3.8z" />
                        <rect x="3" y="10" width="3" height="11" rx="1" />
                      </svg>
                    </button>
                    {recipe.tag && <span className="menu-highlight-tag">{recipe.tag}</span>}
                  </div>
                </div>
                <button type="button" className="menu-highlight-btn">View Recipe</button>
              </div>
            </article>
          ))}
        </section>
      </div>

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
    </div>
  );
}

export default MenuPage;








