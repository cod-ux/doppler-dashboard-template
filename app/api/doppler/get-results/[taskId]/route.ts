import { NextRequest, NextResponse } from 'next/server';
import { TaskStatus } from '@/lib/types';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const DOPPLER_API_BASE = process.env.DOPPLER_API_BASE;
const API_KEY = process.env.DOPPLER_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    console.log('🔍 GET /api/doppler/get-results/[taskId] called');
    console.log('📋 Environment check:', {
      DOPPLER_API_BASE,
      API_KEY: API_KEY
    });

    if (!API_KEY) {
      console.error('❌ DOPPLER_API_KEY is not configured');
      return NextResponse.json(
        { error: 'DOPPLER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    if (!DOPPLER_API_BASE) {
      console.error('❌ DOPPLER_API_BASE is not configured');
      return NextResponse.json(
        { error: 'DOPPLER_API_BASE is not configured' },
        { status: 500 }
      );
    }

    const { taskId } = params;
    const fullUrl = `${DOPPLER_API_BASE}/get_results/${taskId}`;
    console.log('🌐 Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'api-key': API_KEY,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    console.log('📊 Doppler API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Doppler API error:', errorText);
      return NextResponse.json(
        { error: `Doppler API error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data: TaskStatus = await response.json();
    console.log('✅ Doppler API success: ', data);
    
    // Add AGGRESSIVE cache-busting headers to the response
    const apiResponse = NextResponse.json(data);
    
    // Standard cache-busting
    apiResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
    apiResponse.headers.set('Pragma', 'no-cache');
    apiResponse.headers.set('Expires', '0');
    
    // Additional cache-busting
    apiResponse.headers.set('Surrogate-Control', 'no-store');
    apiResponse.headers.set('Vary', '*');
    apiResponse.headers.set('Last-Modified', new Date(0).toUTCString());
    apiResponse.headers.set('ETag', `"no-cache-${Date.now()}-${Math.random()}"`);
    
    return apiResponse;

  } catch (error) {
    console.error('💥 Error getting optimization results:', error);
    return NextResponse.json(
      { error: 'Failed to get optimization results' },
      { status: 500 }
    );
  }
} 