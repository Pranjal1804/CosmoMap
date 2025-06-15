export interface Detection {
  _id: string;
  objectType: string;
  confidence: number;
  coordinates: {
    x: number;
    y: number;
    lat: number;
    lng: number;
  };
  boundingBox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
  timestamp: string;
  imageFilename: string;
  imageShape?: {
    width: number;
    height: number;
  };
  region?: string;
}

export interface Stats {
  totalDetections: number;
  recentDetections: number;
  objectTypes: {
    _id: string;
    count: number;
    avgConfidence: number;
  }[];
  uniqueObjectTypes?: number;
  averageConfidence?: number;
  highConfidenceCount?: number;
  coordinateBounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
}

export type FilterType = 'all' | 'tactical' | 'recent';