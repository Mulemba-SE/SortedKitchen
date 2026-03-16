import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How far in advance do I need to book?",
      answer: "We recommend booking at least 2 weeks in advance for weekends and 1 week for weekdays to ensure availability."
    },
    {
      question: "Do you accommodate dietary restrictions?",
      answer: "Absolutely. We can tailor any menu to accommodate allergies, vegetarian, vegan, gluten-free, or other dietary needs. Please mention them when booking."
    },
    {
      question: "What is the cancellation policy?",
      answer: "Cancellations made 48 hours prior to the event are fully refundable. Cancellations within 48 hours may be subject to a 50% cancellation fee."
    },
    {
      question: "Do you provide the tableware and cutlery?",
      answer: "Yes, we bring our own high-end tableware, cutlery, and napkins to ensure a complete fine dining experience. We also handle the cleanup."
    },
    {
      question: "Is there a minimum number of guests?",
      answer: "Our private dining experiences are designed for intimate gatherings. We have a minimum charge equivalent to 2 guests, but we can cater to solo diners as well."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-page-wrapper">
      <Navbar />
      <div className="faq-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about our private dining experience.</p>
      </div>

      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => toggleAccordion(index)}>
              <h3>{faq.question}</h3>
              <span className="faq-icon">{activeIndex === index ? '−' : '+'}</span>
            </div>
            <div className="faq-answer">
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default FAQ;