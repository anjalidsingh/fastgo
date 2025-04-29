import { rtdb } from './firebase';
import { ref, set, onValue, off, update, get } from 'firebase/database';
import { geocodeAddress, generateMockRoute } from './mapService';

// Base reference for locations
const locationsRef = ref(rtdb, 'locations');
const ordersLocationsRef = ref(rtdb, 'orderLocations');

// Update user's location in the database
export const updateUserLocation = async (userId, location) => {
  try {
    await set(ref(rtdb, `locations/${userId}`), {
      position: location,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating location:', error);
    return false;
  }
};

// Get a user's location from the database
export const getUserLocation = async (userId) => {
  try {
    const snapshot = await get(ref(rtdb, `locations/${userId}`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

// Listen for real-time location updates for a specific user
export const subscribeToUserLocation = (userId, callback) => {
  const userLocationRef = ref(rtdb, `locations/${userId}`);
  onValue(userLocationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // Return function to unsubscribe
  return () => off(userLocationRef);
};

// Initialize order tracking data
export const initializeOrderTracking = async (orderId, pickupAddress, deliveryAddress) => {
  try {
    // Geocode pickup and delivery addresses
    const pickupCoords = await geocodeAddress(pickupAddress);
    const deliveryCoords = await geocodeAddress(deliveryAddress);

    // Generate route
    const route = generateMockRoute(
      pickupCoords[0], 
      pickupCoords[1], 
      deliveryCoords[0], 
      deliveryCoords[1], 
      8 // More points for smoother route
    );

    // Save to Realtime Database
    await set(ref(rtdb, `orderLocations/${orderId}`), {
      pickupCoords,
      deliveryCoords,
      route,
      currentPosition: pickupCoords, // Start at pickup
      status: 'pending',
      progress: 0, // 0-100%
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error initializing order tracking:', error);
    return false;
  }
};

// Update order tracking status and position
export const updateOrderStatus = async (orderId, status, progress) => {
  try {
    const orderRef = ref(rtdb, `orderLocations/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (!snapshot.exists()) return false;
    
    const orderData = snapshot.val();
    const { route } = orderData;
    
    // Calculate position based on progress
    let currentPosition;
    if (progress === 0) {
      currentPosition = orderData.pickupCoords;
    } else if (progress === 100) {
      currentPosition = orderData.deliveryCoords;
    } else {
      // Find position along the route based on progress
      const routeIndex = Math.floor((progress / 100) * (route.length - 1));
      currentPosition = route[routeIndex];
    }
    
    // Update order data
    await update(orderRef, {
      status,
      progress,
      currentPosition,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
};

// Subscribe to order location updates
export const subscribeToOrderLocation = (orderId, callback) => {
  const orderLocationRef = ref(rtdb, `orderLocations/${orderId}`);
  onValue(orderLocationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // Return function to unsubscribe
  return () => off(orderLocationRef);
};

// Helper function for partner to start tracking an order
export const partnerStartTracking = async (orderId, partnerId) => {
  try {
    // Get partner location
    const partnerLocation = await getUserLocation(partnerId);
    
    if (!partnerLocation) {
      throw new Error('Partner location not found');
    }

    // Update order with partner location and status
    await update(ref(rtdb, `orderLocations/${orderId}`), {
      partnerId,
      status: 'assigned',
      partnerPosition: partnerLocation.position,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error starting tracking:', error);
    return false;
  }
};

// Simulate order progress (for demo purposes)
export const simulateOrderProgress = async (orderId, speedFactor = 1) => {
  try {
    const orderRef = ref(rtdb, `orderLocations/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (!snapshot.exists()) return false;
    
    const orderData = snapshot.val();
    let progress = orderData.progress || 0;
    let status = orderData.status;
    
    // Start interval to update progress
    const interval = setInterval(async () => {
      // Increment progress
      progress += (1 * speedFactor);
      
      // Update status based on progress
      if (progress >= 100) {
        progress = 100;
        status = 'delivered';
        clearInterval(interval);
      } else if (progress > 5) {
        status = 'in-transit';
      }
      
      // Update order status
      await updateOrderStatus(orderId, status, progress);
      
      // Stop if delivered
      if (status === 'delivered') {
        clearInterval(interval);
      }
    }, 2000 / speedFactor); // Update every 2 seconds (adjusted by speed factor)
    
    // Return function to stop simulation
    return () => clearInterval(interval);
  } catch (error) {
    console.error('Error simulating order progress:', error);
    return () => {}; // Return empty function if error
  }
};

// Get all active orders for a partner
export const getPartnerActiveOrders = async (partnerId) => {
  try {
    const snapshot = await get(ref(rtdb, 'orderLocations'));
    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((orderSnapshot) => {
        const order = orderSnapshot.val();
        if (order.partnerId === partnerId && order.status !== 'delivered') {
          orders.push({
            id: orderSnapshot.key,
            ...order
          });
        }
      });
      return orders;
    }
    return [];
  } catch (error) {
    console.error('Error getting partner orders:', error);
    return [];
  }
};