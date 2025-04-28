import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  // Multi-step form tracking
  const [step, setStep] = useState(1);
  
  // User type selection
  const [activeTab, setActiveTab] = useState('customer');
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Partner specific fields
  const [vehicleType, setVehicleType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [availableAreas, setAvailableAreas] = useState([]);
  const [availableTimeStart, setAvailableTimeStart] = useState('09:00');
  const [availableTimeEnd, setAvailableTimeEnd] = useState('18:00');
  
  // Customer specific fields
  const [address, setAddress] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  
  // Terms and privacy
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculator
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }
    
    let strength = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) {
      strength += 25;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Add an uppercase letter');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Add a lowercase letter');
    }
    
    // Number or special character check
    if (/[0-9!@#$%^&*]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Add a number or special character');
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback.join(', '));
    
  }, [password]);

  // Handle field blur for validation
  const handleBlur = (field) => {
    setFormTouched({
      ...formTouched,
      [field]: true
    });
    validateField(field);
  };

  // Validate individual field
  const validateField = (field) => {
    const newErrors = { ...formErrors };
    
    switch (field) {
      case 'name':
        if (!name.trim()) {
          newErrors.name = 'Name is required';
        } else if (name.length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else {
          delete newErrors.name;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
          newErrors.email = 'Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'phone':
        const phoneRegex = /^\d{10}$/;
        if (!phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        } else {
          delete newErrors.phone;
        }
        break;
        
      case 'password':
        if (!password) {
          newErrors.password = 'Password is required';
        } else if (password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (passwordStrength < 50) {
          newErrors.password = 'Please create a stronger password';
        } else {
          delete newErrors.password;
        }
        break;
        
      case 'confirmPassword':
        if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'vehicleType':
        if (activeTab === 'partner' && !vehicleType) {
          newErrors.vehicleType = 'Please select a vehicle type';
        } else {
          delete newErrors.vehicleType;
        }
        break;
        
      case 'licenseNumber':
        if (activeTab === 'partner' && !licenseNumber.trim()) {
          newErrors.licenseNumber = 'License number is required';
        } else {
          delete newErrors.licenseNumber;
        }
        break;
        
      default:
        break;
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate current step
  const validateStep = () => {
    let isValid = true;
    let newErrors = { ...formErrors };
    let newTouched = { ...formTouched };
    
    if (step === 1) {
      // Basic info validation
      const fields = ['name', 'email', 'phone'];
      fields.forEach(field => {
        newTouched[field] = true;
        if (!validateField(field)) {
          isValid = false;
        }
      });
    } else if (step === 2) {
      // Password validation
      const fields = ['password', 'confirmPassword'];
      fields.forEach(field => {
        newTouched[field] = true;
        if (!validateField(field)) {
          isValid = false;
        }
      });
    } else if (step === 3 && activeTab === 'partner') {
      // Partner details validation
      const fields = ['vehicleType', 'licenseNumber'];
      fields.forEach(field => {
        newTouched[field] = true;
        if (!validateField(field)) {
          isValid = false;
        }
      });
    }
    
    // Final step validation
    if (step === 3 && activeTab === 'customer' || step === 4) {
      if (!agreeToTerms) {
        newErrors.terms = 'You must agree to the terms and conditions';
        isValid = false;
      } else {
        delete newErrors.terms;
      }
    }
    
    setFormTouched(newTouched);
    setFormErrors(newErrors);
    return isValid;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Handle user type change
  const handleTabChange = (type) => {
    setActiveTab(type);
    setError('');
  };

  // Handle area selection
  const handleAreaToggle = (area) => {
    if (availableAreas.includes(area)) {
      setAvailableAreas(availableAreas.filter(a => a !== area));
    } else {
      setAvailableAreas([...availableAreas, area]);
    }
  };

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Final validation
    if (!validateStep()) {
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      let userData = { 
        name, 
        phone,
        address: activeTab === 'customer' ? address : '',
        alternatePhone: activeTab === 'customer' ? alternatePhone : '',
      };
      
      if (activeTab === 'partner') {
        userData = {
          ...userData,
          vehicleType,
          licenseNumber,
          experience,
          availableAreas,
          availableTimeStart,
          availableTimeEnd,
          isAvailable: true,
          rating: 0,
          totalDeliveries: 0
        };
      }
      
      await register(email, password, activeTab, userData);
      
      if (activeTab === 'customer') {
        navigate('/dashboard');
      } else {
        navigate('/partner/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle Firebase specific errors
      switch(error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please use a different email or try logging in.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format. Please check your email address.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.');
          break;
        default:
          setError('Failed to create an account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Progress percentage for progress bar
  const calculateProgress = () => {
    const totalSteps = activeTab === 'customer' ? 3 : 4;
    return (step / totalSteps) * 100;
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Create an Account</h2>
      
      {/* Progress bar */}
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${calculateProgress()}%` }}
        ></div>
        <div className="progress-labels">
          <span className={`progress-label ${step >= 1 ? 'active' : ''}`}>Account</span>
          <span className={`progress-label ${step >= 2 ? 'active' : ''}`}>Security</span>
          {activeTab === 'partner' && (
            <span className={`progress-label ${step >= 3 ? 'active' : ''}`}>Partner Details</span>
          )}
          <span className={`progress-label ${step >= (activeTab === 'partner' ? 4 : 3) ? 'active' : ''}`}>Confirm</span>
        </div>
      </div>
      
      {/* User type selection (only in first step) */}
      {step === 1 && (
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => handleTabChange('customer')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Customer</span>
          </div>
          <div 
            className={`tab ${activeTab === 'partner' ? 'active' : ''}`}
            onClick={() => handleTabChange('partner')}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span>Delivery Partner</span>
          </div>
        </div>
      )}
      
      {error && <div className="form-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`form-input ${formTouched.name && formErrors.name ? 'error' : ''}`}
                placeholder="John Doe"
                required
              />
              {formTouched.name && formErrors.name && (
                <div className="field-error">{formErrors.name}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`form-input ${formTouched.email && formErrors.email ? 'error' : ''}`}
                placeholder="john@example.com"
                required
              />
              {formTouched.email && formErrors.email && (
                <div className="field-error">{formErrors.email}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={`form-input ${formTouched.phone && formErrors.phone ? 'error' : ''}`}
                placeholder="10-digit phone number"
                required
              />
              {formTouched.phone && formErrors.phone && (
                <div className="field-error">{formErrors.phone}</div>
              )}
              <small className="input-hint">We'll use this to contact you about your orders</small>
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn btn-full"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Password */}
        {step === 2 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`form-input ${formTouched.password && formErrors.password ? 'error' : ''}`}
                placeholder="••••••••"
                required
              />
              {formTouched.password && formErrors.password && (
                <div className="field-error">{formErrors.password}</div>
              )}
              
              {/* Password strength meter */}
              <div className="password-strength">
                <div className="strength-meter">
                  <div 
                    className={`strength-meter-fill strength-${
                      passwordStrength <= 25 ? 'weak' : 
                      passwordStrength <= 50 ? 'fair' : 
                      passwordStrength <= 75 ? 'good' : 'strong'
                    }`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
                <div className="strength-text">
                  {passwordStrength === 0 ? '' : 
                   passwordStrength <= 25 ? 'Weak' : 
                   passwordStrength <= 50 ? 'Fair' : 
                   passwordStrength <= 75 ? 'Good' : 'Strong'}
                </div>
              </div>
              
              {passwordFeedback && (
                <small className="password-feedback">{passwordFeedback}</small>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`form-input ${formTouched.confirmPassword && formErrors.confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                required
              />
              {formTouched.confirmPassword && formErrors.confirmPassword && (
                <div className="field-error">{formErrors.confirmPassword}</div>
              )}
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                Back
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn ml-2"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Partner Details (Only for delivery partners) */}
        {step === 3 && activeTab === 'partner' && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                onBlur={() => handleBlur('vehicleType')}
                className={`form-select ${formTouched.vehicleType && formErrors.vehicleType ? 'error' : ''}`}
                required
              >
                <option value="">Select Vehicle Type</option>
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
              {formTouched.vehicleType && formErrors.vehicleType && (
                <div className="field-error">{formErrors.vehicleType}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                onBlur={() => handleBlur('licenseNumber')}
                className={`form-input ${formTouched.licenseNumber && formErrors.licenseNumber ? 'error' : ''}`}
                placeholder="Enter your driving license number"
                required
              />
              {formTouched.licenseNumber && formErrors.licenseNumber && (
                <div className="field-error">{formErrors.licenseNumber}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="form-input"
                placeholder="Years of driving experience"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Available Areas</label>
              <div className="available-areas">
                {['North', 'South', 'East', 'West', 'Central'].map((area) => (
                  <label key={area} className="area-checkbox">
                    <input
                      type="checkbox"
                      checked={availableAreas.includes(area)}
                      onChange={() => handleAreaToggle(area)}
                      className="form-checkbox"
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Available Hours</label>
              <div className="available-hours">
                <div className="time-input">
                  <label>From</label>
                  <input
                    type="time"
                    value={availableTimeStart}
                    onChange={(e) => setAvailableTimeStart(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="time-input">
                  <label>To</label>
                  <input
                    type="time"
                    value={availableTimeEnd}
                    onChange={(e) => setAvailableTimeEnd(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                Back
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn ml-2"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3 for Customers or Step 4 for Partners: Final confirmation */}
        {(step === 3 && activeTab === 'customer') || (step === 4 && activeTab === 'partner') ? (
          <div className="form-step">
            <div className="form-summary">
              <h3 className="summary-title">Account Summary</h3>
              
              <div className="summary-section">
                <h4>Basic Information</h4>
                <div className="summary-row">
                  <span className="summary-label">Name:</span>
                  <span className="summary-value">{name}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Email:</span>
                  <span className="summary-value">{email}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Phone:</span>
                  <span className="summary-value">{phone}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Account Type:</span>
                  <span className="summary-value capitalize">{activeTab}</span>
                </div>
              </div>
              
              {activeTab === 'partner' && (
                <div className="summary-section">
                  <h4>Partner Details</h4>
                  <div className="summary-row">
                    <span className="summary-label">Vehicle Type:</span>
                    <span className="summary-value capitalize">{vehicleType}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">License Number:</span>
                    <span className="summary-value">{licenseNumber}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Available Areas:</span>
                    <span className="summary-value">
                      {availableAreas.length > 0 ? availableAreas.join(', ') : 'None selected'}
                    </span>
                  </div>
                </div>
              )}
              
              {activeTab === 'customer' && (
                <div className="summary-section">
                  <h4>Additional Information (Optional)</h4>
                  <div className="form-group">
                    <label className="form-label">Home Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="form-textarea"
                      rows="2"
                      placeholder="Enter your default address (optional)"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="form-input"
                      placeholder="Alternative contact number (optional)"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={() => setAgreeToTerms(!agreeToTerms)}
                  className="form-checkbox"
                />
                <span>
                  I agree to the <a href="#" className="text-primary">Terms of Service</a> and <a href="#" className="text-primary">Privacy Policy</a>
                </span>
              </label>
              {formErrors.terms && (
                <div className="field-error">{formErrors.terms}</div>
              )}
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn ml-2"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </div>
        ) : null}
      </form>
      
      <div className="form-footer">
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
}

export default Register;