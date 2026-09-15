import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Check, X, Clock, Eye, Send, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { employeeAttendanceApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const SB = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };

export function AttendanceCorrectionsPage() {
  const { user } = useAuth();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [showCreate, setShowCreate] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ attendance_id: '', requested_check_in: '', requested_check_out: '', reason: '' });
  const [reviewForm, setReviewForm] = useState({ action: 'APPROVED', remarks: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await employeeAttendanceApi.corrections(params);
      setCorrections(res?.data?.corrections ?? []);
    } catch (err) { toast.error(err.message || 'Failed to load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [statusFilter]);

  const handleCreate = async () => {
    if (!form.attendance_id || !form.reason) { toast.error('Attendance ID and reason are required.'); return; }
    setSaving(true);
    try {
      await employeeAttendanceApi.createCorrection(form);
      toast.success('Correction request submitted.');
      setShowCreate(false);
      setForm({ attendance_id: '', requested_check_in: '', requested_check_out: '', reason: '' });
      load();
    } catch (err) { toast.error(err.message || 'Failed to submit.'); }
    finally { setSaving(false); }
  };

  const handleReview = async () => {
    setSaving(true);
    try {
      await employeeAttendanceApi.reviewCorrection(reviewItem.id, reviewForm);
      toast.success(`Correction ${reviewForm.action.toLowerCase()}.`);
      setReviewItem(null);
      load();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const paged = useMemo(() => corrections.slice((page-1)*perPage, page*perPage), [corrections, page]);

  return (
    <PageContainer>
      <PageHeader title="Attendance Corrections" subtitle="Request and review attendance corrections"
        actions={<Button onClick={() => setShowCreate(true)} className="flex items-center gap-1"><Send className="h-4 w-4" /> Request Correction</Button>} />

      <div className="mb-4 flex gap-3">
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
            <th className="px-3 py-3">Employee</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Requested In</th>
            <th className="px-3 py-3">Requested Out</th><th className="px-3 py-3">Reason</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {paged.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-text-secondary">No corrections found.</td></tr>}
            {paged.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                <td className="px-3 py-2.5"><div className="font-medium">{r.first_name} {r.last_name}</div><div className="text-xs text-text-secondary">{r.employee_code}</div></td>
                <td className="px-3 py-2.5">{r.attendance_date}</td>
                <td className="px-3 py-2.5">{r.requested_check_in ? new Date(r.requested_check_in).toLocaleTimeString() : '—'}</td>
                <td className="px-3 py-2.5">{r.requested_check_out ? new Date(r.requested_check_out).toLocaleTimeString() : '—'}</td>
                <td className="px-3 py-2.5 max-w-[200px] truncate">{r.reason}</td>
                <td className="px-3 py-2.5"><Badge variant={SB[r.status]}>{r.status}</Badge></td>
                <td className="px-3 py-2.5">
                  {r.status === 'PENDING' && (
                    <Button size="sm" variant="ghost" onClick={() => { setReviewItem(r); setReviewForm({ action: 'APPROVED', remarks: '' }); }}>
                      <Eye className="h-4 w-4" /> Review
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableContainer>
      {corrections.length > perPage && <Pagination current={page} total={Math.ceil(corrections.length/perPage)} onChange={setPage} />}

      {/* Create Correction Modal */}
      {showCreate && (
        <Modal title="Request Attendance Correction" onClose={() => setShowCreate(false)}>
          <div className="space-y-4 p-4">
            <FormField label="Attendance Record ID"><Input type="number" value={form.attendance_id} onChange={e => setForm({...form, attendance_id: e.target.value})} placeholder="Enter attendance ID" /></FormField>
            <FormField label="Corrected Check-In"><Input type="datetime-local" value={form.requested_check_in} onChange={e => setForm({...form, requested_check_in: e.target.value})} /></FormField>
            <FormField label="Corrected Check-Out"><Input type="datetime-local" value={form.requested_check_out} onChange={e => setForm({...form, requested_check_out: e.target.value})} /></FormField>
            <FormField label="Reason"><Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3} placeholder="Explain why correction is needed" /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {reviewItem && (
        <Modal title="Review Correction" onClose={() => setReviewItem(null)}>
          <div className="space-y-4 p-4">
            <div className="text-sm"><strong>Employee:</strong> {reviewItem.first_name} {reviewItem.last_name}</div>
            <div className="text-sm"><strong>Date:</strong> {reviewItem.attendance_date}</div>
            <div className="text-sm"><strong>Reason:</strong> {reviewItem.reason}</div>
            <FormField label="Decision">
              <Select value={reviewForm.action} onChange={e => setReviewForm({...reviewForm, action: e.target.value})}>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </Select>
            </FormField>
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
