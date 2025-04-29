import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Need to fix Leaflet default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (iconUrl, className) => {
  return L.icon({
    iconUrl: iconUrl || 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: className || ''
  });
};

const Map = ({ 
  center, 
  zoom, 
  markers, 
  polyline, 
  style, 
  className, 
  onMapReady,
  liveUpdates = false,
  onMarkerClick,
  mapOptions = {}
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map once when ref is available
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      dragging: !L.Browser.mobile,
      tap: !L.Browser.mobile,
      ...mapOptions
    }).setView(center || [20.5937, 78.9629], zoom || 5);
    
    // Add OpenStreetMap tile layer (free to use)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    
    // Initialize marker layer group
    markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    
    // Initialize polyline layer
    polylineLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    
    // Call the onMapReady callback if provided
    if (onMapReady) {
      onMapReady(mapInstanceRef.current);
    }
    
    setMapInitialized(true);
    
    // Invalidate size to ensure map renders correctly
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);
    
    // Clean up on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        polylineLayerRef.current = null;
      }
    };
  }, [onMapReady, mapOptions]);
  
  // Update center and zoom if they change
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    
    mapInstanceRef.current.setView(center, zoom || mapInstanceRef.current.getZoom());
  }, [center, zoom]);
  
  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !markers) return;
    
    // Clear existing markers
    markersLayerRef.current.clearLayers();
    
    // Add new markers
    markers.forEach((marker) => {
      const { position, popupContent, icon, options = {}, id } = marker;
      
      if (position) {
        const markerIcon = icon ? L.icon(icon) : null;
        const markerInstance = L.marker(position, { 
          icon: markerIcon,
          ...options
        }).addTo(markersLayerRef.current);
        
        if (popupContent) {
          markerInstance.bindPopup(popupContent);
        }
        
        if (onMarkerClick && id) {
          markerInstance.on('click', () => onMarkerClick(id, marker));
        }
      }
    });
    
    // Fit bounds to show all markers if we have multiple and not doing live updates
    if (markers.length > 1 && !liveUpdates) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, onMarkerClick, liveUpdates]);
  
  // Update polyline when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !polylineLayerRef.current) return;
    
    // Clear existing polylines
    polylineLayerRef.current.clearLayers();
    
    // Add new polyline if provided
    if (polyline && polyline.positions && polyline.positions.length > 1) {
      const { positions, options = {} } = polyline;
      const polylineInstance = L.polyline(positions, { 
        color: 'blue', 
        weight: 4, 
        opacity: 0.7,
        ...options 
      }).addTo(polylineLayerRef.current);
      
      // Fit to polyline bounds if not doing live updates
      if (!liveUpdates) {
        const bounds = L.latLngBounds(positions);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [polyline, liveUpdates]);
  
  // Use ResizeObserver to handle container size changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current.invalidateSize();
    });
    
    resizeObserver.observe(mapRef.current);
    
    return () => {
      if (mapRef.current) {
        resizeObserver.unobserve(mapRef.current);
      }
    };
  }, [mapInitialized]);

  return (
    <div 
      ref={mapRef} 
      className={`map-container ${className || ''}`} 
      style={{ height: '400px', width: '100%', ...style }}
    />
  );
};

export default Map;