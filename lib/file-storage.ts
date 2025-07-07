import { promises as fs } from 'fs';
import path from 'path';
import { DopplerTask } from './types';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'tasks.json');

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory() {
  const dataDir = path.dirname(STORAGE_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Load tasks from JSON file
 */
export async function loadTasksFromFile(): Promise<DopplerTask[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    const tasks = JSON.parse(data);
    
    // Convert date strings back to Date objects
    return tasks.map((task: Record<string, unknown>) => ({
      ...task,
      created_at: new Date(task.created_at as string),
      updated_at: new Date(task.updated_at as string),
    }));
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error('Error loading tasks from file:', error);
    return [];
  }
}

/**
 * Save tasks to JSON file
 */
export async function saveTasksToFile(tasks: DopplerTask[]): Promise<void> {
  try {
    await ensureDataDirectory();
    
    // Convert to plain objects for JSON serialization
    const serializedTasks = tasks.map(task => ({
      ...task,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),
    }));
    
    await fs.writeFile(STORAGE_FILE, JSON.stringify(serializedTasks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving tasks to file:', error);
    throw error;
  }
}

/**
 * Add a new task to the file
 */
export async function addTaskToFile(task: DopplerTask): Promise<void> {
  const tasks = await loadTasksFromFile();
  tasks.push(task);
  await saveTasksToFile(tasks);
}

/**
 * Update an existing task in the file
 */
export async function updateTaskInFile(taskId: string, updates: Partial<DopplerTask>): Promise<void> {
  const tasks = await loadTasksFromFile();
  const taskIndex = tasks.findIndex(task => task.task_id === taskId);
  
  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    await saveTasksToFile(tasks);
  }
}

/**
 * Get a specific task by task_id
 */
export async function getTaskFromFile(taskId: string): Promise<DopplerTask | null> {
  const tasks = await loadTasksFromFile();
  return tasks.find(task => task.task_id === taskId) || null;
} 