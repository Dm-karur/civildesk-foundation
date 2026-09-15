import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
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
import { labourApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  category_code: '',
  category_name: '',
  skill_level_id: '',
  wage_basis_id: '',
  default_wage_rate: '',
  overtime_multiplier: '1.5',
  description: '',
  display_order: '0',
  is_active: '1',
};

export function LabourCategoriesPage() {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [skillLevels, setSkillLevels] = useState([]);
  const [wageBases, setWageBases] = useState([]);
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

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCategories, resMasters] = await Promise.all([
        labourApi.categories.list(),
        labourApi.masters(),
      ]);

      const catList = resCategories?.data?.labour_categories ?? resCategories?.labour_categories ?? (Array.isArray(resCategories) ? resCategories : []);
      setCategories(Array.isArray(catList) ? catList : []);

      const skillList = resMasters?.data?.masters?.['category-skill-levels'] ?? resMasters?.data?.['category-skill-levels'] ?? resMasters?.['category-skill-levels'] ?? [];
      setSkillLevels(Array.isArray(skillList) ? skillList : []);

      const wageList = resMasters?.data?.masters?.['category-wage-bases'] ?? resMasters?.data?.['category-wage-bases'] ?? resMasters?.['category-wage-bases'] ?? [];
      setWageBases(Array.isArray(wageList) ? wageList : []);
    } catch (err) {
      toast.error('Failed to load labour category data.');
      setCategories([]);
      setSkillLevels([]);
      setWageBases([]);
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
      skill_level_id: skillLevels[0]?.id ? String(skillLevels[0].id) : '',
      wage_basis_id: wageBases[0]?.id ? String(wageBases[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      category_code: item.category_code || '',
      category_name: item.category_name || '',
      skill_level_id: String(item.skill_level_id || ''),
      wage_basis_id: String(item.wage_basis_id || ''),
      default_wage_rate: item.default_wage_rate !== null && item.default_wage_rate !== undefined ? String(item.default_wage_rate) : '',
      overtime_multiplier: item.overtime_multiplier !== null && item.overtime_multiplier !== undefined ? String(item.overtime_multiplier) : '1.5',
      description: item.description || '',
      display_order: String(item.display_order ?? '0'),
      is_active: String(item.is_active) === '1' ? '1' : '0',
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
    if (!form.skill_level_id) validationErrs.skill_level_id = 'Skill level is required.';
    if (!form.wage_basis_id) validationErrs.wage_basis_id = 'Wage basis is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category_code: form.category_code.toUpperCase().trim(),
        category_name: form.category_name.trim(),
        skill_level_id: Number(form.skill_level_id),
        wage_basis_id: Number(form.wage_basis_id),
        default_wage_rate: form.default_wage_rate === '' ? null : Number(form.default_wage_rate),
        overtime_multiplier: Number(form.overtime_multiplier || 1.5),
        description: form.description.trim() || null,
        display_order: Number(form.display_order || 0),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await labourApi.categories.update(editingItem.id, payload);
        toast.success('Labour category updated successfully.');
      } else {
        await labourApi.categories.create(payload);
        toast.success('Labour category created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save labour category.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await labourApi.categories.remove(deletingItem.id);
      toast.success('Labour category deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete labour category.');
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
  const activeCount = categories.filter(c => String(c.is_active) === '1').length;
  const inactiveCount = totalCount - activeCount;

  return (
    <PageContainer>
      <PageHeader
        title="Labour Categories"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters' },
          { label: 'Labour Categories' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Total Categories" value={totalCount} icon={<Users />} status="primary" />
        <KpiCard label="Active Classes" value={activeCount} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Inactive Classes" value={inactiveCount} icon={<HelpCircle />} status="warning" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by code, category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('labour.create') && (
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
                <th className="px-3 py-2 w-28">Code</th>
                <th className="px-3 py-2 w-48">Category Name</th>
                <th className="px-3 py-2 w-32 text-right">Default Wage</th>
                <th className="px-3 py-2 w-24 text-right">OT Multiplier</th>
                <th className="px-3 py-2 hidden md:table-cell">Description</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    Loading categories from backend...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    No labour categories found in database.
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
                    <td className="px-3 py-2 text-right text-text-primary text-[11px] font-semibold">
                      {item.default_wage_rate !== null && item.default_wage_rate !== undefined
                        ? `₹${Number(item.default_wage_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary text-[11px]">
                      {item.overtime_multiplier !== null && item.overtime_multiplier !== undefined
                        ? `${Number(item.overtime_multiplier).toFixed(2)}x`
                        : '1.50x'}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.description || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${String(item.is_active) === '1' ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                          }`}
                      >
                        {String(item.is_active) === '1' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('labour.update') && (
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
                        {hasPermission('labour.update') && (
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
          icon={Users}
          title={editingItem ? 'Edit Labour Category' : 'Add Labour Category'}
          subtitle="Define wage parameters, base rates, skill classifications, and work scopes."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="labour-category-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Category Configurations">
              <EntityEditModal.Grid>
                <FormField label="Category Code" required error={errors.category_code}>
                  <Input
                    placeholder="e.g. SKILLED-MASON"
                    value={form.category_code}
                    onChange={(e) => handleFormChange('category_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Category Name" required error={errors.category_name}>
                  <Input
                    placeholder="e.g. Mason (Grade A)"
                    value={form.category_name}
                    onChange={(e) => handleFormChange('category_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Skill Level" required error={errors.skill_level_id}>
                  <Select
                    value={form.skill_level_id}
                    onChange={(value) => handleFormChange('skill_level_id', value)}
                    options={[
                      { value: '', label: 'Select skill level' },
                      ...skillLevels.map((sl) => ({ value: String(sl.id), label: sl.skill_level_name || sl.level_name || sl.name || sl.id }))
                    ]}
                  />
                </FormField>

                <FormField label="Wage Basis" required error={errors.wage_basis_id}>
                  <Select
                    value={form.wage_basis_id}
                    onChange={(value) => handleFormChange('wage_basis_id', value)}
                    options={[
                      { value: '', label: 'Select wage basis' },
                      ...wageBases.map((wb) => ({ value: String(wb.id), label: wb.wage_basis_name || wb.basis_name || wb.name || wb.id }))
                    ]}
                  />
                </FormField>

                <FormField label="Default Wage Rate (₹)" error={errors.default_wage_rate}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 650.00"
                    value={form.default_wage_rate}
                    onChange={(e) => handleFormChange('default_wage_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Overtime Multiplier" error={errors.overtime_multiplier}>
                  <Input
                    type="number"
                    min="1"
                    step="0.05"
                    placeholder="1.50"
                    value={form.overtime_multiplier}
                    onChange={(e) => handleFormChange('overtime_multiplier', e.target.value)}
                  />
                </FormField>

                <FormField label="Sort Order" error={errors.display_order}>
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
                    value={form.is_active}
                    onChange={(value) => handleFormChange('is_active', value)}
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' }
                    ]}
                  />
                </FormField>

                <FormField label="Description" className="md:col-span-2" error={errors.description}>
                  <Textarea
                    placeholder="Summary of this labour classification responsibilities..."
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="labour-category-form"
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
        isOpen={Boolean(deletingItem)}
        title="Delete Labour Category"
        message="Are you sure you want to delete this labour category? It cannot be deleted if associated with active workers or project attendance entries."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
