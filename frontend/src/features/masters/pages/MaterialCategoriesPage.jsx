import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle, Eye } from 'lucide-react';
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
  parent_id: '',
  category_code: '',
  category_name: '',
  storage_type_id: '',
  quality_check_required: '0',
  description: '',
  display_order: '0',
  is_active: '1',
};

export function MaterialCategoriesPage() {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [storageTypes, setStorageTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCategories, resMasters] = await Promise.all([
        materialsApi.categories.list(),
        materialsApi.masters(),
      ]);

      const catList = resCategories?.data?.material_categories ?? resCategories?.material_categories ?? (Array.isArray(resCategories) ? resCategories : []);
      setCategories(Array.isArray(catList) ? catList : []);

      const mastersData = resMasters?.data?.masters ?? resMasters?.masters ?? {};
      const storageList = mastersData?.storage_types ?? [];
      setStorageTypes(Array.isArray(storageList) ? storageList : []);
    } catch (err) {
      toast.error('Failed to load material category data.');
      setCategories([]);
      setStorageTypes([]);
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
      storage_type_id: storageTypes[0]?.id ? String(storageTypes[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      parent_id: item.parent_id !== null && item.parent_id !== undefined ? String(item.parent_id) : '',
      category_code: item.category_code || '',
      category_name: item.category_name || '',
      storage_type_id: String(item.storage_type_id || ''),
      quality_check_required: Number(item.quality_check_required) === 1 ? '1' : '0',
      description: item.description || '',
      display_order: String(item.display_order ?? '0'),
      is_active: Number(item.is_active) === 1 ? '1' : '0',
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

    if (!form.category_name.trim()) validationErrs.category_name = 'Category name is required.';
    if (!form.category_code.trim()) validationErrs.category_code = 'Category code is required.';
    if (!form.storage_type_id) validationErrs.storage_type_id = 'Storage type is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        parent_id: form.parent_id === '' ? null : Number(form.parent_id),
        category_code: form.category_code.toUpperCase().trim(),
        category_name: form.category_name.trim(),
        storage_type_id: Number(form.storage_type_id),
        quality_check_required: Number(form.quality_check_required),
        description: form.description.trim() || null,
        display_order: Number(form.display_order || 0),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await materialsApi.categories.update(editingItem.id, payload);
        toast.success('Material category updated successfully.');
      } else {
        await materialsApi.categories.create(payload);
        toast.success('Material category created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save material category.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await materialsApi.categories.remove(deletingItem.id);
      toast.success('Material category deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete material category.');
    }
  };

  // Filters & Search
  const filtered = useMemo(() => {
    return categories.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.category_name || '').toLowerCase().includes(q) ||
        String(item.category_code || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q)
      );
    });
  }, [categories, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCount = categories.length;
  const rootCount = categories.filter(c => !c.parent_id).length;
  const subCount = totalCount - rootCount;
  const activeCount = categories.filter(c => Number(c.is_active) === 1).length;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Material Categories' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Material Categories" breadcrumbs={breadcrumbs} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <KpiCard label="Total Categories" value={totalCount} icon={<Layers />} status="primary" />
        <KpiCard label="Active Categories" value={activeCount} icon={<ShieldCheck />} status="success" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search code, category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('materials.manage_master') && (
              <Button
                variant="primary"
                className="h-9 px-3 text-[13px]"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
              >
                Add Category
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
                <th className="px-3 py-2 w-28">cat code</th>
                <th className="px-3 py-2 w-48">Category Name</th>
                <th className="px-3 py-2 w-40">Storage Type</th>
                <th className="px-3 py-2 w-24 text-center">QC</th>
                <th className="px-3 py-2 w-24 text-center">status</th>
                <th className="px-3 py-2 w-24 text-center">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-muted text-[12px]">
                    Retrieving material categories...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-muted text-[12px]">
                    No material categories found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.category_code || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.category_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px] truncate">
                      {storageTypes.find(st => String(st.id) === String(item.storage_type_id))?.storage_type_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          (Number(item.quality_check_required) === 1) ? 'bg-warning/10 text-warning' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {(Number(item.quality_check_required) === 1) ? 'req' : 'not req'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          (Number(item.is_active) === 1) ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {(Number(item.is_active) === 1) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View"
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
          icon={Layers}
          title={editingItem ? 'Edit Material Category' : 'Add Material Category'}
          subtitle="Configure category code, storage type requirements, and QA checks."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="mat-category-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Category Configurations">
              <EntityEditModal.Grid>
                <FormField label="Category Code" required error={errors.category_code}>
                  <Input
                    placeholder="e.g. CEMENT"
                    value={form.category_code}
                    onChange={(e) => handleFormChange('category_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Category Name" required error={errors.category_name}>
                  <Input
                    placeholder="e.g. Cement & Binding Agents"
                    value={form.category_name}
                    onChange={(e) => handleFormChange('category_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Storage Type" required error={errors.storage_type_id}>
                  <Select
                    options={storageTypes.map((t) => ({ value: String(t.id), label: t.storage_type_name || t.name }))}
                    value={form.storage_type_id}
                    onChange={(val) => handleFormChange('storage_type_id', val)}
                    placeholder="Select storage type"
                  />
                </FormField>

                <FormField label="Quality Check Required" required error={errors.quality_check_required}>
                  <Select
                    options={[
                      { value: '0', label: 'No' },
                      { value: '1', label: 'Yes' }
                    ]}
                    value={form.quality_check_required}
                    onChange={(val) => handleFormChange('quality_check_required', val)}
                    placeholder="Select option"
                  />
                </FormField>

                <FormField label="Active Status" required error={errors.is_active}>
                  <Select
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' }
                    ]}
                    value={form.is_active}
                    onChange={(val) => handleFormChange('is_active', val)}
                    placeholder="Select option"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="mat-category-form"
            submitLabel={editingItem ? 'Update Category' : 'Create Category'}
            onCancel={() => {
              setIsAddOpen(false);
              setEditingItem(null);
            }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Material Category"
        description="Are you sure you want to delete this material category? It cannot be deleted if associated with active materials or subcategories."
        destructive
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
      {/* View Category Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">View Material Category</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.category_code}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Category Code</span>
                  <span className="font-mono text-text-primary font-semibold">{viewingItem.category_code}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Category Name</span>
                  <span className="text-text-primary font-semibold">{viewingItem.category_name}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Storage Type</span>
                  <span className="text-text-primary">{storageTypes.find(st => String(st.id) === String(viewingItem.storage_type_id))?.storage_type_name || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">QC Check</span>
                  <span className="text-text-primary">{Number(viewingItem.quality_check_required) === 1 ? 'QC Required' : 'No QC'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Parent Category</span>
                  <span className="text-text-primary">
                    {viewingItem.parent_name ? `${viewingItem.parent_code} - ${viewingItem.parent_name}` : 'Root / None'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Display Order</span>
                  <span className="text-text-primary">{viewingItem.display_order ?? '0'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-text-primary">{Number(viewingItem.is_active) === 1 ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              {viewingItem.description && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Description:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
