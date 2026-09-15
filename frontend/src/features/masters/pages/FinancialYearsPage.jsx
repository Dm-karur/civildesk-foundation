import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
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
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { financialYearsApi, mastersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  year_name: '',
  year_code: '',
  start_date: '',
  end_date: '',
  status_id: '',
  is_current: '0',
  is_active: '1',
};

export function FinancialYearsPage() {
  const { hasPermission } = useAuth();
  const [financialYears, setFinancialYears] = useState([]);
  const [statuses, setStatuses] = useState([]);
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

  // Fetch financial years & statuses
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resYears, resMasters] = await Promise.all([
        financialYearsApi.list(),
        mastersApi.all(),
      ]);

      const yearsList = resYears?.data?.financial_years ?? resYears?.financial_years ?? (Array.isArray(resYears) ? resYears : []);
      setFinancialYears(Array.isArray(yearsList) ? yearsList : []);

      const statusList = resMasters?.data?.financial_year_statuses ?? resMasters?.financial_year_statuses ?? [];
      setStatuses(Array.isArray(statusList) ? statusList : []);
    } catch (err) {
      toast.error('Failed to load financial year master data.');
      setFinancialYears([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Handlers
  const handleOpenAdd = () => {
    const draftStatus = statuses.find(s => s.code === 'DRAFT') || statuses[0];
    setForm({
      ...EMPTY_FORM,
      status_id: draftStatus?.id ? String(draftStatus.id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      year_name: item.year_name || '',
      year_code: item.year_code || '',
      start_date: item.start_date ? item.start_date.split(' ')[0] : '',
      end_date: item.end_date ? item.end_date.split(' ')[0] : '',
      status_id: String(item.status_id || ''),
      is_current: item.is_current ? '1' : '0',
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

    if (!form.year_name.trim()) validationErrs.year_name = 'Year name is required.';
    if (!form.year_code.trim()) validationErrs.year_code = 'Year code is required.';
    if (!form.start_date) validationErrs.start_date = 'Start date is required.';
    if (!form.end_date) validationErrs.end_date = 'End date is required.';
    if (!form.status_id) validationErrs.status_id = 'Status is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        year_name: form.year_name.trim(),
        year_code: form.year_code.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        status_id: Number(form.status_id),
        is_current: Number(form.is_current),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await financialYearsApi.update(editingItem.id, payload);
        toast.success('Financial year updated successfully.');
      } else {
        await financialYearsApi.create(payload);
        toast.success('Financial year created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save financial year.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await financialYearsApi.remove(deletingItem.id);
      toast.success('Financial year deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete financial year.');
    }
  };

  // Filters & Search
  const filtered = useMemo(() => {
    return financialYears.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.year_name || '').toLowerCase().includes(q) ||
        String(item.year_code || '').toLowerCase().includes(q) ||
        String(item.status_name || '').toLowerCase().includes(q)
      );
    });
  }, [financialYears, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // metrics
  const totalCount = financialYears.length;
  const currentYear = financialYears.find(y => y.is_current)?.year_name || 'None Set';
  const activeCount = financialYears.filter(y => y.is_active).length;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Financial Years' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Financial Year Registry" breadcrumbs={breadcrumbs} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Registered Financial Years" value={totalCount} icon={<Calendar />} status="primary" />
        <KpiCard label="Current Financial Year" value={currentYear} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Active Years" value={activeCount} icon={<HelpCircle />} status="info" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by code, label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('financial_year.create') && (
              <Button
                variant="primary"
                className="h-9 px-3 text-[13px]"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
              >
                Add Financial Year
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
                <th className="px-3 py-2 w-32">Year Code</th>
                <th className="px-3 py-2 w-48">Year Label</th>
                <th className="px-3 py-2 w-32 text-center">Start Date</th>
                <th className="px-3 py-2 w-32 text-center">End Date</th>
                <th className="px-3 py-2 w-28 text-center">Current</th>
                <th className="px-3 py-2 w-28 text-center">Status</th>
                <th className="px-3 py-2 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    Loading financial years...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                    No financial years found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.year_code || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.year_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-text-primary text-[11px]">
                      {item.start_date ? item.start_date.split(' ')[0] : '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-text-primary text-[11px]">
                      {item.end_date ? item.end_date.split(' ')[0] : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.is_current ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Current
                        </span>
                      ) : (
                        <span className="text-[9px] text-text-secondary">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.is_active ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {item.status_name || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('financial_year.update') && (
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
                        {hasPermission('financial_year.delete') && (
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

      {/* Add / Edit Financial Year Modal */}
      <EntityEditModal
        isOpen={isAddOpen || Boolean(editingItem)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={Calendar}
          title={editingItem ? 'Edit Financial Year' : 'Add Financial Year'}
          subtitle="Configure start dates, end dates, and active workflow states."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="financial-year-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Year Configurations">
              <EntityEditModal.Grid>
                <FormField label="Year Code" required error={errors.year_code}>
                  <Input
                    placeholder="e.g. 2026-27"
                    value={form.year_code}
                    onChange={(e) => handleFormChange('year_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Year Name / Label" required error={errors.year_name}>
                  <Input
                    placeholder="e.g. FY 2026-27"
                    value={form.year_name}
                    onChange={(e) => handleFormChange('year_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Start Date" required error={errors.start_date}>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                  />
                </FormField>

                <FormField label="End Date" required error={errors.end_date}>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => handleFormChange('end_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Workflow Status" required error={errors.status_id}>
                  <Select
                    value={form.status_id}
                    onChange={(val) => handleFormChange('status_id', val)}
                    options={statuses.map((s) => ({ value: String(s.id), label: s.status_name || s.name }))}
                    placeholder="Select a status"
                  />
                </FormField>

                <FormField label="Is Current Year" error={errors.is_current}>
                  <Select
                    value={String(form.is_current)}
                    onChange={(val) => handleFormChange('is_current', val)}
                    options={[
                      { value: '0', label: 'No' },
                      { value: '1', label: 'Yes (Set as Current)' }
                    ]}
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
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="financial-year-form"
            submitLabel={editingItem ? 'Update Financial Year' : 'Create Financial Year'}
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
        title="Delete Financial Year"
        message="Are you sure you want to delete this financial year? This cannot be undone if it is already referenced by active projects."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
