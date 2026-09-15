import { Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

const MODULE_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'BOQ & Project Budget', label: 'BOQ & Project Budget' },
  { value: 'Materials & Inventory', label: 'Materials & Inventory' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Daily Site Operations', label: 'Daily Site Operations' },
  { value: 'Finance & Cost Control', label: 'Finance & Cost Control' },
  { value: 'Subcontract Management', label: 'Subcontract Management' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const SCOPE_OPTIONS = [
  { value: 'all', label: 'All Scopes' },
  { value: 'Company', label: 'Company' },
  { value: 'Project', label: 'Project' },
  { value: 'Branch', label: 'Branch' },
];

export function WorkflowsFilterBar({
  searchQuery,
  onSearchChange,
  moduleFilter,
  onModuleChange,
  statusFilter,
  onStatusChange,
  scopeFilter,
  onScopeChange,
  onReset
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3 border-b border-border mb-4 md:mb-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
        <div className="w-full sm:w-64 flex-shrink-0">
          <Input 
            placeholder="Search workflows..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-1 w-full sm:w-auto">
          <Select 
            options={MODULE_OPTIONS}
            value={moduleFilter}
            onChange={onModuleChange}
            className="w-full sm:w-[180px] flex-shrink-0"
          />
          <Select 
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={onStatusChange}
            className="w-full sm:w-[130px] flex-shrink-0"
          />
          <Select 
            options={SCOPE_OPTIONS}
            value={scopeFilter}
            onChange={onScopeChange}
            className="w-full sm:w-[130px] flex-shrink-0"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
        <Button 
          variant="outline" 
          onClick={onReset}
          className="h-9 gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}
