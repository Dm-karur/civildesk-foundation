import { useState, useEffect, useMemo } from 'react';
import {
  Boxes, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, TrendingUp
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
  material_category: '',
  item_description: '',
  budget_allocation: '50000000',
  po_committed_value: '40000000',
  grn_received_value: '20000000',
  site_consumed_value: '19000000',
  wastage_cost: '200000',
  unit_rate_variance: '0%',
  notes: '',
};

export function MaterialCostsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [materialCosts, setMaterialCosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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
      const saved = localStorage.getItem('mock_finance_MaterialCostsPage');
      if (saved) {
        setMaterialCosts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_finance_MaterialCostsPage');
    if (materialCosts.length > 0 || saved) {
       localStorage.setItem('mock_finance_MaterialCostsPage', JSON.stringify(materialCosts));
    }
  }, [materialCosts]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      material_category: item.material_category || '',
      item_description: item.item_description || '',
      budget_allocation: String(item.budget_allocation || '50000000'),
      po_committed_value: String(item.po_committed_value || '40000000'),
      grn_received_value: String(item.grn_received_value || '20000000'),
      site_consumed_value: String(item.site_consumed_value || '19000000'),
      wastage_cost: String(item.wastage_cost || '200000'),
      unit_rate_variance: item.unit_rate_variance || '0%',
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
    if (!form.material_category.trim()) errs.material_category = 'Material category is required';
    if (!form.item_description.trim()) errs.item_description = 'Item description is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const bud = Number(form.budget_allocation || 0);
      const po = Number(form.po_committed_value || 0);
      const grn = Number(form.grn_received_value || 0);
      const con = Number(form.site_consumed_value || 0);
      const wst = Number(form.wastage_cost || 0);

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        material_category: form.material_category,
        item_description: form.item_description,
        budget_allocation: bud,
        po_committed_value: po,
        grn_received_value: grn,
        site_consumed_value: con,
        wastage_cost: wst,
        unit_rate_variance: form.unit_rate_variance,
        status: 'Optimal (Within Limits)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setMaterialCosts(prev => prev.map(m => m.id === editingItem.id ? newItem : m));
        toast.success('Material cost ledger updated.');
      } else {
        setMaterialCosts(prev => [newItem, ...prev]);
        toast.success('Material cost category registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save material cost item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setMaterialCosts(prev => prev.filter(m => m.id !== deleteItem.id));
    toast.success('Material cost record removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return materialCosts.filter(m => {
      if (selectedProjectId !== 'all' && String(m.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const cat = String(m.material_category || '').toLowerCase();
        const desc = String(m.item_description || '').toLowerCase();
        const proj = String(m.project_name || '').toLowerCase();
        if (!cat.includes(s) && !desc.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [materialCosts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalPOCommitted = useMemo(() => materialCosts.reduce((acc, m) => acc + Number(m.po_committed_value || 0), 0), [materialCosts]);
  const totalConsumedValue = useMemo(() => materialCosts.reduce((acc, m) => acc + Number(m.site_consumed_value || 0), 0), [materialCosts]);
  const totalWastageValue = useMemo(() => materialCosts.reduce((acc, m) => acc + Number(m.wastage_cost || 0), 0), [materialCosts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Material Cost Ledger' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Procurement & Consumption Cost Ledger"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total PO Committed"
            value={`₹${(totalPOCommitted / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Site Consumed to Date"
            value={`₹${(totalConsumedValue / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<Boxes className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Wastage & Scrap Cost"
            value={`₹${(totalWastageValue / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Wastage Efficiency"
            value="1.42% (Under 2% Limit)"
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
                placeholder="Search material category, item..."
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
              title="Print Material Cost Ledger"
            >
              Print Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Material Cost Head
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
                  <th className="px-3 py-2">Material Category & Description</th>
                  <th className="px-3 py-2 text-right w-28">Budget Allocation</th>
                  <th className="px-3 py-2 text-right w-28">PO Committed</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">GRN Received</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600 font-bold">Site Consumed</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell text-amber-600">Wastage</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material cost ledger...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No material cost items found.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={m.material_category}>
                            {m.material_category}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {m.item_description} • {m.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(m.budget_allocation / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(m.po_committed_value / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(m.grn_received_value / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(m.site_consumed_value / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{(m.wastage_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Material 360"
                            onClick={() => setViewingItem(m)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(m)}
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
          {paged.map((m, idx) => (
            <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.material_category}</h4>
                  <span className="text-[11px] text-text-muted">{m.item_description}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(m.site_consumed_value / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">PO Committed</span>
                  <span className="font-mono text-text-secondary text-[11px]">₹{(m.po_committed_value / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Consumed to Date</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(m.site_consumed_value / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(m)}>
                  <Eye className="w-3 h-3 mr-1" /> View Material Cost
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

      {/* View Material 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.material_category}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.item_description}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Site Consumed Value</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.site_consumed_value / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GRN Received Value</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.grn_received_value / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">PO Committed Sum</span> <span className="font-mono">₹{(viewingItem.po_committed_value / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Wastage / Scrap Loss</span> <span className="font-mono font-bold text-amber-600">₹{(viewingItem.wastage_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Rate Index Fluctuation</span> <span className="font-mono text-primary font-medium">{viewingItem.unit_rate_variance}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Consumption Status</span> <span className="text-emerald-700 font-medium">{viewingItem.status}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Procurement Audit Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Material Cost Sheet
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Boxes}
          title={editingItem ? 'Edit Material Cost Item' : 'Add Material Cost Item'}
          subtitle="Record procurement commitment, delivered GRN and site consumption values."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="mat-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Material Head Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Material Category" required error={errors.material_category}>
                  <Input
                    value={form.material_category}
                    onChange={(e) => handleFormChange('material_category', e.target.value)}
                    placeholder="e.g. TMT Reinforcement Steel"
                  />
                </FormField>

                <FormField label="Item Description / Grade" required error={errors.item_description} className="md:col-span-2">
                  <Input
                    value={form.item_description}
                    onChange={(e) => handleFormChange('item_description', e.target.value)}
                    placeholder="e.g. Fe 550D TMT Rebars (8mm - 32mm)"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Valuation">
              <EntityEditModal.Grid>
                <FormField label="Budget Allocation (₹)" required>
                  <Input
                    type="number"
                    value={form.budget_allocation}
                    onChange={(e) => handleFormChange('budget_allocation', e.target.value)}
                  />
                </FormField>

                <FormField label="PO Committed Value (₹)">
                  <Input
                    type="number"
                    value={form.po_committed_value}
                    onChange={(e) => handleFormChange('po_committed_value', e.target.value)}
                  />
                </FormField>

                <FormField label="GRN Received Value (₹)">
                  <Input
                    type="number"
                    value={form.grn_received_value}
                    onChange={(e) => handleFormChange('grn_received_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Site Consumed Value (₹)">
                  <Input
                    type="number"
                    value={form.site_consumed_value}
                    onChange={(e) => handleFormChange('site_consumed_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Wastage / Scrap Loss (₹)">
                  <Input
                    type="number"
                    value={form.wastage_cost}
                    onChange={(e) => handleFormChange('wastage_cost', e.target.value)}
                  />
                </FormField>

                <FormField label="Market Rate Fluctuation Index">
                  <Input
                    value={form.unit_rate_variance}
                    onChange={(e) => handleFormChange('unit_rate_variance', e.target.value)}
                    placeholder="+1.5% Steel Index"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="mat-form"
            submitLabel={editingItem ? 'Update Item' : 'Save Material Head'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Material Item"
        message={`Are you sure you want to delete "${deleteItem?.material_category}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
