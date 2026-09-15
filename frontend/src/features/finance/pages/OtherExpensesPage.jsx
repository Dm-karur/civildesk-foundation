import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Tag
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
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  voucher_no: '',
  expense_date: '',
  category: 'Material Quality Testing Lab Fees',
  payee_name: '',
  description: '',
  amount: '50000',
  payment_mode: 'Company Bank Transfer',
  notes: '',
};

export function OtherExpensesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_finance_OtherExpensesPage');
      if (saved) {
        setExpenses(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_finance_OtherExpensesPage');
    if (expenses.length > 0 || saved) {
       localStorage.setItem('mock_finance_OtherExpensesPage', JSON.stringify(expenses));
    }
  }, [expenses]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      voucher_no: `EXP-SITE-2026-09${expenses.length + 2}`,
      expense_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      voucher_no: item.voucher_no || '',
      expense_date: item.expense_date || '',
      category: item.category || 'Material Quality Testing Lab Fees',
      payee_name: item.payee_name || '',
      description: item.description || '',
      amount: String(item.amount || '50000'),
      payment_mode: item.payment_mode || 'Company Bank Transfer',
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
    if (!form.voucher_no.trim()) errs.voucher_no = 'Voucher number is required';
    if (!form.payee_name.trim()) errs.payee_name = 'Payee / Vendor name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const amt = Number(form.amount || 0);

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        voucher_no: form.voucher_no,
        expense_date: form.expense_date,
        category: form.category,
        payee_name: form.payee_name,
        description: form.description,
        amount: amt,
        payment_mode: form.payment_mode,
        approved_by: 'Er. Suresh Babu (Project Director)',
        status: 'Approved & Settled',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setExpenses(prev => prev.map(e => e.id === editingItem.id ? newItem : e));
        toast.success('Expense voucher updated.');
      } else {
        setExpenses(prev => [newItem, ...prev]);
        toast.success('Site overhead expense voucher recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save expense voucher.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setExpenses(prev => prev.filter(e => e.id !== deleteItem.id));
    toast.success('Expense voucher removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (selectedProjectId !== 'all' && String(e.project_id) !== String(selectedProjectId)) return false;
      if (categoryFilter !== 'all' && !e.category.includes(categoryFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(e.voucher_no || '').toLowerCase();
        const pay = String(e.payee_name || '').toLowerCase();
        const cat = String(e.category || '').toLowerCase();
        const proj = String(e.project_name || '').toLowerCase();
        if (!no.includes(str) && !pay.includes(str) && !cat.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [expenses, selectedProjectId, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalOtherExpenses = useMemo(() => expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0), [expenses]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Site Overheads & Other Expenses' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Overheads, Petty Cash, Testing & Administrative Expenses"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Overheads Incurred"
            value={`₹${(totalOtherExpenses / 100000).toFixed(2)}L`}
            status="primary"
            icon={<Receipt className="w-4 h-4" />}
          />
          <KpiCard
            label="Settled Expense Vouchers"
            value={`${expenses.length} Vouchers`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Petty Cash & Imprest"
            value="100% Reconciled"
            status="neutral"
            icon={<Tag className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Management Approval Audit"
            value="100% Authorized"
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'Testing', label: 'Quality Testing' },
                  { value: 'Safety', label: 'Safety & PPE' },
                  { value: 'Electricity', label: 'Utilities & Power' },
                  { value: 'Petty', label: 'Petty Cash' },
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search voucher, payee, item..."
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
              title="Print Expense Register"
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
              Record Expense
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
                  <th className="px-3 py-2 w-28">Voucher No</th>
                  <th className="px-3 py-2">Category & Payee</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Amount Paid</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Payment Mode</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading expense records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {e.voucher_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{e.expense_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={e.category}>
                            {e.category}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {e.payee_name} • {e.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{e.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-[11px] text-text-secondary">
                        {e.payment_mode}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Settled
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Voucher 360"
                            onClick={() => setViewingItem(e)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(e)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
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
          {paged.map((e, idx) => (
            <div key={e.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{e.voucher_no} • {e.expense_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{e.category}</h4>
                  <span className="text-[11px] text-text-muted">{e.payee_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{e.amount.toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(e)}>
                  <Eye className="w-3 h-3 mr-1" /> View Voucher
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

      {/* View Expense 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.voucher_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.payee_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Settled Amount</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Expense Date</span> <span className="font-mono">{viewingItem.expense_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Method</span> <span className="font-medium">{viewingItem.payment_mode}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Authorized By</span> <span className="text-emerald-700 font-medium">{viewingItem.approved_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Expense Category</span> <span className="text-text-primary font-medium">{viewingItem.category}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Expense Purpose</span> <span className="text-text-secondary">{viewingItem.description}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Expense Voucher
              </Button>
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
          title={editingItem ? 'Edit Expense Voucher' : 'Record Overhead Expense'}
          subtitle="Record site overhead expenses, testing charges, safety PPE and utility bills."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="exp-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Expense Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Voucher No" required error={errors.voucher_no}>
                  <Input
                    value={form.voucher_no}
                    onChange={(e) => handleFormChange('voucher_no', e.target.value)}
                    placeholder="EXP-SITE-2026-095"
                  />
                </FormField>

                <FormField label="Expense Category">
                  <Select
                    options={[
                      { value: 'Material Quality Testing Lab Fees', label: 'Material Quality Testing Lab Fees' },
                      { value: 'Safety PPE & Site Signages', label: 'Safety PPE & Site Signages' },
                      { value: 'Site Electricity & Temporary Water', label: 'Site Electricity & Temporary Water' },
                      { value: 'Site Office Petty Cash', label: 'Site Office Petty Cash' },
                      { value: 'Travel, Fuel & Site Conveyance', label: 'Travel, Fuel & Site Conveyance' },
                    ]}
                    value={form.category}
                    onChange={(v) => handleFormChange('category', v)}
                  />
                </FormField>

                <FormField label="Payee / Beneficiary Name" required error={errors.payee_name}>
                  <Input
                    value={form.payee_name}
                    onChange={(e) => handleFormChange('payee_name', e.target.value)}
                    placeholder="e.g. NABL Certified Testing Laboratories"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Amount & Payment Mode">
              <EntityEditModal.Grid>
                <FormField label="Expense Amount (₹)" required>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Payment Mode">
                  <Select
                    options={[
                      { value: 'Company Bank Transfer', label: 'Company Bank Transfer' },
                      { value: 'Site Petty Cash Imprest', label: 'Site Petty Cash Imprest' },
                      { value: 'Corporate Credit Card', label: 'Corporate Credit Card' },
                    ]}
                    value={form.payment_mode}
                    onChange={(v) => handleFormChange('payment_mode', v)}
                  />
                </FormField>

                <FormField label="Expense Purpose / Description" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Concrete cube compressive strength testing, 28-day report..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="exp-form"
            submitLabel={editingItem ? 'Update Voucher' : 'Record Expense'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Expense Record"
        message={`Are you sure you want to delete "${deleteItem?.voucher_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
