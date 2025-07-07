import { CreateTaskRequest, CreateTaskResponse, TaskStatus } from './types';

/**
 * Create a new optimization task in Doppler
 * This now uses the Next.js API route to avoid CORS issues
 */
export async function createOptimizationTask(
  request: CreateTaskRequest
): Promise<CreateTaskResponse> {
  const response = await fetch('/api/doppler/create-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create task: ${response.status} ${errorData.error || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Get the results of an optimization task
 * This now uses the Next.js API route to avoid CORS issues
 */
export async function getOptimizationResult(taskId: string): Promise<TaskStatus> {
  // Multiple cache-busting parameters
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substring(7);
  const random2 = Math.random().toString(36).substring(7);
  const url = `/api/doppler/get-results/${taskId}?t=${timestamp}&r1=${random1}&r2=${random2}&nocache=true`;
  
  console.log(`🔄 Client: Fetching results for task ${taskId}`);
  console.log(`🌐 Client: Making request to URL: ${url}`);
  console.log(`🕐 Client: Request timestamp: ${new Date().toISOString()}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
      'If-None-Match': '*'
    },
    cache: 'no-store'
  });

  console.log(`📡 Client: Response status ${response.status} for task ${taskId}`);
  console.log(`📡 Client: Response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`❌ Client: Error for task ${taskId}:`, errorData);
    throw new Error(`Failed to get results: ${response.status} ${errorData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log(`✅ Client: Success for task ${taskId}:`, data);
  console.log(`📊 Client: Response data type:`, typeof data, Array.isArray(data) ? 'array' : 'object');
  return data;
} 