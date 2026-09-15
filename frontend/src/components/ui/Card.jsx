import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Card = forwardRef(({ className, children, interactive = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-surface border border-border rounded-lg p-4 sm:p-6 shadow-1',
        interactive && 'hover:shadow-2 hover:border-border-hover transition-all cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
