import React, { useState, useEffect, useRef } from 'react';
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
import PaymentMethod from '../components/PaymentMethod';
import { geocodeAddress } from '../services/mapService';
import LoadingSpinner from '../components/LoadingSpinner';

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
  
  // Map state
  const [mapInitialized, setMapInitialized] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [mapDistance, setMapDistance] = useState(null);
  const [addressSearchLoading, setAddressSearchLoading] = useState({
    pickup: false,
    delivery: false
  });
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);
  
  // Generate OTP for delivery verification
  const generateOTP = () => {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window.L === 'undefined' || mapInitialized) return;
    
    try {
      const L = window.L;
      
      // Fix Leaflet icon issues
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
      
      // Create map centered on India
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      // Create layers for markers and route
      markersLayerRef.current = L.layerGroup().addTo(map);
      polylineLayerRef.current = L.layerGroup().addTo(map);
      
      mapInstanceRef.current = map;
      setMapInitialized(true);
      
      // Resize the map after a short delay to ensure proper rendering
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);
    } catch (err) {
      console.error("Error initializing map:", err);
    }
    
    // Clean up on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapInitialized]);
  
  // Update map when addresses change
  useEffect(() => {
    if (!mapInitialized) return;
    
    const updateMap = async () => {
      if (!pickupAddress && !deliveryAddress) return;
      
      // Clear existing markers and route
      if (markersLayerRef.current) markersLayerRef.current.clearLayers();
      if (polylineLayerRef.current) polylineLayerRef.current.clearLayers();
      
      const L = window.L;
      
      // Add pickup marker if we have coordinates
      if (pickupCoords) {
        L.marker(pickupCoords)
          .bindPopup(`<b>Pickup:</b><br>${pickupAddress}`)
          .addTo(markersLayerRef.current);
      }
      
      // Add delivery marker if we have coordinates
      if (deliveryCoords) {
        L.marker(deliveryCoords)
          .bindPopup(`<b>Delivery:</b><br>${deliveryAddress}`)
          .addTo(markersLayerRef.current);
      }
      
      // If we have both markers, draw a line and fit the map
      if (pickupCoords && deliveryCoords) {
        // Create a simple route (straight line)
        L.polyline([pickupCoords, deliveryCoords], {
          color: '#4f46e5',
          weight: 4,
          dashArray: '10, 10'
        }).addTo(polylineLayerRef.current);
        
        // Fit map to show both markers
        const bounds = L.latLngBounds([pickupCoords, deliveryCoords]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        
        // Calculate distance
        const distance = calculateDistance(
          pickupCoords[0], pickupCoords[1],
          deliveryCoords[0], deliveryCoords[1]
        );
        setMapDistance(distance);
      } 
      // If we only have one marker, center on it
      else if (pickupCoords) {
        mapInstanceRef.current.setView(pickupCoords, 13);
      } 
      else if (deliveryCoords) {
        mapInstanceRef.current.setView(deliveryCoords, 13);
      }
    };
    
    updateMap();
  }, [pickupCoords, deliveryCoords, pickupAddress, deliveryAddress, mapInitialized]);
  
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
  
  // Geocode pickup address and update map
  const geocodePickupAddress = async () => {
    if (!pickupAddress.trim()) return;
    
    try {
      setAddressSearchLoading(prev => ({ ...prev, pickup: true }));
      const coords = await geocodeAddress(pickupAddress);
      setPickupCoords(coords);
      setAddressSearchLoading(prev => ({ ...prev, pickup: false }));
    } catch (error) {
      console.error('Error geocoding pickup address:', error);
      setAddressSearchLoading(prev => ({ ...prev, pickup: false }));
    }
  };
  
  // Geocode delivery address and update map
  const geocodeDeliveryAddress = async () => {
    if (!deliveryAddress.trim()) return;
    
    try {
      setAddressSearchLoading(prev => ({ ...prev, delivery: true }));
      const coords = await geocodeAddress(deliveryAddress);
      setDeliveryCoords(coords);
      setAddressSearchLoading(prev => ({ ...prev, delivery: false }));
    } catch (error) {
      console.error('Error geocoding delivery address:', error);
      setAddressSearchLoading(prev => ({ ...prev, delivery: false }));
    }
  };
  
  // Calculate distance between two points in kilometers using the Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(2));
  };
  
  // Helper function to convert degrees to radians
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
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
        // Trigger geocoding for the selected address
        setTimeout(() => geocodeDeliveryAddress(), 300);
      }
    }
  };
  
  // Calculate price based on package details and map distance
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
    
    // Distance charge (if coordinates are available)
    let distancePrice = 0;
    if (mapDistance) {
      distancePrice = mapDistance * 5; // ₹5 per km
    } else if (pickupAddress && deliveryAddress) {
      // Fallback to estimate if no map distance available
      distancePrice = 50; // Default distance charge
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
  
  // Update price when form values or map distance changes
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
    isScheduledDelivery,
    mapDistance
  ]);
  
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
        pickupCoords: pickupCoords || null,
        deliveryCoords: deliveryCoords || null,
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
              <div className="form-input-group">
                <textarea
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onBlur={geocodePickupAddress}
                  className="form-textarea"
                  rows="2"
                  placeholder="Enter the full pickup address"
                  required
                ></textarea>
                <button 
                  type="button"
                  className="btn-sm ml-2"
                  onClick={geocodePickupAddress}
                  disabled={addressSearchLoading.pickup || !pickupAddress}
                >
                  {addressSearchLoading.pickup ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <span>Verify</span>
                  )}
                </button>
              </div>
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
                <div className="form-input-group">
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    onBlur={geocodeDeliveryAddress}
                    className="form-textarea"
                    rows="2"
                    placeholder="Enter the full delivery address"
                    required
                  ></textarea>
                  <button 
                    type="button"
                    className="btn-sm ml-2"
                    onClick={geocodeDeliveryAddress}
                    disabled={addressSearchLoading.delivery || !deliveryAddress}
                  >
                    {addressSearchLoading.delivery ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <span>Verify</span>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Map display for addresses */}
            <div className="map-container-wrapper mt-4">
              <h3 className="text-lg font-semibold mb-2">Delivery Route Preview</h3>
              {/* Map container with explicit height to ensure visibility */}
              <div 
                ref={mapContainerRef} 
                className="map-container" 
                style={{ height: "300px", width: "100%" }}
              ></div>
              
              {/* Display distance if available */}
              {mapDistance && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Estimated Distance:</strong> {mapDistance} km
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row mt-2 justify-between">
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Pickup Location</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Delivery Location</span>
                </div>
              </div>
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
                  <span>Distance Charge ({mapDistance ? `${mapDistance} km` : 'estimated'}):</span>
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