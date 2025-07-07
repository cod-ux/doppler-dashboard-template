'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskResult } from '@/lib/types';
import { PromptDiffViewer } from './PromptDiffViewer';

interface OptimizationResultsViewerProps {
  result: TaskResult;
}

export function OptimizationResultsViewer({ result }: OptimizationResultsViewerProps) {
  const [showPromptDiff, setShowPromptDiff] = useState(false);
  const [expandedIteration, setExpandedIteration] = useState<number | null>(null);
  const [showFullTask, setShowFullTask] = useState(false);

  const toggleIteration = (iterationNumber: number) => {
    setExpandedIteration(expandedIteration === iterationNumber ? null : iterationNumber);
  };



  const renderCompactPromptComparison = () => {
    const originalPrompt = result.task.og_prompt;
    const finalPrompt = result.final_prompt;

    if (showPromptDiff) {
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Added</span>
            </div>
          </div>
          <PromptDiffViewer 
            originalPrompt={originalPrompt} 
            finalPrompt={finalPrompt}
            className="h-96"
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Final Optimized Prompt</div>
        <div className="p-3 bg-gray-50 border rounded text-xs h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono">{finalPrompt}</pre>
        </div>
      </div>
    );
  };

  const renderCompactConversation = (conversation: Array<Record<string, unknown>>) => {
    return (
      <div className="space-y-2">
        {conversation.map((message, index) => {
          const msg = message as { role?: string; content?: string };
          
          // Check if message has expected role + content structure
          const hasExpectedStructure = msg.role && msg.content && 
            typeof msg.role === 'string' && typeof msg.content === 'string';
          
          if (hasExpectedStructure) {
            return (
              <div
                key={index}
                className={`p-2 rounded text-xs border-l-2 ${
                  msg.role === 'user'
                    ? 'bg-teal-50 border-l-teal-400'
                    : 'bg-purple-50 border-l-purple-400'
                }`}
              >
                <div className={`font-medium mb-1 ${
                  msg.role === 'user' ? 'text-teal-700' : 'text-purple-700'
                }`}>
                  {msg.role}
                </div>
                <div className="text-gray-800 line-clamp-3">{msg.content}</div>
              </div>
            );
          }
          
          // Fall back to JSON structure if it doesn't fit expected format
          return (
            <div
              key={index}
              className="p-3 rounded text-xs border-l-2 bg-gradient-to-r from-teal-50 to-purple-50 border-l-teal-400"
            >
              <div className="font-medium text-teal-700 mb-2">Message {index + 1} (Raw JSON)</div>
              <pre className="text-gray-800 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                {JSON.stringify(message, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    );
  };



  return (
    <div className="space-y-4">
      {/* Task Overview Header */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Task Summary</h2>
                <Badge 
                  variant={result.passed ? 'secondary' : 'destructive'} 
                  className={`${result.passed ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  {result.passed ? '✅ Passed' : '❌ Failed'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {result.iterations.length} iteration{result.iterations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-sm text-gray-700 max-w-2xl">
                {typeof result.task.task === 'string' ? result.task.task : JSON.stringify(result.task.task)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Task & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                Task Details
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullTask(!showFullTask)}
                className="text-xs h-6"
              >
                {showFullTask ? 'Collapse' : 'Expand'}
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0 space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <pre className={`text-xs whitespace-pre-wrap font-mono ${showFullTask ? '' : 'line-clamp-3'}`}>
                {JSON.stringify(result.task.task, null, 2)}
              </pre>
            </div>
            
            {/* Available Tools - Compact */}
            {result.task.tool_schema && result.task.tool_schema.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Available Tools ({result.task.tool_schema.length})</div>
                <div className="flex flex-wrap gap-1">
                  {result.task.tool_schema.map((tool, index) => {
                    const toolData = tool as { name?: string, description?: string };
                    return (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-gray-100" 
                        title="Click to expand"
                        onClick={() => {
                            // const badge = document.getElementById(`tool-badge-${index}`);
                          const description = document.getElementById(`tool-description-${index}`);
                          if (description) {
                            description.style.display = description.style.display === 'none' ? 'block' : 'none';
                          }
                        }}
                      >
                        <div id={`tool-badge-${index}`}>
                          {toolData.name || `Tool ${index + 1}`}
                          <div 
                            id={`tool-description-${index}`}
                            className="mt-1 text-gray-600 text-xs whitespace-normal"
                            style={{ display: 'none' }}
                          >
                            {toolData.description || 'No description available'}
                          </div>
                        </div>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {result.task.user_persona && (
              <div>
                <div className="text-xs font-medium text-blue-600 mb-1">User Persona</div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  {result.task.user_persona}
                </div>
              </div>
            )}
            
            {result.task.test_criteria && (
              <div>
                <div className="text-xs font-medium text-yellow-600 mb-1">Test Criteria</div>
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  {result.task.test_criteria}
                </div>
              </div>
            )}
            
            {result.task.provided_variables && Object.keys(result.task.provided_variables).length > 0 && (
              <div>
                <div className="text-xs font-medium text-purple-600 mb-1">Variables</div>
                <div className="space-y-1">
                  {Object.entries(result.task.provided_variables).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                      <span className="font-medium">{key}:</span>
                      <span className="text-gray-600 truncate max-w-32">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prompt Optimization - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              Improved Prompt
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPromptDiff(!showPromptDiff)}
              className="text-xs h-6"
            >
              {showPromptDiff ? 'Hide Diff' : 'Show Diff'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {renderCompactPromptComparison()}
        </CardContent>
      </Card>

             {/* Iterations - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            Iterations ({result.iterations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {result.iterations.map((iteration) => (
              <Card key={iteration.iteration_number} className="border border-gray-200">
                <button
                  onClick={() => toggleIteration(iteration.iteration_number)}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                        {iteration.iteration_number}
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${iteration.test_result.passed ? 'border-green-300 text-green-700 bg-green-50' : 'border-red-300 text-red-700 bg-red-50'}`}
                      >
                        {iteration.test_result.passed ? 'Passed' : 'Failed'}
                      </Badge>
                      <div className="text-xs text-gray-600 truncate max-w-md">
                        {iteration.test_result.reason}
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {expandedIteration === iteration.iteration_number ? '▼' : '▶'}
                    </div>
                  </div>
                </button>
                
                {expandedIteration === iteration.iteration_number && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    {/* Test Result */}
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2">Test Result</div>
                      <div className={`p-3 rounded text-xs border ${
                        iteration.test_result.passed 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        {iteration.test_result.reason}
                      </div>
                    </div>

                    {/* Conversation - Compact */}
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2">Test Conversation</div>
                      <div className="max-h-48 overflow-y-auto border rounded p-2 bg-white">
                        {renderCompactConversation(iteration.test_result.conversation)}
                      </div>
                    </div>

                    {/* Prompt Changes */}
                    {iteration.prompt_suggestions && iteration.prompt_suggestions.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">Prompt Changes</div>
                        <div className="space-y-2">
                          {iteration.prompt_suggestions.map((change, index) => (
                            <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Lines {change.line_range.start}-{change.line_range.end}
                              </div>
                              <div className="text-xs text-gray-600">{change.instruction}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 