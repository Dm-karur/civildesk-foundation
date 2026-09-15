import { Calendar } from 'lucide-react';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

const DATE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom Range...', value: 'custom' },
];

export function DateRangeSelector({ value, onChange, className }) {
  return (
    <div className={cn("w-full sm:w-[180px]", className)}>
      <Select 
        options={DATE_OPTIONS}
        value={value} 
        onChange={onChange} 
        leftIcon={<Calendar />}
      />
    </div>
  );
}
