import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, IndianRupee, CheckCircle2, Clock, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, BarChart2,
  Layers, Percent, ArrowUpRight, ArrowDownRight
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
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, request } from '../../../api/apiservice';



const EMPTY_FORM = {
  project_id: '',
  wbs_code: '',
  trade_name: '',
  category_name: 'RCC Concrete Squad',
  contractor_name: '',
  mandays_spent: '50',
  regular_hours: '400',
  ot_hours: '20',
  output_qty: '100',
  uom: 'cum',
  budgeted_cost: '60000',
  actual_cost: '55000',
  status: 'Under Budget',
  notes: '',
};

export function ManpowerCostPage() {
  const [projects, setProjects] = useState([]);
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/labour/manpower-cost');
      const list = res?.data ?? res ?? [];
      setCosts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load manpower costs', e);
      setCosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      wbs_code: `WBS-1.${costs.length + 1}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      wbs_code: item.wbs_code || '',
      trade_name: item.trade_name || '',
      category_name: item.category_name || '',
      contractor_name: item.contractor_name || '',
      mandays_spent: String(item.mandays_spent || '50'),
      regular_hours: String(item.regular_hours || '400'),
      ot_hours: String(item.ot_hours || '20'),
      output_qty: String(item.output_qty || '100'),
      uom: item.uom || 'cum',
      budgeted_cost: String(item.budgeted_cost || '60000'),
      actual_cost: String(item.actual_cost || '55000'),
      status: item.status || 'Under Budget',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.trade_name.trim()) errs.trade_name = 'Trade / Work Package name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const bCost = Number(form.budgeted_cost || 0);
      const aCost = Number(form.actual_cost || 0);
      const outQty = Number(form.output_qty || 1);
      const variance = bCost - aCost;
      const varPct = bCost > 0 ? Number(((variance / bCost) * 100).toFixed(1)) : 0;

      let st = 'On Track';
      if (variance > 0) st = 'Under Budget';
      else if (variance < 0) st = 'Over Budget';

      const newRecord = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        wbs_code: form.wbs_code || 'WBS-1.0',
        trade_name: form.trade_name,
        category_name: form.category_name,
        contractor_name: form.contractor_name || 'Direct Roll',
        mandays_spent: Number(form.mandays_spent || 0),
        regular_hours: Number(form.regular_hours || 0),
        ot_hours: Number(form.ot_hours || 0),
        output_qty: outQty,
        uom: form.uom,
        budgeted_cost: bCost,
        actual_cost: aCost,
        variance_amount: variance,
        variance_pct: varPct,
        unit_rate_actual: Number((aCost / outQty).toFixed(1)),
        unit_rate_budget: Number((bCost / outQty).toFixed(1)),
        status: st,
        notes: form.notes,
      };

      if (editingItem?.id) {
        await request.patch(`/labour/manpower-cost/${editingItem.id}`, newRecord);
        toast.success('Cost record updated.');
      } else {
        // Exclude ID when creating so DB can auto-increment
        const { id, ...createPayload } = newRecord;
        await request.post('/labour/manpower-cost', createPayload);
        toast.success('Manpower cost trade added.');
      }

      loadData();

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save cost record.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      await request.delete(`/labour/manpower-cost/${deleteItem.id}`);
      toast.success('Cost record deleted.');
      loadData();
    } catch {
      toast.error('Failed to delete cost record.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return costs.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (c.wbs_code || '').toLowerCase();
        const trade = (c.trade_name || '').toLowerCase();
        const cat = (c.category_name || '').toLowerCase();
        const cont = (c.contractor_name || '').toLowerCase();
        if (!code.includes(q) && !trade.includes(q) && !cat.includes(q) && !cont.includes(q)) return false;
      }
      return true;
    });
  }, [costs, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalBudget = useMemo(() => costs.reduce((acc, c) => acc + Number(c.budgeted_cost || 0), 0), [costs]);
  const totalActual = useMemo(() => costs.reduce((acc, c) => acc + Number(c.actual_cost || 0), 0), [costs]);
  const netVariance = totalBudget - totalActual;
  const totalMandays = useMemo(() => costs.reduce((acc, c) => acc + Number(c.mandays_spent || 0), 0), [costs]);

  const getStatusVariant = (status) => {
    if (status === 'Under Budget') return 'success';
    if (status === 'On Track') return 'info';
    if (status === 'Over Budget') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Manpower Cost' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour & Manpower Cost Analytics"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Labour Budget"
            value={`₹${totalBudget.toLocaleString('en-IN')}`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Actual Incurred"
            value={`₹${totalActual.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<BarChart2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Cost Savings Variance"
            value={`${netVariance >= 0 ? '+' : ''}₹${netVariance.toLocaleString('en-IN')}`}
            status={netVariance >= 0 ? 'success' : 'error'}
            icon={netVariance >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="Total Mandays Deployed"
            value={`${totalMandays} Mandays`}
            status="neutral"
            icon={<Users className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Cost Status' },
                  { value: 'Under Budget', label: 'Under Budget (Savings)' },
                  { value: 'On Track', label: 'On Track' },
                  { value: 'Over Budget', label: 'Over Budget (Overrun)' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search trade, WBS, gang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Cost Trade
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
                  <th className="px-3 py-2 w-28">WBS Code</th>
                  <th className="px-3 py-2">Trade / Work Package Scope</th>
                  <th className="px-3 py-2 text-center w-36 hidden md:table-cell">Mandays & Output</th>
                  <th className="px-3 py-2 text-right w-24">Budget (₹)</th>
                  <th className="px-3 py-2 text-right w-24">Actual (₹)</th>
                  <th className="px-3 py-2 text-right w-24">Variance</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading manpower cost analysis...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No cost records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {c.wbs_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.trade_name}>
                            {c.trade_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.category_name} • {c.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                        <span className="text-text-primary font-semibold">{c.mandays_spent} Mandays</span>
                        <span className="text-text-muted block">{c.output_qty} {c.uom} (₹{c.unit_rate_actual}/{c.uom})</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{Number(c.budgeted_cost).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{Number(c.actual_cost).toLocaleString('en-IN')}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold text-[11px] ${c.variance_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {c.variance_amount >= 0 ? `+₹${c.variance_amount.toLocaleString('en-IN')}` : `-₹${Math.abs(c.variance_amount).toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(c.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Cost 360"
                            onClick={() => setViewingItem(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(c)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.wbs_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.trade_name}</h4>
                  <span className="text-[11px] text-text-muted">{c.category_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(c.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {c.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Budget vs Actual</span>
                  <span className="font-mono text-text-primary text-[11px]">₹{c.actual_cost.toLocaleString('en-IN')} / ₹{c.budgeted_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Variance</span>
                  <span className={`font-mono font-bold text-[12px] ${c.variance_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {c.variance_amount >= 0 ? `+₹${c.variance_amount.toLocaleString('en-IN')}` : `-₹${Math.abs(c.variance_amount).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="font-mono text-[10px] text-text-muted">{c.output_qty} {c.uom} (₹{c.unit_rate_actual}/{c.uom})</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
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

      {/* View Cost 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.trade_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.wbs_code} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Budgeted Ceiling</span> <span className="font-bold text-text-primary font-mono text-sm">₹{viewingItem.budgeted_cost.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Cost Incurred</span> <span className="font-bold text-primary font-mono text-sm">₹{viewingItem.actual_cost.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cost Variance (+/-)</span> <span className={`font-mono font-bold text-sm ${viewingItem.variance_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{viewingItem.variance_amount >= 0 ? `+₹${viewingItem.variance_amount.toLocaleString('en-IN')} (${viewingItem.variance_pct}%)` : `-₹${Math.abs(viewingItem.variance_amount).toLocaleString('en-IN')} (${viewingItem.variance_pct}%)`}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cost Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mandays Incurred</span> <span className="font-mono">{viewingItem.mandays_spent} Mandays ({viewingItem.regular_hours}h Reg + {viewingItem.ot_hours}h OT)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Unit Labour Productivity</span> <span className="font-mono font-bold text-text-primary">₹{viewingItem.unit_rate_actual} / {viewingItem.uom}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Site Productivity & Cost Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Cost Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={BarChart2}
          title={editingItem ? 'Edit Manpower Cost Trade' : 'Add Manpower Cost Trade'}
          subtitle="Track trade-wise labour budgets, actual wage expenditures, and productivity variances."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="cost-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Trade & Scope Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="WBS Code" required>
                  <Input
                    value={form.wbs_code}
                    onChange={(e) => handleFormChange('wbs_code', e.target.value)}
                    placeholder="WBS-1.2"
                  />
                </FormField>

                <FormField label="Trade / Work Package" required error={errors.trade_name} className="md:col-span-2">
                  <Input
                    value={form.trade_name}
                    onChange={(e) => handleFormChange('trade_name', e.target.value)}
                    placeholder="e.g. RCC Column & Core Wall Concrete Pouring"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Budget, Actual Cost & Output">
              <EntityEditModal.Grid>
                <FormField label="Budgeted Cost Ceiling (₹)">
                  <Input
                    type="number"
                    value={form.budgeted_cost}
                    onChange={(e) => handleFormChange('budgeted_cost', e.target.value)}
                  />
                </FormField>

                <FormField label="Actual Incurred Cost (₹)">
                  <Input
                    type="number"
                    value={form.actual_cost}
                    onChange={(e) => handleFormChange('actual_cost', e.target.value)}
                  />
                </FormField>

                <FormField label="Output Quantity">
                  <Input
                    type="number"
                    value={form.output_qty}
                    onChange={(e) => handleFormChange('output_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit of Measurement (UOM)">
                  <Input
                    value={form.uom}
                    onChange={(e) => handleFormChange('uom', e.target.value)}
                    placeholder="cum / sq.ft / MT"
                  />
                </FormField>

                <FormField label="Mandays Spent">
                  <Input
                    type="number"
                    value={form.mandays_spent}
                    onChange={(e) => handleFormChange('mandays_spent', e.target.value)}
                  />
                </FormField>

                <FormField label="Overtime Hours">
                  <Input
                    type="number"
                    value={form.ot_hours}
                    onChange={(e) => handleFormChange('ot_hours', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="cost-form"
            submitLabel={editingItem ? 'Update Cost Trade' : 'Save Cost Trade'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Cost Record"
        message={`Are you sure you want to delete this cost record?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
