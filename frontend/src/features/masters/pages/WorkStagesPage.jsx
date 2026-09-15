import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, Plus, Edit, Trash2, Search, HelpCircle, ShieldCheck } from 'lucide-react';
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
  stage_code: '',
  stage_name: '',
  description: '',
  display_order: '0',
  is_active: '1',
};

const api = {
  list: () => mastersApi.all(),
  create: (data) => request.post('/work-stages', data),
  update: (id, data) => request.patch(`/work-stages/${encodeURIComponent(id)}`, data),
  remove: (id) => request.delete(`/work-stages/${encodeURIComponent(id)}`),
};

export function WorkStagesPage() {
  const { hasPermission } = useAuth();
  const [stages, setStages] = useState([]);
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
      const rawList = res?.data?.work_category_stages ?? res?.work_category_stages ?? [];
      const list = rawList.map(item => ({
        id: item.id,
        stage_code: item.code,
        stage_name: item.name,
        is_active: true,
        display_order: 0
      }));
      setStages(list);
    } catch (err) {
      toast.error('Failed to load work stages.');
      setStages([]);
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
      stage_code: item.stage_code || '',
      stage_name: item.stage_name || '',
      description: item.description || '',
      display_order: String(item.display_order ?? '0'),
      is_active: item.is_active ? '1' : '0',
    });
    setErrors({});
    setEditingItem(item);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.stage_code.trim()) newErrors.stage_code = 'Code is required';
    if (!form.stage_name.trim()) newErrors.stage_name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        stage_code: form.stage_code,
        stage_name: form.stage_name,
        description: form.description,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active === '1',
      };

      if (editingItem) {
        await api.update(editingItem.id, payload);
        toast.success('Work stage updated successfully.');
      } else {
        await api.create(payload);
        toast.success('Work stage created successfully.');
      }
      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save work stage.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.remove(deletingItem.id);
      toast.success('Work stage deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete work stage.');
    } finally {
      setDeletingItem(null);
    }
  };

  // Filter & Paginate
  const filteredData = useMemo(() => {
    return stages.filter((item) => {
      const q = searchQuery.toLowerCase();
      const codeMatch = (item.stage_code || '').toLowerCase().includes(q);
      const nameMatch = (item.stage_name || '').toLowerCase().includes(q);
      return codeMatch || nameMatch;
    });
  }, [stages, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const currentData = filteredData.slice((page - 1) * perPage, page * perPage);
  
  const activeCount = stages.filter(s => s.is_active).length;

  return (
    <PageContainer>
      <PageHeader 
        title="Work Stages" 
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Project Masters', href: '/project-masters' },
          { label: 'Work Stages' }
        ]}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard label="Total Stages" value={stages.length} status="primary" icon={<Layers className="w-4 h-4" />} />
          <KpiCard label="Active Stages" value={activeCount} status="success" icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="w-full sm:w-72">
            <SearchField placeholder="Search by code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('master.create') && (
              <Button variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleOpenAdd}>
                Add Stage
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
                <th className="px-3 py-2 w-32">Stage Code</th>
                <th className="px-3 py-2">Stage Name</th>
                <th className="px-3 py-2 w-24 text-center">Order</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-text-secondary">Loading...</td></tr>
              ) : currentData.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-text-secondary italic">No work stages found.</td></tr>
              ) : currentData.map((item, index) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 text-center text-text-secondary">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-3 py-2 font-medium text-white">{item.stage_code}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.stage_name}
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
          icon={Layers}
          title={editingItem ? 'Edit Work Stage' : 'Add Work Stage'}
          subtitle="Configure stage codes, names, and active status."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); setErrors({}); }}
        />
        <form id="work-stage-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Stage Details">
              <EntityEditModal.Grid>
                <FormField label="Stage Code" error={errors.stage_code} required>
                  <Input value={form.stage_code} onChange={(e) => setForm(prev => ({ ...prev, stage_code: e.target.value.toUpperCase() }))} placeholder="e.g. STG01" />
                </FormField>
                
                <FormField label="Stage Name" error={errors.stage_name} required>
                  <Input value={form.stage_name} onChange={(e) => setForm(prev => ({ ...prev, stage_name: e.target.value }))} placeholder="e.g. Substructure" />
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
            formId="work-stage-form"
            submitLabel={editingItem ? 'Update Work Stage' : 'Create Work Stage'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); setErrors({}); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Work Stage"
        message={`Are you sure you want to delete "${deletingItem?.stage_name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageContainer>
  );
}
