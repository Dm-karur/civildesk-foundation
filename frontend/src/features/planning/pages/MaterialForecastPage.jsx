import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, Calendar,
  Layers, Package, Boxes, BarChart3, ArrowRight, Truck
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

const FORECAST_HORIZONS = [
  { id: '90d', name: '90-Day Quarterly Forecast (Q3/Q4)' },
  { id: '30d', name: '30-Day Monthly Lookahead' },
  { id: '180d', name: '6-Month Rolling Forecast' },
  { id: 'full', name: 'Full Project Lifecycle' },
];



const EMPTY_FORM = {
  project_id: '',
  material_code: '',
  name: '',
  category: 'Structural Steel',
  uom_name: 'MT',
  unit_rate: '0',
  m1_qty: '0',
  m2_qty: '0',
  m3_qty: '0',
  total_qty: '0',
  total_amount: '0',
  delivery_plan: '',
};

export function MaterialForecastPage() {
  const [projects, setProjects] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedHorizon, setSelectedHorizon] = useState('90d');
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

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_planning_MaterialForecastPage');
      if (saved) {
        setForecasts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_MaterialForecastPage');
    if (forecasts.length > 0 || saved) {
       localStorage.setItem('mock_planning_MaterialForecastPage', JSON.stringify(forecasts));
    }
  }, [forecasts]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      material_code: `MAT-FC-0${forecasts.length + 1}`,
      unit_rate: '5000',
      m1_qty: '50',
      m2_qty: '100',
      m3_qty: '80',
      total_qty: '230',
      total_amount: '1150000',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      material_code: item.material_code || '',
      name: item.name || '',
      category: item.category || 'Structural Steel',
      uom_name: item.uom_name || 'MT',
      unit_rate: String(item.unit_rate || '0'),
      m1_qty: String(item.m1_qty || '0'),
      m2_qty: String(item.m2_qty || '0'),
      m3_qty: String(item.m3_qty || '0'),
      total_qty: String(item.total_qty || '0'),
      total_amount: String(item.total_amount || '0'),
      delivery_plan: item.delivery_plan || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (['m1_qty', 'm2_qty', 'm3_qty', 'unit_rate'].includes(field)) {
        const m1 = Number(field === 'm1_qty' ? value : prev.m1_qty) || 0;
        const m2 = Number(field === 'm2_qty' ? value : prev.m2_qty) || 0;
        const m3 = Number(field === 'm3_qty' ? value : prev.m3_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        const tot = m1 + m2 + m3;
        next.total_qty = String(tot);
        next.total_amount = String(tot * rate);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Material name is required';
    if (!form.material_code.trim()) errs.material_code = 'Material code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const totQty = Number(form.total_qty || 0);
      const rate = Number(form.unit_rate || 0);

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        material_code: form.material_code,
        name: form.name,
        category: form.category,
        uom_name: form.uom_name,
        unit_rate: rate,
        m1_qty: Number(form.m1_qty || 0),
        m2_qty: Number(form.m2_qty || 0),
        m3_qty: Number(form.m3_qty || 0),
        total_qty: totQty,
        total_amount: Number(form.total_amount || totQty * rate),
        delivery_plan: form.delivery_plan,
      };

      if (editingItem?.id) {
        setForecasts(prev => prev.map(f => f.id === editingItem.id ? newItem : f));
        toast.success('Material forecast updated.');
      } else {
        setForecasts(prev => [newItem, ...prev]);
        toast.success('Material forecast registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save Forecast.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setForecasts(prev => prev.filter(f => f.id !== deleteItem.id));
    toast.success('Forecast line deleted.');
    setDeleteItem(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return forecasts.filter(f => {
      if (selectedProjectId !== 'all' && String(f.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (f.material_code || '').toLowerCase();
        const name = (f.name || '').toLowerCase();
        const cat = (f.category || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [forecasts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalQuarterlyValuation = useMemo(() => forecasts.reduce((acc, f) => acc + Number(f.total_amount || 0), 0), [forecasts]);
  const m1TotalValuation = useMemo(() => forecasts.reduce((acc, f) => acc + (f.m1_qty * f.unit_rate), 0), [forecasts]);
  const m2TotalValuation = useMemo(() => forecasts.reduce((acc, f) => acc + (f.m2_qty * f.unit_rate), 0), [forecasts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Material Forecast' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Consumption Forecast & Schedule"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Forecast Items"
            value={forecasts.length}
            status="primary"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KpiCard
            label="Month 1 Commitment"
            value={`₹${(m1TotalValuation / 100000).toFixed(1)} L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Month 2 Peak Commitment"
            value={`₹${(m2TotalValuation / 100000).toFixed(1)} L`}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Total 90-Day Forecast Value"
            value={`₹${(totalQuarterlyValuation / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Horizon Selector Bar */}
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
              <Select
                options={FORECAST_HORIZONS.map(h => ({ value: h.id, label: h.name }))}
                value={selectedHorizon}
                onChange={setSelectedHorizon}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search material, code, spec..."
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
              Add Forecast
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
                  <th className="px-3 py-2 w-28">Material Code</th>
                  <th className="px-3 py-2">Material Description & Class</th>
                  <th className="px-3 py-2 text-right w-24">Month 1 (Sep)</th>
                  <th className="px-3 py-2 text-right w-24">Month 2 (Oct)</th>
                  <th className="px-3 py-2 text-right w-24">Month 3 (Nov)</th>
                  <th className="px-3 py-2 text-right w-28">90-Day Qty</th>
                  <th className="px-3 py-2 text-right w-28">Total Value (₹)</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material forecasts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material forecast lines found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((f, idx) => (
                    <tr key={f.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {f.material_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={f.name}>
                            {f.name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {f.category} • {f.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {f.m1_qty} {f.uom_name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary font-bold">
                        {f.m2_qty} {f.uom_name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {f.m3_qty} {f.uom_name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {Number(f.total_qty).toLocaleString('en-IN')} {f.uom_name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(f.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Logistics & Forecast"
                            onClick={() => setViewingItem(f)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(f)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteItem(f)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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
          {paged.map((f, idx) => (
            <div key={f.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{f.material_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{f.name}</h4>
                </div>
                <Badge variant="neutral" className="text-[10px] font-mono px-1.5 shrink-0">
                  {f.uom_name}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-surface-muted/30 p-2 rounded border border-border/50 text-center text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Sep (M1)</span>
                  <span className="font-mono text-[11px]">{f.m1_qty}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Oct (M2)</span>
                  <span className="font-mono font-bold text-primary text-[11px]">{f.m2_qty}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Nov (M3)</span>
                  <span className="font-mono text-[11px]">{f.m3_qty}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total 90-Day Valuation</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(f.total_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(f)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(f)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteItem(f)}>
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </Button>
                </div>
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

      {/* View Forecast Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_code} • {viewingItem.category}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-2 bg-surface-muted/30 p-3 rounded-lg border border-border text-center">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Month 1 (Sep)</span> <span className="font-mono font-bold text-text-primary">{viewingItem.m1_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Month 2 (Oct)</span> <span className="font-mono font-bold text-primary">{viewingItem.m2_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Month 3 (Nov)</span> <span className="font-mono font-bold text-text-primary">{viewingItem.m3_qty} {viewingItem.uom_name}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Forecast Qty</span> <span className="font-bold text-text-primary font-mono">{viewingItem.total_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Cashflow Valuation</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.total_amount).toLocaleString('en-IN')}</span></div>
              </div>

              {viewingItem.delivery_plan && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Delivery Logistics & Site Inflow Plan:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.delivery_plan}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Forecast Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={TrendingUp}
          title={editingItem ? 'Edit Material Forecast' : 'Add Material Consumption Forecast'}
          subtitle="Forecast periodic material demand curves aligned with master construction schedule."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="fc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Material Classification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Material Code" required error={errors.material_code}>
                  <Input
                    value={form.material_code}
                    onChange={(e) => handleFormChange('material_code', e.target.value)}
                    placeholder="e.g. MAT-STEEL-550D"
                  />
                </FormField>

                <FormField label="Unit of Measurement (UOM)">
                  <Input
                    value={form.uom_name}
                    onChange={(e) => handleFormChange('uom_name', e.target.value)}
                    placeholder="e.g. MT, Cu.M, Bags"
                  />
                </FormField>

                <FormField label="Estimated Unit Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Material Description" required className="md:col-span-2" error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g. Fe550D TMT Reinforcement Steel Rebar"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Monthly Consumption Demand Curve">
              <EntityEditModal.Grid>
                <FormField label="Month 1 Demand Qty">
                  <Input
                    type="number"
                    value={form.m1_qty}
                    onChange={(e) => handleFormChange('m1_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Month 2 Demand Qty">
                  <Input
                    type="number"
                    value={form.m2_qty}
                    onChange={(e) => handleFormChange('m2_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Month 3 Demand Qty">
                  <Input
                    type="number"
                    value={form.m3_qty}
                    onChange={(e) => handleFormChange('m3_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Total 90-Day Projected Cashflow (₹)">
                  <Input
                    type="number"
                    value={form.total_amount}
                    readOnly
                    className="bg-surface-muted font-bold text-primary"
                  />
                </FormField>

                <FormField label="Logistics & Delivery Schedule Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.delivery_plan}
                    onChange={(e) => handleFormChange('delivery_plan', e.target.value)}
                    placeholder="Describe batch sizes, trailer schedules, storage space..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="fc-form"
            submitLabel={editingItem ? 'Update Forecast' : 'Save Forecast'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Forecast Line"
        message={`Are you sure you want to delete "${deleteItem?.material_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
