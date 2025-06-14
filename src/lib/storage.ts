import { Detection } from '@/types';

export interface FileUploadResult {
  success: boolean;
  filename?: string;
  path?: string;
  size?: number;
  error?: string;
}

export interface ImageMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
  dimensions?: {
    width: number;
    height: number;
  };
}

class StorageManager {
  private uploadDir = '/tmp/uploads'; // In production, use proper storage
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  async saveUploadedFile(file: File): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const filename = this.generateFilename(file.name);
      const filepath = `${this.uploadDir}/${filename}`;

      // In a real implementation, you would save to disk or cloud storage
      // For now, we'll just simulate the upload
      console.log(`Simulating file save: ${filepath}`);

      return {
        success: true,
        filename,
        path: filepath,
        size: file.size
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB` 
      };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}` 
      };
    }

    return { valid: true };
  }

  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${timestamp}_${random}.${extension}`;
  }

  async getImageMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          filename: this.generateFilename(file.name),
          originalName: file.name,
          size: file.size,
          mimetype: file.type,
          uploadedAt: new Date(),
          dimensions: {
            width: img.width,
            height: img.height
          }
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          filename: this.generateFilename(file.name),
          originalName: file.name,
          size: file.size,
          mimetype: file.type,
          uploadedAt: new Date()
        });
      };

      img.src = objectUrl;
    });
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  isValidImageFile(file: File): boolean {
    return this.allowedTypes.includes(file.type);
  }

  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export const storage = new StorageManager();

// Utility functions for local storage
export const localStorageKeys = {
  DETECTIONS: 'tactmap_detections',
  SETTINGS: 'tactmap_settings',
  USER_PREFERENCES: 'tactmap_preferences'
} as const;

export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
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

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// Cache management for detections
export class DetectionCache {
  private cache = new Map<string, Detection>();
  private maxSize = 500;

  set(detection: Detection): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(detection._id, detection);
  }

  get(id: string): Detection | undefined {
    return this.cache.get(id);
  }

  getAll(): Detection[] {
    return Array.from(this.cache.values());
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const detectionCache = new DetectionCache();