import { useId, cloneElement, isValidElement } from 'react';
import { cn } from '../../utils/cn';

export function FormField({
  label,
  required,
  error,
  helperText,
  children,
  className,
  htmlFor,
  id: externalId
}) {
  const internalId = useId();
  const id = externalId || htmlFor || internalId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const childWithProps = isValidElement(children) 
    ? cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': cn(error && errorId, helperText && !error && helperId) || undefined,
        // Also pass error state down in case the primitive needs to style its border
        error: !!error
      })
    : children;

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      
      {childWithProps}
      
      {error ? (
        <p id={errorId} className="text-sm text-error">{error}</p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
