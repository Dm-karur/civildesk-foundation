import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

export const Checkbox = forwardRef(({ className, id, label, ...props }, ref) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            "peer h-4 w-4 appearance-none rounded-[4px] border border-border bg-surface shrink-0 cursor-pointer",
            "checked:bg-primary checked:border-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            className
          )}
          {...props}
        />
        <Check className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </div>
      {label && (
        <label
          htmlFor={id}
          className="text-[14px] font-medium text-text-primary cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
    </div>
  );
});
Checkbox.displayName = 'Checkbox';
