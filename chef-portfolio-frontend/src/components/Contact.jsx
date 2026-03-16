import React from 'react';

function Contact() {
  return (
    <section className="contact" id="contact">
      <h2>Visit Us</h2>
      <div className="contact-container">
        <div className="contact-info">
          <h3>Contact Details</h3>
          <p><strong>Address:</strong> Bus Park Road in the Roadblock area, Kajiado County, 00241.</p>
          <p><strong>Phone:</strong> +254 740922292</p>
          <p><strong>Email:</strong> mulembaevans37@gmail.com</p>
          <p><strong>Hours:</strong> Mon - Sat: 5:00 AM - 11:00 PM</p>
        </div>
        <div className="map-container">
          <iframe 
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1422937950147!2d-73.98731968482413!3d40.75889497932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1623345678901!5m2!1sen!2sus" 
            allowFullScreen="" 
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </section>
  );
}

export default Contact;