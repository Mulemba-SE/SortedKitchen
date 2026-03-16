import React from 'react';

function Gallery() {
  const services = [
    {
      id: 1,
      title: 'Private Airbnb Dining',
      description: 'Curated in-home menus and plated service for intimate stays.',
      image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      title: 'Small Event Catering',
      description: 'Elevated catering for celebrations, meetings, and gatherings.',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      title: 'Kitchen Clean Up',
      description: 'Post-service reset with spotless counters and tidy spaces.',
      image: 'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 4,
      title: 'Grocery Shopping',
      description: 'Seasonal ingredient sourcing with quality-first selection.',
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 5,
      title: 'Custom Menu Planning',
      description: 'Menus tailored to dietary needs, style, and budget.',
      image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 6,
      title: 'In-home Meal Preparation',
      description: 'Freshly prepared meals ready to enjoy throughout the week.',
      image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 7,
      title: 'In-home Cooking Classes',
      description: 'Hands-on lessons focused on technique and flavor.',
      image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 8,
      title: 'Kitchen & Pantry Management',
      description: 'Organized pantries, smart stocking, and kitchen flow.',
      image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    },
  ];

  const chefAboutSections = [
    {
      title: 'Introduction',
      body:
        'Sorted Kitchen is led by Chef Mwendwa, a professional private chef who delivers restaurant-quality dining experiences in private homes, villas, and exclusive event spaces. Each service is designed around the client\'s vision, guest profile, and occasion, with close attention to menu flow, presentation, and hospitality. The goal is to create memorable dining moments that feel both elevated and deeply personal.',
    },
    {
      title: 'Culinary Background',
      body:
        'The chef developed a strong culinary foundation through formal training, practical kitchen leadership, and hands-on event execution. This background combines core culinary principles, precise cooking methods, and modern plating standards. Years of experience in high-pressure service environments have shaped a disciplined, detail-oriented approach to consistency, flavor balance, and professional kitchen workflow.',
    },
    {
      title: 'Cooking Styles and Specialties',
      body:
        'Signature styles include contemporary plated dining, elevated comfort cuisine, and curated multi-course tasting menus. Specialties range from intimate private dinners to celebratory event menus, with thoughtful pairing of proteins, seasonal vegetables, sauces, and textures. The chef also creates custom dishes for dietary needs, including gluten-free, dairy-free, low-carb, and plant-forward preferences without compromising flavor or presentation.',
    },
    {
      title: 'Philosophy and Passion',
      body:
        'The culinary philosophy is rooted in seasonality, ingredient integrity, and genuine hospitality. Every plate is built to achieve balance in taste, aroma, texture, and visual appeal, while still reflecting the client\'s personal preferences. Beyond cooking, the chef is passionate about creating warm, seamless experiences where guests feel cared for, connected, and fully present in the moment.',
    },
    {
      title: 'Services Offered',
      body:
        'Services include private chef dining, custom menu development, small event catering, in-home meal preparation, and kitchen support services. Clients can book for anniversaries, birthdays, vacation stays, corporate gatherings, and family events. Packages can include ingredient sourcing, on-site cooking, plated service, cleanup, and optional add-ons tailored to guest count, service style, and budget.',
    },
  ];
  const chefHighlights = [
    'Private chef for intimate and premium events',
    'Custom menus for dietary and cultural preferences',
    'Full service from sourcing to plated presentation',
  ];

  return (
    <section className="gallery" id="gallery">
      <h2>Services</h2>
      <div className="gallery-grid services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-image">
              <img src={service.image} alt={service.title} loading="lazy" decoding="async" />
            </div>
            <span className="service-title">{service.title}</span>
            <p className="service-description">{service.description}</p>
          </div>
        ))}
      </div>

      <section className="chef-about-section" id="about" aria-labelledby="chef-about-title">
        <div className="chef-about-layout">
          <div className="chef-about-header">
            <h3 id="chef-about-title">About The Chef</h3>
            <p className="chef-about-intro">
              Behind the Flavor
            </p>
          </div>

          <div className="chef-about-body">
            <div className="chef-about-column">
              {chefAboutSections.map((section) => (
                <article key={section.title} className="chef-about-card">
                  <div className="chef-about-card-header">
                    <h4>{section.title}</h4>
                  </div>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>

            <div className="chef-about-media" aria-label="Professional chef photo">
              <div className="chef-about-image chef-about-image-main">
                <img
                  src="/images/Capture.PNG"
                  alt="Professional portrait of the chef in a kitchen setting."
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <aside className="chef-about-highlights" aria-label="Chef profile highlights">
                <h4>Profile Highlights</h4>
                <ul>
                  {chefHighlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </aside>

              <div className="chef-share" aria-label="Share chef profile">
                <p className="chef-share-title">Sharing is caring!</p>
                <div className="chef-share-links">
                  <a href="#" aria-label="Share on X" className="social-icon social-icon-x">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      <path d="M18.9 4h-2.7l-4 4.6L8.5 4H3.9l6 7.8L3.5 20h2.7l4.9-5.6 4.3 5.6h4.6l-6.3-8.2L18.9 4z" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Share on Facebook" className="social-icon social-icon-facebook">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v5h3v-5h3l1-3h-4V9c0-.6.4-1 1-1z" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Share on Pinterest" className="social-icon social-icon-pinterest">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      <path d="M12 3a9 9 0 0 0-3.3 17.4l1.1-4.3c-.3-.6-.5-1.6-.5-2.5 0-2.1 1.2-3.7 2.8-3.7 1.3 0 1.9 1 1.9 2.2 0 1.4-.9 3.4-1.3 5.3-.4 1.6.9 3 2.6 3 3.1 0 5.2-3.9 5.2-8.4 0-3.5-2.4-6.1-6.7-6.1-4.9 0-7.9 3.7-7.9 7.8 0 1.4.4 2.4 1 3.2.3.3.3.5.2.9l-.3 1.2c-.1.4-.4.5-.8.4-2-0.8-2.9-3-2.9-5.4C3 8 6.7 3 12 3z" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Share on WhatsApp" className="social-icon social-icon-whatsapp">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      <path d="M20 11.9a8 8 0 0 1-11.8 7l-3.2 1 1-3.1A8 8 0 1 1 20 11.9zm-4.6 2.2c-.2-.1-1.2-.6-1.4-.7-.2-.1-.4-.1-.6.1s-.6.7-.8.8c-.1.1-.3.1-.5 0-.2-.1-.9-.3-1.7-1-.6-.5-1-1.2-1.2-1.4-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4l.2-.4c.1-.2 0-.3 0-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.4.9 2.5c.1.2 1.6 2.5 3.8 3.4.5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.2-.5 1.3-1 .2-.5.2-.9.1-1z" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Share by Email" className="social-icon social-icon-email">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm9 6 8-5H4l8 5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default Gallery;
