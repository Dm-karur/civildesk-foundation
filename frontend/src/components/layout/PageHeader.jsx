import { ChevronRight } from 'lucide-react';

export function PageHeader({ title, description, actions, breadcrumbs }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-2 mb-4">
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-text-muted mb-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-text-primary transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-text-primary font-medium">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              </div>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold text-text-primary truncate">{title}</h1>
        {description && (
          <p className="text-text-secondary mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
