'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvalRow } from '@/lib/types';

interface EvalTableProps {
  evals: EvalRow[];
  onRunOptimization: (selectedEvals: EvalRow[]) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export function EvalTable({ 
  evals, 
  onRunOptimization, 
  isLoading = false, 
  isSubmitting = false 
}: EvalTableProps) {
  const [selectedEvals, setSelectedEvals] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedEvals.size === evals.length) {
      setSelectedEvals(new Set());
    } else {
      setSelectedEvals(new Set(evals.map(evalRow => evalRow.id)));
    }
  };

  const handleSelectEval = (evalId: string) => {
    const newSelected = new Set(selectedEvals);
    if (newSelected.has(evalId)) {
      newSelected.delete(evalId);
    } else {
      newSelected.add(evalId);
    }
    setSelectedEvals(newSelected);
  };

  const handleRunOptimization = () => {
    const selectedEvalRows = evals.filter(evalRow => selectedEvals.has(evalRow.id));
    onRunOptimization(selectedEvalRows);
    setSelectedEvals(new Set()); // Clear selection after submission
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eval Results</CardTitle>
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

  if (evals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eval Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No eval results found</p>
            <p className="text-sm text-muted-foreground">
              Make sure your data source is configured correctly and returns eval data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all unique column keys from the evals
  const columns = Array.from(
    new Set(evals.flatMap(evalRow => Object.keys(evalRow)))
  ).filter(key => key !== 'id'); // Exclude ID from display columns

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Eval Results ({evals.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={isSubmitting}
          >
            {selectedEvals.size === evals.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            onClick={handleRunOptimization}
            disabled={selectedEvals.size === 0 || isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting 
              ? 'Submitting...' 
              : `Run Optimization (${selectedEvals.size})`
            }
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 w-12">
                  <input
                    type="checkbox"
                    checked={selectedEvals.size === evals.length && evals.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-2 font-medium">ID</th>
                {columns.slice(0, 5).map(column => (
                  <th key={column} className="text-left p-2 font-medium">
                    {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
                {columns.length > 5 && (
                  <th className="text-left p-2 font-medium">
                    +{columns.length - 5} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {evals.map((evalRow) => (
                <tr 
                  key={evalRow.id} 
                  className={`border-b hover:bg-muted/50 ${
                    selectedEvals.has(evalRow.id) ? 'bg-muted' : ''
                  }`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedEvals.has(evalRow.id)}
                      onChange={() => handleSelectEval(evalRow.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-2 font-mono text-sm">{evalRow.id}</td>
                  {columns.slice(0, 5).map(column => (
                    <td key={column} className="p-2 max-w-xs">
                      <div className="truncate" title={String(evalRow[column] || '')}>
                        {String(evalRow[column] || '').substring(0, 100)}
                        {String(evalRow[column] || '').length > 100 && '...'}
                      </div>
                    </td>
                  ))}
                  {columns.length > 5 && (
                    <td className="p-2 text-sm text-muted-foreground">
                      <details className="cursor-pointer">
                        <summary>View all fields</summary>
                        <div className="mt-2 space-y-1 text-xs">
                          {columns.slice(5).map(column => (
                            <div key={column}>
                              <strong>{column}:</strong> {String(evalRow[column] || '')}
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {selectedEvals.size > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>{selectedEvals.size}</strong> eval{selectedEvals.size !== 1 ? 's' : ''} selected for optimization
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 