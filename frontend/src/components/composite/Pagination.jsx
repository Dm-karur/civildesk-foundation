import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  totalResults,
  totalItems,
  pageSize,
  itemsPerPage,
  onPageChange,
  disabled = false
}) {
  const count = totalResults !== undefined ? totalResults : (totalItems !== undefined ? totalItems : 0);
  const size = pageSize || itemsPerPage || 10;
  const startResult = count === 0 ? 0 : (currentPage - 1) * size + 1;
  const endResult = Math.min(currentPage * size, count);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-text-secondary">
        Showing <span className="font-medium text-text-primary">{startResult}</span> to <span className="font-medium text-text-primary">{endResult}</span> of <span className="font-medium text-text-primary">{count}</span> results
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        <div className="hidden sm:flex items-center">
          {/* Simplified pagination logic for typical composite. 
              A fully featured one would show page numbers with ellipsis. */}
          <span className="text-sm text-text-primary font-medium px-4">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Next</span>
        </Button>
      </div>
    </div>
  );
}
