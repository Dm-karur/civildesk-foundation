import { useState, useEffect } from 'react';
import { X, Wallet, Plus, Edit, Trash2 } from 'lucide-react';
import { budgetsApi } from '../../../api/apiservice';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { useAuth } from '../../auth/context/AuthContext';

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}

function BudgetLinesTab({ budgetId }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!budgetId) return;
    setLoading(true);
    budgetsApi.lines.list(budgetId)
      .then((res) => setLines(res?.data?.lines ?? res?.data?.budget_lines ?? res?.lines ?? res?.data?.data ?? []))
      .catch(() => setLines([]))
      .finally(() => setLoading(false));
  }, [budgetId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-[12px]">Loading budget lines...</div>;
  if (lines.length === 0) return <div className="py-8 text-center text-text-muted text-[12px]">No budget lines defined.</div>;

  return (
    <table className="w-full text-left text-[12px]">
      <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
        <tr>
          <th className="px-3 py-2 w-10">#</th>
          <th className="px-3 py-2">Cost Category</th>
          <th className="px-3 py-2">Description</th>
          <th className="px-3 py-2 text-right w-24">Quantity</th>
          <th className="px-3 py-2 text-right w-24">Unit Rate</th>
          <th className="px-3 py-2 text-right w-28">Amount (₹)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {lines.map((line, i) => (
          <tr key={line.id || i} className="hover:bg-surface-muted/30">
            <td className="px-3 py-1.5 text-text-primary text-[11px]">{i + 1}</td>
            <td className="px-3 py-1.5 text-text-primary font-medium">{line.cost_type || line.category_name || '—'}</td>
            <td className="px-3 py-1.5 text-text-secondary">{line.description || line.line_description || '—'}</td>
            <td className="px-3 py-1.5 text-right text-text-secondary text-[11px]">{line.quantity ?? '—'}</td>
            <td className="px-3 py-1.5 text-right text-text-secondary text-[11px]">₹{Number(line.unit_rate || line.rate || 0).toLocaleString('en-IN')}</td>
            <td className="px-3 py-1.5 text-right font-mono font-semibold text-text-primary text-[11px]">₹{Number(line.amount || line.total || 0).toLocaleString('en-IN')}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="border-t-2 border-border">
        <tr className="bg-surface-muted/50">
          <td colSpan="5" className="px-3 py-2 text-right font-bold text-text-primary text-[12px]">Grand Total</td>
          <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[13px]">
            ₹{lines.reduce((sum, l) => sum + Number(l.amount || l.total || 0), 0).toLocaleString('en-IN')}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function RevisionsTab({ budgetId }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!budgetId) return;
    setLoading(true);
    budgetsApi.revisions.list(budgetId)
      .then((res) => setRevisions(res?.data?.revisions ?? res?.revisions ?? res?.data?.data ?? []))
      .catch(() => setRevisions([]))
      .finally(() => setLoading(false));
  }, [budgetId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-[12px]">Loading revisions...</div>;
  if (revisions.length === 0) return <div className="py-8 text-center text-text-muted text-[12px]">No revisions for this budget.</div>;

  const getVariant = (s) => {
    const v = String(s || '').toLowerCase();
    if (v.includes('approved')) return 'success';
    if (v.includes('submitted')) return 'warning';
    if (v.includes('rejected')) return 'error';
    return 'neutral';
  };

  return (
    <table className="w-full text-left text-[12px]">
      <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
        <tr>
          <th className="px-3 py-2 w-10">#</th>
          <th className="px-3 py-2">Revision</th>
          <th className="px-3 py-2">Reason</th>
          <th className="px-3 py-2 w-28 text-center">Status</th>
          <th className="px-3 py-2 text-right w-28">Amount (₹)</th>
          <th className="px-3 py-2 w-28">Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {revisions.map((rev, i) => (
          <tr key={rev.id || i} className="hover:bg-surface-muted/30">
            <td className="px-3 py-1.5 text-text-primary text-[11px]">{i + 1}</td>
            <td className="px-3 py-1.5 text-text-primary font-medium">{rev.revision_number || rev.version || `Rev ${i + 1}`}</td>
            <td className="px-3 py-1.5 text-text-secondary">{rev.reason || rev.description || '—'}</td>
            <td className="px-3 py-1.5 text-center"><Badge variant={getVariant(rev.status_name || rev.status)} className="text-[8px] font-bold uppercase">{rev.status_name || rev.status || 'Draft'}</Badge></td>
            <td className="px-3 py-1.5 text-right font-mono font-semibold text-text-primary text-[11px]">₹{Number(rev.total_amount || 0).toLocaleString('en-IN')}</td>
            <td className="px-3 py-1.5 text-text-secondary text-[11px]">{rev.created_at ? rev.created_at.split(' ')[0] : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ApprovalHistoryTab({ budgetId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!budgetId) return;
    setLoading(true);
    budgetsApi.approvalHistory(budgetId)
      .then((res) => setHistory(res?.data?.history ?? res?.data?.approval_history ?? res?.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [budgetId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-[12px]">Loading approval history...</div>;
  if (history.length === 0) return <div className="py-8 text-center text-text-muted text-[12px]">No approval history.</div>;

  return (
    <div className="space-y-3">
      {history.map((h, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-surface-subtle border border-border/50">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.action === 'approved' ? 'bg-success' : h.action === 'rejected' ? 'bg-error' : 'bg-info'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-text-primary">{h.action_label || h.action || '—'}</div>
            <div className="text-[11px] text-text-secondary">{h.user_name || h.performed_by || '—'} · {h.created_at ? h.created_at.split(' ')[0] : '—'}</div>
            {h.remarks && <div className="text-[11px] text-text-muted mt-1">{h.remarks}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BudgetDetailModal({ isOpen, budget, onClose }) {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('lines');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!isOpen || !budget?.id) return;
    budgetsApi.get(budget.id)
      .then((res) => setDetail(res?.data?.project_budget ?? res?.data ?? res))
      .catch(() => setDetail(budget));
  }, [isOpen, budget?.id]);

  if (!isOpen || !budget) return null;

  const d = detail || budget;
  const status = d.status_name || d.status || 'Draft';
  const getVariant = (s) => {
    const v = String(s).toLowerCase();
    if (v.includes('approved')) return 'success';
    if (v.includes('submitted')) return 'warning';
    if (v.includes('rejected')) return 'error';
    return 'neutral';
  };

  const handleAction = async (actionName) => {
    try {
      await budgetsApi[actionName](budget.id, {});
      toast.success(`Budget ${actionName}ed.`);
      const res = await budgetsApi.get(budget.id);
      setDetail(res?.data?.project_budget ?? res?.data ?? res);
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-surface-muted/30 shrink-0">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">{d.budget_name || d.name || 'Budget Detail'}</h2>
                <Badge variant={getVariant(status)} className="text-[8px] font-bold uppercase">{status}</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">{d.budget_code || d.code} · {d.project_name || 'Project'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {String(status).toLowerCase().includes('draft') && hasPermission('budget.submit') && (
              <Button variant="primary" size="sm" className="h-8 text-[12px]" onClick={() => handleAction('submit')}>Submit</Button>
            )}
            {String(status).toLowerCase().includes('submitted') && hasPermission('budget.approve') && (
              <>
                <Button variant="primary" size="sm" className="h-8 text-[12px]" onClick={() => handleAction('approve')}>Approve</Button>
                <Button variant="outline" size="sm" className="h-8 text-[12px] text-error border-error/30" onClick={() => handleAction('reject')}>Reject</Button>
              </>
            )}
            <button type="button" onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-border bg-surface">
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Total Lines</div><div className="text-lg font-bold text-text-primary">{d.line_count ?? '—'}</div></div>
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Grand Total</div><div className="text-lg font-bold text-text-primary">₹{Number(d.total_amount || d.grand_total || 0).toLocaleString('en-IN')}</div></div>
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Revisions</div><div className="text-lg font-bold text-text-primary">{d.revision_count ?? '0'}</div></div>
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Created</div><div className="text-lg font-bold text-text-primary">{d.created_at ? d.created_at.split(' ')[0] : '—'}</div></div>
        </div>

        <div className="flex border-b border-border px-6 overflow-x-auto">
          <TabButton active={activeTab === 'lines'} onClick={() => setActiveTab('lines')} label="Budget Lines" />
          <TabButton active={activeTab === 'revisions'} onClick={() => setActiveTab('revisions')} label="Revisions" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Approval History" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'lines' && <BudgetLinesTab budgetId={budget.id} />}
          {activeTab === 'revisions' && <RevisionsTab budgetId={budget.id} />}
          {activeTab === 'history' && <ApprovalHistoryTab budgetId={budget.id} />}
        </div>
      </div>
    </div>
  );
}
