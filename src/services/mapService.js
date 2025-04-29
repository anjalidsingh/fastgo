// Enhanced Map Service for realtime Firebase integration

// Calculate distance between two points in kilometers using the Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Implementation of Haversine formula
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
  
  // Generate a random position near a specified center point
  export const generateRandomPosition = (centerLat, centerLng, radiusKm = 2) => {
    // Convert radius from km to degrees (approximate)
    const radiusLat = radiusKm / 111; // 1 degree of latitude is approximately 111 km
    const radiusLng = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
    
    // Generate random offsets
    const randomLat = centerLat + (Math.random() * 2 - 1) * radiusLat;
    const randomLng = centerLng + (Math.random() * 2 - 1) * radiusLng;
    
    return [randomLat, randomLng];
  };
  
  // Geocode an address to get lat/lng (in a real app, you'd use a geocoding service)
  // This mock version will generate random positions around major Indian cities
  export const geocodeAddress = (address) => {
    // In a real app, you would call a geocoding API like Google Maps or Mapbox
    return new Promise((resolve) => {
      setTimeout(() => {
        // Base coordinates for major Indian cities
        const baseCoords = {
          "Delhi": [28.7041, 77.1025],
          "Mumbai": [19.0760, 72.8777],
          "Bangalore": [12.9716, 77.5946],
          "Chennai": [13.0827, 80.2707],
          "Kolkata": [22.5726, 88.3639],
          "Hyderabad": [17.3850, 78.4867],
          "Pune": [18.5204, 73.8567],
          "Ahmedabad": [23.0225, 72.5714]
        };
        
        // Check if the address contains any of the city names
        let baseCoord = [20.5937, 78.9629]; // Default central India
        for (const city in baseCoords) {
          if (address.toLowerCase().includes(city.toLowerCase())) {
            baseCoord = baseCoords[city];
            break;
          }
        }
        
        // Slightly randomize the coordinates for more realistic simulation
        const coords = generateRandomPosition(baseCoord[0], baseCoord[1], 5);
        resolve(coords);
      }, 300); // Simulate network delay
    });
  };
  
  // Get current user position (browser geolocation)
  export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Fallback to a default location (central India)
            resolve([20.5937, 78.9629]);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        console.error('Geolocation is not supported by this browser');
        // Fallback to a default location (central India)
        resolve([20.5937, 78.9629]);
      }
    });
  };
  
  // Watch user position with continuous updates
  export const watchPosition = (callback) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return null;
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error('Geolocation watching error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
    
    // Return function to clear watch
    return () => navigator.geolocation.clearWatch(watchId);
  };
  
  // Calculate a midpoint between two locations
  export const calculateMidpoint = (lat1, lon1, lat2, lon2) => {
    return [(lat1 + lat2) / 2, (lon1 + lon2) / 2];
  };
  
  // Calculate travel time based on distance and mode of transportation
  export const calculateTravelTime = (distanceKm, mode = 'bike') => {
    // Average speeds in km/h
    const speeds = {
      walking: 5,
      bike: 15,
      scooter: 25,
      car: 30
    };
    
    const speed = speeds[mode] || speeds.bike;
    const timeInHours = distanceKm / speed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    
    return timeInMinutes;
  };
  
  // Generate a route between two points with realistic waypoints
  export const generateMockRoute = (startLat, startLng, endLat, endLng, numPoints = 10) => {
    const route = [];
    
    // Add start point
    route.push([startLat, startLng]);
    
    // Calculate the direct distance
    const directDistance = calculateDistance(startLat, startLng, endLat, endLng);
    
    // Calculate maximum deviation based on direct distance (more deviation for longer routes)
    const maxDeviation = Math.min(0.01, directDistance * 0.005); // Limit maximum deviation
    
    // Generate intermediate points
    for (let i = 1; i < numPoints - 1; i++) {
      const ratio = i / (numPoints - 1);
      
      // Basic linear interpolation
      const lat = startLat + ratio * (endLat - startLat);
      const lng = startLng + ratio * (endLng - startLng);
      
      // Add some random variation to make the route more realistic
      // More deviation in the middle, less at the ends
      const deviationFactor = Math.sin(ratio * Math.PI); // 0 at ends, 1 in middle
      const latJitter = (Math.random() - 0.5) * 2 * maxDeviation * deviationFactor;
      const lngJitter = (Math.random() - 0.5) * 2 * maxDeviation * deviationFactor;
      
      route.push([lat + latJitter, lng + lngJitter]);
    }
    
    // Add end point
    route.push([endLat, endLng]);
    
    return route;
  };
  
  // Calculate zoom level based on distance
  export const calculateZoomLevel = (distanceKm) => {
    if (distanceKm < 1) return 16;
    if (distanceKm < 2) return 15;
    if (distanceKm < 5) return 14;
    if (distanceKm < 10) return 13;
    if (distanceKm < 20) return 12;
    if (distanceKm < 50) return 11;
    if (distanceKm < 100) return 10;
    if (distanceKm < 200) return 9;
    if (distanceKm < 500) return 8;
    if (distanceKm < 1000) return 7;
    return 6;
  };