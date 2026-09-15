import { cn } from '../../utils/cn';

export function DataTableContainer({
  toolbar,
  children,
  pagination,
  loading = false,
  empty = false,
  error = false,
  emptyState,
  errorState,
  className
}) {
  return (
    <div className={cn("flex flex-col w-full min-w-0", className)}>
      {toolbar && <div className="mb-4">{toolbar}</div>}

      <div className="bg-surface border border-border rounded-lg shadow-1 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px] relative">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface z-10 p-6">
              {errorState}
            </div>
          ) : empty ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface z-10 p-6">
              {emptyState}
            </div>
          ) : (
            <>
              {children}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-10">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </>
          )}
        </div>

        {pagination && !error && !empty && (
          <div className="border-t border-border px-4 py-3 bg-surface">
            {pagination}
          </div>
        )}
      </div>
    </div>
  );
}
