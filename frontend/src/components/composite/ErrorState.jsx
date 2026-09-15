import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this data.",
  action,
  className
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error mb-4 shadow-1">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
