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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="testimonials" id="testimonials">
      <h2>What Our Guests Say</h2>
      <div className="testimonial-slider">
        <div className="testimonial-card">
          <p>"{testimonials[currentIndex].text}"</p>
          <div className="author">
            <h4>{testimonials[currentIndex].author}</h4>
            <span>{testimonials[currentIndex].role}</span>
          </div>
        </div>
        <div className="slider-dots">
          {testimonials.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;