import { useState, useEffect, useMemo } from 'react';
import {
  Landmark, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, ArrowDownLeft, ArrowUpRight
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



export function CashFlowPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [cashflowList, setCashflowList] = useState([]);
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
    return cashflowList.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const mon = String(c.month_period || '').toLowerCase();
        const proj = String(c.project_name || '').toLowerCase();
        if (!mon.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [cashflowList, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalInflows = useMemo(() => cashflowList.reduce((acc, c) => acc + Number(c.cash_inflows || 0), 0), [cashflowList]);
  const totalOutflows = useMemo(() => cashflowList.reduce((acc, c) => acc + Number(c.total_outflows || 0), 0), [cashflowList]);
  const netSurplus = useMemo(() => totalInflows - totalOutflows, [totalInflows, totalOutflows]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Cash Flow Statement' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Cash Flow Statement & Liquidity Forecasting"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Realized Cash Inflow"
            value={`₹${(totalInflows / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Cash Outflow Payments"
            value={`₹${(totalOutflows / 10000000).toFixed(2)} Cr`}
            status="neutral"
            icon={<ArrowUpRight className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Net Operating Cash Surplus"
            value={`₹${(netSurplus / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Treasury Liquidity Status"
            value="Healthy Cash Position"
            status="success"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
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
                placeholder="Search period month, project..."
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
              title="Print Cash Flow Statement"
            >
              Print Statement
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
                  <th className="px-3 py-2 w-32">Month Period</th>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600 font-bold">Total Inflows</th>
                  <th className="px-3 py-2 text-right w-28 text-amber-600 font-bold">Total Outflows</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-primary">Net Cash Flow</th>
                  <th className="px-3 py-2 text-right w-32 hidden md:table-cell">Cumulative Buffer</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading cash flow statements...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No cash flow records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-primary text-[11px]">
                        {c.month_period}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-text-primary">
                        {c.project_name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        +₹{(c.cash_inflows / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        -₹{(c.total_outflows / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        +₹{(c.net_cash_flow / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        ₹{(c.cumulative_cash_buffer / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Surplus
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Cash Flow 360"
                            onClick={() => setViewingItem(c)}
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
          {paged.map((c, idx) => (
            <div key={c.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] font-bold text-primary block">{c.month_period}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.project_name}</h4>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  +₹{(c.net_cash_flow / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Inflows</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">+₹{(c.cash_inflows / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Outflows</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">-₹{(c.total_outflows / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View Cash Flow
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

      {/* View Cash Flow 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.month_period}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Cash Inflow</span> <span className="font-bold text-emerald-600 font-mono text-base">+₹{(viewingItem.cash_inflows / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Cash Outflow</span> <span className="font-bold text-amber-600 font-mono text-base">-₹{(viewingItem.total_outflows / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Monthly Cash Flow</span> <span className="font-bold text-primary font-mono text-base">+₹{(viewingItem.net_cash_flow / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Cash Surplus</span> <span className="font-bold text-emerald-700 font-mono text-base">₹{(viewingItem.cumulative_cash_buffer / 10000000).toFixed(2)} Cr</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">Outflow Disbursement Breakdown:</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">1. Material Supplier Invoices Settled</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.material_outflow / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">2. Direct Site Labour Wages Paid</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.labour_outflow / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">3. Subcontractor RA Bills Disbursed</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.subcontract_outflow / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">4. Plant Machinery Lease & Fuel</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.equipment_outflow / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-text-secondary font-medium">5. Site Overheads & Administration</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.overhead_outflow / 100000).toFixed(2)}L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Cash Flow Statement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
