import { Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export function FilterBar({ 
  children, 
  activeFilterCount = 0, 
  onClearAll, 
  className 
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Desktop inline filters / Mobile stacked filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {children}
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />} className="sm:hidden">
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={onClearAll} leftIcon={<X className="w-4 h-4" />}>
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
