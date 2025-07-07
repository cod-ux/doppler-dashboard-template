'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { EvalRow, DopplerTask } from '@/lib/types';
import { OptimizationResultsViewer } from '@/components/OptimizationResultsViewer';

interface UnifiedRow {
  id: string;
  evalData: EvalRow;
  task?: DopplerTask;
  status: 'no-task' | DopplerTask['status'];
}

interface ReviewDetailsModalProps {
  selectedRow: UnifiedRow | null;
  onClose: () => void;
}

export function ReviewDetailsModal({ 
  selectedRow, 
  onClose
}: ReviewDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'eval' | 'results'>('eval');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!selectedRow || !mounted) return null;

  const hasResults = selectedRow.task?.result;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden z-[9999]">
        <div className="h-full flex flex-col max-h-[90vh]">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Review Details</h2>
              <div className="flex gap-1">
              <Button
                  variant={activeTab === 'results' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('results')}
                  disabled={!hasResults}
                >
                  Results
                </Button>
                <Button
                  variant={activeTab === 'eval' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('eval')}
                >
                  Eval Data
                </Button>
                
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕ Close
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {activeTab === 'eval' ? (
              <div>
                <h3 className="font-semibold text-lg mb-3">Evaluation Data</h3>
                <div className="p-4 bg-gray-900 rounded-lg text-green-400 text-xs overflow-x-auto min-h-[60vh]">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedRow.evalData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div>
                {hasResults ? (
                  <OptimizationResultsViewer result={selectedRow.task!.result!} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No results available yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Results will appear here once the task is completed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 