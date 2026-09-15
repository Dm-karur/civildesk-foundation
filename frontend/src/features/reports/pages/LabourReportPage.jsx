import { useState, useEffect, useMemo } from 'react';
import {
  Users, IndianRupee, Clock, BarChart3, TrendingUp,
  Search, Filter, Eye, Printer, FileSpreadsheet, Download,
  Building, Calendar, HardHat, ArrowUpRight, CheckCircle2
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
import { projectsApi } from '../../../api/apiservice';



export function LabourReportPage() {
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
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

  const handleExport = () => {
    toast.success('Exporting Labour Report to CSV / Excel...');
  };

  // Filtered List
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (tradeFilter !== 'all' && !r.trade_category.toLowerCase().includes(tradeFilter.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        const p = (r.project_name || '').toLowerCase();
        const s = (r.site_name || '').toLowerCase();
        const c = (r.contractor_name || '').toLowerCase();
        const t = (r.trade_category || '').toLowerCase();
        if (!p.includes(q) && !s.includes(q) && !c.includes(q) && !t.includes(q)) return false;
      }
      return true;
    });
  }, [reports, selectedProjectId, tradeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalWorkers = useMemo(() => reports.reduce((acc, r) => acc + Number(r.worker_count || 0), 0), [reports]);
  const totalMandays = useMemo(() => reports.reduce((acc, r) => acc + Number(r.total_mandays || 0), 0), [reports]);
  const totalWages = useMemo(() => reports.reduce((acc, r) => acc + Number(r.total_wages || 0), 0), [reports]);
  const avgCostPerManday = totalMandays > 0 ? Math.round(totalWages / totalMandays) : 0;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics' },
    { label: 'Labour Report' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Workforce & Productivity Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Workforce Deployed"
            value={`${totalWorkers} Workers`}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Mandays Incurred"
            value={`${totalMandays} Mandays`}
            status="success"
            icon={<Clock className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Labour Expenditure"
            value={`₹${totalWages.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Avg Daily Cost per Manday"
            value={`₹${avgCostPerManday} / day`}
            status="neutral"
            icon={<BarChart3 className="w-4 h-4 text-primary" />}
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Trade Categories' },
                  { value: 'Masonry', label: 'Masonry & Concrete' },
                  { value: 'Carpentry', label: 'Shuttering Carpentry' },
                  { value: 'Barbending', label: 'Steel Barbending' },
                  { value: 'Utility', label: 'General Utility & Helper' },
                ]}
                value={tradeFilter}
                onChange={setTradeFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search project, site, contractor..."
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
              title="Print Labour Report"
            >
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExport}
              className="text-xs h-8 shadow-xs"
              title="Export CSV"
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
                  <th className="px-3 py-2">Project & Site Zone</th>
                  <th className="px-3 py-2">Contractor & Trade Gang</th>
                  <th className="px-3 py-2 text-center w-24">Workers</th>
                  <th className="px-3 py-2 text-center w-36 hidden md:table-cell">Mandays & OT</th>
                  <th className="px-3 py-2 text-right w-28">Total Wages</th>
                  <th className="px-3 py-2 text-right w-24">Avg/Day</th>
                  <th className="px-3 py-2 text-center w-28">Muster %</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading labour analytics...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No labour report data found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.project_name}>
                            {r.project_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.contractor_name}>
                            {r.contractor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.trade_category}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-text-primary text-[11px]">
                        {r.worker_count}
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                        <span className="text-text-primary font-semibold">{r.total_mandays} Mandays</span>
                        <span className="text-text-muted block">{r.regular_hours}h Reg + {r.ot_hours}h OT</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(r.total_wages).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                        ₹{Math.round(r.avg_daily_cost)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={r.attendance_rate >= 95 ? 'success' : 'warning'}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.attendance_rate}%
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Site Labour 360"
                            onClick={() => setViewingItem(r)}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.project_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.site_name} • {r.trade_category}</span>
                </div>
                <Badge
                  variant={r.attendance_rate >= 95 ? 'success' : 'warning'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.attendance_rate}% Muster
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Workforce Roll</span>
                  <span className="font-mono text-text-primary text-[11px]">{r.worker_count} Workers ({r.total_mandays} Mandays)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Wages</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(r.total_wages).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{r.contractor_name}</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View 360
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

      {/* View Labour Report 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.project_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.site_name} • {viewingItem.trade_category}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Wages Paid</span> <span className="font-bold text-primary font-mono text-sm">₹{viewingItem.total_wages.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Avg Daily Cost per Worker</span> <span className="font-bold text-text-primary font-mono text-sm">₹{Math.round(viewingItem.avg_daily_cost)}/day</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Workforce Headcount</span> <span className="font-mono font-bold">{viewingItem.worker_count} Workers</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mandays Incurred</span> <span className="font-mono">{viewingItem.total_mandays} Mandays ({viewingItem.regular_hours}h Reg + {viewingItem.ot_hours}h OT)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Attendance Adherence</span> <span className="font-bold text-emerald-600">{viewingItem.attendance_rate}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Labour Contractor</span> <span className="text-text-primary">{viewingItem.contractor_name}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Breakdown
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
