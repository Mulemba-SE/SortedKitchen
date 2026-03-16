import React from 'react';
import { Link } from 'react-router-dom';

const bookingTypes = [
  { title: 'Anniversaries', icon: 'calendar' },
  { title: 'Engagements', icon: 'ring' },
  { title: 'Birthday Parties', icon: 'cake' },
  { title: 'Cocktail Parties', icon: 'cocktail' },
  { title: 'Corporate Events', icon: 'briefcase' },
  { title: 'Date Nights', icon: 'glass' },
  { title: 'Dinner Parties', icon: 'bottle' },
  { title: 'Golf Trips', icon: 'ball' },
  { title: 'Holiday Parties', icon: 'tree' },
  { title: 'Vacations', icon: 'plane' },
  { title: 'Wedding Receptions', icon: 'chapel' },
];

function BookingTypes() {
  return (
    <section className="booking-types" id="booking-types">
      <h2>Make a Booking</h2>
      <p className="section-intro">
        Choose the occasion and we will tailor the experience to your guests.
      </p>
      <div className="booking-types-grid">
        {bookingTypes.map((type) => (
          <Link
            key={type.title}
            className="booking-type-card"
            to={`/booking?occasion=${encodeURIComponent(type.title)}`}
          >
            <span className="booking-type-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img" focusable="false">
                <use href={`#icon-${type.icon}`} />
              </svg>
            </span>
            <span className="booking-type-label">{type.title}</span>
          </Link>
        ))}
      </div>

      <svg className="booking-types-sprite" aria-hidden="true">
        <symbol id="icon-calendar" viewBox="0 0 64 64">
          <rect x="10" y="16" width="44" height="38" rx="6" />
          <rect x="18" y="10" width="6" height="12" rx="3" />
          <rect x="40" y="10" width="6" height="12" rx="3" />
          <rect x="18" y="28" width="10" height="8" rx="2" />
        </symbol>
        <symbol id="icon-ring" viewBox="0 0 64 64">
          <circle cx="32" cy="38" r="14" />
          <polygon points="32,10 40,24 24,24" />
        </symbol>
        <symbol id="icon-cake" viewBox="0 0 64 64">
          <rect x="14" y="28" width="36" height="22" rx="6" />
          <rect x="18" y="22" width="28" height="8" rx="4" />
          <rect x="30" y="10" width="4" height="10" rx="2" />
        </symbol>
        <symbol id="icon-cocktail" viewBox="0 0 64 64">
          <polygon points="18,12 46,12 34,28 30,28" />
          <rect x="30" y="28" width="4" height="18" />
          <rect x="24" y="46" width="16" height="4" rx="2" />
        </symbol>
        <symbol id="icon-briefcase" viewBox="0 0 64 64">
          <rect x="14" y="20" width="36" height="28" rx="6" />
          <rect x="24" y="14" width="16" height="8" rx="3" />
          <rect x="14" y="30" width="36" height="6" />
        </symbol>
        <symbol id="icon-glass" viewBox="0 0 64 64">
          <rect x="22" y="10" width="20" height="26" rx="6" />
          <rect x="30" y="36" width="4" height="12" />
          <rect x="24" y="48" width="16" height="4" rx="2" />
        </symbol>
        <symbol id="icon-bottle" viewBox="0 0 64 64">
          <rect x="28" y="10" width="8" height="10" rx="2" />
          <rect x="22" y="20" width="20" height="34" rx="8" />
        </symbol>
        <symbol id="icon-ball" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="16" />
          <path d="M16 32h32" />
          <path d="M24 18c6 6 6 22 0 28" />
        </symbol>
        <symbol id="icon-tree" viewBox="0 0 64 64">
          <polygon points="32,10 48,34 16,34" />
          <polygon points="32,20 52,46 12,46" />
          <rect x="28" y="46" width="8" height="8" rx="2" />
        </symbol>
        <symbol id="icon-plane" viewBox="0 0 64 64">
          <polygon points="12,34 52,18 36,36 52,46" />
          <rect x="28" y="30" width="8" height="18" />
        </symbol>
        <symbol id="icon-chapel" viewBox="0 0 64 64">
          <rect x="20" y="26" width="24" height="26" rx="4" />
          <polygon points="32,10 48,26 16,26" />
          <rect x="30" y="14" width="4" height="10" />
          <rect x="28" y="36" width="8" height="16" rx="4" />
        </symbol>
      </svg>
    </section>
  );
}

export default BookingTypes;
