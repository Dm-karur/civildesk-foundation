import { cn } from '../../utils/cn';

export function ActivityFeed({
  children,
  loading = false,
  empty = false,
  emptyState,
  className
}) {
  if (loading) {
    return (
      <div className={cn("animate-pulse flex flex-col gap-6", className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-muted flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-surface-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={cn("py-8", className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Connecting line */}
      <div className="absolute top-4 bottom-0 left-4 w-px bg-border -translate-x-1/2 z-0"></div>
      
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
}
