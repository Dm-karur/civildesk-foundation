import { cn } from '../../utils/cn';

export function FormSection({ title, description, children, className }) {
  return (
    <div className={cn('flex flex-col md:flex-row gap-6 md:gap-8 py-6 border-b border-border last:border-0', className)}>
      <div className="md:w-1/3 flex-shrink-0">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <div className="md:w-2/3 flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}
