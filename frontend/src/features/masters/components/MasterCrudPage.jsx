import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * Generic CRUD master page used for Project Types, Financial Years, UoM, and Work Categories.
 * Driven entirely by configuration props.
 */
export function MasterCrudPage({
  title,
  icon: Icon,
  breadcrumbs,
  api,
  extractList,
  columns,
  formFields,
  emptyForm,
  formId,
  entityName = 'Item',
  permissionPrefix = 'master',
}) {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    api.list()
      .then((res) => setItems(extractList(res)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [api, extractList]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setIsAddOpen(true);
  };

  const openEdit = (item) => {
    const populated = { ...emptyForm };
    Object.keys(emptyForm).forEach((key) => {
      populated[key] = item[key] !== undefined && item[key] !== null ? String(item[key]) : emptyForm[key];
    });
    setForm(populated);
    setErrors({});
    setEditingItem(item);
  };

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    formFields.filter((f) => f.required).forEach((f) => {
      if (!String(form[f.name] ?? '').trim()) next[f.name] = 'This field is required.';
    });
    if (Object.keys(next).length > 0) { setErrors(next); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      formFields.forEach((f) => {
        if (f.type === 'number') payload[f.name] = form[f.name] === '' ? null : Number(form[f.name]);
      });
      const isEditing = Boolean(editingItem?.id);
      if (isEditing) await api.update(editingItem.id, payload);
      else await api.create(payload);
      toast.success(`${entityName} ${isEditing ? 'updated' : 'created'} successfully.`);
      setIsAddOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      setErrors(error?.errors ?? {});
      toast.error(error?.message || `Unable to save ${entityName.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await api.remove(deletingItem.id);
      toast.success(`${entityName} deleted.`);
      setDeletingItem(null);
      fetchItems();
    } catch (error) {
      toast.error(error?.message || `Unable to delete ${entityName.toLowerCase()}.`);
    }
  };

  const filtered = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return columns.some((col) => String(item[col.key] || '').toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const isModalOpen = isAddOpen || Boolean(editingItem);

  return (
    <PageContainer>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          <div className="w-full sm:w-[220px]">
            <SearchField placeholder={`Search ${title.toLowerCase()}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission(`${permissionPrefix}.create`) && (
              <Button variant="primary" className="h-9 px-3 text-[13px]" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAdd}>
                Add {entityName}
              </Button>
            )}
          </div>
        </div>

        <DataTableContainer
          pagination={<Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />}
        >
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-2 py-1.5 w-10 text-center">#</th>
                {columns.map((col) => (
                  <th key={col.key} className={`px-2 py-1.5 ${col.className || ''}`}>{col.label}</th>
                ))}
                <th className="px-2 py-1.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={columns.length + 2} className="text-center py-6 text-text-muted text-[12px]">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length + 2} className="text-center py-6 text-text-muted text-[12px]">No {title.toLowerCase()} found.</td></tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + index + 1}</td>
                    {columns.map((col) => (
                      <td key={col.key} className={`px-2 py-1 text-[11px] ${col.cellClass || 'text-text-primary'}`}>
                        {col.render ? col.render(item) : (item[col.key] || '—')}
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center gap-0.5">
                        {hasPermission(`${permissionPrefix}.update`) && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit" onClick={() => openEdit(item)}>
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                        )}
                        {hasPermission(`${permissionPrefix}.delete`) && api.remove && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Delete" onClick={() => setDeletingItem(item)}>
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
      <EntityEditModal isOpen={isModalOpen} onClose={() => { setIsAddOpen(false); setEditingItem(null); }}>
        <EntityEditModal.Header icon={Icon} title={editingItem ? `Edit ${entityName}` : `Add ${entityName}`} subtitle={`Manage ${entityName.toLowerCase()} details.`} onClose={() => { setIsAddOpen(false); setEditingItem(null); }} />
        <form id={formId} onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title={`${entityName} Information`}>
              <EntityEditModal.Grid>
                {formFields.map((field) => (
                  <FormField key={field.name} label={field.label} required={field.required} error={errors[field.name]} className={field.fullWidth ? 'md:col-span-2' : ''}>
                    {field.type === 'textarea' ? (
                      <Textarea value={form[field.name] || ''} onChange={(e) => change(field.name, e.target.value)} rows={field.rows || 3} />
                    ) : (
                      <Input type={field.type || 'text'} value={form[field.name] || ''} onChange={(e) => change(field.name, e.target.value)} placeholder={field.placeholder || ''} min={field.min} max={field.max} step={field.step} />
                    )}
                  </FormField>
                ))}
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer formId={formId} submitLabel={editingItem ? `Update ${entityName}` : `Create ${entityName}`} onCancel={() => { setIsAddOpen(false); setEditingItem(null); }} isSubmitting={saving} />
        </form>
      </EntityEditModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title={`Delete ${entityName}`}
        message={`Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
