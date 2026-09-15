import { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle, Eye, Tag } from 'lucide-react';
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
import { materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  material_category_id: '',
  base_uom_id: '',
  material_code: '',
  material_name: '',
  specification: '',
  brand_preference: '',
  hsn_code: '',
  gst_rate: '18',
  standard_rate: '0',
  minimum_stock_qty: '0',
  reorder_qty: '0',
  storage_location_hint: '',
  quality_check_required: '0',
  batch_tracking_required: '0',
  is_active: '1',
  notes: '',
};

export function MaterialCataloguePage() {
  const { hasPermission } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMaterials, resCategories, resMasters] = await Promise.all([
        materialsApi.catalogue.list(),
        materialsApi.categories.list(),
        materialsApi.masters(),
      ]);

      const matList = resMaterials?.data?.materials ?? resMaterials?.materials ?? (Array.isArray(resMaterials) ? resMaterials : []);
      setMaterials(Array.isArray(matList) ? matList : []);

      const catList = resCategories?.data?.material_categories ?? resCategories?.material_categories ?? [];
      setCategories(Array.isArray(catList) ? catList : []);

      const uomList = resMasters?.data?.masters?.units ?? resMasters?.masters?.units ?? [];
      setUoms(Array.isArray(uomList) ? uomList : []);
    } catch (err) {
      toast.error('Failed to load material catalogue data.');
      setMaterials([]);
      setCategories([]);
      setUoms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({
      ...EMPTY_FORM,
      material_category_id: categories[0]?.id ? String(categories[0].id) : '',
      base_uom_id: uoms[0]?.id ? String(uoms[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      material_category_id: String(item.material_category_id || ''),
      base_uom_id: String(item.base_uom_id || ''),
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      specification: item.specification || '',
      brand_preference: item.brand_preference || '',
      hsn_code: item.hsn_code || '',
      gst_rate: String(item.gst_rate ?? '18'),
      standard_rate: String(item.standard_rate ?? '0'),
      minimum_stock_qty: String(item.minimum_stock_qty ?? '0'),
      reorder_qty: String(item.reorder_qty ?? '0'),
      storage_location_hint: item.storage_location_hint || '',
      quality_check_required: item.quality_check_required ? '1' : '0',
      batch_tracking_required: item.batch_tracking_required ? '1' : '0',
      is_active: item.is_active ? '1' : '0',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrs = {};

    if (!form.material_name.trim()) validationErrs.material_name = 'Material name is required.';
    if (!form.material_code.trim()) validationErrs.material_code = 'Material code is required.';
    if (!form.material_category_id) validationErrs.material_category_id = 'Category is required.';
    if (!form.base_uom_id) validationErrs.base_uom_id = 'Base UOM is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        material_category_id: Number(form.material_category_id),
        base_uom_id: Number(form.base_uom_id),
        material_code: form.material_code.toUpperCase().trim(),
        material_name: form.material_name.trim(),
        specification: form.specification.trim() || null,
        brand_preference: form.brand_preference.trim() || null,
        hsn_code: form.hsn_code.trim() || null,
        gst_rate: Number(form.gst_rate || 0),
        standard_rate: Number(form.standard_rate || 0),
        minimum_stock_qty: Number(form.minimum_stock_qty || 0),
        reorder_qty: Number(form.reorder_qty || 0),
        storage_location_hint: form.storage_location_hint.trim() || null,
        quality_check_required: Number(form.quality_check_required),
        batch_tracking_required: Number(form.batch_tracking_required),
        is_active: Number(form.is_active),
        notes: form.notes.trim() || null,
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await materialsApi.catalogue.update(editingItem.id, payload);
        toast.success('Material catalogue item updated successfully.');
      } else {
        await materialsApi.catalogue.create(payload);
        toast.success('Material catalogue item created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save material catalogue item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await materialsApi.catalogue.remove(deletingItem.id);
      toast.success('Material item removed from catalogue.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete material item.');
    }
  };

  // Filters & Search
  const filtered = useMemo(() => {
    return materials.filter((item) => {
      if (categoryFilter !== 'all' && String(item.material_category_id) !== categoryFilter) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.material_name || '').toLowerCase().includes(q) ||
        String(item.material_code || '').toLowerCase().includes(q) ||
        String(item.specification || '').toLowerCase().includes(q) ||
        String(item.brand_preference || '').toLowerCase().includes(q)
      );
    });
  }, [materials, searchQuery, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCount = materials.length;
  const activeCount = materials.filter(m => m.is_active).length;
  const minStockAlerts = materials.filter(m => Number(m.stock_qty || 0) < Number(m.minimum_stock_qty || 0)).length;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Material Catalogue' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Material Catalogue" breadcrumbs={breadcrumbs} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Catalogue Items" value={totalCount} icon={<Package />} status="primary" />
        <KpiCard label="Active Items" value={activeCount} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Low Stock Items" value={minStockAlerts} icon={<HelpCircle />} status="warning" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-[260px]">
              <SearchField
                placeholder="Search material code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map((c) => ({ value: String(c.id), label: `${c.category_name} (${c.category_code})` }))
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('materials.manage_master') && (
              <Button
                variant="primary"
                className="h-9 px-3 text-[13px]"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
              >
                Add Material
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalResults={filtered.length}
              pageSize={perPage}
              onPageChange={setPage}
            />
          }
        >
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-12 text-center">#</th>
                <th className="px-3 py-2 w-28">Code</th>
                <th className="px-3 py-2 w-48">Material Name</th>
                <th className="px-3 py-2 w-32">UOM</th>
                <th className="px-3 py-2 w-32 text-right">Standard Rate</th>
                <th className="px-3 py-2 w-28 text-center">GST %</th>
                <th className="px-3 py-2 hidden md:table-cell">Brand Preference</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-muted text-[12px]">
                    Retrieving material items...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-muted text-[12px]">
                    No materials found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.material_code || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.material_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px]">
                      {item.unit_symbol || item.uom || '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary text-[11px] font-semibold">
                      ₹{Number(item.standard_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-center text-text-primary text-[11px]">
                      {item.gst_rate !== null && item.gst_rate !== undefined ? `${item.gst_rate}%` : '—'}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.brand_preference || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.is_active ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Details"
                          onClick={() => setViewingItem(item)}
                        >
                          <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>
                        {hasPermission('materials.manage_master') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                        )}
                        {hasPermission('materials.manage_master') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* Add / Edit Modal */}
      <EntityEditModal
        isOpen={isAddOpen || Boolean(editingItem)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={Package}
          title={editingItem ? 'Edit Material catalogue Item' : 'Add Material catalogue Item'}
          subtitle="Configure stock limits, standard purchase prices, categories, and conversion settings."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="material-item-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="General Information">
              <EntityEditModal.Grid>
                <FormField label="Material Code" required error={errors.material_code}>
                  <Input
                    placeholder="e.g. MAT-CEMENT-001"
                    value={form.material_code}
                    onChange={(e) => handleFormChange('material_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Material Name" required error={errors.material_name}>
                  <Input
                    placeholder="e.g. Portland Pozzolana Cement"
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Category" required error={errors.material_category_id}>
                  <Select
                    value={form.material_category_id}
                    onChange={(val) => handleFormChange('material_category_id', val)}
                    options={[
                      { value: '', label: 'Select a category' },
                      ...categories.map((c) => ({ value: String(c.id), label: `${c.category_name} (${c.category_code})` }))
                    ]}
                  />
                </FormField>

                <FormField label="Base Unit of Measurement" required error={errors.base_uom_id}>
                  <Select
                    value={form.base_uom_id}
                    onChange={(val) => handleFormChange('base_uom_id', val)}
                    options={[
                      { value: '', label: 'Select a unit' },
                      ...uoms.map((u) => ({ value: String(u.id), label: `${u.unit_name} (${u.unit_code})` }))
                    ]}
                  />
                </FormField>

                <FormField label="Standard Purchase Rate (₹)" error={errors.standard_rate}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.standard_rate}
                    onChange={(e) => handleFormChange('standard_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Rate (%)" error={errors.gst_rate}>
                  <Select
                    value={form.gst_rate}
                    onChange={(val) => handleFormChange('gst_rate', val)}
                    options={[
                      { value: '0', label: '0%' },
                      { value: '5', label: '5%' },
                      { value: '12', label: '12%' },
                      { value: '18', label: '18%' },
                      { value: '28', label: '28%' }
                    ]}
                  />
                </FormField>

                <FormField label="HSN Code" error={errors.hsn_code}>
                  <Input
                    placeholder="e.g. 2523"
                    value={form.hsn_code}
                    onChange={(e) => handleFormChange('hsn_code', e.target.value)}
                  />
                </FormField>

                <FormField label="Brand Preferences" error={errors.brand_preference}>
                  <Input
                    placeholder="e.g. Ultratech, ACC"
                    value={form.brand_preference}
                    onChange={(e) => handleFormChange('brand_preference', e.target.value)}
                  />
                </FormField>

                <FormField label="Min Stock Alert Qty" error={errors.minimum_stock_qty}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.minimum_stock_qty}
                    onChange={(e) => handleFormChange('minimum_stock_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Reorder Qty" error={errors.reorder_qty}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.reorder_qty}
                    onChange={(e) => handleFormChange('reorder_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Quality Check Intake" error={errors.quality_check_required}>
                  <Select
                    value={form.quality_check_required}
                    onChange={(val) => handleFormChange('quality_check_required', val)}
                    options={[
                      { value: '0', label: 'Not Required' },
                      { value: '1', label: 'Inspection Required' }
                    ]}
                  />
                </FormField>

                <FormField label="Batch Tracking" error={errors.batch_tracking_required}>
                  <Select
                    value={form.batch_tracking_required}
                    onChange={(val) => handleFormChange('batch_tracking_required', val)}
                    options={[
                      { value: '0', label: 'Disabled' },
                      { value: '1', label: 'Enabled' }
                    ]}
                  />
                </FormField>

                <FormField label="Storage Hint (Location)" error={errors.storage_location_hint}>
                  <Input
                    placeholder="e.g. Rack A-12"
                    value={form.storage_location_hint}
                    onChange={(e) => handleFormChange('storage_location_hint', e.target.value)}
                  />
                </FormField>

                <FormField label="Active Status" error={errors.is_active}>
                  <Select
                    value={form.is_active}
                    onChange={(val) => handleFormChange('is_active', val)}
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' }
                    ]}
                  />
                </FormField>

                <FormField label="Specifications / Notes" className="md:col-span-2" error={errors.notes}>
                  <Textarea
                    placeholder="Material specs, weight info, packaging details..."
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="material-item-form"
            submitLabel={editingItem ? 'Update Material' : 'Create Material'}
            onCancel={() => {
              setIsAddOpen(false);
              setEditingItem(null);
            }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* View Details Modal */}
      <EntityEditModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
      >
        <EntityEditModal.Header
          icon={Package}
          title="Material Specifications"
          subtitle="Detailed stock properties, GST rates, and storage parameters."
          onClose={() => setViewingItem(null)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Material SKU Profile">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Material Name</div>
                  <div className="text-[13px] font-medium text-text-primary mt-1">{viewingItem?.material_name || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Material Code</div>
                  <div className="text-[13px] font-mono font-semibold text-text-primary mt-1">{viewingItem?.material_code || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Standard Unit Price</div>
                  <div className="text-[13px] font-semibold text-text-primary mt-1">
                    ₹{Number(viewingItem?.standard_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">GST Rate & HSN</div>
                  <div className="text-[13px] text-text-primary mt-1">
                    {viewingItem?.gst_rate}% (HSN: {viewingItem?.hsn_code || '—'})
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Stock Alert Limits</div>
                  <div className="text-[12px] text-text-secondary mt-1">
                    Min Stock: {viewingItem?.minimum_stock_qty || '0'} | Reorder: {viewingItem?.reorder_qty || '0'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Storage Hint</div>
                  <div className="text-[13px] text-text-primary mt-1">{viewingItem?.storage_location_hint || '—'}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Specification Notes</div>
                  <div className="text-[12px] text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                    {viewingItem?.notes || 'No specifications notes provided.'}
                  </div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <div className="flex items-center justify-end border-t border-border px-4 py-3 bg-surface-subtle">
            <Button variant="ghost" className="h-9 px-4 text-[13px]" onClick={() => setViewingItem(null)}>
              Close
            </Button>
          </div>
        </div>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Delete Material SKU"
        message="Are you sure you want to delete this material catalogue item? It cannot be undone if it has already been used in purchase orders or receipt documents."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
