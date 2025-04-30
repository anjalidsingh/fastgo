import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Core components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded pages - critical for initial load
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Main styles
import './styles/main.css';
// Import the new static pages styling


// Import Map stylesheet (Leaflet CSS)
import 'leaflet/dist/leaflet.css';

// Lazy loaded pages for better performance
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const CreateOrder = lazy(() => import(/* webpackChunkName: "createOrder" */ './pages/CreateOrder'));
const OrderDetails = lazy(() => import(/* webpackChunkName: "orderDetails" */ './pages/OrderDetails'));
const OrderHistory = lazy(() => import(/* webpackChunkName: "orderHistory" */ './pages/OrderHistory'));
const PartnerDashboard = lazy(() => import(/* webpackChunkName: "partnerDashboard" */ './pages/PartnerDashboard'));
const CustomerProfile = lazy(() => import(/* webpackChunkName: "customerProfile" */ './pages/CustomerProfile'));
const PartnerProfile = lazy(() => import(/* webpackChunkName: "partnerProfile" */ './pages/PartnerProfile'));
const PaymentMethod = lazy(() => import(/* webpackChunkName: "paymentMethod" */ './components/PaymentMethod'));

// Static pages with enhanced styling
// Terms of Service page
const TermsOfService = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">Terms of Service</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">Terms of Service</h1>
        <p className="static-page-hero-text">Please read these terms carefully before using our services</p>
      </div>
    </div>

    <div className="static-page-card">
      <section className="static-page-section">
        <h2 className="section-title">1. Introduction</h2>
        <div className="info-box">
          <p className="mb-2">Welcome to FastGo! These Terms of Service ("Terms") govern your use of the FastGo application, website, and services (collectively, the "Service"). By using FastGo, you agree to these Terms. If you do not agree, you may not use the Service.</p>
          <p>FastGo provides a platform that connects customers with delivery partners for efficient, affordable delivery services.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">2. User Accounts</h2>
        <div className="info-box">
          <p className="mb-2">You must create an account to use certain features of the Service. You are responsible for maintaining the confidentiality of your account information and for all activity under your account.</p>
          <p className="mb-2">You must provide accurate, current, and complete information during the registration process and keep your account information updated.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">3. Service Description</h2>
        <div className="info-box">
          <p className="mb-2">FastGo enables customers to request delivery services from independent delivery partners. FastGo does not provide delivery services directly but facilitates the connection between customers and delivery partners.</p>
          <p className="mb-2">While we strive to ensure reliable service, we cannot guarantee the availability of delivery partners at all times or in all locations.</p>
          <p>We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">4. Fees and Payments</h2>
        <div className="info-box">
          <p className="mb-2">Customers agree to pay all fees associated with using the Service. Fees are calculated based on distance, package size, delivery type, and other factors.</p>
          <p className="mb-2">For Cash on Delivery (COD) payments, customers must pay the delivery partner the full amount upon delivery.</p>
          <p className="mb-2">Delivery partners receive a percentage of the total delivery fee, which varies based on order value and type.</p>
          <p>We reserve the right to change our fee structure at any time with reasonable notice.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">5. User Conduct</h2>
        <div className="info-box">
          <p className="mb-2">Users must not use the Service for any illegal purposes or to transmit any harmful, threatening, abusive, or objectionable content.</p>
          <p className="mb-2">Users must not interfere with the proper functioning of the Service or attempt to gain unauthorized access to the Service or its systems.</p>
          <p>Users are responsible for all content they provide through the Service.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">6. Prohibited Items</h2>
        <div className="info-box info-box-warning">
          <p className="mb-2">Users must not request delivery of:</p>
          <ul className="circle-list mb-2">
            <li>Illegal substances or items</li>
            <li>Hazardous materials</li>
            <li>Firearms, ammunition, or weapons</li>
            <li>Counterfeit goods</li>
            <li>Stolen property</li>
            <li>Any items that violate applicable laws</li>
          </ul>
          <p>FastGo reserves the right to refuse or cancel any delivery that violates this policy.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">7. Limitation of Liability</h2>
        <div className="info-box">
          <p className="mb-2">To the maximum extent permitted by law, FastGo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.</p>
          <p>Our liability is limited to the amount paid by you to FastGo in the three months preceding the event giving rise to liability.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">8. Changes to Terms</h2>
        <div className="info-box">
          <p className="mb-2">We may modify these Terms at any time. If we make material changes, we will provide notice through the Service or by other means.</p>
          <p>Your continued use of the Service after any changes indicates your acceptance of the modified Terms.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">9. Contact Information</h2>
        <div className="info-box">
          <p>For questions about these Terms, please contact us at <a href="mailto:support@fastgo.com">support@fastgo.com</a>.</p>
        </div>
      </section>
      
      <div className="last-updated">
        Last Updated: April 30, 2025
      </div>
    </div>
  </div>
);

// Privacy Policy page
const PrivacyPolicy = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">Privacy Policy</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">Privacy Policy</h1>
        <p className="static-page-hero-text">How we collect, use, and protect your information</p>
      </div>
    </div>

    <div className="static-page-card">
      <section className="static-page-section">
        <h2 className="section-title">1. Introduction</h2>
        <div className="info-box">
          <p className="mb-2">FastGo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application, website, and services (collectively, the "Service").</p>
          <p>Please read this Privacy Policy carefully. By using the Service, you consent to the practices described in this policy.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">2. Information We Collect</h2>
        <div className="info-box">
          <p className="mb-2">We collect several types of information from and about users of our Service:</p>
          <ul className="circle-list">
            <li><strong>Personal Information:</strong> Name, email address, phone number, physical address, payment information</li>
            <li><strong>Profile Information:</strong> User preferences, delivery history, feedback and ratings</li>
            <li><strong>Location Data:</strong> GPS location when using our mobile application</li>
            <li><strong>Device Information:</strong> Device type, IP address, browser type, operating system</li>
            <li><strong>Usage Data:</strong> How you interact with our Service, including pages visited and features used</li>
          </ul>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">3. How We Use Your Information</h2>
        <div className="info-box info-box-primary">
          <p className="mb-2">We use the information we collect to:</p>
          <ul className="check-list">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process and manage delivery orders</li>
            <li>Connect customers with delivery partners</li>
            <li>Communicate with you about your account and orders</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Detect, prevent, and address technical issues and fraudulent activities</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>
      </section>

      <div className="static-page-cta">
        <h3 className="static-page-cta-title">Ready to experience FastGo?</h3>
        <p className="static-page-cta-text">Join thousands of satisfied customers who trust us with their deliveries</p>
        <Link to="/register" className="static-page-cta-button">Sign Up Now</Link>
      </div>
      
      <div className="last-updated">
        Last Updated: April 30, 2025
      </div>
    </div>
  </div>
);

// Cookie Policy page
const CookiePolicy = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">Cookie Policy</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">Cookie Policy</h1>
        <p className="static-page-hero-text">Understanding how we use cookies and similar technologies</p>
      </div>
    </div>

    <div className="static-page-card">
      <section className="static-page-section">
        <h2 className="section-title">1. Introduction</h2>
        <div className="info-box">
          <p className="mb-2">This Cookie Policy explains how FastGo ("we," "our," or "us") uses cookies and similar technologies on our website and mobile application (collectively, the "Service").</p>
          <p>By using our Service, you agree to our use of cookies in accordance with this Cookie Policy.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">2. What Are Cookies?</h2>
        <div className="info-box info-box-primary">
          <div className="flex items-start mb-3">
            <div className="bg-primary-light text-primary p-3 rounded-full mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
            </div>
            <div>
              <p className="mb-2">Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.</p>
              <p>Cookies may be "persistent" cookies or "session" cookies. Persistent cookies remain on your device after you close your browser, while session cookies are deleted when you close your browser.</p>
            </div>
          </div>
        </div>
      </section>
      
      <div className="last-updated">
        Last Updated: April 30, 2025
      </div>
    </div>
  </div>
);

// About Us page
const AboutUs = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">About Us</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">About FastGo</h1>
        <p className="static-page-hero-text">Revolutionizing the local delivery industry</p>
      </div>
    </div>

    <div className="static-page-card">
      <section className="static-page-section">
        <div className="info-box info-box-primary">
          <h2 className="text-xl font-semibold mb-3 text-primary">Our Mission</h2>
          <p className="mb-4">FastGo is revolutionizing the local delivery industry by providing faster, more reliable, and more affordable delivery services for everyone. We connect customers with trusted delivery partners to create a seamless experience that benefits both sides of the marketplace.</p>
          <p>Our mission is to make local delivery accessible to all by cutting out unnecessary costs while maintaining high service quality.</p>
        </div>
      </section>
      
      <section className="static-page-section">
        <h2 className="section-title">Our Story</h2>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-3/4 pr-0 md:pr-8">
            <p className="mb-4">FastGo was founded in 2023 by a team of logistics experts and technology innovators who recognized a gap in the market: existing delivery services were either too expensive or too unreliable.</p>
            <p className="mb-4">Starting with just 20 delivery partners in Bangalore, we've grown to thousands of partners across major cities in India, completing over 100,000 deliveries monthly.</p>
            <p>We built FastGo on the principle that technology can streamline logistics, reduce costs, and improve reliability - creating a better experience for both customers and delivery partners.</p>
          </div>
          <div className="md:w-1/4 flex justify-center items-center mt-6 md:mt-0">
            <div className="w-32 h-32 bg-primary-light rounded-full flex items-center justify-center">
              <svg className="w-20 h-20 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>
      
      <div className="static-page-cta">
        <h3 className="static-page-cta-title">Join the FastGo revolution</h3>
        <p className="static-page-cta-text">Experience the future of local delivery today</p>
        <Link to="/register" className="static-page-cta-button">Get Started</Link>
      </div>
      
      <div className="last-updated">
        Last Updated: April 30, 2025
      </div>
    </div>
  </div>
);

// Standard Delivery page
const StandardDelivery = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <Link to="/services" className="breadcrumb-link">Services</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">Standard Delivery</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">Standard Delivery</h1>
        <p className="static-page-hero-text">Our most popular delivery option for everyday needs</p>
      </div>
    </div>

    <div className="static-page-card">
      {/* Service Badge and Intro */}
      <div className="mb-6">
        <span className="badge badge-primary mb-2">MOST POPULAR</span>
        <h2 className="text-2xl font-bold mb-3">Our reliable, cost-effective delivery option for non-urgent packages.</h2>
        <div className="divider-gradient"></div>
      </div>

      {/* Service Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="feature-item">
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">Same-day delivery</h3>
          <p className="feature-text">Orders placed before 3:00 PM are delivered the same day</p>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">Delivery confirmation</h3>
          <p className="feature-text">Receive notifications when your package is delivered</p>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </div>
          <h3 className="feature-title">Real-time tracking</h3>
          <p className="feature-text">Track your package's journey in real-time</p>
        </div>

        <div className="feature-item">
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h3 className="feature-title">Insurance included</h3>
          <p className="feature-text">Insurance up to ₹5,000 included with every delivery</p>
        </div>
      </div>

      {/* Large Delivery Icon - Properly styled */}
      <div className="flex justify-center my-8">
        <div className="w-40 h-40 rounded-full bg-primary-transparent flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="70%" height="70%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="16" x2="16" y2="16"></line>
            <line x1="8" y1="16" x2="8" y2="16"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-primary-transparent p-6 rounded-lg mt-8">
        <h2 className="text-xl font-semibold text-primary mb-3">Why Choose Standard Delivery?</h2>
        <p className="mb-0">Our standard delivery service offers the perfect balance of speed, reliability, and cost-effectiveness. It's ideal for most everyday delivery needs when you don't require express speed but still want reliable, tracked delivery.</p>
      </div>

      {/* CTA Section */}
      <div className="static-page-cta mt-8">
        <h3 className="static-page-cta-title">Ready to get started with Standard Delivery?</h3>
        <p className="static-page-cta-text">Experience the perfect balance of speed, reliability, and cost-effectiveness for your delivery needs.</p>
        <Link to="/register" className="static-page-cta-button">Get Started Now</Link>
      </div>

      <div className="last-updated">
        Last Updated: April 30, 2025
      </div>
    </div>
  </div>
);

// Services overview page
const Services = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">Our Services</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">Our Delivery Services</h1>
        <p className="static-page-hero-text">Solutions designed to meet all your delivery needs</p>
      </div>
    </div>

    <div className="static-page-card">
      <p className="mb-8">FastGo offers a range of delivery options designed to meet your specific needs, whether you require speed, economy, or volume shipping.</p>
      
      <div className="card-grid">
        <div className="card-grid-item">
          <div className="card-grid-header bg-primary text-white">
            <h2 className="text-center font-semibold">Standard Delivery</h2>
          </div>
          <div className="card-grid-body">
            <span className="badge badge-primary mb-3">MOST POPULAR</span>
            <p className="mb-4">Our reliable, cost-effective delivery option for non-urgent packages.</p>
            <ul className="mb-6 check-list">
              <li>Same-day delivery</li>
              <li>Packages up to 25kg</li>
              <li>Real-time tracking</li>
              <li>10% lower than market rates</li>
            </ul>
            <div className="text-center">
              <Link to="/services/standard" className="btn bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-all">Learn More</Link>
            </div>
          </div>
        </div>
        
        <div className="card-grid-item">
          <div className="card-grid-header" style={{backgroundColor: '#8b5cf6', color: 'white'}}>
            <h2 className="text-center font-semibold">Express Delivery</h2>
          </div>
          <div className="card-grid-body">
            <span className="badge badge-success mb-3">FASTEST OPTION</span>
            <p className="mb-4">Our fastest delivery option for time-sensitive packages.</p>
            <ul className="mb-6 check-list">
              <li>Delivery within 2-3 hours</li>
              <li>Priority handling</li>
              <li>Dedicated delivery partners</li>
              <li>Enhanced insurance coverage</li>
            </ul>
            <div className="text-center">
              <Link to="/services/express" className="btn text-white px-6 py-2 rounded-lg transition-all" style={{backgroundColor: '#8b5cf6', hover: {backgroundColor: '#7c3aed'}}}>Learn More</Link>
            </div>
          </div>
        </div>
        
        <div className="card-grid-item">
          <div className="card-grid-header bg-success text-white">
            <h2 className="text-center font-semibold">Bulk Shipping</h2>
          </div>
          <div className="card-grid-body">
            <span className="badge badge-warning mb-3">BEST VALUE</span>
            <p className="mb-4">Efficient solutions for businesses and individuals with multiple packages.</p>
            <ul className="mb-6 check-list">
              <li>Volume discounts</li>
              <li>Batch order processing</li>
              <li>Dedicated account manager</li>
              <li>Customizable delivery schedules</li>
            </ul>
            <div className="text-center">
              <Link to="/services/bulk" className="btn bg-success text-white px-6 py-2 rounded-lg hover:bg-success-hover transition-all">Learn More</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="static-page-cta">
        <h3 className="static-page-cta-title">Need a customized solution?</h3>
        <p className="static-page-cta-text">Our business team can help you create a delivery solution tailored to your specific needs.</p>
        <a href="mailto:business@fastgo.com" className="static-page-cta-button">Contact Business Team</a>
      </div>
    </div>
  </div>
);

// Contact page
const Contact = () => (
  <div className="static-page-container animate-fade-in">
    <div className="breadcrumb mb-4">
      <div className="breadcrumb-item">
        <Link to="/" className="breadcrumb-link">Home</Link>
      </div>
      <div className="breadcrumb-item">
        <span className="breadcrumb-current">Contact Us</span>
      </div>
    </div>

    <div className="static-page-hero">
      <div className="static-page-hero-content">
        <h1 className="static-page-hero-title">Contact Us</h1>
        <p className="static-page-hero-text">We're here to help with any questions you may have</p>
      </div>
    </div>

    <div className="static-page-card">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="section-title">Get In Touch</h2>
          <p className="mb-6">We're here to help with any questions, concerns, or feedback you may have. Choose the contact method that works best for you.</p>
          
          <div className="space-y-6">
            <div className="info-box flex">
              <div className="bg-primary-light p-3 rounded-full mr-4 flex-shrink-0">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Us</h3>
                <p className="text-gray-600 mb-2 text-sm">We'll respond within 24 hours</p>
                <div className="space-y-1 text-sm">
                  <p><strong>General Inquiries:</strong> <a href="mailto:info@fastgo.com" className="text-primary hover:underline">info@fastgo.com</a></p>
                  <p><strong>Customer Support:</strong> <a href="mailto:support@fastgo.com" className="text-primary hover:underline">support@fastgo.com</a></p>
                  <p><strong>Partner Support:</strong> <a href="mailto:partners@fastgo.com" className="text-primary hover:underline">partners@fastgo.com</a></p>
                </div>
              </div>
            </div>
            
            <div className="info-box flex">
              <div className="bg-success-light p-3 rounded-full mr-4 flex-shrink-0">
                <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Call Us</h3>
                <p className="text-gray-600 mb-2 text-sm">Available 7 days a week, 8 AM - 10 PM</p>
                <div className="space-y-1 text-sm">
                  <p><strong>Customer Service:</strong> <a href="tel:+919876543210" className="text-primary hover:underline">+91 9876543210</a></p>
                  <p><strong>Partner Support:</strong> <a href="tel:+919876543211" className="text-primary hover:underline">+91 9876543211</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="section-title">Send us a Message</h2>
          <form className="info-box">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
                <input type="text" id="name" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input type="email" id="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="subject">Subject</label>
              <select id="subject" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Customer Support</option>
                <option value="partner">Partner Support</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="message">Message</label>
              <textarea id="message" rows="5" className="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>
            
            <button type="submit" className="btn bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark w-full transition-all">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced loading fallback
const Fallback = () => (
  <div className="flex items-center justify-center min-h-screen p-4">
    <LoadingSpinner size="large" text="Loading content..." />
  </div>
);

// Auth Redirect component with memoization
const AuthRedirect = () => {
  const { currentUser, userType, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect if auth is loaded and we have a user
    if (!loading && currentUser) {
      const publicPaths = ['/', '/login', '/register'];
      
      // If user is on a public path, redirect to the appropriate dashboard
      if (publicPaths.includes(location.pathname)) {
        if (userType === 'customer') {
          navigate('/dashboard', { replace: true });
        } else if (userType === 'partner') {
          navigate('/partner/dashboard', { replace: true });
        }
      }
    }
  }, [currentUser, userType, loading, location.pathname, navigate]);
  
  return null;
};

function App() {
  return (
    <Router>
      <ErrorBoundary fallback={<div className="container py-8 text-center">Something went wrong. Please refresh the page.</div>}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <AuthRedirect />
            <Header />
            <main className="flex-grow">
              <ErrorBoundary fallback={<div className="container py-8">Error loading content. Please try again later.</div>}>
                <Suspense fallback={<Fallback />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Enhanced Static pages with new styling */}
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/services/standard" element={<StandardDelivery />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* Customer routes */}
                    <Route path="/dashboard" element={
                      <PrivateRoute requiredType="customer">
                        <Dashboard />
                      </PrivateRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <PrivateRoute requiredType="customer">
                        <CustomerProfile />
                      </PrivateRoute>
                    } />
                    
                    <Route path="/create-order" element={
                      <PrivateRoute requiredType="customer">
                        <CreateOrder />
                      </PrivateRoute>
                    } />
                    
                    <Route path="/order/:orderId" element={
                      <PrivateRoute>
                        <OrderDetails />
                      </PrivateRoute>
                    } />
                    
                    <Route path="/orders" element={
                      <PrivateRoute>
                        <OrderHistory />
                      </PrivateRoute>
                    } />
                    
                    {/* Partner routes */}
                    <Route path="/partner/dashboard" element={
                      <PrivateRoute requiredType="partner">
                        <PartnerDashboard />
                      </PrivateRoute>
                    } />
                    
                    <Route path="/partner/profile" element={
                      <PrivateRoute requiredType="partner">
                        <PartnerProfile />
                      </PrivateRoute>
                    } />
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;