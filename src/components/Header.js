import React, { useState, useCallback, memo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logAnalyticsEvent } from '../services/firebase';

// Enhanced Logo component
const Logo = memo(() => (
  <Link to="/" className="header-logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" className="logo-svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <g>
        {/* Fast Arrow Icon with Glow Effect */}
        <g transform="translate(50, 50)">
          <path d="M0,0 L40,0 L30,-15 L50,0 L30,15 L40,0 L0,0 Z" fill="url(#logoGradient)" filter="url(#glow)" />
          
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

// NavItem component
const NavItem = memo(({ to, onClick, className, children, icon, badge }) => (
  <li className="nav-item">
    {to ? (
      <Link to={to} className={className || "nav-link"}>
        {icon && <span className="nav-icon">{icon}</span>}
        <span className="nav-text">{children}</span>
        {badge && <span className="nav-badge">{badge}</span>}
      </Link>
    ) : (
      <button onClick={onClick} className={className || "btn-link"}>
        {icon && <span className="nav-icon">{icon}</span>}
        <span className="nav-text">{children}</span>
        {badge && <span className="nav-badge">{badge}</span>}
      </button>
    )}
  </li>
));
NavItem.displayName = 'NavItem';

// ProfileDropdown component
const ProfileDropdown = ({ userType, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const profileRef = React.useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="profile-dropdown" ref={profileRef}>
      <button className="profile-toggle" onClick={toggleDropdown}>
        <div className="profile-avatar">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="dropdown-arrow">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <strong>My Account</strong>
          </div>
          <Link to={userType === 'customer' ? "/profile" : "/partner/profile"} className="dropdown-item">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile
          </Link>
          <Link to="/orders" className="dropdown-item">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            My Orders
          </Link>
          <Link to="/settings" className="dropdown-item">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </Link>
          <div className="dropdown-divider"></div>
          <button onClick={onLogout} className="dropdown-item text-danger">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// Notification component
const NotificationBell = ({ count = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Your order #28FD92 has been assigned', time: '5 min ago', unread: true },
    { id: 2, message: 'Delivery partner is on the way', time: '20 min ago', unread: true },
    { id: 3, message: 'Your order #19DE78 has been delivered', time: '2 hours ago', unread: false }
  ]);
  const notifRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleNotifications = () => setIsOpen(!isOpen);
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="notification-bell" ref={notifRef}>
      <button className="notification-toggle" onClick={toggleNotifications}>
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                  <div className="notification-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div className="notification-content">
                    <p className="notification-text">{notif.message}</p>
                    <span className="notification-time">{notif.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-notifications">
                <p>No notifications yet</p>
              </div>
            )}
          </div>
          <div className="notification-footer">
            <Link to="/notifications" className="view-all-link">View all notifications</Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Header component
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userType, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close menu when location changes
  useEffect(() => {
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
      <NavItem 
        to="/dashboard" 
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        }
      >
        Dashboard
      </NavItem>
      <NavItem 
        to="/create-order"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        }
      >
        Create Order
      </NavItem>
      <NavItem 
        to="/orders"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        }
      >
        My Orders
      </NavItem>
      <NavItem 
        to="/track"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        }
      >
        Track
      </NavItem>
    </>
  ), []);
  
  // Partner navigation items
  const renderPartnerNav = useCallback(() => (
    <>
      <NavItem 
        to="/partner/dashboard"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        }
      >
        Dashboard
      </NavItem>
      <NavItem 
        to="/partner/orders"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        }
      >
        Orders
      </NavItem>
      <NavItem 
        to="/partner/earnings"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        }
      >
        Earnings
      </NavItem>
      <NavItem 
        to="/partner/performance"
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        }
      >
        Performance
      </NavItem>
    </>
  ), []);

  return (
    <header className="header">
      <div className="container header-container">
        <div className="header-left">
          <Logo />
          
          <button 
            className="menu-button" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            {currentUser ? (
              userType === 'customer' ? renderCustomerNav() : renderPartnerNav()
            ) : (
              <>
                <NavItem 
                  to="/"
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  }
                >
                  Home
                </NavItem>
                <NavItem 
                  to="/about"
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  }
                >
                  About
                </NavItem>
                <NavItem 
                  to="/services"
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  }
                >
                  Services
                </NavItem>
                <NavItem 
                  to="/contact"
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  }
                >
                  Contact
                </NavItem>
              </>
            )}
          </ul>
        </nav>
        
        <div className="header-right">
          {currentUser ? (
            <div className="header-actions">
              <Link to="/create-order" className="create-order-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="create-order-text">New Order</span>
              </Link>
              <NotificationBell />
              <ProfileDropdown userType={userType} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Use memo for the entire component
export default memo(Header);