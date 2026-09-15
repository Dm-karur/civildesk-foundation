import { cn } from '../../utils/cn';

export function ActivityItem({
  icon,
  title,
  description,
  timestamp,
  action,
  className
}) {
  return (
    <div className={cn("relative flex gap-4", className)}>
      <div className="relative mt-1">
        <div className="w-8 h-8 rounded-full bg-surface-muted border border-border flex items-center justify-center text-text-secondary z-10 relative">
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{title}</p>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-text-muted whitespace-nowrap">{timestamp}</span>
            {action && <div>{action}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
