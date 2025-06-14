import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/shared-data';

export async function GET() {
  try {
    const stats = dataStore.getStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}