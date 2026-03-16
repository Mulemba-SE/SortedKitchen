import React, { useEffect, useRef, useState } from 'react';

function FeaturedDishes() {
  const sectionRef = useRef(null);
  const observerRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [meals, setMeals] = useState([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const [mealsError, setMealsError] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(savedFavorites);

    fetch(`${apiUrl}/api/meals`)
      .then(res => res.json())
      .then(data => {
        setMeals(Array.isArray(data) ? data : []);
        setMealsError('');
      })
      .catch(err => {
        console.error('Error loading meals:', err);
        setMealsError('Unable to load meals right now.');
      })
      .finally(() => setIsLoadingMeals(false));

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll('.dish-card') || [];
    cards.forEach((card) => observerRef.current?.observe(card));
    return () => {
      cards.forEach((card) => observerRef.current?.unobserve(card));
    };
  }, [meals]);

  const toggleFavorite = (id) => {
    let newFavorites;
    if (favorites.includes(id)) {
      newFavorites = favorites.filter(favId => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const transformCloudinary = (url) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/f_auto,q_auto,w_700/');
    }
    return url;
  };

  const dishes = meals.map(meal => ({
    id: meal._id,
    name: meal.title,
    description: meal.description,
    price: meal.price ? `$${meal.price}` : '',
    imageUrl: transformCloudinary(meal.imageUrl)
  }));

  const visibleCount = 4;
  const maxStartIndex = Math.max(0, dishes.length - visibleCount);
  const visibleDishes = dishes.slice(startIndex, startIndex + visibleCount);

  useEffect(() => {
    if (startIndex > maxStartIndex) {
      setStartIndex(maxStartIndex);
    }
  }, [startIndex, maxStartIndex]);

  const goPrev = () => {
    if (dishes.length <= visibleCount || startIndex === 0) return;
    setStartIndex((prev) => prev - 1);
  };

  const goNext = () => {
    if (dishes.length <= visibleCount || startIndex >= maxStartIndex) return;
    setStartIndex((prev) => prev + 1);
  };

  return (
    <section className="featured" id="menu" ref={sectionRef}>
      <h2 className="section-title-with-icon">
        <span className="section-title-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" role="img" focusable="false">
            <circle cx="32" cy="32" r="22" />
            <circle cx="32" cy="32" r="12" />
          </svg>
        </span>
        Signature Dishes
      </h2>
      <div className="section-intro-row">
        <p className="section-intro">
          Explore our Sorted Kitchen favorites - seasonal ingredients, bold Kenyan flavors, and elegant presentation in every plate.
          A curated selection of chef-inspired creations that bring together flavor, elegance, and culinary artistry in every bite.
          From preparation to presentation, every detail reflects our dedication to quality and taste.
        </p>
        <video
          className="section-intro-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80"
        >
          <source src="https://videos.pexels.com/video-files/2620043/2620043-uhd_2560_1440_25fps.mp4" type="video/mp4" />
        </video>
      </div>
      {isLoadingMeals && <p className="helper-text">Loading meals...</p>}
      {mealsError && <p className="helper-text error">{mealsError}</p>}
      {!isLoadingMeals && !mealsError && dishes.length === 0 && (
        <p className="helper-text">No meals yet. Add your first dish in the admin dashboard.</p>
      )}
            <div className="dishes-grid-wrapper">
        <button
          type="button"
          className="dish-arrow dish-arrow-left"
          onClick={goPrev}
          aria-label="Previous dishes"
          disabled={dishes.length <= visibleCount || startIndex === 0}
        >
          &lsaquo;
        </button>
        <div className="dishes-grid images-only-grid">
          {visibleDishes.map((dish, index) => (
            <div key={`${dish.id}-${index}`} className="dish-item" style={{ transitionDelay: `${index * 100}ms` }}>
              <div className="dish-image-only fade-in visible">
                {dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span>[Image: {dish.name}]</span>
                )}
              </div>
              <div className="dish-meta">
                <span className="dish-title-below">{dish.name}</span>
                <span className="dish-desc-below">{dish.description}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="dish-arrow dish-arrow-right"
          onClick={goNext}
          aria-label="Next dishes"
          disabled={dishes.length <= visibleCount || startIndex >= maxStartIndex}
        >
          &rsaquo;
        </button>
      </div>
      <div className="featured-cta">
        <a className="btn-secondary" href="/gallery">Explore</a>
      </div>
    </section>  );
}

export default FeaturedDishes;


