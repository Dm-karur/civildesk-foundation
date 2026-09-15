import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

export function SearchField({
  value,
  onChange,
  onClear,
  onFilter,
  placeholder = 'Search...',
  disabled = false,
  loading = false,
  shortcut,
  className
}) {
  return (
    <div className={cn("relative flex items-center w-full max-w-md", className)}>
      <Input
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        placeholder={placeholder}
        leftIcon={<Search className="w-4 h-4" />}
        rightIcon={
          ((value && onClear && !loading) || loading || (shortcut && !value && !loading) || onFilter) ? (
            <div className="flex items-center gap-1">
              {value && onClear && !loading && (
                <button 
                  onClick={onClear}
                  className="p-1 rounded-sm text-text-placeholder hover:text-text-primary hover:bg-surface-muted transition-colors pointer-events-auto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5 text-text-placeholder mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {shortcut && !value && !loading && (
                <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium text-text-muted border border-border rounded-sm bg-surface-muted mr-1">
                  {shortcut}
                </span>
              )}
              {onFilter && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button 
                    onClick={onFilter}
                    className="p-1 mr-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors pointer-events-auto"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ) : null
        }
      />
    </div>
  );
}
