import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/shared-data';

export async function POST() {
  try {
    dataStore.clear();
    return NextResponse.json({
      success: true,
      message: 'All detections cleared'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear detections' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = dataStore.getStats();
    dataStore.debugInfo();
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Debug info logged to console'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}