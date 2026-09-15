import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, Bell, Building, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Select } from '../ui/Select';
import { useAuth } from '../../features/auth/context/AuthContext';
import { sitesApi } from '../../api/apiservice';

const DEFAULT_SITE_OPTIONS = [
  { label: 'All Sites (Company)', value: 'all' },
];

// Route segment to friendly title mapping
const PATH_MAP = {
  dashboard: 'Dashboard',
  dashboards: 'Dashboards',
  sites: 'Sites',
  map: 'Map View',
  new: 'Register Site',
  edit: 'Edit Site',
  zones: 'Work Zones',
  'work-locations': 'Work Locations',
  team: 'Site Team',
  instructions: 'Site Instructions',
  documents: 'Site Documents',
  clients: 'Clients',
  boq: 'BOQ & Budget',
  budgets: 'Budgets',
  planning: 'Project Planning',
  labour: 'Labour & Attendance',
  inventory: 'Materials & Inventory',
  procurement: 'Procurement',
  operations: 'Daily Site Operations',
  finance: 'Finance & Accounts',
  reports: 'Reports & Analytics',
  masters: 'System Masters',
  settings: 'Settings',
  users: 'Users',
  roles: 'Roles & Permissions',
  branches: 'Branches',
  companies: 'Companies',
};

function formatSegment(segment) {
  if (!segment) return '';
  if (PATH_MAP[segment.toLowerCase()]) {
    return PATH_MAP[segment.toLowerCase()];
  }
  // Check if it looks like an ID
  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }
  // Title case formatted string
  return segment
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function Header({ selectedSite, onSiteChange, onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSiteOpen, setMobileSiteOpen] = useState(false);
  const [siteOptions, setSiteOptions] = useState([
    { label: 'All Sites (Company)', value: 'all' },
  ]);

  // Load real active sites dynamically from API
  useEffect(() => {
    let active = true;
    sitesApi.list()
      .then((res) => {
        if (!active) return;
        const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const opts = [
            { label: 'All Sites (Company)', value: 'all' },
            ...list.map((s) => ({
              label: `${s.site_name} (${s.site_code})`,
              value: String(s.id),
            })),
          ];
          setSiteOptions(opts);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Compute breadcrumbs dynamically from current pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  // Always start with KS Construction / Home or Dashboard
  breadcrumbs.push({ label: 'KS Construction', to: '/dashboard' });

  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
    breadcrumbs.push({ label: 'Dashboard' });
  } else {
    let accumulatedPath = '';
    pathSegments.forEach((seg, idx) => {
      accumulatedPath += `/${seg}`;
      const isLast = idx === pathSegments.length - 1;
      const label = formatSegment(seg);
      breadcrumbs.push({
        label,
        to: isLast ? undefined : accumulatedPath,
      });
    });
  }

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-sm transition-colors lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Global Header Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm overflow-x-auto whitespace-nowrap min-w-0 py-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="text-text-secondary hover:text-primary font-medium transition-colors hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-text-primary font-semibold' : 'text-text-secondary font-medium'}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0 opacity-70" />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Desktop */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-48 lg:w-64 pl-9 pr-3 rounded-sm border border-border bg-background text-sm focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus transition-all"
          />
        </div>

        {/* Site Selector Desktop */}
        <div className="hidden sm:block w-[200px] lg:w-[260px]">
          <Select 
            options={siteOptions}
            value={selectedSite}
            onChange={onSiteChange}
            leftIcon={<Building />}
            dropdownWidth="w-[280px]"
          />
        </div>

        {/* Mobile Icons */}
        <div className="flex sm:hidden">
          <button 
            onClick={() => { setMobileSiteOpen(!mobileSiteOpen); setMobileSearchOpen(false); }}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-sm transition-colors relative"
          >
            <Building className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex md:hidden">
          <button 
            onClick={() => { setMobileSearchOpen(!mobileSearchOpen); setMobileSiteOpen(false); }}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-sm transition-colors relative"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-sm transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border border-surface"></span>
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 p-4 bg-surface border-b border-border z-40 shadow-sm animate-in slide-in-from-top-2 md:hidden">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder" />
              <input
                type="text"
                placeholder="Search KS Construction..."
                className="h-10 w-full pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus"
                autoFocus
              />
            </div>
            <button onClick={() => setMobileSearchOpen(false)} className="p-2 text-text-secondary hover:bg-surface-muted rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Site Selector Overlay */}
      {mobileSiteOpen && (
        <div className="absolute top-16 left-0 right-0 p-4 bg-surface border-b border-border z-40 shadow-sm animate-in slide-in-from-top-2 sm:hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-text-secondary uppercase">Select Site</span>
              <button onClick={() => setMobileSiteOpen(false)} className="p-1 text-text-secondary hover:bg-surface-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Select 
              options={siteOptions}
              value={selectedSite}
              onChange={(v) => { onSiteChange(v); setMobileSiteOpen(false); }}
              leftIcon={<Building />}
            />
          </div>
        </div>
      )}
    </header>
  );
}
