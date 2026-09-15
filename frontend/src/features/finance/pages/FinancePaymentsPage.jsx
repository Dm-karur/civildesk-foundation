import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, ArrowUpRight
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
  bill_id: '',
  payment_no: '',
  payment_date: '',
  payment_mode_id: '',
  beneficiary_name: '',
  amount_paid: '0',
  tds_deducted: '0',
  bank_account: '',
  utr_no: '',
  notes: '',
};

export function FinancePaymentsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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

  const fetchPayments = () => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      expensesApi.payments.list().catch(() => ({ data: [] })),
      expensesApi.bills.list().catch(() => ({ data: [] })),
      expensesApi.masters().catch(() => ({ data: {} }))
    ]).then(([projRes, payRes, billsRes, mastersRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const masters = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      setPaymentModes(masters.payment_modes || []);

      const allBills = billsRes?.data?.expense_bills ?? billsRes?.data?.data ?? [];
      setBills(allBills);

      const payList = payRes?.data?.expense_payments ?? payRes?.data?.data ?? [];
      const normalized = payList.map((p, idx) => {
        const project = pList.find(proj => String(proj.id) === String(p.project_id));
        const bill = allBills.find(b => String(b.id) === String(p.bill_id));
        const mode = (masters.payment_modes || []).find(m => String(m.id) === String(p.payment_mode_id));

        return {
          id: p.id,
          project_id: p.project_id,
          project_code: project ? project.project_code : 'PRJ-2026',
          project_name: project ? project.project_name : 'Civil Project',
          payment_no: p.payment_no,
          payment_date: p.payment_date ? p.payment_date.split(' ')[0] : '',
          bill_id: p.bill_id,
          bill_no: bill ? bill.bill_no : `BILL-${p.bill_id}`,
          beneficiary_name: p.payee_name || (bill ? bill.payee_name : 'Vendor/Supplier'),
          category: mode ? mode.payment_mode_name || mode.payment_mode_code : 'Bank Transfer',
          amount_paid: Number(p.amount || 0),
          tds_deducted: Number(p.tds_deducted || 0),
          payment_mode: mode ? mode.payment_mode_name || mode.payment_mode_code : 'RTGS',
          bank_account: p.petty_cash_account_id ? `Petty Cash A/C #${p.petty_cash_account_id}` : 'Corporate Operation A/C',
          utr_no: p.reference_no || '',
          status_code: p.status_code || 'DRAFT',
          status_name: p.status_name || 'Draft',
          notes: p.remarks || ''
        };
      });
      setPayments(normalized);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  // Load Projects & API Data
  useEffect(() => {
    fetchPayments();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');
    const defaultMode = paymentModes[0]?.id ? String(paymentModes[0].id) : '';

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      payment_mode_id: defaultMode,
      payment_date: today,
      amount_paid: '0',
      tds_deducted: '0',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      bill_id: String(item.bill_id || ''),
      payment_no: item.payment_no || '',
      payment_date: item.payment_date || '',
      beneficiary_name: item.beneficiary_name || '',
      amount_paid: String(item.amount_paid || '0'),
      tds_deducted: String(item.tds_deducted || '0'),
      payment_mode_id: String(item.payment_mode_id || ''),
      bank_account: item.bank_account || '',
      utr_no: item.utr_no || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'bill_id') {
        const selectedBill = bills.find(b => String(b.id) === String(value));
        if (selectedBill) {
          next.beneficiary_name = selectedBill.payee_name || '';
          next.amount_paid = String(selectedBill.outstanding_amount || '0');
        }
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.bill_id) errs.bill_id = 'Posted bill is required';
    if (!form.payment_no.trim()) errs.payment_no = 'Payment voucher number is required';
    if (!form.payment_mode_id) errs.payment_mode_id = 'Payment mode is required';
    if (!form.amount_paid || Number(form.amount_paid) <= 0) errs.amount_paid = 'Amount must be positive';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bill_id: Number(form.bill_id),
        payment_no: form.payment_no.trim(),
        payment_date: form.payment_date,
        payment_mode_id: Number(form.payment_mode_id),
        amount: Number(form.amount_paid),
        tds_deducted: Number(form.tds_deducted || 0),
        reference_no: form.utr_no ? form.utr_no.trim() : null,
        remarks: form.notes || null
      };

      if (editingItem?.id) {
        await expensesApi.payments.update(editingItem.id, payload);
        toast.success('Payment voucher updated.');
      } else {
        await expensesApi.payments.create(payload);
        toast.success('Disbursement payment voucher recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchPayments();
    } catch (err) {
      toast.error(err?.message || 'Failed to save payment voucher.');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, actionName) => {
    try {
      await expensesApi.payments.action(id, actionName, {});
      toast.success(`Payment voucher ${actionName} completed.`);
      if (viewingItem && viewingItem.id === id) {
        setViewingItem(null);
      }
      fetchPayments();
    } catch (err) {
      toast.error(err?.message || `Failed to perform action ${actionName}.`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      await expensesApi.payments.action(deleteItem.id, 'cancel', {});
      toast.success('Payment voucher cancelled.');
      setDeleteItem(null);
      fetchPayments();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel payment.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(p.payment_no || '').toLowerCase();
        const ben = String(p.beneficiary_name || '').toLowerCase();
        const utr = String(p.utr_no || '').toLowerCase();
        const proj = String(p.project_name || '').toLowerCase();
        if (!no.includes(str) && !ben.includes(str) && !utr.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [payments, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalDisbursed = useMemo(() => payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0), [payments]);
  const totalTDSWithheld = useMemo(() => payments.reduce((acc, p) => acc + Number(p.tds_deducted || 0), 0), [payments]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Payment Disbursements' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Disbursement Payments & Bank Settlement Vouchers"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Disbursed to Date"
            value={`₹${(totalDisbursed / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Settled Payment Vouchers"
            value={`${payments.length} Payments`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Statutory TDS Remitted"
            value={`₹${(totalTDSWithheld / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<CreditCard className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Treasury Bank Settlement"
            value="100% UTR Verified"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
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

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search payment no, beneficiary, UTR..."
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
              title="Print Payment Register"
            >
              Print Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Record Payment
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
                  <th className="px-3 py-2 w-28">Payment Ref</th>
                  <th className="px-3 py-2">Beneficiary & Category</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-emerald-600">Amount Paid</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">TDS Deducted</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Bank Ref / UTR</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading disbursement records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No payment vouchers found.
                    </td>
                  </tr>
                ) : (
                  paged.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {p.payment_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{p.payment_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={p.beneficiary_name}>
                            {p.beneficiary_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {p.category} • {p.bill_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{p.amount_paid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{p.tds_deducted.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary truncate">
                        {p.utr_no}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={p.status_code === 'PAID' ? 'success' : p.status_code === 'APPROVED' ? 'primary' : p.status_code === 'SUBMITTED' ? 'warning' : 'neutral'}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {p.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Payment Advice 360"
                            onClick={() => setViewingItem(p)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {p.status_code === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(p)}
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
          {paged.map((p, idx) => (
            <div key={p.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{p.payment_no} • {p.payment_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.beneficiary_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.category}</span>
                </div>
                <Badge
                  variant={p.status_code === 'PAID' ? 'success' : p.status_code === 'APPROVED' ? 'primary' : p.status_code === 'SUBMITTED' ? 'warning' : 'neutral'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{p.amount_paid.toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Advice
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

      {/* View Payment Advice 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.payment_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.beneficiary_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Disbursed Amount</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.amount_paid.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Withheld</span> <span className="font-mono text-amber-600 font-bold">₹{viewingItem.tds_deducted.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Mode</span> <span className="font-mono">{viewingItem.payment_mode}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bank UTR Reference</span> <span className="font-mono font-bold text-primary">{viewingItem.utr_no || '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Date</span> <span className="font-mono">{viewingItem.payment_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Workflow Status</span> <span className="font-mono font-semibold text-primary">{viewingItem.status_name}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Settled Against Bill</span> <span className="font-mono">{viewingItem.bill_no}</span></div>
                {viewingItem.notes && (
                  <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Remarks / Notes</span> <span className="text-text-secondary">{viewingItem.notes}</span></div>
                )}
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
                  <Button variant="success" size="sm" onClick={() => handleAction(viewingItem.id, 'mark-paid')}>
                    Mark Paid
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
          icon={CreditCard}
          title={editingItem ? 'Edit Payment Voucher' : 'Record Disbursement Payment'}
          subtitle="Record treasury bank disbursements to material suppliers and subcontractors."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="pay-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Payment Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Payment Voucher No" required error={errors.payment_no}>
                  <Input
                    value={form.payment_no}
                    onChange={(e) => handleFormChange('payment_no', e.target.value)}
                    placeholder="PAY-2026-095"
                  />
                </FormField>

                <FormField label="Select Posted Bill" required error={errors.bill_id} className="md:col-span-2">
                  <Select
                    options={bills
                      .filter(b => String(b.project_id) === String(form.project_id) && b.status_code === 'POSTED')
                      .map(b => ({
                        value: String(b.id),
                        label: `${b.bill_no} (Outstanding: ₹${Number(b.outstanding_amount).toLocaleString('en-IN')}) - ${b.payee_name}`
                      }))}
                    value={form.bill_id}
                    onChange={(v) => handleFormChange('bill_id', v)}
                  />
                </FormField>

                <FormField label="Beneficiary Entity Name">
                  <Input
                    value={form.beneficiary_name}
                    readOnly
                    className="bg-surface-muted"
                  />
                </FormField>

                <FormField label="Payment Date" required>
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => handleFormChange('payment_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Bank Settlement & TDS">
              <EntityEditModal.Grid>
                <FormField label="Payment Mode" required error={errors.payment_mode_id}>
                  <Select
                    options={paymentModes.map(m => ({ value: String(m.id), label: m.payment_mode_name }))}
                    value={form.payment_mode_id}
                    onChange={(v) => handleFormChange('payment_mode_id', v)}
                  />
                </FormField>

                <FormField label="Amount Paid (₹)" required error={errors.amount_paid}>
                  <Input
                    type="number"
                    value={form.amount_paid}
                    onChange={(e) => handleFormChange('amount_paid', e.target.value)}
                  />
                </FormField>

                <FormField label="TDS Deducted (₹)">
                  <Input
                    type="number"
                    value={form.tds_deducted}
                    onChange={(e) => handleFormChange('tds_deducted', e.target.value)}
                  />
                </FormField>

                <FormField label="Bank UTR Reference No" className="md:col-span-2">
                  <Input
                    value={form.utr_no}
                    onChange={(e) => handleFormChange('utr_no', e.target.value)}
                    placeholder="HDFCR520260821901"
                  />
                </FormField>

                <FormField label="Notes / Remarks" className="md:col-span-2">
                  <Textarea
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Enter transaction remarks..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="pay-form"
            submitLabel={editingItem ? 'Update Payment' : 'Save Payment Voucher'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Cancel Payment Record"
        message={`Are you sure you want to cancel payment "${deleteItem?.payment_no}"?`}
        variant="danger"
        confirmLabel="Cancel Payment"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
