import { Detection } from '@/types';

class SharedDataStore {
  private detections: Detection[] = [];
  private maxDetections = 1000;
  private detectionIds = new Set<string>(); // Track existing IDs

  addDetections(newDetections: Detection[]): void {
    // Filter out duplicates
    const uniqueDetections = newDetections.filter(detection => {
      if (this.detectionIds.has(detection._id)) {
        console.warn(`Duplicate detection ID found: ${detection._id}`);
        return false;
      }
      this.detectionIds.add(detection._id);
      return true;
    });

    this.detections = [...uniqueDetections, ...this.detections];
    this.cleanup();
  }

  addDetection(detection: Detection): void {
    if (this.detectionIds.has(detection._id)) {
      console.warn(`Duplicate detection ID found: ${detection._id}`);
      return;
    }
    
    this.detectionIds.add(detection._id);
    this.detections.unshift(detection);
    this.cleanup();
  }

  private cleanup(): void {
    if (this.detections.length > this.maxDetections) {
      // Remove excess detections and their IDs from the set
      const removedDetections = this.detections.slice(this.maxDetections);
      removedDetections.forEach(detection => {
        this.detectionIds.delete(detection._id);
      });
      this.detections = this.detections.slice(0, this.maxDetections);
    }
  }

  getDetections(limit: number = 100): Detection[] {
    return this.detections.slice(0, limit);
  }

  getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentDetections = this.detections.filter(
      d => new Date(d.timestamp) > oneHourAgo
    ).length;

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

  clear(): void {
    this.detections = [];
    this.detectionIds.clear();
  }
}

export const dataStore = new SharedDataStore();