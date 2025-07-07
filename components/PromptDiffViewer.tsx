'use client';

import { diffLines } from 'diff';

interface PromptDiffViewerProps {
  originalPrompt: string;
  finalPrompt: string;
  className?: string;
}

export function PromptDiffViewer({ originalPrompt, finalPrompt, className = '' }: PromptDiffViewerProps) {
  const diff = diffLines(originalPrompt, finalPrompt);

  return (
    <div className={`font-mono text-xs border rounded bg-white ${className}`}>
      <div className="h-96 overflow-y-auto">
        {diff.map((part, index) => {
          const lines = part.value.split('\n');
          
          return lines.map((line, lineIndex) => {
            // Skip empty lines at the end
            if (lineIndex === lines.length - 1 && line === '') {
              return null;
            }
            
            let bgColor = '';
            let textColor = '';
            let prefix = '';
            
            if (part.added) {
              bgColor = 'bg-green-50';
              textColor = 'text-green-800';
              prefix = '+';
            } else if (part.removed) {
              bgColor = 'bg-red-50';
              textColor = 'text-red-800';
              prefix = '-';
            } else {
              bgColor = 'bg-gray-50';
              textColor = 'text-gray-700';
              prefix = ' ';
            }
            
            return (
              <div
                key={`${index}-${lineIndex}`}
                className={`px-4 py-1 border-l-2 ${bgColor} ${textColor} ${
                  part.added ? 'border-l-green-400' : 
                  part.removed ? 'border-l-red-400' : 
                  'border-l-gray-300'
                }`}
              >
                <span className="select-none text-gray-400 mr-2 w-4 inline-block">
                  {prefix}
                </span>
                <span className="whitespace-pre-wrap">{line || ' '}</span>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
