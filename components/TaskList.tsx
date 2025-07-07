'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DopplerTask } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface TaskListProps {
  tasks: DopplerTask[];
  onTaskClick: (task: DopplerTask) => void;
  onRefreshTask: (taskId: string) => void;
  isLoading?: boolean;
}

export function TaskList({ 
  tasks, 
  onTaskClick, 
  onRefreshTask, 
  isLoading = false 
}: TaskListProps) {
  const [refreshingTasks, setRefreshingTasks] = useState<Set<string>>(new Set());

  const handleRefreshTask = async (taskId: string) => {
    setRefreshingTasks(prev => new Set(Array.from(prev).concat(taskId)));
    try {
      await onRefreshTask(taskId);
    } catch (error) {
      console.error(`Failed to refresh task ${taskId}:`, error);
      // Show user-friendly error message
      alert(`Failed to refresh task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: DopplerTask['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: DopplerTask['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🚀';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Optimization Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Optimization Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No tasks submitted yet</p>
            <p className="text-sm text-muted-foreground">
              Select some evals and run optimization to see tasks here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Optimization Tasks ({tasks.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              // Refresh all tasks
              const refreshPromises = tasks.map(async (task) => {
                try {
                  await handleRefreshTask(task.task_id);
                } catch (error) {
                  console.error(`Failed to refresh task ${task.task_id} in bulk refresh:`, error);
                  // Error is already handled in handleRefreshTask
                }
              });
              
              await Promise.allSettled(refreshPromises);
            }}
            disabled={tasks.length === 0}
          >
            🔄 Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg" role="img" aria-label={task.status}>
                    {getStatusIcon(task.status)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                  >
                    {task.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {task.task_id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(task.status === 'running' || task.status === 'pending') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshTask(task.task_id)}
                      disabled={refreshingTasks.has(task.task_id)}
                    >
                      {refreshingTasks.has(task.task_id) ? '...' : '🔄'}
                    </Button>
                  )}
                  {task.status === 'completed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshTask(task.task_id)}
                        disabled={refreshingTasks.has(task.task_id)}
                        title="Refresh task status"
                      >
                        {refreshingTasks.has(task.task_id) ? '...' : '🔄'}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onTaskClick(task)}
                      >
                        View Results
                      </Button>
                    </>
                  )}
                  {task.status === 'failed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshTask(task.task_id)}
                        disabled={refreshingTasks.has(task.task_id)}
                        title="Refresh task status"
                      >
                        {refreshingTasks.has(task.task_id) ? '...' : '🔄'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTaskClick(task)}
                      >
                        View Error
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex items-center justify-between">
                  <span>
                    Submitted {formatDistanceToNow(task.created_at, { addSuffix: true })}
                  </span>
                  <span>
                    {task.original_eval_ids.length} eval{task.original_eval_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last updated: {formatDistanceToNow(task.updated_at, { addSuffix: true })}
                </div>
              </div>

              {task.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {task.error}
                </div>
              )}

              {task.result && (
                <div className="mt-2 text-sm">
                  <div className="flex items-center gap-4">
                    <span className={task.result.passed ? 'text-green-600' : 'text-orange-600'}>
                      {task.result.passed ? '✅ Optimization succeeded' : '⚠️ Optimization had issues'}
                    </span>
                    <span className="text-muted-foreground">
                      {task.result.iterations.length} iteration{task.result.iterations.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {task.result.task_summary && (
                    <p className="mt-1 text-muted-foreground line-clamp-2">
                      {task.result.task_summary}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 