import { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee, Play, Check, Lock, Unlock, Loader2, Search, TrendingUp, Users,
  FileText, CheckCircle2, XCircle, AlertTriangle, Download, BarChart3
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { employeePayrollApi, sitesApi } from '../../../api/apiservice';

const SB = { DRAFT: 'warning', REVIEW: 'info', APPROVED: 'success', LOCKED: 'neutral' };

export function PayrollProcessingPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });
  const [siteId, setSiteId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ payroll_month: '', site_id: '' });
  const [viewPayslip, setViewPayslip] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { payroll_month: month };
      if (siteId) params.site_id = siteId;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const [pRes, sRes, sitesRes] = await Promise.all([
        employeePayrollApi.list(params),
        employeePayrollApi.summary({ payroll_month: month }),
        sitesApi.list(),
      ]);
      setPayrolls(pRes?.data?.payrolls ?? []);
      setSummary(sRes?.data?.summary ?? null);
      setSites(sitesRes?.data?.sites ?? sitesRes?.data ?? []);
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, [month, siteId, statusFilter, search]);

  const handleGenerate = async () => {
    if (!genForm.payroll_month) { toast.error('Month is required.'); return; }
    setActionLoading(true);
    try {
      const res = await employeePayrollApi.generate(genForm);
      toast.success(res?.message || 'Payroll generated.');
      setShowGenerate(false);
      setMonth(genForm.payroll_month);
      loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleAction = async (id, action) => {
    setActionLoading(true);
    try {
      if (action === 'approve') await employeePayrollApi.approve(id);
      else if (action === 'lock') await employeePayrollApi.lock(id);
      else if (action === 'reopen') await employeePayrollApi.reopen(id);
      toast.success(`Payroll ${action}d.`); loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleBulkAction = async (action) => {
    if (!confirm(`${action} all ${action === 'bulk-approve' ? 'DRAFT' : 'APPROVED'} payrolls for ${month}?`)) return;
    setActionLoading(true);
    try {
      if (action === 'bulk-approve') await employeePayrollApi.bulkApprove({ payroll_month: month });
      else await employeePayrollApi.bulkLock({ payroll_month: month });
      toast.success('Bulk action complete.'); loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleViewPayslip = async (id) => {
    try {
      const res = await employeePayrollApi.get(id);
      setViewPayslip(res?.data?.payroll ?? null);
    } catch (err) { toast.error(err.message || 'Failed.'); }
  };

  const paged = useMemo(() => payrolls.slice((page-1)*perPage, page*perPage), [payrolls, page]);
  const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <PageContainer>
      <PageHeader title="Payroll Processing" subtitle="Generate, approve, and lock monthly employee payroll"
        actions={<div className="flex gap-2">
          <Button onClick={() => { setGenForm({ payroll_month: month, site_id: '' }); setShowGenerate(true); }} className="flex items-center gap-1"><Play className="h-4 w-4" /> Generate Payroll</Button>
          <Button variant="secondary" onClick={() => handleBulkAction('bulk-approve')} disabled={actionLoading}><Check className="h-4 w-4" /> Approve All</Button>
          <Button variant="secondary" onClick={() => handleBulkAction('bulk-lock')} disabled={actionLoading}><Lock className="h-4 w-4" /> Lock All</Button>
        </div>} />

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 mb-6">
          <KpiCard label="Employees" value={summary.total_employees ?? 0} icon={Users} />
          <KpiCard label="Gross Total" value={`₹${fmt(summary.total_gross)}`} icon={TrendingUp} variant="info" />
          <KpiCard label="Net Total" value={`₹${fmt(summary.total_net)}`} icon={IndianRupee} variant="success" />
          <KpiCard label="Draft" value={summary.draft_count ?? 0} icon={FileText} variant="warning" />
          <KpiCard label="Locked" value={summary.locked_count ?? 0} icon={Lock} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[150px]"><label className="block text-xs font-medium text-text-secondary mb-1">Month</label>
          <Input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} /></div>
        <div className="min-w-[180px]"><label className="block text-xs font-medium text-text-secondary mb-1">Site</label>
          <Select value={siteId} onChange={e => { setSiteId(e.target.value); setPage(1); }}>
            <option value="">All Sites</option>{sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
          </Select></div>
        <div className="min-w-[120px]"><label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
          <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="LOCKED">Locked</option>
          </Select></div>
        <div className="flex-1 min-w-[200px]"><SearchField value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search employee..." /></div>
      </div>

      <DataTableContainer loading={loading}>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
            <th className="px-3 py-3">Employee</th><th className="px-3 py-3">Site</th><th className="px-3 py-3">Days</th>
            <th className="px-3 py-3">Gross</th><th className="px-3 py-3">Deductions</th><th className="px-3 py-3">Net Salary</th>
            <th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {paged.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-text-secondary">No payroll records.</td></tr>}
            {paged.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                <td className="px-3 py-2.5"><div className="font-medium">{r.first_name} {r.last_name}</div><div className="text-xs text-text-secondary">{r.employee_code}</div></td>
                <td className="px-3 py-2.5 text-text-secondary">{r.site_name ?? '—'}</td>
                <td className="px-3 py-2.5"><span className="font-medium">{r.payable_days}</span><span className="text-xs text-text-secondary">/{r.total_days}</span></td>
                <td className="px-3 py-2.5 font-medium">₹{fmt(r.gross_salary)}</td>
                <td className="px-3 py-2.5 text-red-500">₹{fmt(r.total_deductions)}</td>
                <td className="px-3 py-2.5 font-bold text-green-500">₹{fmt(r.net_salary)}</td>
                <td className="px-3 py-2.5"><Badge variant={SB[r.status]}>{r.status}</Badge></td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewPayslip(r.id)}><FileText className="h-4 w-4" /></Button>
                    {r.status === 'DRAFT' && <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, 'approve')} disabled={actionLoading}><Check className="h-4 w-4 text-green-500" /></Button>}
                    {r.status === 'APPROVED' && <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, 'lock')} disabled={actionLoading}><Lock className="h-4 w-4" /></Button>}
                    {r.status === 'LOCKED' && <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, 'reopen')} disabled={actionLoading}><Unlock className="h-4 w-4 text-orange-500" /></Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableContainer>
      {payrolls.length > perPage && <Pagination current={page} total={Math.ceil(payrolls.length/perPage)} onChange={setPage} />}

      {/* Generate Modal */}
      {showGenerate && (
        <Modal title="Generate Monthly Payroll" onClose={() => setShowGenerate(false)}>
          <div className="space-y-4 p-4">
            <FormField label="Payroll Month"><Input type="month" value={genForm.payroll_month} onChange={e => setGenForm({...genForm, payroll_month: e.target.value})} /></FormField>
            <FormField label="Site (optional)"><Select value={genForm.site_id} onChange={e => setGenForm({...genForm, site_id: e.target.value})}>
              <option value="">All Sites</option>{sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </Select></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={actionLoading}>{actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payslip Modal */}
      {viewPayslip && (
        <Modal title="Payslip" onClose={() => setViewPayslip(null)} size="lg">
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{viewPayslip.company_name ?? 'Company'}</h2>
              <p className="text-sm text-text-secondary">Payslip for {viewPayslip.payroll_month}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><strong>Employee:</strong> {viewPayslip.first_name} {viewPayslip.last_name}</div>
              <div><strong>Employee Code:</strong> {viewPayslip.employee_code}</div>
              <div><strong>Designation:</strong> {viewPayslip.designation ?? '—'}</div>
              <div><strong>Site:</strong> {viewPayslip.site_name ?? '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-sm mb-2 pb-1 border-b border-border">Attendance Summary</h4>
                <div className="space-y-1 text-sm">
                  {[['Total Days', viewPayslip.total_days], ['Present', viewPayslip.present_days], ['Absent', viewPayslip.absent_days],
                    ['Leave', viewPayslip.leave_days], ['Half Days', viewPayslip.half_days], ['Week Off', viewPayslip.week_off_days],
                    ['Holidays', viewPayslip.holiday_days], ['LOP Days', viewPayslip.lop_days], ['Payable Days', viewPayslip.payable_days],
                    ['Late Count', viewPayslip.late_count], ['Overtime Hours', viewPayslip.overtime_hours],
                  ].map(([k,v]) => <div key={k} className="flex justify-between"><span className="text-text-secondary">{k}</span><span className="font-medium">{v}</span></div>)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 pb-1 border-b border-border text-green-600">Earnings</h4>
                <div className="space-y-1 text-sm">
                  {[['Basic Salary', viewPayslip.basic_salary], ['HRA', viewPayslip.hra], ['Conveyance', viewPayslip.conveyance_allowance],
                    ['Special Allowance', viewPayslip.special_allowance], ['Other Allowance', viewPayslip.other_allowance],
                    ['Site Allowance', viewPayslip.site_allowance], ['Overtime', viewPayslip.overtime_amount],
                    ['Incentive', viewPayslip.incentive], ['Bonus', viewPayslip.bonus],
                  ].map(([k,v]) => Number(v) > 0 ? <div key={k} className="flex justify-between"><span className="text-text-secondary">{k}</span><span className="text-green-600">₹{fmt(v)}</span></div> : null)}
                  <div className="flex justify-between pt-1 border-t border-border font-bold"><span>Gross Salary</span><span className="text-green-600">₹{fmt(viewPayslip.gross_salary)}</span></div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="font-semibold text-sm mb-2 pb-1 border-b border-border text-red-600">Deductions</h4>
              <div className="space-y-1 text-sm">
                {[['LOP Deduction', viewPayslip.lop_deduction], ['EPF', viewPayslip.epf_deduction], ['ESI', viewPayslip.esi_deduction],
                  ['Professional Tax', viewPayslip.professional_tax], ['Advance Deduction', viewPayslip.advance_deduction],
                  ['Loan Deduction', viewPayslip.loan_deduction], ['Other Deduction', viewPayslip.other_deduction],
                ].map(([k,v]) => Number(v) > 0 ? <div key={k} className="flex justify-between"><span className="text-text-secondary">{k}</span><span className="text-red-500">₹{fmt(v)}</span></div> : null)}
                <div className="flex justify-between pt-1 border-t border-border font-bold"><span>Total Deductions</span><span className="text-red-600">₹{fmt(viewPayslip.total_deductions)}</span></div>
              </div>
            </div>
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <div className="text-sm text-text-secondary">Net Salary</div>
              <div className="text-3xl font-bold text-primary">₹{fmt(viewPayslip.net_salary)}</div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
