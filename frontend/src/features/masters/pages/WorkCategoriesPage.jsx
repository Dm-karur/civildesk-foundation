import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
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
import { workCategoriesApi, mastersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  parent_id: '',
  category_code: '',
  category_name: '',
  work_stage_id: '',
  progress_method_id: '',
  description: '',
  display_order: '0',
  is_active: '1',
};

export function WorkCategoriesPage() {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [stages, setStages] = useState([]);
  const [methods, setMethods] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch categories & masters
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCategories, resMasters] = await Promise.all([
        workCategoriesApi.list(),
        mastersApi.all(),
      ]);

      const catList = resCategories?.data?.work_categories ?? resCategories?.work_categories ?? (Array.isArray(resCategories) ? resCategories : []);
      setCategories(Array.isArray(catList) ? catList : []);

      const stageList = resMasters?.data?.work_category_stages ?? resMasters?.work_category_stages ?? [];
      setStages(Array.isArray(stageList) ? stageList : []);

      const methodList = resMasters?.data?.work_category_progress_methods ?? resMasters?.work_category_progress_methods ?? [];
      setMethods(Array.isArray(methodList) ? methodList : []);

      const parentList = resMasters?.data?.work_categories ?? resMasters?.work_categories ?? [];
      // Only list root level categories (parent_id is null/empty) as potential parents to keep WBS simple
      setParentCategories(Array.isArray(parentList) ? parentList.filter(c => !c.parent_id) : []);
    } catch (err) {
      toast.error('Failed to load work category master data.');
      setCategories([]);
      setStages([]);
      setMethods([]);
      setParentCategories([]);
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
      work_stage_id: stages[0]?.id ? String(stages[0].id) : '',
      progress_method_id: methods[0]?.id ? String(methods[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      parent_id: item.parent_id !== null && item.parent_id !== undefined ? String(item.parent_id) : '',
      category_code: item.category_code || '',
      category_name: item.category_name || '',
      work_stage_id: String(item.work_stage_id || ''),
      progress_method_id: String(item.progress_method_id || ''),
      description: item.description || '',
      display_order: String(item.display_order ?? '0'),
      is_active: item.is_active ? '1' : '0',
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
    if (!form.work_stage_id) validationErrs.work_stage_id = 'Work stage is required.';
    if (!form.progress_method_id) validationErrs.progress_method_id = 'Progress method is required.';

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
        work_stage_id: Number(form.work_stage_id),
        progress_method_id: Number(form.progress_method_id),
        description: form.description.trim() || null,
        display_order: Number(form.display_order || 0),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await workCategoriesApi.update(editingItem.id, payload);
        toast.success('Work category updated successfully.');
      } else {
        await workCategoriesApi.create(payload);
        toast.success('Work category created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save work category.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await workCategoriesApi.remove(deletingItem.id);
      toast.success('Work category deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete work category.');
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
        String(item.work_stage_name || '').toLowerCase().includes(q) ||
        String(item.progress_method_name || '').toLowerCase().includes(q)
      );
    });
  }, [categories, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCount = categories.length;
  const rootCount = categories.filter(c => !c.parent_id).length;
  const subCount = totalCount - rootCount;
  const activeCount = categories.filter(c => c.is_active).length;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Work Categories' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Work Category Registry" breadcrumbs={breadcrumbs} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard label="Total Work Categories" value={totalCount} icon={<Layers />} status="primary" />
        <KpiCard label="Root Categories" value={rootCount} icon={<ChevronRight />} status="info" />
        <KpiCard label="Sub-Categories" value={subCount} icon={<Plus />} status="neutral" />
        <KpiCard label="Active Categories" value={activeCount} icon={<ShieldCheck />} status="success" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by code, category name, stage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('master.create') && (
              <Button
                variant="primary"
                className="h-9 px-3 text-[13px]"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
              >
                Add Work Category
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
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          }
        >
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-12 text-center">#</th>
                <th className="px-3 py-2 w-28">Code</th>
                <th className="px-3 py-2 w-48">Category Name</th>
                <th className="px-3 py-2 w-40">Work Stage</th>
                <th className="px-3 py-2 w-40">Progress Method</th>
                <th className="px-3 py-2 hidden md:table-cell">Parent Category</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    Retrieving work categories...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    No work categories found.
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
                      {item.work_stage_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px] truncate">
                      {item.progress_method_name || '—'}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.parent_name ? `${item.parent_code} - ${item.parent_name}` : 'Root / None'}
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
                        {hasPermission('master.update') && (
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
                        {hasPermission('master.delete') && (
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
          title={editingItem ? 'Edit Work Category' : 'Add Work Category'}
          subtitle="Configure hierarchical categories, work stages, and WBS mapping criteria."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="work-category-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Category Configurations">
              <EntityEditModal.Grid>
                <FormField label="Category Code" required error={errors.category_code}>
                  <Input
                    placeholder="e.g. RCC"
                    value={form.category_code}
                    onChange={(e) => handleFormChange('category_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Category Name" required error={errors.category_name}>
                  <Input
                    placeholder="e.g. Concrete & RCC Works"
                    value={form.category_name}
                    onChange={(e) => handleFormChange('category_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Parent Category" error={errors.parent_id}>
                  <Select
                    value={form.parent_id}
                    onChange={(val) => handleFormChange('parent_id', val)}
                    options={[
                      { value: '', label: 'None (Set as Root)' },
                      ...parentCategories
                        .filter((c) => !editingItem || c.id !== editingItem.id)
                        .map((c) => ({ value: String(c.id), label: `${c.category_code || c.code} - ${c.category_name || c.name}` }))
                    ]}
                    placeholder="None (Set as Root)"
                  />
                </FormField>

                <FormField label="Work Stage" required error={errors.work_stage_id}>
                  <Select
                    value={form.work_stage_id}
                    onChange={(val) => handleFormChange('work_stage_id', val)}
                    options={stages.map((s) => ({ value: String(s.id), label: s.stage_name || s.name }))}
                    placeholder="Select work stage"
                  />
                </FormField>

                <FormField label="Progress Method" required error={errors.progress_method_id}>
                  <Select
                    value={form.progress_method_id}
                    onChange={(val) => handleFormChange('progress_method_id', val)}
                    options={methods.map((m) => ({ value: String(m.id), label: m.method_name || m.name }))}
                    placeholder="Select progress method"
                  />
                </FormField>

                <FormField label="Display Order" error={errors.display_order}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.display_order}
                    onChange={(e) => handleFormChange('display_order', e.target.value)}
                  />
                </FormField>

                <FormField label="Active Status" error={errors.is_active}>
                  <Select
                    value={String(form.is_active)}
                    onChange={(val) => handleFormChange('is_active', val)}
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' }
                    ]}
                  />
                </FormField>

                <FormField label="Description" className="md:col-span-2" error={errors.description}>
                  <Textarea
                    placeholder="Details about construction WBS scope of work..."
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="work-category-form"
            submitLabel={editingItem ? 'Update Work Category' : 'Create Work Category'}
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
        isOpen={Boolean(deletingItem)}
        title="Delete Work Category"
        message="Are you sure you want to delete this work category? It cannot be undone if it is already referenced by active project BOQs or budgets."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
