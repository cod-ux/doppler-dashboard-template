import { NextRequest, NextResponse } from 'next/server';
import { CreateTaskRequest, CreateTaskResponse } from '@/lib/types';

const DOPPLER_API_BASE = process.env.DOPPLER_API_BASE;
const API_KEY = process.env.DOPPLER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'DOPPLER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body: CreateTaskRequest = await request.json();

    const response = await fetch(`${DOPPLER_API_BASE}/create_task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Doppler API error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data: CreateTaskResponse = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating optimization task:', error);
    return NextResponse.json(
      { error: 'Failed to create optimization task' },
      { status: 500 }
    );
  }
} 