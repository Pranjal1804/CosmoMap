export interface Detection {
  _id: string;
  objectType: string;
  confidence: number;
  timestamp: string;
  imageFilename: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Stats {
  totalDetections: number;
  recentDetections: number;
  objectTypes: Array<{
    _id: string;
    count: number;
    avgConfidence: number;
  }>;
}

export interface UploadResult {
  detections: Detection[];
  processingTime: number;
  error?: string;
}

export type FilterType = 'all' | 'tactical' | 'recent';