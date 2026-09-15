import { Plus, Filter, RefreshCw, Building2, User, Search, List, Map as MapIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function SitesFilterBar({
  searchQuery = '',
  onSearchChange,
  onAdd,
  canCreate = false,
  filters,
  onFilterChange,
  masters = {},
  clients = [],
  engineers = [],
  viewMode = 'list',
  onViewModeChange,
}) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    filters.client_id !== 'all' ||
    filters.status_id !== 'all' ||
    filters.site_engineer_id !== 'all' ||
    Boolean(filters.date_from) ||
    Boolean(filters.date_to);

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Search */}
        <div className="w-full sm:w-56">
          <SearchField
            placeholder="Search site name, code, client..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        {/* Client Filter */}
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: 'all', label: 'All Clients' },
              ...clients.map((c) => ({
                value: String(c.id),
                label: c.client_name || c.name || `Client #${c.id}`,
              })),
            ]}
            value={filters.client_id || 'all'}
            onChange={(val) => onFilterChange('client_id', val)}
            className="text-xs h-8"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-36">
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              ...(masters.site_statuses ?? []).map((item) => ({
                value: String(item.id),
                label: item.status_name || item.name,
              })),
            ]}
            value={filters.status_id || 'all'}
            onChange={(value) => onFilterChange('status_id', value)}
            className="text-xs h-8"
          />
        </div>

        {/* Site Engineer Filter */}
        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: 'all', label: 'All Engineers' },
              ...engineers.map((u) => ({
                value: String(u.id),
                label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.employee_code || `User #${u.id}`,
              })),
            ]}
            value={filters.site_engineer_id || 'all'}
            onChange={(value) => onFilterChange('site_engineer_id', value)}
            className="text-xs h-8"
          />
        </div>

        {/* Date Filter Inputs */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            title="Filter Start Date"
            value={filters.date_from || ''}
            onChange={(e) => onFilterChange('date_from', e.target.value)}
            className="h-8 px-2 text-[11px] rounded border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
          />
          <span className="text-text-muted text-[10px]">to</span>
          <input
            type="date"
            title="Filter Completion Date"
            value={filters.date_to || ''}
            onChange={(e) => onFilterChange('date_to', e.target.value)}
            className="h-8 px-2 text-[11px] rounded border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-text-secondary hover:text-error"
            onClick={() => {
              onSearchChange('');
              onFilterChange('client_id', 'all');
              onFilterChange('status_id', 'all');
              onFilterChange('site_engineer_id', 'all');
              onFilterChange('date_from', '');
              onFilterChange('date_to', '');
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 justify-end shrink-0">
        {onViewModeChange && (
          <div className="inline-flex items-center p-0.5 bg-surface-subtle border border-border rounded-lg h-8">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all h-7 ${
                viewMode === 'list'
                  ? 'bg-surface text-primary shadow-xs border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Switch to List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List View</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('map')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all h-7 ${
                viewMode === 'map'
                  ? 'bg-surface text-primary shadow-xs border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Switch to Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map View</span>
            </button>
          </div>
        )}

        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            className="text-xs h-8 shadow-xs font-semibold"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAdd}
          >
            Create Site
          </Button>
        )}
      </div>
    </div>
  );
}
