import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function GiftCards() {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [cart, setCart] = useState([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');

  const addToCart = (e) => {
    e.preventDefault();
    const amount = parseFloat(customAmount || selectedAmount);
    if (!amount || amount <= 0) return;

    const newItem = {
      id: Date.now(),
      amount,
      recipientName,
      recipientEmail,
      message
    };

    setCart([...cart, newItem]);
    // Reset form fields
    setRecipientName('');
    setRecipientEmail('');
    setMessage('');
    setCustomAmount('');
    alert('Gift card added to cart!');
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    const total = cart.reduce((sum, item) => sum + item.amount, 0);
    alert(`Proceeding to checkout with ${cart.length} items. Total: $${total}`);
  };

  return (
    <div className="gift-cards-page-wrapper">
      <Navbar />
      <div className="gift-hero">
        <h1>Give the Gift of Taste</h1>
        <p>Share an unforgettable culinary experience with friends and family.</p>
      </div>

      <div className="gift-container">
        <div className="gift-options">
          {[50, 100, 200, 500].map((amount) => (
            <div 
              key={amount} 
              className={`gift-card-option ${selectedAmount === amount && !customAmount ? 'selected' : ''}`}
              onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
            >
              <span className="amount">${amount}</span>
              <span className="label">Gift Card</span>
            </div>
          ))}
        </div>

        <div className="gift-form-container">
          <h2>Purchase Details</h2>
          <form onSubmit={addToCart}>
            <div className="form-group">
              <label>Custom Amount</label>
              <input 
                type="number" 
                placeholder="Enter custom amount" 
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Recipient Name</label>
              <input type="text" required placeholder="Jane Doe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Recipient Email</label>
              <input type="email" required placeholder="jane@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Personal Message</label>
              <textarea rows="3" placeholder="Enjoy a wonderful dinner!" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
            </div>
            <button type="submit" className="btn-primary">
              Add to Cart (${customAmount || selectedAmount})
            </button>
          </form>
        </div>
      </div>

      {/* Shopping Cart Section */}
      <div className="cart-section">
        <div className="cart-container">
          <h2>Your Cart</h2>
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-details">
                    <h4>${item.amount} Gift Card</h4>
                    <p>For: {item.recipientName} ({item.recipientEmail})</p>
                  </div>
                  <button className="btn-danger small" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              ))}
              <div className="cart-total">
                <h3>Total: ${cart.reduce((sum, item) => sum + item.amount, 0)}</h3>
                <button className="btn-primary" onClick={handleCheckout}>
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default GiftCards;