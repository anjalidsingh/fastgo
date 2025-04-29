import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import MapTracking from '../components/MapTracking';
import { getCurrentPosition } from '../services/mapService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';

// Enhanced color palette
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

function PartnerDashboard() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [busyAreas, setBusyAreas] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [dailyEarnings, setDailyEarnings] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    deliveryTime: [],
    ratingHistory: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistance, setFilterDistance] = useState('all');
  const [timeframe, setTimeframe] = useState('week');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Get partner's current location
  useEffect(() => {
    const initLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setCurrentPosition(position);
      } catch (error) {
        console.error('Error getting current position:', error);
      }
    };
    
    initLocation();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPartnerProfile = async () => {
      try {
        // Use getDoc for a single document
        const partnerRef = doc(db, 'users', currentUser.uid);
        const partnerDoc = await getDoc(partnerRef);
        
        if (partnerDoc.exists()) {
          setIsAvailable(partnerDoc.data().isAvailable || false);
        }
      } catch (error) {
        console.error('Error fetching partner profile:', error);
      }
    };

    fetchPartnerProfile();
    
    // Available orders (pending orders not assigned to anyone)
    const availableOrdersQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      where('partnerId', '==', null),
      orderBy('createdAt', 'desc')
    );
    
    const availableOrdersUnsubscribe = onSnapshot(availableOrdersQuery, 
      (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Calculate distance if we have current position
          let distance = null;
          if (currentPosition && data.pickupCoords) {
            // Simple distance calculation (this is a mock implementation)
            // In a real app, you would use a proper geospatial calculation
            distance = Math.round(Math.random() * 15 + 1); // Random distance between 1-15 km
          }
          
          ordersData.push({
            id: doc.id,
            ...data,
            // Ensure dates are properly handled and set defaults
            createdAt: data.createdAt?.toDate() || new Date(),
            paymentStatus: data.paymentStatus || 'pending',
            distance: distance
          });
        });
        setAvailableOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to available orders:', error);
        setError('Error loading available orders. Please try again.');
        setLoading(false);
      }
    );
    
    // Orders assigned to this partner (assigned and in-transit)
    const assignedOrdersQuery = query(
      collection(db, 'orders'),
      where('partnerId', '==', currentUser.uid),
      where('status', 'in', ['assigned', 'in-transit']),
      orderBy('updatedAt', 'desc')
    );
    
    const assignedOrdersUnsubscribe = onSnapshot(assignedOrdersQuery, 
      (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            ...data,
            // Ensure dates are properly handled and set defaults
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            paymentStatus: data.paymentStatus || 'pending'
          });
        });
        setAssignedOrders(ordersData);
        
        // Auto-select the first active order for tracking if no order is selected
        if (ordersData.length > 0 && (!selectedOrder || !ordersData.find(order => order.id === selectedOrder.id))) {
          const inTransitOrders = ordersData.filter(order => order.status === 'in-transit');
          if (inTransitOrders.length > 0) {
            setSelectedOrder(inTransitOrders[0]);
          } else if (ordersData.length > 0) {
            setSelectedOrder(ordersData[0]);
          }
        }
      },
      (error) => {
        console.error('Error listening to assigned orders:', error);
      }
    );
    
    // Recent completed orders
    const fetchCompletedOrders = async () => {
      try {
        const completedOrdersQuery = query(
          collection(db, 'orders'),
          where('partnerId', '==', currentUser.uid),
          where('status', '==', 'delivered'),
          orderBy('deliveredAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(completedOrdersQuery);
        const ordersData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            ...data,
            // Ensure dates are properly handled and set defaults
            createdAt: data.createdAt?.toDate() || new Date(),
            deliveredAt: data.deliveredAt?.toDate() || new Date(),
            paymentStatus: data.paymentStatus || 'pending'
          });
        });
        
        setCompletedOrders(ordersData);
      } catch (error) {
        console.error('Error fetching completed orders:', error);
      }
    };
    
    // Calculate earnings and daily earnings for chart
    const calculateEarnings = async () => {
      try {
        const allOrdersQuery = query(
          collection(db, 'orders'),
          where('partnerId', '==', currentUser.uid),
          where('status', '==', 'delivered')
        );
        
        const querySnapshot = await getDocs(allOrdersQuery);
        
        let totalEarnings = 0;
        let todayEarnings = 0;
        let weekEarnings = 0;
        let monthEarnings = 0;
        
        // For daily earnings chart
        const dailyEarningsMap = {};
        const deliveryTimes = [];
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of the week (Sunday)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // For chart timeframe
        const timeframeStart = new Date(now);
        if (timeframe === 'week') {
          timeframeStart.setDate(now.getDate() - 7); // Last 7 days
        } else if (timeframe === 'month') {
          timeframeStart.setDate(now.getDate() - 30); // Last 30 days
        }
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let deliveredAt;
          
          // Handle Firestore timestamp conversion
          if (data.deliveredAt) {
            if (data.deliveredAt.toDate) {
              // Firebase Timestamp
              deliveredAt = data.deliveredAt.toDate();
            } else {
              // Regular Date object or string
              deliveredAt = new Date(data.deliveredAt);
            }
          } else {
            deliveredAt = new Date();
          }
          
          const orderAmount = data.price || 0;
          
          // Calculate partner's cut (80% of the total price)
          const partnerAmount = orderAmount * 0.8;
          
          totalEarnings += partnerAmount;
          
          if (deliveredAt) {
            // Daily earnings for chart
            if (deliveredAt >= timeframeStart) {
              const dateKey = deliveredAt.toISOString().split('T')[0];
              if (!dailyEarningsMap[dateKey]) {
                dailyEarningsMap[dateKey] = 0;
              }
              dailyEarningsMap[dateKey] += partnerAmount;
            }
            
            // Calculate delivery time if inTransitAt is available
            if (data.inTransitAt) {
              const inTransitAt = data.inTransitAt.toDate ? 
                data.inTransitAt.toDate() : new Date(data.inTransitAt);
              
              const timeDiffMs = deliveredAt - inTransitAt;
              const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
              
              // Only include reasonable delivery times (1-120 minutes)
              if (timeDiffMinutes >= 1 && timeDiffMinutes <= 120) {
                deliveryTimes.push({
                  orderId: doc.id,
                  time: timeDiffMinutes,
                  date: deliveredAt.toISOString().split('T')[0]
                });
              }
            }
            
            // Calculate earnings by period
            if (deliveredAt >= todayStart) {
              todayEarnings += partnerAmount;
            }
            
            if (deliveredAt >= weekStart) {
              weekEarnings += partnerAmount;
            }
            
            if (deliveredAt >= monthStart) {
              monthEarnings += partnerAmount;
            }
          }
        });
        
        setEarnings({
          today: Math.round(todayEarnings),
          week: Math.round(weekEarnings),
          month: Math.round(monthEarnings),
          total: Math.round(totalEarnings)
        });
        
        // Format daily earnings for chart
        const dailyEarningsArray = Object.keys(dailyEarningsMap).map(date => ({
          date,
          amount: Math.round(dailyEarningsMap[date])
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        setDailyEarnings(dailyEarningsArray);
        
        // Update performance data
        setPerformanceData(prev => ({
          ...prev,
          deliveryTime: deliveryTimes
        }));
      } catch (error) {
        console.error('Error calculating earnings:', error);
      }
    };
    
    // Fetch ratings
    const fetchRatings = async () => {
      try {
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('partnerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(ratingsQuery);
        const ratingData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          
          ratingData.push({
            id: doc.id,
            rating: data.rating,
            comment: data.comment,
            date: createdAt.toISOString().split('T')[0]
          });
        });
        
        setPerformanceData(prev => ({
          ...prev,
          ratingHistory: ratingData
        }));
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };
    
    // Generate busy areas (in a real app, this would come from backend data)
    const generateBusyAreas = () => {
      // For demo purposes, we'll create a list of busy areas
      // In a real app, this would be fetched from a server based on real-time data
      const areas = [
        {
          name: "Downtown",
          activeOrders: Math.floor(Math.random() * 15) + 5,
          avgFare: Math.floor(Math.random() * 150) + 100,
          intensity: 5, // 1-5 scale of how busy it is
          distance: Math.floor(Math.random() * 5) + 1
        },
        {
          name: "North District",
          activeOrders: Math.floor(Math.random() * 10) + 3,
          avgFare: Math.floor(Math.random() * 120) + 80,
          intensity: 3,
          distance: Math.floor(Math.random() * 7) + 3
        },
        {
          name: "West Heights",
          activeOrders: Math.floor(Math.random() * 8) + 2,
          avgFare: Math.floor(Math.random() * 180) + 120,
          intensity: 4,
          distance: Math.floor(Math.random() * 10) + 4
        },
        {
          name: "East Village",
          activeOrders: Math.floor(Math.random() * 6) + 1,
          avgFare: Math.floor(Math.random() * 100) + 70,
          intensity: 2,
          distance: Math.floor(Math.random() * 8) + 2
        }
      ];
      
      setBusyAreas(areas);
    };
    
    fetchCompletedOrders();
    calculateEarnings();
    fetchRatings();
    generateBusyAreas();
    
    return () => {
      availableOrdersUnsubscribe();
      assignedOrdersUnsubscribe();
    };
  }, [currentUser, selectedOrder, timeframe, currentPosition]);

  // Apply filters to available orders
  useEffect(() => {
    let result = [...availableOrders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.pickupAddress?.toLowerCase().includes(query) ||
        order.deliveryAddress?.toLowerCase().includes(query)
      );
    }
    
    // Apply distance filter
    if (filterDistance !== 'all') {
      const maxDistance = Number(filterDistance);
      result = result.filter(order => 
        (order.distance || 0) <= maxDistance
      );
    }
    
    setFilteredOrders(result);
  }, [availableOrders, searchQuery, filterDistance]);

  const toggleAvailability = async () => {
    if (!currentUser) return;
    
    try {
      setStatusUpdateLoading(true);
      const partnerRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(partnerRef, {
        isAvailable: !isAvailable,
        updatedAt: new Date()
      });
      
      setIsAvailable(!isAvailable);
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      setError('Failed to update your availability status.');
      setStatusUpdateLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId, e) => {
    if (e) e.stopPropagation();
    
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
  
  const handleUpdateStatus = async (orderId, newStatus, e) => {
    if (e) e.stopPropagation();
    
    try {
      setStatusUpdateLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      
      // Get the order first to check if OTP is verified for 'delivered' status
      const orderSnapshot = await getDoc(orderRef);
      const orderData = orderSnapshot.data();
      
      // If transitioning to "delivered", check if OTP is verified
      if (newStatus === 'delivered' && !orderData.otpVerified) {
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
        if (!orderData.deliveryOtp) {
          updates.deliveryOtp = (Math.floor(100000 + Math.random() * 900000)).toString();
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

  // Handle selecting an order for detailed tracking
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
  };

  // Format date for display
  const formatDate = (date) => {
    try {
      if (!date) return 'N/A';
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Get status classes for styling
  const getStatusClass = (status) => {
    if (!status) return '';
    switch (status) {
      case 'pending': return 'status-pending';
      case 'assigned': return 'status-assigned';
      case 'in-transit': return 'status-transit';
      case 'delivered': return 'status-delivered';
      default: return '';
    }
  };

  // Capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return 'Unknown';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  // Calculate average rating from performance data
  const averageRating = useMemo(() => {
    if (!performanceData.ratingHistory || performanceData.ratingHistory.length === 0) {
      return 0;
    }
    const sum = performanceData.ratingHistory.reduce((acc, item) => acc + item.rating, 0);
    return (sum / performanceData.ratingHistory.length).toFixed(1);
  }, [performanceData.ratingHistory]);

  // Calculate average delivery time from performance data
  const averageDeliveryTime = useMemo(() => {
    if (!performanceData.deliveryTime || performanceData.deliveryTime.length === 0) {
      return 0;
    }
    const sum = performanceData.deliveryTime.reduce((acc, item) => acc + item.time, 0);
    return Math.round(sum / performanceData.deliveryTime.length);
  }, [performanceData.deliveryTime]);

  if (loading) {
    return (
      <div className="loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Partner Dashboard</h1>
        <button
          onClick={toggleAvailability}
          disabled={statusUpdateLoading}
          className={`btn ${isAvailable ? 'btn-success' : 'btn-outline'}`}
        >
          {statusUpdateLoading ? (
            <span>
              <span className="btn-loader"></span>
              Updating...
            </span>
          ) : (
            <span>
              {isAvailable ? (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Available for Deliveries
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                  Not Available
                </>
              )}
            </span>
          )}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Earnings Summary */}
      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Today's Earnings</div>
            <div className="stat-value">₹{earnings.today}</div>
          </div>
        </div>

        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">This Week</div>
            <div className="stat-value">₹{earnings.week}</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">This Month</div>
            <div className="stat-value">₹{earnings.month}</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value">₹{earnings.total}</div>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Performance Dashboard</h2>
          <div className="tab-buttons">
            <button 
              onClick={() => setTimeframe('week')} 
              className={`tab-button ${timeframe === 'week' ? 'active' : ''}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeframe('month')} 
              className={`tab-button ${timeframe === 'month' ? 'active' : ''}`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="performance-summary">
          <div className="performance-card">
            <div className="performance-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="performance-title">Average Delivery Time</div>
            <div className="performance-value">{averageDeliveryTime} min</div>
          </div>

          <div className="performance-card">
            <div className="performance-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div className="performance-title">Average Rating</div>
            <div className="performance-value">
              {averageRating}
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={`rating-star ${star <= averageRating ? 'active' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="performance-title">Completed Orders</div>
            <div className="performance-value">{completedOrders.length}</div>
          </div>

          <div className="performance-card">
            <div className="performance-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
            <div className="performance-title">Pending Orders</div>
            <div className="performance-value">{assignedOrders.length}</div>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Daily Earnings Chart */}
          <div className="analytics-card">
            <h3 className="analytics-title">Daily Earnings</h3>
            <div className="chart-container" style={{ height: '250px' }}>
              {dailyEarnings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyEarnings}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Earnings']} />
                    <Bar dataKey="amount" fill="#4f46e5">
                      {dailyEarnings.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  No earnings data available for this time period
                </div>
              )}
            </div>
          </div>

          {/* Rating History */}
          <div className="analytics-card">
            <h3 className="analytics-title">Rating History</h3>
            <div className="chart-container" style={{ height: '250px' }}>
              {performanceData.ratingHistory && performanceData.ratingHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData.ratingHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  No rating data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Heat Map of Busy Areas */}
      {busyAreas.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">High Demand Areas</h2>
            <div className="section-subtitle">Find orders in these busy areas</div>
          </div>

          <div className="busy-areas-grid">
            {busyAreas.map((area, index) => (
              <div 
                key={index} 
                className="busy-area-card"
                style={{ 
                  backgroundColor: `rgba(79, 70, 229, ${0.1 + (area.intensity * 0.08)})`,
                  borderLeft: `4px solid rgba(79, 70, 229, ${0.5 + (area.intensity * 0.5)})`
                }}
              >
                <div className="busy-area-header">
                  <h3 className="busy-area-name">{area.name}</h3>
                  <div className="busy-area-intensity">
                    {Array(area.intensity).fill().map((_, i) => (
                      <div key={i} className="intensity-dot"></div>
                    ))}
                  </div>
                </div>
                <div className="busy-area-details">
                  <div className="busy-area-stats">
                    <div className="busy-area-stat">
                      <span className="stat-label">Active Orders</span>
                      <span className="stat-value">{area.activeOrders}</span>
                    </div>
                    <div className="busy-area-stat">
                      <span className="stat-label">Avg. Fare</span>
                      <span className="stat-value">₹{area.avgFare}</span>
                    </div>
                  </div>
                  <div className="busy-area-distance">{area.distance} km away</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Tracking for Selected Order */}
      {selectedOrder && selectedOrder.status !== 'pending' && (
        <div className="order-card mb-6">
          <div className="order-header">
            <h2 className="order-card-title">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              Live Tracking - Order #{selectedOrder.id.substring(0, 8)}
            </h2>
            <div className={`status-pill ${getStatusClass(selectedOrder.status)}`}>
              {selectedOrder.status ? capitalizeFirstLetter(selectedOrder.status) : 'Unknown'}
            </div>
          </div>
          <div className="order-body">
            <MapTracking
              orderId={selectedOrder.id}
              pickupAddress={selectedOrder.pickupAddress}
              deliveryAddress={selectedOrder.deliveryAddress}
              partnerInfo={{ name: 'You (Partner)' }}
              orderStatus={selectedOrder.status}
            />
            
            <div className="flex justify-center mt-4">
              <button
                onClick={() => handleOrderClick(selectedOrder.id)}
                className="btn"
              >
                View Order Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Orders */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Your Current Orders</h2>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <h3 className="empty-state-title">No Current Orders</h3>
            <p className="empty-state-description">You don't have any orders assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="order-cards">
            {assignedOrders.map(order => (
              <div 
                key={order.id} 
                className={`order-card-compact ${selectedOrder && selectedOrder.id === order.id ? 'border-primary border-2' : ''}`}
                onClick={() => handleSelectOrder(order)}
              >
                <div className="order-card-header">
                  <div className="order-card-title">Order #{order.id.substring(0, 8)}</div>
                  <div className={`status-pill ${getStatusClass(order.status)}`}>
                    {order.status ? capitalizeFirstLetter(order.status) : 'Unknown'}
                  </div>
                </div>
                <div className="order-card-content">
                  <div className="order-detail-row">
                    <span className="order-detail-label">From:</span>
                    <span className="order-detail-value">{order.pickupAddress ? order.pickupAddress.substring(0, 20) + '...' : 'N/A'}</span>
                  </div>
                  <div className="order-detail-row">
                    <span className="order-detail-label">To:</span>
                    <span className="order-detail-value">{order.deliveryAddress ? order.deliveryAddress.substring(0, 20) + '...' : 'N/A'}</span>
                  </div>
                  <div className="order-detail-row">
                    <span className="order-detail-label">Recipient:</span>
                    <span className="order-detail-value">{order.recipientName || 'N/A'}</span>
                  </div>
                  <div className="order-detail-row">
                    <span className="order-detail-label">Earnings:</span>
                    <span className="order-detail-value font-medium">₹{Math.round((order.price || 0) * 0.8)}</span>
                  </div>
                </div>
                <div className="order-card-footer">
                  <div className="order-package-size">
                    <span className="package-badge">{order.packageSize || 'N/A'}</span>
                    <span>{order.packageWeight || 0} kg</span>
                  </div>
                  <div className="order-actions">
                    {order.status === 'assigned' && (
                      <button 
                        className="btn-sm btn-secondary"
                        onClick={(e) => handleUpdateStatus(order.id, 'in-transit', e)}
                        disabled={statusUpdateLoading}
                      >
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'in-transit' && (
                      <button 
                        className="btn-sm btn-success"
                        onClick={(e) => handleUpdateStatus(order.id, 'delivered', e)}
                        disabled={statusUpdateLoading || !order.otpVerified}
                      >
                        {order.otpVerified ? 'Mark Delivered' : 'Verify OTP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Orders */}
      {isAvailable && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Available Orders</h2>
            
            <div className="filter-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              
              <div className="filter-container">
                <select
                  value={filterDistance}
                  onChange={(e) => setFilterDistance(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Distances</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="20">Within 20 km</option>
                </select>
              </div>
            </div>
          </div>

          {availableOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3 className="empty-state-title">No Available Orders</h3>
              <p className="empty-state-description">There are no available orders at the moment. Check back soon!</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h3 className="empty-state-title">No Matching Orders</h3>
              <p className="empty-state-description">No orders match your current filters. Try adjusting your search.</p>
              <button onClick={() => { setSearchQuery(''); setFilterDistance('all'); }} className="btn">Clear Filters</button>
            </div>
          ) : (
            <div className="order-cards">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="order-card-compact"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="order-card-header">
                    <div className="order-card-title">Order #{order.id.substring(0, 8)}</div>
                    {order.distance && (
                      <div className="distance-badge">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                        {order.distance} km
                      </div>
                    )}
                  </div>
                  <div className="order-card-content">
                    <div className="order-detail-row">
                      <span className="order-detail-label">From:</span>
                      <span className="order-detail-value">{order.pickupAddress ? order.pickupAddress.substring(0, 20) + '...' : 'N/A'}</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label">To:</span>
                      <span className="order-detail-value">{order.deliveryAddress ? order.deliveryAddress.substring(0, 20) + '...' : 'N/A'}</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label">Created:</span>
                      <span className="order-detail-value">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="order-detail-row">
                      <span className="order-detail-label">Potential Earnings:</span>
                      <span className="order-detail-value font-medium">₹{Math.round((order.price || 0) * 0.8)}</span>
                    </div>
                  </div>
                  <div className="order-card-footer">
                    <div className="order-package-size">
                      <span className="package-badge">{order.packageSize || 'N/A'}</span>
                      <span>{order.packageWeight || 0} kg</span>
                    </div>
                    <button 
                      className="btn-sm btn-primary"
                      onClick={(e) => handleAcceptOrder(order.id, e)}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recently Completed</h2>
            <Link to="/orders" className="section-link">
              View All
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
          </div>

          <div className="recent-orders-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Delivered</th>
                  <th>Recipient</th>
                  <th>Earnings</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map(order => (
                  <tr key={order.id} className="table-row">
                    <td>#{order.id.substring(0, 8)}</td>
                    <td>{formatDate(order.deliveredAt)}</td>
                    <td>{order.recipientName || 'N/A'}</td>
                    <td>₹{Math.round((order.price || 0) * 0.8)}</td>
                    <td>
                      <span className={`payment-status ${order.paymentStatus === 'paid' ? 'payment-paid' : 'payment-pending'}`}>
                        {order.paymentStatus ? capitalizeFirstLetter(order.paymentStatus) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-icon btn-sm"
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerDashboard;