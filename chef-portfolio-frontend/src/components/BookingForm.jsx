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
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [availabilityError, setAvailabilityError] = useState('');
  const [menuPackages, setMenuPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [packageLoadError, setPackageLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/api/availability`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load available dates');
        setUnavailableDates([...new Set([
          ...(data.unavailableDates || []),
          ...(data.bookedDates || [])
        ])]);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Availability fetch error:', error);
          setAvailabilityError('Availability could not be loaded. The server will still verify your selected date when you submit.');
        }
      });
    return () => controller.abort();
  }, [apiUrl]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/api/menu-packages`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.error || 'Could not load menu packages');
        setMenuPackages(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Menu package fetch error:', error);
          setPackageLoadError('Packages are temporarily unavailable. You can still submit a booking without a package.');
        }
      });
    return () => controller.abort();
  }, [apiUrl]);

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

  const formatLocalDate = (date) => (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  );

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
    const selectedDateKey = formatLocalDate(formData.date);
    if (unavailableDates.includes(selectedDateKey)) {
      newErrors.date = 'This date is unavailable. Please select another date.';
    } else {
      const [hours, minutes] = String(formData.time || '').split(':').map(Number);
      const selectedDateTime = new Date(formData.date);
      if (Number.isInteger(hours) && Number.isInteger(minutes)) {
        selectedDateTime.setHours(hours, minutes, 0, 0);
      }
      if (selectedDateTime < new Date()) {
        newErrors.date = "Please select a future date and time.";
      }
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
      date: formatLocalDate(formData.date),
      packageId: selectedPackageId || undefined
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
        setSelectedPackageId('');
      } else if (response.status === 401) {
        setSubmitStatus({ type: 'error', message: 'Your session has expired. Please log in again.' });
      } else {
        const data = await response.json().catch(() => ({}));
        setSubmitStatus({ type: 'error', message: data.error || 'Something went wrong. Please try again.' });
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
              minDate={new Date()}
              excludeDates={unavailableDates.map((date) => {
                const [year, month, day] = date.split('-').map(Number);
                return new Date(year, month - 1, day);
              })}
              filterDate={(date) => !unavailableDates.includes(formatLocalDate(date))}
              ariaLabelledBy="date"
            />
          </div>
          {errors.date && <span className="error-text">{errors.date}</span>}
          {availabilityError && <span className="helper-text">{availabilityError}</span>}
          {unavailableDates.length > 0 && <span className="helper-text">Dates that are booked or unavailable cannot be selected.</span>}
        </div>
        <div className="form-group">
          <label htmlFor="time">Time</label>
          <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="guests">Number of Guests</label>
          <input type="number" id="guests" name="guests" min="1" max="20" value={formData.guests} onChange={handleChange} required />
        </div>
        {menuPackages.length > 0 && (
          <div className="form-group full-width booking-package-picker">
            <label htmlFor="booking-package">Menu package (optional)</label>
            <select
              id="booking-package"
              value={selectedPackageId}
              onChange={(event) => setSelectedPackageId(event.target.value)}
            >
              <option value="">Choose later / no package</option>
              {menuPackages.map((menuPackage) => (
                <option value={menuPackage._id} key={menuPackage._id}>
                  {menuPackage.name} · {menuPackage.currency} {Number(menuPackage.pricePerGuest || 0).toFixed(2)} per guest
                </option>
              ))}
            </select>
            {selectedPackageId && (() => {
              const selectedPackage = menuPackages.find((item) => item._id === selectedPackageId);
              if (!selectedPackage) return null;
              return (
                <div className="booking-package-summary">
                  {selectedPackage.description && <p>{selectedPackage.description}</p>}
                  <strong>
                    Estimated package total: {selectedPackage.currency} {(Number(selectedPackage.pricePerGuest || 0) * Number(formData.guests || 0)).toFixed(2)}
                  </strong>
                  <span>{selectedPackage.currency} {Number(selectedPackage.pricePerGuest || 0).toFixed(2)} per guest</span>
                  {selectedPackage.mealIds?.filter(Boolean).length > 0 && (
                    <ul>
                      {selectedPackage.mealIds.filter(Boolean).map((meal) => (
                        <li key={meal._id}>{meal.title}{meal.category ? ` · ${meal.category}` : ''}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        {packageLoadError && <p className="helper-text full-width">{packageLoadError}</p>}
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
