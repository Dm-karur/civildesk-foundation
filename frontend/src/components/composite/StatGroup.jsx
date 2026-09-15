import { cn } from '../../utils/cn';

export function StatGroup({ stats, className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border", className)}>
      {stats.map((stat, idx) => (
        <div key={idx} className={cn("flex flex-col pt-4 sm:pt-0 first:pt-0", idx > 0 ? "sm:pl-6" : "")}>
          <span className="text-sm font-medium text-text-secondary">{stat.label}</span>
          <span className="text-2xl font-semibold text-text-primary mt-1">{stat.value}</span>
          {stat.description && (
            <span className="text-sm text-text-muted mt-1">{stat.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}
