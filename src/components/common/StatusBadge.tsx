import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'green' | 'yellow' | 'red' | string;
  className?: string;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, children }) => {
  const statusClasses = {
    green: 'kri-green',
    yellow: 'kri-yellow',
    red: 'kri-red',
    Critical: 'status-critical',
    High: 'status-high',
    Medium: 'status-medium',
    Low: 'status-low',
    Open: 'bg-primary/10 text-primary border-primary/30',
    Closed: 'bg-muted text-muted-foreground border-border',
    Monitoring: 'bg-chart-2/10 text-chart-2 border-chart-2/30',
  };

  const statusClass = statusClasses[status as keyof typeof statusClasses] || 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusClass,
        className
      )}
    >
      {children || status}
    </span>
  );
};

export default StatusBadge;
