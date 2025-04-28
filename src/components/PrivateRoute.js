import React, { memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Using memo to prevent unnecessary re-renders
const PrivateRoute = memo(({ children, requiredType }) => {
  const { currentUser, userType, loading, error } = useAuth();
  const location = useLocation();

  // Show better loading state
  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" color="primary" />
        <p className="loading-text">Authenticating...</p>
      </div>
    );
  }

  // Handle authentication errors
  if (error) {
    return (
      <div className="error-container">
        <div className="form-error">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="error-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Authentication error. Please try logging in again.</span>
        </div>
        <button 
          onClick={() => window.location.href = '/login'}
          className="btn mt-4"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    // Save the location they were trying to access for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user type if specified
  if (requiredType && userType !== requiredType) {
    // Redirect to appropriate dashboard based on user type
    if (userType === 'customer') {
      return <Navigate to="/dashboard" replace />;
    } else if (userType === 'partner') {
      return <Navigate to="/partner/dashboard" replace />;
    }
    // Fallback to home if userType is invalid
    return <Navigate to="/" replace />;
  }

  // Render children if all checks pass
  return children;
});

// Add displayName for debugging
PrivateRoute.displayName = 'PrivateRoute';

export default PrivateRoute;