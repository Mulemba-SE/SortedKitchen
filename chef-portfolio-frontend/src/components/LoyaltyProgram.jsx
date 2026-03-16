import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function LoyaltyProgram() {
  const [points, setPoints] = useState(1250);

  const rewards = [
    { id: 1, title: "Free Dessert", cost: 500, image: "https://placehold.co/300x200/1a1c23/d4af37?text=Dessert" },
    { id: 2, title: "$50 Off Booking", cost: 1000, image: "https://placehold.co/300x200/1a1c23/d4af37?text=$50+Off" },
    { id: 3, title: "Private Cooking Class", cost: 5000, image: "https://placehold.co/300x200/1a1c23/d4af37?text=Cooking+Class" }
  ];

  const handleRedeem = (cost) => {
    if (points >= cost) {
      setPoints(points - cost);
      alert("Reward redeemed successfully! Check your email for the voucher.");
    } else {
      alert("Insufficient points.");
    }
  };

  return (
    <div className="loyalty-page-wrapper">
      <Navbar />
      <div className="loyalty-hero">
        <h1>Chef's Circle Rewards</h1>
        <p>Earn points for every dining experience and unlock exclusive perks.</p>
      </div>

      <div className="loyalty-container">
        <div className="points-card">
          <h2>Your Balance</h2>
          <div className="points-display">
            <span className="points-value">{points}</span>
            <span className="points-label">PTS</span>
          </div>
          <div className="tier-progress">
            <div className="tier-info">
              <span>Silver Member</span>
              <span>Gold Member (2500 PTS)</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(points / 2500) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="rewards-section">
          <h2>Redeem Rewards</h2>
          <div className="rewards-grid">
            {rewards.map(reward => (
              <div key={reward.id} className="reward-card">
                <img src={reward.image} alt={reward.title} />
                <div className="reward-info">
                  <h3>{reward.title}</h3>
                  <span className="reward-cost">{reward.cost} PTS</span>
                  <button 
                    className="btn-primary small" 
                    onClick={() => handleRedeem(reward.cost)}
                    disabled={points < reward.cost}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LoyaltyProgram;