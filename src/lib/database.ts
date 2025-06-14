import { Detection, Stats } from '@/types';

// In-memory storage for development (replace with real database in production)
class InMemoryDatabase {
  private detections: Detection[] = [];
  private maxDetections = 1000;

  async saveDetection(detection: Detection): Promise<void> {
    this.detections.unshift(detection);
    
    // Keep only the most recent detections
    if (this.detections.length > this.maxDetections) {
      this.detections = this.detections.slice(0, this.maxDetections);
    }
  }

  async saveDetections(detections: Detection[]): Promise<void> {
    this.detections = [...detections, ...this.detections];
    
    // Keep only the most recent detections
    if (this.detections.length > this.maxDetections) {
      this.detections = this.detections.slice(0, this.maxDetections);
    }
  }

  async getDetections(limit: number = 100): Promise<Detection[]> {
    return this.detections.slice(0, limit);
  }

  async getDetectionById(id: string): Promise<Detection | null> {
    return this.detections.find(d => d._id === id) || null;
  }

  async getDetectionsByType(objectType: string, limit: number = 50): Promise<Detection[]> {
    return this.detections
      .filter(d => d.objectType.toLowerCase() === objectType.toLowerCase())
      .slice(0, limit);
  }

  async getRecentDetections(hours: number = 1): Promise<Detection[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.detections.filter(d => new Date(d.timestamp) > cutoffTime);
  }

  async getStats(): Promise<Stats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentDetections = this.detections.filter(
      d => new Date(d.timestamp) > oneHourAgo
    ).length;

    // Calculate object type statistics
    const objectTypeCounts = this.detections.reduce((acc, detection) => {
      const type = detection.objectType;
      if (!acc[type]) {
        acc[type] = { count: 0, totalConfidence: 0 };
      }
      acc[type].count++;
      acc[type].totalConfidence += detection.confidence;
      return acc;
    }, {} as Record<string, { count: number; totalConfidence: number }>);

    const objectTypes = Object.entries(objectTypeCounts)
      .map(([type, data]) => ({
        _id: type,
        count: data.count,
        avgConfidence: data.totalConfidence / data.count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalDetections: this.detections.length,
      recentDetections,
      objectTypes
    };
  }

  async deleteDetection(id: string): Promise<boolean> {
    const index = this.detections.findIndex(d => d._id === id);
    if (index !== -1) {
      this.detections.splice(index, 1);
      return true;
    }
    return false;
  }

  async clearDetections(): Promise<void> {
    this.detections = [];
  }

  // Search functionality
  async searchDetections(query: {
    objectType?: string;
    minConfidence?: number;
    maxConfidence?: number;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<Detection[]> {
    let filtered = this.detections;

    if (query.objectType) {
      filtered = filtered.filter(d => 
        d.objectType.toLowerCase().includes(query.objectType!.toLowerCase())
      );
    }

    if (query.minConfidence !== undefined) {
      filtered = filtered.filter(d => d.confidence >= query.minConfidence!);
    }

    if (query.maxConfidence !== undefined) {
      filtered = filtered.filter(d => d.confidence <= query.maxConfidence!);
    }

    if (query.fromDate) {
      filtered = filtered.filter(d => new Date(d.timestamp) >= query.fromDate!);
    }

    if (query.toDate) {
      filtered = filtered.filter(d => new Date(d.timestamp) <= query.toDate!);
    }

    return filtered.slice(0, query.limit || 100);
  }
}

// Export singleton instance
export const database = new InMemoryDatabase();

// Database interface for future implementations
export interface DatabaseInterface {
  saveDetection(detection: Detection): Promise<void>;
  saveDetections(detections: Detection[]): Promise<void>;
  getDetections(limit?: number): Promise<Detection[]>;
  getDetectionById(id: string): Promise<Detection | null>;
  getStats(): Promise<Stats>;
  deleteDetection(id: string): Promise<boolean>;
  clearDetections(): Promise<void>;
}