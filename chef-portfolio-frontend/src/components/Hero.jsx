import React, { useEffect, useState } from 'react';

function Hero() {
  const slides = [
    {
      src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      alt: 'Signature plated dish on a rustic table',
      headline: 'Taste the Heart of Kenya',
      captionTitle: 'Signature Plates',
      captionText: 'Bold flavors and modern Kenyan presentation.',
    },
    {
      src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      alt: 'Warm dining room ambiance',
      headline: 'An Evening to Remember',
      captionTitle: 'Dining Ambiance',
      captionText: 'A warm, intimate setting for every occasion.',
    },
    {
      src: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      alt: 'Chef plating a signature dish',
      headline: 'Crafted by Hand, Plated with Care',
      captionTitle: 'Chef at Work',
      captionText: 'Crafted to order, plated with care.',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <header className="hero" id="home">
      <div className="hero-slider" aria-label="Hero image carousel">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className={`hero-slide ${index === activeIndex ? 'active' : ''}`}
          >
            <img src={slide.src} alt={slide.alt} loading={index === 0 ? 'eager' : 'lazy'} />
            <div className="hero-caption" aria-hidden={index !== activeIndex}>
              <span className="hero-caption-title">{slide.captionTitle}</span>
              <span className="hero-caption-text">{slide.captionText}</span>
            </div>
          </div>
        ))}
      </div>
     
      <div className="hero-content">
        <h1>{slides[activeIndex].headline}</h1>
        <div className="hero-cta">
          <a className="btn-primary" href="/booking">Reserve</a>
        </div>
        <div className="hero-dots" role="tablist" aria-label="Select hero slide">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              className={`hero-dot ${index === activeIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </header>
  );
}

export default Hero;
