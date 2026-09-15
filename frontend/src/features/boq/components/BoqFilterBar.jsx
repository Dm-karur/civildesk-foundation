import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function BoqFilterBar({
  searchQuery = '',
  onSearchChange,
  onAdd,
  canCreate = false,
  filters,
  onFilterChange,
  sites = [],
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Site Filter */}
        <div className="w-full sm:w-52">
          <Select
            className="text-xs h-8"
            options={[
              { value: 'all', label: 'All Sites' },
              ...sites.map((s) => ({
                value: String(s.id),
                label: `${s.site_name || s.name} (${s.site_code})`,
              })),
            ]}
            value={filters.site_id || 'all'}
            onChange={(value) => onFilterChange('site_id', value)}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-36">
          <Select
            className="text-xs h-8"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={filters.status || 'all'}
            onChange={(value) => onFilterChange('status', value)}
          />
        </div>

        {/* Progress Filter */}
        <div className="w-full sm:w-36">
          <Select
            className="text-xs h-8"
            options={[
              { value: 'all', label: 'All Progress' },
              { value: '0-25', label: '0% – 25%' },
              { value: '26-50', label: '26% – 50%' },
              { value: '51-75', label: '51% – 75%' },
              { value: '76-100', label: '76% – 100%' },
            ]}
            value={filters.progress || 'all'}
            onChange={(value) => onFilterChange('progress', value)}
          />
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <SearchField
            placeholder="Search BOQ code, name, site, client..."
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
            className="text-xs h-8 shadow-2xs font-medium"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAdd}
          >
            Create BOQ
          </Button>
        )}
      </div>
    </div>
  );
}
