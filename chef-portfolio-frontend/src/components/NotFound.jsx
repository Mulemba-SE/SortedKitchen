import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

function NotFound() {
  return (
    <div className="not-found-wrapper">
      <Navbar />
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The culinary experience you are looking for does not exist.</p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
      <Footer />
    </div>
  );
}

export default NotFound;