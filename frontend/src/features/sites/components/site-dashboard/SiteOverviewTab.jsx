import {
  Users,
  CheckCircle2,
  TrendingUp,
  Package,
  Layers,
  Wallet,
  AlertTriangle,
  DollarSign,
  Calendar,
  MapPin,
  Camera,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { KpiCard } from '../../../../components/composite/KpiCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export function SiteOverviewTab({
  site,
  dashboardData,
  onNavigateTab,
  onQuickAction,
}) {
  const kpis = dashboardData?.kpis || {};
  const recentDprs = dashboardData?.recent_dprs || [];
  const recentPhotos = dashboardData?.recent_photos || [];
  const recentIssues = dashboardData?.recent_issues || [];

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── 1. TODAY'S OPERATIONAL SUMMARY ─────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Today's Field Summary ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
            </h3>
          </div>
          <span className="text-[11px] text-text-muted">Live field updates</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Today's Labour
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-text-primary">{kpis.today_labour ?? 0}</span>
              <span className="text-[10px] text-text-muted">Workers</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">On Site Today</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Attendance %
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-emerald-600">{kpis.today_attendance_percentage ?? 0}%</span>
            </div>
            <span className="text-[10px] text-text-muted">Muster marked</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Today Progress
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-primary">{kpis.today_work_progress ?? 0}%</span>
            </div>
            <span className="text-[10px] text-text-muted">Day's output</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Materials In
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-sky-600">{kpis.materials_received_today ?? 0}</span>
              <span className="text-[10px] text-text-muted">Qty</span>
            </div>
            <span className="text-[10px] text-text-muted">Received</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Materials Used
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-amber-600">{kpis.materials_consumed_today ?? 0}</span>
              <span className="text-[10px] text-text-muted">Qty</span>
            </div>
            <span className="text-[10px] text-text-muted">Consumed</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Today Expense
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-mono text-text-primary">
                {formatCurrency(kpis.today_expenses || 0)}
              </span>
            </div>
            <span className="text-[10px] text-text-muted">Vouchers</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
              Open Issues
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg font-bold font-mono ${(kpis.open_issues || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {kpis.open_issues ?? 0}
              </span>
              <span className="text-[10px] text-text-muted">Alerts</span>
            </div>
            <span className="text-[10px] text-text-muted">Requires action</span>
          </div>
        </div>
      </div>

      {/* ─── 2. OVERALL SITE FINANCIALS & BUDGET ─────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Overall Site Financials & Budget Control
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-primary"
            onClick={() => onNavigateTab('boq')}
          >
            View BOQ Detail <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              BOQ Budget
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-text-primary block">
              {formatCurrency(kpis.boq_budget || site.contract_value || 0)}
            </span>
            <span className="text-[10px] text-text-muted">Contract Baseline</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Actual Cost
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-rose-600 block">
              {formatCurrency(kpis.actual_cost || 0)}
            </span>
            <span className="text-[10px] text-text-muted">Total Incurred</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Remaining Budget
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 block">
              {formatCurrency(kpis.remaining_budget || kpis.boq_budget || site.contract_value || 0)}
            </span>
            <span className="text-[10px] text-text-muted">Available Balance</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Labour Cost
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-text-primary block">
              {formatCurrency(kpis.labour_cost || 0)}
            </span>
            <span className="text-[10px] text-text-muted">Muster & Overtime</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Material Cost
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-text-primary block">
              {formatCurrency(kpis.material_cost || 0)}
            </span>
            <span className="text-[10px] text-text-muted">Direct Procurement</span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Expense Cost
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-text-primary block">
              {formatCurrency(kpis.expense_cost || 0)}
            </span>
            <span className="text-[10px] text-text-muted">Petty Cash & Site Bills</span>
          </div>
        </div>
      </div>

      {/* ─── 3. RECENT ACTIVITY & SITE CARDS ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Recent Daily Site Reports */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Recent Daily Reports
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] h-6 p-1 text-primary"
              onClick={() => onNavigateTab('daily-reports')}
            >
              All DPRs
            </Button>
          </div>

          {recentDprs.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs flex flex-col items-center gap-2">
              <span>No daily progress reports recorded yet.</span>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs h-7"
                onClick={() => onQuickAction('dpr')}
              >
                + Create First DPR
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentDprs.map((dpr) => (
                <div key={dpr.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-text-primary block">{dpr.report_no || `DPR #${dpr.id}`}</span>
                    <span className="text-text-muted text-[11px]">{dpr.report_date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-primary block">
                      {dpr.actual_progress_percentage || 0}%
                    </span>
                    <span className="text-[10px] text-text-muted">Manpower: {dpr.total_manpower || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Column: Active Issues */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Site Issues & Blockers
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] h-6 p-1 text-primary"
              onClick={() => onNavigateTab('issues')}
            >
              All Issues
            </Button>
          </div>

          {recentIssues.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <span>No open site blockers or issues.</span>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="py-2.5 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary truncate">{issue.issue_title || issue.title || `Issue #${issue.id}`}</span>
                    <Badge variant={issue.priority_name === 'Critical' || issue.priority_name === 'High' ? 'error' : 'warning'} className="text-[9px]">
                      {issue.priority_name || 'Normal'}
                    </Badge>
                  </div>
                  <span className="text-text-secondary text-[11px] line-clamp-1">{issue.description || 'No description'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Site Details & Location */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Site Particulars
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-start justify-between py-1 border-b border-border/50">
              <span className="text-text-muted">Client:</span>
              <span className="font-semibold text-text-primary text-right">{site.client_name || 'Standard Client'}</span>
            </div>
            <div className="flex items-start justify-between py-1 border-b border-border/50">
              <span className="text-text-muted">Site Engineer:</span>
              <span className="font-medium text-text-primary text-right">
                {[site.site_engineer_first_name, site.site_engineer_last_name].filter(Boolean).join(' ') || 'Assigned Lead'}
              </span>
            </div>
            <div className="flex items-start justify-between py-1 border-b border-border/50">
              <span className="text-text-muted">Start Date:</span>
              <span className="font-mono text-text-primary">
                {(site.planned_start_date || site.actual_start_date || '—').split(' ')[0]}
              </span>
            </div>
            <div className="flex items-start justify-between py-1 border-b border-border/50">
              <span className="text-text-muted">Target Completion:</span>
              <span className="font-mono text-text-primary">
                {(site.expected_end_date || site.expected_completion_date || '—').split(' ')[0]}
              </span>
            </div>
            <div className="flex items-start justify-between py-1">
              <span className="text-text-muted">Address:</span>
              <span className="text-text-primary text-right max-w-[200px]">
                {[site.address_line1, site.city, site.state_name, site.postal_code].filter(Boolean).join(', ') || 'Site Area'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
