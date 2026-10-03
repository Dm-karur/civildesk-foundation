import { useState, useMemo } from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  RotateCw,
  SlidersHorizontal,
  LayoutDashboard,
  Briefcase,
  MapPin,
  Calculator,
  CalendarRange,
  Users,
  UserCheck,
  Package,
  ShoppingCart,
  ClipboardList,
  HardHat,
  ReceiptIndianRupee,
  Landmark,
  BarChart3,
  MessageSquare,
  MonitorSmartphone,
  FolderCog,
  Settings,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { useModules } from '../context/ModulesContext';
import { toast } from '../../../components/composite/Toast';
import { clsx } from 'clsx';

const ICON_COMPONENTS = {
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  'map-pin': MapPin,
  calculator: Calculator,
  'calendar-range': CalendarRange,
  users: Users,
  'user-check': UserCheck,
  package: Package,
  'shopping-cart': ShoppingCart,
  'clipboard-list': ClipboardList,
  'hard-hat': HardHat,
  'receipt-indian-rupee': ReceiptIndianRupee,
  landmark: Landmark,
  'bar-chart-3': BarChart3,
  'message-square': MessageSquare,
  'monitor-smartphone': MonitorSmartphone,
  'folder-cog': FolderCog,
  settings: Settings,
};

const CATEGORIES = {
  CORE: ['DASHBOARD', 'ADMINISTRATION', 'MASTERS'],
  FIELD: ['SITES_LOCATIONS', 'DAILY_SITE_OPERATIONS', 'SUBCONTRACT_MANAGEMENT'],
  PLANNING: ['PROJECTS', 'BOQ_BUDGET', 'PROJECT_PLANNING'],
  WORKFORCE: ['LABOUR_ATTENDANCE', 'PRIMARY_HRM'],
  SUPPLY: ['MATERIALS_INVENTORY', 'PROCUREMENT'],
  FINANCE: ['CLIENT_BILLING', 'FINANCE_COST_CONTROL'],
  INSIGHTS: ['REPORTS_ANALYTICS', 'COMMUNICATION', 'CLIENT_PORTAL'],
};

const CATEGORY_NAMES = {
  ALL: 'All Categories',
  FIELD: 'Field & Sites',
  PLANNING: 'Engineering & BOQ',
  WORKFORCE: 'Labour & HRM',
  SUPPLY: 'Materials & Procurement',
  FINANCE: 'Finance & Billing',
  INSIGHTS: 'Analytics & Portals',
  CORE: 'Core System',
};

function getCategory(code) {
  const c = String(code).toUpperCase();
  for (const [cat, items] of Object.entries(CATEGORIES)) {
    if (items.includes(c)) return cat;
  }
  return 'CORE';
}

export function ModuleSettingsPage() {
  const { modules, loading, toggleModule, refresh, bulkUpdate } = useModules();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ENABLED' | 'DISABLED'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [updatingCode, setUpdatingCode] = useState(null);

  const stats = useMemo(() => {
    const total = modules.length;
    const enabled = modules.filter((m) => m.is_enabled).length;
    const disabled = total - enabled;
    const locked = modules.filter((m) => m.is_locked).length;
    return { total, enabled, disabled, locked };
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const name = String(mod.item_name || '').toLowerCase();
      const code = String(mod.item_code || '').toLowerCase();
      const desc = String(mod.description || '').toLowerCase();
      const q = search.toLowerCase().trim();

      if (q && !name.includes(q) && !code.includes(q) && !desc.includes(q)) {
        return false;
      }

      if (statusFilter === 'ENABLED' && !mod.is_enabled) return false;
      if (statusFilter === 'DISABLED' && mod.is_enabled) return false;

      if (categoryFilter !== 'ALL') {
        const cat = getCategory(mod.item_code);
        if (cat !== categoryFilter) return false;
      }

      return true;
    });
  }, [modules, search, statusFilter, categoryFilter]);

  const handleToggle = async (mod) => {
    if (mod.is_locked) {
      toast.warning(`${mod.item_name} is a core module and cannot be disabled.`);
      return;
    }

    const nextState = !mod.is_enabled;
    setUpdatingCode(mod.item_code);

    try {
      await toggleModule(mod.item_code || mod.id, nextState);
      if (nextState) {
        toast.success(`"${mod.item_name}" has been enabled. Menu and Site Details updated.`);
      } else {
        toast.info(`"${mod.item_name}" has been disabled. Hidden from Menu and Site Details.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ${mod.item_name}. Please try again.`);
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleEnableAll = async () => {
    try {
      const updates = modules.map((m) => ({ id: m.id, item_code: m.item_code, is_enabled: true }));
      await bulkUpdate(updates);
      toast.success('All system modules have been enabled.');
    } catch (err) {
      toast.error('Failed to enable all modules.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Module Management"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Administration', to: '/administration/users' },
          { label: 'Module Settings' },
        ]}
      />

      <div className="flex flex-col gap-5 pb-10">
        {/* Banner / Info */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Organization Module Access Control
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Enable or disable operational modules for your company. Disabled modules are immediately hidden from the 
                <strong> Sidebar Menu</strong>, the <strong>Site Details ("detail site") tabs</strong>, and direct URLs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => refresh()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <RotateCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleEnableAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enable All
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
            <div className="text-xs text-text-muted">Total Modules</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary">{stats.total}</span>
              <span className="text-xs text-text-secondary">Available</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 shadow-sm">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Modules</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.enabled}</span>
              <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Visible in Menu</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 shadow-sm">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Disabled Modules</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.disabled}</span>
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80">Hidden Everywhere</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
            <div className="text-xs text-text-muted">Protected Core</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary">{stats.locked}</span>
              <span className="text-xs text-text-secondary">Locked</span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border shadow-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search modules by name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-background rounded-lg border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  statusFilter === 'ALL' ? 'bg-surface text-text-primary shadow-xs font-semibold' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ENABLED')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  statusFilter === 'ENABLED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Enabled
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DISABLED')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  statusFilter === 'DISABLED' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Disabled
              </button>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => {
            const IconComponent = ICON_COMPONENTS[mod.icon_key] || Boxes;
            const isUpdating = updatingCode === mod.item_code;
            const categoryKey = getCategory(mod.item_code);
            const categoryLabel = CATEGORY_NAMES[categoryKey] || 'General';

            return (
              <div
                key={mod.id || mod.item_code}
                className={clsx(
                  'relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 shadow-sm',
                  mod.is_enabled
                    ? 'border-border bg-surface hover:border-border-hover'
                    : 'border-border/60 bg-surface/50 opacity-80'
                )}
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors',
                          mod.is_enabled
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-text-muted'
                        )}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-text-primary truncate" title={mod.item_name}>
                            {mod.item_name}
                          </h3>
                          {mod.is_locked && (
                            <span title="Core system module cannot be disabled" className="text-text-muted">
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                          {mod.item_code}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center">
                      {mod.is_locked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={mod.is_enabled}
                          disabled={isUpdating}
                          onClick={() => handleToggle(mod)}
                          className={clsx(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                            mod.is_enabled ? 'bg-primary' : 'bg-muted-hover',
                            isUpdating && 'opacity-60 cursor-wait'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={clsx(
                              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                              mod.is_enabled ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-text-secondary leading-relaxed line-clamp-2" title={mod.description}>
                    {mod.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-text-muted font-medium">
                    {categoryLabel}
                  </span>

                  <div className="flex items-center gap-2">
                    {mod.sub_items_count > 0 && (
                      <span className="text-text-muted">
                        {mod.sub_items_count} features
                      </span>
                    )}

                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px]',
                        mod.is_enabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {mod.is_enabled ? (
                        <>
                          <Eye className="h-3 w-3" /> Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Hidden
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <SlidersHorizontal className="mx-auto h-8 w-8 text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No modules found</h3>
            <p className="text-xs text-text-muted mt-1">
              Try adjusting your search query or filter settings.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
