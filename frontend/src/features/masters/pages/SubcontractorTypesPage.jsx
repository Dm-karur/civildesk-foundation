import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Briefcase, Plus, Edit, Trash2, ShieldCheck, FileText, Eye, 
  ArrowUp, ArrowDown, Check, X, Layers, RefreshCw, AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { getSubcontractorTypes, saveSubcontractorTypes } from '../utils/subcontractorTypes';
import { subcontractorTypesApi } from '../../../api/apiservice';

const EMPTY_TYPE_FORM = {
  type_code: '',
  type_name: '',
  description: '',
  is_active: '1',
};

const EMPTY_TEMPLATE_FORM = {
  sort_order: 1,
  item_description: '',
  classification: 'manpower',
  unit: 'Nos',
  default_rate: '0.00',
  maistry_scope: 0,
  status: 1,
};

const CLASSIFICATION_OPTIONS = [
  { value: 'manpower', label: 'Manpower' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'expense', label: 'Expense' },
  { value: 'others', label: 'Others' },
];

const UNIT_OPTIONS = [
  { value: 'Nos', label: 'Nos' },
  { value: 'Day', label: 'Day' },
  { value: 'Shift', label: 'Shift' },
  { value: 'Hours', label: 'Hours' },
  { value: 'Sq.ft', label: 'Sq.ft' },
  { value: 'Cu.m', label: 'Cu.m' },
  { value: 'Rft', label: 'Rft' },
  { value: 'Trip', label: 'Trip' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Ton', label: 'Ton' },
  { value: 'Ls', label: 'Lumpsum (Ls)' },
];

export function SubcontractorTypesPage() {
  const [types, setTypes] = useState(() => getSubcontractorTypes());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Type Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_TYPE_FORM);
  const [errors, setErrors] = useState({});

  // Template Management Modal States
  const [selectedTypeForTemplates, setSelectedTypeForTemplates] = useState(null);
  const [templateItems, setTemplateItems] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Add / Edit Template Item Modal States
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);
  const [templateErrors, setTemplateErrors] = useState({});
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);

  // Fetch Types from Backend API
  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await subcontractorTypesApi.list();
      const list = res?.data?.types || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const formatted = list.map((t) => ({
          id: t.id,
          type_code: t.type_code || t.contractor_type_code || `SUB-${t.id}`,
          type_name: t.type_name || t.contractor_type_name || '',
          description: t.description || '',
          is_active: Number(t.is_active) === 1 ? 1 : 0,
          template_count: Number(t.template_count || 0),
        }));
        setTypes(formatted);
        saveSubcontractorTypes(formatted);
      }
    } catch (err) {
      console.warn('Could not load types from server, using local fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Fetch Templates for a specific Subcontractor Type
  const fetchTemplates = useCallback(async (typeId) => {
    if (!typeId) return;
    try {
      setLoadingTemplates(true);
      const res = await subcontractorTypesApi.templates(typeId);
      const items = res?.data?.templates || res?.data || [];
      if (Array.isArray(items)) {
        const sorted = items.map((it, idx) => ({
          ...it,
          sort_order: it.sort_order !== undefined && it.sort_order !== null ? Number(it.sort_order) : idx + 1,
          default_rate: parseFloat(it.default_rate || 0).toFixed(2),
          maistry_scope: Number(it.maistry_scope) === 1 ? 1 : 0,
          status: Number(it.status) === 1 ? 1 : 0,
        })).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
        setTemplateItems(sorted);
      }
    } catch (err) {
      console.warn('Could not load templates from server, falling back to local storage:', err);
      try {
        const local = JSON.parse(localStorage.getItem(`sc_templates_${typeId}`) || '[]');
        setTemplateItems(local);
      } catch {
        setTemplateItems([]);
      }
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Open Template Manager
  const handleOpenTemplateManager = (typeItem) => {
    setSelectedTypeForTemplates(typeItem);
    setTemplateSearchQuery('');
    fetchTemplates(typeItem.id);
  };

  // Open Add Template Item Modal
  const handleOpenAddTemplate = (typeItem = selectedTypeForTemplates) => {
    const nextOrder = templateItems.length > 0 
      ? Math.max(...templateItems.map(t => Number(t.sort_order) || 0)) + 1 
      : 1;

    setEditingTemplate(null);
    setTemplateForm({
      ...EMPTY_TEMPLATE_FORM,
      sort_order: nextOrder,
    });
    setTemplateErrors({});
    setIsTemplateFormOpen(true);
  };

  // Open Edit Template Item Modal
  const handleOpenEditTemplate = (item) => {
    setEditingTemplate(item);
    setTemplateForm({
      sort_order: item.sort_order || 1,
      item_description: item.item_description || item.description || '',
      classification: item.classification || 'manpower',
      unit: item.unit || item.uom || 'Nos',
      default_rate: item.default_rate || '0.00',
      maistry_scope: Number(item.maistry_scope) === 1 ? 1 : 0,
      status: Number(item.status) === 1 ? 1 : 0,
    });
    setTemplateErrors({});
    setIsTemplateFormOpen(true);
  };

  // Save Template Item (Create or Update in DB)
  const handleSaveTemplateItem = async (e) => {
    e.preventDefault();
    if (!selectedTypeForTemplates) return;

    const errs = {};
    if (!templateForm.item_description.trim()) {
      errs.item_description = 'Item description is required';
    }
    if (Object.keys(errs).length > 0) {
      setTemplateErrors(errs);
      return;
    }

    const payload = {
      sort_order: Number(templateForm.sort_order) || 1,
      item_description: templateForm.item_description.trim(),
      classification: templateForm.classification,
      unit: templateForm.unit.trim() || 'Nos',
      default_rate: parseFloat(templateForm.default_rate || 0),
      maistry_scope: Number(templateForm.maistry_scope) === 1 ? 1 : 0,
      status: Number(templateForm.status) === 1 ? 1 : 0,
    };

    setSavingTemplate(true);
    try {
      if (editingTemplate?.id) {
        await subcontractorTypesApi.updateTemplate(selectedTypeForTemplates.id, editingTemplate.id, payload);
        toast.success('Template item updated successfully.');
      } else {
        await subcontractorTypesApi.createTemplate(selectedTypeForTemplates.id, payload);
        toast.success('Template item added successfully.');
      }
      setIsTemplateFormOpen(false);
      setEditingTemplate(null);
      await fetchTemplates(selectedTypeForTemplates.id);
      fetchTypes();
    } catch (err) {
      console.error('Failed to save template item:', err);
      if (editingTemplate?.id) {
        setTemplateItems(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...payload } : t));
      } else {
        const newId = templateItems.length > 0 ? Math.max(...templateItems.map(t => t.id)) + 1 : 1;
        setTemplateItems(prev => [...prev, { id: newId, ...payload }]);
      }
      toast.success('Template item saved.');
      setIsTemplateFormOpen(false);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Delete Template Item
  const handleConfirmDeleteTemplate = async () => {
    if (!deletingTemplate?.id || !selectedTypeForTemplates?.id) return;
    try {
      await subcontractorTypesApi.deleteTemplate(selectedTypeForTemplates.id, deletingTemplate.id);
      toast.success('Template item removed successfully.');
      await fetchTemplates(selectedTypeForTemplates.id);
      fetchTypes();
    } catch (err) {
      console.error('Failed to delete template item:', err);
      setTemplateItems(prev => prev.filter(t => t.id !== deletingTemplate.id));
      toast.success('Template item removed.');
    } finally {
      setDeletingTemplate(null);
    }
  };

  // Reorder template items up or down
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= templateItems.length) return;

    const updated = [...templateItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate sequential sort orders
    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));
    setTemplateItems(reordered);

    try {
      const itemIds = reordered.map(it => it.id);
      await subcontractorTypesApi.reorderTemplates(selectedTypeForTemplates.id, itemIds);
    } catch (err) {
      console.warn('Reorder sync error, kept in local state:', err);
    }
  };

  // Subcontractor Type Form Handlers
  const handleOpenAddType = () => {
    setForm({ ...EMPTY_TYPE_FORM });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEditType = (item) => {
    setForm({
      type_code: item.type_code || '',
      type_name: item.type_name || '',
      description: item.description || '',
      is_active: item.is_active ? '1' : '0',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleSubmitType = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.type_name.trim()) errs.type_name = 'Type Name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      type_code: form.type_code || `SUB-${Math.floor(Math.random() * 10000)}`,
      type_name: form.type_name.trim(),
      description: form.description.trim(),
      is_active: form.is_active === '1' ? 1 : 0,
    };

    try {
      if (editingItem?.id) {
        await subcontractorTypesApi.update(editingItem.id, payload);
        toast.success('Subcontractor Type updated successfully.');
      } else {
        await subcontractorTypesApi.create(payload);
        toast.success('Subcontractor Type created successfully.');
      }
      fetchTypes();
    } catch (err) {
      console.warn('Backend update failed, using local state:', err);
      if (editingItem?.id) {
        setTypes(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...payload } : t));
      } else {
        const newId = types.length > 0 ? Math.max(...types.map(t => t.id)) + 1 : 1;
        setTypes(prev => [{ id: newId, ...payload, template_count: 0 }, ...prev]);
      }
      toast.success('Subcontractor Type saved.');
    }

    setIsAddOpen(false);
    setEditingItem(null);
  };

  const confirmDeleteType = async () => {
    if (!deletingItem?.id) return;
    try {
      await subcontractorTypesApi.delete(deletingItem.id);
      toast.success('Subcontractor Type deleted successfully.');
      fetchTypes();
    } catch (err) {
      console.warn('Delete failed, removing locally:', err);
      setTypes(prev => prev.filter(t => t.id !== deletingItem.id));
      toast.success('Subcontractor Type deleted.');
    } finally {
      setDeletingItem(null);
    }
  };

  // Filtered Subcontractor Types
  const filteredTypes = useMemo(() => {
    if (!searchQuery) return types;
    const lower = searchQuery.toLowerCase();
    return types.filter((t) =>
      (t.type_code || '').toLowerCase().includes(lower) ||
      (t.type_name || '').toLowerCase().includes(lower) ||
      (t.description || '').toLowerCase().includes(lower)
    );
  }, [types, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / perPage));
  const pagedTypes = filteredTypes.slice((page - 1) * perPage, page * perPage);

  const activeCount = types.filter((t) => t.is_active).length;
  const totalCount = types.length;

  // Filtered Templates inside manager modal
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templateItems;
    const q = templateSearchQuery.toLowerCase();
    return templateItems.filter(
      (item) =>
        (item.item_description || '').toLowerCase().includes(q) ||
        (item.classification || '').toLowerCase().includes(q) ||
        (item.unit || '').toLowerCase().includes(q)
    );
  }, [templateItems, templateSearchQuery]);

  // Classification styling helper
  const getClassificationBadge = (classification) => {
    const norm = (classification || 'manpower').toLowerCase();
    switch (norm) {
      case 'manpower':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Manpower
          </span>
        );
      case 'equipment':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Equipment
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Expense
          </span>
        );
      case 'others':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Others
          </span>
        );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractor Types"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters', href: '/masters/project-types' },
          { label: 'Subcontractor Types' },
        ]}
      />

      <div className="flex w-full flex-col gap-3 sm:gap-4">
        {/* KPI Ribbons */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 sm:gap-3">
          <KpiCard label="Total Types" value={totalCount} icon={<Briefcase />} status="info" />
          <KpiCard label="Active Types" value={activeCount} icon={<ShieldCheck className="text-emerald-500" />} status="success" />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-stretch justify-between gap-2.5 rounded-lg border border-border bg-surface p-2.5 shadow-xs sm:flex-row sm:items-center sm:p-3">
          <div className="w-full sm:w-64">
            <SearchField
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={fetchTypes}
              className="h-8 text-xs"
              title="Refresh from database"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleOpenAddType}
              className="h-8 text-xs shadow-xs"
            >
              Add Subcontractor Type
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredTypes.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            }
          >
            <table className="w-full table-auto text-left text-[12px]">
              <thead className="border-b border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="w-10 px-3 py-2 text-center">#</th>
                  <th className="w-28 px-3 py-2">Code</th>
                  <th className="px-3 py-2">Type Name</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="w-36 px-3 py-2 text-center">Template Items</th>
                  <th className="w-24 px-3 py-2 text-center">Status</th>
                  <th className="w-32 px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[12px] text-text-muted">
                      Loading subcontractor types...
                    </td>
                  </tr>
                ) : pagedTypes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[12px] text-text-muted">
                      No subcontractor types found.
                    </td>
                  </tr>
                ) : (
                  pagedTypes.map((item, idx) => (
                    <tr key={item.id} className="group transition-colors hover:bg-surface-muted/30">
                      <td className="px-3 py-2 text-center text-[11px] font-medium text-text-primary">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {item.type_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate" title={item.type_name}>
                          {item.type_name}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="block truncate text-[11px] text-text-secondary" title={item.description}>
                          {item.description || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenTemplateManager(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-primary bg-primary/5 hover:bg-primary/15 border border-primary/20 transition-colors"
                          title="Manage template line items for this subcontractor type"
                        >
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          <span>Template Items ({item.template_count ?? 0})</span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge 
                          variant={item.is_active ? 'success' : 'neutral'}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Manage Template Items"
                            onClick={() => handleOpenTemplateManager(item)}
                          >
                            <Layers className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEditType(item)}
                          >
                            <Edit className="h-3.5 w-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-text-secondary hover:text-red-500" />
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

        {/* Mobile View - Cards List (< sm) */}
        <div className="block sm:hidden space-y-3">
          {pagedTypes.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{item.type_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{item.type_name}</h4>
                </div>
                <Badge 
                  variant={item.is_active ? 'success' : 'neutral'}
                  className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="text-xs pt-1 border-t border-border/60 text-text-secondary">
                <span className="block text-[10px] uppercase font-bold text-text-muted mb-1">Description</span>
                {item.description || 'No description provided'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[11px] px-2 text-blue-600 border-blue-200 bg-blue-50" 
                  onClick={() => handleOpenTemplateManager(item)}
                >
                  <Layers className="w-3 h-3 mr-1" /> Template Items ({item.template_count ?? 0})
                </Button>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEditType(item)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-red-500 hover:text-red-600 border-border" onClick={() => setDeletingItem(item)}>
                    <Trash2 className="w-3 h-3" />
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
              totalItems={filteredTypes.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TEMPLATE ITEMS MANAGEMENT MODAL (EXACT SPECIFIED COLUMNS) */}
      {/* ========================================================= */}
      {selectedTypeForTemplates && (
        <EntityEditModal
          isOpen={!!selectedTypeForTemplates}
          onClose={() => setSelectedTypeForTemplates(null)}
          size="5xl"
        >
          <EntityEditModal.Header
            icon={Layers}
            title={`Template Items — ${selectedTypeForTemplates.type_name}`}
            subtitle={`Manage standard template line items, default rates, and classifications stored in database for ${selectedTypeForTemplates.type_name} (${selectedTypeForTemplates.type_code}).`}
            onClose={() => setSelectedTypeForTemplates(null)}
          />
          <EntityEditModal.Body>
            <div className="space-y-3">
              {/* Header Controls inside Template modal */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-surface-muted/50 p-2.5 rounded-lg border border-border">
                <div className="w-full sm:w-72">
                  <SearchField
                    placeholder="Search template items..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => fetchTemplates(selectedTypeForTemplates.id)}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    title="Refresh template items"
                  >
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => handleOpenAddTemplate(selectedTypeForTemplates)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Template Item
                  </Button>
                </div>
              </div>

              {/* Template Items Table: Order | Item Description | Classification | Unit | Default Rate (₹) | Maistry Scope | Status | Action */}
              <div className="overflow-x-auto border border-border rounded-lg bg-surface shadow-xs">
                <table className="w-full table-auto text-left text-[12px]">
                  <thead className="border-b border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th className="w-20 px-3 py-2.5 text-center">Order</th>
                      <th className="px-3 py-2.5 min-w-[180px]">Item Description</th>
                      <th className="w-36 px-3 py-2.5">Classification</th>
                      <th className="w-24 px-3 py-2.5 text-center">Unit</th>
                      <th className="w-32 px-3 py-2.5 text-right">Default Rate (₹)</th>
                      <th className="w-28 px-3 py-2.5 text-center">Maistry Scope</th>
                      <th className="w-24 px-3 py-2.5 text-center">Status</th>
                      <th className="w-24 px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingTemplates ? (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-[12px] text-text-muted">
                          Loading template items from database...
                        </td>
                      </tr>
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-text-muted">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Layers className="h-8 w-8 text-border" />
                            <p className="text-[13px] font-medium text-text-secondary">
                              No template items found for {selectedTypeForTemplates.type_name}.
                            </p>
                            <p className="text-[11px] text-text-muted">
                              Add standard items (manpower, equipment, expenses, others) with sort order and default rates.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs"
                              leftIcon={<Plus className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenAddTemplate(selectedTypeForTemplates)}
                            >
                              Add First Template Item
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((item, index) => (
                        <tr key={item.id} className="group transition-colors hover:bg-surface-muted/40">
                          {/* 1. Order (Short Order with move controls) */}
                          <td className="px-3 py-2.5 text-center">
                            <div className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-text-primary bg-surface-muted/60 px-2 py-0.5 rounded border border-border">
                              <span>#{item.sort_order}</span>
                              <div className="flex flex-col ml-1 -my-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveOrder(index, 'up')}
                                  className="text-text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === filteredTemplates.length - 1}
                                  onClick={() => handleMoveOrder(index, 'down')}
                                  className="text-text-muted hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 2. Item Description */}
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-text-primary text-[13px] block leading-snug">
                              {item.item_description || item.description}
                            </span>
                          </td>

                          {/* 3. Classification (manpower, equipment, expense, others) */}
                          <td className="px-3 py-2.5">
                            {getClassificationBadge(item.classification)}
                          </td>

                          {/* 4. Unit */}
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-block font-medium text-[11px] text-text-secondary bg-surface-muted px-2 py-0.5 rounded border border-border">
                              {item.unit || item.uom || 'Nos'}
                            </span>
                          </td>

                          {/* 5. Default Rate (₹) */}
                          <td className="px-3 py-2.5 text-right font-mono text-[12px] font-bold text-text-primary">
                            ₹{Number(item.default_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* 6. Maistry Scope (Yes or No) */}
                          <td className="px-3 py-2.5 text-center">
                            {Number(item.maistry_scope) === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                <X className="w-3 h-3 text-slate-400" /> No
                              </span>
                            )}
                          </td>

                          {/* 7. Status (Active or Inactive) */}
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              variant={Number(item.status) === 1 ? 'success' : 'neutral'}
                              className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                            >
                              {Number(item.status) === 1 ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>

                          {/* 8. Action */}
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-text-secondary hover:text-primary"
                                title="Edit item"
                                onClick={() => handleOpenEditTemplate(item)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-text-secondary hover:text-red-500"
                                title="Delete item"
                                onClick={() => setDeletingTemplate(item)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-text-muted">
                Total {filteredTemplates.length} item{filteredTemplates.length === 1 ? '' : 's'} stored in database.
              </span>
              <Button variant="outline" onClick={() => setSelectedTypeForTemplates(null)}>
                Close
              </Button>
            </div>
          </EntityEditModal.Footer>
        </EntityEditModal>
      )}

      {/* ========================================================= */}
      {/* 2. ADD / EDIT TEMPLATE ITEM MODAL                         */}
      {/* ========================================================= */}
      <EntityEditModal
        isOpen={isTemplateFormOpen}
        onClose={() => setIsTemplateFormOpen(false)}
        size="lg"
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingTemplate ? 'Edit Template Item' : 'Add Template Item'}
          subtitle={`Configure template item for ${selectedTypeForTemplates?.type_name || ''} to store in database.`}
          onClose={() => setIsTemplateFormOpen(false)}
        />
        <form onSubmit={handleSaveTemplateItem} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Template Item Details">
              <EntityEditModal.Grid>
                {/* Short Order */}
                <FormField label="Order (Sort Sequence)" required>
                  <Input
                    type="number"
                    min="1"
                    value={templateForm.sort_order}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, sort_order: parseInt(e.target.value, 10) || 1 }))}
                    placeholder="1"
                  />
                </FormField>

                {/* Classification: manpower, equipment, expense, others */}
                <FormField label="Classification" required>
                  <Select
                    options={CLASSIFICATION_OPTIONS}
                    value={templateForm.classification}
                    onChange={(val) => setTemplateForm(prev => ({ ...prev, classification: val }))}
                  />
                </FormField>

                {/* Item Description */}
                <div className="sm:col-span-2">
                  <FormField label="Item Description" error={templateErrors.item_description} required>
                    <Input
                      placeholder="e.g. Mason (1st Class), Scaffolding Set, Concrete Mixer"
                      value={templateForm.item_description}
                      onChange={(e) => {
                        setTemplateForm(prev => ({ ...prev, item_description: e.target.value }));
                        setTemplateErrors(prev => ({ ...prev, item_description: null }));
                      }}
                    />
                  </FormField>
                </div>

                {/* Unit */}
                <FormField label="Unit">
                  <Select
                    options={UNIT_OPTIONS}
                    value={templateForm.unit}
                    onChange={(val) => setTemplateForm(prev => ({ ...prev, unit: val }))}
                  />
                </FormField>

                {/* Default Rate (₹) */}
                <FormField label="Default Rate (₹)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={templateForm.default_rate}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, default_rate: e.target.value }))}
                  />
                </FormField>

                {/* Maistry Scope (Yes or No) */}
                <div className="sm:col-span-2 p-3 bg-surface-muted/40 rounded-lg border border-border">
                  <label className="text-xs font-semibold text-text-primary block mb-2">
                    Maistry Scope (Include in Maistry calculation?)
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="maistry_scope"
                        checked={Number(templateForm.maistry_scope) === 1}
                        onChange={() => setTemplateForm(prev => ({ ...prev, maistry_scope: 1 }))}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-medium text-text-primary">Yes (In Scope)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="maistry_scope"
                        checked={Number(templateForm.maistry_scope) === 0}
                        onChange={() => setTemplateForm(prev => ({ ...prev, maistry_scope: 0 }))}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-medium text-text-secondary">No (Excluded)</span>
                    </label>
                  </div>
                </div>

                {/* Status: Active / Inactive */}
                <FormField label="Status">
                  <Select
                    options={[
                      { value: 1, label: 'Active' },
                      { value: 0, label: 'Inactive' },
                    ]}
                    value={templateForm.status}
                    onChange={(val) => setTemplateForm(prev => ({ ...prev, status: Number(val) }))}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTemplateFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingTemplate}>
              {editingTemplate ? 'Save Changes' : 'Create Template Item'}
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>

      {/* ========================================================= */}
      {/* 3. ADD / EDIT SUBCONTRACTOR TYPE MODAL                    */}
      {/* ========================================================= */}
      <EntityEditModal
        isOpen={isAddOpen || !!editingItem}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={Briefcase}
          title={editingItem ? 'Edit Subcontractor Type' : 'Add Subcontractor Type'}
          subtitle="Define subcontractor type categories and their specializations."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form onSubmit={handleSubmitType} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Type Details">
              <EntityEditModal.Grid>
                <FormField label="Type Code" required>
                  <Input
                    value={editingItem ? form.type_code : 'Auto-generated'}
                    disabled
                    className="font-mono text-text-muted bg-surface-muted cursor-not-allowed"
                  />
                </FormField>
                <FormField label="Type Name" error={errors.type_name} required>
                  <Input
                    placeholder="e.g. Maistry, Carpenter, Centering"
                    value={form.type_name}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, type_name: e.target.value }));
                      setErrors(prev => ({ ...prev, type_name: null }));
                    }}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Description">
                    <Textarea
                      placeholder="Enter detailed description..."
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </FormField>
                </div>

                <FormField label="Status" error={errors.is_active}>
                  <Select
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' },
                    ]}
                    value={form.is_active}
                    onChange={(value) => setForm(prev => ({ ...prev, is_active: value }))}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Save Changes' : 'Create Type'}
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>

      {/* Delete Type Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title="Delete Subcontractor Type"
        message={`Are you sure you want to delete ${deletingItem?.type_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={confirmDeleteType}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Delete Template Item Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTemplate}
        title="Delete Template Item"
        message={`Are you sure you want to delete "${deletingTemplate?.item_description || deletingTemplate?.description}" from database?`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleConfirmDeleteTemplate}
        onCancel={() => setDeletingTemplate(null)}
      />
    </PageContainer>
  );
}
