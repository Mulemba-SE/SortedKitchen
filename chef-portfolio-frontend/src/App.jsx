import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import GalleryPage from './components/GalleryPage';
import BookingPage from './components/BookingPage';
import MyBookings from './components/MyBookings';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import GoogleAuthCallback from './components/GoogleAuthCallback';
import MenuPage from './components/MenuPage';
import Blog from './components/Blog';
import ChefBio from './components/ChefBio';
import GiftCards from './components/GiftCards';
import FAQ from './components/FAQ';
import NotFound from './components/NotFound';
import FavoritesPage from './components/FavoritesPage';
import LoyaltyProgram from './components/LoyaltyProgram';
import Careers from './components/Careers';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ShowcaseHome from './components/ShowcaseHome';
import QuoteResponse from './components/QuoteResponse';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { clearToken, getToken, getTokenRole, setToken } from './utils/authStorage';

function App() {
  const [authRole, setAuthRole] = useState(() => getTokenRole(getToken()));

  const handleLogin = (token, remember = true) => {
    setToken(token, remember);
    setAuthRole(getTokenRole(token));
  };

  const handleLogout = () => {
    setAuthRole(null);
    clearToken();
  };

  const isAdmin = authRole === 'admin';
  const isLoggedIn = Boolean(authRole);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isLoggedIn
            ? <ShowcaseHome isAdmin={isAdmin} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            : <Login onLogin={handleLogin} />
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
        <Route path="/my-bookings" element={isLoggedIn ? <MyBookings /> : <Navigate to="/login" replace />} />
        <Route path="/quote-response" element={<QuoteResponse />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback onLogin={handleLogin} />} />
        <Route path="/admin" element={
          isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
