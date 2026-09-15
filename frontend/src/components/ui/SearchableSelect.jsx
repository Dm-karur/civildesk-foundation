import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

const normalize = (value) => value === null || value === undefined ? '' : String(value);

export function SearchableSelect({ options = [], value = '', onChange, placeholder = 'Select option', leftIcon, disabled = false, error, hasError = false, className, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef(null);
  const searchInputRef = useRef(null);
  const listboxId = useId();
  
  const currentValue = normalize(value);
  const normalizedOptions = useMemo(() => options
    .filter((option) => option && option.value !== undefined && option.value !== null)
    .map((option) => ({ ...option, value: normalize(option.value) })), [options]);
    
  const selectedOption = normalizedOptions.find((option) => option.value === currentValue);
  
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return normalizedOptions;
    const lowerQ = searchQuery.toLowerCase();
    return normalizedOptions.filter(opt => opt.label.toLowerCase().includes(lowerQ));
  }, [normalizedOptions, searchQuery]);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const openAbove = below < 240 && rect.top > below;
    setPosition({
      left: rect.left,
      top: openAbove ? undefined : rect.bottom + 4,
      bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined,
      width: rect.width,
      maxHeight: Math.max(160, Math.min(300, openAbove ? rect.top - 12 : below - 12)),
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return undefined;
    }
    updatePosition();
    
    // Focus search input after opening
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 10);

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
        <div id={listboxId} data-select-listbox={listboxId} role="listbox" className="fixed z-[100] flex flex-col rounded-sm border border-border bg-surface shadow-level-2" style={position}>
          <div className="p-2 border-b border-border sticky top-0 bg-surface z-10 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-[12px] bg-surface-muted border border-border rounded focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div className="overflow-y-auto py-1 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-[12px] text-text-muted">No results found</div>
            ) : filteredOptions.map((option) => {
              const selected = option.value === currentValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  className={cn('flex w-full items-center justify-between px-3 py-2 text-left text-[13px]', selected ? 'bg-primary/10 text-primary font-semibold' : 'text-text-primary hover:bg-surface-subtle', option.disabled && 'cursor-not-allowed opacity-50')}
                  onClick={() => { onChange?.(option.value); setIsOpen(false); buttonRef.current?.focus(); }}
                >
                  <span className="truncate pr-4 font-medium">{option.label}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>, document.body,
      )}
    </div>
  );
}
