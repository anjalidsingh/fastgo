import React, { useState, useEffect } from 'react';
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
  limit 
} from 'firebase/firestore';
import PaymentMethod from '../components/PaymentMethod'; // Import the payment component

function CreateOrder() {
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
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to Cash on Delivery
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [price, setPrice] = useState(0);
  const [baseFare, setBaseFare] = useState(0);
  const [weightCharge, setWeightCharge] = useState(0);
  const [distanceCharge, setDistanceCharge] = useState(0);
  const [expressCharge, setExpressCharge] = useState(0);
  const [step, setStep] = useState(1); // For multi-step form
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Generate OTP for delivery verification
  const generateOTP = () => {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Fetch recent addresses
  useEffect(() => {
    const fetchRecentAddresses = async () => {
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
    
    if (currentUser) {
      fetchRecentAddresses();
    }
  }, [currentUser]);
  
  // Calculate distance between two addresses (mock implementation)
  const calculateDistance = (pickup, delivery) => {
    // In a real app, you would use a maps API to calculate real distance
    // This is just a simple mock implementation
    
    // Generate a random distance between 2 and 15 km
    return Math.floor(Math.random() * 13) + 2;
  };
  
  // Calculate price based on package details
  const calculatePrice = () => {
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
    
    // Distance charge (if addresses are provided)
    let distancePrice = 0;
    if (pickupAddress && deliveryAddress) {
      const distance = calculateDistance(pickupAddress, deliveryAddress);
      distancePrice = distance * 5; // ₹5 per km
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
  };
  
  // Update price when form values change
  useEffect(() => {
    setPrice(calculatePrice());
  }, [
    packageSize, 
    packageWeight, 
    pickupAddress, 
    deliveryAddress, 
    isExpress,
    isFoodDelivery,
    needReturnDelivery,
    isScheduledDelivery
  ]);
  
  // Handle selecting a recent address
  const handleSelectRecentAddress = (e) => {
    const selectedId = e.target.value;
    setSelectedRecentAddress(selectedId);
    
    if (selectedId) {
      const selected = recentAddresses.find(addr => addr.id === selectedId);
      if (selected) {
        setDeliveryAddress(selected.address);
        setRecipientName(selected.recipientName);
        setRecipientPhone(selected.recipientPhone);
      }
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!pickupAddress.trim()) {
      setError('Pickup address is required');
      return false;
    }
    
    if (!deliveryAddress.trim()) {
      setError('Delivery address is required');
      return false;
    }
    
    if (!packageDescription.trim()) {
      setError('Package description is required');
      return false;
    }
    
    if (!recipientName.trim()) {
      setError('Recipient name is required');
      return false;
    }
    
    if (!recipientPhone.trim()) {
      setError('Recipient phone is required');
      return false;
    }
    
    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(recipientPhone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    // Validate weight
    const weight = parseFloat(packageWeight);
    if (isNaN(weight) || weight <= 0) {
      setError('Please enter a valid package weight');
      return false;
    }
    
    // Validate scheduled delivery
    if (isScheduledDelivery) {
      if (!scheduledDate) {
        setError('Please select a delivery date');
        return false;
      }
      
      if (!scheduledTime) {
        setError('Please select a delivery time');
        return false;
      }
      
      // Check if scheduled time is in the future
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        setError('Scheduled delivery time must be in the future');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
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
        partnerId: null,
        rated: false, // For rating after delivery
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      navigate(`/order/${orderRef.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      setError('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Move to next step
  const handleNextStep = () => {
    if (step === 1) {
      // Validate first step
      if (!pickupAddress.trim() || !deliveryAddress.trim()) {
        setError('Please fill in both pickup and delivery addresses');
        return;
      }
      setError('');
    }
    setStep(step + 1);
  };

  // Move to previous step
  const handlePrevStep = () => {
    setStep(step - 1);
    setError('');
  };

  // Get progress step classes
  const getStepClasses = (stepNumber) => {
    if (step > stepNumber) return "progress-step completed";
    if (step === stepNumber) return "progress-step active";
    return "progress-step";
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Create Delivery Order</h2>
      
      {/* Progress indicator */}
      <div className="progress-bar-container">
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
            <div className="progress-step-label">Recipient</div>
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
            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="form-textarea"
                rows="2"
                placeholder="Enter the full pickup address"
                required
              ></textarea>
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
                    className="form-select"
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
                  className="form-textarea"
                  rows="2"
                  placeholder="Enter the full delivery address"
                  required
                ></textarea>
              )}
            </div>
            
            <div className="form-navigation">
              <button 
                type="button" 
                onClick={handleNextStep}
                className="btn btn-full"
              >
                <span>Next</span>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Package Details */}
        {step === 2 && (
          <div className="form-step">
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
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Package Description</label>
              <textarea
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                className="form-textarea"
                rows="2"
                placeholder="Describe what you're sending"
                required
              ></textarea>
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
        
        {/* Step 3: Recipient Details */}
        {step === 3 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="form-input"
                placeholder="Full name of recipient"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Recipient Phone</label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="form-input"
                placeholder="10-digit phone number"
                required
              />
              <small className="form-hint">This number will be used to contact the recipient for delivery</small>
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
        
        {/* Step 4: Delivery Options and Payment */}
        {step === 4 && (
          <div className="form-step">
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
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                      required={isScheduledDelivery}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Delivery Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="form-input"
                      required={isScheduledDelivery}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Add Payment Method Selection */}
            <PaymentMethod 
              onPaymentMethodSelect={setPaymentMethod} 
              selectedPaymentMethod={paymentMethod}
            />
            
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
              <div className="payment-summary-row">
                <span>Discount:</span>
                <span className="text-success">-10%</span>
              </div>
              {needReturnDelivery && (
                <div className="payment-summary-row">
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
              <div className="payment-summary-row total">
                <span>Total Price:</span>
                <span>₹{price}</span>
              </div>
              <div className="payment-summary-row">
                <span>Payment Method:</span>
                <span className="capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</span>
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
                    <span className="btn-loader"></span>
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