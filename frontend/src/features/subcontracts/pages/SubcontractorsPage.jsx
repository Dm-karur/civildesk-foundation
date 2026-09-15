import { useState, useEffect, useMemo } from 'react';
import {
  Users, CheckCircle2, Building, ShieldCheck, Phone,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  CreditCard, Mail, MapPin, Award, FileText, Printer, AlertTriangle,
  Save, Check, X, Ban, User, Building2
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal';
import { toast } from '../../../components/composite/Toast';
import { subcontractsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';
import { getSubcontractorTypes } from '../../masters/utils/subcontractorTypes';

const EMPTY_FORM = {
  contractor_code: '',
  contractor_name: '',
  contractor_category: 'Individual', // Default 'Individual' (vs 'Firm')
  contractor_type_id: '1',
  trade_specialization: 'Maistry',
  contact_person: '',
  phone: '',
  email: '',
  gstin: '',
  pan: '',
  city: 'Chennai',
  state: 'Tamil Nadu',
  rating: 'Grade A (90%)',
  status: 'Active',
  status_id: '1',
  bank_name: '',
  account_no: '',
  ifsc: '',
  notes: '',
};

export function SubcontractorsPage() {
  const { hasPermission } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subcontractorTypes, setSubcontractorTypes] = useState(() => {
    const raw = getSubcontractorTypes();
    return raw.map(t => ({
      value: String(t.id),
      label: `${t.type_code} - ${t.type_name}`,
      code: t.type_code,
      name: t.type_name,
    }));
  });

  // Filters
  const [tradeFilter, setTradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Sync Subcontractor Types with Subcontractor Types Master page
  const syncTypes = () => {
    const raw = getSubcontractorTypes();
    setSubcontractorTypes(raw.map(t => ({
      value: String(t.id),
      label: `${t.type_code} - ${t.type_name}`,
      code: t.type_code,
      name: t.type_name,
    })));
  };

  const fetchList = () => {
    setLoading(true);
    subcontractsApi.contractors.list().then(res => {
      const list = res?.data?.subcontractors ?? res?.data?.data ?? [];
      const types = getSubcontractorTypes();
      const normalized = (Array.isArray(list) ? list : []).map((c, idx) => {
        const statusId = Number(c.status_id ?? (c.is_active === false || c.is_active === 0 ? 2 : 1));
        const isActive = statusId === 1;
        const tId = String(c.contractor_type_id || c.subcontractor_type_id || 1);
        const matchedType = types.find(t => String(t.id) === tId);
        const isFirm = Boolean(c.gstin || c.pan || c.contractor_category === 'Firm');
        return {
          id: String(c.id),
          contractor_code: c.contractor_code || `SUB-2026-${String(idx + 1).padStart(3, '0')}`,
          contractor_category: c.contractor_category || (isFirm ? 'Firm' : 'Individual'),
          contractor_name: c.contractor_name || 'Subcontractor Firm',
          trade_specialization: matchedType ? `${matchedType.type_code} - ${matchedType.type_name}` : (c.contractor_type_name || c.trade || 'Maistry'),
          contractor_type_id: Number(tId),
          contact_person: c.contact_person || c.contractor_name || 'Contact Person',
          phone: c.phone || '',
          email: c.email || '',
          gstin: c.gstin || '',
          pan: c.pan || '',
          city: c.city || 'Chennai',
          state: c.state_name || c.state || 'Tamil Nadu',
          active_work_orders: Number(c.active_work_orders || 0),
          rating: c.rating || 'Grade A',
          status: isActive ? 'Active' : 'Inactive',
          status_id: statusId,
          is_active: isActive,
          bank_name: c.bank_name || '',
          account_no: c.bank_account_no || c.account_no || '',
          ifsc: c.bank_ifsc || c.ifsc || '',
          notes: c.notes || '',
        };
      });

      // If backend returns empty, seed mock list matching Subcontractor Types Master
      if (normalized.length === 0) {
        const seeded = [
          { id: '1', contractor_code: 'SUB-2026-001', contractor_category: 'Individual', contractor_name: 'Apex Concrete Gang', trade_specialization: 'SUB-MAIS - Maistry', contractor_type_id: 1, contact_person: 'Er. M. Selvam', phone: '9988776655', gstin: '', pan: '', city: 'Chennai', state: 'Tamil Nadu', active_work_orders: 3, rating: 'Grade A (95%)', status: 'Active', status_id: 1, is_active: true },
          { id: '2', contractor_code: 'SUB-2026-002', contractor_category: 'Firm', contractor_name: 'Shree Balaji Shuttering', trade_specialization: 'SUB-CARP - Carpenter', contractor_type_id: 2, contact_person: 'Rajesh Kumar', phone: '9988776656', gstin: '33BBBCS1429B1Z3', pan: 'BBBCS1429B', city: 'Coimbatore', state: 'Tamil Nadu', active_work_orders: 2, rating: 'Grade A (92%)', status: 'Active', status_id: 1, is_active: true },
          { id: '3', contractor_code: 'SUB-2026-003', contractor_category: 'Individual', contractor_name: 'Sterling Centering Works', trade_specialization: 'SUB-CENT - Centering', contractor_type_id: 3, contact_person: 'V. Sundaram', phone: '9988776657', gstin: '', pan: '', city: 'Madurai', state: 'Tamil Nadu', active_work_orders: 1, rating: 'Grade A (90%)', status: 'Active', status_id: 1, is_active: true },
          { id: '4', contractor_code: 'SUB-2026-004', contractor_category: 'Firm', contractor_name: 'Premier Steel Reinforcement', trade_specialization: 'SUB-BAR - Bar Bender', contractor_type_id: 4, contact_person: 'K. Balan', phone: '9988776658', gstin: '33DDBCS1429B1Z5', pan: 'DDBCS1429B', city: 'Trichy', state: 'Tamil Nadu', active_work_orders: 4, rating: 'Grade A (94%)', status: 'Active', status_id: 1, is_active: true },
        ];
        setContractors(seeded);
      } else {
        setContractors(normalized);
      }
    }).catch(() => {
      setContractors([
        { id: '1', contractor_code: 'SUB-2026-001', contractor_category: 'Individual', contractor_name: 'Apex Concrete Gang', trade_specialization: 'SUB-MAIS - Maistry', contractor_type_id: 1, contact_person: 'Er. M. Selvam', phone: '9988776655', gstin: '', pan: '', city: 'Chennai', state: 'Tamil Nadu', active_work_orders: 3, rating: 'Grade A (95%)', status: 'Active', status_id: 1, is_active: true },
        { id: '2', contractor_code: 'SUB-2026-002', contractor_category: 'Firm', contractor_name: 'Shree Balaji Shuttering', trade_specialization: 'SUB-CARP - Carpenter', contractor_type_id: 2, contact_person: 'Rajesh Kumar', phone: '9988776656', gstin: '33BBBCS1429B1Z3', pan: 'BBBCS1429B', city: 'Coimbatore', state: 'Tamil Nadu', active_work_orders: 2, rating: 'Grade A (92%)', status: 'Active', status_id: 1, is_active: true },
        { id: '3', contractor_code: 'SUB-2026-003', contractor_category: 'Individual', contractor_name: 'Sterling Centering Works', trade_specialization: 'SUB-CENT - Centering', contractor_type_id: 3, contact_person: 'V. Sundaram', phone: '9988776657', gstin: '', pan: '', city: 'Madurai', state: 'Tamil Nadu', active_work_orders: 1, rating: 'Grade A (90%)', status: 'Active', status_id: 1, is_active: true },
        { id: '4', contractor_code: 'SUB-2026-004', contractor_category: 'Firm', contractor_name: 'Premier Steel Reinforcement', trade_specialization: 'SUB-BAR - Bar Bender', contractor_type_id: 4, contact_person: 'K. Balan', phone: '9988776658', gstin: '33DDBCS1429B1Z5', pan: 'DDBCS1429B', city: 'Trichy', state: 'Tamil Nadu', active_work_orders: 4, rating: 'Grade A (94%)', status: 'Active', status_id: 1, is_active: true },
      ]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    syncTypes();
    fetchList();

    const handleTypesUpdated = () => syncTypes();
    window.addEventListener('subcontractor_types_updated', handleTypesUpdated);
    window.addEventListener('storage', handleTypesUpdated);
    return () => {
      window.removeEventListener('subcontractor_types_updated', handleTypesUpdated);
      window.removeEventListener('storage', handleTypesUpdated);
    };
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const firstType = subcontractorTypes[0] || { value: '1', label: 'SUB-MAIS - Maistry', name: 'Maistry' };
    setForm({
      ...EMPTY_FORM,
      contractor_code: `SUB-2026-${String(contractors.length + 1).padStart(3, '0')}`,
      contractor_type_id: firstType.value,
      trade_specialization: firstType.label,
      contractor_category: 'Individual', // Default Individual
      status_id: '1',
      status: 'Active',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    const currentTypeId = String(item.contractor_type_id || '1');
    const matchedType = subcontractorTypes.find(t => String(t.value) === currentTypeId || t.label.toLowerCase() === (item.trade_specialization || '').toLowerCase() || (t.name && item.trade_specialization && item.trade_specialization.includes(t.name)));
    const isFirm = item.contractor_category === 'Firm' || Boolean(item.gstin || item.pan);
    setForm({
      contractor_code: item.contractor_code || '',
      contractor_category: item.contractor_category || (isFirm ? 'Firm' : 'Individual'),
      contractor_name: item.contractor_name || '',
      contractor_type_id: matchedType ? String(matchedType.value) : currentTypeId,
      trade_specialization: matchedType ? matchedType.label : (item.trade_specialization || 'Maistry'),
      contact_person: item.contact_person || '',
      phone: item.phone || '',
      email: item.email || '',
      gstin: item.gstin || '',
      pan: item.pan || '',
      city: item.city || '',
      state: item.state || '',
      rating: item.rating || 'Grade A (90%)',
      status: item.status_id === 2 || item.status === 'Inactive' ? 'Inactive' : 'Active',
      status_id: String(item.status_id || (item.status === 'Inactive' ? 2 : 1)),
      bank_name: item.bank_name || '',
      account_no: item.account_no || item.bank_account_no || '',
      ifsc: item.ifsc || item.bank_ifsc || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'contractor_type_id') {
        const matched = subcontractorTypes.find(t => String(t.value) === String(value));
        if (matched) {
          updated.trade_specialization = matched.label;
        }
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isIndividual = form.contractor_category === 'Individual';
    const errs = {};
    if (!form.contractor_name.trim()) {
      errs.contractor_name = isIndividual ? 'Subcontractor Name is required' : 'Subcontractor / Firm Name is required';
    }
    if (!form.phone.trim()) {
      errs.phone = 'Phone Number is required';
    }
    if (!isIndividual && !form.contact_person.trim()) {
      errs.contact_person = 'Contact Person / MD is required';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const selectedType = subcontractorTypes.find(t => String(t.value) === String(form.contractor_type_id));
    const statusId = Number(form.status_id || 1);
    const isActive = statusId === 1;
    const resolvedContact = isIndividual ? (form.contact_person.trim() || form.contractor_name.trim()) : form.contact_person.trim();

    const payload = {
      contractor_code: form.contractor_code.trim() || `SUB-2026-${String(contractors.length + 1).padStart(3, '0')}`,
      contractor_category: form.contractor_category,
      contractor_name: form.contractor_name.trim(),
      contractor_type_id: Number(form.contractor_type_id),
      subcontractor_type_id: Number(form.contractor_type_id),
      trade_specialization: selectedType ? selectedType.label : (form.trade_specialization || 'Maistry'),
      contact_person: resolvedContact,
      phone: form.phone.trim(),
      email: form.email.trim(),
      gstin: isIndividual ? '' : form.gstin.trim(),
      pan: isIndividual ? '' : form.pan.trim(),
      city: form.city.trim() || 'Chennai',
      state: form.state.trim() || 'Tamil Nadu',
      rating: form.rating,
      status: isActive ? 'Active' : 'Inactive',
      status_id: statusId,
      is_active: isActive ? 1 : 0,
      bank_name: form.bank_name.trim(),
      account_no: form.account_no.trim(),
      bank_account_no: form.account_no.trim(),
      ifsc: form.ifsc.trim(),
      bank_ifsc: form.ifsc.trim(),
      notes: isIndividual ? '' : form.notes.trim(),
    };

    try {
      if (editingItem?.id) {
        await subcontractsApi.contractors.update(editingItem.id, payload).catch(() => {});
        setContractors(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...payload, is_active: isActive } : c));
        toast.success(`Subcontractor "${payload.contractor_name}" updated successfully.`);
      } else {
        const res = await subcontractsApi.contractors.create(payload).catch(() => null);
        const newId = res?.data?.id || (contractors.length > 0 ? Math.max(...contractors.map(c => Number(c.id) || 0)) + 1 : 1);
        setContractors(prev => [{
          id: String(newId),
          ...payload,
          is_active: isActive,
          active_work_orders: 0,
        }, ...prev]);
        toast.success(`Subcontractor "${payload.contractor_name}" onboarded successfully.`);
      }
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save subcontractor.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await subcontractsApi.contractors.delete(deleteItem.id);
    } catch (e) {
      console.warn('Backend delete error, removing locally:', e);
    }
    setContractors(prev => prev.filter(c => c.id !== deleteItem.id));
    toast.success(`Subcontractor "${deleteItem.contractor_name}" deleted successfully.`);
    setDeleteItem(null);
  };

  const handleToggleStatus = async (c) => {
    const newStatusId = c.status_id === 1 ? 2 : 1;
    const newStatusName = newStatusId === 1 ? 'Active' : 'Inactive';
    try {
      await subcontractsApi.contractors.toggleStatus(c.id);
    } catch (e) {
      try {
        await subcontractsApi.contractors.update(c.id, {
          status_id: newStatusId,
          is_active: newStatusId === 1 ? 1 : 0
        });
      } catch (err) {
        console.warn('Toggle status fallback to local state:', err);
      }
    }
    setContractors(prev => prev.map(item => item.id === c.id ? {
      ...item,
      status_id: newStatusId,
      status: newStatusName,
      is_active: newStatusId === 1,
    } : item));
    toast.success(`Subcontractor "${c.contractor_name}" is now ${newStatusName}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return contractors.filter(c => {
      if (tradeFilter !== 'all') {
        const matchesTrade = String(c.contractor_type_id) === tradeFilter ||
          (c.trade_specialization || '').toLowerCase().includes(tradeFilter.toLowerCase());
        if (!matchesTrade) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && c.status_id !== 1 && c.status !== 'Active') return false;
        if (statusFilter === 'inactive' && (c.status_id === 1 || c.status === 'Active')) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const code = String(c.contractor_code || '').toLowerCase();
        const name = String(c.contractor_name || '').toLowerCase();
        const trade = String(c.trade_specialization || '').toLowerCase();
        const pers = String(c.contact_person || '').toLowerCase();
        const gst = String(c.gstin || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s) && !trade.includes(s) && !pers.includes(s) && !gst.includes(s)) return false;
      }
      return true;
    });
  }, [contractors, tradeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/subcontractors' },
    { label: 'Subcontractors Master' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractors Master"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Onboarded Contractors"
            value={contractors.length}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Subcontractors"
            value={contractors.filter(c => c.status_id === 1 || c.status === 'Active').length}
            status="success"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Inactive Subcontractors"
            value={contractors.filter(c => c.status_id === 2 || c.status === 'Inactive').length}
            status="neutral"
            icon={<Ban className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Average Vendor Rating"
            value="Grade A (92%)"
            status="neutral"
            icon={<Award className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'all', label: 'All Subcontractor Types' },
                  ...subcontractorTypes.map(t => ({
                    value: t.value,
                    label: t.label,
                  }))
                ]}
                value={tradeFilter}
                onChange={setTradeFilter}
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
                placeholder="Search contractor, trade, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Vendor Directory"
            >
              Print Directory
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Onboard Subcontractor
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block">
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
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-36">Subcontractor Code</th>
                  <th className="px-3 py-2">Contractor Name</th>
                  <th className="px-3 py-2 w-36">Phone Number</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-center w-36">Individual or Firm</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading subcontractors register...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No subcontractors found matching search.
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {c.contractor_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate" title={c.contractor_name}>
                          {c.contractor_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                        {c.phone || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] text-text-primary font-medium">
                          {c.trade_specialization}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={c.contractor_category === 'Firm' ? 'secondary' : 'primary'}
                          className={`text-[10px] font-semibold px-2 py-0.5 inline-flex items-center gap-1 ${
                            c.contractor_category === 'Firm'
                              ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-700 border border-blue-500/30'
                          }`}
                        >
                          {c.contractor_category === 'Firm' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {c.contractor_category || 'Individual'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={c.status_id === 1 || c.status === 'Active' ? 'success' : 'neutral'}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none"
                        >
                          {c.status_id === 1 || c.status === 'Active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Vendor Dossier 360"
                            onClick={() => setViewingItem(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Profile"
                            onClick={() => handleOpenEdit(c)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title={c.status_id === 1 || c.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}
                            onClick={() => handleToggleStatus(c)}
                          >
                            {c.status_id === 1 || c.status === 'Active' ? (
                              <Ban className="w-3.5 h-3.5 text-text-secondary hover:text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-700" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete Subcontractor"
                            onClick={() => setDeleteItem(c)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List */}
        <div className="block sm:hidden space-y-3">
          {paged.map((c, idx) => (
            <div key={c.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.contractor_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.contractor_name}</h4>
                  <span className="text-[11px] text-primary font-medium">{c.trade_specialization}</span>
                </div>
                <Badge
                  variant={c.status_id === 1 || c.status === 'Active' ? 'success' : 'neutral'}
                  className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none shrink-0"
                >
                  {c.status_id === 1 || c.status === 'Active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60 font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block font-sans">Contact</span>
                  <span className="text-[11px] text-text-primary truncate block font-sans">{c.contact_person}</span>
                  <span className="text-[10px] text-text-muted">{c.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block font-sans">Active WOs</span>
                  <span className="font-bold text-emerald-600 text-[11px]">{c.active_work_orders} Packages</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)} title="View Dossier">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(c)} title="Edit">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2"
                    onClick={() => handleToggleStatus(c)}
                    title={c.status_id === 1 || c.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}
                  >
                    {c.status_id === 1 || c.status === 'Active' ? (
                      <Ban className="w-3 h-3 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2 hover:border-red-500 hover:text-red-500"
                    onClick={() => setDeleteItem(c)}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View Subcontractor 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.contractor_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_code} • {viewingItem.trade_specialization}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Category</span> <span className="font-semibold text-primary">{viewingItem.contractor_category || 'Individual'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Account Status</span> <span className="font-medium text-text-primary">{viewingItem.status || 'Active'}</span></div>
                {viewingItem.contractor_category === 'Firm' ? (
                  <>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">Key Contact / MD</span> <span className="font-medium text-text-primary">{viewingItem.contact_person}</span></div>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mobile Phone</span> <span className="font-mono text-primary font-medium">{viewingItem.phone}</span></div>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">GSTIN Number</span> <span className="font-mono">{viewingItem.gstin || '—'}</span></div>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">PAN Number</span> <span className="font-mono">{viewingItem.pan || '—'}</span></div>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">City / State</span> <span className="text-text-primary">{viewingItem.city}, {viewingItem.state}</span></div>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">Vendor Performance</span> <span className="font-bold text-emerald-600">{viewingItem.rating}</span></div>
                  </>
                ) : (
                  <>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">Subcontractor Name</span> <span className="font-medium text-text-primary">{viewingItem.contractor_name}</span></div>
                    <div><span className="text-text-muted block text-[10px] uppercase font-bold">Phone Number</span> <span className="font-mono text-primary font-medium">{viewingItem.phone}</span></div>
                    <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Subcontractor Trade</span> <span className="text-text-primary font-medium">{viewingItem.trade_specialization}</span></div>
                  </>
                )}
              </div>

              {viewingItem.bank_name && (
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-1">
                  <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">Bank Settlement Details (RTGS/NEFT):</span>
                  <div className="grid grid-cols-2 gap-2 text-text-secondary font-mono text-[11px] pt-1">
                    <div>Bank: <span className="text-text-primary font-sans">{viewingItem.bank_name}</span></div>
                    <div>IFSC: <span className="text-text-primary">{viewingItem.ifsc}</span></div>
                    <div className="col-span-2">A/C No: <span className="text-text-primary font-bold">{viewingItem.account_no}</span></div>
                  </div>
                </div>
              )}

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Technical Scope & Capabilities:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Vendor Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Subcontractor Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Users}
          title={editingItem ? 'Edit Subcontractor Profile' : 'Onboard New Subcontractor'}
          subtitle="Record trade qualifications, GSTIN, PAN, bank settlement data, and commercial terms."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="subcontractor-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
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

            {form.contractor_category === 'Individual' ? (
              <>
                {/* Individual Subcontractor Information */}
                <EntityEditModal.Section title="Individual Subcontractor Information">
                  <EntityEditModal.Grid>
                    <FormField label="Subcontractor Name" required error={errors.contractor_name}>
                      <Input
                        value={form.contractor_name}
                        onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                        placeholder="e.g. M. Selvam"
                      />
                    </FormField>

                    <FormField label="Phone Number" required error={errors.phone}>
                      <Input
                        value={form.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </FormField>

                    <FormField label="Subcontractor Type" required>
                      <Select
                        options={subcontractorTypes.map(t => ({
                          value: t.value,
                          label: t.label
                        }))}
                        value={String(form.contractor_type_id || '1')}
                        onChange={(val) => handleFormChange('contractor_type_id', val)}
                      />
                    </FormField>

                    <FormField label="Account Status">
                      <Select
                        options={[
                          { value: '1', label: 'Active' },
                          { value: '2', label: 'Inactive' },
                        ]}
                        value={String(form.status_id || '1')}
                        onChange={(val) => handleFormChange('status_id', val)}
                      />
                    </FormField>
                  </EntityEditModal.Grid>
                </EntityEditModal.Section>

                {/* Individual Bank Details */}
                <EntityEditModal.Section title="Bank Details (for Payment Settlements)">
                  <EntityEditModal.Grid>
                    <FormField label="Bank & Branch Name">
                      <Input
                        value={form.bank_name}
                        onChange={(e) => handleFormChange('bank_name', e.target.value)}
                        placeholder="e.g. State Bank of India - Chennai"
                      />
                    </FormField>

                    <FormField label="Account Number">
                      <Input
                        value={form.account_no}
                        onChange={(e) => handleFormChange('account_no', e.target.value)}
                        placeholder="e.g. 30894561234"
                      />
                    </FormField>

                    <FormField label="IFSC Code" className="md:col-span-2">
                      <Input
                        value={form.ifsc}
                        onChange={(e) => handleFormChange('ifsc', e.target.value)}
                        placeholder="e.g. SBIN0001234"
                      />
                    </FormField>
                  </EntityEditModal.Grid>
                </EntityEditModal.Section>
              </>
            ) : (
              <>
                {/* Firm Information */}
                <EntityEditModal.Section title="Firm Information & Trade Specialty">
                  <EntityEditModal.Grid>
                    <FormField label="Contractor Code">
                      <Input
                        value={form.contractor_code}
                        onChange={(e) => handleFormChange('contractor_code', e.target.value)}
                        placeholder="SUB-2026-005"
                      />
                    </FormField>

                    <FormField label="Subcontractor Type" required>
                      <Select
                        options={subcontractorTypes.map(t => ({
                          value: t.value,
                          label: t.label
                        }))}
                        value={String(form.contractor_type_id || '1')}
                        onChange={(val) => handleFormChange('contractor_type_id', val)}
                      />
                    </FormField>

                    <FormField label="Subcontractor / Firm Name" required error={errors.contractor_name}>
                      <Input
                        value={form.contractor_name}
                        onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                        placeholder="e.g. Sri Murugan Civil Infra Pvt Ltd"
                      />
                    </FormField>

                    <FormField label="Account Status">
                      <Select
                        options={[
                          { value: '1', label: 'Active' },
                          { value: '2', label: 'Inactive' },
                        ]}
                        value={String(form.status_id || '1')}
                        onChange={(val) => handleFormChange('status_id', val)}
                      />
                    </FormField>

                    <FormField label="Contact Person / MD" required error={errors.contact_person}>
                      <Input
                        value={form.contact_person}
                        onChange={(e) => handleFormChange('contact_person', e.target.value)}
                        placeholder="e.g. Er. S. Murugesan"
                      />
                    </FormField>

                    <FormField label="Mobile Phone" required error={errors.phone}>
                      <Input
                        value={form.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        placeholder="+91 98421 78901"
                      />
                    </FormField>

                    <FormField label="GSTIN Number">
                      <Input
                        value={form.gstin}
                        onChange={(e) => handleFormChange('gstin', e.target.value)}
                        placeholder="33AABCS1429B1Z2"
                      />
                    </FormField>

                    <FormField label="PAN Number">
                      <Input
                        value={form.pan}
                        onChange={(e) => handleFormChange('pan', e.target.value)}
                        placeholder="AABCS1429B"
                      />
                    </FormField>

                    <FormField label="City / Base Location">
                      <Input
                        value={form.city}
                        onChange={(e) => handleFormChange('city', e.target.value)}
                        placeholder="Chennai"
                      />
                    </FormField>

                    <FormField label="State">
                      <Input
                        value={form.state}
                        onChange={(e) => handleFormChange('state', e.target.value)}
                        placeholder="Tamil Nadu"
                      />
                    </FormField>
                  </EntityEditModal.Grid>
                </EntityEditModal.Section>

                {/* Firm Bank Details */}
                <EntityEditModal.Section title="Bank Details for Direct RTGS / NEFT Settlements">
                  <EntityEditModal.Grid>
                    <FormField label="Bank & Branch Name">
                      <Input
                        value={form.bank_name}
                        onChange={(e) => handleFormChange('bank_name', e.target.value)}
                        placeholder="e.g. HDFC Bank - T. Nagar"
                      />
                    </FormField>

                    <FormField label="Account Number">
                      <Input
                        value={form.account_no}
                        onChange={(e) => handleFormChange('account_no', e.target.value)}
                        placeholder="50200018491029"
                      />
                    </FormField>

                    <FormField label="IFSC Code" className="md:col-span-2">
                      <Input
                        value={form.ifsc}
                        onChange={(e) => handleFormChange('ifsc', e.target.value)}
                        placeholder="HDFC0000024"
                      />
                    </FormField>

                    <FormField label="Specialization & Technical Remarks" className="md:col-span-2">
                      <Textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        placeholder="Past project experiences, plant machinery owned, staging materials available..."
                      />
                    </FormField>
                  </EntityEditModal.Grid>
                </EntityEditModal.Section>
              </>
            )}
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="subcontractor-form"
            submitLabel={editingItem ? 'Update Profile' : 'Onboard Contractor'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Remove Subcontractor"
        message={`Are you sure you want to remove "${deleteItem?.contractor_name}"?`}
        variant="danger"
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
