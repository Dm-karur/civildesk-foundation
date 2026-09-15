import { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Edit, Trash2, ShieldCheck, MapPin, Ban, CheckCircle2, User, Building2 } from 'lucide-react';
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
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { subcontractsApi } from '../../../api/apiservice';

import { getSubcontractorTypes } from '../utils/subcontractorTypes';

const INITIAL_SUBCONTRACTORS = [
  { id: 1, contractor_code: 'SUB-2026-001', contractor_category: 'Individual', contractor_name: 'Apex Concrete Gang', phone: '9988776655', subcontractor_type_id: '1', subcontractor_type_label: 'SUB-MAIS - Maistry', status_id: 1, is_active: true },
  { id: 2, contractor_code: 'SUB-2026-002', contractor_category: 'Firm', contractor_name: 'Shree Balaji Shuttering', phone: '9988776656', subcontractor_type_id: '2', subcontractor_type_label: 'SUB-CARP - Carpenter', status_id: 1, is_active: true },
  { id: 3, contractor_code: 'SUB-2026-003', contractor_category: 'Individual', contractor_name: 'Sterling Centering Works', phone: '9988776657', subcontractor_type_id: '3', subcontractor_type_label: 'SUB-CENT - Centering', status_id: 1, is_active: true },
  { id: 4, contractor_code: 'SUB-2026-004', contractor_category: 'Firm', contractor_name: 'Premier Steel Reinforcement', phone: '9988776658', subcontractor_type_id: '4', subcontractor_type_label: 'SUB-BAR - Bar Bender', status_id: 1, is_active: true },
];

const EMPTY_FORM = {
  contractor_name: '',
  phone: '',
  subcontractor_type_id: '1',
  status_id: '1',
  contractor_category: 'Individual', // Default Individual (vs Firm)
  bank_name: '',
  account_no: '',
  ifsc: '',
};

export function SubcontractorsMasterPage() {
  const [typeOptions, setTypeOptions] = useState(() => {
    const raw = getSubcontractorTypes();
    return raw.map(t => ({
      value: String(t.id),
      label: `${t.type_code || 'TYPE'} - ${t.type_name || ''}`
    }));
  });
  const [subcontractors, setSubcontractors] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_subcontractors_master');
      return saved ? JSON.parse(saved) : INITIAL_SUBCONTRACTORS;
    } catch {
      return INITIAL_SUBCONTRACTORS;
    }
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Sync types from shared storage and events
  const syncTypes = () => {
    const raw = getSubcontractorTypes();
    setTypeOptions(raw.map(t => ({
      value: String(t.id),
      label: `${t.type_code || 'TYPE'} - ${t.type_name || ''}`
    })));
  };

  // Fetch Subcontractors from API with fallback
  const fetchSubcontractors = () => {
    setLoading(true);
    subcontractsApi.contractors.list().then(res => {
      const list = res?.data?.subcontractors ?? res?.data?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const types = getSubcontractorTypes();
        const formatted = list.map((c, idx) => {
          const sId = Number(c.status_id ?? (c.is_active === false || c.is_active === 0 ? 2 : 1));
          const tId = String(c.contractor_type_id || c.subcontractor_type_id || 1);
          const matchedType = types.find(t => String(t.id) === tId);
          return {
            id: c.id,
            contractor_code: c.contractor_code || `SUB-2026-${String(idx + 1).padStart(3, '0')}`,
            contractor_name: c.contractor_name || 'Subcontractor',
            phone: c.phone || '',
            subcontractor_type_id: tId,
            subcontractor_type_label: matchedType ? `${matchedType.type_code} - ${matchedType.type_name}` : (c.contractor_type_name || c.trade || 'Maistry'),
            status_id: sId,
            is_active: sId === 1,
          };
        });
        setSubcontractors(formatted);
      }
    }).catch(() => {
      // Keep local state
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    syncTypes();
    fetchSubcontractors();

    const handleTypesUpdated = () => syncTypes();
    window.addEventListener('subcontractor_types_updated', handleTypesUpdated);
    window.addEventListener('storage', handleTypesUpdated);
    return () => {
      window.removeEventListener('subcontractor_types_updated', handleTypesUpdated);
      window.removeEventListener('storage', handleTypesUpdated);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mock_subcontractors_master', JSON.stringify(subcontractors));
    } catch (e) {
      console.error(e);
    }
  }, [subcontractors]);

  const handleOpenAdd = () => {
    setForm({
      contractor_name: '',
      phone: '',
      subcontractor_type_id: typeOptions[0]?.value || '1',
      status_id: '1',
      contractor_category: 'Individual', // Default Individual
      bank_name: '',
      account_no: '',
      ifsc: '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      contractor_name: item.contractor_name || '',
      phone: item.phone || '',
      subcontractor_type_id: item.subcontractor_type_id ? String(item.subcontractor_type_id) : '1',
      status_id: String(item.status_id ?? (item.is_active ? 1 : 2)),
      contractor_category: item.contractor_category || 'Individual',
      bank_name: item.bank_name || '',
      account_no: item.account_no || item.bank_account_no || '',
      ifsc: item.ifsc || item.bank_ifsc || '',
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
    const errs = {};
    if (!form.contractor_name.trim()) errs.contractor_name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone Number is required';
    if (!form.subcontractor_type_id) errs.subcontractor_type_id = 'Subcontractor Type is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const selectedType = typeOptions.find(t => t.value === form.subcontractor_type_id);
    const statusId = Number(form.status_id || 1);
    const isActive = statusId === 1;

    const payload = {
      contractor_name: form.contractor_name.trim(),
      phone: form.phone.trim(),
      contractor_category: form.contractor_category,
      contractor_type_id: Number(form.subcontractor_type_id),
      subcontractor_type_id: Number(form.subcontractor_type_id),
      subcontractor_type_label: selectedType ? selectedType.label : '',
      status_id: statusId,
      is_active: isActive ? 1 : 0,
      bank_name: form.bank_name.trim(),
      account_no: form.account_no.trim(),
      bank_account_no: form.account_no.trim(),
      ifsc: form.ifsc.trim(),
      bank_ifsc: form.ifsc.trim(),
    };

    try {
      if (editingItem?.id) {
        await subcontractsApi.contractors.update(editingItem.id, payload).catch(() => {});
        setSubcontractors(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...payload, is_active: isActive } : t));
        toast.success('Subcontractor updated successfully.');
      } else {
        const res = await subcontractsApi.contractors.create(payload).catch(() => null);
        const newId = res?.data?.id || (subcontractors.length > 0 ? Math.max(...subcontractors.map(t => Number(t.id) || 0)) + 1 : 1);
        setSubcontractors(prev => [{
          id: newId,
          contractor_code: `SUB-2026-${String(newId).padStart(3, '0')}`,
          ...payload,
          is_active: isActive,
        }, ...prev]);
        toast.success('Subcontractor onboarded successfully.');
      }
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save subcontractor.');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatusId = item.status_id === 1 || item.is_active ? 2 : 1;
    const isActive = newStatusId === 1;
    try {
      await subcontractsApi.contractors.toggleStatus(item.id);
    } catch (e) {
      try {
        await subcontractsApi.contractors.update(item.id, {
          status_id: newStatusId,
          is_active: isActive ? 1 : 0,
        });
      } catch (err) {
        console.warn('Status toggle fallback to local state:', err);
      }
    }
    setSubcontractors(prev => prev.map(t => t.id === item.id ? {
      ...t,
      status_id: newStatusId,
      is_active: isActive,
    } : t));
    toast.success(`Subcontractor marked as ${isActive ? 'Active' : 'Inactive'}.`);
  };

  const confirmDelete = async () => {
    if (!deletingItem?.id) return;
    try {
      await subcontractsApi.contractors.delete(deletingItem.id);
    } catch (e) {
      console.warn('Backend delete fallback to local:', e);
    }
    setSubcontractors(prev => prev.filter(t => t.id !== deletingItem.id));
    toast.success(`Subcontractor "${deletingItem.contractor_name}" deleted.`);
    setDeletingItem(null);
  };

  // Safe Filtered List
  const filteredData = useMemo(() => {
    return subcontractors.filter((t) => {
      if (statusFilter !== 'all') {
        const isActive = t.status_id === 1 || t.is_active === true;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      if (typeFilter !== 'all') {
        if (String(t.subcontractor_type_id) !== typeFilter) return false;
      }
      if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        const matches = (t.contractor_name || '').toLowerCase().includes(lower) ||
          (t.contractor_code || '').toLowerCase().includes(lower) ||
          (t.phone || '').toLowerCase().includes(lower) ||
          (t.subcontractor_type_label || '').toLowerCase().includes(lower);
        if (!matches) return false;
      }
      return true;
    });
  }, [subcontractors, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const pagedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const activeCount = subcontractors.filter(s => s.status_id === 1 || s.is_active).length;
  const inactiveCount = subcontractors.filter(s => s.status_id === 2 || !s.is_active).length;

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractors Master"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subcontractor Master', href: '/masters/subcontractor-types' },
          { label: 'Subcontractors' },
        ]}
      />

      <div className="flex w-full flex-col gap-3 sm:gap-4">
        {/* KPI Ribbons */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 sm:gap-3">
          <KpiCard label="Total Subcontractors" value={subcontractors.length} icon={<Users />} status="info" />
          <KpiCard label="Active Subcontractors" value={activeCount} icon={<ShieldCheck className="text-emerald-500" />} status="success" />
          <KpiCard label="Inactive Subcontractors" value={inactiveCount} icon={<Ban className="text-amber-500" />} status="neutral" />
        </div>

        {/* Controls and Filters */}
        <div className="flex flex-col items-stretch justify-between gap-2.5 rounded-lg border border-border bg-surface p-2.5 shadow-xs sm:flex-row sm:items-center sm:p-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'all', label: 'All Subcontractor Types' },
                  ...typeOptions.map(t => ({
                    value: t.value,
                    label: t.label,
                  }))
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search subcontractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={handleOpenAdd}
            className="h-8 text-xs shadow-xs shrink-0"
          >
            Add New Subcontractor
          </Button>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredData.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            }
          >
            <table className="w-full table-auto text-left text-[12px]">
              <thead className="border-b border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="w-10 px-3 py-2 text-center">#</th>
                  <th className="w-36 px-3 py-2">Subcontractor Code</th>
                  <th className="px-3 py-2">Contractor Name</th>
                  <th className="px-3 py-2 w-36">Phone Number</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="w-36 px-3 py-2 text-center">Individual or Firm</th>
                  <th className="w-24 px-3 py-2 text-center">Status</th>
                  <th className="w-28 px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-[12px] text-text-muted">
                      Loading subcontractors...
                    </td>
                  </tr>
                ) : pagedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-[12px] text-text-muted">
                      No subcontractors found.
                    </td>
                  </tr>
                ) : (
                  pagedData.map((item, idx) => {
                    const isActive = item.status_id === 1 || item.is_active;
                    const isFirm = item.contractor_category === 'Firm';
                    return (
                      <tr key={item.id} className="group transition-colors hover:bg-surface-muted/30">
                        <td className="px-3 py-2 text-center text-[11px] font-medium text-text-primary">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {item.contractor_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={item.contractor_name}>
                            {item.contractor_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                          {item.phone || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[11px] text-text-primary font-medium">
                            {item.subcontractor_type_label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge 
                            variant={isFirm ? 'secondary' : 'primary'}
                            className={`text-[10px] font-semibold px-2 py-0.5 inline-flex items-center gap-1 ${
                              isFirm
                                ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-700 border border-blue-500/30'
                            }`}
                          >
                            {isFirm ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {item.contractor_category || 'Individual'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge 
                            variant={isActive ? 'success' : 'neutral'}
                            className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit className="h-3.5 w-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title={isActive ? 'Mark Inactive' : 'Mark Active'}
                              onClick={() => handleToggleStatus(item)}
                            >
                              {isActive ? (
                                <Ban className="h-3.5 w-3.5 text-text-secondary hover:text-amber-600" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 hover:text-emerald-700" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete Subcontractor"
                              onClick={() => setDeletingItem(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-text-secondary hover:text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {pagedData.map((item) => {
            const isActive = item.status_id === 1 || item.is_active;
            return (
              <div key={item.id} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block mb-0.5">{item.contractor_code}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{item.contractor_name}</h4>
                    <span className="text-[11px] text-primary font-medium">{item.subcontractor_type_label}</span>
                  </div>
                  <Badge 
                    variant={isActive ? 'success' : 'neutral'}
                    className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center shrink-0"
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="text-xs pt-1 border-t border-border/60 text-text-secondary font-mono">
                  <span className="block text-[10px] uppercase font-bold text-text-muted mb-1 font-sans">Contact</span>
                  {item.phone || 'No number provided'}
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-border/60 gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={() => handleOpenEdit(item)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5"
                    onClick={() => handleToggleStatus(item)}
                    title={isActive ? 'Mark Inactive' : 'Mark Active'}
                  >
                    {isActive ? <Ban className="w-3 h-3 text-amber-600 mr-1" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />}
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 text-red-500 hover:text-red-600 border-border"
                    onClick={() => setDeletingItem(item)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredData.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <EntityEditModal
        isOpen={isAddOpen || !!editingItem}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={Users}
          title={editingItem ? 'Edit Subcontractor' : 'Add New Subcontractor'}
          subtitle="Record contractor profile, subcontractor type, and operational status."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            {/* Category Selector (Individual vs Firm) */}
            <div className="bg-surface-muted/60 p-3 rounded-lg border border-border flex flex-col gap-2">
              <label className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                Subcontractor Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFormChange('contractor_category', 'Individual')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    form.contractor_category === 'Individual'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-muted'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Individual</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    form.contractor_category === 'Individual' ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-muted'
                  }`}>
                    Default
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFormChange('contractor_category', 'Firm')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    form.contractor_category === 'Firm'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-muted'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Firm / Company</span>
                </button>
              </div>
            </div>

            <EntityEditModal.Section title={form.contractor_category === 'Individual' ? 'Individual Contractor Information' : 'Firm Information'}>
              <EntityEditModal.Grid>
                <FormField label={form.contractor_category === 'Individual' ? 'Subcontractor Name' : 'Firm / Company Name'} error={errors.contractor_name} required className="sm:col-span-2">
                  <Input
                    placeholder={form.contractor_category === 'Individual' ? 'e.g. M. Selvam' : 'e.g. Sri Murugan Civil Infra Pvt Ltd'}
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                  />
                </FormField>
                
                <FormField label="Phone Number" error={errors.phone} required>
                  <Input
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </FormField>

                <FormField label="Account Status">
                  <Select
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '2', label: 'Inactive' },
                    ]}
                    value={form.status_id}
                    onChange={(val) => handleFormChange('status_id', val)}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Subcontractor Type" error={errors.subcontractor_type_id} required>
                    <SearchableSelect
                      options={typeOptions}
                      placeholder="Search and select subcontractor type..."
                      value={form.subcontractor_type_id}
                      onChange={(val) => handleFormChange('subcontractor_type_id', val)}
                    />
                  </FormField>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Bank Details (for Direct Payment Settlements)">
              <EntityEditModal.Grid>
                <FormField label="Bank & Branch Name">
                  <Input
                    placeholder="e.g. State Bank of India - Chennai"
                    value={form.bank_name}
                    onChange={(e) => handleFormChange('bank_name', e.target.value)}
                  />
                </FormField>
                <FormField label="Account Number">
                  <Input
                    placeholder="e.g. 30894561234"
                    value={form.account_no}
                    onChange={(e) => handleFormChange('account_no', e.target.value)}
                  />
                </FormField>
                <FormField label="IFSC Code" className="sm:col-span-2">
                  <Input
                    placeholder="e.g. SBIN0001234"
                    value={form.ifsc}
                    onChange={(e) => handleFormChange('ifsc', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Save Changes' : 'Add Subcontractor'}
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Delete Subcontractor"
        message={`Are you sure you want to delete "${deletingItem?.contractor_name}"?`}
        variant="danger"
        confirmLabel="Delete Subcontractor"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
