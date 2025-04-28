import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userType } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Construct query based on user type
        const ordersQuery = query(
          collection(db, 'orders'),
          where(userType === 'customer' ? 'customerId' : 'partnerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        const ordersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        setOrders(ordersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [currentUser, userType]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h2 className="text-2xl font-bold mb-6">Order History</h2>
      
      {orders.length === 0 ? (
        <div className="card">
          <div className="p-6 text-center">
            <p className="text-gray">No orders found.</p>
            {userType === 'customer' && (
              <Link to="/create-order" className="btn mt-4">
                Create New Order
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td>
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td>
                      {order.pickupAddress.split(',')[0]}
                    </td>
                    <td>
                      {order.deliveryAddress.split(',')[0]}
                    </td>
                    <td>
                      <span className={`status-pill ${
                        order.status === 'pending' ? 'status-pending' :
                        order.status === 'assigned' ? 'status-assigned' :
                        order.status === 'in-transit' ? 'status-transit' :
                        'status-delivered'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      ₹{order.price}
                    </td>
                    <td>
                      <Link
                        to={`/order/${order.id}`}
                        className="text-primary"
                      >
                        View
                      </Link>
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

export default OrderHistory;