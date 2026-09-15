import { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Plus, Edit, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
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
import { toast } from '../../../components/composite/Toast';
import { expensesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  parent_id: '',
  category_code: '',
  category_name: '',
  expense_scope_id: '',
  default_taxable: '0',
  requires_document: '0',
  description: '',
  display_order: '0',
  is_active: '1',
};

export function ExpenseCategoriesPage() {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCategories, resMasters] = await Promise.all([
        expensesApi.categories.list(),
        expensesApi.masters(),
      ]);

      const catList = resCategories?.data?.expense_categories ?? resCategories?.expense_categories ?? (Array.isArray(resCategories) ? resCategories : []);
      setCategories(Array.isArray(catList) ? catList : []);

      const scopeList = resMasters?.data?.masters?.expense_scopes ?? resMasters?.masters?.expense_scopes ?? resMasters?.data?.expense_scopes ?? resMasters?.expense_scopes ?? [];
      setScopes(Array.isArray(scopeList) ? scopeList : []);
    } catch (err) {
      toast.error('Failed to load expense category data.');
      setCategories([]);
      setScopes([]);
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
      expense_scope_id: scopes[0]?.id ? String(scopes[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      parent_id: item.parent_id !== null && item.parent_id !== undefined ? String(item.parent_id) : '',
      category_code: item.category_code || '',
      category_name: item.category_name || '',
      expense_scope_id: String(item.expense_scope_id || ''),
      default_taxable: item.default_taxable ? '1' : '0',
      requires_document: item.requires_document ? '1' : '0',
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
    if (!form.expense_scope_id) validationErrs.expense_scope_id = 'Expense scope is required.';

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
        expense_scope_id: Number(form.expense_scope_id),
        default_taxable: Number(form.default_taxable),
        requires_document: Number(form.requires_document),
        description: form.description.trim() || null,
        display_order: Number(form.display_order || 0),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await expensesApi.categories.update(editingItem.id, payload);
        toast.success('Expense category updated successfully.');
      } else {
        await expensesApi.categories.create(payload);
        toast.success('Expense category created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save expense category.');
    } finally {
      setSaving(false);
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
  const activeCount = categories.filter(c => c.is_active).length;

  return (
    <PageContainer>
      <PageHeader
        title="Expense Categories"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters' },
          { label: 'Expense Categories' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard label="Total Categories" value={totalCount} icon={<Package />} status="primary" />
        <KpiCard label="Parent Scopes" value={rootCount} icon={<ChevronRight />} status="info" />
        <KpiCard label="Sub-Categories" value={subCount} icon={<Plus />} status="neutral" />
        <KpiCard label="Active Status" value={activeCount} icon={<ShieldCheck />} status="success" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search category code, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('expenses.request') && (
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
                <th className="px-3 py-2 w-40">Expense Scope</th>
                <th className="px-3 py-2 w-28 text-center">Taxable</th>
                <th className="px-3 py-2 hidden md:table-cell">Parent Category</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    Loading expense categories...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    No expense categories found in database.
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
                      {item.expense_scope_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          Number(item.default_taxable) === 1 ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {Number(item.default_taxable) === 1 ? 'Taxable' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.parent_id 
                        ? (() => {
                            const parent = categories.find((c) => c.id === item.parent_id);
                            return parent ? `${parent.category_code} - ${parent.category_name}` : 'Root / None';
                          })()
                        : 'Root / None'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          Number(item.is_active) === 1 ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {Number(item.is_active) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        {hasPermission('expenses.request') && (
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
          title={editingItem ? 'Edit Expense Category' : 'Add Expense Category'}
          subtitle="Configure category code, standard taxability, and scope references."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="exp-category-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Category Configurations">
              <EntityEditModal.Grid>
                <FormField label="Category Code" required error={errors.category_code}>
                  <Input
                    placeholder="e.g. TRAVEL-EXP"
                    value={form.category_code}
                    onChange={(e) => handleFormChange('category_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Category Name" required error={errors.category_name}>
                  <Input
                    placeholder="e.g. Travel & Transport Expenses"
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
                      ...categories
                        .filter((c) => !editingItem || c.id !== editingItem.id) // Avoid self-parent nesting
                        .map((c) => ({ value: String(c.id), label: `${c.category_code} - ${c.category_name}` }))
                    ]}
                  />
                </FormField>

                <FormField label="Expense Scope" required error={errors.expense_scope_id}>
                  <Select
                    value={form.expense_scope_id}
                    onChange={(val) => handleFormChange('expense_scope_id', val)}
                    options={[
                      { value: '', label: 'Select scope' },
                      ...scopes.map((s) => ({ value: String(s.id), label: s.expense_scope_name || s.name }))
                    ]}
                  />
                </FormField>

                <FormField label="Taxable Status" error={errors.default_taxable}>
                  <Select
                    value={form.default_taxable}
                    onChange={(val) => handleFormChange('default_taxable', val)}
                    options={[
                      { value: '0', label: 'Non-Taxable' },
                      { value: '1', label: 'Taxable by Default' }
                    ]}
                  />
                </FormField>

                <FormField label="Requires Document" error={errors.requires_document}>
                  <Select
                    value={form.requires_document}
                    onChange={(val) => handleFormChange('requires_document', val)}
                    options={[
                      { value: '0', label: 'Optional Document' },
                      { value: '1', label: 'Mandatory Bill Attachment' }
                    ]}
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
                    value={form.is_active}
                    onChange={(val) => handleFormChange('is_active', val)}
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' }
                    ]}
                  />
                </FormField>

                <FormField label="Description" className="md:col-span-2" error={errors.description}>
                  <Textarea
                    placeholder="WBS allocation and cost accounting criteria..."
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="exp-category-form"
            submitLabel={editingItem ? 'Update Category' : 'Create Category'}
            onCancel={() => {
              setIsAddOpen(false);
              setEditingItem(null);
            }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
