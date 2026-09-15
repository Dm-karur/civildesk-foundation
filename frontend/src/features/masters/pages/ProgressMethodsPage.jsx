import { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Plus, Edit, Trash2, Search, HelpCircle, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { mastersApi, request } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';
import clsx from 'clsx';

const EMPTY_FORM = {
  method_code: '',
  method_name: '',
  description: '',
  display_order: '0',
  is_active: '1',
};

const api = {
  list: () => mastersApi.all(),
  create: (data) => request.post('/progress-methods', data),
  update: (id, data) => request.patch(`/progress-methods/${encodeURIComponent(id)}`, data),
  remove: (id) => request.delete(`/progress-methods/${encodeURIComponent(id)}`),
};

export function ProgressMethodsPage() {
  const { hasPermission } = useAuth();
  const [methods, setMethods] = useState([]);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.list();
      const rawList = res?.data?.work_category_progress_methods ?? res?.work_category_progress_methods ?? [];
      const list = rawList.map(item => ({
        id: item.id,
        method_code: item.code,
        method_name: item.name,
        is_active: true,
        display_order: 0
      }));
      setMethods(list);
    } catch (err) {
      toast.error('Failed to load progress methods.');
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      method_code: item.method_code || '',
      method_name: item.method_name || '',
      description: item.description || '',
      display_order: String(item.display_order ?? '0'),
      is_active: item.is_active ? '1' : '0',
    });
    setErrors({});
    setEditingItem(item);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.method_code.trim()) newErrors.method_code = 'Code is required';
    if (!form.method_name.trim()) newErrors.method_name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        method_code: form.method_code,
        method_name: form.method_name,
        description: form.description,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active === '1',
      };

      if (editingItem) {
        await api.update(editingItem.id, payload);
        toast.success('Progress method updated successfully.');
      } else {
        await api.create(payload);
        toast.success('Progress method created successfully.');
      }
      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save progress method.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.remove(deletingItem.id);
      toast.success('Progress method deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete progress method.');
    } finally {
      setDeletingItem(null);
    }
  };

  // Filter & Paginate
  const filteredData = useMemo(() => {
    return methods.filter((item) => {
      const q = searchQuery.toLowerCase();
      const codeMatch = (item.method_code || '').toLowerCase().includes(q);
      const nameMatch = (item.method_name || '').toLowerCase().includes(q);
      return codeMatch || nameMatch;
    });
  }, [methods, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const currentData = filteredData.slice((page - 1) * perPage, page * perPage);
  
  const activeCount = methods.filter(m => m.is_active).length;

  return (
    <PageContainer>
      <PageHeader 
        title="Progress Methods" 
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Project Masters', href: '/project-masters' },
          { label: 'Progress Methods' }
        ]}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard label="Total Methods" value={methods.length} status="primary" icon={<Activity className="w-4 h-4" />} />
          <KpiCard label="Active Methods" value={activeCount} status="success" icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="w-full sm:w-72">
            <SearchField placeholder="Search by code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('master.create') && (
              <Button variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleOpenAdd}>
                Add Method
              </Button>
            )}
          </div>
        </div>

        <DataTableContainer
          pagination={
            <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredData.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />
          }
        >
          <table className="w-full text-left text-[12px] table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 w-32">Method Code</th>
                <th className="px-3 py-2">Method Name</th>
                <th className="px-3 py-2 w-24 text-center">Order</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-text-secondary">Loading...</td></tr>
              ) : currentData.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-text-secondary italic">No progress methods found.</td></tr>
              ) : currentData.map((item, index) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 text-center text-text-secondary">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-3 py-2 font-medium text-white">{item.method_code}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.method_name}
                    {item.description && <div className="text-[10px] text-text-secondary/60 truncate mt-0.5 max-w-[300px]">{item.description}</div>}
                  </td>
                  <td className="px-3 py-2 text-center text-text-secondary">{item.display_order}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission('master.edit') && (
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} className="h-6 w-6 text-sky-400 hover:bg-sky-400/10 hover:text-sky-300" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {hasPermission('master.delete') && (
                        <Button variant="ghost" size="icon" onClick={() => setDeletingItem(item)} className="h-6 w-6 text-red-400 hover:bg-red-400/10 hover:text-red-300" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      <EntityEditModal
        isOpen={isAddOpen || !!editingItem}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); setErrors({}); }}
      >
        <EntityEditModal.Header
          icon={Activity}
          title={editingItem ? 'Edit Progress Method' : 'Add Progress Method'}
          subtitle="Configure progress method details."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); setErrors({}); }}
        />
        <form id="progress-method-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Method Details">
              <EntityEditModal.Grid>
                <FormField label="Method Code" error={errors.method_code} required>
                  <Input value={form.method_code} onChange={(e) => setForm(prev => ({ ...prev, method_code: e.target.value.toUpperCase() }))} placeholder="e.g. PCT" />
                </FormField>
                
                <FormField label="Method Name" error={errors.method_name} required>
                  <Input value={form.method_name} onChange={(e) => setForm(prev => ({ ...prev, method_name: e.target.value }))} placeholder="e.g. Percentage Complete" />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Description" error={errors.description}>
                    <Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description..." rows={2} />
                  </FormField>
                </div>

                <FormField label="Display Order" error={errors.display_order}>
                  <Input type="number" min="0" value={form.display_order} onChange={(e) => setForm(prev => ({ ...prev, display_order: e.target.value }))} />
                </FormField>

                <FormField label="Status">
                  <Select
                    options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
                    value={form.is_active}
                    onChange={(val) => setForm(prev => ({ ...prev, is_active: val }))}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="progress-method-form"
            submitLabel={editingItem ? 'Update Progress Method' : 'Create Progress Method'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); setErrors({}); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Progress Method"
        message={`Are you sure you want to delete "${deletingItem?.method_name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageContainer>
  );
}
