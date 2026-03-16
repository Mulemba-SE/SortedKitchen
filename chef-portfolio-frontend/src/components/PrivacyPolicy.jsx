import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function PrivacyPolicy() {
  return (
    <div className="privacy-page-wrapper">
      <Navbar />
      <div className="privacy-hero">
        <h1>Privacy Policy</h1>
        <p>Your privacy is important to us. This policy explains how we handle your data.</p>
      </div>

      <div className="privacy-container">
        <section className="privacy-section">
          <h2>1. Information Collection</h2>
          <p>We collect information you provide directly to us, such as when you make a booking, sign up for our newsletter, or contact us for support. This includes your name, email address, and phone number.</p>
        </section>

        <section className="privacy-section">
          <h2>2. Use of Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you confirmations, and communicate with you about promotions and events.</p>
        </section>

        <section className="privacy-section">
          <h2>3. Data Sharing</h2>
          <p>We do not share your personal information with third parties except as described in this policy, such as with payment processors or with your consent.</p>
        </section>

        <section className="privacy-section">
          <h2>4. Cookies</h2>
          <p>We use cookies to collect information about your browsing activities and to improve your experience on our website. You can adjust your browser settings to refuse cookies.</p>
        </section>

        <section className="privacy-section">
          <h2>5. Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default PrivacyPolicy;