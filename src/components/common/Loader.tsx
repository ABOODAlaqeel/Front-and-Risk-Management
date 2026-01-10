import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Loader: React.FC<LoaderProps> = ({ className, size = 'md', text }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader size="lg" text={text} />
    </div>
  );
};

export const FullPageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Loader size="lg" text={text} />
    </div>
  );
};

export default Loader;
