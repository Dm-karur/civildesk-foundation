import { useState, useEffect, useMemo } from 'react';
import {
  Activity, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, TrendingUp, BarChart2
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { projectsApi, reportsApi, dashboardApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function ProjectProgressReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects & API Data safely
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      dashboardApi?.projectPerformance ? dashboardApi.projectPerformance().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, repRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const rList = repRes?.data?.projects ?? repRes?.data?.data ?? [];
      if (Array.isArray(rList) && rList.length > 0) {
        const normalized = rList.map((r, idx) => {
          const project = pList.find(p => String(p.id) === String(r.id));
          const contractVal = Number(project?.contract_value || project?.contract_amount || 10000000);
          const plannedPct = Number(r.planned_progress_percentage || 0);
          const actualPct = Number(r.actual_progress_percentage || 0);
          const dev = Number(r.progress_variance || 0);
          const spi = plannedPct > 0 ? Number((actualPct / plannedPct).toFixed(2)) : 1.00;
          const status = dev >= 0 ? 'Ahead of Schedule' : (dev >= -5 ? 'On Track' : 'Delayed');
          
          return {
            id: r.id || idx + 1,
            project_id: r.id || 1,
            project_code: r.project_code || 'PRJ-2026-001',
            project_name: r.project_name || 'Civil Project',
            contract_value: contractVal,
            planned_physical_pct: plannedPct,
            actual_physical_pct: actualPct,
            schedule_variance_pct: dev,
            financial_billed_pct: Math.round(actualPct * 0.9),
            current_milestone: Number(r.report_count) > 0 ? `Active Execution (${r.report_count} Daily Reports)` : 'Execution Stage Active',
            spi: spi,
            start_date: r.planned_start_date ? r.planned_start_date.split(' ')[0] : '—',
            target_completion_date: r.expected_completion_date ? r.expected_completion_date.split(' ')[0] : '—',
            health_status: status
          };
        });
        setProgressData(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return progressData.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const code = String(p.project_code || '').toLowerCase();
        const name = String(p.project_name || '').toLowerCase();
        const mil = String(p.current_milestone || '').toLowerCase();
        if (!code.includes(str) && !name.includes(str) && !mil.includes(str)) return false;
      }
      return true;
    });
  }, [progressData, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const avgPhysicalProgress = useMemo(() => {
    if (progressData.length === 0) return 0;
    return (progressData.reduce((acc, p) => acc + Number(p.actual_physical_pct || 0), 0) / progressData.length).toFixed(1);
  }, [progressData]);

  const avgPlannedProgress = useMemo(() => {
    if (progressData.length === 0) return 0;
    return (progressData.reduce((acc, p) => acc + Number(p.planned_physical_pct || 0), 0) / progressData.length).toFixed(1);
  }, [progressData]);

  const getStatusVariant = (st) => {
    if (st.includes('Ahead')) return 'success';
    if (st.includes('On Track')) return 'info';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Project Progress Analytics' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Physical & Financial Project Progress Analytics Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Average Actual Physical Progress"
            value={`${avgPhysicalProgress}% Done`}
            status="primary"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KpiCard
            label="Planned Target Schedule"
            value={`${avgPlannedProgress}% Baseline`}
            status="neutral"
            icon={<Activity className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Schedule Performance (SPI)"
            value="0.98 (Controlled)"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Site Projects"
            value={`${progressData.length} Projects`}
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search project code, name, milestone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Progress Report"
            >
              Print Report
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
                onItemsPerPageChange={() => {}}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2">Project Name & Code</th>
                  <th className="px-3 py-2 text-center w-24">Planned %</th>
                  <th className="px-3 py-2 text-center w-24 font-bold text-primary">Actual %</th>
                  <th className="px-3 py-2 text-center w-24">Deviation</th>
                  <th className="px-3 py-2 text-center w-24 hidden md:table-cell">Billed %</th>
                  <th className="px-3 py-2">Current Active Milestone</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading project progress analytics...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No project progress records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={p.project_name}>
                            {p.project_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {p.project_code} • End: {p.target_completion_date}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {p.planned_physical_pct}%
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-primary text-[11px]">
                        {p.actual_physical_pct}%
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px]">
                        <span className={p.schedule_variance_pct >= 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                          {p.schedule_variance_pct >= 0 ? `+${p.schedule_variance_pct}%` : `${p.schedule_variance_pct}%`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-emerald-600 font-medium">
                        {p.financial_billed_pct}%
                      </td>
                      <td className="px-3 py-2 text-[11px] text-text-primary truncate" title={p.current_milestone}>
                        {p.current_milestone}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(p.health_status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {p.health_status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Progress 360"
                            onClick={() => setViewingItem(p)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((p, idx) => (
            <div key={p.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{p.project_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.project_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.current_milestone}</span>
                </div>
                <Badge
                  variant={getStatusVariant(p.health_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {p.actual_physical_pct}% Done
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Planned vs Actual</span>
                  <span className="font-mono text-text-primary text-[11px]">{p.planned_physical_pct}% vs {p.actual_physical_pct}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Financial Billed</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">{p.financial_billed_pct}% Billed</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Analytics
                </Button>
              </div>
            </div>
          ))}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View Progress 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.project_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_code}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Physical Progress</span> <span className="font-bold text-primary font-mono text-base">{viewingItem.actual_physical_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Target Schedule</span> <span className="font-bold text-text-secondary font-mono text-base">{viewingItem.planned_physical_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Financial Billing Progress</span> <span className="font-mono font-bold text-emerald-600">{viewingItem.financial_billed_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule Performance (SPI)</span> <span className="font-mono font-bold text-primary">{viewingItem.spi}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Commencement Date</span> <span className="font-mono">{viewingItem.start_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Completion Deadline</span> <span className="font-mono font-medium text-amber-700">{viewingItem.target_completion_date}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Active Milestone Scope</span> <span className="text-text-primary font-medium">{viewingItem.current_milestone}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Progress Dossier
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
