import { Link, Outlet } from 'react-router-dom';
import { SlidersHorizontal, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useModules } from '../../features/settings/context/ModulesContext';
import { useAuth } from '../../features/auth/context/AuthContext';

export function RequireModule({ module: moduleCode, moduleName, children }) {
  const { isModuleEnabled, loading } = useModules();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const enabled = isModuleEnabled(moduleCode);

  if (!enabled) {
    const isSuperAdmin = Boolean(user?.is_super_admin);

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-5">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          Module Deactivated
        </span>

        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          {moduleName || moduleCode} is Currently Disabled
        </h1>

        <p className="mt-2 text-sm text-text-muted max-w-md">
          This system module has been deactivated for your company by the system administrator. Features and navigation associated with this module are temporarily turned off.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {isSuperAdmin && (
            <Link
              to="/administration/modules"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Manage Modules
            </Link>
          )}
        </div>
      </div>
    );
  }

  return children ?? <Outlet />;
}
