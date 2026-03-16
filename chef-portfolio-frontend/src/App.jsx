import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import GalleryPage from './components/GalleryPage';
import BookingPage from './components/BookingPage';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import MenuPage from './components/MenuPage';
import Blog from './components/Blog';
import ChefBio from './components/ChefBio';
import GiftCards from './components/GiftCards';
import FAQ from './components/FAQ';
import NotFound from './components/NotFound';
import CookieConsent from './components/CookieConsent';
import FavoritesPage from './components/FavoritesPage';
import NewsletterPopup from './components/NewsletterPopup';
import LoyaltyProgram from './components/LoyaltyProgram';
import Careers from './components/Careers';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ShowcaseHome from './components/ShowcaseHome';

function App() {
  const getTokenRole = (token) => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role || null;
    } catch {
      return null;
    }
  };

  const [authRole, setAuthRole] = useState(() => {
    const token = localStorage.getItem('adminToken');
    return getTokenRole(token);
  });

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setAuthRole(getTokenRole(token));
  };

  const handleLogout = () => {
    setAuthRole(null);
    localStorage.removeItem('adminToken');
  };

  const isAdmin = authRole === 'admin';
  const isLoggedIn = Boolean(authRole);

  return (
    <Router>
      <CookieConsent />
      <NewsletterPopup />
      <Routes>
        <Route path="/" element={
          <div>
            <ShowcaseHome isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
          </div>
        } />
        <Route path="/menu" element={<MenuPage isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
        <Route path="/gallery" element={<GalleryPage isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/bio" element={<ChefBio isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/loyalty" element={<LoyaltyProgram />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/booking" element={isLoggedIn ? <BookingPage isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/admin" element={
          isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
