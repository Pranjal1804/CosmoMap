'use client';

import { Detection } from '@/types';

interface DetectionResultsProps {
  detections: Detection[];
  onDetectionClick: (detectionId: string) => void;
  analysisResults?: any;
}

export default function DetectionResults({ 
  detections, 
  onDetectionClick, 
  analysisResults 
}: DetectionResultsProps) {
  
  const getObjectTypeIcon = (objectType: string): string => {
    const iconMap: { [key: string]: string } = {
      'person': 'fas fa-user',
      'car': 'fas fa-car',
      'truck': 'fas fa-truck',
      'airplane': 'fas fa-plane',
      'boat': 'fas fa-ship',
      'motorcycle': 'fas fa-motorcycle',
      'bus': 'fas fa-bus',
      'train': 'fas fa-train',
      'bicycle': 'fas fa-bicycle',
      'building': 'fas fa-building',
      'vehicle': 'fas fa-car-alt',
      'tank': 'fas fa-shield-alt',
      'military_vehicle': 'fas fa-truck-monster',
      'personnel': 'fas fa-user-shield',
      'aircraft': 'fas fa-fighter-jet',
      'camp': 'fas fa-campground'
    };
    
    return iconMap[objectType.toLowerCase()] || 'fas fa-circle';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return '#4ecdc4'; // High confidence - teal
    if (confidence > 0.6) return '#f7931e'; // Medium confidence - orange
    return '#ff6b35'; // Low confidence - red-orange
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="detection-results">
      {analysisResults && (
        <div className="analysis-summary">
          {analysisResults.error ? (
            <div className="error" style={{ display: 'block' }}>
              <i className="fas fa-exclamation-triangle"></i>
              Analysis failed: {analysisResults.error}
            </div>
          ) : (
            <div className="success" style={{ display: 'block' }}>
              <i className="fas fa-check-circle"></i>
              Analysis complete! Found {analysisResults.detections?.length || 0} objects.
            </div>
          )}
        </div>
      )}

      <div className="detections-list">
        {detections.length === 0 ? (
          <div className="no-detections">
            <i className="fas fa-search"></i>
            <p>No detections found</p>
            <small>Try analyzing a satellite image to see detection results</small>
          </div>
        ) : (
          detections.map((detection) => (
            <div
              key={detection._id}
              className="detection-item"
              onClick={() => onDetectionClick(detection._id)}
            >
              <div className="detection-header">
                <div className="detection-type">
                  <i className={getObjectTypeIcon(detection.objectType)}></i>
                  {detection.objectType}
                </div>
                <div 
                  className="detection-confidence"
                  style={{ color: getConfidenceColor(detection.confidence) }}
                >
                  {(detection.confidence * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="detection-details">
                <div className="detection-time">
                  <i className="fas fa-clock"></i>
                  {formatTimestamp(detection.timestamp)}
                </div>
                
                {detection.coordinates && (
                  <div className="detection-location">
                    <i className="fas fa-map-marker-alt"></i>
                    {detection.coordinates.lat?.toFixed(4)}, {detection.coordinates.lng?.toFixed(4)}
                  </div>
                )}
                
                {detection.imageFilename && (
                  <div className="detection-source">
                    <i className="fas fa-satellite"></i>
                    {detection.imageFilename}
                  </div>
                )}
              </div>
              
              <div className="detection-actions">
                <button 
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetectionClick(detection._id);
                  }}
                  title="View on map"
                >
                  <i className="fas fa-map-marked-alt"></i>
                </button>
                
                <button 
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Export detection:', detection);
                  }}
                  title="Export data"
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}