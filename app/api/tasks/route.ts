import { NextRequest, NextResponse } from 'next/server';
import { DopplerTask } from '@/lib/types';
import { loadTasksFromFile, saveTasksToFile } from '@/lib/file-storage';

/**
 * GET /api/tasks - Load all tasks from file
 */
export async function GET() {
  try {
    const tasks = await loadTasksFromFile();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    return NextResponse.json(
      { error: 'Failed to load tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks - Save tasks to file
 */
export async function POST(request: NextRequest) {
  try {
    const tasks: DopplerTask[] = await request.json();
    
    // Convert date strings back to Date objects if needed
    const processedTasks = tasks.map(task => ({
      ...task,
      created_at: typeof task.created_at === 'string' ? new Date(task.created_at) : task.created_at,
      updated_at: typeof task.updated_at === 'string' ? new Date(task.updated_at) : task.updated_at,
    }));
    
    await saveTasksToFile(processedTasks);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    return NextResponse.json(
      { error: 'Failed to save tasks' },
      { status: 500 }
    );
  }
} 