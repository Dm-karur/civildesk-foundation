import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, AlertTriangle, Flame, Clock, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Truck, ArrowRightLeft, ShoppingCart, CheckCircle2, Boxes
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



const EMPTY_FORM = {
  project_id: '',
  material_code: '',
  name: '',
  category: 'Structural Steel',
  current_stock: '0',
  min_buffer_stock: '10',
  daily_burn_rate: '2',
  uom_name: 'MT',
  impacted_activity_code: '',
  impacted_activity_name: '',
  severity: 'Critical Stockout',
  mitigation_action: '',
};

export function MaterialShortagesPage() {
  const [projects, setProjects] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
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
      const saved = localStorage.getItem('mock_planning_MaterialShortagesPage');
      if (saved) {
        setShortages(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_MaterialShortagesPage');
    if (shortages.length > 0 || saved) {
       localStorage.setItem('mock_planning_MaterialShortagesPage', JSON.stringify(shortages));
    }
  }, [shortages]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      material_code: `MAT-ALERT-0${shortages.length + 1}`,
      min_buffer_stock: '20',
      daily_burn_rate: '2.5',
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
      current_stock: String(item.current_stock || '0'),
      min_buffer_stock: String(item.min_buffer_stock || '0'),
      daily_burn_rate: String(item.daily_burn_rate || '1'),
      uom_name: item.uom_name || 'MT',
      impacted_activity_code: item.impacted_activity_code || '',
      impacted_activity_name: item.impacted_activity_name || '',
      severity: item.severity || 'Critical Stockout',
      mitigation_action: item.mitigation_action || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'current_stock' || field === 'daily_burn_rate') {
        const stock = Number(field === 'current_stock' ? value : prev.current_stock) || 0;
        const burn = Number(field === 'daily_burn_rate' ? value : prev.daily_burn_rate) || 1;
        const days = (stock / Math.max(0.1, burn)).toFixed(1);
        if (Number(days) <= 0) next.severity = 'Critical Stockout';
        else if (Number(days) <= 2) next.severity = 'High Risk';
        else next.severity = 'Moderate Warning';
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
      const stock = Number(form.current_stock || 0);
      const burn = Number(form.daily_burn_rate || 1);
      const runway = Math.max(0, stock / Math.max(0.1, burn));

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        material_code: form.material_code,
        name: form.name,
        category: form.category,
        current_stock: stock,
        min_buffer_stock: Number(form.min_buffer_stock || 0),
        daily_burn_rate: burn,
        runway_days: Number(runway.toFixed(1)),
        uom_name: form.uom_name,
        impacted_activity_code: form.impacted_activity_code || 'ACT-GEN',
        impacted_activity_name: form.impacted_activity_name || 'General Construction Work',
        severity: form.severity,
        mitigation_action: form.mitigation_action,
      };

      if (editingItem?.id) {
        setShortages(prev => prev.map(s => s.id === editingItem.id ? newItem : s));
        toast.success('Shortage record updated.');
      } else {
        setShortages(prev => [newItem, ...prev]);
        toast.success('Emergency shortage reported.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save Shortage.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setShortages(prev => prev.filter(s => s.id !== deleteItem.id));
    toast.success('Shortage record removed.');
    setDeleteItem(null);
  };

  const handleExpedite = (item) => {
    toast.success(`Expedite dispatch alert triggered for ${item.material_code}.`);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return shortages.filter(s => {
      if (selectedProjectId !== 'all' && String(s.project_id) !== String(selectedProjectId)) return false;
      if (severityFilter !== 'all' && s.severity !== severityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (s.material_code || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        const act = (s.impacted_activity_name || '').toLowerCase();
        const actCode = (s.impacted_activity_code || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !act.includes(q) && !actCode.includes(q)) return false;
      }
      return true;
    });
  }, [shortages, selectedProjectId, severityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const criticalCount = useMemo(() => shortages.filter(s => s.severity === 'Critical Stockout').length, [shortages]);
  const highRiskCount = useMemo(() => shortages.filter(s => s.severity === 'High Risk').length, [shortages]);
  const stalledActivities = useMemo(() => new Set(shortages.map(s => s.impacted_activity_code)).size, [shortages]);

  const getSeverityVariant = (severity) => {
    if (severity === 'Critical Stockout') return 'error';
    if (severity === 'High Risk') return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Material Shortages' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Shortages & Stockout Control Center"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Critical Stockouts"
            value={criticalCount}
            status="error"
            icon={<Flame className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="High Risk Buffer Shortages"
            value={highRiskCount}
            status="warning"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Stalled / At-Risk Activities"
            value={`${stalledActivities} Critical Tasks`}
            status="error"
            icon={<ShieldAlert className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Shortage Incidents Active"
            value={shortages.length}
            status="neutral"
            icon={<Boxes className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Severity Selector Bar */}
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
                  { value: 'all', label: 'All Severities' },
                  { value: 'Critical Stockout', label: 'Critical Stockout (0-1d)' },
                  { value: 'High Risk', label: 'High Risk (< 3d)' },
                  { value: 'Moderate Warning', label: 'Moderate Warning (< 7d)' },
                ]}
                value={severityFilter}
                onChange={setSeverityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search material, code, impacted task..."
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
              Report Shortage
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
                  <th className="px-3 py-2">Material Description</th>
                  <th className="px-3 py-2 text-right w-24">Stock / Min</th>
                  <th className="px-3 py-2 text-center w-28">Runway Days</th>
                  <th className="px-3 py-2">Impacted Activity & Scope</th>
                  <th className="px-3 py-2 text-center w-28">Severity</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading shortage alerts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No active material shortages found. All buffers healthy.
                    </td>
                  </tr>
                ) : (
                  paged.map((s, idx) => {
                    const isCritical = s.severity === 'Critical Stockout';

                    return (
                      <tr key={s.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                            {s.material_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={s.name}>
                              {s.name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {s.category} • {s.project_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px]">
                          <span className="font-bold text-red-600">{s.current_stock}</span>
                          <span className="text-text-muted text-[10px]"> / {s.min_buffer_stock} {s.uom_name}</span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-[11px]">
                          <span className={isCritical ? 'text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded' : 'text-amber-600'}>
                            {s.runway_days} Days
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-text-primary text-[11px] truncate">
                              {s.impacted_activity_code}: {s.impacted_activity_name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate" title={s.mitigation_action}>
                              {s.mitigation_action}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getSeverityVariant(s.severity)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {s.severity}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Shortage 360"
                              onClick={() => setViewingItem(s)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-red-600 border-red-200 hover:bg-red-50"
                              title="Expedite Dispatch / Transfer"
                              onClick={() => handleExpedite(s)}
                            >
                              <Truck className="w-3 h-3 mr-1" /> Expedite
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(s)}
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
          {paged.map((s, idx) => (
            <div key={s.id || idx} className="bg-surface border border-red-200/60 rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-red-600 block">{s.material_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{s.name}</h4>
                </div>
                <Badge
                  variant={getSeverityVariant(s.severity)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {s.severity}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Stock vs Buffer</span>
                  <span className="font-mono font-bold text-red-600 text-[11px]">{s.current_stock} / {s.min_buffer_stock} {s.uom_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Runway Days</span>
                  <span className="font-mono font-bold text-red-600 text-[11px]">{s.runway_days} Days Left</span>
                </div>
              </div>

              <div className="p-2 bg-surface-muted/30 rounded border border-border/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Stalled Activity</span>
                <span className="font-semibold text-text-primary text-[11px] block">{s.impacted_activity_code}: {s.impacted_activity_name}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{s.project_name}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(s)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-red-600 hover:bg-red-700" onClick={() => handleExpedite(s)}>
                    <Truck className="w-3 h-3 mr-1" /> Expedite
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

      {/* View Shortage Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_code} • {viewingItem.category}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Current Yard Stock</span> <span className="font-mono font-bold text-red-600 text-sm">{viewingItem.current_stock} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Safety Buffer Threshold</span> <span className="font-mono font-bold text-text-primary">{viewingItem.min_buffer_stock} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Daily Burn Rate</span> <span className="font-mono">{viewingItem.daily_burn_rate} {viewingItem.uom_name} / Day</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Stock Runway</span> <span className="font-bold text-red-600 font-mono text-sm">{viewingItem.runway_days} Days Left</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Impacted Critical Path Activity:</span>
                <p className="text-text-secondary font-medium">{viewingItem.impacted_activity_code} — {viewingItem.impacted_activity_name}</p>
              </div>

              {viewingItem.mitigation_action && (
                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 space-y-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-[11px]">Mitigation & Recovery Plan:</span>
                  <p className="text-text-secondary">{viewingItem.mitigation_action}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Shortage Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ShieldAlert}
          title={editingItem ? 'Edit Shortage Record' : 'Report Material Shortage'}
          subtitle="Record site stockouts, buffer depletion, and initiate emergency mitigations."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="shortage-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                    placeholder="e.g. MAT-STEEL-550D-16MM"
                  />
                </FormField>

                <FormField label="Material Name" required className="md:col-span-2" error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g. 16mm Fe550D Primary TMT Steel Rebar"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Stock Levels & Impacted Activities">
              <EntityEditModal.Grid>
                <FormField label="Current Yard Stock">
                  <Input
                    type="number"
                    step="0.1"
                    value={form.current_stock}
                    onChange={(e) => handleFormChange('current_stock', e.target.value)}
                  />
                </FormField>

                <FormField label="Minimum Safety Buffer">
                  <Input
                    type="number"
                    step="0.1"
                    value={form.min_buffer_stock}
                    onChange={(e) => handleFormChange('min_buffer_stock', e.target.value)}
                  />
                </FormField>

                <FormField label="Daily Burn Rate">
                  <Input
                    type="number"
                    step="0.1"
                    value={form.daily_burn_rate}
                    onChange={(e) => handleFormChange('daily_burn_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Impacted Activity Code">
                  <Input
                    value={form.impacted_activity_code}
                    onChange={(e) => handleFormChange('impacted_activity_code', e.target.value)}
                    placeholder="e.g. ACT-0201-COL"
                  />
                </FormField>

                <FormField label="Mitigation / Expediting Action Plan" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.mitigation_action}
                    onChange={(e) => handleFormChange('mitigation_action', e.target.value)}
                    placeholder="Describe emergency transfers, expedited POs, delivery slots..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="shortage-form"
            submitLabel={editingItem ? 'Update Shortage' : 'Report Shortage'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Shortage Record"
        message={`Are you sure you want to delete "${deleteItem?.material_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
