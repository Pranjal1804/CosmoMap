import { Detection } from '@/types';

class SharedDataStore {
  private detections: Detection[] = [];
  private maxDetections = 1000;
  private detectionIds = new Set<string>(); // Track existing IDs

  addDetections(newDetections: Detection[]): void {
    console.log(`📥 Attempting to add ${newDetections.length} new detections`);
    
    // Filter out duplicates and validate coordinates
    const uniqueDetections = newDetections.filter(detection => {
      // Check for duplicate IDs
      if (this.detectionIds.has(detection._id)) {
        console.warn(`🔄 Duplicate detection ID found: ${detection._id}`);
        return false;
      }
      
      // Validate coordinates exist
      if (!detection.coordinates || 
          typeof detection.coordinates.lat !== 'number' || 
          typeof detection.coordinates.lng !== 'number') {
        console.warn(`❌ Invalid coordinates for detection ${detection._id}`);
        return false;
      }
      
      // Check for obviously invalid coordinates (NaN, Infinity, etc.)
      if (!isFinite(detection.coordinates.lat) || !isFinite(detection.coordinates.lng)) {
        console.warn(`🚫 Non-finite coordinates for detection ${detection._id}: (${detection.coordinates.lat}, ${detection.coordinates.lng})`);
        return false;
      }
      
      // Validate coordinates are within valid Earth bounds
      if (detection.coordinates.lat < -90 || detection.coordinates.lat > 90 ||
          detection.coordinates.lng < -180 || detection.coordinates.lng > 180) {
        console.warn(`🌍 Out of bounds coordinates for detection ${detection._id}: (${detection.coordinates.lat}, ${detection.coordinates.lng})`);
        return false;
      }
      
      // Check if coordinates are defaulting to London (common error)
      const isLondon = Math.abs(detection.coordinates.lat - 51.5074) < 0.001 && 
                       Math.abs(detection.coordinates.lng + 0.1278) < 0.001;
      
      if (isLondon) {
        console.warn(`🇬🇧 Detection ${detection._id} has London default coordinates, rejecting`);
        return false;
      }
      
      // Check if coordinates are defaulting to (0, 0) - Null Island
      const isNullIsland = Math.abs(detection.coordinates.lat) < 0.001 && 
                           Math.abs(detection.coordinates.lng) < 0.001;
      
      if (isNullIsland) {
        console.warn(`🏝️ Detection ${detection._id} has (0,0) coordinates, rejecting`);
        return false;
      }
      
      this.detectionIds.add(detection._id);
      return true;
    });

    console.log(`✅ Adding ${uniqueDetections.length} valid detections (filtered out ${newDetections.length - uniqueDetections.length})`);
    
    // Log coordinate information for debugging
    uniqueDetections.forEach((det, index) => {
      console.log(`  ${index + 1}. ${det.objectType} (${(det.confidence * 100).toFixed(1)}%) at (${det.coordinates.lat.toFixed(4)}, ${det.coordinates.lng.toFixed(4)})`);
    });

    // Add to the beginning of the array (most recent first)
    this.detections = [...uniqueDetections, ...this.detections];
    this.cleanup();
    
    console.log(`📊 Total detections in store: ${this.detections.length}`);
  }

  addDetection(detection: Detection): void {
    console.log(`📥 Adding single detection: ${detection._id}`);
    
    if (this.detectionIds.has(detection._id)) {
      console.warn(`🔄 Duplicate detection ID found: ${detection._id}`);
      return;
    }
    
    // Validate coordinates
    if (!detection.coordinates || 
        typeof detection.coordinates.lat !== 'number' || 
        typeof detection.coordinates.lng !== 'number' ||
        !isFinite(detection.coordinates.lat) || 
        !isFinite(detection.coordinates.lng)) {
      console.warn(`❌ Invalid coordinates for detection ${detection._id}`);
      return;
    }
    
    // Validate coordinate bounds
    if (detection.coordinates.lat < -90 || detection.coordinates.lat > 90 ||
        detection.coordinates.lng < -180 || detection.coordinates.lng > 180) {
      console.warn(`🌍 Out of bounds coordinates for detection ${detection._id}`);
      return;
    }
    
    this.detectionIds.add(detection._id);
    this.detections.unshift(detection);
    this.cleanup();
    
    console.log(`✅ Added detection at (${detection.coordinates.lat.toFixed(4)}, ${detection.coordinates.lng.toFixed(4)})`);
  }

  private cleanup(): void {
    if (this.detections.length > this.maxDetections) {
      console.log(`🧹 Cleaning up: removing ${this.detections.length - this.maxDetections} old detections`);
      
      // Remove excess detections and their IDs from the set
      const removedDetections = this.detections.slice(this.maxDetections);
      removedDetections.forEach(detection => {
        this.detectionIds.delete(detection._id);
      });
      this.detections = this.detections.slice(0, this.maxDetections);
    }
  }

  getDetections(limit: number = 100): Detection[] {
    const result = this.detections.slice(0, limit);
    console.log(`📤 Returning ${result.length} detections (requested: ${limit})`);
    return result;
  }

  getDetectionById(id: string): Detection | undefined {
    return this.detections.find(detection => detection._id === id);
  }

  getDetectionsByType(objectType: string, limit: number = 100): Detection[] {
    return this.detections
      .filter(detection => detection.objectType.toLowerCase() === objectType.toLowerCase())
      .slice(0, limit);
  }

  getDetectionsByConfidence(minConfidence: number = 0.8, limit: number = 100): Detection[] {
    return this.detections
      .filter(detection => detection.confidence >= minConfidence)
      .slice(0, limit);
  }

  getDetectionsInRadius(centerLat: number, centerLng: number, radiusKm: number, limit: number = 100): Detection[] {
    return this.detections
      .filter(detection => {
        const distance = this.calculateDistance(
          centerLat, centerLng,
          detection.coordinates.lat, detection.coordinates.lng
        );
        return distance <= radiusKm;
      })
      .slice(0, limit);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

    const stats = {
      totalDetections: this.detections.length,
      recentDetections,
      objectTypes,
      uniqueObjectTypes: objectTypes.length,
      averageConfidence: this.detections.length > 0 
        ? this.detections.reduce((sum, d) => sum + d.confidence, 0) / this.detections.length 
        : 0,
      highConfidenceCount: this.detections.filter(d => d.confidence >= 0.8).length,
      coordinateBounds: this.getCoordinateBounds()
    };

    console.log(`📈 Stats: ${stats.totalDetections} total, ${stats.recentDetections} recent, ${stats.uniqueObjectTypes} types`);
    return stats;
  }

  private getCoordinateBounds() {
    if (this.detections.length === 0) {
      return null;
    }

    const bounds = {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity
    };

    this.detections.forEach(detection => {
      const { lat, lng } = detection.coordinates;
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
      bounds.minLng = Math.min(bounds.minLng, lng);
      bounds.maxLng = Math.max(bounds.maxLng, lng);
    });

    return bounds;
  }

  getDetectionsByTimeRange(startTime: Date, endTime: Date, limit: number = 100): Detection[] {
    return this.detections
      .filter(detection => {
        const detectionTime = new Date(detection.timestamp);
        return detectionTime >= startTime && detectionTime <= endTime;
      })
      .slice(0, limit);
  }

  exportDetections(): any[] {
    return this.detections.map(detection => ({
      id: detection._id,
      type: detection.objectType,
      confidence: detection.confidence,
      coordinates: detection.coordinates,
      timestamp: detection.timestamp,
      filename: detection.imageFilename,
      ...(detection as any).boundingBox && { boundingBox: (detection as any).boundingBox }
    }));
  }

  clear(): void {
    console.log(`🗑️ Clearing all detections (${this.detections.length} removed)`);
    this.detections = [];
    this.detectionIds.clear();
  }

  removeDetection(id: string): boolean {
    const index = this.detections.findIndex(detection => detection._id === id);
    if (index !== -1) {
      this.detections.splice(index, 1);
      this.detectionIds.delete(id);
      console.log(`🗑️ Removed detection: ${id}`);
      return true;
    }
    console.warn(`❌ Detection not found for removal: ${id}`);
    return false;
  }

  updateDetection(id: string, updates: Partial<Detection>): boolean {
    const index = this.detections.findIndex(detection => detection._id === id);
    if (index !== -1) {
      this.detections[index] = { ...this.detections[index], ...updates };
      console.log(`✏️ Updated detection: ${id}`);
      return true;
    }
    console.warn(`❌ Detection not found for update: ${id}`);
    return false;
  }

  // Debug methods
  debugInfo(): void {
    console.group('🔍 SharedDataStore Debug Info');
    console.log(`Total detections: ${this.detections.length}`);
    console.log(`Unique IDs: ${this.detectionIds.size}`);
    console.log(`Max detections: ${this.maxDetections}`);
    
    if (this.detections.length > 0) {
      console.log('Recent detections:');
      this.detections.slice(0, 5).forEach((det, i) => {
        console.log(`  ${i + 1}. ${det.objectType} at (${det.coordinates.lat.toFixed(4)}, ${det.coordinates.lng.toFixed(4)}) - ${det.confidence.toFixed(3)}`);
      });
      
      const bounds = this.getCoordinateBounds();
      if (bounds) {
        console.log(`Coordinate bounds: Lat(${bounds.minLat.toFixed(4)} to ${bounds.maxLat.toFixed(4)}), Lng(${bounds.minLng.toFixed(4)} to ${bounds.maxLng.toFixed(4)})`);
      }
    }
    console.groupEnd();
  }

  validateIntegrity(): boolean {
    const issues: string[] = [];
    
    // Check for duplicate IDs
    const actualIds = this.detections.map(d => d._id);
    const uniqueIds = new Set(actualIds);
    if (actualIds.length !== uniqueIds.size) {
      issues.push(`Duplicate IDs found: ${actualIds.length} total vs ${uniqueIds.size} unique`);
    }
    
    // Check if tracked IDs match actual IDs
    if (this.detectionIds.size !== uniqueIds.size) {
      issues.push(`ID tracking mismatch: ${this.detectionIds.size} tracked vs ${uniqueIds.size} actual`);
    }
    
    // Check for invalid coordinates
    const invalidCoords = this.detections.filter(d => 
      !d.coordinates || 
      !isFinite(d.coordinates.lat) || 
      !isFinite(d.coordinates.lng) ||
      d.coordinates.lat < -90 || d.coordinates.lat > 90 ||
      d.coordinates.lng < -180 || d.coordinates.lng > 180
    );
    
    if (invalidCoords.length > 0) {
      issues.push(`${invalidCoords.length} detections with invalid coordinates`);
    }
    
    if (issues.length > 0) {
      console.error('🚨 Data integrity issues found:', issues);
      return false;
    }
    
    console.log('✅ Data integrity check passed');
    return true;
  }
}

export const dataStore = new SharedDataStore();

// Export singleton instance for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).dataStore = dataStore;
}