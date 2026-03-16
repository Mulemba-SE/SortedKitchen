import React from 'react';

function Press() {
  const publications = [
    { name: "Food & Wine", logo: "https://placehold.co/200x100/1a1c23/d4af37?text=Food+%26+Wine" },
    { name: "Bon Appétit", logo: "https://placehold.co/200x100/1a1c23/d4af37?text=Bon+Appétit" },
    { name: "Michelin Guide", logo: "https://placehold.co/200x100/1a1c23/d4af37?text=Michelin" },
    { name: "Eater", logo: "https://placehold.co/200x100/1a1c23/d4af37?text=Eater" },
    { name: "The New York Times", logo: "https://placehold.co/200x100/1a1c23/d4af37?text=NYT+Cooking" }
  ];

  return (
    <section className="press-section">
      <div className="press-container">
        <h2>As Featured In</h2>
        <div className="press-grid">
          {publications.map((pub, index) => (
            <div key={index} className="press-item">
              <img src={pub.logo} alt={pub.name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Press;
