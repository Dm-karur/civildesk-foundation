import { cn } from '../../utils/cn';

const variants = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-surface-muted text-text-secondary border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md', 
  className,
  dot = false,
  ...props 
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium border rounded-pill whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <svg className="mr-1.5 h-2 w-2 fill-current opacity-70" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {children}
    </span>
  );
}
