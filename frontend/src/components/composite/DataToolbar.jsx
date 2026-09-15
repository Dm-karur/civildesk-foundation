import { Download, Columns } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export function DataToolbar({ 
  search, 
  filters, 
  actions, 
  bulkActions,
  showExport = true,
  showColumns = true,
  onExport,
  onColumnsConfig,
  className 
}) {
  return (
    <div className={cn("flex flex-col gap-4 mb-4", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left side: Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {search && <div className="w-full sm:w-72">{search}</div>}
          {filters}
        </div>
        
        {/* Right side: Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {bulkActions && (
            <div className="flex items-center gap-2 mr-2 pr-4 border-r border-border">
              {bulkActions}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {showColumns && (
              <Button variant="outline" onClick={onColumnsConfig} className="px-2.5 sm:px-3">
                <Columns className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            )}
            {showExport && (
              <Button variant="outline" onClick={onExport} className="px-2.5 sm:px-3">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
