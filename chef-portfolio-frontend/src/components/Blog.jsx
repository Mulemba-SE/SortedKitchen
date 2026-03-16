import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function Blog() {
  const posts = [
    {
      id: 1,
      title: "The Art of Plating: More Than Just Food",
      date: "October 15, 2023",
      excerpt: "Discover the philosophy behind our visual presentation and how aesthetics influence the perception of taste.",
      image: "https://placehold.co/600x400/1a1a1a/d4af37?text=Plating"
    },
    {
      id: 2,
      title: "Sourcing Local: A Chef's Journey",
      date: "September 28, 2023",
      excerpt: "Why we partner with local farmers and how fresh, seasonal ingredients make all the difference in our menu.",
      image: "https://placehold.co/600x400/1a1a1a/d4af37?text=Local+Sourcing"
    },
    {
      id: 3,
      title: "Pairing Wine with Modern Cuisine",
      date: "September 10, 2023",
      excerpt: "A guide to selecting the perfect vintage to complement the complex flavors of our signature dishes.",
      image: "https://placehold.co/600x400/1a1a1a/d4af37?text=Wine+Pairing"
    }
  ];

  const handleShare = (title) => {
    const url = window.location.href;
    navigator.clipboard.writeText(`${title} - ${url}`);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="blog-page-wrapper">
      <Navbar />
      <div className="blog-hero">
        <h1>Culinary Journal</h1>
        <p>Insights, stories, and news from the kitchen.</p>
      </div>

      <div className="recipe-section">
        <div className="recipe-card-featured">
          <div className="recipe-content">
            <span className="recipe-badge">Recipe of the Month</span>
            <h2>Classic Beef Wellington</h2>
            <p>Learn how to master this challenging yet rewarding dish with our step-by-step guide. Perfect for special occasions.</p>
            <button className="btn-primary">View Recipe</button>
          </div>
          <div className="recipe-image">
            <img src="https://placehold.co/600x400/1a1c23/d4af37?text=Beef+Wellington" alt="Beef Wellington" />
          </div>
        </div>
      </div>

      <div className="blog-container">
        <div className="blog-grid">
          {posts.map(post => (
            <article key={post.id} className="blog-card">
              <div className="blog-image">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="blog-content">
                <span className="blog-date">{post.date}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-actions">
                  <button className="btn-secondary">Read More</button>
                  <button className="btn-share" onClick={() => handleShare(post.title)}>Share</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Blog;