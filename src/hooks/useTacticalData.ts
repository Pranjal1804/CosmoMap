import { useState, useEffect } from 'react';
import { Detection, Stats, FilterType } from '@/types';

export interface TacticalData {
  detections: Detection[];
  stats: Stats;
  filteredDetections: Detection[];
}

export function useTacticalData() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    recentDetections: 0,
    objectTypes: []
  });
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tactical object types
  const tacticalTypes = [
    'person', 'car', 'truck', 'airplane', 'boat', 'motorcycle', 
    'bus', 'train', 'tank', 'military_vehicle', 'personnel', 
    'aircraft', 'building', 'camp'
  ];

  const loadDetections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/detections?limit=100');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch detections: ${response.status}`);
      }
      
      const data = await response.json();
      setDetections(data.detections || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load detections';
      setError(errorMessage);
      console.error('Failed to load detections:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([loadDetections(), loadStats()]);
  };

  // Filter detections based on current filter
  const getFilteredDetections = (): Detection[] => {
    switch (currentFilter) {
      case 'tactical':
        return detections.filter(d => 
          tacticalTypes.includes(d.objectType.toLowerCase())
        );
      case 'recent':
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return detections.filter(d => 
          new Date(d.timestamp) > oneHourAgo
        );
      default:
        return detections;
    }
  };

  // Get tactical summary
  const getTacticalSummary = () => {
    const tacticalDetections = detections.filter(d => 
      tacticalTypes.includes(d.objectType.toLowerCase())
    );
    
    const threatLevels = {
      high: tacticalDetections.filter(d => 
        ['tank', 'military_vehicle', 'aircraft'].includes(d.objectType.toLowerCase())
      ).length,
      medium: tacticalDetections.filter(d => 
        ['truck', 'personnel', 'camp'].includes(d.objectType.toLowerCase())
      ).length,
      low: tacticalDetections.filter(d => 
        ['person', 'car', 'motorcycle'].includes(d.objectType.toLowerCase())
      ).length
    };

    return {
      total: tacticalDetections.length,
      threatLevels,
      avgConfidence: tacticalDetections.length > 0 
        ? tacticalDetections.reduce((sum, d) => sum + d.confidence, 0) / tacticalDetections.length
        : 0
    };
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    detections,
    stats,
    filteredDetections: getFilteredDetections(),
    currentFilter,
    setCurrentFilter,
    loading,
    error,
    refresh: refreshData,
    tacticalSummary: getTacticalSummary()
  };
}