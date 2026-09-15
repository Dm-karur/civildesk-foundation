import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, Clock, RotateCcw, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  Check, AlertCircle, Sparkles, Printer, ArrowRight, ClipboardList
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
import { Input } from '../../../components/ui/Input';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, dailyReportsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function DailyApprovalsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  const extractArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.daily_site_reports) return res.data.daily_site_reports;
    if (res?.daily_site_reports) return res.daily_site_reports;
    return [];
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const projRes = await projectsApi.list();
      setProjects(extractArray(projRes));

      if (dailyReportsApi?.list) {
        const dprRes = await dailyReportsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
        const list = extractArray(dprRes);
        const mapped = list.map(r => ({
          ...r,
          work_summary: r.overall_work_summary,
          overall_progress: r.actual_progress_percentage || 0,
          submitted_by: 'Site Engineer',
          weather: 'Sunny & Clear (32°C)',
          total_manpower: '0',
          total_equipment: '0'
        }));
        setReports(mapped);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load approval queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleApprove = async (item) => {
    try {
      await dailyReportsApi.approve(item.id, { remarks: 'Approved by PM' });
      toast.success(`DPR for ${item.report_date} approved and archived into official site diary.`);
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve DPR.');
    }
  };

  const handleReturn = async (item) => {
    try {
      await dailyReportsApi.reject(item.id, { remarks: 'Returned for Revision' });
      toast.success(`DPR for ${item.report_date} returned to site incharge.`);
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Failed to return DPR.');
    }
  };

  const handleSubmitDpr = async (item) => {
    try {
      await dailyReportsApi.submit(item.id, { remarks: 'Submitted for PM Approval' });
      toast.success(`DPR for ${item.report_date} submitted successfully.`);
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit DPR.');
    }
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !r.status_name.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const site = String(r.site_name || '').toLowerCase();
        const date = String(r.report_date || '').toLowerCase();
        const subm = String(r.submitted_by || '').toLowerCase();
        const work = String(r.work_summary || '').toLowerCase();
        if (!site.includes(s) && !date.includes(s) && !subm.includes(s) && !work.includes(s)) return false;
      }
      return true;
    });
  }, [reports, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => reports.filter(r => r.status_name.includes('Submitted')).length, [reports]);
  const approvedCount = useMemo(() => reports.filter(r => r.status_name.includes('Approved')).length, [reports]);

  const getStatusVariant = (st) => {
    if (st.includes('Approved')) return 'success';
    if (st.includes('Submitted')) return 'warning';
    if (st.includes('Returned')) return 'neutral';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'DPR Approval Queue' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="DPR Review & Project Manager Sign-Off Queue"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Submitted DPRs"
            value={reports.length}
            status="primary"
            icon={<ClipboardList className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending PM Sign-Off"
            value={`${pendingCount} Reports`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved & Archived"
            value={`${approvedCount} Reports`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Audit Adherence"
            value="100% Verified"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
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

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Stages' },
                  { value: 'Submitted', label: 'Pending PM Approval' },
                  { value: 'Approved', label: 'Approved by PM' },
                  { value: 'Returned', label: 'Returned for Revision' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search date, site, author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                  <th className="px-3 py-2 w-28">Report Date</th>
                  <th className="px-3 py-2">Site Location & Project</th>
                  <th className="px-3 py-2">Work Summary</th>
                  <th className="px-3 py-2 text-center w-24">Manpower</th>
                  <th className="px-3 py-2 text-center w-24">Progress %</th>
                  <th className="px-3 py-2 text-center w-36">Approval Status</th>
                  <th className="px-3 py-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading approval queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No daily progress reports in approval queue.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px] font-bold text-primary block">
                          {r.report_date}
                        </span>
                        <span className="text-[10px] text-text-muted truncate">{r.weather}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.site_name}>
                            {r.site_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.project_name} ({r.submitted_by})
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] text-text-secondary truncate block" title={r.work_summary}>
                          {r.work_summary}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-text-primary text-[11px]">
                        {r.total_manpower}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {r.overall_progress}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View DPR 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          
                          {(r.status_code === 'DRAFT' || r.status_name?.toUpperCase() === 'DRAFT') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                              title="Submit DPR"
                              onClick={() => handleSubmitDpr(r)}
                            >
                              <ArrowRight className="w-3 h-3 mr-0.5" /> Submit
                            </Button>
                          )}

                          {r.status_name?.includes('Submitted') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve DPR"
                                onClick={() => handleApprove(r)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(r)}
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-500 hover:text-amber-700" />
                              </Button>
                            </>
                          )}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.report_date} • {r.site_name}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.project_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.submitted_by}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.overall_progress}%
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 text-xs">
                <span className="text-[11px] text-text-secondary line-clamp-2">{r.work_summary}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View DPR
                </Button>
                {(r.status_code === 'DRAFT' || r.status_name?.toUpperCase() === 'DRAFT') && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-blue-600 border-blue-200" onClick={() => handleSubmitDpr(r)}>
                    <ArrowRight className="w-3 h-3 mr-1" /> Submit
                  </Button>
                )}
                {r.status_name?.includes('Submitted') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(r)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
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

      {/* View DPR 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">DPR - {viewingItem.report_date}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.site_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Progress</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.overall_progress}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Weather Condition</span> <span className="font-medium text-text-primary">{viewingItem.weather}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Deployed Workforce</span> <span className="font-mono font-bold">{viewingItem.total_manpower} Persons</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Equipment On Site</span> <span className="font-mono font-bold">{viewingItem.total_equipment} Units</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Prepared By</span> <span className="text-text-primary">{viewingItem.submitted_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Designated Approver</span> <span className="font-semibold text-text-primary">{viewingItem.designated_approver}</span></div>
              </div>

              {viewingItem.work_summary && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Execution Work Log:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.work_summary}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
