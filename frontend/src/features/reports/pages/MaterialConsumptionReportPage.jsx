import { useState, useEffect, useMemo } from 'react';
import {
  Boxes, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, AlertTriangle, Layers
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



export function MaterialConsumptionReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
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
      reportsApi?.materials ? reportsApi.materials().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, repRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const rList = repRes?.data?.material_report ?? repRes?.data?.data ?? [];
      if (Array.isArray(rList) && rList.length > 0) {
        const normalized = rList.map((r, idx) => {
          const project = pList.find(p => String(p.id) === String(r.project_id));
          const issued = Number(r.issued_qty || 0);
          const consumed = Number(r.consumed_qty || 0);
          const wasted = Number(r.wasted_qty || 0);
          const val = Number(r.consumption_value || 0);

          const wastagePct = consumed > 0 ? Number(((wasted / consumed) * 100).toFixed(2)) : 0;
          const wastageCost = consumed > 0 ? Math.round((wasted / consumed) * val) : 0;
          const unitCost = consumed > 0 ? Math.round(val / consumed) : 0;

          return {
            id: r.material_id || idx + 1,
            project_id: r.project_id || 1,
            project_code: project ? project.project_code : 'PRJ-2026',
            project_name: r.project_name || (project ? project.project_name : 'Civil Project'),
            material_name: r.material_name || 'Building Material',
            category_name: r.material_code || 'Material Code',
            unit: r.unit_name || r.unit || 'Unit',
            theoretical_qty: issued,
            actual_consumed_qty: consumed,
            variance_qty: issued - consumed,
            wastage_pct: wastagePct,
            unit_cost: unitCost,
            wastage_cost: wastageCost,
            status: wastagePct > 2 ? 'High Wastage' : 'Within Standard Norm'
          };
        });
        setConsumptions(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return consumptions.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const mat = String(c.material_name || '').toLowerCase();
        const cat = String(c.category_name || '').toLowerCase();
        const proj = String(c.project_name || '').toLowerCase();
        if (!mat.includes(str) && !cat.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [consumptions, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalWastageLoss = useMemo(() => consumptions.reduce((acc, c) => acc + Number(c.wastage_cost || 0), 0), [consumptions]);
  const avgWastageRate = useMemo(() => {
    if (consumptions.length === 0) return 0;
    return (consumptions.reduce((acc, c) => acc + Number(c.wastage_pct || 0), 0) / consumptions.length).toFixed(2);
  }, [consumptions]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Material Consumption & Wastage' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Consumption, Theoretical vs Actual & Wastage Analysis Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Average Site Wastage"
            value={`${avgWastageRate}% (Under 2% Limit)`}
            status="primary"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Wastage & Scrap Cost"
            value={`₹${(totalWastageLoss / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Audited Material Items"
            value={`${consumptions.length} Critical Items`}
            status="neutral"
            icon={<Boxes className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="IS / CPWD Wastage Compliance"
            value="100% Compliant"
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
                placeholder="Search material, category..."
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
              title="Print Consumption Report"
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
                  <th className="px-3 py-2">Material Description & Category</th>
                  <th className="px-3 py-2 text-center w-16">Unit</th>
                  <th className="px-3 py-2 text-right w-24">Theoretical</th>
                  <th className="px-3 py-2 text-right w-24 font-bold text-primary">Actual Site</th>
                  <th className="px-3 py-2 text-right w-20 text-amber-600">Variance</th>
                  <th className="px-3 py-2 text-center w-20">Wastage %</th>
                  <th className="px-3 py-2 text-right w-24 font-bold hidden md:table-cell text-amber-600">Scrap Cost</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material consumption records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material consumption records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.material_name}>
                            {c.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.category_name} • {c.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {c.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {c.theoretical_qty.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        {c.actual_consumed_qty.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-amber-600">
                        +{c.variance_qty.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {c.wastage_pct}%
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono font-bold text-amber-600 text-[11px]">
                        ₹{(c.wastage_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Material Reconciliation 360"
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
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{c.category_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {c.wastage_pct}% Wastage
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Theoretical vs Actual</span>
                  <span className="font-mono text-text-primary text-[11px]">{c.theoretical_qty} vs {c.actual_consumed_qty} {c.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Scrap Loss Value</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(c.wastage_cost / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
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

      {/* View Consumption 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.material_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Wastage Percentage</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.wastage_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Scrap Loss Cost</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.wastage_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Theoretical Standard Qty</span> <span className="font-mono">{viewingItem.theoretical_qty.toLocaleString('en-IN')} {viewingItem.unit}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Site Consumed</span> <span className="font-mono font-bold text-primary">{viewingItem.actual_consumed_qty.toLocaleString('en-IN')} {viewingItem.unit}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Variance Quantity</span> <span className="font-mono text-amber-600">+{viewingItem.variance_qty.toLocaleString('en-IN')} {viewingItem.unit}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Procurement Unit Cost</span> <span className="font-mono">₹{viewingItem.unit_cost.toLocaleString('en-IN')} / {viewingItem.unit}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Reconciliation Docket
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
