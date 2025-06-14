import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/shared-data';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const detections = dataStore.getDetections(limit);
    
    return NextResponse.json({
      detections,
      total: detections.length
    });
  } catch (error) {
    console.error('Detections GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newDetections = await request.json();
    
    if (Array.isArray(newDetections)) {
      dataStore.addDetections(newDetections);
    } else {
      dataStore.addDetection(newDetections);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detections POST error:', error);
    return NextResponse.json(
      { error: 'Failed to store detections' },
      { status: 500 }
    );
  }
}