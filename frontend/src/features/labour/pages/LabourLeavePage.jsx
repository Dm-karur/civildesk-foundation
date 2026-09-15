import { useState, useEffect, useMemo } from 'react';
import {
  CalendarOff, CheckCircle2, XCircle, Clock, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, UserCheck, Calendar
} from 'lucide-react';
import { UnderConstructionPage } from '../../masters/pages/UnderConstructionPage';
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
import { projectsApi, request } from '../../../api/apiservice';

const LEAVE_TYPES = [
  { id: 'all', name: 'All Leave Types' },
  { id: 'native_visit', name: 'Native Village Visit / Festival' },
  { id: 'sick_leave', name: 'Sick / Medical Leave' },
  { id: 'casual_leave', name: 'Casual Personal Leave' },
  { id: 'emergency', name: 'Emergency Family Leave' },
];



const EMPTY_FORM = {
  project_id: '',
  leave_code: '',
  worker_code: '',
  worker_name: '',
  category_name: 'General Helper',
  contractor_name: '',
  leave_type: 'Native Village Visit / Festival',
  start_date: '',
  end_date: '',
  total_days: '1',
  replacement_worker: '',
  reason: '',
  status: 'Pending Review',
  approved_by: 'Site Incharge',
};

export function LabourLeavePage() {
  return (
    <UnderConstructionPage 
      title="Labour Leave Management" 
      moduleName="Labour" 
      description="The Leave Management module is currently under development. It will be wired up to the backend soon." 
    />
  );
}

// Preserved for future use once the backend endpoints are ready
export function LabourLeavePage_Future() {
  const [projects, setProjects] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      leave_code: `LV-2026-04${leaves.length + 1}`,
      start_date: today,
      end_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      leave_code: item.leave_code || '',
      worker_code: item.worker_code || '',
      worker_name: item.worker_name || '',
      category_name: item.category_name || '',
      contractor_name: item.contractor_name || '',
      leave_type: item.leave_type || 'Native Village Visit / Festival',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      total_days: String(item.total_days || '1'),
      replacement_worker: item.replacement_worker || '',
      reason: item.reason || '',
      status: item.status || 'Pending Review',
      approved_by: item.approved_by || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'start_date' || field === 'end_date') {
        const s = field === 'start_date' ? value : prev.start_date;
        const e = field === 'end_date' ? value : prev.end_date;
        if (s && e) {
          const d1 = new Date(s);
          const d2 = new Date(e);
          const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
          next.total_days = String(diffDays);
        }
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.worker_name.trim()) errs.worker_name = 'Worker name is required';
    if (!form.start_date || !form.end_date) errs.start_date = 'Start & End dates required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));

      const newLeave = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        leave_code: form.leave_code,
        worker_code: form.worker_code || 'LAB-000',
        worker_name: form.worker_name,
        category_name: form.category_name,
        contractor_name: form.contractor_name || 'Direct Roll',
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: Number(form.total_days || 1),
        replacement_worker: form.replacement_worker || '—',
        reason: form.reason,
        status: form.status,
        approved_by: form.approved_by,
      };

      if (editingItem?.id) {
        try { await request.patch(`/labour/leave/${editingItem.id}`, newLeave); } catch(e){}
        setLeaves(prev => prev.map(l => l.id === editingItem.id ? newLeave : l));
        toast.success('Leave application updated.');
      } else {
        try { await request.post('/labour/leave', newLeave); } catch(e){}
        setLeaves(prev => [newLeave, ...prev]);
        toast.success('Leave application submitted.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save leave application.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item) => {
    try { await request.patch(`/labour/leave/${item.id}`, { status: 'Approved' }); } catch(e){}
    setLeaves(prev => prev.map(l => l.id === item.id ? { ...l, status: 'Approved' } : l));
    toast.success(`Leave application approved for ${item.worker_name}.`);
  };

  const handleReject = async (item) => {
    try { await request.patch(`/labour/leave/${item.id}`, { status: 'Rejected' }); } catch(e){}
    setLeaves(prev => prev.map(l => l.id === item.id ? { ...l, status: 'Rejected' } : l));
    toast.success(`Leave application rejected for ${item.worker_name}.`);
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await request.delete(`/labour/leave/${deleteItem.id}`); } catch(e){}
      setLeaves(prev => prev.filter(l => l.id !== deleteItem.id));
      toast.success('Leave application record deleted.');
    } catch {
      toast.error('Failed to delete leave application.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return leaves.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (typeFilter !== 'all' && l.leave_type !== typeFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (l.leave_code || '').toLowerCase();
        const wCode = (l.worker_code || '').toLowerCase();
        const name = (l.worker_name || '').toLowerCase();
        const reas = (l.reason || '').toLowerCase();
        if (!code.includes(q) && !wCode.includes(q) && !name.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [leaves, selectedProjectId, typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => leaves.filter(l => l.status === 'Pending Review').length, [leaves]);
  const approvedCount = useMemo(() => leaves.filter(l => l.status === 'Approved').length, [leaves]);
  const totalLeaveDays = useMemo(() => leaves.reduce((acc, l) => acc + Number(l.total_days || 0), 0), [leaves]);

  const getStatusVariant = (status) => {
    if (status === 'Approved') return 'success';
    if (status === 'Pending Review') return 'warning';
    if (status === 'Rejected') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Leave Management' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Leave Management & Approvals"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Leave Applications"
            value={leaves.length}
            status="primary"
            icon={<CalendarOff className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved Leaves"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Review"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'neutral'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved Mandays Off"
            value={`${totalLeaveDays} days`}
            status="neutral"
            icon={<Users className="w-4 h-4 text-sky-500" />}
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
                options={LEAVE_TYPES.map(t => ({ value: t.id === 'all' ? 'all' : t.name, label: t.name }))}
                value={typeFilter}
                onChange={setTypeFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Pending Review', label: 'Pending Review' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search leave code, worker, reason..."
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
              Apply Leave
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
                  <th className="px-3 py-2 w-28">Leave Code</th>
                  <th className="px-3 py-2">Worker & Contractor</th>
                  <th className="px-3 py-2">Leave Category & Reason</th>
                  <th className="px-3 py-2 text-center w-36 hidden md:table-cell">Duration Period</th>
                  <th className="px-3 py-2 text-center w-24">Days Off</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading leave applications...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No leave applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-sky-600 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                          {l.leave_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.worker_name}>
                            {l.worker_name} ({l.worker_code})
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {l.category_name} • {l.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.leave_type}>
                            {l.leave_type}
                          </span>
                          <span className="text-[10px] text-text-muted truncate" title={l.reason}>
                            {l.reason}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                        <span className="text-text-secondary">{l.start_date} to {l.end_date}</span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-text-primary text-[11px]">
                        {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(l.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Leave Details"
                            onClick={() => setViewingItem(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {l.status === 'Pending Review' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve Leave"
                                onClick={() => handleApprove(l)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(l)}
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
                            onClick={() => handleOpenEdit(l)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((l, idx) => (
            <div key={l.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-sky-600 block">{l.leave_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{l.leave_type}</span>
                </div>
                <Badge
                  variant={getStatusVariant(l.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {l.status}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/30 rounded border border-border/50 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Period</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{l.start_date} to {l.end_date} ({l.total_days} days)</span>
                </div>
                <p className="text-text-secondary text-[10px] pt-1 border-t border-border/40">{l.reason}</p>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {l.status === 'Pending Review' && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(l)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
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

      {/* View Leave Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                  <CalendarOff className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.leave_code} • {viewingItem.leave_type}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Leave Duration</span> <span className="font-mono font-bold text-text-primary">{viewingItem.start_date} to {viewingItem.end_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Days Off</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.total_days} Days</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Replacement Worker</span> <span className="text-text-primary font-medium">{viewingItem.replacement_worker}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Approved By</span> <span className="font-medium text-text-primary">{viewingItem.approved_by}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Leave Reason & Details:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Leave Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={CalendarOff}
          title={editingItem ? 'Edit Leave Application' : 'Apply Labour Leave'}
          subtitle="Submit worker leave applications, festival offs, and relief worker designations."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="leave-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker & Project Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Leave Code" required>
                  <Input
                    value={form.leave_code}
                    onChange={(e) => handleFormChange('leave_code', e.target.value)}
                    placeholder="e.g. LV-2026-041"
                  />
                </FormField>

                <FormField label="Worker Name" required error={errors.worker_name}>
                  <Input
                    value={form.worker_name}
                    onChange={(e) => handleFormChange('worker_name', e.target.value)}
                    placeholder="e.g. K. Selvam"
                  />
                </FormField>

                <FormField label="Leave Category" required>
                  <Select
                    options={LEAVE_TYPES.filter(t => t.id !== 'all').map(t => ({ value: t.name, label: t.name }))}
                    value={form.leave_type}
                    onChange={(v) => handleFormChange('leave_type', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Leave Duration & Replacement">
              <EntityEditModal.Grid>
                <FormField label="Start Date" required error={errors.start_date}>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                  />
                </FormField>

                <FormField label="End Date" required>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => handleFormChange('end_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Days">
                  <Input
                    type="number"
                    value={form.total_days}
                    onChange={(e) => handleFormChange('total_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Relief / Replacement Worker">
                  <Input
                    value={form.replacement_worker}
                    onChange={(e) => handleFormChange('replacement_worker', e.target.value)}
                    placeholder="e.g. M. Durai (Mason)"
                  />
                </FormField>

                <FormField label="Leave Reason" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Reason for leave, festival visit, medical condition..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="leave-form"
            submitLabel={editingItem ? 'Update Leave' : 'Submit Leave'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Leave Application"
        message={`Are you sure you want to delete "${deleteItem?.leave_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
