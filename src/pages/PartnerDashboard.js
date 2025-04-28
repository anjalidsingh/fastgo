import React, { useState, useEffect } from 'react';
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

function PartnerDashboard() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchPartnerProfile = async () => {
      try {
        // Use getDoc for a single document, not getDocs
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
          ordersData.push({
            id: doc.id,
            ...data,
            // Ensure dates are properly handled and set defaults
            createdAt: data.createdAt?.toDate() || new Date(),
            paymentStatus: data.paymentStatus || 'pending'
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
    
    // Calculate earnings
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
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of the week (Sunday)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let deliveredAt;
          
          // Handle Firestore timestamp conversion
          if (data.deliveredAt) {
            if (data.deliveredAt.toDate) {
              deliveredAt = data.deliveredAt.toDate();
            } else {
              deliveredAt = new Date(data.deliveredAt);
            }
          }
          
          const orderAmount = data.price || 0;
          
          // Calculate partner's cut (80% of the total price)
          const partnerAmount = orderAmount * 0.8;
          
          totalEarnings += partnerAmount;
          
          if (deliveredAt) {
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
      } catch (error) {
        console.error('Error calculating earnings:', error);
      }
    };
    
    fetchCompletedOrders();
    calculateEarnings();
    
    return () => {
      availableOrdersUnsubscribe();
      assignedOrdersUnsubscribe();
    };
  }, [currentUser]);

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

  // Helper function to safely format dates
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

  // Helper function to safely get status classes
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

  // Helper function to safely capitalize the first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return 'Unknown';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

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
                className="order-card-compact" 
                onClick={() => handleOrderClick(order.id)}
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
                  <button className="btn-sm">Continue</button>
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
          ) : (
            <div className="order-cards">
              {availableOrders.map(order => (
                <div 
                  key={order.id} 
                  className="order-card-compact" 
                  onClick={() => handleOrderClick(order.id)}
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
                    <button className="btn-sm">View Details</button>
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

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>

        <div className="quick-actions">
          <Link to="/partner/profile" className="quick-action-card">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="quick-action-title">Profile</div>
            <p className="quick-action-desc">Manage your account settings</p>
          </Link>

          <Link to="/orders" className="quick-action-card">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="quick-action-title">Order History</div>
            <p className="quick-action-desc">View all your past deliveries</p>
          </Link>

          <Link to="#" className="quick-action-card">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <div className="quick-action-title">Ratings</div>
            <p className="quick-action-desc">View customer feedback</p>
          </Link>

          <Link to="#" className="quick-action-card">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="quick-action-title">Help & Support</div>
            <p className="quick-action-desc">Get assistance or report issues</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PartnerDashboard;