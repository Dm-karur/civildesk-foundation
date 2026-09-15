import { cn } from '../../utils/cn';

export function EntityHeader({ 
  title, 
  entityId, 
  statusBadge, 
  metadata = [], 
  actions 
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 pb-6 border-b border-border">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-text-primary truncate">{title}</h1>
          {entityId && (
            <span className="text-sm font-medium text-text-secondary bg-surface-muted px-2 py-0.5 rounded-sm">
              {entityId}
            </span>
          )}
          {statusBadge && <div>{statusBadge}</div>}
        </div>
        
        {metadata.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary mt-3">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.icon && <span className="text-text-placeholder">{item.icon}</span>}
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 mt-2 md:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
