import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-main">
          <div className="footer-info">
            <h2 className="footer-logo">FastGo</h2>
            <p className="footer-description">
              Fast and reliable delivery service at lower prices. We connect you with trusted delivery partners in your area.
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-group">
              <h3 className="footer-group-title">Quick Links</h3>
              <ul className="footer-nav">
                <li className="footer-nav-item">
                  <Link to="/" className="footer-nav-link">Home</Link>
                </li>
                <li className="footer-nav-item">
                  <Link to="/login" className="footer-nav-link">Login</Link>
                </li>
                <li className="footer-nav-item">
                  <Link to="/register" className="footer-nav-link">Sign Up</Link>
                </li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h3 className="footer-group-title">Services</h3>
              <ul className="footer-nav">
                <li className="footer-nav-item">
                  <Link to="/services/standard" className="footer-nav-link">Standard Delivery</Link>
                </li>
                <li className="footer-nav-item">
                  <Link to="/services/express" className="footer-nav-link">Express Delivery</Link>
                </li>
                <li className="footer-nav-item">
                  <Link to="/services/bulk" className="footer-nav-link">Bulk Shipping</Link>
                </li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h3 className="footer-group-title">Contact</h3>
              <ul className="footer-nav">
                <li className="footer-nav-item">support@fastgo.com</li>
                <li className="footer-nav-item">+91 9876543210</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-copyright">&copy; 2025 FastGo. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/terms" className="footer-bottom-link">Terms</Link>
            <Link to="/privacy" className="footer-bottom-link">Privacy</Link>
            <Link to="/cookies" className="footer-bottom-link">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;