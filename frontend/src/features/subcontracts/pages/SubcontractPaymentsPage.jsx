import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock, Building,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, FileText,
  ExternalLink, X, ChevronDown, CheckSquare
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
import { projectsApi, subcontractsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  payment_no: '',
  payment_date: '',
  contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
  ra_bill_no: 'RA-2026-003',
  work_order_no: 'WO-2026-012',
  amount: '500000',
  payment_mode: 'RTGS / Bank Transfer',
  reference_no: '',
  bank_account: 'HDFC Bank - Current A/C (..4910)',
  notes: '',
};

export function SubcontractPaymentsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'weekly' | 'ra_bill'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending Approval' | 'Approved' | 'Paid'
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

  const [raBills, setRaBills] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // Quick Disburse / Pay Modal
  const [disburseItem, setDisburseItem] = useState(null);
  const [disburseForm, setDisburseForm] = useState({
    payment_mode: 'RTGS / Bank Transfer',
    reference_no: '',
    payment_date: new Date().toISOString().split('T')[0],
    bank_account: 'HDFC Bank - Current A/C (*4910)',
  });
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);

  const fetchList = () => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      subcontractsApi.raBills.list().catch(() => ({ data: [] })),
      subcontractsApi.masters().catch(() => ({ data: {} })),
      subcontractsApi.payments.list().catch(() => ({ data: [] }))
    ]).then(([projRes, raRes, mastersRes, payRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const rList = raRes?.data?.ra_bills ?? raRes?.data?.data ?? [];
      setRaBills(Array.isArray(rList) ? rList : []);

      const mList = mastersRes?.data?.masters || {};
      setPaymentModes(mList.payment_modes || []);

      let allPayments = [];

      const pListRes = payRes?.data?.payments ?? payRes?.data?.data ?? [];
      if (Array.isArray(pListRes) && pListRes.length > 0) {
        const normalized = pListRes.map((p, idx) => {
          const matchedProj = pList.find(pr => String(pr.id) === String(p.project_id));
          const matchedBill = rList.find(b => String(b.id) === String(p.ra_bill_id));
          const matchedMode = (mList.payment_modes || []).find(m => String(m.id) === String(p.payment_mode_id));
          return {
            id: p.id,
            project_id: p.project_id,
            project_code: matchedProj?.project_code || 'PRJ-01',
            project_name: matchedProj?.project_name || 'Project Name',
            payment_no: p.payment_no || `PAY-${p.id}`,
            payment_date: p.payment_date || '',
            contractor_id: p.contractor_id,
            contractor_name: matchedBill?.contractor_name || p.contractor_name || 'Subcontractor Partner',
            ra_bill_id: p.ra_bill_id,
            ra_bill_no: matchedBill?.ra_bill_no || 'RA-00',
            payment_type: 'RA Bill',
            amount: Number(p.amount || 0),
            payment_mode_id: p.payment_mode_id,
            payment_mode: matchedMode?.payment_mode_name || p.payment_mode || 'RTGS Transfer',
            reference_no: p.reference_no || '',
            status: p.status_name || p.status || 'Paid',
            status_name: p.status_name || p.status || 'Paid',
            notes: p.remarks || p.notes || '',
          };
        });
        allPayments.push(...normalized);
      }

      // Merge with Subcontractor Payments synced from Site Labour and Weekly Slips
      try {
        const stored = JSON.parse(localStorage.getItem('mock_subcontract_payments') || '[]');
        if (Array.isArray(stored)) {
          stored.forEach(sp => {
            if (!allPayments.some(p => p.id === sp.id || (sp.voucher_no && p.voucher_no === sp.voucher_no))) {
              allPayments.push({
                ...sp,
                payment_type: sp.payment_type || 'Weekly Slip',
                status: sp.status || sp.status_name || 'Pending Approval',
                status_name: sp.status || sp.status_name || 'Pending Approval',
              });
            }
          });
        }
      } catch {}

      // Also ensure all weekly records from mock_subcontractor_weekly_payments are visible
      try {
        const weeklyStored = JSON.parse(localStorage.getItem('mock_subcontractor_weekly_payments') || '[]');
        if (Array.isArray(weeklyStored)) {
          weeklyStored.forEach(w => {
            if (!allPayments.some(p => p.voucher_no === w.voucher_no || p.id === `pay-${w.id}` || p.id === w.id)) {
              allPayments.push({
                id: `pay-${w.id}`,
                voucher_no: w.voucher_no,
                payment_no: `PAY-${w.voucher_no}`,
                payment_date: w.week_end || w.payment_date || new Date().toISOString().split('T')[0],
                contractor_id: w.contractor_id,
                contractor_name: w.contractor_name,
                project_id: w.project_id,
                project_name: w.project_name || w.site_name,
                payment_type: 'Weekly Slip',
                amount: Number(w.net_payable || w.gross_amount || 0),
                payment_mode: w.payment_mode || 'RTGS / Bank Transfer',
                reference_no: w.reference_no || '',
                status: w.status || 'Pending Approval',
                status_name: w.status || 'Pending Approval',
                notes: w.notes || `Weekly wage settlement for ${w.contractor_name}`,
                created_at: new Date().toISOString(),
              });
            }
          });
        }
      } catch {}

      setPayments(allPayments);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      payment_no: `PAY-2026-09${payments.length + 5}`,
      payment_date: today,
      reference_no: `UTR-HDFC-${Math.floor(100000000 + Math.random() * 900000000)}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      payment_no: item.payment_no || '',
      payment_date: item.payment_date || '',
      contractor_id: String(item.contractor_id || ''),
      ra_bill_id: String(item.ra_bill_id || ''),
      amount: String(item.amount || ''),
      payment_mode_id: String(item.payment_mode_id || ''),
      reference_no: item.reference_no || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.ra_bill_id) errs.ra_bill_id = 'RA Bill is required';
    if (!form.payment_no.trim()) errs.payment_no = 'Payment voucher number is required';
    if (!form.payment_date) errs.payment_date = 'Payment Date is required';
    if (!form.payment_mode_id) errs.payment_mode_id = 'Payment Mode is required';
    if (!form.amount) errs.amount = 'Amount is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedBill = raBills.find(b => String(b.id) === String(form.ra_bill_id));
      const contractorId = selectedBill ? selectedBill.contractor_id : form.contractor_id;

      const payload = {
        project_id: Number(form.project_id),
        ra_bill_id: Number(form.ra_bill_id),
        contractor_id: Number(contractorId),
        payment_no: form.payment_no,
        payment_date: form.payment_date,
        payment_mode_id: Number(form.payment_mode_id),
        amount: Number(form.amount || 0),
        reference_no: form.reference_no || null,
        remarks: form.notes,
      };

      if (editingItem?.id) {
        await subcontractsApi.payments.update(editingItem.id, payload);
        toast.success('Payment voucher updated.');
      } else {
        await subcontractsApi.payments.create(payload);
        toast.success('Payment voucher recorded.');
      }
      fetchList();
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save payment voucher.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Approve Payment Action
  const handleApprovePayment = (item) => {
    const updated = payments.map(p => {
      if (p.id === item.id || (item.voucher_no && p.voucher_no === item.voucher_no)) {
        return { ...p, status: 'Approved', status_name: 'Approved' };
      }
      return p;
    });
    setPayments(updated);

    // Sync to mock_subcontract_payments
    try {
      const stored = JSON.parse(localStorage.getItem('mock_subcontract_payments') || '[]');
      const updatedStored = stored.map(p => {
        if (p.id === item.id || (item.voucher_no && p.voucher_no === item.voucher_no)) {
          return { ...p, status: 'Approved', status_name: 'Approved' };
        }
        return p;
      });
      localStorage.setItem('mock_subcontract_payments', JSON.stringify(updatedStored));
    } catch {}

    // Sync to mock_subcontractor_weekly_payments
    try {
      const weekly = JSON.parse(localStorage.getItem('mock_subcontractor_weekly_payments') || '[]');
      const updatedWeekly = weekly.map(w => {
        if (w.voucher_no === item.voucher_no || w.id === item.id || `pay-${w.id}` === item.id) {
          return { ...w, status: 'Approved', approved_by: 'Authorized Head' };
        }
        return w;
      });
      localStorage.setItem('mock_subcontractor_weekly_payments', JSON.stringify(updatedWeekly));
    } catch {}

    toast.success(`Payment voucher ${item.payment_no || item.voucher_no} approved for payout.`);
  };

  // Open Quick Pay Modal
  const handleOpenDisbursePayment = (item) => {
    setDisburseItem(item);
    setDisburseForm({
      payment_mode: item.payment_mode || 'RTGS / Bank Transfer',
      reference_no: item.reference_no || `UTR-HDFC-${Math.floor(100000000 + Math.random() * 900000000)}`,
      payment_date: new Date().toISOString().split('T')[0],
      bank_account: item.bank_account || 'HDFC Bank - Current A/C (*4910)',
    });
    setIsDisburseOpen(true);
  };

  // Confirm Disburse & Mark Paid
  const handleConfirmDisbursePayment = () => {
    if (!disburseItem) return;
    if (!disburseForm.reference_no.trim()) {
      toast.error('Payment reference / UTR number is required.');
      return;
    }

    const updated = payments.map(p => {
      if (p.id === disburseItem.id || (disburseItem.voucher_no && p.voucher_no === disburseItem.voucher_no)) {
        return {
          ...p,
          status: 'Paid',
          status_name: 'Paid',
          payment_mode: disburseForm.payment_mode,
          reference_no: disburseForm.reference_no,
          payment_date: disburseForm.payment_date,
          bank_account: disburseForm.bank_account,
        };
      }
      return p;
    });
    setPayments(updated);

    // Sync to mock_subcontract_payments
    try {
      const stored = JSON.parse(localStorage.getItem('mock_subcontract_payments') || '[]');
      const updatedStored = stored.map(p => {
        if (p.id === disburseItem.id || (disburseItem.voucher_no && p.voucher_no === disburseItem.voucher_no)) {
          return {
            ...p,
            status: 'Paid',
            status_name: 'Paid',
            payment_mode: disburseForm.payment_mode,
            reference_no: disburseForm.reference_no,
            payment_date: disburseForm.payment_date,
            bank_account: disburseForm.bank_account,
          };
        }
        return p;
      });
      localStorage.setItem('mock_subcontract_payments', JSON.stringify(updatedStored));
    } catch {}

    // Sync to mock_subcontractor_weekly_payments
    try {
      const weekly = JSON.parse(localStorage.getItem('mock_subcontractor_weekly_payments') || '[]');
      const updatedWeekly = weekly.map(w => {
        if (w.voucher_no === disburseItem.voucher_no || w.id === disburseItem.id || `pay-${w.id}` === disburseItem.id) {
          return {
            ...w,
            status: 'Paid',
            payment_mode: disburseForm.payment_mode,
            reference_no: disburseForm.reference_no,
            payment_date: disburseForm.payment_date,
            bank_account: disburseForm.bank_account,
          };
        }
        return p;
      });
      localStorage.setItem('mock_subcontractor_weekly_payments', JSON.stringify(updatedWeekly));
    } catch {}

    toast.success(`Payment of ₹${Number(disburseItem.amount).toLocaleString('en-IN')} marked as Paid!`);
    setIsDisburseOpen(false);
    setDisburseItem(null);
  };

  const getStatusBadge = (status) => {
    const s = status || 'Draft';
    switch (s) {
      case 'Paid':
      case 'Disbursed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-2.5 h-2.5 text-emerald-600" /> Paid
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-2.5 h-2.5 text-sky-600" /> Approved
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {s}
          </span>
        );
    }
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (typeFilter !== 'all') {
        const isWeekly = (p.payment_type || '').toLowerCase().includes('weekly') || Boolean(p.voucher_no);
        if (typeFilter === 'weekly' && !isWeekly) return false;
        if (typeFilter === 'ra_bill' && isWeekly) return false;
      }
      if (statusFilter !== 'all') {
        const st = p.status || p.status_name || '';
        if (st !== statusFilter) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const no = String(p.payment_no || '').toLowerCase();
        const cont = String(p.contractor_name || '').toLowerCase();
        const ref = String(p.reference_no || '').toLowerCase();
        const rano = String(p.ra_bill_no || p.voucher_no || '').toLowerCase();
        if (!no.includes(s) && !cont.includes(s) && !ref.includes(s) && !rano.includes(s)) return false;
      }
      return true;
    });
  }, [payments, selectedProjectId, typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalDisbursed = useMemo(() => payments.filter(p => (p.status || p.status_name) === 'Paid').reduce((acc, p) => acc + Number(p.amount || 0), 0), [payments]);
  const totalPending = useMemo(() => payments.filter(p => (p.status || p.status_name) === 'Pending Approval').reduce((acc, p) => acc + Number(p.amount || 0), 0), [payments]);
  const totalApproved = useMemo(() => payments.filter(p => (p.status || p.status_name) === 'Approved').reduce((acc, p) => acc + Number(p.amount || 0), 0), [payments]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Subcontractor Payments' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractor Payment Disbursements & Bank Vouchers"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Paid to Date"
            value={`₹${(totalDisbursed / 100000).toFixed(2)}L`}
            status="success"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Approval"
            value={`₹${(totalPending / 100000).toFixed(2)}L`}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved (Ready to Pay)"
            value={`₹${(totalApproved / 100000).toFixed(2)}L`}
            status="primary"
            icon={<CreditCard className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Total Payment Vouchers"
            value={`${payments.length} Records`}
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

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Payment Types' },
                  { value: 'weekly', label: 'Weekly Slips' },
                  { value: 'ra_bill', label: 'RA Bills' },
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Pending Approval', label: 'Pending Approval' },
                  { value: 'Approved', label: 'Approved (Unpaid)' },
                  { value: 'Paid', label: 'Paid' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search payment no, UTR, contractor..."
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
              Record Payment Voucher
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
                  <th className="px-3 py-2 w-32">Voucher / Payment No</th>
                  <th className="px-3 py-2 w-28">Type</th>
                  <th className="px-3 py-2">Contractor & Ref</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Amount (₹)</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Mode & Bank Ref</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading payment records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No payment vouchers found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paged.map((p, idx) => {
                    const isWeekly = (p.payment_type || '').toLowerCase().includes('weekly') || Boolean(p.voucher_no);
                    const currentStatus = p.status || p.status_name || 'Pending Approval';

                    return (
                      <tr key={p.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {p.payment_no || p.voucher_no}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono block pt-0.5">{p.payment_date}</span>
                        </td>
                        <td className="px-3 py-2">
                          {isWeekly ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Weekly Slip
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              RA Bill
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={p.contractor_name}>
                              {p.contractor_name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {p.ra_bill_no || p.voucher_no || 'Slip'} • {p.project_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                          <div>{p.payment_mode || 'RTGS'}</div>
                          <div className="text-primary truncate">{p.reference_no || '—'}</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {getStatusBadge(currentStatus)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Approve Button */}
                            {currentStatus === 'Pending Approval' && (
                              <button
                                type="button"
                                onClick={() => handleApprovePayment(p)}
                                title="Approve Payment"
                                className="p-1 rounded text-sky-600 hover:bg-sky-50 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Mark Paid / Disburse Button */}
                            {currentStatus !== 'Paid' && currentStatus !== 'Disbursed' && (
                              <button
                                type="button"
                                onClick={() => handleOpenDisbursePayment(p)}
                                title="Record Payment (Mark Paid)"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View Weekly Slip if Weekly Payment */}
                            {isWeekly && (
                              <button
                                type="button"
                                onClick={() => window.open(`/subcontracts/weekly-payments/new?id=${p.voucher_no || p.id}&contractor_id=${p.contractor_id}&date=${p.payment_date || ''}`, '_blank')}
                                title="View Weekly Slip"
                                className="p-1 rounded text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View Payment Advice 360 */}
                            <button
                              type="button"
                              className="p-1 rounded text-text-secondary hover:text-primary transition-colors"
                              title="View Payment Advice 360"
                              onClick={() => setViewingItem(p)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.ra_bill_no}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{p.amount.toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 font-mono text-[11px] flex justify-between">
                <span>UTR Ref</span>
                <span className="font-bold text-primary truncate max-w-[180px]">{p.reference_no}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Payment Advice
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(p)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
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

      {/* View Payment Voucher 360 Modal */}
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
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name} • {viewingItem.ra_bill_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Disbursed Amount</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Date</span> <span className="font-mono">{viewingItem.payment_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Mode</span> <span className="font-medium text-text-primary">{viewingItem.payment_mode}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bank UTR Reference</span> <span className="font-mono text-primary font-bold">{viewingItem.reference_no}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Debited Bank Account</span> <span className="text-text-primary font-medium">{viewingItem.bank_account}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Payment Advice Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Payment Advice
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={CreditCard}
          title={editingItem ? 'Edit Payment Voucher' : 'Record Subcontractor Payment Voucher'}
          subtitle="Record direct RTGS/NEFT settlement against certified subcontractor RA bill."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="payment-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Payment Voucher Details">
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

                <FormField label="Linked RA Bill" required error={errors.ra_bill_id} className="md:col-span-2">
                  <Select
                    options={raBills.filter(b => !form.project_id || String(b.project_id) === String(form.project_id)).map(b => ({ value: String(b.id), label: `${b.ra_bill_no} - ${b.contractor_name} (₹${b.net_certified_amount.toLocaleString('en-IN')})` }))}
                    value={form.ra_bill_id}
                    onChange={(v) => handleFormChange('ra_bill_id', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Settlement Amount & Banking Details">
              <EntityEditModal.Grid>
                <FormField label="Settled Amount (₹)" required>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Payment Mode" required error={errors.payment_mode_id}>
                  <Select
                    options={paymentModes.map(m => ({ value: String(m.id), label: m.payment_mode_name }))}
                    value={form.payment_mode_id}
                    onChange={(v) => handleFormChange('payment_mode_id', v)}
                  />
                </FormField>

                <FormField label="Bank Reference / UTR No" required error={errors.reference_no} className="md:col-span-2">
                  <Input
                    value={form.reference_no}
                    onChange={(e) => handleFormChange('reference_no', e.target.value)}
                    placeholder="UTR-HDFC-918274610"
                  />
                </FormField>

                <FormField label="Debited Bank Account" className="md:col-span-2">
                  <Input
                    value={form.bank_account}
                    onChange={(e) => handleFormChange('bank_account', e.target.value)}
                    placeholder="e.g. HDFC Bank - Current A/C (..4910)"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="payment-form"
            submitLabel={editingItem ? 'Update Voucher' : 'Record Disbursement'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Quick Record Payment / Disburse Modal */}
      <EntityEditModal
        isOpen={isDisburseOpen && Boolean(disburseItem)}
        onClose={() => { setIsDisburseOpen(false); setDisburseItem(null); }}
      >
        <EntityEditModal.Header
          icon={CreditCard}
          title={`Record Payment for ${disburseItem?.contractor_name || 'Subcontractor'}`}
          subtitle={`Voucher: ${disburseItem?.payment_no || disburseItem?.voucher_no} • Amount: ₹${Number(disburseItem?.amount || 0).toLocaleString('en-IN')}`}
          onClose={() => { setIsDisburseOpen(false); setDisburseItem(null); }}
        />
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center justify-between">
            <div>
              <span className="font-bold block">Settlement Payout</span>
              <span>{disburseItem?.contractor_name} • {disburseItem?.project_name}</span>
            </div>
            <span className="text-base font-mono font-extrabold text-emerald-700">
              ₹{Number(disburseItem?.amount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Payment Date" required>
              <Input
                type="date"
                value={disburseForm.payment_date}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, payment_date: e.target.value }))}
              />
            </FormField>

            <FormField label="Payment Mode" required>
              <Select
                options={[
                  { value: 'RTGS / Bank Transfer', label: 'RTGS / Bank Transfer' },
                  { value: 'NEFT Transfer', label: 'NEFT Transfer' },
                  { value: 'UPI / IMPS', label: 'UPI / IMPS Instant' },
                  { value: 'Cheque', label: 'Cheque Payment' },
                  { value: 'Cash Payout', label: 'Site Cash Payout' },
                ]}
                value={disburseForm.payment_mode}
                onChange={(val) => setDisburseForm(prev => ({ ...prev, payment_mode: val }))}
              />
            </FormField>

            <FormField label="Bank Reference / UTR Number" required className="md:col-span-2">
              <Input
                type="text"
                placeholder="e.g. UTR-HDFC-918273645 / Cheque #49102"
                value={disburseForm.reference_no}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, reference_no: e.target.value }))}
              />
            </FormField>

            <FormField label="Disbursing Bank Account" className="md:col-span-2">
              <Input
                type="text"
                placeholder="e.g. HDFC Bank - Project Escrow A/C (*4910)"
                value={disburseForm.bank_account}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, bank_account: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsDisburseOpen(false); setDisburseItem(null); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={handleConfirmDisbursePayment}
              className="font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm & Mark as Paid
            </Button>
          </div>
        </div>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Payment Voucher"
        message={`Are you sure you want to delete "${deleteItem?.payment_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
