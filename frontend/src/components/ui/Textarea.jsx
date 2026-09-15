import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Textarea = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full min-h-[80px] px-3 py-2 bg-surface text-text-primary text-[13px] border border-border rounded-sm transition-all shadow-sm resize-y',
        'placeholder:text-text-placeholder focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-muted',
        error && 'border-error focus:border-error focus:ring-error',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
