import { useState, useEffect, useMemo } from 'react';
import {
  Clock, CheckCircle2, XCircle, IndianRupee, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Moon, Sun, AlertTriangle
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
import { projectsApi, labourApi, request } from '../../../api/apiservice';

const OT_REASONS = [
  { id: 'all', name: 'All Overtime Reasons' },
  { id: 'concrete_pour', name: 'Continuous Concrete Pouring Overflow' },
  { id: 'critical_path', name: 'Critical Path Schedule Acceleration' },
  { id: 'curing_watch', name: 'Concrete Curing & Pump Watch' },
  { id: 'traffic_shift', name: 'Traffic Diversion & Night Paving' },
  { id: 'weather_recovery', name: 'Rain Delay Schedule Recovery' },
];



const EMPTY_FORM = {
  project_id: '',
  slip_code: '',
  worker_id: '',
  worker_code: '',
  worker_name: '',
  category_name: 'General Helper',
  contractor_name: '',
  ot_date: '',
  activity_name: '',
  zone_name: '',
  start_time: '05:00 PM',
  end_time: '08:00 PM',
  ot_hours: '3.0',
  hourly_rate: '150',
  multiplier: '1.5x',
  ot_amount: '450',
  reason: '',
  status: 'Pending Pre-Auth',
  approved_by: 'Site Incharge',
};

export function LabourOvertimePage() {
  return (
    <UnderConstructionPage 
      title="Labour Overtime" 
      moduleName="Labour" 
      description="The Overtime module is currently under development. It will be wired up to the backend soon." 
    />
  );
}

// Preserved for future use once the backend endpoints are ready
export function LabourOvertimePage_Future() {
  const [projects, setProjects] = useState([]);
  const [slips, setSlips] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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

    labourApi.workers.list().then(res => {
      const list = res?.data?.labour_workers ?? res?.data?.data ?? [];
      setWorkers(Array.isArray(list) ? list : []);
    }).catch(() => setWorkers([]));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      slip_code: `OT-2026-08${slips.length + 1}`,
      ot_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      slip_code: item.slip_code || '',
      worker_code: item.worker_code || '',
      worker_name: item.worker_name || '',
      category_name: item.category_name || '',
      contractor_name: item.contractor_name || '',
      ot_date: item.ot_date || '',
      activity_name: item.activity_name || '',
      zone_name: item.zone_name || '',
      start_time: item.start_time || '05:00 PM',
      end_time: item.end_time || '08:00 PM',
      ot_hours: String(item.ot_hours || '3.0'),
      hourly_rate: String(item.hourly_rate || '150'),
      multiplier: item.multiplier || '1.5x',
      ot_amount: String(item.ot_amount || '450'),
      reason: item.reason || '',
      status: item.status || 'Pending Pre-Auth',
      approved_by: item.approved_by || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'ot_hours' || field === 'hourly_rate') {
        const hrs = Number(field === 'ot_hours' ? value : prev.ot_hours) || 0;
        const rate = Number(field === 'hourly_rate' ? value : prev.hourly_rate) || 0;
        next.ot_amount = String(Math.round(hrs * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.worker_name.trim()) errs.worker_name = 'Worker name is required';
    if (!form.ot_date) errs.ot_date = 'Date is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const hrs = Number(form.ot_hours || 0);
      const rate = Number(form.hourly_rate || 150);

      const selectedWorker = workers.find(w => String(w.id) === String(form.worker_id));
      
      const newSlip = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        slip_code: form.slip_code,
        worker_id: form.worker_id,
        worker_code: selectedWorker?.worker_code || form.worker_code || 'LAB-000',
        worker_name: selectedWorker?.worker_name || form.worker_name,
        category_name: form.category_name,
        contractor_name: form.contractor_name || 'Direct Roll',
        ot_date: form.ot_date,
        activity_name: form.activity_name,
        zone_name: form.zone_name,
        start_time: form.start_time,
        end_time: form.end_time,
        ot_hours: hrs,
        hourly_rate: rate,
        multiplier: form.multiplier,
        ot_amount: Number(form.ot_amount || hrs * rate),
        reason: form.reason,
        status: form.status,
        approved_by: form.approved_by,
      };

      if (editingItem?.id) {
        try { await request.patch(`/labour-attendance/overtime/${editingItem.id}`, newSlip); } catch(e){}
        setSlips(prev => prev.map(s => s.id === editingItem.id ? newSlip : s));
        toast.success('Overtime slip updated.');
      } else {
        try { await request.post('/labour-attendance/overtime', newSlip); } catch(e){}
        setSlips(prev => [newSlip, ...prev]);
        toast.success('Overtime slip authorized.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save Overtime slip.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item) => {
    try { await request.patch(`/labour-attendance/overtime/${item.id}`, { status: 'Approved' }); } catch(e){}
    setSlips(prev => prev.map(s => s.id === item.id ? { ...s, status: 'Approved' } : s));
    toast.success(`Overtime slip ${item.slip_code} approved.`);
  };

  const handleReject = async (item) => {
    try { await request.patch(`/labour-attendance/overtime/${item.id}`, { status: 'Rejected' }); } catch(e){}
    setSlips(prev => prev.map(s => s.id === item.id ? { ...s, status: 'Rejected' } : s));
    toast.success(`Overtime slip ${item.slip_code} rejected.`);
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await request.delete(`/labour-attendance/overtime/${deleteItem.id}`); } catch(e){}
      setSlips(prev => prev.filter(s => s.id !== deleteItem.id));
      toast.success('Overtime record deleted.');
    } catch {
      toast.error('Failed to delete overtime record.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return slips.filter(s => {
      if (selectedProjectId !== 'all' && String(s.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (s.slip_code || '').toLowerCase();
        const wCode = (s.worker_code || '').toLowerCase();
        const name = (s.worker_name || '').toLowerCase();
        const act = (s.activity_name || '').toLowerCase();
        const reas = (s.reason || '').toLowerCase();
        if (!code.includes(q) && !wCode.includes(q) && !name.includes(q) && !act.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [slips, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalOtHours = useMemo(() => slips.reduce((acc, s) => acc + Number(s.ot_hours || 0), 0), [slips]);
  const totalOtCost = useMemo(() => slips.reduce((acc, s) => acc + Number(s.ot_amount || 0), 0), [slips]);
  const pendingCount = useMemo(() => slips.filter(s => s.status === 'Pending Pre-Auth').length, [slips]);
  const approvedCount = useMemo(() => slips.filter(s => s.status === 'Approved').length, [slips]);

  const getStatusVariant = (status) => {
    if (status === 'Approved') return 'success';
    if (status === 'Pending Pre-Auth') return 'warning';
    if (status === 'Rejected') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Overtime' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Overtime (OT) Pre-Authorization & Tracking"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total OT Slips"
            value={slips.length}
            status="primary"
            icon={<Clock className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved OT Hours"
            value={`${totalOtHours} hrs`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Pre-Auth"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Overtime Cost Commitment"
            value={`₹${totalOtCost.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved & Credited' },
                  { value: 'Pending Pre-Auth', label: 'Pending Pre-Auth' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search slip code, worker, activity..."
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
              Pre-Authorize OT
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
                  <th className="px-3 py-2 w-28">Slip Code</th>
                  <th className="px-3 py-2">Worker & Date</th>
                  <th className="px-3 py-2">Work Activity & Location</th>
                  <th className="px-3 py-2 text-center w-36 hidden md:table-cell">OT Timings</th>
                  <th className="px-3 py-2 text-right w-24">OT Hours</th>
                  <th className="px-3 py-2 text-right w-24">Amount (₹)</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading overtime slips...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No overtime records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {s.slip_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={s.worker_name}>
                            {s.worker_name} ({s.worker_code})
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {s.ot_date} • {s.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={s.activity_name}>
                            {s.activity_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {s.zone_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                        <span className="text-text-secondary">{s.start_time} to {s.end_time}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {s.ot_hours} hrs
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(s.ot_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(s.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View OT Slip 360"
                            onClick={() => setViewingItem(s)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {s.status === 'Pending Pre-Auth' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve OT"
                                onClick={() => handleApprove(s)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(s)}
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
                            onClick={() => handleOpenEdit(s)}
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
          {paged.map((s, idx) => (
            <div key={s.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-600 block">{s.slip_code} • {s.ot_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{s.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{s.activity_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(s.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {s.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Duration</span>
                  <span className="font-mono text-text-primary text-[11px]">{s.ot_hours} hrs ({s.start_time}-{s.end_time})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">OT Wage</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(s.ot_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{s.zone_name}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(s)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {s.status === 'Pending Pre-Auth' && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(s)}>
                      <Check className="w-3 h-3 mr-1" /> Approve
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

      {/* View OT Slip Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.slip_code} • {viewingItem.ot_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Overtime Duration</span> <span className="font-mono font-bold text-text-primary">{viewingItem.ot_hours} Hours ({viewingItem.start_time} - {viewingItem.end_time})</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total OT Amount</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.ot_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Hourly Rate</span> <span className="font-mono">₹{viewingItem.hourly_rate}/hr ({viewingItem.multiplier})</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Approved By</span> <span className="font-medium text-text-primary">{viewingItem.approved_by}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Work Scope & Justification:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit OT Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Clock}
          title={editingItem ? 'Edit Overtime Slip' : 'Pre-Authorize Overtime (OT Slip)'}
          subtitle="Pre-authorize overtime work hours, activity scope, and wage multiplier rates."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="ot-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker & Activity Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="OT Slip Reference" required>
                  <Input
                    value={form.slip_code}
                    onChange={(e) => handleFormChange('slip_code', e.target.value)}
                    placeholder="e.g. OT-2026-081"
                  />
                </FormField>

                <FormField label="Worker" required error={errors.worker_id}>
                  <Select
                    options={workers.map(w => ({ value: String(w.id), label: `${w.worker_code} - ${w.worker_name}` }))}
                    value={form.worker_id}
                    onChange={(v) => handleFormChange('worker_id', v)}
                  />
                </FormField>

                <FormField label="Overtime Date" required error={errors.ot_date}>
                  <Input
                    type="date"
                    value={form.ot_date}
                    onChange={(e) => handleFormChange('ot_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Work Activity / Task" className="md:col-span-2">
                  <Input
                    value={form.activity_name}
                    onChange={(e) => handleFormChange('activity_name', e.target.value)}
                    placeholder="e.g. Level 2 Column Concrete Pour Finishing"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Overtime Timings & Wage Rates">
              <EntityEditModal.Grid>
                <FormField label="Start Time">
                  <Input
                    value={form.start_time}
                    onChange={(e) => handleFormChange('start_time', e.target.value)}
                    placeholder="05:00 PM"
                  />
                </FormField>

                <FormField label="End Time">
                  <Input
                    value={form.end_time}
                    onChange={(e) => handleFormChange('end_time', e.target.value)}
                    placeholder="08:00 PM"
                  />
                </FormField>

                <FormField label="Overtime Hours">
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ot_hours}
                    onChange={(e) => handleFormChange('ot_hours', e.target.value)}
                  />
                </FormField>

                <FormField label="Hourly OT Rate (₹)">
                  <Input
                    type="number"
                    value={form.hourly_rate}
                    onChange={(e) => handleFormChange('hourly_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Work Justification & Rationale" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Describe critical pour, crane slot, pump cleaning..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="ot-form"
            submitLabel={editingItem ? 'Update OT Slip' : 'Pre-Authorize OT'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Overtime Record"
        message={`Are you sure you want to delete "${deleteItem?.slip_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
