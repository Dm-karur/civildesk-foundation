import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(({
  className,
  error,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <div className="absolute left-3 text-text-placeholder flex items-center justify-center pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'flex w-full h-9 px-3 py-2 bg-surface text-text-primary text-[13px] border border-border rounded-sm transition-all shadow-sm',
          'placeholder:text-text-placeholder focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-muted',
          error && 'border-error focus:border-error focus:ring-error',
          leftIcon && 'pl-9',
          rightIcon && 'pr-9',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 text-text-placeholder flex items-center justify-center pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
