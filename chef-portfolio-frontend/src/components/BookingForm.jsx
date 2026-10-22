import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getToken } from '../utils/authStorage';

function BookingForm({ embedded = false, defaultOccasion = '' }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: null,
    time: '',
    guests: 2,
    occasion: defaultOccasion,
    eventAddress: '',
    referralSource: '',
    eventDetails: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (defaultOccasion) {
      setFormData(prev => ({ ...prev, occasion: defaultOccasion }));
    }
  }, [defaultOccasion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.date) {
      newErrors.date = "Please select a date.";
      setErrors(newErrors);
      return false;
    }
    const selectedDate = new Date(formData.date);
    const now = new Date();
    if (selectedDate < now) {
      newErrors.date = "Please select a future date and time.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = getToken();
    if (!token) {
      setSubmitStatus({ type: 'error', message: 'Please log in before booking.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Format date to string for backend consistency (YYYY-MM-DD)
    const submissionData = {
      ...formData,
      date: formData.date.toISOString().split('T')[0]
    };

    try {
      const response = await fetch(`${apiUrl}/api/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: `Thank you, ${formData.name}! Your request has been received.` });
        setFormData({
          name: '',
          email: '',
          phone: '',
          date: null,
          time: '',
          guests: 2,
          occasion: '',
          eventAddress: '',
          referralSource: '',
          eventDetails: ''
        });
      } else if (response.status === 401) {
        setSubmitStatus({ type: 'error', message: 'Your session has expired. Please log in again.' });
      } else {
        setSubmitStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus({ type: 'error', message: 'Failed to connect to the server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Wrapper = embedded ? 'div' : 'section';

  return (
    <Wrapper className={`booking${embedded ? ' booking-embedded' : ''}`} {...(!embedded ? { id: 'book' } : {})}>
      <h3>We are here to make your next event a fabulous adventure.</h3>
      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={errors.email ? 'error-input' : ''} />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g., +1 555 123 4567" />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <div className={errors.date ? 'custom-datepicker-wrapper error' : 'custom-datepicker-wrapper'}>
            <DatePicker 
              selected={formData.date} 
              onChange={handleDateChange} 
              dateFormat="yyyy-MM-dd"
              placeholderText="Select a date"
              className="datepicker-input"
            />
          </div>
          {errors.date && <span className="error-text">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="time">Time</label>
          <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="guests">Number of Guests</label>
          <input type="number" id="guests" name="guests" min="1" max="20" value={formData.guests} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="occasion">Occasion (Optional)</label>
          <select id="occasion" name="occasion" value={formData.occasion} onChange={handleChange}>
            <option value="">Select an Occasion</option>
            <option value="Birthday">Birthday</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Business">Business</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group full-width">
          <label htmlFor="eventAddress">Event Address</label>
          <input type="text" id="eventAddress" name="eventAddress" value={formData.eventAddress} onChange={handleChange} placeholder="Street, City, Country" />
        </div>
        <div className="form-group full-width">
          <label htmlFor="referralSource">How did you hear about us?</label>
          <select id="referralSource" name="referralSource" value={formData.referralSource} onChange={handleChange}>
            <option value="">Select an option</option>
            <option value="Google">Google</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Friend">Friend/Family</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group full-width">
          <label htmlFor="eventDetails">Tell more about this event</label>
          <textarea id="eventDetails" name="eventDetails" value={formData.eventDetails} onChange={handleChange} rows="4" placeholder="Share details, preferences, or special requests."></textarea>
        </div>
        <div className="booking-form-actions">
          <button type="submit" className="showcase-btn booking-reserve-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending Request...' : 'Reserve'}
          </button>
          <a href="/" className="showcase-btn booking-home-btn">Home</a>
        </div>
        {submitStatus && (
          <div className={`status-message ${submitStatus.type}`}>{submitStatus.message}</div>
        )}
        <div className="booking-contact-info">
          <span className="booking-contact-item">
            <span className="booking-contact-icon" aria-hidden="true">
              <img
                src="https://cdn-icons-png.flaticon.com/512/18847/18847934.png"
                alt=""
                className="booking-contact-icon-img"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span>+254 740922282</span>
          </span>
          <span className="booking-contact-item">
            <span className="booking-contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </span>
            <span>mulembaevans37@gmail.com</span>
          </span>
        </div>
      </form>
    </Wrapper>
  );
}

export default BookingForm;
