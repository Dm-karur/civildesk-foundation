import { useState, useEffect, useMemo, useCallback } from 'react';
import { Ruler, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
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
import { unitsApi, mastersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  unit_code: '',
  unit_name: '',
  unit_symbol: '',
  unit_type_id: '',
  decimal_places: '2',
  description: '',
  display_order: '0',
  is_active: '1',
};

export function UnitsOfMeasurementPage() {
  const { hasPermission } = useAuth();
  const [units, setUnits] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
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

  // Fetch units & master unit types
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resUnits, resMasters] = await Promise.all([
        unitsApi.list(),
        mastersApi.all(),
      ]);

      const unitsList = resUnits?.data?.units_of_measurement ?? resUnits?.units_of_measurement ?? (Array.isArray(resUnits) ? resUnits : []);
      setUnits(Array.isArray(unitsList) ? unitsList : []);

      const typeList = resMasters?.data?.unit_types ?? resMasters?.unit_types ?? [];
      setUnitTypes(Array.isArray(typeList) ? typeList : []);
    } catch (err) {
      toast.error('Failed to load units of measurement.');
      setUnits([]);
      setUnitTypes([]);
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
      unit_type_id: unitTypes[0]?.id ? String(unitTypes[0].id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      unit_code: item.unit_code || '',
      unit_name: item.unit_name || '',
      unit_symbol: item.unit_symbol || '',
      unit_type_id: String(item.unit_type_id || ''),
      decimal_places: String(item.decimal_places ?? '2'),
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

    if (!form.unit_name.trim()) validationErrs.unit_name = 'Unit name is required.';
    if (!form.unit_code.trim()) validationErrs.unit_code = 'Unit code is required.';
    if (!form.unit_symbol.trim()) validationErrs.unit_symbol = 'Symbol is required.';
    if (!form.unit_type_id) validationErrs.unit_type_id = 'Unit type is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        unit_code: form.unit_code.toUpperCase().trim(),
        unit_name: form.unit_name.trim(),
        unit_symbol: form.unit_symbol.trim(),
        unit_type_id: Number(form.unit_type_id),
        decimal_places: Number(form.decimal_places || 2),
        description: form.description.trim() || null,
        display_order: Number(form.display_order || 0),
        is_active: Number(form.is_active),
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await unitsApi.update(editingItem.id, payload);
        toast.success('Unit of measurement updated successfully.');
      } else {
        await unitsApi.create(payload);
        toast.success('Unit of measurement created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save unit of measurement.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await unitsApi.remove(deletingItem.id);
      toast.success('Unit of measurement deleted.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete unit of measurement.');
    }
  };

  // Filters & Search
  const filtered = useMemo(() => {
    return units.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.unit_name || '').toLowerCase().includes(q) ||
        String(item.unit_code || '').toLowerCase().includes(q) ||
        String(item.unit_symbol || '').toLowerCase().includes(q) ||
        String(item.unit_type_name || '').toLowerCase().includes(q)
      );
    });
  }, [units, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCount = units.length;
  const activeCount = units.filter(u => u.is_active).length;
  const systemCount = units.filter(u => u.is_system_defined).length;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Units of Measurement' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Units of Measurement" breadcrumbs={breadcrumbs} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Total Units" value={totalCount} icon={<Ruler />} status="primary" />
        <KpiCard label="System Standard Units" value={systemCount} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Active Status Units" value={activeCount} icon={<HelpCircle />} status="info" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by code, symbol, name..."
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
                Add Unit
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
                <th className="px-3 py-2 w-48">Unit Name</th>
                <th className="px-3 py-2 w-28">Code</th>
                <th className="px-3 py-2 w-24">Symbol</th>
                <th className="px-3 py-2 w-36">Type</th>
                <th className="px-3 py-2 w-28 text-center">Decimals</th>
                <th className="px-3 py-2 hidden md:table-cell">Description</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-muted text-[12px]">
                    Retrieving units list...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-muted text-[12px]">
                    No units of measurement found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.unit_name || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.unit_code || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px]">
                      {item.unit_symbol || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-secondary text-[11px] truncate">
                      {item.unit_type_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-text-primary text-[11px]">
                      {item.decimal_places !== null && item.decimal_places !== undefined ? item.decimal_places : '0'}
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
                        {hasPermission('master.update') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(item)}
                            disabled={Boolean(item.is_system_defined)}
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
                            disabled={Boolean(item.is_system_defined)}
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

      {/* Add / Edit Unit Modal */}
      <EntityEditModal
        isOpen={isAddOpen || Boolean(editingItem)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={Ruler}
          title={editingItem ? 'Edit Unit of Measurement' : 'Add Unit of Measurement'}
          subtitle="Configure unit codes, symbols, types and decimal precision settings."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="unit-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Unit Configurations">
              <EntityEditModal.Grid>
                <FormField label="Unit Name" required error={errors.unit_name}>
                  <Input
                    placeholder="e.g. Square Metre"
                    value={form.unit_name}
                    onChange={(e) => handleFormChange('unit_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Code" required error={errors.unit_code}>
                  <Input
                    placeholder="e.g. SQM"
                    value={form.unit_code}
                    onChange={(e) => handleFormChange('unit_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Symbol" required error={errors.unit_symbol}>
                  <Input
                    placeholder="e.g. m²"
                    value={form.unit_symbol}
                    onChange={(e) => handleFormChange('unit_symbol', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Type" required error={errors.unit_type_id}>
                  <Select
                    value={form.unit_type_id}
                    onChange={(val) => handleFormChange('unit_type_id', val)}
                    options={unitTypes.map((t) => ({ value: String(t.id), label: t.unit_type_name || t.name }))}
                    placeholder="Select unit type"
                  />
                </FormField>

                <FormField label="Decimal Places" error={errors.decimal_places}>
                  <Input
                    type="number"
                    min="0"
                    max="6"
                    placeholder="2"
                    value={form.decimal_places}
                    onChange={(e) => handleFormChange('decimal_places', e.target.value)}
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
                    placeholder="Details about unit type classification and conversion guidelines..."
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="unit-form"
            submitLabel={editingItem ? 'Update Unit' : 'Create Unit'}
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
        title="Delete Unit"
        message="Are you sure you want to delete this unit of measurement? System-defined units cannot be deleted."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
