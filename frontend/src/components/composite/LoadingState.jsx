import { cn } from '../../utils/cn';

export function SkeletonCard({ className }) {
  return (
    <div className={cn("bg-surface border border-border rounded-lg p-6 animate-pulse", className)}>
      <div className="h-6 bg-surface-muted rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-surface-muted rounded w-full"></div>
        <div className="h-4 bg-surface-muted rounded w-5/6"></div>
        <div className="h-4 bg-surface-muted rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }) {
  return (
    <div className={cn("w-full animate-pulse", className)}>
      <div className="h-10 bg-surface-muted border-b border-border mb-2 rounded-t-lg"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border">
          <div className="h-4 bg-surface-muted rounded w-1/4"></div>
          <div className="h-4 bg-surface-muted rounded w-1/4"></div>
          <div className="h-4 bg-surface-muted rounded w-1/4"></div>
          <div className="h-4 bg-surface-muted rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3, className }) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-10 h-10 bg-surface-muted rounded-full flex-shrink-0"></div>
          <div className="flex-1 py-1 space-y-2">
            <div className="h-4 bg-surface-muted rounded w-3/4"></div>
            <div className="h-3 bg-surface-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
