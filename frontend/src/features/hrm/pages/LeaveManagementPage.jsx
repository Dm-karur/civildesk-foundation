import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, Plus, Check, X, Loader2, BarChart3 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/composite/FormField';
import { TabsSection } from '../../../components/composite/TabsSection';
import { toast } from '../../../components/composite/Toast';
import { employeeLeaveApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const SB = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'neutral' };

export function LeaveManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leave-requests');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPermForm, setShowPermForm] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewType, setReviewType] = useState('leave');
  const [saving, setSaving] = useState(false);

  const [leaveForm, setLeaveForm] = useState({ leave_type_id: '', from_date: '', to_date: '', total_days: '', reason: '' });
  const [permForm, setPermForm] = useState({ permission_date: '', from_time: '', to_time: '', reason: '' });
  const [reviewForm, setReviewForm] = useState({ action: 'APPROVED', remarks: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, balRes, lrRes, prRes] = await Promise.all([
        employeeLeaveApi.leaveTypes(),
        employeeLeaveApi.leaveBalances({ year: new Date().getFullYear() }),
        employeeLeaveApi.leaveRequests(statusFilter ? { status: statusFilter } : {}),
        employeeLeaveApi.permissionRequests(statusFilter ? { status: statusFilter } : {}),
      ]);
      setLeaveTypes(typesRes?.data?.leave_types ?? []);
      setBalances(balRes?.data?.balances ?? []);
      setLeaveRequests(lrRes?.data?.leave_requests ?? []);
      setPermissionRequests(prRes?.data?.permission_requests ?? []);
    } catch (err) { toast.error(err.message || 'Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const handleLeaveSubmit = async () => {
    if (!leaveForm.leave_type_id || !leaveForm.from_date || !leaveForm.to_date) { toast.error('Fill all required fields.'); return; }
    setSaving(true);
    try {
      await employeeLeaveApi.createLeaveRequest(leaveForm);
      toast.success('Leave request submitted.');
      setShowLeaveForm(false);
      setLeaveForm({ leave_type_id: '', from_date: '', to_date: '', total_days: '', reason: '' });
      loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handlePermSubmit = async () => {
    if (!permForm.permission_date || !permForm.from_time || !permForm.to_time || !permForm.reason) { toast.error('Fill all required fields.'); return; }
    setSaving(true);
    try {
      await employeeLeaveApi.createPermissionRequest(permForm);
      toast.success('Permission request submitted.');
      setShowPermForm(false);
      setPermForm({ permission_date: '', from_time: '', to_time: '', reason: '' });
      loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleReview = async () => {
    setSaving(true);
    try {
      if (reviewType === 'leave') await employeeLeaveApi.reviewLeaveRequest(reviewItem.id, reviewForm);
      else await employeeLeaveApi.reviewPermissionRequest(reviewItem.id, reviewForm);
      toast.success(`${reviewType === 'leave' ? 'Leave' : 'Permission'} request ${reviewForm.action.toLowerCase()}.`);
      setReviewItem(null);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const currentList = activeTab === 'leave-requests' ? leaveRequests : permissionRequests;
  const paged = useMemo(() => currentList.slice((page-1)*perPage, page*perPage), [currentList, page]);

  return (
    <PageContainer>
      <PageHeader title="Leave & Permissions" subtitle="Manage leave requests, permission requests, and leave balances"
        actions={<div className="flex gap-2">
          <Button onClick={() => setShowLeaveForm(true)} className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Apply Leave</Button>
          <Button variant="secondary" onClick={() => setShowPermForm(true)} className="flex items-center gap-1"><Clock className="h-4 w-4" /> Request Permission</Button>
        </div>} />

      {/* Leave Balance Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 mb-6">
          {balances.map(b => (
            <KpiCard key={b.id} label={b.leave_type_name} value={`${b.balance ?? 0} / ${b.allocated ?? 0}`} icon={CalendarDays}
              variant={Number(b.balance) <= 0 ? 'danger' : Number(b.balance) <= 3 ? 'warning' : 'success'} />
          ))}
        </div>
      )}

      <div className="mb-4 flex gap-3 items-center">
        <TabsSection tabs={[
          { key: 'leave-requests', label: 'Leave Requests' },
          { key: 'permission-requests', label: 'Permission Requests' },
        ]} activeTab={activeTab} onChange={t => { setActiveTab(t); setPage(1); }} />
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      <DataTableContainer loading={loading}>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
            <th className="px-3 py-3">Employee</th>
            {activeTab === 'leave-requests' ? (
              <><th className="px-3 py-3">Type</th><th className="px-3 py-3">From</th><th className="px-3 py-3">To</th><th className="px-3 py-3">Days</th></>
            ) : (
              <><th className="px-3 py-3">Date</th><th className="px-3 py-3">From</th><th className="px-3 py-3">To</th><th className="px-3 py-3">Hours</th></>
            )}
            <th className="px-3 py-3">Reason</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {paged.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-text-secondary">No requests found.</td></tr>}
            {paged.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                <td className="px-3 py-2.5"><div className="font-medium">{r.first_name} {r.last_name}</div><div className="text-xs text-text-secondary">{r.employee_code}</div></td>
                {activeTab === 'leave-requests' ? (
                  <><td className="px-3 py-2.5"><Badge variant="info">{r.leave_type_name}</Badge></td>
                    <td className="px-3 py-2.5">{r.from_date}</td><td className="px-3 py-2.5">{r.to_date}</td><td className="px-3 py-2.5 font-medium">{r.total_days}</td></>
                ) : (
                  <><td className="px-3 py-2.5">{r.permission_date}</td>
                    <td className="px-3 py-2.5">{r.from_time}</td><td className="px-3 py-2.5">{r.to_time}</td><td className="px-3 py-2.5 font-medium">{r.duration_hours}h</td></>
                )}
                <td className="px-3 py-2.5 max-w-[150px] truncate">{r.reason}</td>
                <td className="px-3 py-2.5"><Badge variant={SB[r.status]}>{r.status}</Badge></td>
                <td className="px-3 py-2.5">
                  {r.status === 'PENDING' && (
                    <Button size="sm" variant="ghost" onClick={() => { setReviewItem(r); setReviewType(activeTab === 'leave-requests' ? 'leave' : 'permission'); setReviewForm({ action: 'APPROVED', remarks: '' }); }}>Review</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableContainer>
      {currentList.length > perPage && <Pagination current={page} total={Math.ceil(currentList.length/perPage)} onChange={setPage} />}

      {/* Leave Form Modal */}
      {showLeaveForm && (
        <Modal title="Apply for Leave" onClose={() => setShowLeaveForm(false)}>
          <div className="space-y-4 p-4">
            <FormField label="Leave Type"><Select value={leaveForm.leave_type_id} onChange={e => setLeaveForm({...leaveForm, leave_type_id: e.target.value})}>
              <option value="">Select type</option>
              {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.leave_type_name} ({t.leave_type_code})</option>)}
            </Select></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="From Date"><Input type="date" value={leaveForm.from_date} onChange={e => setLeaveForm({...leaveForm, from_date: e.target.value})} /></FormField>
              <FormField label="To Date"><Input type="date" value={leaveForm.to_date} onChange={e => setLeaveForm({...leaveForm, to_date: e.target.value})} /></FormField>
            </div>
            <FormField label="Total Days"><Input type="number" step="0.5" value={leaveForm.total_days} onChange={e => setLeaveForm({...leaveForm, total_days: e.target.value})} placeholder="Auto-calculated if blank" /></FormField>
            <FormField label="Reason"><Textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} rows={3} /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
              <Button onClick={handleLeaveSubmit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Permission Form Modal */}
      {showPermForm && (
        <Modal title="Request Permission" onClose={() => setShowPermForm(false)}>
          <div className="space-y-4 p-4">
            <FormField label="Date"><Input type="date" value={permForm.permission_date} onChange={e => setPermForm({...permForm, permission_date: e.target.value})} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="From Time"><Input type="time" value={permForm.from_time} onChange={e => setPermForm({...permForm, from_time: e.target.value})} /></FormField>
              <FormField label="To Time"><Input type="time" value={permForm.to_time} onChange={e => setPermForm({...permForm, to_time: e.target.value})} /></FormField>
            </div>
            <FormField label="Reason"><Textarea value={permForm.reason} onChange={e => setPermForm({...permForm, reason: e.target.value})} rows={3} /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowPermForm(false)}>Cancel</Button>
              <Button onClick={handlePermSubmit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {reviewItem && (
        <Modal title={`Review ${reviewType === 'leave' ? 'Leave' : 'Permission'} Request`} onClose={() => setReviewItem(null)}>
          <div className="space-y-4 p-4">
            <div className="text-sm"><strong>Employee:</strong> {reviewItem.first_name} {reviewItem.last_name}</div>
            <div className="text-sm"><strong>Reason:</strong> {reviewItem.reason}</div>
            <FormField label="Decision"><Select value={reviewForm.action} onChange={e => setReviewForm({...reviewForm, action: e.target.value})}>
              <option value="APPROVED">Approve</option><option value="REJECTED">Reject</option>
            </Select></FormField>
            <FormField label="Remarks"><Textarea value={reviewForm.remarks} onChange={e => setReviewForm({...reviewForm, remarks: e.target.value})} rows={2} /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewItem(null)}>Cancel</Button>
              <Button onClick={handleReview} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : reviewForm.action === 'APPROVED' ? 'Approve' : 'Reject'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
