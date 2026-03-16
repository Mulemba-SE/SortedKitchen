import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Link } from 'react-router-dom';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  
  // Master list of dishes (in a real app, this would come from an API or Context)
  const allDishes = [
    { id: 1, name: "Truffle Risotto", description: "Creamy arborio rice with black truffle and parmesan.", price: "$28" },
    { id: 2, name: "Pan-Seared Scallops", description: "Served with cauliflower purée and lemon butter.", price: "$32" },
    { id: 3, name: "Wagyu Beef", description: "A5 Wagyu with roasted root vegetables and red wine jus.", price: "$85" },
  ];

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(savedFavorites);
  }, []);

  const removeFavorite = (id) => {
    const newFavorites = favorites.filter(favId => favId !== id);
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const favoriteDishes = allDishes.filter(dish => favorites.includes(dish.id));

  return (
    <div className="favorites-page-wrapper">
      <Navbar />
      <div className="favorites-hero">
        <h1>Your Favorites</h1>
        <p>The dishes you love, saved for later.</p>
      </div>

      <div className="favorites-container">
        {favoriteDishes.length === 0 ? (
          <div className="empty-favorites">
            <p>You haven't saved any dishes yet.</p>
            <Link to="/menu" className="btn-primary">Browse Meals</Link>
          </div>
        ) : (
          <div className="dishes-grid">
            {favoriteDishes.map((dish) => (
              <div key={dish.id} className="dish-card">
                <div className="dish-image">[Image: {dish.name}]</div>
                <div className="dish-info">
                  <h3>{dish.name}</h3>
                  <p>{dish.description}</p>
                  <span className="price">{dish.price}</span>
                  <button className="btn-danger small" style={{marginTop: '1rem'}} onClick={() => removeFavorite(dish.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default FavoritesPage;
