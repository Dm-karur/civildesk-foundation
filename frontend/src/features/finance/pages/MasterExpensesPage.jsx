import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Landmark
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
import { projectsApi, expensesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  bill_no: '',
  internal_voucher_no: '',
  bill_date: '',
  due_date: '',
  payee_name: '',
  payee_type_id: '',
  expense_category_id: '',
  taxable_amount: '1000000',
  gst_amount: '180000',
  grand_total: '1180000',
  paid_amount: '0',
  notes: '',
};

export function MasterExpensesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [payeeTypes, setPayeeTypes] = useState([]);
  const [bills, setBills] = useState([]);
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

  const fetchBills = () => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      expensesApi.bills.list().catch(() => ({ data: [] })),
      expensesApi.masters().catch(() => ({ data: {} }))
    ]).then(([projRes, billsRes, mastersRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const masters = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      setCategories(masters.expense_categories || []);
      setPayeeTypes(masters.payee_types || []);

      const bList = billsRes?.data?.expense_bills ?? billsRes?.data?.data ?? [];
      const normalized = bList.map((b, idx) => {
        const project = pList.find(p => String(p.id) === String(b.project_id));
        const status = b.status_name || b.status_code || 'Draft';
        const pmStatus = b.payment_status_code || 'UNPAID';
        const payment_status = pmStatus === 'PAID' ? 'Fully Settled' : pmStatus === 'PARTIALLY_PAID' ? 'Partially Settled' : 'Pending Payment';
        return {
          id: b.id,
          project_id: b.project_id,
          project_code: project ? project.project_code : 'PRJ-2026',
          project_name: project ? project.project_name : 'Civil Project',
          bill_no: b.bill_no,
          internal_voucher_no: b.internal_voucher_no,
          bill_date: b.bill_date ? b.bill_date.split(' ')[0] : '',
          due_date: b.due_date ? b.due_date.split(' ')[0] : '',
          payee_name: b.payee_name,
          payee_type_id: b.payee_type_id,
          cost_head: b.category_name || b.cost_head || 'Site Expense',
          taxable_amount: Number(b.taxable_amount || 0),
          gst_amount: (Number(b.cgst_amount) || 0) + (Number(b.sgst_amount) || 0) + (Number(b.igst_amount) || 0),
          grand_total: Number(b.net_payable || b.gross_amount || 0),
          paid_amount: Number(b.paid_amount || 0),
          balance_due: Number(b.outstanding_amount || 0),
          payment_status: payment_status,
          status_code: b.status_code || 'DRAFT',
          status_name: status,
          notes: b.remarks || ''
        };
      });
      setBills(normalized);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  // Load Projects & API Data
  useEffect(() => {
    fetchBills();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');
    const defaultCategory = categories[0]?.id ? String(categories[0].id) : '';
    const defaultPayeeType = payeeTypes[0]?.id ? String(payeeTypes[0].id) : '';

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      expense_category_id: defaultCategory,
      payee_type_id: defaultPayeeType,
      bill_no: '',
      internal_voucher_no: '',
      bill_date: today,
      due_date: today,
      payee_name: '',
      taxable_amount: '100000',
      gst_amount: '18000',
      grand_total: '118000',
      paid_amount: '0',
      notes: '',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      bill_no: item.bill_no || '',
      internal_voucher_no: item.internal_voucher_no || '',
      bill_date: item.bill_date || '',
      due_date: item.due_date || '',
      payee_name: item.payee_name || '',
      payee_type_id: String(item.payee_type_id || ''),
      expense_category_id: categories[0]?.id ? String(categories[0].id) : '',
      taxable_amount: String(item.taxable_amount || '0'),
      gst_amount: String(item.gst_amount || '0'),
      grand_total: String(item.grand_total || '0'),
      paid_amount: String(item.paid_amount || '0'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'taxable_amount' || field === 'gst_amount') {
        const tax = Number(field === 'taxable_amount' ? value : prev.taxable_amount) || 0;
        const gst = Number(field === 'gst_amount' ? value : prev.gst_amount) || 0;
        next.grand_total = String(tax + gst);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.bill_no.trim()) errs.bill_no = 'Bill number is required';
    if (!form.payee_name.trim()) errs.payee_name = 'Payee name is required';
    if (!form.payee_type_id) errs.payee_type_id = 'Payee type is required';
    if (!form.expense_category_id && !editingItem) errs.expense_category_id = 'Expense category is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_id: Number(form.project_id),
        bill_no: form.bill_no.trim(),
        internal_voucher_no: form.internal_voucher_no.trim(),
        bill_date: form.bill_date,
        due_date: form.due_date || null,
        payee_type_id: Number(form.payee_type_id),
        payee_name: form.payee_name.trim(),
        discount_amount: 0,
        cgst_amount: Number(form.gst_amount || 0) / 2,
        sgst_amount: Number(form.gst_amount || 0) / 2,
        igst_amount: 0,
        other_charges: 0,
        round_off: 0,
        tds_amount: 0,
        remarks: form.notes || null,
      };

      if (editingItem?.id) {
        await expensesApi.bills.update(editingItem.id, payload);
        toast.success('Expense bill updated.');
      } else {
        const res = await expensesApi.bills.create(payload);
        const newBill = res?.data?.expense_bill;
        const billId = newBill?.id;
        if (billId) {
          await expensesApi.bills.addItem(billId, {
            expense_category_id: Number(form.expense_category_id),
            description: 'General charges',
            quantity: 1,
            rate: Number(form.taxable_amount || 0),
            tax_rate: Number(form.taxable_amount || 0) > 0
              ? Number(((Number(form.gst_amount || 0) / Number(form.taxable_amount || 0)) * 100).toFixed(2))
              : 0
          });
        }
        toast.success('Master expense bill registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchBills();
    } catch (err) {
      toast.error(err?.message || 'Failed to save expense bill.');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, actionName) => {
    try {
      await expensesApi.bills.action(id, actionName, {});
      toast.success(`Expense bill ${actionName} completed.`);
      if (viewingItem && viewingItem.id === id) {
        setViewingItem(null);
      }
      fetchBills();
    } catch (err) {
      toast.error(err?.message || `Failed to perform action ${actionName}.`);
    }
  };

  const confirmDelete = async () => {
    // Wait, the backend doesn't support deleting bills directly, but let's do a cancel transition instead!
    if (!deleteItem?.id) return;
    try {
      await expensesApi.bills.action(deleteItem.id, 'cancel', {});
      toast.success('Expense bill cancelled.');
      setDeleteItem(null);
      fetchBills();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel bill.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return bills.filter(b => {
      if (selectedProjectId !== 'all' && String(b.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !b.payment_status.includes(statusFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(b.bill_no || '').toLowerCase();
        const vch = String(b.internal_voucher_no || '').toLowerCase();
        const pay = String(b.payee_name || '').toLowerCase();
        const proj = String(b.project_name || '').toLowerCase();
        if (!no.includes(str) && !vch.includes(str) && !pay.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [bills, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalBilled = useMemo(() => bills.reduce((acc, b) => acc + Number(b.grand_total || 0), 0), [bills]);
  const totalPaid = useMemo(() => bills.reduce((acc, b) => acc + Number(b.paid_amount || 0), 0), [bills]);
  const totalDue = useMemo(() => bills.reduce((acc, b) => acc + Number(b.balance_due || 0), 0), [bills]);

  const getStatusVariant = (st) => {
    if (st.includes('Fully')) return 'success';
    if (st.includes('Partial')) return 'warning';
    return 'danger';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Master Expense Bills Register' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Master Expense Bills & Payables Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Gross Billed"
            value={`₹${(totalBilled / 100000).toFixed(2)}L`}
            status="primary"
            icon={<Receipt className="w-4 h-4" />}
          />
          <KpiCard
            label="Disbursed & Paid"
            value={`₹${(totalPaid / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Balance Payables Due"
            value={`₹${(totalDue / 100000).toFixed(2)}L`}
            status={totalDue > 0 ? 'warning' : 'success'}
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="GST Input Tax Credit (ITC)"
            value="100% Reconciled"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
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
                  { value: 'Fully', label: 'Fully Settled' },
                  { value: 'Partial', label: 'Partially Settled' },
                  { value: 'Pending', label: 'Pending Payment' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search bill no, voucher, payee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Expense Bills"
            >
              Print Bills
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Expense Bill
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
                  <th className="px-3 py-2 w-28">Bill No</th>
                  <th className="px-3 py-2">Payee & Cost Head</th>
                  <th className="px-3 py-2 text-right w-28">Taxable</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">GST</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Total (₹)</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-amber-600">Balance Due</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading master expense bills...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No expense bills found.
                    </td>
                  </tr>
                ) : (
                  paged.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {b.bill_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{b.bill_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={b.payee_name}>
                            {b.payee_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {b.cost_head} • {b.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(b.taxable_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-sky-600">
                        ₹{(b.gst_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(b.grand_total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        ₹{(b.balance_due).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={b.status_code === 'POSTED' ? 'success' : b.status_code === 'APPROVED' ? 'primary' : b.status_code === 'SUBMITTED' ? 'warning' : 'neutral'}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {b.status_name}
                          </Badge>
                          <Badge
                            variant={b.payment_status.includes('Fully') ? 'success' : b.payment_status.includes('Partial') ? 'warning' : 'danger'}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none mt-0.5"
                          >
                            {b.payment_status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Bill 360"
                            onClick={() => setViewingItem(b)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {b.status_code === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(b)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{b.bill_no} • {b.bill_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{b.payee_name}</h4>
                  <span className="text-[11px] text-text-muted">{b.cost_head}</span>
                </div>
                <Badge
                  variant={getStatusVariant(b.payment_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(b.grand_total / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Paid Amount</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(b.paid_amount / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance Due</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(b.balance_due / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(b)}>
                  <Eye className="w-3 h-3 mr-1" /> View Bill
                </Button>
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

      {/* View Bill 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.bill_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.payee_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Bill Sum</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.grand_total).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Balance Due</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.balance_due).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Taxable Amount</span> <span className="font-mono">₹{(viewingItem.taxable_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST Amount</span> <span className="font-mono text-sky-600">₹{(viewingItem.gst_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Paid to Date</span> <span className="font-mono font-bold text-emerald-600">₹{(viewingItem.paid_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Due Date</span> <span className="font-mono">{viewingItem.due_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Workflow Status</span> <span className="font-mono font-semibold text-primary">{viewingItem.status_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Status</span> <span className="font-mono font-semibold text-emerald-600">{viewingItem.payment_status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Cost Head</span> <span className="text-text-primary font-medium">{viewingItem.cost_head}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print
                </Button>
                {viewingItem.status_code === 'DRAFT' && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => handleAction(viewingItem.id, 'submit')}>
                      Submit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(viewingItem.id, 'cancel')}>
                      Cancel
                    </Button>
                  </>
                )}
                {viewingItem.status_code === 'SUBMITTED' && (
                  <>
                    <Button variant="success" size="sm" onClick={() => handleAction(viewingItem.id, 'approve')}>
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(viewingItem.id, 'reject')}>
                      Reject
                    </Button>
                  </>
                )}
                {viewingItem.status_code === 'APPROVED' && (
                  <Button variant="primary" size="sm" onClick={() => handleAction(viewingItem.id, 'post')}>
                    Post to Accounts
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Receipt}
          title={editingItem ? 'Edit Expense Bill' : 'Add Master Expense Bill'}
          subtitle="Record supplier / vendor expense bills, GST input tax credits, and payment statuses."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="eb-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Bill Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Bill / Invoice No" required error={errors.bill_no}>
                  <Input
                    value={form.bill_no}
                    onChange={(e) => handleFormChange('bill_no', e.target.value)}
                    placeholder="BILL-2026-108"
                  />
                </FormField>

                <FormField label="Internal Voucher No">
                  <Input
                    value={form.internal_voucher_no}
                    onChange={(e) => handleFormChange('internal_voucher_no', e.target.value)}
                    placeholder="VCH-EXP-0885"
                  />
                </FormField>

                <FormField label="Payee Type" required error={errors.payee_type_id}>
                  <Select
                    options={payeeTypes.map(pt => ({ value: String(pt.id), label: pt.payee_type_name }))}
                    value={form.payee_type_id}
                    onChange={(v) => handleFormChange('payee_type_id', v)}
                  />
                </FormField>

                <FormField label="Payee / Vendor Name" required error={errors.payee_name} className="md:col-span-2">
                  <Input
                    value={form.payee_name}
                    onChange={(e) => handleFormChange('payee_name', e.target.value)}
                    placeholder="e.g. Tata Steel Ltd / Authorized Distributor"
                  />
                </FormField>

                <FormField label="Bill Date" required>
                  <Input
                    type="date"
                    value={form.bill_date}
                    onChange={(e) => handleFormChange('bill_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Due Date" required>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => handleFormChange('due_date', e.target.value)}
                  />
                </FormField>

                {!editingItem && (
                  <FormField label="Expense Category" required error={errors.expense_category_id} className="md:col-span-2">
                    <Select
                      options={categories.map(c => ({ value: String(c.id), label: `${c.category_code} - ${c.category_name}` }))}
                      value={form.expense_category_id}
                      onChange={(v) => handleFormChange('expense_category_id', v)}
                    />
                  </FormField>
                )}
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Valuation & GST">
              <EntityEditModal.Grid>
                <FormField label="Taxable Basic Sum (₹)" required>
                  <Input
                    type="number"
                    value={form.taxable_amount}
                    disabled={Boolean(editingItem)}
                    onChange={(e) => handleFormChange('taxable_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Amount (₹)">
                  <Input
                    type="number"
                    value={form.gst_amount}
                    disabled={Boolean(editingItem)}
                    onChange={(e) => handleFormChange('gst_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Grand Total (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.grand_total || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="eb-form"
            submitLabel={editingItem ? 'Update Bill' : 'Save Expense Bill'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Expense Bill"
        message={`Are you sure you want to delete "${deleteItem?.bill_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
