import { cn } from '../../utils/cn';

const statusColors = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};

const sizes = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressIndicator({
  percentage = 0,
  label,
  value,
  status = 'primary',
  size = 'md',
  indeterminate = false,
  className
}) {
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const fillClass = statusColors[status] || statusColors.primary;

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {(label || value) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-text-primary">{label}</span>}
          {value && <span className="text-text-secondary">{value}</span>}
        </div>
      )}
      
      <div className={cn("w-full bg-border rounded-pill overflow-hidden", sizes[size])}>
        {indeterminate ? (
          <div className={cn("h-full w-1/2 rounded-pill animate-[progress_1.5s_ease-in-out_infinite]", fillClass)} />
        ) : (
          <div 
            className={cn("h-full rounded-pill transition-all duration-500 ease-in-out", fillClass)}
            style={{ width: `${safePercentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
