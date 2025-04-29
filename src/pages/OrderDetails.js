import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import MapTracking from '../components/MapTracking'; // Import MapTracking component

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [partner, setPartner] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const { userType, currentUser } = useAuth();

  // OTP verification
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  
  // Rating
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingComment, setRatingComment] = useState('');
  
  // Map tracking
  const [enableSimulation, setEnableSimulation] = useState(false);
  
  // Generate a random OTP code (6 digits)
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  useEffect(() => {
    const orderRef = doc(db, 'orders', orderId);
    
    const unsubscribe = onSnapshot(orderRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const orderData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Ensure all timestamps are properly converted to Date objects
        const processedOrderData = processTimestamps(orderData);
        setOrder(processedOrderData);
        
        // Check if this order needs rating (for customers)
        if (userType === 'customer' && processedOrderData.status === 'delivered' && !processedOrderData.rated) {
          setShowRating(true);
        }
        
        // Check if OTP is verified (for partners)
        if (processedOrderData.otpVerified) {
          setOtpVerified(true);
        }
        
        try {
          // If order is assigned to a partner, get partner details
          if (processedOrderData.partnerId) {
            const partnerRef = doc(db, 'users', processedOrderData.partnerId);
            const partnerSnapshot = await getDoc(partnerRef);
            if (partnerSnapshot.exists()) {
              setPartner({ id: partnerSnapshot.id, ...partnerSnapshot.data() });
            }
          }
          
          // Get customer details
          if (processedOrderData.customerId) {
            const customerRef = doc(db, 'users', processedOrderData.customerId);
            const customerSnapshot = await getDoc(customerRef);
            if (customerSnapshot.exists()) {
              setCustomer({ id: customerSnapshot.id, ...customerSnapshot.data() });
            }
          }
        } catch (error) {
          console.error('Error fetching related details:', error);
          setError('Failed to load all order details. Please try again.');
        }
        
        setLoading(false);
      } else {
        setError('Order not found');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error loading order:', error);
      setError('Error loading order: ' + error.message);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [orderId, userType]);
  
  // Helper function to process Firestore timestamps into standard JS Dates
  const processTimestamps = (data) => {
    const result = { ...data };
    
    // Fields that might contain timestamps
    const dateFields = ['createdAt', 'updatedAt', 'inTransitAt', 'deliveredAt', 'ratingTimestamp', 'scheduledDeliveryTime'];
    
    for (const field of dateFields) {
      if (result[field]) {
        // Check if it's a Firestore timestamp (has seconds and nanoseconds)
        if (typeof result[field] === 'object' && result[field].seconds) {
          // Convert to JavaScript Date
          result[field] = new Date(result[field].seconds * 1000 + (result[field].nanoseconds || 0) / 1000000);
        } else if (!(result[field] instanceof Date)) {
          // Convert string dates to Date objects
          try {
            result[field] = new Date(result[field]);
          } catch (e) {
            console.warn(`Could not convert ${field} to Date`, e);
          }
        }
      }
    }
    
    return result;
  };
  
  const handleAcceptOrder = async () => {
    try {
      setStatusUpdateLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        partnerId: currentUser.uid,
        status: 'assigned',
        updatedAt: new Date()
      });
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error('Failed to accept order:', error);
      setError('Failed to accept order: ' + error.message);
      setStatusUpdateLoading(false);
    }
  };
  
  const handleUpdateStatus = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      
      // If transitioning to "delivered", check if OTP is verified
      if (newStatus === 'delivered' && !otpVerified) {
        setError('Please verify delivery OTP first');
        setStatusUpdateLoading(false);
        return;
      }
      
      const updates = {
        status: newStatus,
        updatedAt: new Date()
      };
      
      // Add delivered time if order is being marked as delivered
      if (newStatus === 'delivered') {
        updates.deliveredAt = new Date();
      }
      
      // Add in-transit time if order is starting delivery
      if (newStatus === 'in-transit') {
        updates.inTransitAt = new Date();
        
        // Generate OTP if it doesn't exist already
        if (!order.deliveryOtp) {
          updates.deliveryOtp = generateOTP();
        }
      }
      
      await updateDoc(orderRef, updates);
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update status: ' + error.message);
      setStatusUpdateLoading(false);
    }
  };

  const generateDeliveryOtp = async () => {
    if (!order) return;
    
    try {
      setGeneratingOtp(true);
      const newOtp = generateOTP();
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        deliveryOtp: newOtp,
        updatedAt: new Date()
      });
      
      setGeneratingOtp(false);
    } catch (error) {
      console.error('Failed to generate OTP:', error);
      setError('Failed to generate OTP: ' + error.message);
      setGeneratingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpInput.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }
    
    if (!order.deliveryOtp) {
      setOtpError('No OTP found for this order. Please generate one first.');
      return;
    }
    
    if (otpInput.trim() !== order.deliveryOtp) {
      setOtpError('Invalid OTP. Please check and try again');
      return;
    }
    
    try {
      setStatusUpdateLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        otpVerified: true,
        updatedAt: new Date()
      });
      setOtpVerified(true);
      setOtpError('');
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setOtpError('Failed to verify OTP: ' + error.message);
      setStatusUpdateLoading(false);
    }
  };

  const handlePaymentReceived = async () => {
    try {
      setStatusUpdateLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'paid',
        updatedAt: new Date()
      });
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error('Failed to update payment status:', error);
      setError('Failed to update payment status: ' + error.message);
      setStatusUpdateLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setStatusUpdateLoading(true);
      
      // Update the order to mark it as rated
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        rated: true,
        rating: rating,
        ratingComment: ratingComment,
        ratingTimestamp: new Date()
      });
      
      // Add rating to ratings collection
      await addDoc(collection(db, 'ratings'), {
        orderId: orderId,
        partnerId: order.partnerId,
        customerId: currentUser.uid,
        rating: rating,
        comment: ratingComment,
        createdAt: serverTimestamp()
      });
      
      // Update partner's average rating
      if (partner) {
        const partnerRef = doc(db, 'users', partner.id);
        const partnerData = await getDoc(partnerRef);
        
        if (partnerData.exists()) {
          const partnerInfo = partnerData.data();
          const totalRatings = partnerInfo.totalRatings || 0;
          const currentRating = partnerInfo.rating || 0;
          
          // Calculate new average rating
          const newTotalRatings = totalRatings + 1;
          const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;
          
          await updateDoc(partnerRef, {
            rating: parseFloat(newRating.toFixed(1)),
            totalRatings: newTotalRatings
          });
        }
      }
      
      setRatingSubmitted(true);
      setShowRating(false);
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      setError('Failed to submit rating: ' + error.message);
      setStatusUpdateLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  // Handle distance calculation from MapTracking
  const handleDistanceCalculated = (distance) => {
    console.log(`Distance calculated: ${distance} km`);
    // You can use this data to update UI or store it
  };
  
  // Toggle simulation mode
  const toggleSimulation = () => {
    setEnableSimulation(!enableSimulation);
  };
  
  if (loading) {
    return (
      <div className="loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="form-error">{error}</div>
        <button onClick={handleBackClick} className="btn mt-4">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Go Back
        </button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="not-found-container">
        <div className="text-center p-4">Order not found</div>
        <button onClick={handleBackClick} className="btn">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Go Back
        </button>
      </div>
    );
  }
  
  // Helper function to get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'assigned': return 'status-assigned';
      case 'in-transit': return 'status-transit';
      case 'delivered': return 'status-delivered';
      default: return '';
    }
  };

  // Format date properly handling Firestore timestamps
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      // Check if it's a valid date
      const d = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(d.getTime())) {
        return 'N/A';
      }
      
      return d.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Calculate delivery time with proper date handling
  const calculateDeliveryTime = () => {
    if (!order.inTransitAt || !order.deliveredAt) return 'N/A';
    
    try {
      // Get start and end times from already processed dates
      const startTime = order.inTransitAt;
      const endTime = order.deliveredAt;
      
      // Check if dates are valid
      if (!(startTime instanceof Date) || !(endTime instanceof Date) || 
          isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return 'N/A';
      }
      
      const diffMs = endTime - startTime;
      
      // Convert to hours and minutes
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error calculating delivery time:', error);
      return 'N/A';
    }
  };

  // Get the status icon based on order status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'assigned':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
        );
      case 'in-transit':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        );
      case 'delivered':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="order-details">
      {/* Rating Modal */}
      {showRating && (
        <div className="rating-modal">
          <div className="rating-modal-content">
            <h3 className="rating-title">Rate Your Delivery</h3>
            <p className="rating-description">How was your delivery experience?</p>
            
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${rating >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill={rating >= star ? 'currentColor' : 'none'} strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </button>
              ))}
            </div>
            
            <div className="form-group">
              <label className="form-label">Add a comment (optional)</label>
              <textarea
                className="form-textarea"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
                rows="3"
              ></textarea>
            </div>
            
            <div className="rating-buttons">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowRating(false)}
              >
                Skip
              </button>
              <button 
                type="button" 
                className="btn"
                onClick={submitRating}
                disabled={statusUpdateLoading}
              >
                {statusUpdateLoading ? (
                  <span>
                    <span className="btn-loader"></span>
                    Submitting...
                  </span>
                ) : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="order-card">
        <div className="order-header">
          <h2 className="order-card-title">
            <span className="order-card-icon">
              {getStatusIcon(order.status)}
            </span>
            Order Details
          </h2>
          <div className={`status-pill ${getStatusClass(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>
        
        <div className="order-body">
          <div className="order-id-section mb-4">
            <div className="flex justify-between">
              <span className="text-gray">Order ID: <span className="font-medium">{order.id}</span></span>
              <span className="text-gray">Created: <span className="font-medium">{formatDate(order.createdAt)}</span></span>
            </div>
          </div>
          
          {/* Map Tracking Component */}
          {order.status !== 'pending' && (
            <MapTracking
              orderId={orderId}
              pickupAddress={order.pickupAddress}
              deliveryAddress={order.deliveryAddress}
              partnerInfo={partner}
              orderStatus={order.status}
              onDistanceCalculated={handleDistanceCalculated}
              enableSimulation={enableSimulation}
            />
          )}
          
          {/* For dev/demo purposes, add a simulation toggle */}
          {userType === 'customer' && order.status === 'pending' && (
            <div className="mb-4">
              <button
                onClick={toggleSimulation}
                className="btn btn-outline btn-sm"
              >
                {enableSimulation ? 'Disable Simulation' : 'Enable Demo Simulation'}
              </button>
              <small className="text-gray block mt-1">For demonstration purposes</small>
            </div>
          )}
          
          {/* OTP section - only visible to the appropriate user */}
          {(order.deliveryOtp || order.status === 'in-transit') && (
            <div className="otp-section">
              {userType === 'customer' && order.status !== 'delivered' && order.deliveryOtp && (
                <div className="otp-display">
                  <h3>Delivery Verification Code</h3>
                  <div className="otp-code">{order.deliveryOtp}</div>
                  <p className="otp-instruction">Share this code with your delivery partner when they arrive</p>
                </div>
              )}
              
              {userType === 'partner' && order.partnerId === currentUser.uid && order.status === 'in-transit' && !otpVerified && (
                <div className="otp-verification">
                  <h3>Delivery Verification</h3>
                  <p className="otp-instruction">Ask the customer for their verification code</p>
                  
                  {!order.deliveryOtp && (
                    <div className="mb-4">
                      <p className="form-error">No delivery OTP found for this order.</p>
                      <button 
                        className="btn"
                        onClick={generateDeliveryOtp}
                        disabled={generatingOtp}
                      >
                        {generatingOtp ? (
                          <span>
                            <span className="btn-loader"></span>
                            Generating...
                          </span>
                        ) : 'Generate OTP'}
                      </button>
                    </div>
                  )}
                  
                  {order.deliveryOtp && (
                    <div className="otp-input-container">
                      <input
                        type="text"
                        className={`otp-input ${otpError ? 'error' : ''}`}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter verification code"
                        maxLength={6}
                      />
                      <button 
                        className="btn"
                        onClick={verifyOtp}
                        disabled={statusUpdateLoading}
                      >
                        {statusUpdateLoading ? (
                          <span>
                            <span className="btn-loader"></span>
                            Verifying...
                          </span>
                        ) : 'Verify'}
                      </button>
                    </div>
                  )}
                  
                  {otpError && <p className="otp-error">{otpError}</p>}
                </div>
              )}
              
              {otpVerified && (
                <div className="otp-verified">
                  <div className="verified-badge">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>Delivery Code Verified</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Package Details */}
      <div className="order-card">
        <div className="order-header">
          <h3 className="order-card-title">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Package Information
          </h3>
        </div>
        
        <div className="order-body">
          <div className="order-meta">
            <div className="order-meta-item">
              <span className="order-meta-label">Size:</span>
              <span className="order-meta-value capitalize">{order.packageSize}</span>
            </div>
            <div className="order-meta-item">
              <span className="order-meta-label">Weight:</span>
              <span className="order-meta-value">{order.packageWeight} kg</span>
            </div>
            <div className="order-meta-item">
              <span className="order-meta-label">Price:</span>
              <span className="order-meta-value">₹{order.price}</span>
            </div>
            <div className="order-meta-item">
              <span className="order-meta-label">Status:</span>
              <span className={`status-text ${getStatusClass(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Description:</h4>
            <p className="bg-gray-50 p-3 rounded">{order.packageDescription || "No description provided"}</p>
          </div>
        </div>
      </div>
      
      {/* Addresses */}
      <div className="order-card">
        <div className="order-header">
          <h3 className="order-card-title">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Delivery Information
          </h3>
        </div>
        
        <div className="order-body">
          <div className="order-grid">
            <div className="order-section">
              <h4 className="text-sm font-semibold mb-2">Pickup Details</h4>
              <p className="mb-2 bg-gray-50 p-3 rounded">{order.pickupAddress}</p>
              
              {customer && userType === 'partner' && (
                <div className="customer-info mt-4">
                  <h4 className="text-sm font-semibold">Customer</h4>
                  <p className="mb-0">{customer.name || 'Unnamed Customer'}</p>
                  <p className="mb-0">{customer.phone || 'No phone number'}</p>
                </div>
              )}
            </div>
            
            <div className="order-section">
              <h4 className="text-sm font-semibold mb-2">Delivery Details</h4>
              <p className="mb-2 bg-gray-50 p-3 rounded">{order.deliveryAddress}</p>
              <div className="recipient-details">
                <p className="mb-0"><span className="font-medium">Recipient:</span> {order.recipientName}</p>
                <p className="mb-0"><span className="font-medium">Phone:</span> {order.recipientPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Information */}
      <div className="order-card">
        <div className="order-header">
          <h3 className="order-card-title">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Payment Information
          </h3>
        </div>
        
        <div className="order-body">
          <div className="order-meta">
            <div className="order-meta-item">
              <span className="order-meta-label">Payment Method:</span>
              <span className="order-meta-value capitalize">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'Not specified'}
              </span>
            </div>
            <div className="order-meta-item">
              <span className="order-meta-label">Payment Status:</span>
              <span className={`status-text ${
                order.paymentStatus === 'paid' ? 'status-delivered' : 
                order.paymentStatus === 'pending' ? 'status-pending' : 
                order.paymentStatus === 'failed' ? 'status-failed' : ''
              }`}>
                {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Not specified'}
              </span>
            </div>
          </div>
          
          {/* For Cash on Delivery orders that are in transit or delivered */}
          {order.paymentMethod === 'cod' && order.status === 'in-transit' && order.paymentStatus === 'pending' && userType === 'partner' && (
            <div className="payment-collection-info mt-4">
              <p className="text-sm font-semibold mb-2">Cash Collection:</p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="mb-0">Please collect <span className="font-medium">₹{order.price}</span> from the customer upon delivery.</p>
              </div>
            </div>
          )}
          
          {/* Allow partner to mark payment as received */}
          {order.paymentMethod === 'cod' && order.status === 'delivered' && order.paymentStatus === 'pending' && userType === 'partner' && (
            <div className="mt-4">
              <button
                onClick={() => handlePaymentReceived()}
                className="btn btn-success"
                disabled={statusUpdateLoading}
              >
                {statusUpdateLoading ? (
                  <span>
                    <span className="btn-loader"></span>
                    Processing...
                  </span>
                ) : 'Mark Payment as Received'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline section */}
      <div className="order-card">
        <div className="order-header">
          <h3 className="order-card-title">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Delivery Timeline
          </h3>
        </div>
        
        <div className="order-body">
          <div className="timeline">
            <div className={`timeline-item ${order.createdAt ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Order Created</h4>
                <p className="timeline-time">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            
            <div className={`timeline-item ${order.status !== 'pending' ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Assigned to Partner</h4>
                <p className="timeline-time">
                  {order.status === 'pending' ? 'Waiting for partner' : 
                   formatDate(order.updatedAt)}
                </p>
              </div>
            </div>
            
            <div className={`timeline-item ${order.status === 'in-transit' || order.status === 'delivered' ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">In Transit</h4>
                <p className="timeline-time">
                  {order.status === 'pending' || order.status === 'assigned' ? 
                   'Waiting for pickup' : formatDate(order.inTransitAt)}
                </p>
              </div>
            </div>
            
            <div className={`timeline-item ${order.otpVerified ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">OTP Verified</h4>
                <p className="timeline-time">
                  {!order.otpVerified ? 'Pending verification' : 
                   'Verified successfully'}
                </p>
              </div>
            </div>
            
            <div className={`timeline-item ${order.status === 'delivered' ? 'completed' : ''}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Delivered</h4>
                <p className="timeline-time">
                  {order.status !== 'delivered' ? 'Pending delivery' : 
                   formatDate(order.deliveredAt)}
                </p>
                {order.status === 'delivered' && (
                  <p className="timeline-detail">Delivery Time: {calculateDeliveryTime()}</p>
                )}
              </div>
            </div>
            
            {order.rated && (
              <div className="timeline-item completed">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4 className="timeline-title">Delivery Rated</h4>
                  <div className="timeline-rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`rating-star ${i < order.rating ? 'active' : ''}`}>★</span>
                    ))}
                  </div>
                  {order.ratingComment && (
                    <p className="timeline-comment">"{order.ratingComment}"</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Partner Information */}
      {partner && (
        <div className="order-card">
          <div className="order-header">
            <h3 className="order-card-title">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Delivery Partner
            </h3>
          </div>
          
          <div className="order-body">
            <div className="partner-info">
              <div className="partner-avatar">
                {partner.name ? partner.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="partner-details">
                <p className="partner-name">{partner.name || 'Unknown'}</p>
                <p className="partner-contact">{partner.phone || 'No phone number'}</p>
                <p className="partner-contact capitalize">{partner.vehicleType || 'No vehicle info'}</p>
                
                {partner.rating > 0 && (
                  <div className="partner-rating">
                    <span className="rating-value">{partner.rating.toFixed(1)}</span>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`rating-star ${i < Math.floor(partner.rating) ? 'active' : i < partner.rating ? 'half-active' : ''}`}>★</span>
                      ))}
                    </div>
                    <span className="rating-count">({partner.totalRatings || 0} ratings)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mt-4">
        {userType === 'partner' && order.status === 'pending' && !order.partnerId && (
          <button
            onClick={handleAcceptOrder}
            disabled={statusUpdateLoading}
            className="btn btn-full"
          >
            {statusUpdateLoading ? (
              <span>
                <span className="btn-loader"></span>
                Processing...
              </span>
            ) : 'Accept Order'}
          </button>
        )}
        
        {userType === 'partner' && order.partnerId === currentUser.uid && (
          <div className="mt-4">
            {order.status === 'assigned' && (
              <button
                onClick={() => handleUpdateStatus('in-transit')}
                disabled={statusUpdateLoading}
                className="btn btn-full"
                style={{backgroundColor: '#8b5cf6'}}
              >
                {statusUpdateLoading ? (
                  <span>
                    <span className="btn-loader"></span>
                    Updating Status...
                  </span>
                ) : (
                  <span>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Start Delivery
                  </span>
                )}
              </button>
            )}
            
            {order.status === 'in-transit' && (
              <button
                onClick={() => handleUpdateStatus('delivered')}
                disabled={statusUpdateLoading || !otpVerified}
                className={`btn btn-full ${!otpVerified ? 'btn-disabled' : 'btn-success'}`}
              >
                {statusUpdateLoading ? (
                  <span>
                    <span className="btn-loader"></span>
                    Updating Status...
                  </span>
                ) : otpVerified ? (
                  <span>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Mark as Delivered
                  </span>
                ) : 'Verify OTP to Complete'}
              </button>
            )}
          </div>
        )}
      </div>
      
      {ratingSubmitted && (
        <div className="rating-thankyou mt-4">
          <p>Thank you for your feedback!</p>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;