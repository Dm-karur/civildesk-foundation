import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-primary text-white border-transparent hover:bg-primary/90 focus-visible:ring-focus shadow-1',
  secondary: 'bg-white text-text-primary border-border hover:bg-surface-muted hover:border-border-hover focus-visible:ring-focus shadow-1',
  outline: 'bg-transparent text-text-primary border-border hover:bg-surface-muted focus-visible:ring-focus',
  ghost: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-muted hover:text-text-primary focus-visible:ring-focus',
  destructive: 'bg-error text-white border-transparent hover:bg-error/90 focus-visible:ring-error shadow-1',
};

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-sm',
  md: 'h-[42px] px-4 text-sm rounded-sm',
  lg: 'h-12 px-5 text-base rounded-md',
};

export const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false, 
  leftIcon, 
  rightIcon, 
  children, 
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className={cn(children ? "mr-2" : "", "flex items-center")}>{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className={cn(children ? "ml-2" : "", "flex items-center")}>{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
