'use client';

import { Detection } from '@/types';
import { formatTimestamp, getObjectTypeIcon, getConfidenceColor } from '@/lib/utils';

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
  
  if (detections.length === 0) {
    return (
      <div className="no-detections">
        <i className="fas fa-search"></i>
        <p>No detections found</p>
        <small>Upload an image to start detecting objects</small>
      </div>
    );
  }

  return (
    <div className="detection-results">
      {analysisResults && (
        <div className="analysis-summary">
          <p>{analysisResults.message}</p>
        </div>
      )}
      
      {detections.map((detection) => (
        <div 
          key={detection._id} // This should now be unique
          className="detection-item"
          onClick={() => onDetectionClick(detection._id)}
        >
          <div className="detection-header">
            <div className="detection-type">
              <i className={getObjectTypeIcon(detection.objectType)}></i>
              <span>{detection.objectType}</span>
            </div>
            <div 
              className="detection-confidence"
              style={{ color: getConfidenceColor(detection.confidence) }}
            >
              {Math.round(detection.confidence * 100)}%
            </div>
          </div>
          
          <div className="detection-details">
            <div className="detection-time">
              <i className="fas fa-clock"></i>
              <span>{formatTimestamp(detection.timestamp)}</span>
            </div>
            
            <div className="detection-location">
              <i className="fas fa-map-marker-alt"></i>
              <span>
                {detection.coordinates.lat.toFixed(4)}, {detection.coordinates.lng.toFixed(4)}
              </span>
            </div>
            
            <div className="detection-source">
              <i className="fas fa-image"></i>
              <span>{detection.imageFilename}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}