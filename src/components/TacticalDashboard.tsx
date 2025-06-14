'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from './Header';
import Sidebar from './Sidebar';
import { Detection, Stats, FilterType } from '@/types';

const MapContainer = dynamic(() => import('./MapContainer'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

export default function TacticalDashboard() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    recentDetections: 0,
    objectTypes: []
  });
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadDetections();
    loadStats();
    
    const interval = setInterval(() => {
      loadDetections();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDetections = async () => {
    try {
      const response = await fetch('/api/detections?limit=100');
      const data = await response.json();
      setDetections(data.detections || []);
    } catch (error) {
      console.error('Failed to load detections:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const statsData = await response.json();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleUploadSuccess = () => {
    loadDetections();
    loadStats();
  };

  const focusDetection = (detectionId: string) => {
    const detection = detections.find(d => d._id === detectionId);
    if (detection && mapRef.current) {
      mapRef.current.focusDetection(detection);
    }
  };

  const handleRefresh = () => {
    loadDetections();
    loadStats();
  };

  return (
    <div>
      <Header />
      <div className="container">
        <Sidebar 
          stats={stats}
          detections={detections}
          onUploadSuccess={handleUploadSuccess}
          onDetectionClick={focusDetection}
          isLoading={isLoading}
          analysisResults={analysisResults}
        />
        <MapContainer
          ref={mapRef}
          detections={detections}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}