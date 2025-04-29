import React, { useState, useEffect } from 'react';
import Map from './Map';
import { 
  geocodeAddress, 
  calculateDistance,
  calculateZoomLevel
} from '../services/mapService';
import { 
  initializeOrderTracking, 
  subscribeToOrderLocation, 
  simulateOrderProgress,
  updateOrderStatus
} from '../services/locationService';
import LoadingSpinner from './LoadingSpinner';

const MapTracking = ({ 
  orderId,
  pickupAddress, 
  deliveryAddress, 
  partnerInfo, 
  orderStatus,
  onDistanceCalculated,
  enableSimulation = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [markers, setMarkers] = useState([]);
  const [polyline, setPolyline] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [trackingInitialized, setTrackingInitialized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMap, setShowMap] = useState(true);
  const [simulationActive, setSimulationActive] = useState(false);

  // Initialize tracking when component mounts
  useEffect(() => {
    const initialize = async () => {
      if (!orderId || !pickupAddress || !deliveryAddress) {
        setError("Missing order information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Initialize or fetch order tracking data
        const success = await initializeOrderTracking(orderId, pickupAddress, deliveryAddress);
        if (success) {
          setTrackingInitialized(true);
        }
      } catch (err) {
        console.error("Error initializing tracking:", err);
        setError("Could not initialize tracking");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [orderId, pickupAddress, deliveryAddress]);

  // Subscribe to order location updates from Firebase
  useEffect(() => {
    if (!trackingInitialized || !orderId) return;

    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrderLocation(orderId, (data) => {
      if (!data) return;
      
      setOrderData(data);
      
      // Update center if we have pickup and delivery coordinates
      if (data.pickupCoords && data.deliveryCoords) {
        const midLat = (data.pickupCoords[0] + data.deliveryCoords[0]) / 2;
        const midLng = (data.pickupCoords[1] + data.deliveryCoords[1]) / 2;
        setMapCenter([midLat, midLng]);
        
        // Calculate distance
        const distance = calculateDistance(
          data.pickupCoords[0],
          data.pickupCoords[1],
          data.deliveryCoords[0],
          data.deliveryCoords[1]
        );
        setDistanceKm(distance);
        
        // Calculate zoom level based on distance
        setMapZoom(calculateZoomLevel(distance));
        
        // Calculate estimated time (10 km/h average speed for city traffic)
        const timeInMinutes = Math.round((distance / 10) * 60);
        setEstimatedTime(timeInMinutes);
        
        // Notify parent component of distance calculation
        if (onDistanceCalculated) {
          onDistanceCalculated(distance);
        }
      }
      
      // Update progress
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      
      // Update polyline if we have route data
      if (data.route && data.route.length > 1) {
        setPolyline({
          positions: data.route,
          options: { 
            color: '#4f46e5', 
            weight: 4, 
            dashArray: data.status === 'in-transit' ? '10, 10' : null 
          }
        });
      }
      
      // Create markers
      const newMarkers = [];
      
      // Pickup marker
      if (data.pickupCoords) {
        newMarkers.push({
          id: 'pickup',
          position: data.pickupCoords,
          popupContent: `<h4>Pickup Location</h4><p>${pickupAddress}</p>`,
          icon: {
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }
        });
      }
      
      // Delivery marker
      if (data.deliveryCoords) {
        newMarkers.push({
          id: 'delivery',
          position: data.deliveryCoords,
          popupContent: `<h4>Delivery Location</h4><p>${deliveryAddress}</p>`,
          icon: {
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
            className: 'delivery-marker'
          }
        });
      }
      
      // Partner/current position marker
      if (data.currentPosition && data.status !== 'pending') {
        newMarkers.push({
          id: 'partner',
          position: data.currentPosition,
          popupContent: `<h4>Delivery Partner</h4><p>${partnerInfo ? partnerInfo.name : 'Your delivery partner'}</p>`,
          icon: {
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
            className: 'partner-marker'
          }
        });
      }
      
      setMarkers(newMarkers);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, [trackingInitialized, orderId, pickupAddress, deliveryAddress, partnerInfo, onDistanceCalculated]);

  // Handle simulation mode
  useEffect(() => {
    if (!enableSimulation || !trackingInitialized || !orderId || simulationActive) return;
    
    // Start simulation only if not already active
    const startSimulation = async () => {
      // Update status to "assigned" before starting simulation
      await updateOrderStatus(orderId, 'assigned', 0);
      
      // Start simulation with speed factor of 3 (3x normal speed)
      const stopSimulation = await simulateOrderProgress(orderId, 3);
      setSimulationActive(true);
      
      // Return cleanup function
      return stopSimulation;
    };
    
    const simulationPromise = startSimulation();
    
    return () => {
      simulationPromise.then(stopFn => stopFn && stopFn());
    };
  }, [enableSimulation, trackingInitialized, orderId, simulationActive]);

  const getRemainingTime = () => {
    if (!estimatedTime || !progress) return null;
    const remaining = Math.round(estimatedTime * (1 - progress / 100));
    return remaining;
  };

  if (!showMap) {
    return (
      <button 
        onClick={() => setShowMap(true)}
        className="btn btn-outline mb-4"
      >
        Show Delivery Map
      </button>
    );
  }

  return (
    <div className="order-card">
      <div className="order-header">
        <h3 className="order-card-title">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          Delivery Tracking {progress > 0 && `(${Math.round(progress)}% complete)`}
        </h3>
        <button 
          onClick={() => setShowMap(false)} 
          className="btn-icon btn-sm"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="order-body">
        {loading ? (
          <div className="text-center py-4">
            <LoadingSpinner size="medium" />
            <p className="mt-2 text-sm text-gray-600">Loading tracking data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn mt-4"
            >
              Reload Page
            </button>
          </div>
        ) : (
          <>
            <div className="map-container">
              <Map 
                center={mapCenter}
                zoom={mapZoom}
                markers={markers}
                polyline={polyline}
                liveUpdates={true}
              />
              
              {progress > 0 && progress < 100 && (
                <div className="map-indicator">
                  <div className="indicator-dot"></div>
                  <span>Live Tracking</span>
                </div>
              )}
            </div>
            
            <div className="map-legend">
              <div className="map-legend-item">
                <div className="map-legend-color pickup"></div>
                <span className="map-legend-label">Pickup Location</span>
              </div>
              <div className="map-legend-item">
                <div className="map-legend-color delivery"></div>
                <span className="map-legend-label">Delivery Location</span>
              </div>
              {orderData && orderData.status !== 'pending' && (
                <div className="map-legend-item">
                  <div className="map-legend-color current"></div>
                  <span className="map-legend-label">Current Position</span>
                </div>
              )}
            </div>
            
            {distanceKm && (
              <div className="map-route-info">
                <span>Total Distance: <strong>{distanceKm} km</strong></span>
                
                {orderData && orderData.status === 'in-transit' && (
                  <span>Estimated Arrival: <strong>{getRemainingTime() || '--'} mins</strong></span>
                )}
              </div>
            )}
            
            {progress > 0 && (
              <div className="progress-container">
                <div className="progress-label">Delivery Progress</div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MapTracking;