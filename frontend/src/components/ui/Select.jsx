import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

const normalize = (value) => value === null || value === undefined ? '' : String(value);

export function Select({ options = [], value = '', onChange, placeholder = 'Select option', leftIcon, disabled = false, error, hasError = false, className, name, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const listboxId = useId();
  const currentValue = normalize(value);

  const normalizedOptions = useMemo(() => {
    let rawOptions = options;
    if ((!rawOptions || rawOptions.length === 0) && children) {
      rawOptions = React.Children.toArray(children)
        .filter((child) => child && (child.type === 'option' || child.props))
        .map((child) => ({
          value: child.props?.value,
          label: child.props?.children,
          disabled: child.props?.disabled,
        }));
    }
    return (rawOptions || [])
      .filter((option) => option && option.value !== undefined && option.value !== null)
      .map((option) => ({ ...option, value: normalize(option.value) }));
  }, [options, children]);

  const selectedOption = normalizedOptions.find((option) => option.value === currentValue);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const openAbove = below < 240 && rect.top > below;
    setPosition({
      left: rect.left,
      top: openAbove ? undefined : rect.bottom + 4,
      bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined,
      width: Math.max(130, rect.width),
      maxHeight: Math.max(120, Math.min(300, openAbove ? rect.top - 12 : below - 12)),
    });
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();
    const close = (event) => {
      if (!buttonRef.current?.contains(event.target) && !event.target.closest?.(`[data-select-listbox="${listboxId}"]`)) setIsOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, listboxId]);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => { if (event.key === 'Escape') setIsOpen(false); }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-sm border bg-surface px-3 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20',
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border',
          error || hasError ? 'border-error focus:ring-error/20' : '',
          disabled ? 'cursor-not-allowed bg-surface-muted opacity-50' : 'cursor-pointer hover:border-border-strong',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leftIcon && <span className="flex shrink-0 items-center justify-center text-text-secondary [&>svg]:h-4 [&>svg]:w-4">{leftIcon}</span>}
          <span className={cn('truncate text-[13px] font-medium', selectedOption ? 'text-text-primary' : 'text-text-placeholder')}>
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 text-text-secondary transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && position && createPortal(
        <div id={listboxId} data-select-listbox={listboxId} role="listbox" className="fixed z-[100] overflow-y-auto rounded-sm border border-border bg-surface py-1 shadow-level-2" style={position}>
          {normalizedOptions.length === 0 ? <div className="px-3 py-2 text-[13px] text-text-muted">No options available</div> : normalizedOptions.map((option) => {
            const selected = option.value === currentValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                className={cn('flex w-full items-center justify-between px-3 py-2 text-left text-[13px]', selected ? 'bg-primary/10 text-primary font-semibold' : 'text-text-primary hover:bg-surface-subtle', option.disabled && 'cursor-not-allowed opacity-50')}
                onClick={() => {
                  if (onChange) {
                    const syntheticEvent = { target: { name, value: option.value } };
                    try {
                      onChange(option.value, syntheticEvent);
                    } catch (err) {
                      if (err instanceof TypeError && (err.message.includes('target') || err.message.includes('value'))) {
                        onChange(syntheticEvent);
                      } else {
                        throw err;
                      }
                    }
                  }
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                <span className="truncate pr-4 font-medium">{option.label}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>, document.body,
      )}
    </div>
  );
}
