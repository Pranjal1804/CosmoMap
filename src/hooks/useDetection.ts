import { useState, useEffect } from 'react';
import { Detection } from '@/types';

export function useDetections() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/detections?limit=100');
      const data = await response.json();
      setDetections(data.detections || []);
      setError(null);
    } catch (err) {
      setError('Failed to load detections');
      console.error('Failed to load detections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetections();
  }, []);

  return {
    detections,
    loading,
    error,
    refresh: loadDetections
  };
}