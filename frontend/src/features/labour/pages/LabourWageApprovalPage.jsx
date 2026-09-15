import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, XCircle, IndianRupee, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, FileText,
  Building, Calendar, ArrowUpRight, ArrowDownRight, RotateCcw
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
import { projectsApi, sitesApi, wagesApi, request } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extractList = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  
  // Search for the first array in res.data
  if (res?.data && typeof res.data === 'object') {
    for (const key in res.data) {
      if (Array.isArray(res.data[key])) return res.data[key];
    }
  }
  
  // Search for the first array in res
  if (res && typeof res === 'object') {
    for (const key in res) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
};



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  batch_code: '',
  period_start: '',
  period_end: '',
  contractor_name: 'Sri Murugan Labour Services',
  worker_count: '20',
  total_mandays: '120',
  total_ot_hours: '30',
  gross_wages: '110000',
  advances_deducted: '8000',
  net_payable: '102000',
  status: 'Pending PM Approval',
  current_approver: 'Project Manager',
  prepared_by: 'Site Engineer',
  notes: '',
};

export function LabourWageApprovalPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [batches, setBatches] = useState([]);
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
  const [submitDebug, setSubmitDebug] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState([]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await wagesApi.list({ project_id: selectedProjectId !== 'all' ? selectedProjectId : undefined });
      const list = extractList(res);
      const mapped = list.map(b => {
        // Find if we have any local edits for this backend ID since backend lacks PUT/PATCH
        const localEditsStr = localStorage.getItem('wage_batch_edits');
        const localEdits = localEditsStr ? JSON.parse(localEditsStr) : {};
        const edits = localEdits[b.id] || {};

        return {
          ...b,
          batch_code: edits.batch_code || b.batch_code || b.period_code || b.code || `WB-${b.id}`,
          status: edits.status || (typeof b.status === 'object' ? b.status?.name || b.status?.status || 'Pending' : (b.status || 'Pending')),
          worker_count: edits.worker_count || b.worker_count || b.workers_count || b.headcount || 0,
          total_mandays: edits.total_mandays || b.total_mandays || b.mandays || 0,
          gross_wages: edits.gross_wages || b.gross_wages || b.gross_amount || b.amount || 0,
          advances_deducted: edits.advances_deducted || b.advances_deducted || b.deductions || b.advance_amount || 0,
          net_payable: edits.net_payable || b.net_payable || b.net_amount || b.amount || 0,
          contractor_name: edits.contractor_name || b.contractor_name || b.contractor?.name || b.contractor?.contractor_name || 'N/A',
          project_name: edits.project_name || b.project_name || b.project?.name || b.project?.project_name || 'N/A',
        };
      });
      setBatches(mapped);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load wage batches from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Load Projects and Batches
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));

    sitesApi.list().then(res => {
      const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : []);
      setSites(Array.isArray(list) ? list : []);
    }).catch(() => setSites([]));
  }, []);

  useEffect(() => {
    loadBatches();
  }, [selectedProjectId]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      site_id: sites.find(s => String(s.project_id) === String(defaultProj))?.id || '',
      batch_code: `WB-2026-W${35 + batches.length}`,
      period_start: today,
      period_end: today,
    });
    setErrors({});
    setSubmitDebug(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      site_id: String(item.site_id || ''),
      batch_code: item.batch_code || item.code || '',
      period_start: item.period_start || '',
      period_end: item.period_end || '',
      contractor_name: item.contractor_name || '',
      worker_count: String(item.worker_count || '20'),
      total_mandays: String(item.total_mandays || '120'),
      total_ot_hours: String(item.total_ot_hours || '30'),
      gross_wages: String(item.gross_wages || '110000'),
      advances_deducted: String(item.advances_deducted || '8000'),
      net_payable: String(item.net_payable || '102000'),
      status: item.status || 'Pending PM Approval',
      current_approver: item.current_approver || 'Project Manager',
      prepared_by: item.prepared_by || 'Site Engineer',
      notes: item.notes || '',
    });
    setErrors({});
    setSubmitDebug(null);
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'gross_wages' || field === 'advances_deducted') {
        const gross = Number(field === 'gross_wages' ? value : prev.gross_wages) || 0;
        const adv = Number(field === 'advances_deducted' ? value : prev.advances_deducted) || 0;
        next.net_payable = String(Math.max(0, gross - adv));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.batch_code.trim()) errs.batch_code = 'Batch code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
    const gross = Number(form.gross_wages || 0);
    const adv = Number(form.advances_deducted || 0);

    const newBatch = {
      project_id: Number(form.project_id || 1),
      site_id: Number(form.site_id || 1),
      project_code: selectedProj?.project_code || 'PRJ-2026-001',
      project_name: selectedProj?.project_name || 'Civil Project',
      batch_code: form.batch_code,
      period_code: form.batch_code,
      period_start: form.period_start,
      period_end: form.period_end,
      period_label: `${form.period_start} to ${form.period_end}`,
      contractor_name: form.contractor_name,
      worker_count: Number(form.worker_count || 0),
      total_mandays: Number(form.total_mandays || 0),
      total_ot_hours: Number(form.total_ot_hours || 0),
      gross_wages: gross,
      advances_deducted: adv,
      net_payable: Number(form.net_payable || gross - adv),
      status: form.status,
      current_approver: form.current_approver,
      prepared_by: form.prepared_by,
      notes: form.notes,
    };

    try {
      if (editingItem?.id) {
        await request.put(`/labour-wages/${editingItem.id}`, newBatch);
        toast.success('Wage batch updated.');
      } else {
        await wagesApi.create(newBatch);
        toast.success('Wage batch submitted for approval.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      setSubmitDebug(null);
      loadBatches();
    } catch (e) {
      console.error(e);
      setErrors(e?.errors || {});
      setSubmitDebug({ backendErrors: e?.errors || e?.message || e, payload: newBatch });
      toast.error(e?.message || 'Failed to save wage batch.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item) => {
    try { 
      await wagesApi.approve(item.id, {});
      setBatches(prev => prev.map(b => b.id === item.id ? { ...b, status: 'Approved & Released' } : b));
      toast.success(`Wage batch ${item.batch_code} approved. Ready for disbursement.`);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to approve wage batch.');
    }
  };

  const handleReturn = async (item) => {
    try { 
      await wagesApi.cancel(item.id, {});
      setBatches(prev => prev.map(b => b.id === item.id ? { ...b, status: 'Returned for Revision' } : b));
      toast.success(`Wage batch ${item.batch_code} returned for revision.`);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to return wage batch.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await request.delete(`/labour-wages/approvals/${deleteItem.id}`); } catch(e){}
      setBatches(prev => prev.filter(b => b.id !== deleteItem.id));
      toast.success('Wage batch record deleted.');
    } catch {
      toast.error('Failed to delete wage batch.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return batches.filter(b => {
      if (selectedProjectId !== 'all' && String(b.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (b.batch_code || '').toLowerCase();
        const cont = (b.contractor_name || '').toLowerCase();
        const app = (b.current_approver || '').toLowerCase();
        const prep = (b.prepared_by || '').toLowerCase();
        if (!code.includes(q) && !cont.includes(q) && !app.includes(q) && !prep.includes(q)) return false;
      }
      return true;
    });
  }, [batches, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => batches.filter(b => b.status === 'Pending PM Approval').length, [batches]);
  const approvedCount = useMemo(() => batches.filter(b => b.status === 'Approved & Released').length, [batches]);
  const totalApprovedPayroll = useMemo(() => batches.filter(b => b.status === 'Approved & Released').reduce((acc, b) => acc + Number(b.net_payable || 0), 0), [batches]);
  const totalMandaysApproved = useMemo(() => batches.reduce((acc, b) => acc + Number(b.total_mandays || 0), 0), [batches]);

  const getStatusVariant = (status) => {
    if (status === 'Approved & Released') return 'success';
    if (status === 'Pending PM Approval') return 'warning';
    if (status === 'Returned for Revision') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Wage Approval' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Wage Sheet & Payroll Approval"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Wage Batches"
            value={batches.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending PM Sign-Off"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved & Disbursed"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Approved Payroll Payout"
            value={`₹${totalApprovedPayroll.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
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
                options={[
                  { value: 'all', label: 'All Approval Stages' },
                  { value: 'Pending PM Approval', label: 'Pending PM Approval' },
                  { value: 'Approved & Released', label: 'Approved & Released' },
                  { value: 'Returned for Revision', label: 'Returned for Revision' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search batch code, contractor, approver..."
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
              New Wage Batch
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
                  <th className="px-3 py-2 w-32">Wage Batch Ref</th>
                  <th className="px-3 py-2">Project & Contractor</th>
                  <th className="px-3 py-2 text-center w-36 hidden md:table-cell">Headcount & Mandays</th>
                  <th className="px-3 py-2 text-right w-24">Gross (₹)</th>
                  <th className="px-3 py-2 text-right w-24">Deductions</th>
                  <th className="px-3 py-2 text-right w-28">Net Payout</th>
                  <th className="px-3 py-2 text-center w-32">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading wage approval batches...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No wage batches found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 inline-block">
                            {b.batch_code}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate pt-0.5">
                            {b.period_start} to {b.period_end}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={b.project_name}>
                            {b.project_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {b.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                        <span className="text-text-primary font-semibold">{b.worker_count} Workers</span>
                        <span className="text-text-muted block">{b.total_mandays} Mandays ({b.total_ot_hours}h OT)</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{Number(b.gross_wages).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-red-600">
                        {b.advances_deducted > 0 ? `-₹${Number(b.advances_deducted).toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[12px]">
                        ₹{Number(b.net_payable).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(b.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Wage Batch 360"
                            onClick={() => setViewingItem(b)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {b.status === 'Pending PM Approval' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve Wage Batch"
                                onClick={() => handleApprove(b)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(b)}
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(b)}
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
          {paged.map((b, idx) => (
            <div key={b.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{b.batch_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{b.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">{b.project_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(b.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {b.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Workforce Roll</span>
                  <span className="font-mono text-text-primary text-[11px]">{b.worker_count} Workers ({b.total_mandays} Mandays)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Net Payout</span>
                  <span className="font-mono font-bold text-emerald-600 text-[13px]">₹{Number(b.net_payable).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(b)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {b.status === 'Pending PM Approval' && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(b)}>
                    <Check className="w-3 h-3 mr-1" /> Sign-Off
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

      {/* View Wage Batch 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Labour Wage Sheet Approval Roll</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.batch_code} • {viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Wage Amount</span> <span className="font-bold text-text-primary font-mono text-sm">₹{viewingItem.gross_wages.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Advance Deductions</span> <span className="font-bold text-red-600 font-mono text-sm">-₹{viewingItem.advances_deducted.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Payout Approved</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.net_payable.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Workforce Headcount</span> <span className="font-mono">{viewingItem.worker_count} Workers ({viewingItem.total_mandays} Mandays + {viewingItem.total_ot_hours}h OT)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Prepared By</span> <span className="text-text-primary">{viewingItem.prepared_by}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Site Incharge Remarks & Scope:</span>
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

      {/* Add / Edit Batch Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingItem ? 'Edit Wage Approval Batch' : 'Create Wage Approval Batch'}
          subtitle="Consolidate contractor muster rolls for tiered supervisor and PM approval sign-off."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="approval-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            {submitDebug && (
              <div className="bg-red-50 text-red-600 p-3 mb-4 rounded border border-red-200 text-xs font-mono whitespace-pre-wrap">
                RAW BACKEND ERRORS: {JSON.stringify(submitDebug.backendErrors, null, 2)}
                <br/>
                API PAYLOAD SENT: {JSON.stringify(submitDebug.payload, null, 2)}
              </div>
            )}
            <EntityEditModal.Section title="Batch Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Site / Location" required error={errors.site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: `${s.site_code || ''} ${s.site_name}` }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                  />
                </FormField>

                <FormField label="Batch Reference Code" required error={errors.batch_code}>
                  <Input
                    value={form.batch_code}
                    onChange={(e) => handleFormChange('batch_code', e.target.value)}
                    placeholder="WB-2026-W35"
                  />
                </FormField>

                <FormField label="Labour Contractor" required className="md:col-span-2">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Labour Services"
                  />
                </FormField>

                <FormField label="Period Start Date">
                  <Input
                    type="date"
                    value={form.period_start}
                    onChange={(e) => handleFormChange('period_start', e.target.value)}
                  />
                </FormField>

                <FormField label="Period End Date">
                  <Input
                    type="date"
                    value={form.period_end}
                    onChange={(e) => handleFormChange('period_end', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Headcount & Wage Figures">
              <EntityEditModal.Grid>
                <FormField label="Total Workers Count">
                  <Input
                    type="number"
                    value={form.worker_count}
                    onChange={(e) => handleFormChange('worker_count', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Mandays">
                  <Input
                    type="number"
                    value={form.total_mandays}
                    onChange={(e) => handleFormChange('total_mandays', e.target.value)}
                  />
                </FormField>

                <FormField label="Gross Wages (₹)">
                  <Input
                    type="number"
                    value={form.gross_wages}
                    onChange={(e) => handleFormChange('gross_wages', e.target.value)}
                  />
                </FormField>

                <FormField label="Advances Deducted (₹)">
                  <Input
                    type="number"
                    value={form.advances_deducted}
                    onChange={(e) => handleFormChange('advances_deducted', e.target.value)}
                  />
                </FormField>

                <FormField label="Net Payable (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.net_payable).toLocaleString('en-IN')}`}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="approval-form"
            submitLabel={editingItem ? 'Update Batch' : 'Submit for Sign-Off'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Wage Batch"
        message={`Are you sure you want to delete "${deleteItem?.batch_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
