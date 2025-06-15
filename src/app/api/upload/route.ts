import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/shared-data';
import { generateDetectionId } from '@/lib/utils';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    console.log(`📁 Processing: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

    // Forward to Python backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/detect`, {
        method: 'POST',
        body: backendFormData,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Backend response:', {
        success: result.success,
        total: result.total_detections,
      });
      
      let detections = [];
      
      if (result.success && result.detections && Array.isArray(result.detections)) {
        detections = result.detections.map((detection: any) => ({
          _id: generateDetectionId(),
          objectType: detection.class || 'unknown',
          confidence: detection.confidence || 0.5,
          coordinates: {
            x: detection.x || 0,
            y: detection.y || 0,
            lat: detection.lat,
            lng: detection.lng
          },
          boundingBox: {
            x1: detection.x1,
            y1: detection.y1,
            x2: detection.x2,
            y2: detection.y2,
            width: detection.width,
            height: detection.height
          },
          timestamp: new Date().toISOString(),
          imageFilename: file.name,
          imageShape: result.image_shape,
          region: detection.region
        }));

        if (detections.length > 0) {
          dataStore.addDetections(detections);
          console.log(`✅ Stored ${detections.length} detections`);
        }
      }

      return NextResponse.json({
        success: true,
        detections,
        message: detections.length > 0 
          ? `Found ${detections.length} ${detections.length === 1 ? 'object' : 'objects'}` 
          : 'No objects detected',
        totalDetections: detections.length,
        modelLoaded: result.model_loaded
      });

    } catch (fetchError) {
      console.error('❌ Failed to connect to Python backend:', fetchError);
      
      // Fallback: Generate mock detections
      const mockDetections = generateMockDetections(file.name);
      dataStore.addDetections(mockDetections);
      
      return NextResponse.json({
        success: true,
        detections: mockDetections,
        message: `Generated ${mockDetections.length} mock detections (backend unavailable)`,
        totalDetections: mockDetections.length,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image' 
      },
      { status: 500 }
    );
  }
}

function generateMockDetections(filename: string) {
  const regions = [
    { name: "Middle East", base_lat: 33.3152, base_lng: 44.3661 },
    { name: "Eastern Europe", base_lat: 50.4501, base_lng: 30.5234 },
    { name: "South Asia", base_lat: 28.6139, base_lng: 77.2090 },
    { name: "East Asia", base_lat: 39.9042, base_lng: 116.4074 },
    { name: "North Africa", base_lat: 30.0444, base_lng: 31.2357 }
  ];
  
  const numDetections = Math.floor(Math.random() * 6) + 2; // 2-7 detections
  const detections = [];
  
  for (let i = 0; i < numDetections; i++) {
    const region = regions[i % regions.length];
    const lat = region.base_lat + (Math.random() - 0.5) * 0.1;
    const lng = region.base_lng + (Math.random() - 0.5) * 0.1;
    
    detections.push({
      _id: generateDetectionId(),
      objectType: 'tank',
      confidence: 0.7 + Math.random() * 0.25,
      coordinates: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        lat,
        lng
      },
      boundingBox: {
        x1: Math.random() * 700,
        y1: Math.random() * 500,
        x2: Math.random() * 100 + 700,
        y2: Math.random() * 100 + 500,
        width: Math.random() * 100 + 50,
        height: Math.random() * 100 + 50
      },
      timestamp: new Date().toISOString(),
      imageFilename: filename,
      region: region.name
    });
  }
  
  return detections;
}