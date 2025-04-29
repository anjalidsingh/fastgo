import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  // References for animation elements
  const heroRef = useRef(null);
  const stepsRef = useRef(null);
  const featuresRef = useRef(null);

  // Handle scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    if (heroRef.current) observer.observe(heroRef.current);
    if (stepsRef.current) observer.observe(stepsRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);

    return () => {
      if (heroRef.current) observer.unobserve(heroRef.current);
      if (stepsRef.current) observer.unobserve(stepsRef.current);
      if (featuresRef.current) observer.unobserve(featuresRef.current);
    };
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section with Background Animation */}
      <section className="hero">
        <div className="animated-bg"></div>
        <div className="container hero-container">
          <div ref={heroRef} className="hero-content fade-in-up">
            <div className="hero-badge">Fast, Reliable, Affordable</div>
            <h1 className="hero-title">
              <span className="text-gradient">Fast</span> Deliveries at <span className="text-gradient">Lower</span> Prices
            </h1>
            <p className="hero-text">
              FastGo combines the best features of leading delivery services to provide reliable same-day deliveries at prices that won't break the bank.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary pulse">Sign Up</Link>
              <Link to="/login" className="btn btn-outline">Login</Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">5K+</span>
                <span className="stat-label">Deliveries</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">On time</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.9</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>
        <div className="wave-divider">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#f3f4f6" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,202.7C960,171,1056,117,1152,106.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps to get your package delivered quickly and affordably.
            </p>
          </div>
          
          <div ref={stepsRef} className="steps-grid fade-in">
            <div className="step-card">
              <div className="step-icon-wrapper">
                <div className="step-number">1</div>
                <div className="step-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <h3 className="step-title">Create an Order</h3>
              <p className="step-text">
                Sign up and provide pickup and delivery details. Our smart algorithm calculates the best price instantly.
              </p>
            </div>
            
            <div className="step-connector"></div>
            
            <div className="step-card">
              <div className="step-icon-wrapper">
                <div className="step-number">2</div>
                <div className="step-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
              </div>
              <h3 className="step-title">Delivery Partner Accepts</h3>
              <p className="step-text">
                A nearby delivery partner accepts your order and picks up your package promptly.
              </p>
            </div>
            
            <div className="step-connector"></div>
            
            <div className="step-card">
              <div className="step-icon-wrapper">
                <div className="step-number">3</div>
                <div className="step-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <h3 className="step-title">Track & Delivery</h3>
              <p className="step-text">
                Track your package in real-time until it's safely delivered to its destination.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose FastGo?</h2>
            <p className="section-subtitle">
              We combine the best features of leading delivery services with lower prices.
            </p>
          </div>
          
          <div ref={featuresRef} className="features-grid fade-in">
            <div className="feature-card">
              <div className="feature-icon fast">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Fast Delivery</h3>
              <p className="feature-text">
                Same-day delivery with real-time tracking for your peace of mind.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon price">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Lower Prices</h3>
              <p className="feature-text">
                10% lower than competitors without compromising on quality.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon trust">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="feature-title">Trusted Partners</h3>
              <p className="feature-text">
                Verified delivery partners for safe and secure deliveries.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon mobile">
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
      
      {/* Testimonials Section */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">
              Don't just take our word for it - hear from our satisfied customers.
            </p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "FastGo delivered my package in record time. The real-time tracking made it incredibly convenient to know exactly when it would arrive."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">SJ</div>
                <div className="testimonial-info">
                  <p className="testimonial-name">Sarah Johnson</p>
                  <p className="testimonial-position">Regular Customer</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "I've been using FastGo for my business deliveries for months. Their prices are unbeatable and the service is consistently excellent."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">MR</div>
                <div className="testimonial-info">
                  <p className="testimonial-name">Michael Rodriguez</p>
                  <p className="testimonial-position">Small Business Owner</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "The delivery partners are always professional and courteous. I feel confident knowing my packages are in good hands with FastGo."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">AP</div>
                <div className="testimonial-info">
                  <p className="testimonial-name">Aisha Patel</p>
                  <p className="testimonial-position">Frequent User</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to experience faster, cheaper deliveries?</h2>
            <p className="cta-text">
              Join thousands of satisfied customers who rely on FastGo every day.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-large">Create an Account</Link>
              <Link to="/services" className="btn btn-outline-white">Learn About Our Services</Link>
            </div>
            <div className="cta-features">
              <div className="cta-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>No subscription fees</span>
              </div>
              <div className="cta-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Pay only for what you use</span>
              </div>
              <div className="cta-feature">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Free cancellation</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;