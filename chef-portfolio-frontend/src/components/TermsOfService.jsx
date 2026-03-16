import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function TermsOfService() {
  return (
    <div className="terms-page-wrapper">
      <Navbar />
      <div className="terms-hero">
        <h1>Terms of Service</h1>
        <p>Please read these terms carefully before using our services.</p>
      </div>

      <div className="terms-container">
        <section className="terms-section">
          <h2>1. Introduction</h2>
          <p>Welcome to Chef Booking. By accessing our website and using our services, you agree to be bound by the following terms and conditions.</p>
        </section>

        <section className="terms-section">
          <h2>2. Booking & Cancellations</h2>
          <p>All bookings are subject to availability. Cancellations must be made at least 48 hours in advance for a full refund. Late cancellations may incur a fee.</p>
        </section>

        <section className="terms-section">
          <h2>3. Dietary Requirements</h2>
          <p>It is the client's responsibility to inform us of any allergies or dietary restrictions at the time of booking. While we take every precaution, we cannot guarantee a completely allergen-free environment.</p>
        </section>

        <section className="terms-section">
          <h2>4. Payment</h2>
          <p>Payment is required to secure your reservation. We accept major credit cards and digital payments. Prices are subject to change without notice.</p>
        </section>

        <section className="terms-section">
          <h2>5. Liability</h2>
          <p>Chef Booking is not liable for any direct, indirect, incidental, or consequential damages arising from the use of our services.</p>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default TermsOfService;