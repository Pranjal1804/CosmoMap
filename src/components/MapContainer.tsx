'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Detection, FilterType } from '@/types';

interface MapContainerProps {
  detections: Detection[];
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onRefresh: () => void;
}

const MapContainer = forwardRef<any, MapContainerProps>(({
  detections,
  currentFilter,
  onFilterChange,
  onRefresh
}, ref) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useImperativeHandle(ref, () => ({
    focusDetection: (detection: Detection) => {
      // Focus on a specific detection
      if (mapInstanceRef.current && detection.coordinates) {
        mapInstanceRef.current.setView([detection.coordinates.lat, detection.coordinates.lng], 15);
      }
    }
  }));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initMap();
    }
  }, []);

  useEffect(() => {
    updateMap();
  }, [detections, currentFilter]);

  const initMap = async () => {
    const L = (await import('leaflet')).default;
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    mapInstanceRef.current = L.map(mapRef.current).setView([51.505, -0.09], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Add custom styling for military look
    if (mapInstanceRef.current.getContainer()) {
      mapInstanceRef.current.getContainer().style.filter = 'hue-rotate(180deg) saturate(0.7)';
    }
  };

  const updateMap = async () => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    
    const L = (await import('leaflet')).default;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Filter detections based on current filter
    let filteredDetections = detections;
    
    if (currentFilter === 'tactical') {
      const tacticalTypes = ['person', 'car', 'truck', 'airplane', 'boat', 'motorcycle', 'bus', 'train'];
      filteredDetections = detections.filter(d => tacticalTypes.includes(d.objectType));
    } else if (currentFilter === 'recent') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      filteredDetections = detections.filter(d => new Date(d.timestamp) > oneHourAgo);
    }

    // Add markers for detections (using random positions for demo)
    filteredDetections.forEach((detection) => {
      // Generate random coordinates for demo (in real app, would use actual geo-coordinates)
      const lat = 51.5 + (Math.random() - 0.5) * 0.1;
      const lng = -0.1 + (Math.random() - 0.5) * 0.1;
      
      const marker = L.marker([lat, lng])
        .bindPopup(`
          <div style="color: #333;">
            <strong>${detection.objectType}</strong><br>
            Confidence: ${Math.round(detection.confidence * 100)}%<br>
            Time: ${new Date(detection.timestamp).toLocaleString()}<br>
            Image: ${detection.imageFilename}
          </div>
        `)
        .addTo(mapInstanceRef.current);
      
      markersRef.current.push(marker);
    });

    // Fit map to show all markers if any exist
    if (markersRef.current.length > 0) {
      const group = new (L as any).featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>
          <i className="fas fa-map"></i> Detection Map
        </h3>
        <div className="map-controls">
          <button 
            className={`control-btn ${currentFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          <button 
            className={`control-btn ${currentFilter === 'tactical' ? 'active' : ''}`}
            onClick={() => onFilterChange('tactical')}
          >
            Tactical
          </button>
          <button 
            className={`control-btn ${currentFilter === 'recent' ? 'active' : ''}`}
            onClick={() => onFilterChange('recent')}
          >
            Recent
          </button>
          <button className="control-btn" onClick={onRefresh}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div ref={mapRef} id="map"></div>
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;