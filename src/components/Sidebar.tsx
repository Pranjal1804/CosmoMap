'use client';

import { Detection, Stats } from '@/types';
import UploadCard from './UploadCard';
import DetectionResults from './DetectResults';

interface SidebarProps {
  stats: Stats;
  detections: Detection[];
  onUploadSuccess: () => void;
  onDetectionClick: (detectionId: string) => void;
  isLoading: boolean;
  analysisResults?: any;
}

export default function Sidebar({ 
  stats, 
  detections, 
  onUploadSuccess, 
  onDetectionClick,
  isLoading,
  analysisResults
}: SidebarProps) {
  
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
      'tank': 'fas fa-shield-alt',
      'military_vehicle': 'fas fa-truck-monster',
      'personnel': 'fas fa-user-shield',
      'aircraft': 'fas fa-fighter-jet',
      'building': 'fas fa-building',
      'camp': 'fas fa-campground'
    };
    
    return iconMap[objectType.toLowerCase()] || 'fas fa-circle';
  };

  return (
    <div className="sidebar">
      {/* Image Upload */}
      <UploadCard 
        onUploadSuccess={onUploadSuccess}
        isLoading={isLoading}
      />
      
      {/* Statistics */}
      <div className="card">
        <h3>
          <i className="fas fa-chart-bar"></i> Detection Statistics
        </h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.totalDetections}</div>
            <div className="stat-label">Total Detections</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.recentDetections}</div>
            <div className="stat-label">Recent (1hr)</div>
          </div>
        </div>
        
        {stats.objectTypes && stats.objectTypes.length > 0 && (
          <div className="object-types-list">
            <h4>Top Object Types</h4>
            {stats.objectTypes.slice(0, 5).map((type) => (
              <div key={type._id} className="object-type-item">
                <div className="object-type-info">
                  <i className={getObjectTypeIcon(type._id)}></i>
                  <span className="object-type-name">{type._id}</span>
                </div>
                <div className="object-type-stats">
                  <span className="object-count">{type.count}</span>
                  <span className="object-confidence">
                    {(type.avgConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Detections */}
      <div className="card">
        <h3>
          <i className="fas fa-list-alt"></i> Recent Detections
        </h3>
        <DetectionResults 
          detections={detections}
          onDetectionClick={onDetectionClick}
          analysisResults={analysisResults}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading active">
          <div className="spinner"></div>
          <p>Analyzing satellite image...</p>
        </div>
      )}
    </div>
  );
}