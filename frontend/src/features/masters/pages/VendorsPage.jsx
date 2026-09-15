import { useState, useEffect, useMemo, useCallback } from 'react';
import { Truck, Plus, Edit, Trash2, ShieldCheck, ChevronRight, HelpCircle, Eye } from 'lucide-react';
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
  supplier_code: '',
  supplier_name: '',
  contact_person: '',
  phone: '',
  alternate_phone: '',
  email: '',
  gstin: '',
  pan: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_name: '',
  postal_code: '',
  payment_terms_days: '',
  credit_limit: '0',
  bank_name: '',
  bank_account_name: '',
  bank_account_no: '',
  bank_ifsc: '',
  rating: '5',
  status_id: '',
  notes: '',
};

export function VendorsPage() {
  const { hasPermission } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resVendors, resMasters] = await Promise.all([
        materialsApi.suppliers.list(),
        materialsApi.masters(),
      ]);

      const vendorList = resVendors?.data?.material_suppliers ?? resVendors?.material_suppliers ?? (Array.isArray(resVendors) ? resVendors : []);
      setVendors(Array.isArray(vendorList) ? vendorList : []);

      const statusList = resMasters?.data?.masters?.supplier_statuses ?? resMasters?.masters?.supplier_statuses ?? resMasters?.data?.supplier_statuses ?? resMasters?.supplier_statuses ?? [];
      setStatuses(Array.isArray(statusList) ? statusList : []);
    } catch (err) {
      toast.error('Failed to load vendor/supplier data.');
      setVendors([]);
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
    const activeStatus = statuses.find(s => s.status_code === 'ACTIVE') || statuses[0];
    setForm({
      ...EMPTY_FORM,
      status_id: activeStatus?.id ? String(activeStatus.id) : '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      supplier_code: item.supplier_code || '',
      supplier_name: item.supplier_name || '',
      contact_person: item.contact_person || '',
      phone: item.phone || '',
      alternate_phone: item.alternate_phone || '',
      email: item.email || '',
      gstin: item.gstin || '',
      pan: item.pan || '',
      address_line1: item.address_line1 || '',
      address_line2: item.address_line2 || '',
      city: item.city || '',
      state_name: item.state_name || '',
      postal_code: item.postal_code || '',
      payment_terms_days: item.payment_terms_days !== null && item.payment_terms_days !== undefined ? String(item.payment_terms_days) : '',
      credit_limit: item.credit_limit !== null && item.credit_limit !== undefined ? String(item.credit_limit) : '0',
      bank_name: item.bank_name || '',
      bank_account_name: item.bank_account_name || '',
      bank_account_no: item.bank_account_no || '',
      bank_ifsc: item.bank_ifsc || '',
      rating: String(item.rating ?? '5'),
      status_id: String(item.status_id || ''),
      notes: item.notes || '',
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

    if (!form.supplier_name.trim()) validationErrs.supplier_name = 'Vendor name is required.';
    if (!form.supplier_code.trim()) validationErrs.supplier_code = 'Vendor code is required.';
    if (!form.status_id) validationErrs.status_id = 'Status is required.';

    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier_code: form.supplier_code.toUpperCase().trim(),
        supplier_name: form.supplier_name.trim(),
        contact_person: form.contact_person.trim() || null,
        phone: form.phone.trim() || null,
        alternate_phone: form.alternate_phone.trim() || null,
        email: form.email.trim() || null,
        gstin: form.gstin.toUpperCase().trim() || null,
        pan: form.pan.toUpperCase().trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim() || null,
        state_name: form.state_name.trim() || null,
        postal_code: form.postal_code.trim() || null,
        payment_terms_days: form.payment_terms_days === '' ? null : Number(form.payment_terms_days),
        credit_limit: Number(form.credit_limit || 0),
        bank_name: form.bank_name.trim() || null,
        bank_account_name: form.bank_account_name.trim() || null,
        bank_account_no: form.bank_account_no.trim() || null,
        bank_ifsc: form.bank_ifsc.toUpperCase().trim() || null,
        rating: Number(form.rating || 5),
        status_id: Number(form.status_id),
        notes: form.notes.trim() || null,
      };

      const isEditing = Boolean(editingItem?.id);
      if (isEditing) {
        await materialsApi.suppliers.update(editingItem.id, payload);
        toast.success('Vendor profile updated successfully.');
      } else {
        await materialsApi.suppliers.create(payload);
        toast.success('Vendor profile created successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Unable to save vendor profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      await materialsApi.suppliers.remove(deletingItem.id);
      toast.success('Vendor deleted successfully.');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Unable to delete vendor profile.');
    }
  };

  // Filters & Search
  const filtered = useMemo(() => {
    return vendors.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.supplier_name || '').toLowerCase().includes(q) ||
        String(item.supplier_code || '').toLowerCase().includes(q) ||
        String(item.contact_person || '').toLowerCase().includes(q) ||
        String(item.phone || '').toLowerCase().includes(q)
      );
    });
  }, [vendors, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCount = vendors.length;
  const ratingAvg = useMemo(() => {
    if (vendors.length === 0) return 0;
    return (vendors.reduce((acc, v) => acc + Number(v.rating || 5), 0) / vendors.length).toFixed(1);
  }, [vendors]);
  const activeCount = vendors.filter((v) => {
    const status = statuses.find(s => s.id === v.status_id);
    return status?.status_code === 'ACTIVE' || v.is_active;
  }).length;

  return (
    <PageContainer>
      <PageHeader title="Vendor Registry" breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Masters' },
        { label: 'Vendors & Suppliers' },
      ]} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Registered Vendors" value={totalCount} icon={<Truck />} status="primary" />
        <KpiCard label="Active Vendors" value={activeCount} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Average Quality Rating" value={`${ratingAvg} / 5.0`} icon={<HelpCircle />} status="info" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search vendor name, code, contact..."
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
                Add Vendor
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
                <th className="px-3 py-2 w-48">Vendor Name</th>
                <th className="px-3 py-2 w-36">Contact Person</th>
                <th className="px-3 py-2 w-32">Phone</th>
                <th className="px-3 py-2 w-32 text-right">Credit Limit</th>
                <th className="px-3 py-2 hidden md:table-cell">City / Town</th>
                <th className="px-3 py-2 w-20 text-center">Rating</th>
                <th className="px-3 py-2 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-muted text-[12px]">
                    Loading vendors list...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-text-muted text-[12px]">
                    No suppliers/vendors found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.supplier_code || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.supplier_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px] truncate">
                      {item.contact_person || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px]">
                      {item.phone || '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary text-[11px] font-semibold">
                      ₹{Number(item.credit_limit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.city || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-[11px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                        ★ {item.rating || '5'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Details"
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
          icon={Truck}
          title={editingItem ? 'Edit Vendor Profile' : 'Add Vendor Profile'}
          subtitle="Configure business codes, PAN/GSTIN, ratings and bank specifications."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form id="vendor-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Company Registry">
              <EntityEditModal.Grid>
                <FormField label="Vendor Code" required error={errors.supplier_code}>
                  <Input
                    placeholder="e.g. VEND-ACC"
                    value={form.supplier_code}
                    onChange={(e) => handleFormChange('supplier_code', e.target.value)}
                    disabled={Boolean(editingItem)}
                  />
                </FormField>

                <FormField label="Vendor Name" required error={errors.supplier_name}>
                  <Input
                    placeholder="e.g. ACC Cement Distributors"
                    value={form.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Contact Person" error={errors.contact_person}>
                  <Input
                    placeholder="e.g. John Doe"
                    value={form.contact_person}
                    onChange={(e) => handleFormChange('contact_person', e.target.value)}
                  />
                </FormField>

                <FormField label="Primary Phone" error={errors.phone}>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </FormField>

                <FormField label="Alternate Phone" error={errors.alternate_phone}>
                  <Input
                    placeholder="e.g. 9876543211"
                    value={form.alternate_phone}
                    onChange={(e) => handleFormChange('alternate_phone', e.target.value)}
                  />
                </FormField>

                <FormField label="Email Address" error={errors.email}>
                  <Input
                    type="email"
                    placeholder="e.g. sales@vendor.com"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </FormField>

                <FormField label="GSTIN" error={errors.gstin}>
                  <Input
                    placeholder="15-digit GSTIN"
                    value={form.gstin}
                    onChange={(e) => handleFormChange('gstin', e.target.value)}
                  />
                </FormField>

                <FormField label="PAN" error={errors.pan}>
                  <Input
                    placeholder="10-digit PAN"
                    value={form.pan}
                    onChange={(e) => handleFormChange('pan', e.target.value)}
                  />
                </FormField>

                <FormField label="Payment Terms (Days)" error={errors.payment_terms_days}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    value={form.payment_terms_days}
                    onChange={(e) => handleFormChange('payment_terms_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Credit Limit (₹)" error={errors.credit_limit}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
                    value={form.credit_limit}
                    onChange={(e) => handleFormChange('credit_limit', e.target.value)}
                  />
                </FormField>

                <FormField label="Vendor Rating (1-5)" error={errors.rating}>
                  <Select
                    value={form.rating}
                    onChange={(val) => handleFormChange('rating', val)}
                    options={[
                      { value: '5', label: '5 Stars (Excellent)' },
                      { value: '4', label: '4 Stars (Good)' },
                      { value: '3', label: '3 Stars (Standard)' },
                      { value: '2', label: '2 Stars (Below Standard)' },
                      { value: '1', label: '1 Star (Poor)' },
                    ]}
                  />
                </FormField>

                <FormField label="Workflow Status" required error={errors.status_id}>
                  <Select
                    value={form.status_id}
                    onChange={(val) => handleFormChange('status_id', val)}
                    options={[
                      { value: '', label: 'Select status' },
                      ...statuses.map((s) => ({ value: String(s.id), label: s.status_name }))
                    ]}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Address & Locations">
              <EntityEditModal.Grid>
                <FormField label="Address Line 1" className="md:col-span-2" error={errors.address_line1}>
                  <Input
                    placeholder="Building / Warehouse name..."
                    value={form.address_line1}
                    onChange={(e) => handleFormChange('address_line1', e.target.value)}
                  />
                </FormField>

                <FormField label="Address Line 2" className="md:col-span-2" error={errors.address_line2}>
                  <Input
                    placeholder="Street / Locality details..."
                    value={form.address_line2}
                    onChange={(e) => handleFormChange('address_line2', e.target.value)}
                  />
                </FormField>

                <FormField label="City / Town" error={errors.city}>
                  <Input
                    placeholder="e.g. Karur"
                    value={form.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                  />
                </FormField>

                <FormField label="State" error={errors.state_name}>
                  <Input
                    placeholder="e.g. Tamil Nadu"
                    value={form.state_name}
                    onChange={(e) => handleFormChange('state_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Postal Code" error={errors.postal_code}>
                  <Input
                    placeholder="e.g. 639001"
                    value={form.postal_code}
                    onChange={(e) => handleFormChange('postal_code', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Bank Settlement Ledger">
              <EntityEditModal.Grid>
                <FormField label="Bank Name" error={errors.bank_name}>
                  <Input
                    placeholder="e.g. State Bank of India"
                    value={form.bank_name}
                    onChange={(e) => handleFormChange('bank_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Beneficiary Account Name" error={errors.bank_account_name}>
                  <Input
                    placeholder="Beneficiary name..."
                    value={form.bank_account_name}
                    onChange={(e) => handleFormChange('bank_account_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Account Number" error={errors.bank_account_no}>
                  <Input
                    placeholder="Settlement account number..."
                    value={form.bank_account_no}
                    onChange={(e) => handleFormChange('bank_account_no', e.target.value)}
                  />
                </FormField>

                <FormField label="Bank IFSC Code" error={errors.bank_ifsc}>
                  <Input
                    placeholder="e.g. SBIN0001234"
                    value={form.bank_ifsc}
                    onChange={(e) => handleFormChange('bank_ifsc', e.target.value)}
                  />
                </FormField>

                <FormField label="Administration Notes" className="md:col-span-2" error={errors.notes}>
                  <Textarea
                    placeholder="Remarks, discount options, or past performance notes..."
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={2}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="vendor-form"
            submitLabel={editingItem ? 'Update Vendor' : 'Create Vendor'}
            onCancel={() => {
              setIsAddOpen(false);
              setEditingItem(null);
            }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* View Details Modal */}
      <EntityEditModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
      >
        <EntityEditModal.Header
          icon={Truck}
          title="Vendor Business Profile"
          subtitle="Complete business records, ratings, PAN/GSTIN, and settlement options."
          onClose={() => setViewingItem(null)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="General Information">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Vendor Name</div>
                  <div className="text-[13px] font-medium text-text-primary mt-1">{viewingItem?.supplier_name || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Vendor Code</div>
                  <div className="text-[13px] font-mono font-semibold text-text-primary mt-1">{viewingItem?.supplier_code || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Contact Person</div>
                  <div className="text-[13px] text-text-primary mt-1">{viewingItem?.contact_person || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Phone & Email</div>
                  <div className="text-[12px] text-text-primary mt-1">
                    {viewingItem?.phone || '—'} <br />
                    <span className="text-text-secondary">{viewingItem?.email || ''}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">PAN & GSTIN</div>
                  <div className="text-[12px] font-mono text-text-primary mt-1">
                    GSTIN: {viewingItem?.gstin || '—'} <br />
                    PAN: {viewingItem?.pan || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Credit Limit & Terms</div>
                  <div className="text-[12px] text-text-primary mt-1">
                    Limit: ₹{Number(viewingItem?.credit_limit || 0).toLocaleString('en-IN')} <br />
                    Terms: {viewingItem?.payment_terms_days !== null && viewingItem?.payment_terms_days !== undefined ? `${viewingItem.payment_terms_days} Days` : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Vendor Quality Rating</div>
                  <div className="mt-1">
                    <span className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                      ★ {viewingItem?.rating || '5'} / 5.0
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Address Details</div>
                  <div className="text-[12px] text-text-secondary mt-1 leading-normal">
                    {viewingItem?.address_line1} {viewingItem?.address_line2} <br />
                    {viewingItem?.city} {viewingItem?.state_name} {viewingItem?.postal_code}
                  </div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Settlement Bank details">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Bank Name</div>
                  <div className="text-[12px] font-medium text-text-primary mt-1">{viewingItem?.bank_name || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Account Holder</div>
                  <div className="text-[12px] text-text-primary mt-1">{viewingItem?.bank_account_name || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Account Number</div>
                  <div className="text-[12px] font-mono text-text-primary mt-1">{viewingItem?.bank_account_no || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">IFSC Code</div>
                  <div className="text-[12px] font-mono text-text-primary mt-1">{viewingItem?.bank_ifsc || '—'}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Administration Notes</div>
                  <div className="text-[12px] text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                    {viewingItem?.notes || 'No notes compiled for this vendor.'}
                  </div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <div className="flex items-center justify-end border-t border-border px-4 py-3 bg-surface-subtle">
            <Button variant="ghost" className="h-9 px-4 text-[13px]" onClick={() => setViewingItem(null)}>
              Close
            </Button>
          </div>
        </div>
      </EntityEditModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Delete Vendor"
        description={`Are you sure you want to delete vendor "${deletingItem?.supplier_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive={true}
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
