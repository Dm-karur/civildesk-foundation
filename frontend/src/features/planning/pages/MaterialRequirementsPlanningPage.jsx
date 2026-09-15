import { useState, useEffect, useMemo } from 'react';
import {
  Boxes, CheckCircle2, Clock, AlertTriangle, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ShoppingCart,
  Layers, Package, ArrowRight, ShieldCheck, Flame, Scale
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
import { projectsApi } from '../../../api/apiservice';

const MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All Material Categories' },
  { id: 'cement', name: 'Cement, RMC & Aggregates' },
  { id: 'steel', name: 'Reinforcement Steel & TMT Rebar' },
  { id: 'masonry', name: 'AAC Blocks, Bricks & Mortar' },
  { id: 'mep', name: 'MEP Piping, Valves & Electrical' },
  { id: 'chemicals', name: 'Admixtures & Waterproofing' },
];



const EMPTY_FORM = {
  project_id: '',
  material_code: '',
  name: '',
  category_id: 'cement',
  uom_name: 'MT',
  unit_rate: '0',
  gross_planned_qty: '0',
  current_stock_qty: '0',
  on_order_qty: '0',
  lead_time_days: '5',
  approved_brands: '',
};

export function MaterialRequirementsPlanningPage() {
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
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
      const saved = localStorage.getItem('mock_planning_MaterialRequirementsPlanningPage');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_MaterialRequirementsPlanningPage');
    if (items.length > 0 || saved) {
       localStorage.setItem('mock_planning_MaterialRequirementsPlanningPage', JSON.stringify(items));
    }
  }, [items]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      material_code: `MAT-GEN-0${items.length + 1}`,
      unit_rate: '1000',
      gross_planned_qty: '100',
      lead_time_days: '5',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      material_code: item.material_code || '',
      name: item.name || '',
      category_id: item.category_id || 'cement',
      uom_name: item.uom_name || 'MT',
      unit_rate: String(item.unit_rate || '0'),
      gross_planned_qty: String(item.gross_planned_qty || '0'),
      current_stock_qty: String(item.current_stock_qty || '0'),
      on_order_qty: String(item.on_order_qty || '0'),
      lead_time_days: String(item.lead_time_days || '5'),
      approved_brands: item.approved_brands || '',
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
    if (!form.name.trim()) errs.name = 'Material name is required';
    if (!form.material_code.trim()) errs.material_code = 'Material code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const catObj = MATERIAL_CATEGORIES.find(c => c.id === form.category_id);

      const gross = Number(form.gross_planned_qty || 0);
      const stock = Number(form.current_stock_qty || 0);
      const ordered = Number(form.on_order_qty || 0);
      const deficit = Math.max(0, gross - (stock + ordered));

      let newStatus = 'Stock Sufficient';
      if (deficit > 0) {
        newStatus = stock === 0 && ordered === 0 ? 'Critical Shortage' : 'Procurement Required';
      }

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        material_code: form.material_code,
        name: form.name,
        category_id: form.category_id,
        category_name: catObj?.name || 'Construction Material',
        uom_name: form.uom_name,
        unit_rate: Number(form.unit_rate || 0),
        gross_planned_qty: gross,
        current_stock_qty: stock,
        on_order_qty: ordered,
        net_deficit_qty: deficit,
        lead_time_days: Number(form.lead_time_days || 5),
        status: newStatus,
        approved_brands: form.approved_brands,
      };

      if (editingItem?.id) {
        setItems(prev => prev.map(i => i.id === editingItem.id ? newItem : i));
        toast.success('Material requirement updated.');
      } else {
        setItems(prev => [newItem, ...prev]);
        toast.success('Material requirement registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save Material Requirement.');
    } finally {
      setSaving(false);
    }
  };

  const handleRaisePR = (item) => {
    toast.success(`Purchase Requisition initiated for ${item.net_deficit_qty} ${item.uom_name} of ${item.material_code}.`);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (categoryFilter !== 'all' && i.category_id !== categoryFilter) return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (i.material_code || '').toLowerCase();
        const name = (i.name || '').toLowerCase();
        const brands = (i.approved_brands || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !brands.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedProjectId, categoryFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const sufficientCount = useMemo(() => items.filter(i => i.status === 'Stock Sufficient').length, [items]);
  const deficitCount = useMemo(() => items.filter(i => i.status !== 'Stock Sufficient').length, [items]);
  const totalProcurementValuation = useMemo(() => items.reduce((acc, i) => acc + (i.net_deficit_qty * i.unit_rate), 0), [items]);

  const getStatusVariant = (status) => {
    if (status === 'Stock Sufficient') return 'success';
    if (status === 'Procurement Required') return 'warning';
    if (status === 'Critical Shortage') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Material Requirements' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Requirements Planning (MRP)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Tracked Materials"
            value={items.length}
            status="primary"
            icon={<Boxes className="w-4 h-4" />}
          />
          <KpiCard
            label="Stock Sufficient"
            value={sufficientCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Deficit / Indents Required"
            value={deficitCount}
            status={deficitCount > 0 ? 'warning' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Projected Requisition Value"
            value={`₹${(totalProcurementValuation / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
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
                  { value: 'all', label: 'All Stock Status' },
                  { value: 'Stock Sufficient', label: 'Stock Sufficient' },
                  { value: 'Procurement Required', label: 'Procurement Required' },
                  { value: 'Critical Shortage', label: 'Critical Shortage' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search material code, brand, spec..."
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
              Add Material
            </Button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {MATERIAL_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                categoryFilter === cat.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
                  <th className="px-3 py-2">Material Description & Approved Brands</th>
                  <th className="px-3 py-2 text-right w-24">Gross Demand</th>
                  <th className="px-3 py-2 text-right w-24">Yard Stock</th>
                  <th className="px-3 py-2 text-right w-28">Net Deficit</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material requirements...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No material requirement records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((i, idx) => {
                    const hasDeficit = i.net_deficit_qty > 0;

                    return (
                      <tr key={i.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {i.material_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={i.name}>
                              {i.name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {i.category_name} • Brands: {i.approved_brands || 'Standard'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                          {Number(i.gross_planned_qty).toLocaleString('en-IN')} {i.uom_name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-primary text-[11px]">
                          {Number(i.current_stock_qty).toLocaleString('en-IN')} {i.uom_name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                          <span className={hasDeficit ? 'text-red-600' : 'text-emerald-600'}>
                            {hasDeficit ? `-${Number(i.net_deficit_qty).toLocaleString('en-IN')}` : 'Sufficient'} {hasDeficit ? i.uom_name : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(i.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {i.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Details"
                              onClick={() => setViewingItem(i)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {hasDeficit && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-primary"
                                title="Raise Purchase Requisition"
                                onClick={() => handleRaisePR(i)}
                              >
                                <ShoppingCart className="w-3 h-3 mr-1" /> Indent
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(i)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((i, idx) => (
            <div key={i.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{i.material_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{i.name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(i.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {i.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Yard Stock</span>
                  <span className="font-mono text-text-primary text-[11px]">{i.current_stock_qty} / {i.gross_planned_qty} {i.uom_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Deficit Indent</span>
                  <span className={`font-mono font-bold text-[11px] ${i.net_deficit_qty > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {i.net_deficit_qty > 0 ? `-${i.net_deficit_qty} ${i.uom_name}` : 'Stock OK'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{i.category_name}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(i)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {i.net_deficit_qty > 0 && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleRaisePR(i)}>
                      <ShoppingCart className="w-3 h-3 mr-1" /> Indent
                    </Button>
                  )}
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

      {/* View Material Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_code} • {viewingItem.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Gross Demand</span> <span className="font-mono font-bold text-text-primary">{viewingItem.gross_planned_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Current Yard Stock</span> <span className="font-mono text-emerald-600 font-bold">{viewingItem.current_stock_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Open Orders in Transit</span> <span className="font-mono text-sky-600">{viewingItem.on_order_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Deficit Required</span> <span className="font-bold text-red-600 font-mono text-sm">{viewingItem.net_deficit_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Unit Rate</span> <span className="font-mono font-bold text-text-primary">₹{viewingItem.unit_rate} / {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Procurement Lead Time</span> <span className="font-mono text-text-secondary">{viewingItem.lead_time_days} Days</span></div>
              </div>

              {viewingItem.approved_brands && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Consultant Approved Brands / Specifications:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.approved_brands}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Boxes}
          title={editingItem ? 'Edit Material Requirement' : 'Register Material Requirement'}
          subtitle="Define bill of materials demand, yard stock balances, and indent parameters."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="mrp-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
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

                <FormField label="Material Category" required>
                  <Select
                    options={MATERIAL_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id}
                    onChange={(v) => handleFormChange('category_id', v)}
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
                  <Select
                    options={[
                      { value: 'MT', label: 'Metric Tonne (MT)' },
                      { value: 'Bags', label: '50kg Bags' },
                      { value: 'Cu.M', label: 'Cubic Metre (Cu.M)' },
                      { value: 'Sq.M', label: 'Square Metre (Sq.M)' },
                      { value: 'R.M', label: 'Running Metre (R.M)' },
                      { value: 'Ltr', label: 'Litres (Ltr)' },
                    ]}
                    value={form.uom_name}
                    onChange={(v) => handleFormChange('uom_name', v)}
                  />
                </FormField>

                <FormField label="Material Name & Grade" required className="md:col-span-2" error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g. Fe550D High Ductility Primary TMT Rebar (8mm-32mm)"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Demand, Stock & Lead Times">
              <EntityEditModal.Grid>
                <FormField label="Gross Planned BOQ Demand">
                  <Input
                    type="number"
                    value={form.gross_planned_qty}
                    onChange={(e) => handleFormChange('gross_planned_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Current Yard Stock">
                  <Input
                    type="number"
                    value={form.current_stock_qty}
                    onChange={(e) => handleFormChange('current_stock_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Estimated Unit Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Procurement Lead Time (Days)">
                  <Input
                    type="number"
                    value={form.lead_time_days}
                    onChange={(e) => handleFormChange('lead_time_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Approved Brands / Vendor Specs" className="md:col-span-2">
                  <Input
                    value={form.approved_brands}
                    onChange={(e) => handleFormChange('approved_brands', e.target.value)}
                    placeholder="e.g. JSW Steel / Tata Tiscon / SAIL"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="mrp-form"
            submitLabel={editingItem ? 'Update Requirement' : 'Register Material'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
