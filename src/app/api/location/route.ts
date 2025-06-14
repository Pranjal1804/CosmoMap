import { NextRequest, NextResponse } from 'next/server';

interface LocationAnalysisRequest {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  radius?: number; // in kilometers
}

interface LocationAnalysisResponse {
  success: boolean;
  location: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  detections?: any[];
  satelliteImageUrl?: string;
  error?: string;
}

// Mock satellite imagery providers (in production, use real APIs)
const SATELLITE_PROVIDERS = {
  GOOGLE_MAPS: 'https://maps.googleapis.com/maps/api/staticmap',
  MAPBOX: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static',
  BING: 'https://dev.virtualearth.net/REST/v1/Imagery/Map'
};

export async function POST(request: NextRequest) {
  try {
    const body: LocationAnalysisRequest = await request.json();
    
    let coordinates: { lat: number; lng: number };
    let locationName: string;

    if (body.latitude !== undefined && body.longitude !== undefined) {
      // Direct coordinates provided
      coordinates = { lat: body.latitude, lng: body.longitude };
      locationName = await reverseGeocode(body.latitude, body.longitude);
    } else if (body.locationName) {
      // Location name provided - need to geocode
      const geocodeResult = await geocodeLocation(body.locationName);
      if (!geocodeResult) {
        return NextResponse.json({
          success: false,
          error: 'Location not found'
        }, { status: 404 });
      }
      coordinates = geocodeResult.coordinates;
      locationName = geocodeResult.name;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either coordinates or location name must be provided'
      }, { status: 400 });
    }

    // Get satellite imagery for the location
    const satelliteImageUrl = await getSatelliteImagery(
      coordinates.lat, 
      coordinates.lng
    );

    // If we have satellite imagery, analyze it with our FastAPI backend
    let detections: any[] = [];
    if (satelliteImageUrl) {
      try {
        // Download satellite image and send to FastAPI for analysis
        const analysisResult = await analyzeSatelliteImage(satelliteImageUrl);
        detections = analysisResult.detections || [];
      } catch (error) {
        console.error('Failed to analyze satellite image:', error);
      }
    }

    const response: LocationAnalysisResponse = {
      success: true,
      location: {
        name: locationName,
        coordinates
      },
      detections,
      satelliteImageUrl: satelliteImageUrl || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Location analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') || '0');
  const lng = parseFloat(url.searchParams.get('lng') || '0');
  const radius = parseFloat(url.searchParams.get('radius') || '5');

  if (!lat || !lng) {
    return NextResponse.json({
      error: 'Latitude and longitude are required'
    }, { status: 400 });
  }

  try {
    // Get nearby detections (mock implementation)
    const nearbyDetections = await getNearbyDetections(lat, lng, radius);
    
    return NextResponse.json({
      success: true,
      coordinates: { lat, lng },
      radius,
      detections: nearbyDetections
    });

  } catch (error) {
    console.error('Error getting nearby detections:', error);
    return NextResponse.json({
      error: 'Failed to get nearby detections'
    }, { status: 500 });
  }
}

// Helper functions

async function geocodeLocation(locationName: string): Promise<{
  name: string;
  coordinates: { lat: number; lng: number };
} | null> {
  try {
    // Mock geocoding - in production, use a real geocoding service
    const mockLocations: Record<string, { lat: number; lng: number }> = {
      'new york': { lat: 40.7128, lng: -74.0060 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'moscow': { lat: 55.7558, lng: 37.6176 },
      'beijing': { lat: 39.9042, lng: 116.4074 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'cairo': { lat: 30.0444, lng: 31.2357 }
    };

    const normalizedName = locationName.toLowerCase().trim();
    const coordinates = mockLocations[normalizedName];
    
    if (coordinates) {
      return {
        name: locationName,
        coordinates
      };
    }

    // If not found in mock data, return null
    return null;

  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Mock reverse geocoding - in production, use a real service
    return `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function getSatelliteImagery(lat: number, lng: number): Promise<string | null> {
  try {
    // Mock satellite imagery URL - in production, use real satellite data providers
    const zoom = 16;
    const size = '640x640';
    
    // This would be a real satellite imagery API call
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${zoom}/${size}@2x?access_token=YOUR_MAPBOX_TOKEN`;
    
  } catch (error) {
    console.error('Failed to get satellite imagery:', error);
    return null;
  }
}

async function analyzeSatelliteImage(imageUrl: string): Promise<{ detections: any[] }> {
  try {
    // In a real implementation, you would:
    // 1. Download the satellite image
    // 2. Send it to your FastAPI backend for analysis
    // 3. Return the detection results
    
    // Mock analysis result
    return {
      detections: [
        {
          _id: `detection_${Date.now()}_1`,
          objectType: 'building',
          confidence: 0.89,
          coordinates: { x: 320, y: 240, lat: 0, lng: 0 },
          timestamp: new Date().toISOString(),
          imageFilename: 'satellite_image.jpg'
        }
      ]
    };

  } catch (error) {
    console.error('Satellite image analysis error:', error);
    return { detections: [] };
  }
}

async function getNearbyDetections(
  lat: number, 
  lng: number, 
  radius: number
): Promise<any[]> {
  try {
    // Mock implementation - in production, query your database
    // for detections within the specified radius
    
    return [
      {
        _id: `nearby_${Date.now()}_1`,
        objectType: 'car',
        confidence: 0.75,
        coordinates: { 
          lat: lat + 0.001, 
          lng: lng + 0.001,
          x: 100,
          y: 100
        },
        timestamp: new Date().toISOString(),
        imageFilename: 'satellite_analysis.jpg',
        distance: 0.1 // km
      }
    ];

  } catch (error) {
    console.error('Error getting nearby detections:', error);
    return [];
  }
}

// Utility function to calculate distance between two points
function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
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