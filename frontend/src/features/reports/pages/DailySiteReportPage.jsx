import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Sun, HardHat, Truck
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function DailySiteReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return dailyReports.filter(d => {
      if (selectedProjectId !== 'all' && String(d.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const act = String(d.major_activity || '').toLowerCase();
        const zn = String(d.work_zone || '').toLowerCase();
        const prj = String(d.project_name || '').toLowerCase();
        const inc = String(d.site_incharge || '').toLowerCase();
        if (!act.includes(str) && !zn.includes(str) && !prj.includes(str) && !inc.includes(str)) return false;
      }
      return true;
    });
  }, [dailyReports, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalLabourToday = useMemo(() => dailyReports.reduce((acc, d) => acc + Number(d.labour_count || 0), 0), [dailyReports]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Daily Site Progress Report (DPR)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Consolidated Daily Site Operations & Progress Log Report (DPR)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total On-Site Deployed Force"
            value={`${totalLabourToday} Workers Logged`}
            status="primary"
            icon={<HardHat className="w-4 h-4" />}
          />
          <KpiCard
            label="Daily Work Reports (DPR)"
            value={`${dailyReports.length} Submitted Logs`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Safety & EHS Record"
            value="100% Zero Incident"
            status="success"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Site Weather Conditions"
            value="Clear & Productive"
            status="neutral"
            icon={<Sun className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
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
                placeholder="Search activity, work zone, incharge..."
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
              title="Print Daily Progress Report"
            >
              Print DPR Dossier
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
                  <th className="px-3 py-2 w-24">Date</th>
                  <th className="px-3 py-2">Project & Work Zone</th>
                  <th className="px-3 py-2">Major Executed Scope</th>
                  <th className="px-3 py-2 text-center w-20">Labour</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Site Incharge</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading daily site operations records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No daily site reports found.
                    </td>
                  </tr>
                ) : (
                  paged.map((d, idx) => (
                    <tr key={d.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-primary">
                        {d.report_date}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={d.project_name}>
                            {d.project_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {d.work_zone}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-text-primary truncate" title={d.major_activity}>
                        {d.major_activity}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-primary text-[11px]">
                        {d.labour_count} Men
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell text-[11px] text-text-secondary truncate">
                        {d.site_incharge}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Approved
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View DPR 360"
                            onClick={() => setViewingItem(d)}
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
          {paged.map((d, idx) => (
            <div key={d.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{d.report_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{d.project_name}</h4>
                  <span className="text-[11px] text-text-muted">{d.work_zone}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {d.labour_count} Men
                </Badge>
              </div>

              <div className="text-xs pt-1 border-t border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Activity Executed</span>
                <p className="text-text-primary text-[11px] line-clamp-2">{d.major_activity}</p>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(d)}>
                  <Eye className="w-3 h-3 mr-1" /> View Full DPR
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

      {/* View DPR 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Daily Progress Report: {viewingItem.report_date}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Work Zone</span> <span className="font-bold text-text-primary">{viewingItem.work_zone}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Labour Force</span> <span className="font-bold text-primary font-mono text-base">{viewingItem.labour_count} Workers</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Executed Work Scope</span> <span className="text-text-primary font-medium">{viewingItem.major_activity}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Machinery & Plant Usage</span> <span className="font-mono">{viewingItem.equipment_hours}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Materials Delivered to Site</span> <span className="font-mono">{viewingItem.materials_received}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Weather / Delays</span> <span className="font-medium">{viewingItem.weather} (0h Delay)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Safety Incident Record</span> <span className="font-medium text-emerald-700">{viewingItem.safety_incidents}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Approved By</span> <span className="text-text-primary font-medium">{viewingItem.site_incharge}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Daily Site DPR
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
