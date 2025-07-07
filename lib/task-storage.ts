import { DopplerTask } from './types';

/**
 * Load tasks from file storage via API
 */
export async function loadTasks(): Promise<DopplerTask[]> {
  try {
    const response = await fetch('/api/tasks', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load tasks: ${response.status}`);
    }

    const tasks = await response.json();
    
    // Convert date strings back to Date objects
    return tasks.map((task: Record<string, unknown>) => ({
      ...task,
      created_at: new Date(task.created_at as string),
      updated_at: new Date(task.updated_at as string),
    }));
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

/**
 * Save tasks to file storage via API
 */
export async function saveTasks(tasks: DopplerTask[]): Promise<void> {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tasks),
    });

    if (!response.ok) {
      throw new Error(`Failed to save tasks: ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
} 