'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvalRow, DopplerTask } from '@/lib/types';
import { ReviewDetailsModal } from '@/components/ReviewDetailsModal';
import { toast } from 'sonner';

interface UnifiedTableProps {
  evals: EvalRow[];
  tasks: DopplerTask[];
  onRunOptimization: (selectedEvals: EvalRow[]) => void;
  onTaskClick: (task: DopplerTask) => void;
  onRefreshTask: (taskId: string) => void;
  onRerunTask: (task: DopplerTask, evalData: EvalRow) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

type FilterStatus = 'all' | 'running' | 'completed' | 'failed' | 'no-task';

interface UnifiedRow {
  id: string;
  evalData: EvalRow;
  task?: DopplerTask;
  status: 'no-task' | DopplerTask['status'];
}

export function UnifiedTable({ 
  evals, 
  tasks, 
  onRunOptimization, 
  onRefreshTask, 
  onRerunTask,
  isLoading = false, 
  isSubmitting = false 
}: UnifiedTableProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedRowForReview, setSelectedRowForReview] = useState<UnifiedRow | null>(null);
  const [refreshingTasks, setRefreshingTasks] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Create unified rows by combining evals with their associated tasks
  const unifiedRows: UnifiedRow[] = evals.map(evalData => {
    const associatedTask = tasks.find(task => 
      task.original_eval_ids.includes(evalData.id)
    );
    
    return {
      id: evalData.id,
      evalData,
      task: associatedTask,
      status: associatedTask?.status || 'no-task'
    };
  });

  // Filter rows based on status
  const filteredRows = unifiedRows.filter(row => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'running') return row.status === 'running' || row.status === 'pending';
    return row.status === filterStatus;
  });

  // Get status counts for filter tabs
  const statusCounts = {
    all: unifiedRows.length,
    running: unifiedRows.filter(row => row.status === 'running' || row.status === 'pending').length,
    completed: unifiedRows.filter(row => row.status === 'completed').length,
    failed: unifiedRows.filter(row => row.status === 'failed').length,
    'no-task': unifiedRows.filter(row => row.status === 'no-task').length,
  };

  const handleRefreshTask = async (taskId: string) => {
    setRefreshingTasks(prev => new Set(Array.from(prev).concat(taskId)));
    try {
      await onRefreshTask(taskId);
    } catch (error) {
      console.error(`Failed to refresh task ${taskId}:`, error);
      alert(`Failed to refresh task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleRunTask = (evalData: EvalRow) => {
    onRunOptimization([evalData]);
  };

  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    const selectableRows = filteredRows.filter(row => 
      row.status === 'no-task' || row.status === 'completed' || row.status === 'failed'
    );
    if (selectedRows.size === selectableRows.length && selectableRows.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(selectableRows.map(row => row.id)));
    }
  };

  const handleRunSelected = async () => {
    const selectedRowsData = filteredRows.filter(row => 
      selectedRows.has(row.id) && 
      (row.status === 'no-task' || row.status === 'completed' || row.status === 'failed')
    );
    
    if (selectedRowsData.length === 0) return;

    try {
      // Separate new tasks from rerun tasks
      const newTasks = selectedRowsData.filter(row => row.status === 'no-task');
      const rerunTasks = selectedRowsData.filter(row => row.status === 'completed' || row.status === 'failed');

      // Run new tasks in batch
      if (newTasks.length > 0) {
        const newEvals = newTasks.map(row => row.evalData);
        onRunOptimization(newEvals);
      }

      // Rerun completed/failed tasks individually (since onRerunTask expects individual tasks)
      for (const row of rerunTasks) {
        if (row.task) {
          await onRerunTask(row.task, row.evalData);
        }
      }

      setSelectedRows(new Set()); // Clear selection after running
      
      if (rerunTasks.length > 0) {
        toast.success(`🔄 ${rerunTasks.length} task${rerunTasks.length !== 1 ? 's' : ''} rerun initiated!`, {
          duration: 3000,
          position: 'top-right',
        });
      }
      
    } catch (error) {
      console.error('Failed to run selected tasks:', error);
      toast.error('Failed to run some selected tasks', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  const getSelectableRowsCount = () => {
    return filteredRows.filter(row => 
      row.status === 'no-task' || row.status === 'completed' || row.status === 'failed'
    ).length;
  };

  const getSelectedRunnableCount = () => {
    return filteredRows.filter(row => 
      selectedRows.has(row.id) && 
      (row.status === 'no-task' || row.status === 'completed' || row.status === 'failed')
    ).length;
  };

  const getRefreshableTasksCount = () => {
    return unifiedRows.filter(row => 
      row.task && (row.status === 'running' || row.status === 'pending' || row.status === 'failed')
    ).length;
  };

  const handleRefreshAll = async () => {
    const refreshableTasks = unifiedRows.filter(row => 
      row.task && (row.status === 'running' || row.status === 'pending' || row.status === 'failed')
    );

    if (refreshableTasks.length === 0) return;

    // Refresh all refreshable tasks in parallel
    const refreshPromises = refreshableTasks.map(async (row) => {
      if (row.task) {
        try {
          await handleRefreshTask(row.task.task_id);
        } catch (error) {
          console.error(`Failed to refresh task ${row.task.task_id} in bulk refresh:`, error);
          // Error is already handled in handleRefreshTask
        }
      }
    });

    await Promise.allSettled(refreshPromises);
  };

  const handleReviewClick = (row: UnifiedRow) => {
    setSelectedRowForReview(row);
  };

  const handleCloseReview = () => {
    setSelectedRowForReview(null);
  };

  const getStatusColor = (status: UnifiedRow['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'no-task':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: UnifiedRow['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🚀';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      case 'no-task':
        return '⚪';
      default:
        return '❓';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleRerunTask = async (task: DopplerTask, evalData: EvalRow) => {
    try {
      await onRerunTask(task, evalData);
      toast.success('🔄 Task rerun initiated!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Failed to rerun task:', error);
      toast.error('Failed to rerun task', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Feedback Tracker</CardTitle>
          
          {/* Status Filter Tabs and Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: 'All' },
                { key: 'no-task', label: 'Queued' },
                { key: 'running', label: 'Running' },
                { key: 'completed', label: 'Success' },
                { key: 'failed', label: 'Failed' },
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filterStatus === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(key)}
                  className="relative"
                >
                  {label}
                  {statusCounts[key] > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-current/20">
                      {statusCounts[key]}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {getSelectableRowsCount() > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isSubmitting}
                  >
                    {selectedRows.size === getSelectableRowsCount() && getSelectableRowsCount() > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRunSelected}
                    disabled={getSelectedRunnableCount() === 0 || isSubmitting}
                    className="min-w-[140px]"
                  >
                    {isSubmitting 
                      ? 'Processing...' 
                      : `▶ Process Selected (${getSelectedRunnableCount()})`
                    }
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={refreshingTasks.size > 0 || getRefreshableTasksCount() === 0}
              >
                {refreshingTasks.size > 0 ? '🔄 Refreshing...' : `🔄 Refresh All (${getRefreshableTasksCount()})`}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredRows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No items found for the selected filter
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 w-12">
                      {getSelectableRowsCount() > 0 && (
                        <input
                          type="checkbox"
                          checked={selectedRows.size === getSelectableRowsCount() && getSelectableRowsCount() > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      )}
                    </th>
                    <th className="text-left p-3 font-medium">Feedback</th>
                    <th className="text-left p-3 font-medium">Agent</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Success Criteria</th>
                    <th className="text-left p-3 font-medium">Created At</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`border-b hover:bg-muted/50 ${
                        selectedRows.has(row.id) ? 'bg-muted' : ''
                      }`}
                    >
                      <td className="p-3">
                        {(row.status === 'no-task' || row.status === 'completed' || row.status === 'failed') && (
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate" title={String(row.evalData.task_description || '')}>
                          {truncateText(String(row.evalData.task_description || ''), 50)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {row.evalData.id}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {String(row.evalData.model_name || 'Unknown')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm" role="img" aria-label={row.status}>
                            {getStatusIcon(row.status)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}
                          >
                            {row.status === 'no-task' ? 'Queued' : row.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate text-sm" title={String(row.evalData.success_criteria || '')}>
                          {truncateText(String(row.evalData.success_criteria || 'No criteria specified'), 60)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {row.task?.created_at ? 
                            new Date(row.task.created_at).toLocaleDateString() : 
                            'N/A'
                          }
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewClick(row)}
                          >
                            📋 Review
                          </Button>
                          
                          {row.status === 'no-task' ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRunTask(row.evalData)}
                              disabled={isSubmitting}
                              className="h-8 w-20 flex items-center justify-center"
                            >
                              ▶ Run
                            </Button>
                          ) : row.status === 'completed' ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                if (row.task) {
                                  handleRerunTask(row.task, row.evalData);
                                }
                              }}
                              className="h-8 w-20 flex items-center justify-center"
                            >
                              🔄 Rerun
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (row.task) {
                                  handleRefreshTask(row.task.task_id);
                                }
                              }}
                              disabled={row.task ? refreshingTasks.has(row.task.task_id) : true}
                            >
                              {row.task && refreshingTasks.has(row.task.task_id) ? 
                                '...' : 
                                '🔄'
                              }
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {selectedRows.size > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>{getSelectedRunnableCount()}</strong> task{getSelectedRunnableCount() !== 1 ? 's' : ''} selected for optimization
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ReviewDetailsModal
        selectedRow={selectedRowForReview}
        onClose={handleCloseReview}
      />
    </>
  );
} 