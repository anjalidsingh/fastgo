import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { login, userType } = useAuth();
  const navigate = useNavigate();

  // Check if we have saved credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('fastgo_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Save email if "Remember me" is checked
      if (rememberMe) {
        localStorage.setItem('fastgo_email', email);
      } else {
        localStorage.removeItem('fastgo_email');
      }
      
      await login(email, password);
      
      // Redirect based on user type
      if (userType === 'customer') {
        navigate('/dashboard');
      } else {
        navigate('/partner/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      switch(error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again');
          break;
        case 'auth/too-many-requests':
          setError('Too many unsuccessful login attempts. Please try again later');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support');
          break;
        default:
          setError('Failed to sign in: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await sendPasswordResetEmail(auth, resetEmail);
      
      setResetSent(true);
      setLoading(false);
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase errors
      switch(error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        default:
          setError('Error sending password reset: ' + error.message);
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {!showResetPassword ? (
        <>
          <h2 className="form-title">Log In</h2>
          
          {error && (
            <div className="form-error">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="error-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-group">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="yourname@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-group">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="form-checkbox"
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="forgot-password"
              >
                Forgot password?
              </button>
            </div>
            
            <div className="form-submit">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-full"
              >
                {loading ? (
                  <div className="button-loading">
                    <div className="button-spinner"></div>
                    <span>Logging In...</span>
                  </div>
                ) : (
                  'Log In'
                )}
              </button>
            </div>
          </form>
          
          <div className="form-separator">
            <span>or</span>
          </div>
          
          <div className="form-footer">
            <p>Don't have an account?</p>
            <Link to="/register" className="btn btn-outline btn-full">
              Create Account
            </Link>
          </div>
        </>
      ) : (
        <>
          <button 
            onClick={() => {
              setShowResetPassword(false);
              setResetSent(false);
              setError('');
            }}
            className="back-button"
          >
            ← Back to login
          </button>
          
          <h2 className="form-title">Reset Password</h2>
          
          {resetSent ? (
            <div className="success-message">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="success-icon">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <h3>Password Reset Email Sent!</h3>
                <p>Check your email for instructions to reset your password.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="reset-instructions">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              {error && (
                <div className="form-error">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="error-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="form-input-group">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="form-input pl-10"
                      placeholder="yourname@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-submit">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-full"
                  >
                    {loading ? (
                      <div className="button-loading">
                        <div className="button-spinner"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Login;