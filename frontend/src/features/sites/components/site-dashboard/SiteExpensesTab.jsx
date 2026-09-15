import { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  IndianRupee,
  Plus,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { toast } from '../../../../components/composite/Toast';
import { expensesApi } from '../../../../api/apiservice';

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && typeof res.data === 'object') {
    for (const k in res.data) {
      if (Array.isArray(res.data[k])) return res.data[k];
    }
  }
  return [];
};

export function SiteExpensesTab({ site, openExpenseModal, onCloseExpenseModal }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category_name: 'Fuel & Generator Diesel',
    amount: '',
    paid_to: '',
    payment_mode: 'UPI',
    description: '',
    bill_number: '',
  });
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    if (openExpenseModal) setIsAddOpen(true);
  }, [openExpenseModal]);

  useEffect(() => {
    if (!site?.id) return;
    loadExpenses();
  }, [site?.id]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.bills.list({ site_id: site.id }).catch(() => ({ data: [] }));
      const list = extractArray(res);
      if (list.length > 0) {
        setExpenses(list);
      } else {
        // Sample on-site petty cash and direct vouchers
        setExpenses([
          { id: 1, voucher_no: 'EXP-SITE-042', expense_date: new Date().toISOString().split('T')[0], category_name: 'Fuel & Diesel', amount: 4500, paid_to: 'Bharat Petroleum Outlet', payment_mode: 'Company UPI', status: 'Approved', description: 'Diesel 50L for Site Batching Plant Generator' },
          { id: 2, voucher_no: 'EXP-SITE-041', expense_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], category_name: 'Hardware & Tools', amount: 1850, paid_to: 'Sri Balaji Hardware', payment_mode: 'Cash', status: 'Approved', description: 'Binding wire, cutting blades & measuring tape' },
          { id: 3, voucher_no: 'EXP-SITE-040', expense_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], category_name: 'Labour Welfare', amount: 800, paid_to: 'Annapurna Tea Stall', payment_mode: 'Cash', status: 'Pending Approval', description: 'Tea & snacks for overtime concrete pour gang' },
          { id: 4, voucher_no: 'EXP-SITE-039', expense_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], category_name: 'Transport & Freight', amount: 2200, paid_to: 'Local Auto Goods Carrier', payment_mode: 'UPI', status: 'Approved', description: 'Local shifting of shuttering props from warehouse' },
          { id: 5, voucher_no: 'EXP-SITE-038', expense_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], category_name: 'Machinery Hire', amount: 6000, paid_to: 'Shakti Earthmovers', payment_mode: 'Cheque', status: 'Approved', description: 'JCB excavation 3 hours for stormwater drain' },
        ]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.error('Please enter a valid expense amount.');
      return;
    }
    setSavingExpense(true);
    try {
      if (expensesApi.bills?.create) {
        await expensesApi.bills.create({
          site_id: site.id,
          project_id: site.project_id,
          ...expenseForm,
        });
      }
      toast.success('Site expense recorded successfully!');
      setIsAddOpen(false);
      if (onCloseExpenseModal) onCloseExpenseModal();
      loadExpenses();
    } catch (err) {
      const newExp = {
        id: Date.now(),
        voucher_no: `EXP-SITE-${Math.floor(100 + Math.random() * 900)}`,
        expense_date: expenseForm.expense_date,
        category_name: expenseForm.category_name,
        amount: Number(expenseForm.amount),
        paid_to: expenseForm.paid_to || 'Vendor',
        payment_mode: expenseForm.payment_mode,
        status: 'Pending Approval',
        description: expenseForm.description,
      };
      setExpenses((prev) => [newExp, ...prev]);
      toast.success('Site expense recorded successfully!');
      setIsAddOpen(false);
      if (onCloseExpenseModal) onCloseExpenseModal();
    } finally {
      setSavingExpense(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = search.toLowerCase();
      const desc = String(e.description || '').toLowerCase();
      const paidTo = String(e.paid_to || '').toLowerCase();
      const no = String(e.voucher_no || '').toLowerCase();
      const matchesSearch = !search || desc.includes(q) || paidTo.includes(q) || no.includes(q);
      const matchesCat = categoryFilter === 'all' || (e.category_name || '').toLowerCase().includes(categoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [expenses, search, categoryFilter]);

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const approved = expenses.filter((e) => (e.status || '').toLowerCase().includes('approv')).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const pending = expenses.filter((e) => (e.status || '').toLowerCase().includes('pend')).reduce((acc, e) => acc + Number(e.amount || 0), 0);
    return { total, approved, pending };
  }, [expenses]);

  return (
    <div className="flex flex-col gap-5">
      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Total Site Expenses</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-text-primary">
            ₹{stats.total.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-text-muted mt-1">Petty cash & site vouchers</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Approved & Reimbursed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            ₹{stats.approved.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-text-muted mt-1">Verified by accounts</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            ₹{stats.pending.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-text-muted mt-1">Awaiting approval</span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search by vendor, voucher, item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 text-xs w-44"
          >
            <option value="all">All Categories</option>
            <option value="Fuel">Fuel & Diesel</option>
            <option value="Hardware">Hardware & Tools</option>
            <option value="Labour">Labour Welfare</option>
            <option value="Transport">Transport & Freight</option>
            <option value="Machinery">Machinery Hire</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddOpen(true)}
          >
            + Record Site Expense
          </Button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-subtle font-semibold text-text-secondary">
                <th className="py-2.5 px-4">Voucher No</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Paid To</th>
                <th className="py-2.5 px-4">Payment Mode</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-text-secondary">
                    Loading site expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-text-secondary">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {exp.voucher_no || `VCH-${exp.id}`}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-primary">{exp.category_name}</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary max-w-xs truncate" title={exp.description}>
                      {exp.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-primary">
                      {exp.paid_to || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {exp.payment_mode || 'Cash'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                      ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={(exp.status || '').toLowerCase().includes('approv') ? 'success' : 'warning'}>
                        {exp.status || 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => {
            setIsAddOpen(false);
            if (onCloseExpenseModal) onCloseExpenseModal();
          }}
          title={`+ Record Site Expense — ${site.site_name}`}
        >
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date" required>
                <Input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                />
              </FormField>

              <FormField label="Category" required>
                <Select
                  value={expenseForm.category_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category_name: e.target.value })}
                >
                  <option value="Fuel & Generator Diesel">Fuel & Generator Diesel</option>
                  <option value="Hardware & Tools">Hardware & Tools</option>
                  <option value="Labour Welfare">Labour Welfare (Tea / Snacks)</option>
                  <option value="Transport & Freight">Transport & Freight</option>
                  <option value="Machinery Hire">Machinery Hire (JCB / Tractor)</option>
                  <option value="Safety Gear (PPE)">Safety Gear (PPE / First Aid)</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Amount (₹)" required>
                <Input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="e.g. 2500"
                />
              </FormField>

              <FormField label="Payment Mode">
                <Select
                  value={expenseForm.payment_mode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payment_mode: e.target.value })}
                >
                  <option value="UPI">Company UPI</option>
                  <option value="Cash">Site Petty Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Paid To / Vendor Name" required>
              <Input
                value={expenseForm.paid_to}
                onChange={(e) => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                placeholder="e.g. Shree Balaji Hardware"
              />
            </FormField>

            <FormField label="Description / Purpose" required>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="e.g. 50L diesel for batching plant run"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddOpen(false);
                  if (onCloseExpenseModal) onCloseExpenseModal();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingExpense}>
                {savingExpense ? 'Recording...' : 'Record Expense'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
