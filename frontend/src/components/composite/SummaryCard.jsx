import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

export function SummaryCard({ title, action, items = [], className }) {
  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              {item.label}
            </span>
            <span className="text-sm text-text-primary">
              {item.value || <span className="text-text-placeholder">-</span>}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
