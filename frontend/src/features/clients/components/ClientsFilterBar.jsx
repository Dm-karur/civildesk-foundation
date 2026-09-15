import { Filter, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function ClientsFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  industryFilter,
  onIndustryChange,
  onAddClient
}) {
  const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const INDUSTRY_OPTIONS = [
    { value: 'all', label: 'All Industries' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'real estate', label: 'Real Estate' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'government', label: 'Government' }
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="w-full sm:w-[260px]">
          <SearchField
            className="max-w-none"
            placeholder="Search code, name, GSTIN..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select
          className="w-full sm:w-[130px]"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => onStatusChange(val)}
        />

        <Select
          className="w-full sm:w-[150px]"
          options={INDUSTRY_OPTIONS}
          value={industryFilter}
          onChange={(val) => onIndustryChange(val)}
        />
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto justify-end mt-1 lg:mt-0">
        <Button variant="outline" className="h-9 px-3 text-[13px]" leftIcon={<Filter className="w-3.5 h-3.5" />}>
          Filter
        </Button>
        <Button
          variant="primary"
          className="h-9 px-3 text-[13px]"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onAddClient}
        >
          Add Client
        </Button>
      </div>
    </div>
  );
}
