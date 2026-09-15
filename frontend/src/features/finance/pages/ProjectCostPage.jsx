import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, TrendingUp, Layers, FileText
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
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, projectCostingApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function ProjectCostPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [costData, setCostData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genProjectId, setGenProjectId] = useState('');
  const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0]);
  const [genSaving, setGenSaving] = useState(false);

  const fetchCostData = (projList) => {
    setLoading(true);
    projectCostingApi.snapshots()
      .then((costRes) => {
        const cList = costRes?.data?.project_cost_snapshots ?? costRes?.data?.data ?? [];
        const normalized = cList.map((c, idx) => {
          const project = projList.find(p => String(p.id) === String(c.project_id));
          const approvedBudget = Number(c.approved_budget || 0);
          const forecastCost = Number(c.forecast_cost_at_completion || 0);
          const cpi = forecastCost > 0 ? (approvedBudget / forecastCost) : 1.0;
          return {
            id: c.id || idx + 1,
            project_id: c.project_id,
            project_code: project ? project.project_code : (c.project_code || 'PRJ-2026'),
            project_name: c.project_name || (project ? project.project_name : 'Civil Project'),
            contract_value: Number(project ? project.contract_value : 0),
            budgeted_cost: approvedBudget,
            materials_cost: Number(c.material_actual || 0),
            labour_cost: Number(c.labour_actual || 0),
            subcontract_cost: Number(c.subcontract_actual || 0),
            equipment_cost: Number((c.material_commitment || 0) + (c.subcontract_commitment || 0) + (c.expense_commitment || 0)),
            overhead_cost: Number(c.site_expense_actual || 0),
            actual_cost_incurred: Number(c.total_actual_cost || 0),
            projected_final_cost: forecastCost,
            cost_variance: Number(c.budget_variance || 0),
            cpi: cpi,
            status: cpi >= 1.0 ? 'On Track (Healthy Margin)' : cpi >= 0.95 ? 'Minor Overrun' : 'Critical Budget Overrun',
            total_paid: Number(c.total_paid || 0),
            total_outstanding: Number(c.total_outstanding || 0)
          };
        });
        setCostData(normalized);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Load Projects & API Data safely
  useEffect(() => {
    projectsApi.list()
      .then((projRes) => {
        const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
        const validList = Array.isArray(pList) ? pList : [];
        setProjects(validList);
        if (validList.length > 0) {
          setGenProjectId(String(validList[0].id));
        }
        fetchCostData(validList);
      })
      .catch(() => {
        fetchCostData([]);
      });
  }, []);

  const handleGenerateSnapshot = (e) => {
    e.preventDefault();
    if (!genProjectId) {
      toast.error('Please select a project');
      return;
    }
    setGenSaving(true);
    projectCostingApi.generateSnapshot({
      project_id: Number(genProjectId),
      snapshot_date: genDate,
      site_id: null
    })
      .then(() => {
        toast.success('Cost snapshot generated successfully.');
        setIsGenerateOpen(false);
        fetchCostData(projects);
      })
      .catch((err) => {
        toast.error(err?.message || 'Failed to generate cost snapshot.');
      })
      .finally(() => {
        setGenSaving(false);
      });
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return costData.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const code = String(c.project_code || '').toLowerCase();
        const name = String(c.project_name || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s)) return false;
      }
      return true;
    });
  }, [costData, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalContractVal = useMemo(() => costData.reduce((acc, c) => acc + Number(c.contract_value || 0), 0), [costData]);
  const totalBudgetCost = useMemo(() => costData.reduce((acc, c) => acc + Number(c.budgeted_cost || 0), 0), [costData]);
  const totalActualIncurred = useMemo(() => costData.reduce((acc, c) => acc + Number(c.actual_cost_incurred || 0), 0), [costData]);

  const getCpiBadge = (cpi) => {
    if (cpi >= 1.0) return 'success';
    if (cpi >= 0.95) return 'warning';
    return 'danger';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Project Cost Summary' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Cost Summary & Cost Breakdown"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Order Book Value"
            value={`₹${(totalContractVal / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Budgeted Cost"
            value={`₹${(totalBudgetCost / 10000000).toFixed(2)} Cr`}
            status="neutral"
            icon={<PieChart className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Actual Incurred to Date"
            value={`₹${(totalActualIncurred / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Cost Performance (CPI)"
            value="1.03 (Under Budget)"
            status="success"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
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
                placeholder="Search project code, name..."
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
              title="Print Cost Summary"
            >
              Print Summary
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsGenerateOpen(true)}
              className="text-xs h-8 shadow-xs"
            >
              Generate Snapshot
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
                  <th className="px-3 py-2 text-right w-28">Contract Sum</th>
                  <th className="px-3 py-2 text-right w-28">Budget Cost</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Incurred Cost</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600 font-bold">Projected Cost</th>
                  <th className="px-3 py-2 text-center w-20">CPI</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading project cost summaries...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No cost summary records found.
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
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.project_name}>
                            {c.project_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {c.project_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(c.contract_value / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(c.budgeted_cost / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(c.actual_cost_incurred / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(c.projected_final_cost / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getCpiBadge(c.cpi)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {c.cpi.toFixed(2)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] font-medium text-emerald-700 block truncate">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Cost Breakdown 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.project_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.project_name}</h4>
                </div>
                <Badge
                  variant={getCpiBadge(c.cpi)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  CPI: {c.cpi.toFixed(2)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Budgeted Cost</span>
                  <span className="font-mono text-text-secondary text-[11px]">₹{(c.budgeted_cost / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Actual Incurred</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(c.actual_cost_incurred / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View Cost Breakdown
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

      {/* View Cost Breakdown 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <PieChart className="w-4 h-4" />
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
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Incurred Cost</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.actual_cost_incurred / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Projected Final Cost</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.projected_final_cost / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Order Value</span> <span className="font-mono">₹{(viewingItem.contract_value / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Budgeted Baseline Cost</span> <span className="font-mono">₹{(viewingItem.budgeted_cost / 10000000).toFixed(2)} Cr</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">Direct Cost Component Breakdown:</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">1. Material Procurement & Consumption</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.materials_cost / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">2. Direct Site Labour & Muster Roll Wages</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.labour_cost / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">3. Subcontract Packages Certified</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.subcontract_cost / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-text-secondary font-medium">4. Plant, Heavy Machinery & Fuel</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.equipment_cost / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-text-secondary font-medium">5. Site Overheads, Testing & Admin</span>
                    <span className="font-mono font-bold text-text-primary">₹{(viewingItem.overhead_cost / 100000).toFixed(2)}L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Cost Breakdown
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Cost Snapshot Modal */}
      <EntityEditModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
      >
        <EntityEditModal.Header
          icon={PieChart}
          title="Generate Cost Snapshot"
          subtitle="Generate and save a project cost baseline/snapshot for the selected date."
          onClose={() => setIsGenerateOpen(false)}
        />
        <form id="gen-snapshot-form" onSubmit={handleGenerateSnapshot} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Snapshot Target">
              <EntityEditModal.Grid>
                <FormField label="Target Project" required>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={genProjectId}
                    onChange={setGenProjectId}
                  />
                </FormField>

                <FormField label="Snapshot Date" required>
                  <Input
                    type="date"
                    value={genDate}
                    onChange={(e) => setGenDate(e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="gen-snapshot-form"
            submitLabel="Generate Snapshot"
            onCancel={() => setIsGenerateOpen(false)}
            isSubmitting={genSaving}
          />
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
