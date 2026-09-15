import { useState } from 'react';
import {
  Building2,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Package,
  Wallet,
  Camera,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';

const getStatusVariant = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('active') || s.includes('progress') || s.includes('construction')) return 'success';
  if (s.includes('hold') || s.includes('pending') || s.includes('planning') || s.includes('draft')) return 'warning';
  if (s.includes('complete')) return 'info';
  if (s.includes('closed') || s.includes('cancel')) return 'error';
  return 'neutral';
};

export function SiteDashboardHeader({
  site,
  onQuickAction,
}) {
  if (!site) return null;

  const code = site.site_code || 'SITE';
  const name = site.site_name || 'Construction Site';
  const client = site.client_name || 'Standard Client';
  const engineer = [site.site_engineer_first_name, site.site_engineer_last_name].filter(Boolean).join(' ') || site.contact_name || 'Unassigned Engineer';
  const status = site.site_status_name || site.status_name || 'Active';
  const location = [site.city, site.state_name].filter(Boolean).join(', ') || site.address_line1 || '';
  const progress = Number(site.progress_percentage || 0);

  const hasCoords = Boolean(site.latitude && site.longitude);
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${site.latitude},${site.longitude}` : null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Top Meta & Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {code}
            </span>
            <Badge variant={getStatusVariant(status)} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              {status}
            </Badge>
            {site.is_primary === 1 && (
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded border border-amber-500/20">
                Primary Operational Site
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {name}
          </h1>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-text-secondary mt-0.5">
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-text-muted" />
              <span className="font-medium text-text-primary">{client}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span>Incharge: <strong className="text-text-primary">{engineer}</strong></span>
            </div>
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-text-muted" />
                <span>{location}</span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5 text-[11px]"
                  >
                    (GPS <ExternalLink className="w-2.5 h-2.5" />)
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overall Progress Widget */}
        <div className="flex items-center gap-3 bg-surface-subtle border border-border/80 rounded-lg p-2.5 px-3 self-start lg:self-auto min-w-[200px]">
          <div className="flex flex-col flex-1">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Site Execution</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-primary">{progress}%</span>
              <span className="text-[11px] text-text-secondary font-medium">Completed</span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Quick Actions:
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            className="text-xs h-8 shadow-xs font-semibold"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onQuickAction('dpr')}
          >
            + Daily Report
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8 border-border bg-surface hover:bg-surface-subtle text-text-primary"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => onQuickAction('attendance')}
          >
            + Attendance
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8 border-border bg-surface hover:bg-surface-subtle text-text-primary"
            leftIcon={<Package className="w-3.5 h-3.5 text-sky-600" />}
            onClick={() => onQuickAction('indent')}
          >
            + Material Request
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8 border-border bg-surface hover:bg-surface-subtle text-text-primary"
            leftIcon={<Plus className="w-3.5 h-3.5 text-indigo-600" />}
            onClick={() => onQuickAction('grn')}
          >
            + Receive Material
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8 border-border bg-surface hover:bg-surface-subtle text-text-primary"
            leftIcon={<Wallet className="w-3.5 h-3.5 text-amber-600" />}
            onClick={() => onQuickAction('expense')}
          >
            + Expense
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8 border-border bg-surface hover:bg-surface-subtle text-text-primary"
            leftIcon={<Camera className="w-3.5 h-3.5 text-pink-600" />}
            onClick={() => onQuickAction('photo')}
          >
            + Site Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
