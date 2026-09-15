import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Layers, AlertTriangle
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
import { projectsApi, reportsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function BudgetVsActualReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [budgetList, setBudgetList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects & API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      reportsApi?.projectCost ? reportsApi.projectCost().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, repRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const rList = repRes?.data?.cost_report ?? repRes?.data?.data ?? [];
      if (Array.isArray(rList) && rList.length > 0) {
        const normalized = rList.map((r, idx) => {
          const budgetVal = Number(r.approved_budget || 0);
          const actualVal = Number(r.total_actual_cost || 0);
          const util = budgetVal > 0 ? Math.round((actualVal / budgetVal) * 100) : 0;
          return {
            id: r.id || idx + 1,
            project_id: r.project_id || 1,
            project_code: r.project_code || 'PRJ-2026-001',
            project_name: r.project_name || 'Civil Project',
            cost_code: r.snapshot_level_code || r.project_code || 'PROJECT',
            cost_head: r.snapshot_name || 'Baseline Cost Snapshot',
            budget_amount: budgetVal,
            committed_amount: Number(r.committed_cost || 0),
            actual_amount: actualVal,
            variance: Number(r.budget_variance || 0),
            utilization_pct: util,
            status: Number(r.budget_variance) >= 0 ? 'Within Budget' : 'Over Budget'
          };
        });
        setBudgetList(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return budgetList.filter(b => {
      if (selectedProjectId !== 'all' && String(b.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const code = String(b.cost_code || '').toLowerCase();
        const head = String(b.cost_head || '').toLowerCase();
        const proj = String(b.project_name || '').toLowerCase();
        if (!code.includes(str) && !head.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [budgetList, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalBudget = useMemo(() => budgetList.reduce((acc, b) => acc + Number(b.budget_amount || 0), 0), [budgetList]);
  const totalActual = useMemo(() => budgetList.reduce((acc, b) => acc + Number(b.actual_amount || 0), 0), [budgetList]);
  const totalVariance = useMemo(() => budgetList.reduce((acc, b) => acc + Number(b.variance || 0), 0), [budgetList]);

  const getStatusVariant = (st) => {
    if (st.includes('Within')) return 'success';
    return 'danger';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Budget vs Actual Cost Analytics' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Budget vs Actual Cost & Variance Analytics Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Approved Budget"
            value={`₹${(totalBudget / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Actual Incurred to Date"
            value={`₹${(totalActual / 10000000).toFixed(2)} Cr`}
            status="neutral"
            icon={<Layers className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Remaining Budget Buffer"
            value={`₹${(totalVariance / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Budget Adherence Status"
            value="100% Controlled"
            status="neutral"
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
                placeholder="Search cost code, WBS head..."
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
              title="Print Variance Statement"
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
                  <th className="px-3 py-2 w-28">Cost Code</th>
                  <th className="px-3 py-2">WBS Cost Head & Scope</th>
                  <th className="px-3 py-2 text-right w-28">Approved Budget</th>
                  <th className="px-3 py-2 text-right w-28">Committed</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Actual Incurred</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600 font-bold">Variance Buffer</th>
                  <th className="px-3 py-2 text-center w-24">Util %</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading budget variance analytics...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No budget records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {b.cost_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={b.cost_head}>
                            {b.cost_head}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {b.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(b.budget_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(b.committed_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(b.actual_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(b.variance / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-primary text-[11px]">
                        {b.utilization_pct}%
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Variance 360"
                            onClick={() => setViewingItem(b)}
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
          {paged.map((b, idx) => (
            <div key={b.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{b.cost_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{b.cost_head}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(b.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {b.utilization_pct}% Util
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Budget Allocation</span>
                  <span className="font-mono text-text-secondary text-[11px]">₹{(b.budget_amount / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Actual Incurred</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(b.actual_amount / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(b)}>
                  <Eye className="w-3 h-3 mr-1" /> View Dossier
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

      {/* View Variance 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.cost_code}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.cost_head}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved Budget</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.budget_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Incurred</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.actual_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Committed PO / WO</span> <span className="font-mono">₹{(viewingItem.committed_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Remaining Buffer</span> <span className="font-mono font-bold text-emerald-700">₹{(viewingItem.variance / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Budget Utilization</span> <span className="font-mono font-bold text-primary">{viewingItem.utilization_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="text-emerald-700 font-medium">{viewingItem.status}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Variance Statement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
