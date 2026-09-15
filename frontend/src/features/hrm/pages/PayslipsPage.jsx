import { useState, useEffect, useMemo } from 'react';
import { FileText, Download, IndianRupee, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { toast } from '../../../components/composite/Toast';
import { employeePayrollApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const SB = { DRAFT: 'warning', APPROVED: 'success', LOCKED: 'neutral' };

export function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewPayslip, setViewPayslip] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await employeePayrollApi.list({ user_id: user?.id });
        setPayslips(res?.data?.payrolls ?? []);
      } catch (err) { toast.error(err.message || 'Failed to load payslips.'); }
      finally { setLoading(false); }
    }
    if (user?.id) load();
  }, [user?.id]);

  const handleView = async (id) => {
    try {
      const res = await employeePayrollApi.get(id);
      setViewPayslip(res?.data?.payroll ?? null);
    } catch (err) { toast.error(err.message || 'Failed.'); }
  };

  const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <PageContainer>
      <PageHeader title="My Payslips" subtitle="View your monthly payslips and salary details" />

      <DataTableContainer loading={loading}>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
            <th className="px-3 py-3">Month</th><th className="px-3 py-3">Site</th><th className="px-3 py-3">Payable Days</th>
            <th className="px-3 py-3">Gross</th><th className="px-3 py-3">Deductions</th><th className="px-3 py-3">Net Salary</th>
            <th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {payslips.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-text-secondary">No payslips found.</td></tr>}
            {payslips.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                <td className="px-3 py-2.5 font-medium">{r.payroll_month}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.site_name ?? '—'}</td>
                <td className="px-3 py-2.5">{r.payable_days}/{r.total_days}</td>
                <td className="px-3 py-2.5 font-medium">₹{fmt(r.gross_salary)}</td>
                <td className="px-3 py-2.5 text-red-500">₹{fmt(r.total_deductions)}</td>
                <td className="px-3 py-2.5 font-bold text-green-500">₹{fmt(r.net_salary)}</td>
                <td className="px-3 py-2.5"><Badge variant={SB[r.status]}>{r.status}</Badge></td>
                <td className="px-3 py-2.5"><Button size="sm" variant="ghost" onClick={() => handleView(r.id)}><FileText className="h-4 w-4" /> View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableContainer>

      {viewPayslip && (
        <Modal title={`Payslip — ${viewPayslip.payroll_month}`} onClose={() => setViewPayslip(null)} size="lg">
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{viewPayslip.company_name ?? 'Company'}</h2>
              <p className="text-sm text-text-secondary">Payslip for {viewPayslip.payroll_month}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><strong>Name:</strong> {viewPayslip.first_name} {viewPayslip.last_name}</div>
              <div><strong>Code:</strong> {viewPayslip.employee_code}</div>
              <div><strong>Designation:</strong> {viewPayslip.designation ?? '—'}</div>
              <div><strong>Site:</strong> {viewPayslip.site_name ?? '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-sm mb-2 pb-1 border-b border-border">Attendance</h4>
                <div className="space-y-1 text-sm">
                  {[['Present', viewPayslip.present_days],['Absent', viewPayslip.absent_days],['Leave', viewPayslip.leave_days],
                    ['Week Off', viewPayslip.week_off_days],['Holiday', viewPayslip.holiday_days],['LOP', viewPayslip.lop_days],['Payable', viewPayslip.payable_days]
                  ].map(([k,v]) => <div key={k} className="flex justify-between"><span className="text-text-secondary">{k}</span><span>{v}</span></div>)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 pb-1 border-b border-border text-green-600">Earnings</h4>
                <div className="space-y-1 text-sm">
                  {[['Basic', viewPayslip.basic_salary],['HRA', viewPayslip.hra],['Site Allowance', viewPayslip.site_allowance],['Overtime', viewPayslip.overtime_amount]
                  ].map(([k,v]) => Number(v)>0 ? <div key={k} className="flex justify-between"><span className="text-text-secondary">{k}</span><span className="text-green-600">₹{fmt(v)}</span></div> : null)}
                  <div className="flex justify-between pt-1 border-t font-bold"><span>Gross</span><span className="text-green-600">₹{fmt(viewPayslip.gross_salary)}</span></div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="font-semibold text-sm mb-2 pb-1 border-b border-border text-red-600">Deductions</h4>
              <div className="space-y-1 text-sm">
                {[['LOP', viewPayslip.lop_deduction],['EPF', viewPayslip.epf_deduction],['ESI', viewPayslip.esi_deduction],['PT', viewPayslip.professional_tax],['Advance', viewPayslip.advance_deduction],['Loan', viewPayslip.loan_deduction]
                ].map(([k,v]) => Number(v)>0 ? <div key={k} className="flex justify-between"><span className="text-text-secondary">{k}</span><span className="text-red-500">₹{fmt(v)}</span></div> : null)}
                <div className="flex justify-between pt-1 border-t font-bold"><span>Total</span><span className="text-red-600">₹{fmt(viewPayslip.total_deductions)}</span></div>
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
