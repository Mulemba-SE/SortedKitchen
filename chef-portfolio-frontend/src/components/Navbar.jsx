import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  const getTokenRole = () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role || null;
    } catch {
      return null;
    }
  };
  const [authRole, setAuthRole] = useState(getTokenRole);
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const resolvedTheme = 'light';
    setTheme(resolvedTheme);
    if (savedTheme !== resolvedTheme) {
      localStorage.setItem('theme', resolvedTheme);
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleLang = () => {
    setLang(prev => (prev === 'en' ? 'fr' : 'en'));
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleMenuDropdown = () => {
    setIsMenuDropdownOpen((prev) => !prev);
  };

  const closeMenus = () => {
    setIsOpen(false);
    setIsMenuDropdownOpen(false);
  };

  useEffect(() => {
    closeMenus();
    setAuthRole(getTokenRole());
  }, [location.pathname, location.hash, location.search]);

  useEffect(() => {
    const syncAuth = () => setAuthRole(getTokenRole());
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isActive = (path, hash) => {
    if (hash) {
      if (hash === '#home' && location.pathname === '/' && location.hash === '') {
        return true;
      }
      return location.pathname === '/' && location.hash === hash;
    }
    return location.pathname === path;
  };

  const isAdmin = authRole === 'admin';
  const isLoggedIn = Boolean(authRole);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAuthRole(null);
    closeMenus();
    window.location.href = '/login';
  };

  return (
    <nav className="navbar" onKeyDown={handleKeyDown}>
      <div className="logo">
        <img className="logo-image" src="/images/logo.png" alt="Sorted Kitchen logo" />
        Sorted Kitchen
      </div>
      <button
        type="button"
        className={`hamburger ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
        <li><a href="/#home" className={isActive('/', '#home') ? 'active' : ''} onClick={closeMenus}>Home</a></li>
        <li className={`dropdown ${isMenuDropdownOpen ? 'open' : ''}`}>
          <a
            href="/menu"
            className={`dropdown-trigger ${location.pathname === '/menu' ? 'active' : ''}`}
            onClick={closeMenus}
          >
            Meals
          </a>
          <button
            type="button"
            className="dropdown-caret-btn"
            onClick={toggleMenuDropdown}
            aria-expanded={isMenuDropdownOpen}
            aria-haspopup="true"
            aria-label="Toggle meals categories"
          >
            <span className={`dropdown-caret ${isMenuDropdownOpen ? 'open' : ''}`} aria-hidden="true">&#9662;</span>
          </button>
          <ul className="dropdown-menu">
            <li><a href="/menu?category=breakfast" onClick={closeMenus}>Breakfast</a></li>
            <li><a href="/menu?category=main" onClick={closeMenus}>Main</a></li>
            <li><a href="/menu?category=salad" onClick={closeMenus}>Salad</a></li>
            <li><a href="/menu?category=snacks" onClick={closeMenus}>Snacks</a></li>
          </ul>
        </li>
        <li><a href="/gallery" className={isActive('/gallery') ? 'active' : ''} onClick={closeMenus}>Gallery</a></li>
        <li><a href="/#about" className={isActive('/', '#about') ? 'active' : ''} onClick={closeMenus}>About</a></li>
        {isAdmin && (
          <li>
            <a href="/admin" className={isActive('/admin') ? 'active' : ''} onClick={closeMenus}>
              Admin Panel
            </a>
          </li>
        )}
        <li>
          <a href="/booking" className="nav-btn-reserve" onClick={closeMenus}>
            Make a Reservation
          </a>
        </li>
        {!isLoggedIn && (
          <li>
            <a href="/login" className="nav-btn-reserve" onClick={closeMenus}>
              Log In
            </a>
          </li>
        )}
        {isLoggedIn && (
          <li>
            <button type="button" className="nav-btn-reserve" onClick={handleLogout}>
              Logout
            </button>
          </li>
        )}
        <li>
          <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {lang.toUpperCase()}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
