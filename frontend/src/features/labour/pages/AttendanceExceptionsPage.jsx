import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, FileText, UserCheck, ShieldAlert
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
import { projectsApi, request, labourApi } from '../../../api/apiservice';

const EXCEPTION_CATEGORIES = [
  { id: 'all', name: 'All Exception Types' },
  { id: 1, name: 'Missing Gate Punch-Out' },
  { id: 2, name: 'Late Arrival (> 30 mins)' },
  { id: 3, name: 'Early Site Departure' },
  { id: 4, name: 'Continuous Absence Streak' },
  { id: 5, name: 'Overtime Hours Discrepancy' },
];



const EMPTY_FORM = {
  project_id: '',
  worker_id: '',
  worker_code: '',
  worker_name: '',
  category_name: 'General Helper',
  contractor_name: '',
  incident_date: '',
  shift_name: 'General Day Shift',
  exception_category_id: 1,
  exception_type: 'Missing Gate Punch-Out',
  recorded_in: '08:00 AM',
  recorded_out: '—',
  adjusted_in: '08:00 AM',
  adjusted_out: '05:00 PM',
  hours_credited: '8.0',
  ot_credited: '0.0',
  status: 'Pending Approval',
  supervisor_name: 'Site Incharge',
  reason: '',
};

export function AttendanceExceptionsPage() {
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  // Load Projects and Exceptions
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));

    labourApi.workers.list().then(res => {
      const list = res?.data?.labour_workers ?? res?.data?.data ?? [];
      setWorkers(Array.isArray(list) ? list : []);
    }).catch(() => setWorkers([]));
  }, []);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await request.get('/labour-attendance/exceptions');
      // Similar to extractArray utility from earlier pages
      const data = res?.data?.exceptions ?? res?.exceptions ?? (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      setExceptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load exceptions:", error);
      toast.error("Could not load exceptions from server.");
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      incident_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      worker_id: String(item.worker_id || ''),
      worker_code: item.worker_code || '',
      worker_name: item.worker_name || '',
      category_name: item.category_name || '',
      contractor_name: item.contractor_name || '',
      incident_date: item.incident_date || '',
      shift_name: item.shift_name || 'General Day Shift',
      exception_category_id: item.exception_category_id || 1,
      exception_type: item.exception_type || 'Missing Gate Punch-Out',
      recorded_in: item.recorded_in || '',
      recorded_out: item.recorded_out || '',
      adjusted_in: item.adjusted_in || '',
      adjusted_out: item.adjusted_out || '',
      hours_credited: String(item.hours_credited || '8.0'),
      ot_credited: String(item.ot_credited || '0.0'),
      status: item.status || 'Pending Approval',
      supervisor_name: item.supervisor_name || '',
      reason: item.reason || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.worker_id) errs.worker_id = 'Worker is required';
    if (!form.exception_category_id) errs.exception_category_id = 'Exception category is required';
    if (!form.incident_date) errs.incident_date = 'Date is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedWorker = workers.find(w => String(w.id) === String(form.worker_id));
      const selectedCategory = EXCEPTION_CATEGORIES.find(c => String(c.id) === String(form.exception_category_id));

      const newException = {
        ...(editingItem?.id ? { id: editingItem.id } : {}),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        worker_id: Number(form.worker_id),
        worker_code: selectedWorker?.worker_code || form.worker_code || 'LAB-000',
        worker_name: selectedWorker?.worker_name || form.worker_name || 'Unknown',
        category_name: form.category_name,
        contractor_name: form.contractor_name || 'Direct Roll',
        incident_date: form.incident_date,
        shift_name: form.shift_name,
        exception_category_id: form.exception_category_id,
        exception_type: selectedCategory?.name || form.exception_type,
        recorded_in: form.recorded_in,
        recorded_out: form.recorded_out,
        adjusted_in: form.adjusted_in,
        adjusted_out: form.adjusted_out,
        hours_credited: Number(form.hours_credited || 8.0),
        ot_credited: Number(form.ot_credited || 0.0),
        status: form.status,
        supervisor_name: form.supervisor_name,
        reason: form.reason,
      };

      if (editingItem?.id) {
        await request.patch(`/labour-attendance/exceptions/${editingItem.id}`, newException);
        toast.success('Attendance exception updated.');
      } else {
        await request.post('/labour-attendance/exceptions', newException);
        toast.success('Attendance exception logged.');
      }
      
      // Refresh the list from the server to ensure DB consistency
      await fetchExceptions();

      setIsAddOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error(error);
      const errMsg = error?.message || 'Failed to save exception.';
      
      // Extract validation errors which might be nested differently depending on CI4 response
      const rawData = error?.response?.data || error?.original?.response?.data || {};
      const validationMsgs = rawData.messages || rawData.errors || error?.errors || {};
      const msgList = Object.values(validationMsgs).filter(Boolean);
      const errDetails = msgList.length > 0 ? ' - Missing: ' + msgList.join(', ') : '';
      
      toast.error(errMsg + errDetails);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item) => {
    try {
      await request.patch(`/labour-attendance/exceptions/${item.id}`, { status: 'Regularized' });
      await fetchExceptions();
      toast.success(`Attendance regularized for ${item.worker_name}. Wage credited.`);
    } catch (error) {
      toast.error('Failed to approve exception.');
    }
  };

  const handleReject = async (item) => {
    try {
      await request.patch(`/labour-attendance/exceptions/${item.id}`, { status: 'Rejected' });
      await fetchExceptions();
      toast.success(`Exception rejected for ${item.worker_name}. Deduction applied.`);
    } catch (error) {
      toast.error('Failed to reject exception.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      await request.delete(`/labour-attendance/exceptions/${deleteItem.id}`);
      await fetchExceptions();
      toast.success('Exception record deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete exception.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return exceptions.filter(e => {
      if (selectedProjectId !== 'all' && String(e.project_id) !== String(selectedProjectId)) return false;
      if (categoryFilter !== 'all' && String(e.exception_category_id) !== String(categoryFilter) && !(e.exception_type || '').toLowerCase().includes(String(categoryFilter).toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (e.worker_code || '').toLowerCase();
        const name = (e.worker_name || '').toLowerCase();
        const cat = (e.category_name || '').toLowerCase();
        const typ = (e.exception_type || '').toLowerCase();
        const reas = (e.reason || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !typ.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [exceptions, selectedProjectId, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => exceptions.filter(e => e.status === 'Pending Approval').length, [exceptions]);
  const missingPunchCount = useMemo(() => exceptions.filter(e => (e.exception_type || '').includes('Missing')).length, [exceptions]);
  const regularizedCount = useMemo(() => exceptions.filter(e => e.status === 'Regularized').length, [exceptions]);

  const getStatusVariant = (status) => {
    if (status === 'Regularized') return 'success';
    if (status === 'Pending Approval') return 'warning';
    if (status === 'Rejected') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Attendance Exceptions' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Attendance Exceptions & Regularization"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Pending Regularization"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Missing Gate Punches"
            value={missingPunchCount}
            status="neutral"
            icon={<Clock className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Regularized Approvals"
            value={regularizedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Exception Records"
            value={exceptions.length}
            status="primary"
            icon={<ShieldAlert className="w-4 h-4" />}
          />
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

            <div className="w-full sm:w-48">
              <Select
                options={EXCEPTION_CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search worker, code, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Log Exception
            </Button>
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
                  <th className="px-3 py-2">Worker & Incident Date</th>
                  <th className="px-3 py-2">Exception Flag & Reason</th>
                  <th className="px-3 py-2 text-center w-32 hidden md:table-cell">Recorded Punches</th>
                  <th className="px-3 py-2 text-right w-24">Credits (Reg/OT)</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading attendance exceptions...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No attendance exceptions found. All punch records verified.
                    </td>
                  </tr>
                ) : (
                  paged.map((e, idx) => {
                    const isPending = e.status === 'Pending Approval';

                    return (
                      <tr key={e.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {e.worker_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={e.worker_name}>
                              {e.worker_name}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              {e.incident_date} ({e.shift_name}) • {e.category_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-red-600 text-[11px] truncate">
                              {e.exception_type}
                            </span>
                            <span className="text-[10px] text-text-muted truncate" title={e.reason}>
                              {e.reason}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                          <span className="text-text-secondary">{e.recorded_in} ➔ {e.recorded_out}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px]">
                          <span className="font-bold text-primary">{e.hours_credited}h</span>
                          {e.ot_credited > 0 && <span className="text-emerald-600 font-semibold block text-[10px]">+{e.ot_credited}h OT</span>}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Details"
                              onClick={() => setViewingItem(e)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {isPending && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                  title="Approve & Regularize"
                                  onClick={() => handleApprove(e)}
                                >
                                  <Check className="w-3 h-3 mr-0.5" /> Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Reject"
                                  onClick={() => handleReject(e)}
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(e)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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
          {paged.map((e, idx) => (
            <div key={e.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{e.worker_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{e.worker_name}</h4>
                  <span className="text-[10px] font-mono text-text-muted">{e.incident_date}</span>
                </div>
              </div>

              <div className="p-2 bg-red-500/5 border border-red-500/20 rounded text-xs space-y-1">
                <span className="text-red-600 font-semibold block text-[11px]">{e.exception_type}</span>
                <p className="text-text-secondary text-[10px]">{e.reason}</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="font-mono text-[11px] font-bold text-primary">Credit: {e.hours_credited}h {e.ot_credited > 0 ? `(+${e.ot_credited}h OT)` : ''}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(e)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {e.status === 'Pending Approval' && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(e)}>
                      <Check className="w-3 h-3 mr-1" /> Regularize
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

      {/* View Exception Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.worker_code} • {viewingItem.incident_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Exception Type</span> <span className="font-semibold text-red-600">{viewingItem.exception_type}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recorded Gate Punches</span> <span className="font-mono">{viewingItem.recorded_in} to {viewingItem.recorded_out}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Adjusted Timings</span> <span className="font-mono font-bold text-primary">{viewingItem.adjusted_in} to {viewingItem.adjusted_out}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Regular Hours Credit</span> <span className="font-mono font-bold">{viewingItem.hours_credited} Hours</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved Overtime</span> <span className="font-mono text-emerald-600 font-bold">{viewingItem.ot_credited} OT Hours</span></div>
              </div>

              {viewingItem.reason && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Supervisor Justification:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Exception Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={AlertTriangle}
          title={editingItem ? 'Edit Attendance Exception' : 'Log Attendance Exception'}
          subtitle="Record and regularize gate punch misses, late arrivals, and OT disputes."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="exc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker & Incident Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Worker" required error={errors.worker_id}>
                  <Select
                    options={workers.map(w => ({ value: String(w.id), label: `${w.worker_code} - ${w.worker_name}` }))}
                    value={form.worker_id}
                    onChange={(v) => handleFormChange('worker_id', v)}
                  />
                </FormField>

                <FormField label="Incident Date" required error={errors.incident_date}>
                  <Input
                    type="date"
                    value={form.incident_date}
                    onChange={(e) => handleFormChange('incident_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Exception & Regularization Timings">
              <EntityEditModal.Grid>
                <FormField label="Exception Category" required error={errors.exception_category_id}>
                  <Select
                    options={EXCEPTION_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: String(c.id), label: c.name }))}
                    value={form.exception_category_id}
                    onChange={(v) => handleFormChange('exception_category_id', v)}
                  />
                </FormField>

                <FormField label="Regular Hours to Credit">
                  <Input
                    type="number"
                    step="0.5"
                    value={form.hours_credited}
                    onChange={(e) => handleFormChange('hours_credited', e.target.value)}
                  />
                </FormField>

                <FormField label="Adjusted Check-In">
                  <Input
                    value={form.adjusted_in}
                    onChange={(e) => handleFormChange('adjusted_in', e.target.value)}
                    placeholder="08:00 AM"
                  />
                </FormField>

                <FormField label="Adjusted Check-Out">
                  <Input
                    value={form.adjusted_out}
                    onChange={(e) => handleFormChange('adjusted_out', e.target.value)}
                    placeholder="05:00 PM"
                  />
                </FormField>

                <FormField label="Supervisor Justification Reason" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="State reason for missing punch, OT authorization..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="exc-form"
            submitLabel={editingItem ? 'Update Exception' : 'Save Exception'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Exception"
        message={`Are you sure you want to delete this exception?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
