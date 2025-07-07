'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MetricHeader } from '@/components/MetricHeader';
import { UnifiedTable } from '@/components/UnifiedTable';
import { 
  EvalRow, 
  DopplerTask, 
  DashboardMetrics, 
} from '@/lib/types';
import { defaultDataSource } from '@/lib/data-source';
import { createOptimizationTask, getOptimizationResult } from '@/lib/api';
import { mapEvalToCreateTaskRequest } from '@/lib/mapping';
import { loadTasks, saveTasks } from '@/lib/task-storage';

export default function Dashboard() {
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [tasks, setTasks] = useState<DopplerTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<DopplerTask | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    tasksNotRun: 0,
    feedbacksToResolve: 0,
    completedTasks: 0,
    failedTasks: 0,
    runningTasks: 0,
    pendingTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const evalsData = await defaultDataSource.getAllEvals();
      setEvals(evalsData);
      
      // Load tasks from file storage
      const savedTasks = await loadTasks();
      setTasks(savedTasks);
      
      updateMetrics(evalsData, savedTasks);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateMetrics = (evalsData: EvalRow[], tasksData: DopplerTask[]) => {
    // Tasks that completed successfully (status 'completed' AND passed: true)
    const completedTasks = tasksData.filter(t => 
      t.status === 'completed' && t.result?.passed === true
    ).length;
    
    // Tasks that failed (status 'failed' OR status 'completed' with passed: false)
    const failedTasks = tasksData.filter(t => 
      t.status === 'failed' || (t.status === 'completed' && t.result?.passed === false)
    ).length;
    
    const runningTasks = tasksData.filter(t => t.status === 'running').length;
    const pendingTasks = tasksData.filter(t => t.status === 'pending').length;
    
    setMetrics({
      tasksNotRun: evalsData.length,
      feedbacksToResolve: failedTasks,
      completedTasks,
      failedTasks,
      runningTasks,
      pendingTasks,
    });
  };

  const handleRunOptimization = async (selectedEvals: EvalRow[]) => {
    setIsSubmitting(true);
    const newTasks: DopplerTask[] = [];

    try {
      for (const evalRow of selectedEvals) {
        const createTaskRequest = mapEvalToCreateTaskRequest(evalRow);
        const response = await createOptimizationTask(createTaskRequest);
        
        const newTask: DopplerTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          task_id: response.task_id,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
          original_eval_ids: [evalRow.id],
        };
        
        newTasks.push(newTask);
      }

      const updatedTasks = [...tasks, ...newTasks];
      setTasks(updatedTasks);
      
      // Save to file storage
      await saveTasks(updatedTasks);
      
      // Keep evals in state - they'll show as "pending/running" instead of disappearing
      updateMetrics(evals, updatedTasks);
      
      // Automatic polling removed - tasks will only update via manual refresh
      
    } catch (error) {
      console.error('Failed to submit optimization tasks:', error);
      alert(`Failed to submit optimization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshTaskResult = async (taskId: string) => {
    try {
      console.log(`🔄 Manual refresh for task ${taskId}...`);
      const result = await getOptimizationResult(taskId);
      console.log(`📊 Task ${taskId} status:`, result.status, result);
      
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.task_id === taskId) {
            console.log(`✅ Updating task ${taskId} from ${task.status} to ${result.status}`);
            return {
              ...task,
              status: result.status,
              updated_at: new Date(),
              result: result.result,
              error: result.error || undefined,
            };
          }
          return task;
        });
        
        // Save to file storage (async operation)
        saveTasks(updatedTasks).catch(error => {
          console.error('Failed to save tasks:', error);
        });
        updateMetrics(evals, updatedTasks);
        
        return updatedTasks;
      });
      
      console.log(`🏁 Manual refresh completed for task ${taskId} with status: ${result.status}`);
      
    } catch (error) {
      console.error(`❌ Failed to refresh task ${taskId}:`, error);
      
      // Mark task as failed on error
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.task_id === taskId) {
            return {
              ...task,
              status: 'failed' as const,
              updated_at: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
          return task;
        });
        
        // Save to file storage (async operation)
        saveTasks(updatedTasks).catch(error => {
          console.error('Failed to save tasks:', error);
        });
        updateMetrics(evals, updatedTasks);
        
        return updatedTasks;
      });
      
      // Re-throw the error so the UI can handle it
      throw error;
    }
  };

  const handleTaskClick = (task: DopplerTask) => {
    setSelectedTask(task);
  };

  const handleRefreshTask = async (taskId: string) => {
    await refreshTaskResult(taskId);
  };

  const handleRerunTask = async (oldTask: DopplerTask, evalData: EvalRow) => {
    try {
      // 1. Remove the old task from storage
      const updatedTasks = tasks.filter(task => task.task_id !== oldTask.task_id);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
      
      // 2. Create a new task using the same eval data
      const createTaskRequest = mapEvalToCreateTaskRequest(evalData);
      const response = await createOptimizationTask(createTaskRequest);
      
      const newTask: DopplerTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task_id: response.task_id,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
        original_eval_ids: [evalData.id],
      };
      
      // 3. Add the new task and save
      const finalTasks = [...updatedTasks, newTask];
      setTasks(finalTasks);
      await saveTasks(finalTasks);
      
      // 4. Update metrics
      updateMetrics(evals, finalTasks);
      
      console.log(`🔄 Task rerun: Removed ${oldTask.task_id}, created ${newTask.task_id}`);
      
    } catch (error) {
      console.error('Failed to rerun task:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  return (
    <div className="space-y-8">
      <MetricHeader 
        metrics={metrics} 
        runningTasks={tasks.filter(t => t.status === 'running')} 
        isLoading={isLoading} 
      />
      
                <UnifiedTable
            evals={evals}
            tasks={tasks}
            onRunOptimization={handleRunOptimization}
            onTaskClick={handleTaskClick}
            onRefreshTask={handleRefreshTask}
            onRerunTask={handleRerunTask}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
          />

      {selectedTask && (
        <>
          {selectedTask.status === 'failed' && !selectedTask.result && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-semibold text-red-600">❌ Task Failed</h2>
                  <Button variant="outline" onClick={() => setSelectedTask(null)}>
                    ✕ Close
                  </Button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Task ID</h3>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedTask.task_id}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Error Details</h3>
                      <div className="bg-red-50 border border-red-200 rounded p-4">
                        <p className="text-red-700">{selectedTask.error || 'Unknown error occurred'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Timeline</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>Created:</strong> {selectedTask.created_at.toLocaleString()}</p>
                        <p><strong>Last Updated:</strong> {selectedTask.updated_at.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Original Eval IDs</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.original_eval_ids.map(id => (
                          <span key={id} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => handleRefreshTask(selectedTask.task_id)}
                        variant="outline"
                        className="w-full"
                      >
                        🔄 Retry Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 