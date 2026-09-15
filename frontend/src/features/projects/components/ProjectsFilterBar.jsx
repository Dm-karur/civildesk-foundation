import { Filter, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function ProjectsFilterBar({ searchQuery = '', onSearchChange, onAddProject, canCreate = false, filters, onFilterChange, clients = [], masters = {} }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="w-full sm:w-[200px]">
          <SearchField 
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        
        <Select
          className="w-full sm:w-[120px]"
          options={[{ value: 'all', label: 'All Clients' }, ...clients.map((item) => ({ value: item.id, label: item.client_name }))]}
          value={filters.client_id}
          onChange={(value) => onFilterChange('client_id', value)}
        />
        
        <Select
          className="w-full sm:w-[120px]"
          options={[{ value: 'all', label: 'All Status' }, ...(masters.project_statuses ?? []).map((item) => ({ value: item.id, label: item.name }))]}
          value={filters.project_status_id}
          onChange={(value) => onFilterChange('project_status_id', value)}
        />
        
        <Select
          className="w-full sm:w-[120px]"
          options={[{ value: 'all', label: 'All Types' }, ...(masters.project_types ?? []).map((item) => ({ value: item.id, label: item.name }))]}
          value={filters.project_type_id}
          onChange={(value) => onFilterChange('project_type_id', value)}
        />
        
        <Select
          className="w-full sm:w-[140px]"
          options={[{ value: 'all', label: 'All Years' }, ...(masters.financial_years ?? []).map((item) => ({ value: item.id, label: item.name }))]}
          value={filters.financial_year_id}
          onChange={(value) => onFilterChange('financial_year_id', value)}
        />
      </div>
      
      <div className="flex items-center gap-2 w-full lg:w-auto justify-end mt-2 lg:mt-0">
        <Button variant="outline" className="h-9 px-3 text-[13px]" leftIcon={<Filter className="w-3.5 h-3.5" />}>
          Filter
        </Button>
        {canCreate && (
          <Button
            variant="primary"
            className="h-9 px-3 text-[13px]"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAddProject}
          >
            Add Project
          </Button>
        )}
      </div>
    </div>
  );
}
