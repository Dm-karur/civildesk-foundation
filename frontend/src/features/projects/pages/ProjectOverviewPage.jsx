import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2, Briefcase, IndianRupee, Calendar, Users, MapPin,
  TrendingUp, Layers, CheckCircle2, Clock, AlertTriangle, FileText,
  Shield, ArrowUpRight, Edit, ChevronRight, BarChart3, ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { projectsApi, sitesApi, boqApi, budgetsApi, projectCostingApi } from '../../../api/apiservice';
import { ProjectFormModal } from '../components/ProjectFormModal';

export function ProjectOverviewPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('id') || '');
  const [projectData, setProjectData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sites, setSites] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [boqs, setBoqs] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

  // Load project list
  useEffect(() => {
    projectsApi.list()
      .then(res => {
        const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
        setProjects(Array.isArray(list) ? list : []);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      })
      .catch(() => setProjects([]));
  }, []);

  // Sync with searchParams
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ id: selectedProjectId });
    }
  }, [selectedProjectId, setSearchParams]);

  // Load detailed project metrics
  useEffect(() => {
    if (!selectedProjectId) return;
    const pId = Number(selectedProjectId);
    setLoading(true);

    Promise.all([
      projectsApi.get(pId).catch(() => null),
      projectsApi.teamMembers.list(pId).catch(() => ({ data: { team_members: [] } })),
      sitesApi.list({ project_id: pId }).catch(() => ({ data: { sites: [] } })),
      projectCostingApi.summary(pId).catch(() => null),
      boqApi.list({ project_id: pId }).catch(() => ({ data: { project_boqs: [] } })),
      budgetsApi.list({ project_id: pId }).catch(() => ({ data: { project_budgets: [] } })),
      projectsApi.statusHistory(pId).catch(() => ({ data: { status_logs: [] } })),
    ]).then(([pRes, tRes, sRes, cRes, bqRes, bgRes, logRes]) => {
      const p = pRes?.data?.project ?? pRes?.project ?? projects.find(x => String(x.id) === String(selectedProjectId));
      setProjectData(p || null);
      setTeamMembers(tRes?.data?.team_members ?? tRes?.data?.data ?? []);
      setSites(sRes?.data?.sites ?? sRes?.data?.data ?? []);
      setCostSummary(cRes?.data?.summary ?? cRes?.data ?? null);
      setBoqs(bqRes?.data?.project_boqs ?? bqRes?.data?.data ?? []);
      setBudgets(bgRes?.data?.project_budgets ?? bgRes?.data?.data ?? []);
      setStatusLogs(logRes?.data?.status_logs ?? logRes?.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, [selectedProjectId, projects]);

  const p = projectData || {};
  const contractValue = Number(p.contract_value || 0);
  const approvedBudget = Number(p.approved_budget || 0);
  const actualCost = Number(costSummary?.actual_cost || 0);
  const progressPercent = Number(p.progress_percentage || 0);
  const estimatedMargin = contractValue > 0
    ? (((contractValue - (approvedBudget || actualCost)) / contractValue) * 100).toFixed(1)
    : '0.0';

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress') || s.includes('active')) return 'success';
    if (s.includes('hold') || s.includes('pending')) return 'warning';
    if (s.includes('complete')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Overview' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Overview"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-4 w-full">
        {/* Project Selector Ribbon */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex-1 sm:max-w-md">
              <Select
                options={projects.map(item => ({
                  value: String(item.id),
                  label: `${item.project_code} — ${item.project_name}`
                }))}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="w-full text-xs h-9 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {p.id && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => setEditingProject(p)}
                className="text-xs h-8"
              >
                Edit Details
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Building2 className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/sites?project_id=${selectedProjectId}`)}
              className="text-xs h-8"
            >
              View Sites ({sites.length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading 360° project metrics...
          </div>
        ) : !p.id ? (
          <div className="py-16 text-center text-text-muted text-xs bg-surface border border-border rounded-lg">
            Select a project to display the overview dashboard.
          </div>
        ) : (
          <>
            {/* Executive Hero Banner */}
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {p.project_code}
                    </span>
                    <Badge variant={getStatusVariant(p.project_status_name || p.status_name)}>
                      {p.project_status_name || p.status_name || 'Active'}
                    </Badge>
                    {p.priority_name && (
                      <span className="text-[10px] font-semibold text-text-secondary bg-surface-muted px-2 py-0.5 rounded border border-border">
                        {p.priority_name} Priority
                      </span>
                    )}
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-text-secondary font-medium">
                      {p.branch_name || 'Head Office'} • FY {p.financial_year_name || p.financial_year_code || '2025-26'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-bold text-text-primary tracking-tight">
                    {p.project_name}
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-text-secondary pt-1 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-text-muted" />
                      Client: <strong className="text-text-primary">{p.client_name || '—'}</strong> ({p.client_code || 'N/A'})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      Timeline: <strong>{p.planned_start_date ? p.planned_start_date.split(' ')[0] : 'TBD'}</strong> → <strong>{p.expected_completion_date ? p.expected_completion_date.split(' ')[0] : 'TBD'}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Ring / Bar */}
                <div className="w-full lg:w-64 bg-surface-muted/50 border border-border/80 rounded-xl p-3.5 flex flex-col justify-center shrink-0">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-text-secondary">Physical Progress</span>
                    <span className="font-mono font-bold text-primary text-sm">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-muted mt-1.5">
                    <span>Inception</span>
                    <span>Handover</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial & Commercial Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <Card className="p-3.5 sm:p-4">
                <span className="text-[11px] font-semibold text-text-secondary block mb-1">Contract Value</span>
                <span className="text-base sm:text-xl font-bold font-mono text-text-primary block">
                  ₹{contractValue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-text-muted block mt-0.5">
                  Tax: {p.tax_percentage || 18}% • Ret: {p.retention_percentage || 0}%
                </span>
              </Card>

              <Card className="p-3.5 sm:p-4">
                <span className="text-[11px] font-semibold text-text-secondary block mb-1">Approved Budget</span>
                <span className="text-base sm:text-xl font-bold font-mono text-emerald-600 block">
                  ₹{approvedBudget.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-text-muted block mt-0.5">
                  {budgets.length} Budget Revisions
                </span>
              </Card>

              <Card className="p-3.5 sm:p-4">
                <span className="text-[11px] font-semibold text-text-secondary block mb-1">Actual Incurred</span>
                <span className="text-base sm:text-xl font-bold font-mono text-text-primary block">
                  ₹{actualCost.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  {approvedBudget > 0 ? `${((actualCost / approvedBudget) * 100).toFixed(1)}% of Budget` : '—'}
                </span>
              </Card>

              <Card className="p-3.5 sm:p-4">
                <span className="text-[11px] font-semibold text-text-secondary block mb-1">Est. Gross Margin</span>
                <span className="text-base sm:text-xl font-bold font-mono text-primary block">
                  {estimatedMargin}%
                </span>
                <span className="text-[10px] text-text-muted block mt-0.5">
                  Variance: ₹{Math.max(0, contractValue - (approvedBudget || actualCost)).toLocaleString('en-IN')}
                </span>
              </Card>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column (7 cols): Sites, BOQ, Commercial Terms */}
              <div className="lg:col-span-7 space-y-4">
                {/* Commercial & Contract Terms */}
                <Card className="p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 pb-2 border-b border-border flex items-center justify-between">
                    <span>Contract & Commercial Terms</span>
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block">Work Order No.</span>
                      <span className="font-mono font-semibold text-text-primary">{p.work_order_no || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Client Ref No.</span>
                      <span className="font-mono text-text-primary">{p.client_reference_no || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Billing Method</span>
                      <span className="font-medium text-text-primary">{p.billing_method_name || 'Progressive Milestone'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Contract Date</span>
                      <span className="font-mono text-text-primary">{p.contract_date ? p.contract_date.split(' ')[0] : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Defect Liability End</span>
                      <span className="font-mono text-text-primary">{p.defect_liability_end_date ? p.defect_liability_end_date.split(' ')[0] : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Currency</span>
                      <span className="font-mono font-semibold text-text-primary">{p.currency_code || 'INR'}</span>
                    </div>
                  </div>

                  {p.description && (
                    <div className="mt-3.5 pt-3 border-t border-border text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Scope of Work</span>
                      <p className="text-text-secondary whitespace-pre-wrap text-[11px] bg-surface-muted/30 p-2.5 rounded-md border border-border/50">
                        {p.description}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Linked Sites Roster */}
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Active Sites & Locations ({sites.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-primary hover:underline p-0"
                      onClick={() => navigate(`/sites?project_id=${selectedProjectId}`)}
                    >
                      Manage Sites →
                    </Button>
                  </div>

                  {sites.length === 0 ? (
                    <p className="text-xs text-text-muted py-4 text-center">No physical sites registered under this project.</p>
                  ) : (
                    <div className="space-y-2">
                      {sites.slice(0, 4).map((site, i) => (
                        <div key={site.id || i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-surface-muted/20 hover:bg-surface-muted/40 transition-colors text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold text-text-primary block truncate">{site.site_name}</span>
                              <span className="text-[10px] font-mono text-text-muted">{site.site_code} • {site.city || 'Site Area'}</span>
                            </div>
                          </div>
                          <Badge variant={site.is_active ? 'success' : 'neutral'} className="text-[8px] h-4">
                            {site.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* BOQ & Budget Breakdown */}
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      BOQ & Budget Status
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-primary hover:underline p-0"
                      onClick={() => navigate(`/boq?project_id=${selectedProjectId}`)}
                    >
                      View BOQ →
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-surface-muted/30 p-3 rounded-lg border border-border">
                      <span className="text-[10px] text-text-muted uppercase font-bold block">BOQ Versions</span>
                      <span className="text-sm font-bold text-text-primary font-mono">{boqs.length} Registers</span>
                    </div>
                    <div className="bg-surface-muted/30 p-3 rounded-lg border border-border">
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Budget Baseline</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">₹{approvedBudget.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column (5 cols): Team Governance & Recent Activity */}
              <div className="lg:col-span-5 space-y-4">
                {/* Project Governance & Team Members */}
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Project Governance & Team ({teamMembers.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-primary hover:underline p-0"
                      onClick={() => navigate('/projects/team')}
                    >
                      Team Roster →
                    </Button>
                  </div>

                  {teamMembers.length === 0 ? (
                    <p className="text-xs text-text-muted py-4 text-center">No key personnel assigned.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {teamMembers.slice(0, 5).map((m, i) => {
                        const name = `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.name || 'Member';
                        const role = m.role_name || m.team_role_name || 'Team Member';
                        return (
                          <div key={m.id || i} className="flex items-center justify-between p-2 rounded-md hover:bg-surface-muted/40 transition-colors text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-text-primary block truncate">{name}</span>
                                <span className="text-[10px] text-text-muted block truncate">{role}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {m.is_primary && (
                                <span className="text-[8px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Lead</span>
                              )}
                              {m.can_approve && (
                                <span className="text-[8px] font-bold bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded">Approver</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Status Progression History */}
                <Card className="p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 pb-2 border-b border-border">
                    Status History & Audits
                  </h3>
                  {statusLogs.length === 0 ? (
                    <p className="text-xs text-text-muted py-3 text-center">No status changes recorded.</p>
                  ) : (
                    <div className="space-y-3 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                      {statusLogs.slice(0, 4).map((log, i) => (
                        <div key={log.id || i} className="relative text-xs pl-2 space-y-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary absolute -left-[11px] top-1" />
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-text-primary text-[11px]">{log.new_status_name || log.status_name || 'Status Updated'}</span>
                            <span className="text-[10px] font-mono text-text-muted">{log.created_at ? log.created_at.split(' ')[0] : 'Recent'}</span>
                          </div>
                          {log.remarks && <p className="text-[10px] text-text-secondary">{log.remarks}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectFormModal
          isOpen={Boolean(editingProject)}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaveSuccess={() => {
            setEditingProject(null);
            // Refresh
            setSelectedProjectId(String(editingProject.id));
          }}
        />
      )}
    </PageContainer>
  );
}
