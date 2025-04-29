import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import MapTracking from '../components/MapTracking';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Enhanced color palette
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];
const DELIVERY_STATUS = ['pending', 'assigned', 'in-transit', 'delivered'];

function Dashboard() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    avgOrderValue: 0
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [timeframe, setTimeframe] = useState('week');
  const [spendingData, setSpendingData] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch active orders, recent orders, and statistics
  useEffect(() => {
    if (!currentUser) return;
    
    // Set up real-time listeners for active orders
    const activeOrdersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', currentUser.uid),
      where('status', 'in', ['pending', 'assigned', 'in-transit']),
      orderBy('createdAt', 'desc')
    );
    
    const activeOrdersUnsubscribe = onSnapshot(activeOrdersQuery, 
      (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            paymentStatus: data.paymentStatus || 'pending'
          });
        });
        setActiveOrders(ordersData);
        
        // Auto-select the first active order for tracking if no order is selected
        if (ordersData.length > 0 && (!selectedOrder || !ordersData.find(order => order.id === selectedOrder.id))) {
          const inTransitOrders = ordersData.filter(order => order.status === 'in-transit');
          if (inTransitOrders.length > 0) {
            setSelectedOrder(inTransitOrders[0]);
          } else if (ordersData.length > 0) {
            setSelectedOrder(ordersData[0]);
          }
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to orders:', error);
        setError('Error loading orders. Please try again.');
        setLoading(false);
      }
    );
    
    // Fetch recent delivered orders
    const fetchRecentOrders = async () => {
      try {
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', currentUser.uid),
          where('status', '==', 'delivered'),
          orderBy('deliveredAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(recentOrdersQuery);
        const ordersData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            deliveredAt: data.deliveredAt?.toDate() || new Date(),
            paymentStatus: data.paymentStatus || 'pending'
          });
        });
        
        setRecentOrders(ordersData);
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      }
    };

    // Fetch statistics
    const fetchStats = async () => {
      try {
        const allOrdersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(allOrdersQuery);
        const stats = {
          totalOrders: 0,
          pendingOrders: 0,
          inTransitOrders: 0,
          deliveredOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0
        };
        
        // Prepare spending data for chart
        const spending = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          stats.totalOrders++;
          
          if (data.status === 'pending') {
            stats.pendingOrders++;
          } else if (data.status === 'in-transit') {
            stats.inTransitOrders++;
          } else if (data.status === 'delivered') {
            stats.deliveredOrders++;
            
            // Calculate spending data for chart
            if (data.deliveredAt && data.price) {
              const deliveredDate = data.deliveredAt.toDate ? 
                data.deliveredAt.toDate() : new Date(data.deliveredAt);
              
              const dateKey = deliveredDate.toISOString().split('T')[0];
              if (!spending[dateKey]) {
                spending[dateKey] = 0;
              }
              spending[dateKey] += data.price;
            }
          }
          
          if (data.price) {
            stats.totalSpent += data.price;
          }
        });
        
        if (stats.totalOrders > 0) {
          stats.avgOrderValue = Math.round(stats.totalSpent / stats.totalOrders);
        }
        
        setStatsData(stats);
        
        // Format spending data for chart
        const spendingArray = Object.keys(spending).map(date => ({
          date,
          amount: spending[date]
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        // Get last 7 days, 30 days, or 12 months based on timeframe
        const filteredSpending = filterSpendingByTimeframe(spendingArray, timeframe);
        setSpendingData(filteredSpending);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchRecentOrders();
    fetchStats();
    
    return () => {
      activeOrdersUnsubscribe();
    };
  }, [currentUser, selectedOrder, timeframe]);

  // Filter spending data by timeframe
  const filterSpendingByTimeframe = (data, timeframe) => {
    const today = new Date();
    let filtered = [];
    
    if (timeframe === 'week') {
      // Last 7 days
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      filtered = data.filter(item => new Date(item.date) >= lastWeek);
    } else if (timeframe === 'month') {
      // Last 30 days
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      
      filtered = data.filter(item => new Date(item.date) >= lastMonth);
    } else if (timeframe === 'year') {
      // Last 12 months - grouped by month
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      
      // Group by month
      const monthlyData = {};
      data.forEach(item => {
        const date = new Date(item.date);
        if (date >= lastYear) {
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          monthlyData[monthKey] += item.amount;
        }
      });
      
      filtered = Object.keys(monthlyData).map(month => ({
        date: month,
        amount: monthlyData[month]
      })).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return filtered;
  };

  // Apply filters to active orders
  useEffect(() => {
    let result = [...activeOrders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.pickupAddress?.toLowerCase().includes(query) ||
        order.deliveryAddress?.toLowerCase().includes(query) ||
        order.recipientName?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus);
    }
    
    setFilteredOrders(result);
  }, [activeOrders, searchQuery, filterStatus]);

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

  // Distribution of orders by status for pie chart
  const statusDistribution = useMemo(() => {
    return [
      { name: 'Pending', value: statsData.pendingOrders },
      { name: 'In Transit', value: statsData.inTransitOrders },
      { name: 'Delivered', value: statsData.deliveredOrders }
    ].filter(item => item.value > 0);
  }, [statsData]);

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
        <h1 className="dashboard-title">Your Dashboard</h1>
        <Link to="/create-order" className="btn">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Delivery
        </Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Stats Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{statsData.totalOrders}</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Orders</div>
            <div className="stat-value">{statsData.pendingOrders + statsData.inTransitOrders}</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{statsData.deliveredOrders}</div>
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
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">₹{statsData.totalSpent}</div>
            <div className="stat-subtitle">Avg. ₹{statsData.avgOrderValue} per order</div>
          </div>
        </div>
      </div>

      {/* Data Visualization Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Delivery Analytics</h2>
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
            <button 
              onClick={() => setTimeframe('year')} 
              className={`tab-button ${timeframe === 'year' ? 'active' : ''}`}
            >
              Year
            </button>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Spending Chart */}
          <div className="analytics-card">
            <h3 className="analytics-title">Spending Trends</h3>
            <div className="chart-container" style={{ height: '250px' }}>
              {spendingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={spendingData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        if (timeframe === 'year') {
                          return value.split('-')[1]; // Just show the month
                        }
                        return value.split('-').slice(1).join('-'); // Remove year
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₹${value}`, 'Amount']}
                      labelFormatter={(label) => {
                        if (timeframe === 'year') {
                          const [year, month] = label.split('-');
                          return `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;
                        }
                        return new Date(label).toLocaleDateString();
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  No spending data available for this time period
                </div>
              )}
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="analytics-card">
            <h3 className="analytics-title">Order Status</h3>
            <div className="chart-container" style={{ height: '250px' }}>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  No order data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              partnerInfo={selectedOrder.partnerId ? { name: 'Delivery Partner' } : null}
              orderStatus={selectedOrder.status}
            />
            
            <div className="delivery-info-panel">
              <div className="delivery-info-row">
                <span className="delivery-info-label">Pickup:</span>
                <span className="delivery-info-value">{selectedOrder.pickupAddress}</span>
              </div>
              <div className="delivery-info-row">
                <span className="delivery-info-label">Delivery:</span>
                <span className="delivery-info-value">{selectedOrder.deliveryAddress}</span>
              </div>
              <div className="delivery-info-row">
                <span className="delivery-info-label">Recipient:</span>
                <span className="delivery-info-value">{selectedOrder.recipientName} ({selectedOrder.recipientPhone})</span>
              </div>
              <div className="tracking-status-row">
                <div className="tracking-steps">
                  {['Order Placed', 'Assigned', 'In Transit', 'Delivered'].map((step, index) => (
                    <div key={index} className={`tracking-step ${
                      index === 0 ? 'completed' : 
                      index === 1 && ['assigned', 'in-transit', 'delivered'].includes(selectedOrder.status) ? 'completed' :
                      index === 2 && ['in-transit', 'delivered'].includes(selectedOrder.status) ? 'completed' :
                      index === 3 && selectedOrder.status === 'delivered' ? 'completed' : ''
                    }`}>
                      <div className="tracking-step-dot"></div>
                      <div className="tracking-step-label">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
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

      {/* Active Orders with Filtering */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Active Orders</h2>
          
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-transit">In Transit</option>
              </select>
            </div>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <h3 className="empty-state-title">No Active Orders</h3>
            <p className="empty-state-description">You don't have any active deliveries at the moment.</p>
            <Link to="/create-order" className="btn">Create New Delivery</Link>
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
            <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="btn">Clear Filters</button>
          </div>
        ) : (
          <div className="order-cards">
            {filteredOrders.map(order => (
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
                    <span className="order-detail-label">Created:</span>
                    <span className="order-detail-value">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-detail-row">
                    <span className="order-detail-label">Price:</span>
                    <span className="order-detail-value font-medium">₹{order.price || 0}</span>
                  </div>
                </div>
                <div className="order-card-footer">
                  <div className="order-package-size">
                    <span className="package-badge">{order.packageSize || 'N/A'}</span>
                    <span>{order.packageWeight || 0} kg</span>
                  </div>
                  {selectedOrder && selectedOrder.id === order.id ? (
                    <button className="btn-sm">Selected</button>
                  ) : (
                    <button className="btn-sm btn-outline">Track</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Delivered Orders */}
      {recentOrders.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Deliveries</h2>
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
                  <th>Date</th>
                  <th>Recipient</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="table-row">
                    <td>#{order.id.substring(0, 8)}</td>
                    <td>{formatDate(order.deliveredAt)}</td>
                    <td>{order.recipientName || 'N/A'}</td>
                    <td>₹{order.price || 0}</td>
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
          <Link to="/create-order" className="quick-action-card">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div className="quick-action-title">New Delivery</div>
            <p className="quick-action-desc">Create a new delivery request</p>
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

          <Link to="/profile" className="quick-action-card">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="quick-action-title">Profile</div>
            <p className="quick-action-desc">Manage your account settings</p>
          </Link>

          <Link to="#" className="quick-action-card notification-badge">
            <div className="quick-action-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div className="quick-action-title">Notifications</div>
            <p className="quick-action-desc">Get updates on your deliveries</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;