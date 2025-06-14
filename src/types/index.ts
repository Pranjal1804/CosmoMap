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
  timestamp: string;
  imageFilename: string;
}

export interface Stats {
  totalDetections: number;
  recentDetections: number;
  objectTypes: {
    _id: string;
    count: number;
    avgConfidence: number;
  }[];
}

export type FilterType = 'all' | 'tactical' | 'recent';