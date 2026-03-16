import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function Careers() {
  const jobs = [
    {
      id: 1,
      title: "Sous Chef",
      type: "Full-time",
      location: "Food City, FC",
      description: "We are looking for an experienced Sous Chef to assist in managing our kitchen and ensuring high standards of culinary excellence."
    },
    {
      id: 2,
      title: "Pastry Chef",
      type: "Part-time",
      location: "Food City, FC",
      description: "Create exquisite desserts and pastries for our fine dining menu. Must have a passion for sweets and attention to detail."
    },
    {
      id: 3,
      title: "Front of House Manager",
      type: "Full-time",
      location: "Food City, FC",
      description: "Lead our service team to provide impeccable hospitality. Experience in luxury dining is preferred."
    }
  ];

  return (
    <div className="careers-page-wrapper">
      <Navbar />
      <div className="careers-hero">
        <h1>Join Our Team</h1>
        <p>Be part of a culinary journey that redefines fine dining.</p>
      </div>

      <div className="careers-container">
        {jobs.map(job => (
          <div key={job.id} className="job-card">
            <h3>{job.title}</h3>
            <div className="job-meta"><span>{job.type}</span> • <span>{job.location}</span></div>
            <p>{job.description}</p>
            <button className="btn-secondary small">Apply Now</button>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default Careers;