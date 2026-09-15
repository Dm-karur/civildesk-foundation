import { Filter, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function BranchFilterBar({ onAddClick }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="w-full sm:w-[220px]">
          <SearchField
            placeholder="Search branch by name or code..."
            onChange={() => { }}
          />
        </div>

        <Select
          className="w-full sm:w-[150px]"
          options={[{ value: 'all', label: 'All Companies' }]}
          value="all"
          onChange={() => { }}
        />

        <Select
          className="w-full sm:w-[130px]"
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
          value="all"
          onChange={() => { }}
        />
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto justify-end mt-2 lg:mt-0">
        <Button variant="outline" className="h-9 px-3 text-[13px]" leftIcon={<Filter className="w-3.5 h-3.5" />}>
          Filter
        </Button>
        <Button variant="primary" className="h-9 px-3 text-[13px]" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onAddClick}>
          Add Branch
        </Button>
      </div>
    </div>
  );
}
