import { cn } from '../../utils/cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 sm:p-12", className)}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary mb-4 shadow-1">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">{description}</p>
      )}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        {action}
        {secondaryAction}
      </div>
    </div>
  );
}
