import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import PaymentMethod from '../components/PaymentMethod';
import { geocodeAddress, calculateDistance } from '../services/mapService';
import LoadingSpinner from '../components/LoadingSpinner';

function CreateOrder() {
  // Multi-step form tracking
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(4);
  
  // Basic order details
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageSize, setPackageSize] = useState('small');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  
  // Advanced features
  const [useRecentAddress, setUseRecentAddress] = useState(false);
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [selectedRecentAddress, setSelectedRecentAddress] = useState('');
  const [isScheduledDelivery, setIsScheduledDelivery] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isExpress, setIsExpress] = useState(false);
  const [isFoodDelivery, setIsFoodDelivery] = useState(false);
  const [needReturnDelivery, setNeedReturnDelivery] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // Location information
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  
  // Partner suggestion
  const [suggestedPartners, setSuggestedPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  
  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useSavedPickupAddress, setUseSavedPickupAddress] = useState(false);
  const [selectedSavedPickupAddress, setSelectedSavedPickupAddress] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [price, setPrice] = useState(0);
  const [baseFare, setBaseFare] = useState(0);
  const [weightCharge, setWeightCharge] = useState(0);
  const [distanceCharge, setDistanceCharge] = useState(0);
  const [expressCharge, setExpressCharge] = useState(0);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Initialize form - fetch user data, addresses and set defaults
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Pre-fill recipient name with user's name
          if (userData.name && !recipientName) {
            setRecipientName(userData.name);
          }
          
          // Pre-fill recipient phone with user's phone
          if (userData.phone && !recipientPhone) {
            setRecipientPhone(userData.phone);
          }
          
          // Get saved addresses
          if (userData.savedAddresses && userData.savedAddresses.length > 0) {
            setSavedAddresses(userData.savedAddresses);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [currentUser, recipientName, recipientPhone]);
  
  // Fetch recent delivery addresses
  useEffect(() => {
    const fetchRecentAddresses = async () => {
      if (!currentUser) return;
      
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        const addresses = [];
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (!addresses.some(addr => addr.address === data.deliveryAddress)) {
            addresses.push({
              id: doc.id,
              address: data.deliveryAddress,
              recipientName: data.recipientName,
              recipientPhone: data.recipientPhone
            });
          }
        });
        
        setRecentAddresses(addresses);
      } catch (error) {
        console.error('Error fetching recent addresses:', error);
      }
    };
    
    fetchRecentAddresses();
  }, [currentUser]);
  
  // Generate a unique OTP for delivery verification
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Validate addresses and get geocoordinates
  const validateAddresses = useCallback(async () => {
    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        pickupAddress: !pickupAddress.trim() ? 'Pickup address is required' : undefined,
        deliveryAddress: !deliveryAddress.trim() ? 'Delivery address is required' : undefined
      }));
      return false;
    }
    
    try {
      setGeocodingLoading(true);
      
      // Geocode both addresses
      const pickupCoordsResult = await geocodeAddress(pickupAddress);
      const deliveryCoordsResult = await geocodeAddress(deliveryAddress);
      
      setPickupCoords(pickupCoordsResult);
      setDeliveryCoords(deliveryCoordsResult);
      
      // Calculate distance between addresses
      const distance = calculateDistance(
        pickupCoordsResult[0], 
        pickupCoordsResult[1], 
        deliveryCoordsResult[0], 
        deliveryCoordsResult[1]
      );
      
      setEstimatedDistance(distance);
      
      // Estimate delivery duration (assume 20 km/h average speed in city)
      const durationMinutes = Math.round((distance / 20) * 60);
      setEstimatedDuration(durationMinutes);
      
      setGeocodingLoading(false);
      return true;
    } catch (error) {
      console.error('Error geocoding addresses:', error);
      setGeocodingLoading(false);
      setError('Unable to validate addresses. Please check and try again.');
      return false;
    }
  }, [pickupAddress, deliveryAddress]);
  
  // Find available partners near pickup location
  const findAvailablePartners = useCallback(async () => {
    if (!pickupCoords) return;
    
    try {
      // In a real app, you would query partners by location
      // Here we'll simulate with mock data
      const mockPartners = [
        {
          id: 'partner1',
          name: 'Rahul S.',
          rating: 4.8,
          distance: Math.round(Math.random() * 3 + 1),
          vehicle: 'scooter',
          completedOrders: 127,
          image: 'https://api.dicebear.com/7.x/micah/svg?seed=partner1'
        },
        {
          id: 'partner2',
          name: 'Priya M.',
          rating: 4.9,
          distance: Math.round(Math.random() * 3 + 2),
          vehicle: 'bike',
          completedOrders: 89,
          image: 'https://api.dicebear.com/7.x/micah/svg?seed=partner2'
        },
        {
          id: 'partner3',
          name: 'Vikram J.',
          rating: 4.7,
          distance: Math.round(Math.random() * 4 + 2),
          vehicle: 'scooter',
          completedOrders: 215,
          image: 'https://api.dicebear.com/7.x/micah/svg?seed=partner3'
        }
      ];
      
      setSuggestedPartners(mockPartners);
    } catch (error) {
      console.error('Error finding available partners:', error);
    }
  }, [pickupCoords]);
  
  // Calculate price based on package and delivery details
  const calculatePrice = useCallback(() => {
    // Base price by size
    let basePrice;
    switch (packageSize) {
      case 'small':
        basePrice = 50;
        break;
      case 'medium':
        basePrice = 75;
        break;
      case 'large':
        basePrice = 100;
        break;
      default:
        basePrice = 50;
    }
    setBaseFare(basePrice);
    
    // Weight charge (₹10 per kg)
    const weightFactor = parseFloat(packageWeight) || 0;
    const weightPrice = weightFactor * 10;
    setWeightCharge(weightPrice);
    
    // Distance charge (if we have estimated distance)
    let distancePrice = 0;
    if (estimatedDistance) {
      distancePrice = estimatedDistance * 5; // ₹5 per km
    } else if (pickupAddress && deliveryAddress) {
      // Fallback to estimate if geocoding failed
      const distance = Math.floor(Math.random() * 13) + 2; // Random 2-15 km
      distancePrice = distance * 5;
    }
    setDistanceCharge(distancePrice);
    
    // Express delivery charge
    const expressPrice = isExpress ? 100 : 0;
    setExpressCharge(expressPrice);
    
    // Calculate total (with 10% discount compared to competitors)
    const competitorPrice = basePrice + weightPrice + distancePrice + expressPrice;
    const discountedPrice = competitorPrice * 0.9;
    
    // Apply additional charges
    let finalPrice = discountedPrice;
    if (needReturnDelivery) {
      finalPrice += discountedPrice * 0.5; // 50% extra for return delivery
    }
    
    if (isFoodDelivery) {
      finalPrice += 20; // Extra ₹20 for food delivery (special handling)
    }
    
    if (isScheduledDelivery) {
      finalPrice += 30; // Extra ₹30 for scheduled delivery
    }
    
    return Math.ceil(finalPrice);
  }, [
    packageSize, 
    packageWeight, 
    estimatedDistance, 
    pickupAddress, 
    deliveryAddress, 
    isExpress,
    isFoodDelivery,
    needReturnDelivery,
    isScheduledDelivery
  ]);
  
  // Update price whenever relevant form values change
  useEffect(() => {
    setPrice(calculatePrice());
  }, [
    calculatePrice
  ]);
  
  // Get partners near pickup location when coords change
  useEffect(() => {
    if (pickupCoords) {
      findAvailablePartners();
    }
  }, [pickupCoords, findAvailablePartners]);
  
  // Handle selecting a saved pickup address
  const handleSelectSavedPickupAddress = (e) => {
    const addressId = e.target.value;
    
    if (!addressId) {
      setUseSavedPickupAddress(false);
      setPickupAddress('');
      return;
    }
    
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setPickupAddress(selectedAddress.address);
      setSelectedSavedPickupAddress(addressId);
    }
  };
  
  // Handle selecting a recent address
  const handleSelectRecentAddress = (e) => {
    const selectedId = e.target.value;
    setSelectedRecentAddress(selectedId);
    
    if (!selectedId) {
      setDeliveryAddress('');
      return;
    }
    
    const selected = recentAddresses.find(addr => addr.id === selectedId);
    if (selected) {
      setDeliveryAddress(selected.address);
      setRecipientName(selected.recipientName || recipientName);
      setRecipientPhone(selected.recipientPhone || recipientPhone);
    }
  };
  
  // Field validation
  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'pickupAddress':
        if (!value.trim()) error = 'Pickup address is required';
        break;
        
      case 'deliveryAddress':
        if (!value.trim()) error = 'Delivery address is required';
        break;
        
      case 'packageWeight':
        const weight = parseFloat(value);
        if (isNaN(weight) || weight <= 0) {
          error = 'Please enter a valid weight';
        } else if (
          (packageSize === 'small' && weight > 5) ||
          (packageSize === 'medium' && weight > 15) ||
          (packageSize === 'large' && weight > 25)
        ) {
          error = `Maximum weight for ${packageSize} package is ${packageSize === 'small' ? 5 : packageSize === 'medium' ? 15 : 25}kg`;
        }
        break;
        
      case 'packageDescription':
        if (!value.trim()) error = 'Please describe your package';
        break;
        
      case 'recipientName':
        if (!value.trim()) error = 'Recipient name is required';
        break;
        
      case 'recipientPhone':
        const phoneRegex = /^\d{10}$/;
        if (!value.trim()) {
          error = 'Recipient phone is required';
        } else if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          error = 'Please enter a valid 10-digit phone number';
        }
        break;
        
      case 'scheduledDate':
        if (isScheduledDelivery && !value) {
          error = 'Please select a delivery date';
        }
        break;
        
      case 'scheduledTime':
        if (isScheduledDelivery && !value) {
          error = 'Please select a delivery time';
        } else if (isScheduledDelivery) {
          const scheduledDateTime = new Date(`${scheduledDate}T${value}`);
          if (scheduledDateTime <= new Date()) {
            error = 'Scheduled delivery time must be in the future';
          }
        }
        break;
        
      default:
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: error || undefined
    }));
    
    return !error;
  };
  
  // Handle field blur (for validation)
  const handleBlur = (field, value) => {
    validateField(field, value);
  };
  
  // Validate current step
  const validateStep = () => {
    let isValid = true;
    
    if (step === 1) {
      isValid = validateField('pickupAddress', pickupAddress) 
              && validateField('deliveryAddress', deliveryAddress);
    } else if (step === 2) {
      isValid = validateField('packageWeight', packageWeight) 
              && validateField('packageDescription', packageDescription);
    } else if (step === 3) {
      isValid = validateField('recipientName', recipientName) 
              && validateField('recipientPhone', recipientPhone);
              
      if (isScheduledDelivery) {
        isValid = isValid 
                && validateField('scheduledDate', scheduledDate) 
                && validateField('scheduledTime', scheduledTime);
      }
    }
    
    return isValid;
  };
  
  // Move to next step
  const handleNextStep = async () => {
    if (!validateStep()) {
      return;
    }
    
    if (step === 1) {
      // Validate addresses with geocoding
      const addressesValid = await validateAddresses();
      if (!addressesValid) return;
    }
    
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  
  // Move to previous step
  const handlePrevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };
  
  // Get class for progress step
  const getStepClasses = (stepNumber) => {
    if (step > stepNumber) return "progress-step completed";
    if (step === stepNumber) return "progress-step active";
    return "progress-step";
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Generate a unique delivery OTP
      const deliveryOtp = generateOTP();
      
      // Prepare scheduled delivery time if applicable
      let scheduledDeliveryTime = null;
      if (isScheduledDelivery) {
        scheduledDeliveryTime = new Date(`${scheduledDate}T${scheduledTime}`);
      }
      
      const orderData = {
        customerId: currentUser.uid,
        pickupAddress,
        deliveryAddress,
        packageSize,
        packageWeight: parseFloat(packageWeight) || 0,
        packageDescription,
        recipientName,
        recipientPhone,
        price,
        baseFare,
        weightCharge,
        distanceCharge,
        expressCharge,
        isExpress,
        isFoodDelivery,
        needReturnDelivery,
        additionalInstructions,
        isScheduledDelivery,
        scheduledDeliveryTime: scheduledDeliveryTime,
        deliveryOtp, // Add delivery OTP
        otpVerified: false, // Initially not verified
        paymentMethod, // Add payment method
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid', // For COD, payment is pending until delivery
        status: 'pending', // pending, assigned, in-transit, delivered
        partnerId: selectedPartner ? selectedPartner.id : null,
        rated: false, // For rating after delivery
        // Add geocoded coordinates if available
        pickupCoords: pickupCoords || null,
        deliveryCoords: deliveryCoords || null,
        estimatedDistance: estimatedDistance || null,
        estimatedDuration: estimatedDuration || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Navigate to the order details page
      navigate(`/order/${orderRef.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      setError('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container enhanced-order-form">
      <h2 className="form-title">Create Delivery Order</h2>
      
      {/* Progress indicator */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        <div className="progress-steps" data-step={step}>
          <div className={getStepClasses(1)}>
            <div className="progress-step-number">{step > 1 ? "✓" : "1"}</div>
            <div className="progress-step-label">Addresses</div>
          </div>
          <div className={getStepClasses(2)}>
            <div className="progress-step-number">{step > 2 ? "✓" : "2"}</div>
            <div className="progress-step-label">Package</div>
          </div>
          <div className={getStepClasses(3)}>
            <div className="progress-step-number">{step > 3 ? "✓" : "3"}</div>
            <div className="progress-step-label">Options</div>
          </div>
          <div className={getStepClasses(4)}>
            <div className="progress-step-number">4</div>
            <div className="progress-step-label">Payment</div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="form-error">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="form-error-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Addresses */}
        {step === 1 && (
          <div className="form-step">
            <div className="step-header">
              <h3 className="step-title">Pickup & Delivery Locations</h3>
              <p className="step-description">Enter the addresses for pickup and delivery</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              
              {savedAddresses.length > 0 && (
                <div className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={useSavedPickupAddress}
                      onChange={() => setUseSavedPickupAddress(!useSavedPickupAddress)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">Use a saved address</span>
                  </label>
                </div>
              )}
              
              {useSavedPickupAddress && savedAddresses.length > 0 ? (
                <div className="form-group">
                  <select
                    value={selectedSavedPickupAddress}
                    onChange={handleSelectSavedPickupAddress}
                    className={`form-select ${fieldErrors.pickupAddress ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select a saved address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name}: {addr.address.substring(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <textarea
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onBlur={() => handleBlur('pickupAddress', pickupAddress)}
                  className={`form-textarea ${fieldErrors.pickupAddress ? 'error' : ''}`}
                  rows="2"
                  placeholder="Enter the full pickup address"
                  required
                ></textarea>
              )}
              
              {fieldErrors.pickupAddress && (
                <div className="field-error">{fieldErrors.pickupAddress}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              
              {recentAddresses.length > 0 && (
                <div className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={useRecentAddress}
                      onChange={() => setUseRecentAddress(!useRecentAddress)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">Use a recent address</span>
                  </label>
                </div>
              )}
              
              {useRecentAddress && recentAddresses.length > 0 ? (
                <div className="form-group">
                  <select
                    value={selectedRecentAddress}
                    onChange={handleSelectRecentAddress}
                    className={`form-select ${fieldErrors.deliveryAddress ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select a recent address</option>
                    {recentAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.address.substring(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  onBlur={() => handleBlur('deliveryAddress', deliveryAddress)}
                  className={`form-textarea ${fieldErrors.deliveryAddress ? 'error' : ''}`}
                  rows="2"
                  placeholder="Enter the full delivery address"
                  required
                ></textarea>
              )}
              
              {fieldErrors.deliveryAddress && (
                <div className="field-error">{fieldErrors.deliveryAddress}</div>
              )}
            </div>
            
            {/* Show distance estimation if available */}
            {estimatedDistance && (
              <div className="distance-info">
                <div className="distance-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                </div>
                <div className="distance-details">
                  <div className="distance-text">Estimated distance: <strong>{estimatedDistance} km</strong></div>
                  {estimatedDuration && (
                    <div className="duration-text">Estimated delivery time: <strong>{estimatedDuration} min</strong></div>
                  )}
                </div>
              </div>
            )}
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handleNextStep}
                disabled={geocodingLoading}
                className="btn btn-full"
              >
                {geocodingLoading ? (
                  <span>
                    <LoadingSpinner size="small" />
                    Validating Addresses...
                  </span>
                ) : (
                  <span>
                    Next
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Package Details */}
        {step === 2 && (
          <div className="form-step">
            <div className="step-header">
              <h3 className="step-title">Package Details</h3>
              <p className="step-description">Tell us about what you're sending</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Package Size</label>
              <div className="package-size-selector">
                <div 
                  className={`package-size-option ${packageSize === 'small' ? 'selected' : ''}`}
                  onClick={() => setPackageSize('small')}
                >
                  <div className="package-size-icon small"></div>
                  <div className="package-size-details">
                    <h4>Small</h4>
                    <p>Up to 5kg</p>
                  </div>
                </div>
                <div 
                  className={`package-size-option ${packageSize === 'medium' ? 'selected' : ''}`}
                  onClick={() => setPackageSize('medium')}
                >
                  <div className="package-size-icon medium"></div>
                  <div className="package-size-details">
                    <h4>Medium</h4>
                    <p>5-15kg</p>
                  </div>
                </div>
                <div 
                  className={`package-size-option ${packageSize === 'large' ? 'selected' : ''}`}
                  onClick={() => setPackageSize('large')}
                >
                  <div className="package-size-icon large"></div>
                  <div className="package-size-details">
                    <h4>Large</h4>
                    <p>15-25kg</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Package Weight (kg)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={packageWeight}
                onChange={(e) => setPackageWeight(e.target.value)}
                onBlur={() => handleBlur('packageWeight', packageWeight)}
                className={`form-input ${fieldErrors.packageWeight ? 'error' : ''}`}
                required
              />
              {fieldErrors.packageWeight && (
                <div className="field-error">{fieldErrors.packageWeight}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Package Description</label>
              <textarea
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                onBlur={() => handleBlur('packageDescription', packageDescription)}
                className={`form-textarea ${fieldErrors.packageDescription ? 'error' : ''}`}
                rows="2"
                placeholder="Describe what you're sending"
                required
              ></textarea>
              {fieldErrors.packageDescription && (
                <div className="field-error">{fieldErrors.packageDescription}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Package Type</label>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="foodDelivery"
                  checked={isFoodDelivery}
                  onChange={() => setIsFoodDelivery(!isFoodDelivery)}
                  className="form-checkbox"
                />
                <label htmlFor="foodDelivery" className="ml-2">Food Delivery (requires special handling)</label>
              </div>
              {isFoodDelivery && (
                <div className="food-delivery-notice">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>Food deliveries are handled with priority and special care. Additional fee of ₹20 applies.</span>
                </div>
              )}
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn ml-2"
              >
                Next
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Delivery Options */}
        {step === 3 && (
          <div className="form-step">
            <div className="step-header">
              <h3 className="step-title">Delivery Options & Recipient</h3>
              <p className="step-description">Select delivery options and provide recipient details</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                onBlur={() => handleBlur('recipientName', recipientName)}
                className={`form-input ${fieldErrors.recipientName ? 'error' : ''}`}
                placeholder="Full name of recipient"
                required
              />
              {fieldErrors.recipientName && (
                <div className="field-error">{fieldErrors.recipientName}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Recipient Phone</label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                onBlur={() => handleBlur('recipientPhone', recipientPhone)}
                className={`form-input ${fieldErrors.recipientPhone ? 'error' : ''}`}
                placeholder="10-digit phone number"
                required
              />
              {fieldErrors.recipientPhone && (
                <div className="field-error">{fieldErrors.recipientPhone}</div>
              )}
              <small className="form-hint">This number will be used to contact the recipient for delivery</small>
            </div>
            
            <div className="form-group">
              <label className="form-label">Delivery Options</label>
              
              <div className="delivery-option">
                <input
                  type="checkbox"
                  id="expressDelivery"
                  checked={isExpress}
                  onChange={() => setIsExpress(!isExpress)}
                  className="form-checkbox"
                />
                <label htmlFor="expressDelivery" className="ml-2">
                  <span className="font-medium">Express Delivery</span>
                  <span className="text-gray block text-sm">Priority handling with faster delivery</span>
                </label>
                <span className="delivery-option-price">+₹100</span>
              </div>
              
              <div className="delivery-option">
                <input
                  type="checkbox"
                  id="returnDelivery"
                  checked={needReturnDelivery}
                  onChange={() => setNeedReturnDelivery(!needReturnDelivery)}
                  className="form-checkbox"
                />
                <label htmlFor="returnDelivery" className="ml-2">
                  <span className="font-medium">Return Delivery</span>
                  <span className="text-gray block text-sm">Return to sender if recipient unavailable</span>
                </label>
                <span className="delivery-option-price">+50%</span>
              </div>
              
              <div className="delivery-option">
                <input
                  type="checkbox"
                  id="scheduledDelivery"
                  checked={isScheduledDelivery}
                  onChange={() => setIsScheduledDelivery(!isScheduledDelivery)}
                  className="form-checkbox"
                />
                <label htmlFor="scheduledDelivery" className="ml-2">
                  <span className="font-medium">Scheduled Delivery</span>
                  <span className="text-gray block text-sm">Choose a specific date and time</span>
                </label>
                <span className="delivery-option-price">+₹30</span>
              </div>
              
              {isScheduledDelivery && (
                <div className="scheduled-delivery-options mt-4">
                  <div className="form-group">
                    <label className="form-label">Delivery Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      onBlur={() => handleBlur('scheduledDate', scheduledDate)}
                      className={`form-input ${fieldErrors.scheduledDate ? 'error' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                      required={isScheduledDelivery}
                    />
                    {fieldErrors.scheduledDate && (
                      <div className="field-error">{fieldErrors.scheduledDate}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Delivery Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      onBlur={() => handleBlur('scheduledTime', scheduledTime)}
                      className={`form-input ${fieldErrors.scheduledTime ? 'error' : ''}`}
                      required={isScheduledDelivery}
                    />
                    {fieldErrors.scheduledTime && (
                      <div className="field-error">{fieldErrors.scheduledTime}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Additional Instructions</label>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                className="form-textarea"
                rows="2"
                placeholder="Any special instructions for the delivery partner"
              ></textarea>
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn ml-2"
              >
                Next
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Payment and Confirmation */}
        {step === 4 && (
          <div className="form-step">
            <div className="step-header">
              <h3 className="step-title">Payment & Confirmation</h3>
              <p className="step-description">Review your order and select a payment method</p>
            </div>
            
            {/* Payment Method Selection */}
            <PaymentMethod 
              onPaymentMethodSelect={setPaymentMethod} 
              selectedPaymentMethod={paymentMethod}
            />
            
            {/* Available Partner Selection */}
            {suggestedPartners.length > 0 && (
              <div className="partner-selection-section">
                <h3 className="section-title">Available Delivery Partners</h3>
                <p className="section-subtitle">Choose a partner for your delivery or let our system auto-assign</p>
                
                <div className="partners-grid">
                  {suggestedPartners.map(partner => (
                    <div 
                      key={partner.id} 
                      className={`partner-card ${selectedPartner && selectedPartner.id === partner.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <div className="partner-avatar" style={{backgroundImage: `url(${partner.image})`}}></div>
                      <div className="partner-details">
                        <div className="partner-name">{partner.name}</div>
                        <div className="partner-rating">
                          <span className="rating-value">{partner.rating}</span>
                          <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span 
                                key={star} 
                                className={`rating-star ${star <= Math.floor(partner.rating) ? 'active' : star <= partner.rating ? 'half-active' : ''}`}
                              >★</span>
                            ))}
                          </div>
                        </div>
                        <div className="partner-stats">
                          <span className="partner-distance">{partner.distance} km away</span>
                          <span className="partner-orders">{partner.completedOrders} deliveries</span>
                        </div>
                        <div className="partner-vehicle">
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="5.5" cy="17.5" r="3.5"></circle>
                            <circle cx="18.5" cy="17.5" r="3.5"></circle>
                            <path d="M15 6h2a2 2 0 0 1 2 2v9.5"></path>
                            <path d="M6 17.5V10a2 2 0 0 1 2-2h7"></path>
                            <path d="M2.5 14h8"></path>
                          </svg>
                          <span className="capitalize">{partner.vehicle}</span>
                        </div>
                      </div>
                      {selectedPartner && selectedPartner.id === partner.id && (
                        <div className="selected-badge">
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="otp-notice">
              <div className="otp-notice-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div className="otp-notice-content">
                <h4>Delivery Verification</h4>
                <p>A verification code will be generated for your order. Share this code with your delivery partner only when your package arrives to complete the delivery.</p>
              </div>
            </div>
            
            <div className="payment-summary">
              <h4 className="payment-summary-title">Order Summary</h4>
              
              <div className="order-details-summary">
                <div className="order-address-summary">
                  <div className="address-item">
                    <div className="address-icon pickup">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </div>
                    <div className="address-details">
                      <div className="address-label">Pickup</div>
                      <div className="address-text">{pickupAddress}</div>
                    </div>
                  </div>
                  
                  <div className="address-connector"></div>
                  
                  <div className="address-item">
                    <div className="address-icon delivery">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="8 12 12 16 16 12"></polyline>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                      </svg>
                    </div>
                    <div className="address-details">
                      <div className="address-label">Delivery</div>
                      <div className="address-text">{deliveryAddress}</div>
                    </div>
                  </div>
                </div>
                
                <div className="order-package-summary">
                  <div className="package-size-summary">
                    <span className="package-label">Size:</span>
                    <span className="package-value capitalize">{packageSize}</span>
                  </div>
                  <div className="package-weight-summary">
                    <span className="package-label">Weight:</span>
                    <span className="package-value">{packageWeight} kg</span>
                  </div>
                  {estimatedDistance && (
                    <div className="package-distance-summary">
                      <span className="package-label">Distance:</span>
                      <span className="package-value">{estimatedDistance} km</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="price-breakdown">
                <div className="payment-summary-row">
                  <span>Base Fare:</span>
                  <span>₹{baseFare}</span>
                </div>
                <div className="payment-summary-row">
                  <span>Weight Charge:</span>
                  <span>₹{weightCharge}</span>
                </div>
                {distanceCharge > 0 && (
                  <div className="payment-summary-row">
                    <span>Distance Charge:</span>
                    <span>₹{distanceCharge}</span>
                  </div>
                )}
                {isExpress && (
                  <div className="payment-summary-row">
                    <span>Express Delivery:</span>
                    <span>₹{expressCharge}</span>
                  </div>
                )}
                <div className="payment-summary-row discount">
                  <span>Discount:</span>
                  <span className="text-success">-10%</span>
                </div>
                {needReturnDelivery && (
                  <div className="payment-summary-row surcharge">
                    <span>Return Delivery Option:</span>
                    <span>+50%</span>
                  </div>
                )}
                {isScheduledDelivery && (
                  <div className="payment-summary-row">
                    <span>Scheduled Delivery:</span>
                    <span>₹30</span>
                  </div>
                )}
                {isFoodDelivery && (
                  <div className="payment-summary-row">
                    <span>Food Handling:</span>
                    <span>₹20</span>
                  </div>
                )}
                <div className="payment-summary-row total">
                  <span>Total Price:</span>
                  <span>₹{price}</span>
                </div>
                <div className="payment-summary-row">
                  <span>Payment Method:</span>
                  <span className="capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handlePrevStep}
                className="btn btn-outline"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-full-width ml-2"
              >
                {loading ? (
                  <span>
                    <LoadingSpinner size="small" />
                    Creating Order...
                  </span>
                ) : (
                  <span>
                    Place Order
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default CreateOrder;