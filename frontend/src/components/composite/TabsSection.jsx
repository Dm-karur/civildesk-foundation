import { cn } from '../../utils/cn';

export function TabsSection({ tabs, activeTabId, onTabChange, className }) {
  return (
    <div className={cn("w-full border-b border-border", className)}>
      <nav className="flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
              {tab.badge && (
                <span className={cn(
                  "ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isActive ? "bg-primary/10 text-primary" : "bg-surface-muted text-text-secondary"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
