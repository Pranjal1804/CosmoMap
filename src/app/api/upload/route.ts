import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/shared-data';
import { generateDetectionId } from '@/lib/utils';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');

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

    console.log(`📁 Processing: ${file.name} (${file.size} bytes)`);

    // Forward to FastAPI backend
    const fastApiFormData = new FormData();
    fastApiFormData.append('file', file);

    const response = await fetch(`${FASTAPI_URL}/detect`, {
      method: 'POST',
      body: fastApiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ FastAPI error: ${response.status}`, errorText);
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔍 FastAPI response:', {
      success: result.success,
      total: result.total_detections,
      model_loaded: result.model_loaded
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
        imageShape: result.image_shape
      }));

      // Store detections
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