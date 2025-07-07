'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DashboardMetrics, DopplerTask } from '@/lib/types';

interface MetricHeaderProps {
  metrics: DashboardMetrics;
  runningTasks: DopplerTask[];
  isLoading?: boolean;
}

export function MetricHeader({ metrics, isLoading = false }: MetricHeaderProps) {
  const metricCards = [
    {
      title: 'Evals to Fix',
      value: metrics.tasksNotRun - metrics.completedTasks - metrics.failedTasks - metrics.runningTasks - metrics.pendingTasks,
      icon: '🔧',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Completed Tasks',
      value: metrics.completedTasks,
      icon: '✓',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'Running Tasks',
      value: metrics.runningTasks + metrics.pendingTasks,
      icon: '→',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Failed Tasks',
      value: metrics.failedTasks,
      icon: '✕',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      title: 'Time Saved',
      value: (() => {
        const totalMinutes = metrics.completedTasks * 15;
        if (totalMinutes >= 1440) { // 24 hours = 1440 minutes
          const days = Math.floor(totalMinutes / 1440);
          const remainingMinutes = totalMinutes % 1440;
          const hours = Math.floor(remainingMinutes / 60);
          if (hours > 0) {
            return `${days}d ${hours}h`;
          }
          return `${days}d`;
        } else if (totalMinutes >= 60) {
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${totalMinutes} mins`;
      })(),
      icon: '⏱',
      color: 'text-slate-600',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse border-slate-200 flex-1 bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-slate-200 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded w-10 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-14"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6">
      {metricCards.map((metric) => (
        <Card 
          key={metric.title} 
          className={`
            ${metric.bgColor} 
            ${metric.borderColor} 
            border 
            shadow-sm 
            hover:shadow-md 
            transition-shadow 
            duration-200 
            flex-1
          `}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`
                w-6 h-6 
                flex items-center justify-center 
                text-sm
                ${metric.color}
                flex-shrink-0
              `}>
                {metric.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`
                  text-lg 
                  font-semibold 
                  ${metric.color} 
                  leading-tight
                `}>
                  {metric.value}
                </div>
                <div className="
                  text-xs 
                  text-slate-500 
                  font-medium
                  leading-tight
                  mt-0.5
                ">
                  {metric.title}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 