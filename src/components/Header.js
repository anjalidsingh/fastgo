import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logAnalyticsEvent } from '../services/firebase';

// NavItem component to reduce repetition
const NavItem = memo(({ to, onClick, className, children }) => (
  <li className="nav-item">
    {to ? (
      <Link to={to} className={className || "nav-link"}>
        {children}
      </Link>
    ) : (
      <button onClick={onClick} className={className || "btn-link"}>
        {children}
      </button>
    )}
  </li>
));
NavItem.displayName = 'NavItem';

// Logo component extracted for clarity
const Logo = memo(() => (
  <Link to="/" className="header-logo">
    {/* FastGo Logo SVG */}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" className="logo-svg">
      {/* Background Blur Effect */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>
      </defs>
      
      {/* Blur Effect Background */}
      <ellipse cx="150" cy="60" rx="120" ry="30" fill="url(#logoGradient)" opacity="0.2" filter="url(#blur)" />
      
      {/* Main Logo Group */}
      <g>
        {/* Fast Arrow Icon */}
        <g transform="translate(50, 50)">
          {/* Main Arrow */}
          <path d="M0,0 L40,0 L30,-15 L50,0 L30,15 L40,0 L0,0 Z" fill="#3b82f6" />
          
          {/* Speed Lines */}
          <path d="M-5,0 L-15,0" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
          <path d="M-12,-7 L-22,-7" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <path d="M-12,7 L-22,7" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        </g>
        
        {/* "FAST" Text */}
        <text x="110" y="45" fontFamily="'Inter', -apple-system, sans-serif" fontSize="28" fontWeight="700" fill="#2563eb">FAST</text>
        
        {/* "GO" Text with Accent Color */}
        <text x="192" y="45" fontFamily="'Inter', -apple-system, sans-serif" fontSize="28" fontWeight="800" fill="#f59e0b">GO</text>
        
        {/* Tagline */}
        <text x="110" y="65" fontFamily="'Inter', -apple-system, sans-serif" fontSize="11" letterSpacing="1" fill="#6b7280">DELIVERY SOLUTIONS</text>
      </g>
    </svg>
  </Link>
));
Logo.displayName = 'Logo';

// MenuButton component
const MenuButton = memo(({ isOpen, onClick }) => (
  <button
    className="menu-button"
    onClick={onClick}
    aria-label={isOpen ? "Close menu" : "Open menu"}
    aria-expanded={isOpen}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {isOpen ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  </button>
));
MenuButton.displayName = 'MenuButton';

// Main Header component
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userType, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close menu when location changes
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  // Memoize handlers to prevent rerenders
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);
  
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // Track logout event
      logAnalyticsEvent('user_logout');
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }, [logout, navigate]);
  
  // Customer navigation items
  const renderCustomerNav = useCallback(() => (
    <>
      <NavItem to="/dashboard">Dashboard</NavItem>
      <NavItem to="/create-order">Create Order</NavItem>
      <NavItem to="/orders">My Orders</NavItem>
    </>
  ), []);
  
  // Partner navigation items
  const renderPartnerNav = useCallback(() => (
    <NavItem to="/partner/dashboard">Dashboard</NavItem>
  ), []);
  
  return (
    <header className="header">
      <div className="container header-container">
        <Logo />
        
        <MenuButton isOpen={isMenuOpen} onClick={toggleMenu} />
        
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            {currentUser ? (
              <>
                {userType === 'customer' ? renderCustomerNav() : renderPartnerNav()}
                
                <NavItem 
                  to={userType === 'customer' ? "/profile" : "/partner/profile"}
                >
                  Profile
                </NavItem>
                
                <NavItem onClick={handleLogout} className="btn-link">
                  Logout
                </NavItem>
              </>
            ) : (
              <>
                <NavItem to="/login">Login</NavItem>
                <NavItem to="/register" className="btn">Sign Up</NavItem>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

// Use memo for the entire component
export default memo(Header);