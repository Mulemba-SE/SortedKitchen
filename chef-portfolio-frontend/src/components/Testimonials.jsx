import React, { useState, useEffect } from 'react';

const testimonials = [
  {
    id: 1,
    text: "The best dining experience of my life. The truffle risotto is to die for!",
    author: "Emily R.",
    role: "Food Critic"
  },
  {
    id: 2,
    text: "Chef [Name] brings a level of creativity that is unmatched. Highly recommended.",
    author: "Michael T.",
    role: "Sommelier"
  },
  {
    id: 3,
    text: "An unforgettable evening. The service was impeccable and the food was divine.",
    author: "Sarah L.",
    role: "Event Planner"
  }
];

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedReviews, setSavedReviews] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const displayedReviews = savedReviews.length > 0 ? savedReviews : testimonials;

  useEffect(() => {
    let isCurrent = true;
    fetch(`${apiUrl}/api/reviews`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (isCurrent && Array.isArray(data) && data.length > 0) {
          setSavedReviews(data);
          setCurrentIndex(0);
        }
      })
      .catch(() => {});
    return () => { isCurrent = false; };
  }, [apiUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % displayedReviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayedReviews.length]);

  const currentReview = displayedReviews[currentIndex % displayedReviews.length];

  return (
    <section className="testimonials" id="testimonials">
      <h2>What Our Guests Say</h2>
      <div className="testimonial-slider">
        <div className="testimonial-card">
          {currentReview.rating && (
            <span className="testimonial-rating" aria-label={`${currentReview.rating} out of 5 stars`}>
              {'★'.repeat(Number(currentReview.rating))}{'☆'.repeat(5 - Number(currentReview.rating))}
            </span>
          )}
          <p>"{currentReview.text}"</p>
          <div className="author">
            <h4>{currentReview.author}</h4>
            <span>{currentReview.role}</span>
          </div>
        </div>
        <div className="slider-dots">
          {displayedReviews.map((review, index) => (
            <span
              key={review._id || review.id}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              role="button"
              tabIndex={0}
              aria-label={`Show review ${index + 1}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setCurrentIndex(index);
              }}
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;