import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Clock, CheckCircle, Plus, Edit, Trash2, Eye,
  IndianRupee, Filter, Search, UserCheck, HardHat, Phone,
  CreditCard, ShieldCheck, MapPin, Building
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { useNavigate } from 'react-router-dom';
import { labourApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extract = (res) => res?.data?.labour_workers ?? res?.data?.data ?? [];

const EMPTY_FORM = {
  labour_category_id: '', contractor_id: '', worker_code: '', worker_name: '',
  employment_source_id: '', gender_id: '', date_of_birth: '', phone: '',
  emergency_contact_name: '', emergency_contact_phone: '', blood_group: '',
  address: '', native_place: '', id_type_id: '', id_number_masked: '',
  date_joined: '', date_left: '', wage_basis_id: '', base_wage_rate: '',
  overtime_rate_per_hour: '', bank_name: '', bank_account_name: '',
  bank_account_no_masked: '', bank_ifsc: '', safety_induction_date: '',
  status_id: '', notes: '',
};

const statusVariant = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('active')) return 'success';
  if (v.includes('inactive') || v.includes('left')) return 'neutral';
  if (v.includes('terminated') || v.includes('blacklisted')) return 'error';
  return 'warning';
};

export function LabourRegisterPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [contractorFilter, setContractorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewingWorker, setViewingWorker] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [masters, setMasters] = useState({});

  const fetchItems = useCallback(() => {
    setLoading(true);
    labourApi.workers.list()
      .then((res) => setItems(extract(res)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    Promise.all([
      labourApi.masters().catch(() => ({})),
      labourApi.categories.list().catch(() => ({ data: [] })),
      labourApi.contractors.list().catch(() => ({ data: [] })),
    ]).then(([resMasters, resCategories, resContractors]) => {
      const d = resMasters?.data?.masters ?? resMasters?.data ?? resMasters ?? {};
      d.categories = resCategories?.data?.labour_categories ?? resCategories?.data ?? resCategories ?? [];
      d.contractors = resContractors?.data?.labour_contractors ?? resContractors?.data ?? resContractors ?? [];
      setMasters(d);
    });
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setIsAddOpen(true); };
  const openEdit = (item) => {
    const populated = { ...EMPTY_FORM };
    Object.keys(EMPTY_FORM).forEach((k) => { populated[k] = item[k] != null ? String(item[k]) : ''; });
    setForm(populated); setErrors({}); setEditItem(item);
  };
  const change = (n, v) => { setForm((c) => ({ ...c, [n]: v })); setErrors((c) => ({ ...c, [n]: null })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    ['worker_code', 'worker_name', 'labour_category_id', 'date_joined', 'status_id', 'employment_source_id', 'gender_id', 'id_type_id', 'wage_basis_id'].forEach(f => {
      if (!String(form[f] || '').trim()) errs[f] = 'Required';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      ['labour_category_id', 'contractor_id', 'employment_source_id', 'gender_id', 'id_type_id', 'wage_basis_id', 'status_id'].forEach((f) => {
        if (payload[f]) payload[f] = Number(payload[f]);
        else payload[f] = null;
      });
      ['base_wage_rate', 'overtime_rate_per_hour'].forEach((f) => {
        if (payload[f]) payload[f] = Number(payload[f]);
        else payload[f] = 0;
      });
      Object.keys(payload).forEach((k) => { 
        if (typeof payload[k] === 'string') payload[k] = payload[k].trim(); 
      });
      if (editItem?.id) {
        await labourApi.workers.update(editItem.id, payload);
      } else {
        await labourApi.workers.create(payload);
      }
      toast.success(`Worker ${editItem ? 'updated' : 'created'} successfully.`);
      setIsAddOpen(false); setEditItem(null);
      fetchItems();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Failed to save worker.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      await labourApi.workers.remove(deleteItem.id);
      toast.success('Worker deleted.'); 
      fetchItems();
    } catch (err) { toast.error(err?.message || 'Cannot delete worker.'); }
    finally { setDeleteItem(null); }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (categoryFilter !== 'all' && String(i.labour_category_id) !== String(categoryFilter) && i.category_name !== categoryFilter) return false;
      if (contractorFilter !== 'all' && String(i.contractor_id) !== String(contractorFilter) && i.contractor_name !== contractorFilter) return false;
      if (statusFilter !== 'all') {
        const isAct = String(i.status_name || '').toLowerCase().includes('active');
        if (statusFilter === 'Active' && !isAct) return false;
        if (statusFilter === 'Inactive' && isAct) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return [i.worker_code, i.worker_name, i.category_name, i.contractor_name, i.phone].some((v) => String(v || '').toLowerCase().includes(q));
      }
      return true;
    });
  }, [items, categoryFilter, contractorFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const isModalOpen = isAddOpen || Boolean(editItem);

  const masterOpts = (key) => {
    const apiKeys = {
      'employment_sources': 'employment-sources',
      'id_types': 'worker-id-types',
      'wage_bases': 'worker-wage-bases',
      'statuses': 'worker-statuses',
    };
    const targetKey = apiKeys[key] || key;
    return (Array.isArray(masters[targetKey]) ? masters[targetKey] : []).map((m) => ({ value: String(m.id), label: m.wage_basis_name || m.wage_basis || m.employment_source_name || m.category_name || m.contractor_name || m.id_type_name || m.status_name || m.source_name || m.gender_name || m.type_name || m.basis_name || m.name || m.id }));
  };

  // Metrics
  const activeCount = useMemo(() => items.filter((i) => String(i.status_name || '').toLowerCase().includes('active')).length, [items]);
  const avgWage = useMemo(() => {
    const valid = items.filter(i => Number(i.base_wage_rate) > 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((acc, i) => acc + Number(i.base_wage_rate), 0) / valid.length);
  }, [items]);

  // Unique categories and contractors for dropdowns
  const categoriesList = useMemo(() => {
    const set = new Set();
    items.forEach(i => { if (i.category_name) set.add(i.category_name); });
    return Array.from(set);
  }, [items]);

  const contractorsList = useMemo(() => {
    const set = new Set();
    items.forEach(i => { if (i.contractor_name) set.add(i.contractor_name); });
    return Array.from(set);
  }, [items]);

  return (
    <PageContainer>
      <PageHeader
        title="Labour Register"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Labour & Attendance' },
          { label: 'Labour Register' }
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            New Employee
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">

        {/* KPIs Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Registered"
            value={items.length}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Workforce"
            value={activeCount}
            status="success"
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Inactive / Left"
            value={items.length - activeCount}
            status="neutral"
            icon={<Clock className="w-4 h-4 text-text-muted" />}
          />
          <KpiCard
            label="Average Base Wage"
            value={`₹${avgWage}/day`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {categoriesList.length > 0 && (
              <div className="w-full sm:w-44">
                <Select
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categoriesList.map(c => ({ value: c, label: c }))
                  ]}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  className="text-xs h-8"
                />
              </div>
            )}

            {contractorsList.length > 0 && (
              <div className="w-full sm:w-48">
                <Select
                  options={[
                    { value: 'all', label: 'All Contractors' },
                    ...contractorsList.map(c => ({ value: c, label: c }))
                  ]}
                  value={contractorFilter}
                  onChange={setContractorFilter}
                  className="text-xs h-8"
                />
              </div>
            )}

            <div className="w-full sm:w-32">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search code, name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {hasPermission('labour.create') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={openAdd}
                className="text-xs h-8 shadow-xs"
              >
                Add Worker
              </Button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
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
                  <th className="px-3 py-2 w-28">Worker Code</th>
                  <th className="px-3 py-2">Worker Name & Phone</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Skill Category</th>
                  <th className="px-3 py-2 w-36 hidden lg:table-cell">Labour Contractor</th>
                  <th className="px-3 py-2 w-24 hidden md:table-cell">Joined</th>
                  <th className="px-3 py-2 text-right w-24">Wage Rate</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading labour workforce...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No workers found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {item.worker_code || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={item.worker_name}>
                            {item.worker_name || '—'}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {item.phone || 'No phone'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-[11px] text-text-secondary truncate block" title={item.category_name}>
                          {item.category_name || 'General'}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="text-[11px] text-text-muted truncate block" title={item.contractor_name}>
                          {item.contractor_name || 'Direct Roll'}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {item.date_joined ? item.date_joined.split(' ')[0] : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        {item.base_wage_rate ? `₹${Number(item.base_wage_rate).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={statusVariant(item.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {item.status_name || 'Active'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Worker 360"
                            onClick={() => setViewingWorker(item)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {hasPermission('labour.update') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => openEdit(item)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {hasPermission('labour.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteItem(item)}
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((item, idx) => (
            <div key={item.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{item.worker_code || 'W-000'}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{item.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{item.category_name || 'General Helper'}</span>
                </div>
                <Badge
                  variant={statusVariant(item.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {item.status_name || 'Active'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Contractor</span>
                  <span className="text-text-primary text-[11px] truncate block">{item.contractor_name || 'Direct Roll'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Daily Wage</span>
                  <span className="font-mono font-bold text-primary text-[11px]">
                    {item.base_wage_rate ? `₹${Number(item.base_wage_rate).toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="font-mono text-[10px] text-text-muted">{item.phone || 'No phone'}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingWorker(item)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {hasPermission('labour.update') && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                      <Edit className="w-3.5 h-3.5 text-text-secondary" />
                    </Button>
                  )}
                  {hasPermission('labour.delete') && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteItem(item)}>
                      <Trash2 className="w-3.5 h-3.5 text-error" />
                    </Button>
                  )}
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

      {/* View Worker 360 Modal */}
      {viewingWorker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingWorker.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingWorker.worker_code} • {viewingWorker.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingWorker(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Labour Contractor</span> <span className="font-semibold text-text-primary">{viewingWorker.contractor_name || 'Direct Roll'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Base Wage Rate</span> <span className="font-bold text-primary font-mono text-sm">{viewingWorker.base_wage_rate ? `₹${Number(viewingWorker.base_wage_rate).toLocaleString('en-IN')}` : '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contact Phone</span> <span className="font-mono text-text-primary">{viewingWorker.phone || '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Date Joined</span> <span className="font-mono">{viewingWorker.date_joined ? viewingWorker.date_joined.split(' ')[0] : '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Overtime Rate</span> <span className="font-mono">{viewingWorker.overtime_rate_per_hour ? `₹${viewingWorker.overtime_rate_per_hour}/hr` : '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingWorker.status_name || 'Active'}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <span className="font-bold text-text-primary block text-[11px]">Identity & Emergency Details:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-text-muted block text-[10px]">ID Proof:</span> {viewingWorker.id_number_masked || 'Not Submitted'}</div>
                  <div><span className="text-text-muted block text-[10px]">Blood Group:</span> {viewingWorker.blood_group || '—'}</div>
                  <div><span className="text-text-muted block text-[10px]">Emergency Contact:</span> {viewingWorker.emergency_contact_name || '—'}</div>
                  <div><span className="text-text-muted block text-[10px]">Emergency Phone:</span> {viewingWorker.emergency_contact_phone || '—'}</div>
                  <div className="col-span-2"><span className="text-text-muted block text-[10px]">Native Place:</span> {viewingWorker.native_place || '—'}</div>
                </div>
              </div>

              {viewingWorker.bank_name && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Bank Account Details:</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                    <div>Bank: {viewingWorker.bank_name}</div>
                    <div>IFSC: {viewingWorker.bank_ifsc || '—'}</div>
                    <div className="col-span-2">A/C: {viewingWorker.bank_account_no_masked || '—'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingWorker(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <EntityEditModal isOpen={isModalOpen} onClose={() => { setIsAddOpen(false); setEditItem(null); }}>
        <EntityEditModal.Header icon={Users} title={editItem ? 'Edit Worker' : 'Add Worker'} subtitle="Manage labour worker details." onClose={() => { setIsAddOpen(false); setEditItem(null); }} />
        <form id="worker-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Basic Information">
              <EntityEditModal.Grid>
                <FormField label="Worker Code" required error={errors.worker_code}>
                  <Input value={form.worker_code} onChange={(e) => change('worker_code', e.target.value)} placeholder="W-001" />
                </FormField>
                <FormField label="Worker Name" required error={errors.worker_name}>
                  <Input value={form.worker_name} onChange={(e) => change('worker_name', e.target.value)} />
                </FormField>
                <FormField label="Labour Category" required error={errors.labour_category_id}>
                  <Select options={[{ value: '', label: 'Select Category' }, ...masterOpts('categories')]} value={form.labour_category_id} onChange={(v) => change('labour_category_id', v)} />
                </FormField>
                <FormField label="Contractor" error={errors.contractor_id}>
                  <Select options={[{ value: '', label: 'None' }, ...masterOpts('contractors')]} value={form.contractor_id} onChange={(v) => change('contractor_id', v)} />
                </FormField>
                <FormField label="Gender" required error={errors.gender_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('genders')]} value={form.gender_id} onChange={(v) => change('gender_id', v)} />
                </FormField>
                <FormField label="Date of Birth" error={errors.date_of_birth}>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => change('date_of_birth', e.target.value)} />
                </FormField>
                <FormField label="Phone" error={errors.phone}>
                  <Input value={form.phone} onChange={(e) => change('phone', e.target.value)} placeholder="9876543210" />
                </FormField>
                <FormField label="Employment Source" required error={errors.employment_source_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('employment_sources')]} value={form.employment_source_id} onChange={(v) => change('employment_source_id', v)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Identity & Address">
              <EntityEditModal.Grid>
                <FormField label="ID Type" required error={errors.id_type_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('id_types')]} value={form.id_type_id} onChange={(v) => change('id_type_id', v)} />
                </FormField>
                <FormField label="ID Number" error={errors.id_number_masked}>
                  <Input value={form.id_number_masked} onChange={(e) => change('id_number_masked', e.target.value)} />
                </FormField>
                <FormField label="Blood Group" error={errors.blood_group}>
                  <Input value={form.blood_group} onChange={(e) => change('blood_group', e.target.value)} />
                </FormField>
                <FormField label="Native Place" error={errors.native_place}>
                  <Input value={form.native_place} onChange={(e) => change('native_place', e.target.value)} />
                </FormField>
                <FormField label="Address" className="md:col-span-2" error={errors.address}>
                  <Textarea value={form.address} onChange={(e) => change('address', e.target.value)} rows={2} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Emergency Contact">
              <EntityEditModal.Grid>
                <FormField label="Emergency Contact Name">
                  <Input value={form.emergency_contact_name} onChange={(e) => change('emergency_contact_name', e.target.value)} />
                </FormField>
                <FormField label="Emergency Contact Phone">
                  <Input value={form.emergency_contact_phone} onChange={(e) => change('emergency_contact_phone', e.target.value)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Employment & Wages">
              <EntityEditModal.Grid>
                <FormField label="Date Joined" required error={errors.date_joined}>
                  <Input type="date" value={form.date_joined} onChange={(e) => change('date_joined', e.target.value)} />
                </FormField>
                <FormField label="Date Left" error={errors.date_left}>
                  <Input type="date" value={form.date_left} onChange={(e) => change('date_left', e.target.value)} />
                </FormField>
                <FormField label="Wage Basis" required error={errors.wage_basis_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('wage_bases')]} value={form.wage_basis_id} onChange={(v) => change('wage_basis_id', v)} />
                </FormField>
                <FormField label="Base Wage Rate (₹)" error={errors.base_wage_rate}>
                  <Input type="number" step="0.01" value={form.base_wage_rate} onChange={(e) => change('base_wage_rate', e.target.value)} />
                </FormField>
                <FormField label="OT Rate/Hour (₹)" error={errors.overtime_rate_per_hour}>
                  <Input type="number" step="0.01" value={form.overtime_rate_per_hour} onChange={(e) => change('overtime_rate_per_hour', e.target.value)} />
                </FormField>
                <FormField label="Safety Induction Date">
                  <Input type="date" value={form.safety_induction_date} onChange={(e) => change('safety_induction_date', e.target.value)} />
                </FormField>
                <FormField label="Status" required error={errors.status_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('statuses')]} value={form.status_id} onChange={(v) => change('status_id', v)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Bank Details">
              <EntityEditModal.Grid>
                <FormField label="Bank Name"><Input value={form.bank_name} onChange={(e) => change('bank_name', e.target.value)} /></FormField>
                <FormField label="Account Holder"><Input value={form.bank_account_name} onChange={(e) => change('bank_account_name', e.target.value)} /></FormField>
                <FormField label="Account No."><Input value={form.bank_account_no_masked} onChange={(e) => change('bank_account_no_masked', e.target.value)} /></FormField>
                <FormField label="IFSC Code"><Input value={form.bank_ifsc} onChange={(e) => change('bank_ifsc', e.target.value)} /></FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Notes">
              <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => change('notes', e.target.value)} rows={2} /></FormField>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer formId="worker-form" submitLabel={editItem ? 'Update Worker' : 'Create Worker'} onCancel={() => { setIsAddOpen(false); setEditItem(null); }} isSubmitting={saving} />
        </form>
      </EntityEditModal>

      <ConfirmDialog isOpen={Boolean(deleteItem)} title="Delete Worker" message="Are you sure? This action cannot be undone." variant="danger" confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setDeleteItem(null)} />
    </PageContainer>
  );
}
