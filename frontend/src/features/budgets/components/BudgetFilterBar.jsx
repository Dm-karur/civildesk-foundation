import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function BudgetFilterBar({
  searchQuery = '',
  onSearchChange,
  onAdd,
  canCreate = false,
  filters,
  onFilterChange,
  projects = [],
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <div className="w-full sm:w-48">
          <Select
            className="text-xs h-8"
            options={[
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({
                value: String(p.id),
                label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}`,
              })),
            ]}
            value={filters.project_id || 'all'}
            onChange={(value) => onFilterChange('project_id', value)}
          />
        </div>

        <div className="w-full sm:w-36">
          <Select
            className="text-xs h-8"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'approved', label: 'Approved' },
              { value: 'review', label: 'Pending Approval' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'draft', label: 'Draft' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={filters.status}
            onChange={(value) => onFilterChange('status', value)}
          />
        </div>

        <div className="w-full sm:w-56">
          <SearchField
            placeholder="Search budget code, name, project..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            className="text-xs h-8 shadow-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAdd}
          >
            Add Budget
          </Button>
        )}
      </div>
    </div>
  );
}
