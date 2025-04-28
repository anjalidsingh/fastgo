import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Fast Deliveries at Lower Prices</h1>
            <p className="hero-text">
              FastGo combines the best features of Wefast and Borzo to provide reliable same-day deliveries at prices that won't break the bank.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn">Sign Up</Link>
              <Link to="/login" className="btn btn-outline">Login</Link>
            </div>
          </div>
          
        </div>
      </section>
      
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Three simple steps to get your package delivered quickly and affordably.
          </p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create an Order</h3>
              <p className="step-text">
                Sign up and provide pickup and delivery details. Our smart algorithm calculates the best price.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Delivery Partner Accepts</h3>
              <p className="step-text">
                A nearby delivery partner accepts your order and picks up your package promptly.
              </p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Track & Delivery</h3>
              <p className="step-text">
                Track your package in real-time until it's safely delivered to its destination.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Choose FastGo?</h2>
          <p className="section-subtitle">
            We combine the best features of leading delivery services with lower prices.
          </p>
          
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Fast Delivery</h3>
              <p className="feature-text">
                Same-day delivery with real-time tracking for your peace of mind.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Lower Prices</h3>
              <p className="feature-text">
                10% lower than competitors without compromising on quality.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="feature-title">Trusted Partners</h3>
              <p className="feature-text">
                Verified delivery partners for safe and secure deliveries.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="feature-title">Mobile Friendly</h3>
              <p className="feature-text">
                Responsive design that works great on all devices.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to get started?</h2>
          <p className="cta-text">
            Sign up now and experience the best delivery service at lower prices.
          </p>
          <Link to="/register" className="btn">Create an Account</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
