import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, TrendingUp, BarChart3, AlertTriangle
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



export function ManagementSummaryReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [portfolioList, setPortfolioList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
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
    return portfolioList.filter(p => {
      if (search) {
        const str = search.toLowerCase();
        const code = String(p.project_code || '').toLowerCase();
        const name = String(p.project_name || '').toLowerCase();
        const cl = String(p.client_name || '').toLowerCase();
        if (!code.includes(str) && !name.includes(str) && !cl.includes(str)) return false;
      }
      return true;
    });
  }, [portfolioList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalPortfolioValue = useMemo(() => portfolioList.reduce((acc, p) => acc + Number(p.contract_value || 0), 0), [portfolioList]);
  const totalRevenueBilled = useMemo(() => portfolioList.reduce((acc, p) => acc + Number(p.billed_revenue || 0), 0), [portfolioList]);
  const totalOperatingSurplus = useMemo(() => portfolioList.reduce((acc, p) => acc + Number(p.net_operating_profit || 0), 0), [portfolioList]);
  const avgPortfolioProgress = useMemo(() => {
    if (portfolioList.length === 0) return 0;
    return (portfolioList.reduce((acc, p) => acc + Number(p.physical_progress || 0), 0) / portfolioList.length).toFixed(1);
  }, [portfolioList]);

  const getStatusVariant = (st) => {
    if (st.includes('Optimal')) return 'success';
    if (st.includes('Watch') || st.includes('Risk')) return 'warning';
    return 'info';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Executive Management Summary' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Executive C-Suite & Board Level Project Portfolio Summary Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Order Book Portfolio Value"
            value={`₹${(totalPortfolioValue / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<Briefcase className="w-4 h-4" />}
          />
          <KpiCard
            label="Cumulative Net EBITDA Profit"
            value={`₹${(totalOperatingSurplus / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Weighted Physical Completion"
            value={`${avgPortfolioProgress}% Done`}
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Overall Portfolio Health Index"
            value="SPI 0.98 • CPI 1.06"
            status="success"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-80">
              <SearchField
                placeholder="Search project code, name, client..."
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
              title="Print Executive Summary"
            >
              Print Board Dossier
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
                  <th className="px-3 py-2">Project & Client Name</th>
                  <th className="px-3 py-2 text-right w-28">Order Value</th>
                  <th className="px-3 py-2 text-center w-24">Progress %</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Revenue</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-emerald-600">Net Profit</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">SPI / CPI</th>
                  <th className="px-3 py-2 text-center w-36">Executive Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading management portfolio records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No management summary records found.
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
                          <span className="text-[10px] text-text-muted truncate">
                            {p.client_name} • {p.project_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(p.contract_value / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-primary text-[11px]">
                        {p.physical_progress}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(p.billed_revenue / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(p.net_operating_profit / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {p.spi} / <span className="font-bold text-emerald-600">{p.cpi}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(p.executive_status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {p.executive_status.includes('Optimal') ? 'Optimal' : p.executive_status.includes('Watch') ? 'Watchlist' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Executive 360"
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
                  <span className="text-[11px] text-text-muted">{p.client_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(p.executive_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {p.physical_progress}% Done
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Contract Value</span>
                  <span className="font-mono text-text-secondary text-[11px]">₹{(p.contract_value / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Net Profit</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(p.net_operating_profit / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Summary
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

      {/* View Management 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.project_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Value</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.contract_value / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Physical Progress</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.physical_progress}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recognized Revenue</span> <span className="font-mono">₹{(viewingItem.billed_revenue / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Expenses</span> <span className="font-mono">₹{(viewingItem.actual_costs / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net EBITDA Profit</span> <span className="font-mono font-bold text-emerald-700">₹{(viewingItem.net_operating_profit / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule Performance (SPI)</span> <span className="font-mono font-bold text-primary">{viewingItem.spi}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cost Performance (CPI)</span> <span className="font-mono font-bold text-emerald-700">{viewingItem.cpi}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cash Liquidity Buffer</span> <span className="font-mono font-bold text-emerald-700">₹{(viewingItem.cash_flow_balance / 100000).toFixed(2)}L</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Executive Board Status</span> <span className="font-medium text-text-primary">{viewingItem.executive_status}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Board Summary
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
