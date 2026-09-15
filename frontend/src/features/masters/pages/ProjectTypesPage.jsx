import { useState, useEffect, useMemo, useCallback } from 'react';
import { FolderCog, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
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
import { projectTypesApi, mastersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  project_type_code: '',
  project_type_name: '',
  billing_method_id: '',
  default_duration_days: '',
  description: '',
  display_order: '0',
  is_active: '1',
};

export function ProjectTypesPage() {
  const { hasPermission } = useAuth();
  const [projectTypes, setProjectTypes] = useState([]);
  const [billingMethods, setBillingMethods] = useState([]);
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

  // Fetch all project types & masters
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTypes, resMasters] = await Promise.all([
        projectTypesApi.list(),
        mastersApi.all(),
      ]);

      // Handle Types List
      const typesList = resTypes?.data?.project_types ?? resTypes?.project_types ?? (Array.isArray(resTypes) ? resTypes : []);
      setProjectTypes(Array.isArray(typesList) ? typesList : []);

      // Handle Billing Methods
      const billingList = resMasters?.data?.billing_methods ?? resMasters?.billing_methods ?? [];
      setBillingMethods(Array.isArray(billingList) ? billingList : []);
    } catch (err) {
      toast.error('Failed to load project type master data.');
      setProjectTypes([]);
      setBillingMethods([]);
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
      billing_method_id: billingMethods[0]?.id ? String(billingMethods[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_type_code: item.project_type_code || '',
      project_type_name: item.project_type_name || '',
      billing_method_id: String(item.billing_method_id || ''),
      default_duration_days: item.default_duration_days !== null && item.default_duration_days !== undefined ? String(item.default_duration_days) : '',
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

    if (!form.project_type_name.trim()) validationErrs.project_type_name = 'Type name is required.';
    if (!form.project_type_code.trim()) validationErrs.project_type_code = 'Type code is required.';
    if (!form.billing_method_id) validationErrs.billing_method_id = 'Billing method is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_type_code: form.project_type_code.toUpperCase().trim(),
        project_type_name: form.project_type_name.trim(),
        billing_method_id: Number(form.billing_method_id),
        default_duration_days: form.default_duration_days === '' ? null : Number(form.default_duration_days),
        description: form.description.trim() || null,
        display_order: Number(form.display_order || 0),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await projectTypesApi.update(editingItem.id, payload);
        toast.success('Project type updated successfully.');
      } else {
        await projectTypesApi.create(payload);
        toast.success('Project type created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save project type.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await projectTypesApi.remove(deletingItem.id);
      toast.success('Project type deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete project type.');
    }
  };

  // Filters & Search
  const filtered = useMemo(() => {
    return projectTypes.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.project_type_name || '').toLowerCase().includes(q) ||
        String(item.project_type_code || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q) ||
        String(item.billing_method_name || '').toLowerCase().includes(q)
      );
    });
  }, [projectTypes, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics KPI calculations
  const totalCount = projectTypes.length;
  const activeCount = projectTypes.filter(t => t.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const billingMethodsCount = billingMethods.length;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Project Types' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Project Type Registry" breadcrumbs={breadcrumbs} />

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard label="Total Project Types" value={totalCount} icon={<FolderCog />} status="info" />
        <KpiCard label="Active Types" value={activeCount} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Inactive Types" value={inactiveCount} icon={<HelpCircle />} status="warning" />
        <KpiCard label="Available Billing Methods" value={billingMethodsCount} icon={<ChevronRight />} status="primary" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by code, name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('project.create') && (
              <Button
                variant="primary"
                className="h-9 px-3 text-[13px]"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
              >
                Add Project Type
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
                <th className="px-3 py-2 w-52">Type Name</th>
                <th className="px-3 py-2 w-40">Billing Method</th>
                <th className="px-3 py-2 w-32 text-center">Default WBS Days</th>
                <th className="px-3 py-2 hidden md:table-cell">Description</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    Retrieving project types from backend...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    No project types found in the database.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.project_type_code || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.project_type_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px] truncate">
                      {item.billing_method_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-text-primary text-[11px]">
                      {item.default_duration_days !== null && item.default_duration_days !== undefined ? item.default_duration_days : '—'}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.description || '—'}
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
                        {hasPermission('project.update') && (
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
                        {hasPermission('project.delete') && (
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

      {/* Add / Edit Project Type Modal */}
      <EntityEditModal
        isOpen={isAddOpen || Boolean(editingItem)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={FolderCog}
          title={editingItem ? 'Edit Project Type' : 'Add Project Type'}
          subtitle="Manage configurations for project classifications and billing logic."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="project-type-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="General Specifications">
              <EntityEditModal.Grid>
                <FormField label="Type Code" required error={errors.project_type_code}>
                  <Input
                    placeholder="e.g. RESIDENTIAL"
                    value={form.project_type_code}
                    onChange={(e) => handleFormChange('project_type_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Type Name" required error={errors.project_type_name}>
                  <Input
                    placeholder="e.g. Residential Apartments"
                    value={form.project_type_name}
                    onChange={(e) => handleFormChange('project_type_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Billing Method" required error={errors.billing_method_id}>
                  <Select
                    value={form.billing_method_id}
                    onChange={(val) => handleFormChange('billing_method_id', val)}
                    options={billingMethods.map((bm) => ({ value: String(bm.id), label: bm.method_name || bm.name }))}
                    placeholder="Select a billing method"
                  />
                </FormField>

                <FormField label="Default Duration (Days)" error={errors.default_duration_days}>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 365"
                    value={form.default_duration_days}
                    onChange={(e) => handleFormChange('default_duration_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Display Sort Order" error={errors.display_order}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.display_order}
                    onChange={(e) => handleFormChange('display_order', e.target.value)}
                  />
                </FormField>

                <FormField label="Status" error={errors.is_active}>
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
                    placeholder="Summary of this project classification..."
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="project-type-form"
            submitLabel={editingItem ? 'Update Project Type' : 'Create Project Type'}
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
        title="Delete Project Type"
        message="Are you sure you want to delete this project type? If it is already associated with projects, the deletion will be blocked by the server."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
