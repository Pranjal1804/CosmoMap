import { Detection, FilterType } from '@/types';

// Utility functions for TactMap

export function formatTimestamp(timestamp: string): string {
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
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function getConfidenceColor(confidence: number): string {
  if (confidence > 0.8) return '#4ecdc4'; // High confidence - teal
  if (confidence > 0.6) return '#f7931e'; // Medium confidence - orange
  return '#ff6b35'; // Low confidence - red-orange
}

export function getObjectTypeIcon(objectType: string): string {
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
    'camp': 'fas fa-campground',
    'vehicle': 'fas fa-car-alt',
    'weapon': 'fas fa-crosshairs',
    'missile': 'fas fa-rocket',
    'helicopter': 'fas fa-helicopter',
    'unknown': 'fas fa-question-circle'
  };
  
  return iconMap[objectType.toLowerCase()] || 'fas fa-circle';
}

export function getThreatLevel(objectType: string): 'high' | 'medium' | 'low' {
  const highThreat = ['tank', 'military_vehicle', 'aircraft', 'missile', 'weapon', 'helicopter'];
  const mediumThreat = ['truck', 'personnel', 'camp', 'building', 'airplane'];
  
  const type = objectType.toLowerCase();
  
  if (highThreat.includes(type)) return 'high';
  if (mediumThreat.includes(type)) return 'medium';
  return 'low';
}

export function getThreatLevelColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return '#ff4444';
    case 'medium': return '#ff8800';
    case 'low': return '#44ff44';
    default: return '#ffffff';
  }
}

export function filterDetections(detections: Detection[], filter: FilterType): Detection[] {
  const tacticalTypes = [
    'person', 'car', 'truck', 'airplane', 'boat', 'motorcycle', 
    'bus', 'train', 'tank', 'military_vehicle', 'personnel', 
    'aircraft', 'building', 'camp', 'weapon', 'missile', 'helicopter'
  ];

  switch (filter) {
    case 'tactical':
      return detections.filter(d => 
        tacticalTypes.includes(d.objectType.toLowerCase())
      );
    case 'recent':
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return detections.filter(d => new Date(d.timestamp) > oneHourAgo);
    default:
      return detections;
  }
}

export function sortDetections(detections: Detection[], sortBy: 'timestamp' | 'confidence' | 'type' = 'timestamp'): Detection[] {
  return [...detections].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'confidence':
        return b.confidence - a.confidence;
      case 'type':
        return a.objectType.localeCompare(b.objectType);
      default:
        return 0;
    }
  });
}

// Fixed unique ID generation
export const generateDetectionId = (() => {
  let counter = 0;
  
  return function(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `detection_${crypto.randomUUID()}`;
    }
    
    // Enhanced fallback for older browsers - more entropy
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 8);
    counter = counter + 1;
    
    return `detection_${timestamp}_${random1}_${random2}_${counter}`;
  };
})();

// Alternative UUID v4 implementation
export function generateUniqueId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function exportDetectionsToCSV(detections: Detection[]): string {
  const headers = ['ID', 'Object Type', 'Confidence', 'Timestamp', 'Coordinates', 'Filename'];
  const rows = detections.map(d => [
    d._id,
    d.objectType,
    formatConfidence(d.confidence),
    new Date(d.timestamp).toISOString(),
    d.coordinates ? `${d.coordinates.lat},${d.coordinates.lng}` : 'N/A',
    d.imageFilename
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

// Additional utility functions for TactMap

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidImageType(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(mimeType.toLowerCase());
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function getRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMinutes > 0) return rtf.format(-diffMinutes, 'minute');
  return rtf.format(-diffSeconds, 'second');
}

export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  // Remove extra spaces and normalize
  const normalized = input.trim().replace(/\s+/g, ' ');
  
  // Try different coordinate formats
  const patterns = [
    // Decimal degrees: "40.7128, -74.0060"
    /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
    // DMS format: "40°42'46.0"N 74°00'21.6"W"
    /^(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])$/,
  ];
  
  // Try decimal degrees first
  const decimalMatch = normalized.match(patterns[0]);
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lng = parseFloat(decimalMatch[2]);
    if (validateCoordinates(lat, lng)) {
      return { lat, lng };
    }
  }
  
  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function roundToDecimals(value: number, decimals: number): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new ApiError(
        `HTTP error! status: ${response.status}`,
        response.status,
        await response.json().catch(() => null)
      );
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Local storage helpers
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
    return false;
  }
}

// Detection analysis helpers
export function analyzeDetections(detections: Detection[]) {
  const analysis = {
    totalCount: detections.length,
    objectTypeCounts: {} as Record<string, number>,
    averageConfidence: 0,
    highConfidenceCount: 0,
    threatLevelCounts: { high: 0, medium: 0, low: 0 },
    recentCount: 0,
    coordinateBounds: {
      minLat: Infinity, maxLat: -Infinity,
      minLng: Infinity, maxLng: -Infinity
    }
  };

  if (detections.length === 0) return analysis;

  let totalConfidence = 0;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  detections.forEach(detection => {
    // Count object types
    analysis.objectTypeCounts[detection.objectType] = 
      (analysis.objectTypeCounts[detection.objectType] || 0) + 1;

    // Calculate confidence stats
    totalConfidence += detection.confidence;
    if (detection.confidence > 0.8) {
      analysis.highConfidenceCount++;
    }

    // Count threat levels
    const threatLevel = getThreatLevel(detection.objectType);
    analysis.threatLevelCounts[threatLevel]++;

    // Count recent detections
    if (new Date(detection.timestamp) > oneHourAgo) {
      analysis.recentCount++;
    }

    // Update coordinate bounds
    const { lat, lng } = detection.coordinates;
    analysis.coordinateBounds.minLat = Math.min(analysis.coordinateBounds.minLat, lat);
    analysis.coordinateBounds.maxLat = Math.max(analysis.coordinateBounds.maxLat, lat);
    analysis.coordinateBounds.minLng = Math.min(analysis.coordinateBounds.minLng, lng);
    analysis.coordinateBounds.maxLng = Math.max(analysis.coordinateBounds.maxLng, lng);
  });

  analysis.averageConfidence = totalConfidence / detections.length;

  return analysis;
}

// Debug helpers
export function debugDetections(detections: Detection[]): void {
  if (process.env.NODE_ENV !== 'development') return;

  const ids = detections.map(d => d._id);
  const uniqueIds = new Set(ids);
  
  if (ids.length !== uniqueIds.size) {
    console.error('🚨 Duplicate detection IDs found!');
    console.table({
      'Total IDs': ids.length,
      'Unique IDs': uniqueIds.size,
      'Duplicates': ids.length - uniqueIds.size
    });
    
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.log('Duplicate IDs:', duplicates);
  } else {
    console.log('✅ All detection IDs are unique');
  }
}

// Export all utility constants
export const TACTICAL_OBJECT_TYPES = [
  'person', 'car', 'truck', 'airplane', 'boat', 'motorcycle', 
  'bus', 'train', 'tank', 'military_vehicle', 'personnel', 
  'aircraft', 'building', 'camp', 'weapon', 'missile', 'helicopter'
];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.3
};

export const DETECTION_COLORS = {
  HIGH_CONFIDENCE: '#4ecdc4',
  MEDIUM_CONFIDENCE: '#f7931e',
  LOW_CONFIDENCE: '#ff6b35',
  HIGH_THREAT: '#ff4444',
  MEDIUM_THREAT: '#ff8800',
  LOW_THREAT: '#44ff44'
};