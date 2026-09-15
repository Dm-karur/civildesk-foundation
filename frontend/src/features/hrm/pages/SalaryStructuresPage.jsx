import { useState, useEffect, useMemo } from 'react';
import { IndianRupee, Plus, Save, Loader2, Users, Wallet, CreditCard } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/composite/FormField';
import { TabsSection } from '../../../components/composite/TabsSection';
import { toast } from '../../../components/composite/Toast';
import { employeePayrollApi, usersApi } from '../../../api/apiservice';

export function SalaryStructuresPage() {
  const [activeTab, setActiveTab] = useState('salary');
  const [structures, setStructures] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [salaryForm, setSalaryForm] = useState({
    user_id: '', effective_from: '', basic_salary: '', hra: '0', conveyance_allowance: '0',
    special_allowance: '0', other_allowance: '0', site_allowance_per_day: '0', overtime_hourly_rate: '0',
    epf_percentage: '0', esi_percentage: '0', professional_tax: '0', other_deduction: '0',
  });
  const [advanceForm, setAdvanceForm] = useState({
    user_id: '', advance_type: 'ADVANCE', amount: '', disbursed_date: '', monthly_deduction: '', remarks: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, uRes] = await Promise.all([
        employeePayrollApi.salaryStructures({ is_active: 1 }),
        employeePayrollApi.advances({ is_active: 1 }),
        usersApi.list(),
      ]);
      setStructures(sRes?.data?.salary_structures ?? []);
      setAdvances(aRes?.data?.advances ?? []);
      setUsers(uRes?.data?.users ?? []);
    } catch (err) { toast.error(err.message || 'Failed to load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSaveSalary = async () => {
    if (!salaryForm.user_id || !salaryForm.effective_from || !salaryForm.basic_salary) { toast.error('Employee, effective date, and basic salary are required.'); return; }
    setSaving(true);
    try { await employeePayrollApi.saveSalaryStructure(salaryForm); toast.success('Salary structure saved.'); setShowSalaryForm(false); loadData(); }
    catch (err) { toast.error(err.message || 'Failed.'); } finally { setSaving(false); }
  };

  const handleSaveAdvance = async () => {
    if (!advanceForm.user_id || !advanceForm.amount || !advanceForm.disbursed_date) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try { await employeePayrollApi.saveAdvance(advanceForm); toast.success('Advance saved.'); setShowAdvanceForm(false); loadData(); }
    catch (err) { toast.error(err.message || 'Failed.'); } finally { setSaving(false); }
  };

  const currentList = activeTab === 'salary' ? structures : advances;
  const filtered = useMemo(() => {
    if (!search) return currentList;
    const s = search.toLowerCase();
    return currentList.filter(r => `${r.first_name} ${r.last_name} ${r.employee_code}`.toLowerCase().includes(s));
  }, [currentList, search]);
  const paged = useMemo(() => filtered.slice((page-1)*perPage, page*perPage), [filtered, page]);

  const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <PageContainer>
      <PageHeader title="Salary & Advances" subtitle="Manage employee salary structures and advance/loan disbursements"
        actions={<div className="flex gap-2">
          <Button onClick={() => { setSalaryForm({ user_id: '', effective_from: '', basic_salary: '', hra: '0', conveyance_allowance: '0', special_allowance: '0', other_allowance: '0', site_allowance_per_day: '0', overtime_hourly_rate: '0', epf_percentage: '0', esi_percentage: '0', professional_tax: '0', other_deduction: '0' }); setShowSalaryForm(true); }} className="flex items-center gap-1"><IndianRupee className="h-4 w-4" /> Salary Structure</Button>
          <Button variant="secondary" onClick={() => { setAdvanceForm({ user_id: '', advance_type: 'ADVANCE', amount: '', disbursed_date: '', monthly_deduction: '', remarks: '' }); setShowAdvanceForm(true); }} className="flex items-center gap-1"><CreditCard className="h-4 w-4" /> New Advance</Button>
        </div>} />

      <div className="mb-4 flex gap-3 items-center">
        <TabsSection tabs={[{ key: 'salary', label: 'Salary Structures' }, { key: 'advances', label: 'Advances & Loans' }]} activeTab={activeTab} onChange={t => { setActiveTab(t); setPage(1); }} />
        <div className="flex-1"><SearchField value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search employee..." /></div>
      </div>

      <DataTableContainer loading={loading}>
        {activeTab === 'salary' ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
              <th className="px-3 py-3">Employee</th><th className="px-3 py-3">Effective From</th><th className="px-3 py-3">Basic</th><th className="px-3 py-3">HRA</th>
              <th className="px-3 py-3">Site Allow/Day</th><th className="px-3 py-3">OT Rate/Hr</th><th className="px-3 py-3">EPF %</th><th className="px-3 py-3">ESI %</th>
            </tr></thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-text-secondary">No salary structures found.</td></tr>}
              {paged.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                  <td className="px-3 py-2.5"><div className="font-medium">{r.first_name} {r.last_name}</div><div className="text-xs text-text-secondary">{r.employee_code}</div></td>
                  <td className="px-3 py-2.5">{r.effective_from}</td>
                  <td className="px-3 py-2.5 font-medium">₹{fmt(r.basic_salary)}</td>
                  <td className="px-3 py-2.5">₹{fmt(r.hra)}</td>
                  <td className="px-3 py-2.5">₹{fmt(r.site_allowance_per_day)}</td>
                  <td className="px-3 py-2.5">₹{fmt(r.overtime_hourly_rate)}</td>
                  <td className="px-3 py-2.5">{r.epf_percentage}%</td>
                  <td className="px-3 py-2.5">{r.esi_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
              <th className="px-3 py-3">Employee</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Monthly Deduction</th><th className="px-3 py-3">Recovered</th><th className="px-3 py-3">Balance</th><th className="px-3 py-3">Date</th>
            </tr></thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-text-secondary">No advances found.</td></tr>}
              {paged.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                  <td className="px-3 py-2.5"><div className="font-medium">{r.first_name} {r.last_name}</div><div className="text-xs text-text-secondary">{r.employee_code}</div></td>
                  <td className="px-3 py-2.5"><Badge variant={r.advance_type === 'LOAN' ? 'warning' : 'info'}>{r.advance_type}</Badge></td>
                  <td className="px-3 py-2.5 font-medium">₹{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5">₹{fmt(r.monthly_deduction)}</td>
                  <td className="px-3 py-2.5">₹{fmt(r.total_recovered)}</td>
                  <td className="px-3 py-2.5 font-medium">₹{fmt(r.balance_remaining)}</td>
                  <td className="px-3 py-2.5">{r.disbursed_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataTableContainer>
      {filtered.length > perPage && <Pagination current={page} total={Math.ceil(filtered.length/perPage)} onChange={setPage} />}

      {showSalaryForm && (
        <Modal title="Salary Structure" onClose={() => setShowSalaryForm(false)} size="lg">
          <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            <FormField label="Employee"><Select value={salaryForm.user_id} onChange={e => setSalaryForm({...salaryForm, user_id: e.target.value})}>
              <option value="">Select employee</option>{users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.employee_code})</option>)}
            </Select></FormField>
            <FormField label="Effective From"><Input type="date" value={salaryForm.effective_from} onChange={e => setSalaryForm({...salaryForm, effective_from: e.target.value})} /></FormField>
            <h4 className="font-semibold text-sm text-text-primary pt-2 border-t border-border">Earnings</h4>
            <div className="grid grid-cols-2 gap-4">
              {[['basic_salary','Basic Salary'],['hra','HRA'],['conveyance_allowance','Conveyance'],['special_allowance','Special Allowance'],['other_allowance','Other Allowance'],['site_allowance_per_day','Site Allow/Day'],['overtime_hourly_rate','OT Rate/Hour']].map(([k,l]) => (
                <FormField key={k} label={l}><Input type="number" step="0.01" value={salaryForm[k]} onChange={e => setSalaryForm({...salaryForm, [k]: e.target.value})} /></FormField>
              ))}
            </div>
            <h4 className="font-semibold text-sm text-text-primary pt-2 border-t border-border">Deductions</h4>
            <div className="grid grid-cols-2 gap-4">
              {[['epf_percentage','EPF %'],['esi_percentage','ESI %'],['professional_tax','Professional Tax'],['other_deduction','Other Deduction']].map(([k,l]) => (
                <FormField key={k} label={l}><Input type="number" step="0.01" value={salaryForm[k]} onChange={e => setSalaryForm({...salaryForm, [k]: e.target.value})} /></FormField>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSalaryForm(false)}>Cancel</Button>
              <Button onClick={handleSaveSalary} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {showAdvanceForm && (
        <Modal title="New Advance / Loan" onClose={() => setShowAdvanceForm(false)}>
          <div className="space-y-4 p-4">
            <FormField label="Employee"><Select value={advanceForm.user_id} onChange={e => setAdvanceForm({...advanceForm, user_id: e.target.value})}>
              <option value="">Select</option>{users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
            </Select></FormField>
            <FormField label="Type"><Select value={advanceForm.advance_type} onChange={e => setAdvanceForm({...advanceForm, advance_type: e.target.value})}>
              <option value="ADVANCE">Advance</option><option value="LOAN">Loan</option>
            </Select></FormField>
            <FormField label="Amount"><Input type="number" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})} /></FormField>
            <FormField label="Disbursed Date"><Input type="date" value={advanceForm.disbursed_date} onChange={e => setAdvanceForm({...advanceForm, disbursed_date: e.target.value})} /></FormField>
            <FormField label="Monthly Deduction"><Input type="number" value={advanceForm.monthly_deduction} onChange={e => setAdvanceForm({...advanceForm, monthly_deduction: e.target.value})} /></FormField>
            <FormField label="Remarks"><Textarea value={advanceForm.remarks} onChange={e => setAdvanceForm({...advanceForm, remarks: e.target.value})} rows={2} /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdvanceForm(false)}>Cancel</Button>
              <Button onClick={handleSaveAdvance} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
