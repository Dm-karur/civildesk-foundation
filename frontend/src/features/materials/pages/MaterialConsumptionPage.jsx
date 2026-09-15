import { useState, useEffect, useMemo } from 'react';
import {
  TrendingDown, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, AlertTriangle, BarChart3
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
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  consumption_no: '',
  date: '',
  site_name: 'Tower A Core - Level 2',
  work_activity: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  uom: 'Bags',
  theoretical_qty: '100',
  actual_consumed_qty: '102',
  variance_qty: '2',
  wastage_pct: '2.0',
  unit_rate: '385',
  actual_cost: '39270',
  status: 'Within Tolerance (<= 2%)',
  incharge: 'Site Engineer',
  notes: '',
};

export function MaterialConsumptionPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
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

  // --- MOCK PERSISTENCE REMOVED ---
  // In-memory state will be used until backend is fully integrated
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      consumption_no: `MCN-2026-06${consumptions.length + 1}`,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      consumption_no: item.consumption_no || '',
      date: item.date || '',
      site_name: item.site_name || '',
      work_activity: item.work_activity || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      uom: item.uom || 'Nos',
      theoretical_qty: String(item.theoretical_qty || '100'),
      actual_consumed_qty: String(item.actual_consumed_qty || '102'),
      variance_qty: String(item.variance_qty || '2'),
      wastage_pct: String(item.wastage_pct || '2.0'),
      unit_rate: String(item.unit_rate || '385'),
      actual_cost: String(item.actual_cost || '39270'),
      status: item.status || 'Within Tolerance (<= 2%)',
      incharge: item.incharge || 'Site Engineer',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'theoretical_qty' || field === 'actual_consumed_qty' || field === 'unit_rate') {
        const theo = Number(field === 'theoretical_qty' ? value : prev.theoretical_qty) || 0;
        const act = Number(field === 'actual_consumed_qty' ? value : prev.actual_consumed_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        const diff = Number((act - theo).toFixed(2));
        const pct = theo > 0 ? Number(((diff / theo) * 100).toFixed(2)) : 0;
        next.variance_qty = String(diff);
        next.wastage_pct = String(pct);
        next.actual_cost = String(Math.round(act * rate));
        next.status = pct > 5.0 ? 'Wastage Overrun (> 5%)' : 'Within Tolerance';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.consumption_no.trim()) errs.consumption_no = 'Consumption No is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const theo = Number(form.theoretical_qty || 0);
      const act = Number(form.actual_consumed_qty || 0);
      const rate = Number(form.unit_rate || 0);
      const diff = Number((act - theo).toFixed(2));
      const pct = theo > 0 ? Number(((diff / theo) * 100).toFixed(2)) : 0;

      const newCons = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        consumption_no: form.consumption_no,
        date: form.date,
        site_name: form.site_name,
        work_activity: form.work_activity,
        material_code: form.material_code,
        material_name: form.material_name,
        uom: form.uom,
        theoretical_qty: theo,
        actual_consumed_qty: act,
        variance_qty: diff,
        wastage_pct: pct,
        unit_rate: rate,
        actual_cost: Math.round(act * rate),
        status: pct > 5.0 ? 'Wastage Overrun (> 5%)' : 'Within Tolerance (<= 3%)',
        incharge: form.incharge,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setConsumptions(prev => prev.map(c => c.id === editingItem.id ? newCons : c));
        toast.success('Consumption record updated.');
      } else {
        setConsumptions(prev => [newCons, ...prev]);
        toast.success('Material consumption vs BOQ norms logged.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save consumption record.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setConsumptions(prev => prev.filter(c => c.id !== deleteItem.id));
    toast.success('Consumption record removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return consumptions.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !c.status.includes(statusFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (c.consumption_no || '').toLowerCase();
        const mat = (c.material_name || '').toLowerCase();
        const act = (c.work_activity || '').toLowerCase();
        const site = (c.site_name || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !act.includes(q) && !site.includes(q)) return false;
      }
      return true;
    });
  }, [consumptions, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCost = useMemo(() => consumptions.reduce((acc, c) => acc + Number(c.actual_cost || 0), 0), [consumptions]);
  const overrunCount = useMemo(() => consumptions.filter(c => c.status.includes('Overrun')).length, [consumptions]);

  const getStatusVariant = (status) => {
    if (status.includes('Overrun')) return 'error';
    if (status.includes('Tolerance')) return 'success';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Consumption' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Consumption vs BOQ Norms & Wastage"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Pour Logs"
            value={consumptions.length}
            status="primary"
            icon={<BarChart3 className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Consumed Cost"
            value={`₹${totalCost.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Wastage Overrun Alerts"
            value={`${overrunCount} Pours`}
            status={overrunCount > 0 ? 'warning' : 'success'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Average Wastage %"
            value="2.35% (Good)"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Wastage Status' },
                  { value: 'Tolerance', label: 'Within Permissible Tolerance' },
                  { value: 'Overrun', label: 'Wastage Overrun (> 5%)' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search pour activity, material, site..."
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
              title="Print Consumption Register"
            >
              Print Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Log Consumption
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
                  <th className="px-3 py-2 w-28">Log Ref</th>
                  <th className="px-3 py-2">Work Scope & Activity</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">BOQ Norm</th>
                  <th className="px-3 py-2 text-right w-24">Actual Qty</th>
                  <th className="px-3 py-2 text-right w-24">Wastage %</th>
                  <th className="px-3 py-2 text-right w-28">Actual Cost</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material consumption logs...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-text-muted text-[12px]">
                      No consumption logs found matching criteria.
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
                          {c.consumption_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{c.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.work_activity}>
                            {c.work_activity}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={c.material_name}>
                          {c.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {c.theoretical_qty} {c.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {c.actual_consumed_qty} {c.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                        <span className={c.wastage_pct > 5.0 ? 'text-red-600' : 'text-emerald-600'}>
                          +{c.wastage_pct}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(c.actual_cost).toLocaleString('en-IN')}
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
                            title="View Consumption 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.consumption_no} • {c.date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.work_activity}</h4>
                  <span className="text-[11px] text-text-muted">{c.material_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(c.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  +{c.wastage_pct}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Norm vs Actual</span>
                  <span className="font-mono text-text-primary text-[11px]">{c.theoretical_qty} ➔ {c.actual_consumed_qty} {c.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Actual Cost</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(c.actual_cost).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View Log
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(c)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
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
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.consumption_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">BOQ Standard Norm</span> <span className="font-mono text-text-primary">{viewingItem.theoretical_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Site Consumed</span> <span className="font-mono font-bold text-primary">{viewingItem.actual_consumed_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Wastage Variance</span> <span className={`font-bold font-mono ${viewingItem.wastage_pct > 5.0 ? 'text-red-600' : 'text-emerald-600'}`}>+{viewingItem.variance_qty} {viewingItem.uom} (+{viewingItem.wastage_pct}%)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Material Cost</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.actual_cost).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Wastage Compliance</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Site Incharge</span> <span className="text-text-primary">{viewingItem.incharge}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Work Activity & Scope</span> <span className="text-text-primary font-medium">{viewingItem.work_activity}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Site Consumption Notes & Root Cause:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Consumption Log
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Consumption Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={BarChart3}
          title={editingItem ? 'Edit Consumption Log' : 'Log Material Consumption & Wastage'}
          subtitle="Compare theoretical BOQ design mix requirements against actual site consumption."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="mcn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Pour & Work Scope Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Consumption Ref No" required error={errors.consumption_no}>
                  <Input
                    value={form.consumption_no}
                    onChange={(e) => handleFormChange('consumption_no', e.target.value)}
                    placeholder="MCN-2026-065"
                  />
                </FormField>

                <FormField label="Work Activity / Pour Scope" required className="md:col-span-2">
                  <Input
                    value={form.work_activity}
                    onChange={(e) => handleFormChange('work_activity', e.target.value)}
                    placeholder="e.g. Level 2 Slab M30 Concrete Pour (45 cum)"
                  />
                </FormField>

                <FormField label="Site Location" className="md:col-span-2">
                  <Input
                    value={form.site_name}
                    onChange={(e) => handleFormChange('site_name', e.target.value)}
                    placeholder="e.g. Tower A Core - Level 2"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Theoretical Norm vs Actual Quantity">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Unit Valuation Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Theoretical BOQ Norm">
                  <Input
                    type="number"
                    value={form.theoretical_qty}
                    onChange={(e) => handleFormChange('theoretical_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Actual Site Consumed Qty">
                  <Input
                    type="number"
                    value={form.actual_consumed_qty}
                    onChange={(e) => handleFormChange('actual_consumed_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Calculated Wastage %" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold bg-surface-muted"
                    value={`+${form.variance_qty} ${form.uom} (+${form.wastage_pct}% Wastage)`}
                  />
                </FormField>

                <FormField label="Consumption Notes & Justification" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Pump line priming waste, offcuts reuse notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="mcn-form"
            submitLabel={editingItem ? 'Update Log' : 'Save Consumption Log'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Consumption Log"
        message={`Are you sure you want to delete "${deleteItem?.consumption_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
