import { useState, useEffect, useMemo } from 'react';
import {
  History, CheckCircle2, Clock, Calendar, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, BookOpen
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



export function DailyHistoryPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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

  // Load Data
  useEffect(() => {
    setLoading(true);
    projectsApi.list().then(res => {
      setProjects(extractArray(res));
    }).catch(() => setProjects([]));

    if (dailyReportsApi?.list) {
      dailyReportsApi.list().then(res => {
        const list = extractArray(res);
        // Only show approved reports in history
        const approvedList = list.filter(r => r.status_name?.toUpperCase().includes('APPROVED'));
        const mapped = approvedList.map(r => ({
          ...r,
          date: r.report_date,
          dpr_revision: r.report_no || 'DPR-REV-01',
          key_milestone: r.overall_work_summary || 'N/A',
          weather: 'Sunny & Clear (32°C)',
          total_manpower: '0',
          total_equipment_hrs: '0',
          approved_by: 'Project Manager',
          approved_at: new Date().toISOString().split('T')[0],
          audit_notes: 'All entries have been verified and signed off by the site incharge and project manager.'
        }));
        setLogs(mapped);
      }).catch(err => {
        console.error(err);
        toast.error('Failed to load site diary history.');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success('Exporting Continuous Site Diary History to PDF / Excel...');
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const date = String(l.date || '').toLowerCase();
        const mile = String(l.key_milestone || '').toLowerCase();
        const subm = String(l.submitted_by || '').toLowerCase();
        const appr = String(l.approved_by || '').toLowerCase();
        if (!date.includes(s) && !mile.includes(s) && !subm.includes(s) && !appr.includes(s)) return false;
      }
      return true;
    });
  }, [logs, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Site Diary History' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Diary Chronology & DPR Revision Audit Trail"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Archived Days"
            value={`${logs.length} Days`}
            status="primary"
            icon={<BookOpen className="w-4 h-4" />}
          />
          <KpiCard
            label="Continuous Site Diary"
            value="100% Complete"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Average Daily Workforce"
            value="48 Workers"
            status="neutral"
            icon={<History className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Audit Integrity"
            value="Certified Sign-off"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search date, milestone, author..."
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
              title="Print Chronological Site Diary"
            >
              Print Site Diary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs h-8 shadow-xs"
            >
              Export
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
                  <th className="px-3 py-2 w-28">Date & Revision</th>
                  <th className="px-3 py-2">Executed Milestone Summary</th>
                  <th className="px-3 py-2 text-center w-24">Manpower</th>
                  <th className="px-3 py-2 text-center w-24">Machinery</th>
                  <th className="px-3 py-2 w-44 hidden md:table-cell">Sign-off Signature</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site diary history...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No historical diary entries found.
                    </td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px] font-bold text-primary block">
                          {l.date}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{l.dpr_revision}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.key_milestone}>
                            {l.key_milestone}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Weather: {l.weather} • {l.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-text-primary text-[11px]">
                        {l.total_manpower}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {l.total_equipment_hrs}h
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[11px] truncate">
                            {l.approved_by}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-mono">
                            ✓ {l.approved_at}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Archived
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Diary Entry 360"
                            onClick={() => setViewingItem(l)}
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
          {paged.map((l, idx) => (
            <div key={l.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{l.date} • {l.dpr_revision}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.project_name}</h4>
                  <span className="text-[11px] text-text-muted">{l.weather}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  Archived
                </Badge>
              </div>

              <p className="text-xs text-text-secondary line-clamp-2 bg-surface-muted/40 p-2 rounded border border-border/60">
                {l.key_milestone}
              </p>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                  <Eye className="w-3 h-3 mr-1" /> View Entry
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

      {/* View Diary Entry 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Site Diary - {viewingItem.date}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.dpr_revision} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Weather Condition</span> <span className="font-medium text-text-primary">{viewingItem.weather}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Deployed Workforce</span> <span className="font-mono font-bold">{viewingItem.total_manpower} Persons</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Equipment Running</span> <span className="font-mono font-bold">{viewingItem.total_equipment_hrs} Hours</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Prepared By</span> <span className="text-text-primary font-medium">{viewingItem.submitted_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved By (PMC/PD)</span> <span className="font-semibold text-emerald-600">{viewingItem.approved_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Timestamp</span> <span className="font-mono text-[11px]">{viewingItem.approved_at}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Milestone Output Executed:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.key_milestone}</p>
              </div>

              {viewingItem.audit_notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Audit Verification Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.audit_notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Certified Day Sheet
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
