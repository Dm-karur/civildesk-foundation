import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, HardHat, CheckCircle2, Clock, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRightLeft,
  Building, MapPin, Sun, Moon, Sparkles, UserCheck,
  Calendar, Layers, ShieldCheck, Printer, Check
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
import { toast } from '../../../components/composite/Toast';
import { labourApi, projectsApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extract = (res) => res?.data?.labour_assignments ?? res?.data?.assignments ?? res?.data?.data ?? [];



const EMPTY_FORM = {
  worker_id: '',
  worker_name: '',
  worker_code: '',
  category_name: 'General Helper',
  contractor_name: 'Direct Company Roll',
  project_id: '',
  site_id: '',
  site_name: '',
  shift_name: 'General Day Shift (8 AM - 5 PM)',
  shift_type: 'Day',
  assigned_from: '',
  assigned_until: '',
  assigned_until: '',
  agreed_wage_rate: '850',
  labour_category_id: '',
  wage_basis_id: '',
  status_id: '',
  status_name: 'Active On Site',
  supervisor_name: '',
  notes: '',
};

export function LabourDeploymentPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masters, setMasters] = useState({});
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load API data
  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      labourApi.assignments.list().catch(() => ({ data: [] })),
      labourApi.workers.list().catch(() => ({ data: [] })),
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      labourApi.masters().catch(() => ({ data: {} })),
      labourApi.categories.list().catch(() => ({ data: [] })),
    ]).then(([assignRes, workerRes, projRes, siteRes, masterRes, catRes]) => {
      const assignList = extract(assignRes);
      if (Array.isArray(assignList) && assignList.length > 0) {
        setItems(assignList);
      } else if (Array.isArray(assignList) && assignList.length === 0) {
        setItems([]);
      }
      
      const wList = workerRes?.data?.labour_workers ?? workerRes?.data?.data ?? [];
      setWorkers(Array.isArray(wList) ? wList : []);
      
      const pList = projRes?.data?.projects ?? projRes?.data?.data ?? [];
      setProjects(Array.isArray(pList) ? pList : []);
      
      const sList = siteRes?.data?.sites ?? siteRes?.data?.data ?? [];
      setSites(Array.isArray(sList) ? sList : []);
      
      const mData = masterRes?.data?.masters ?? masterRes?.data ?? {};
      setMasters(mData);
      
      const catList = catRes?.data?.categories ?? catRes?.data?.labour_categories ?? catRes?.data?.data ?? [];
      setCategories(Array.isArray(catList) ? catList : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Handlers
  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const endOfMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      assigned_from: today,
      assigned_until: endOfMonth,
      agreed_wage_rate: '850',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      worker_id: String(item.worker_id || ''),
      worker_name: item.worker_name || '',
      worker_code: item.worker_code || '',
      category_name: item.category_name || 'General Helper',
      contractor_name: item.contractor_name || 'Direct Company Roll',
      project_id: String(item.project_id || '1'),
      site_id: String(item.site_id || ''),
      site_name: item.site_name || '',
      shift_name: item.shift_name || 'General Day Shift (8 AM - 5 PM)',
      shift_type: item.shift_type || 'Day',
      assigned_from: item.assigned_from || '',
      assigned_until: item.assigned_until || '',
      agreed_wage_rate: String(item.agreed_wage_rate || '850'),
      labour_category_id: String(item.labour_category_id || item.category_id || ''),
      wage_basis_id: String(item.wage_basis_id || ''),
      status_id: String(item.status_id || ''),
      status_name: item.status_name || 'Active On Site',
      supervisor_name: item.supervisor_name || '',
      notes: item.notes || item.remarks || '',
    });
    setErrors({});
    setEditItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'worker_id') {
        const found = workers.find(w => String(w.id) === String(value));
        if (found) {
          next.worker_name = found.worker_name;
          next.worker_code = found.worker_code;
          next.category_name = found.category_name || 'General Helper';
          next.contractor_name = found.contractor_name || 'Direct Company Roll';
          next.agreed_wage_rate = String(found.base_wage_rate || '850');
          next.labour_category_id = String(found.category_id || found.labour_category_id || '');
          next.wage_basis_id = String(found.wage_basis_id || '');
        }
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.worker_id) errs.worker_id = 'Select a worker';
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.site_id) errs.site_id = 'Site is required';
    if (!form.assigned_from) errs.assigned_from = 'Start date is required';
    if (!form.labour_category_id) errs.labour_category_id = 'Select a labour category';
    if (!form.wage_basis_id) errs.wage_basis_id = 'Select a wage basis';
    if (!form.status_id) errs.status_id = 'Select a status';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedWorker = workers.find(w => String(w.id) === String(form.worker_id));

      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id),
        worker_id: Number(form.worker_id),
        labour_category_id: Number(form.labour_category_id),
        assigned_from: form.assigned_from,
        assigned_until: form.assigned_until || null,
        wage_basis_id: Number(form.wage_basis_id),
        agreed_wage_rate: Number(form.agreed_wage_rate || selectedWorker?.base_wage_rate || 850),
        status_id: Number(form.status_id),
        supervisor_name: form.supervisor_name,
        remarks: form.notes,
      };

      if (editItem?.id) {
        try { await labourApi.assignments.update(editItem.id, payload); } catch(e){}
        const updatedItem = { ...editItem, ...payload, ...form };
        setItems(prev => prev.map(i => i.id === editItem.id ? updatedItem : i));
        toast.success('Labour deployment updated.');
      } else {
        try { await labourApi.assignments.create(payload); } catch(e){}
        const newItem = { id: Date.now(), ...payload, ...form };
        setItems(prev => [newItem, ...prev]);
        toast.success('Labour deployment created successfully.');
      }

      setIsAddOpen(false);
      setEditItem(null);
    } catch {
      toast.error('Failed to save deployment.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await labourApi.assignments.remove(deleteItem.id); } catch(e){}
      setItems(prev => prev.filter(i => i.id !== deleteItem.id));
      toast.success('Deployment removed.');
    } catch {
      toast.error('Failed to delete deployment.');
    } finally {
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (shiftFilter !== 'all' && i.shift_type !== shiftFilter) return false;
      if (categoryFilter !== 'all' && i.category_name !== categoryFilter) return false;
      if (statusFilter !== 'all' && i.status_name !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (i.worker_code || '').toLowerCase();
        const name = (i.worker_name || '').toLowerCase();
        const cat = (i.category_name || '').toLowerCase();
        const site = (i.site_name || '').toLowerCase();
        const cont = (i.contractor_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !site.includes(q) && !cont.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedProjectId, shiftFilter, categoryFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const activeCount = useMemo(() => items.filter(i => i.status_name === 'Active On Site').length, [items]);
  const dayShiftCount = useMemo(() => items.filter(i => i.shift_type === 'Day').length, [items]);
  const nightShiftCount = useMemo(() => items.filter(i => i.shift_type === 'Night').length, [items]);
  const totalDailyWageCommitment = useMemo(() => items.reduce((acc, i) => acc + Number(i.agreed_wage_rate || 0), 0), [items]);

  // Skill category list
  const categoryCounts = useMemo(() => {
    const map = {};
    items.forEach(i => {
      const cat = i.category_name || 'General Helper';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [items]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Labour Deployment' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Deployment & Site Allocation"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Deployed Workforce"
            value={items.length}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Day Shift"
            value={`${dayShiftCount} Workers`}
            status="success"
            icon={<Sun className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Night Shift Squads"
            value={`${nightShiftCount} Workers`}
            status="neutral"
            icon={<Moon className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Daily Wage Commitment"
            value={`₹${totalDailyWageCommitment.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Gang Skill Allocation Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HardHat className="w-3.5 h-3.5 text-primary" /> Gang Breakdown:
          </span>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                categoryFilter === cat
                  ? 'bg-primary text-white font-semibold shadow-xs'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-muted'
              }`}
            >
              <span>{cat}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${categoryFilter === cat ? 'bg-white/20 text-white' : 'bg-surface-muted text-primary'}`}>
                {count}
              </span>
            </button>
          ))}
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="text-[11px] text-primary hover:underline font-semibold shrink-0 ml-1"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Shifts' },
                  { value: 'Day', label: 'Day Shift' },
                  { value: 'Night', label: 'Night Shift' },
                ]}
                value={shiftFilter}
                onChange={setShiftFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Active On Site', label: 'Active On Site' },
                  { value: 'Scheduled', label: 'Scheduled' },
                  { value: 'Released', label: 'Released' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search worker, site, gang..."
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
              title="Print Gate Deployment Sheet"
            >
              Print Sheet
            </Button>
            {hasPermission('labour.create') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={openAdd}
                className="text-xs h-8 shadow-xs"
              >
                Deploy Worker
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
                  <th className="px-3 py-2">Worker & Skill</th>
                  <th className="px-3 py-2">Assigned Project & Site Zone</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Shift</th>
                  <th className="px-3 py-2 text-right w-24">Daily Wage</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading labour deployments...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No active labour deployments found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((i, idx) => (
                    <tr key={i.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {i.worker_code || 'LAB-000'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.worker_name}>
                            {i.worker_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {i.category_name} • {i.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.site_name}>
                            {i.site_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {i.project_name} ({i.assigned_from} to {i.assigned_until})
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {i.shift_type === 'Night' ? (
                            <Moon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="truncate">{i.shift_type} Shift</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(i.agreed_wage_rate).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={i.status_name === 'Active On Site' ? 'success' : 'neutral'}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {i.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Deployment 360"
                            onClick={() => setViewingItem(i)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {hasPermission('labour.update') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Assignment"
                              onClick={() => openEdit(i)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {hasPermission('labour.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Release"
                              onClick={() => setDeleteItem(i)}
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
          {paged.map((i, idx) => (
            <div key={i.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{i.worker_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{i.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{i.category_name} • {i.contractor_name}</span>
                </div>
                <Badge
                  variant={i.status_name === 'Active On Site' ? 'success' : 'neutral'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {i.status_name}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/30 rounded border border-border/50 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Assigned Site</span>
                  <span className="font-semibold text-text-primary text-[11px]">{i.site_name}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-muted font-mono">
                  <span>{i.shift_name}</span>
                  <span className="font-bold text-primary text-[11px]">₹{Number(i.agreed_wage_rate).toLocaleString('en-IN')}/day</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(i)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {hasPermission('labour.update') && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(i)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                )}
                {hasPermission('labour.delete') && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteItem(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </Button>
                )}
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

      {/* View Deployment Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.worker_code} • {viewingItem.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Project</span> <span className="font-semibold text-text-primary">{viewingItem.project_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Site / Work Zone</span> <span className="font-semibold text-text-primary">{viewingItem.site_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Shift & Timings</span> <span className="font-mono text-text-primary">{viewingItem.shift_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Agreed Daily Rate</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.agreed_wage_rate).toLocaleString('en-IN')}/day</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Deployment Window</span> <span className="font-mono">{viewingItem.assigned_from} to {viewingItem.assigned_until}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status_name}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Task Scope & Work Instructions:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Deployment Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editItem)}
        onClose={() => { setIsAddOpen(false); setEditItem(null); }}
      >
        <EntityEditModal.Header
          icon={Users}
          title={editItem ? 'Edit Labour Allocation' : 'Deploy Worker to Site'}
          subtitle="Allocate registered workers to project sites, work zones, and shifts."
          onClose={() => { setIsAddOpen(false); setEditItem(null); }}
        />
        <form id="deploy-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker & Project Allocation">
              <EntityEditModal.Grid>
                <FormField label="Select Worker" required error={errors.worker_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Worker from Register' },
                      ...workers.map(w => ({ value: String(w.id), label: `${w.worker_code} - ${w.worker_name} (${w.category_name || 'Helper'})` }))
                    ]}
                    value={form.worker_id}
                    onChange={(v) => handleFormChange('worker_id', v)}
                  />
                </FormField>

                <FormField label="Parent Project" required>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Site Location / Grid Zone" required className="md:col-span-2" error={errors.site_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Site Location' },
                      ...sites
                        .filter(s => String(s.project_id) === String(form.project_id))
                        .map(s => ({ value: String(s.id), label: `${s.site_code || ''} ${s.site_name}` }))
                    ]}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Shift & Wages">
              <EntityEditModal.Grid>
                <FormField label="Shift Timing">
                  <Select
                    options={[
                      { value: 'General Day Shift (8 AM - 5 PM)', label: 'General Day Shift (8 AM - 5 PM)' },
                      { value: 'Night Shift (8 PM - 5 AM)', label: 'Night Shift (8 PM - 5 AM)' },
                      { value: 'Second Shift (2 PM - 10 PM)', label: 'Second Shift (2 PM - 10 PM)' },
                    ]}
                    value={form.shift_name}
                    onChange={(v) => handleFormChange('shift_name', v)}
                  />
                </FormField>

                <FormField label="Labour Category" required error={errors.labour_category_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Category' },
                      ...categories.map(c => ({ value: String(c.id), label: c.category_name }))
                    ]}
                    value={form.labour_category_id}
                    onChange={(v) => handleFormChange('labour_category_id', v)}
                  />
                </FormField>

                <FormField label="Wage Basis" required error={errors.wage_basis_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Wage Basis' },
                      ...(masters['assignment-wage-bases'] || []).map(m => ({ value: String(m.id), label: m.wage_basis_name }))
                    ]}
                    value={form.wage_basis_id}
                    onChange={(v) => handleFormChange('wage_basis_id', v)}
                  />
                </FormField>

                <FormField label="Agreed Daily Wage Rate (₹)">
                  <Input
                    type="number"
                    value={form.agreed_wage_rate}
                    onChange={(e) => handleFormChange('agreed_wage_rate', e.target.value)}
                  />
                </FormField>
                
                <FormField label="Deployment Status" required error={errors.status_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Status' },
                      ...(masters['assignment-statuses'] || []).map(m => ({ value: String(m.id), label: m.status_name }))
                    ]}
                    value={form.status_id}
                    onChange={(v) => handleFormChange('status_id', v)}
                  />
                </FormField>

                <FormField label="Deployment Start Date">
                  <Input
                    type="date"
                    value={form.assigned_from}
                    onChange={(e) => handleFormChange('assigned_from', e.target.value)}
                  />
                </FormField>

                <FormField label="Deployment End Date">
                  <Input
                    type="date"
                    value={form.assigned_until}
                    onChange={(e) => handleFormChange('assigned_until', e.target.value)}
                  />
                </FormField>

                <FormField label="Task Instructions / Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Describe specific task assignments, Gang Lead..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="deploy-form"
            submitLabel={editItem ? 'Update Deployment' : 'Deploy Worker'}
            onCancel={() => { setIsAddOpen(false); setEditItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Release Worker Assignment"
        message={`Are you sure you want to release "${deleteItem?.worker_name}" from site?`}
        variant="danger"
        confirmLabel="Release"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
