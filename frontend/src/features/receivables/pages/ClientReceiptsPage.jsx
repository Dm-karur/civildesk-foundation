import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Banknote
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
  receipt_no: '',
  receipt_date: '',
  client_name: '',
  invoice_no: 'INV-2026-042',
  amount_received: '10000000',
  payment_mode: 'RTGS / Online Transfer',
  bank_reference: '',
  credited_account: 'HDFC Bank - Commercial Project Escrow (..4910)',
  tds_deducted_by_client: '200000',
  notes: '',
};

export function ClientReceiptsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [receipts, setReceipts] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ClientReceiptsPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  
  useEffect(() => {
    localStorage.setItem('mock_receivables_ClientReceiptsPage', JSON.stringify(receipts));
  }, [receipts]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      receipt_no: `RCT-2026-04${receipts.length + 5}`,
      receipt_date: today,
      bank_reference: `UTR-HDFC-${Math.floor(100000000 + Math.random() * 900000000)}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      receipt_no: item.receipt_no || '',
      receipt_date: item.receipt_date || '',
      client_name: item.client_name || '',
      invoice_no: item.invoice_no || '',
      amount_received: String(item.amount_received || '10000000'),
      payment_mode: item.payment_mode || 'RTGS / Online Transfer',
      bank_reference: item.bank_reference || '',
      credited_account: item.credited_account || '',
      tds_deducted_by_client: String(item.tds_deducted_by_client || '200000'),
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
    if (!form.receipt_no.trim()) errs.receipt_no = 'Receipt voucher number is required';
    if (!form.bank_reference.trim()) errs.bank_reference = 'Bank UTR reference is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const amt = Number(form.amount_received || 0);

      const newRct = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        receipt_no: form.receipt_no,
        receipt_date: form.receipt_date,
        client_name: form.client_name,
        invoice_no: form.invoice_no,
        amount_received: amt,
        payment_mode: form.payment_mode,
        bank_reference: form.bank_reference,
        credited_account: form.credited_account,
        tds_deducted_by_client: Number(form.tds_deducted_by_client || 0),
        status: 'Credited & Reconciled',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setReceipts(prev => prev.map(r => r.id === editingItem.id ? newRct : r));
        toast.success('Receipt voucher updated.');
      } else {
        setReceipts(prev => [newRct, ...prev]);
        toast.success('Client payment receipt voucher recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save receipt voucher.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setReceipts(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('Receipt voucher removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(r.receipt_no || '').toLowerCase();
        const cli = String(r.client_name || '').toLowerCase();
        const inv = String(r.invoice_no || '').toLowerCase();
        const ref = String(r.bank_reference || '').toLowerCase();
        const proj = String(r.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !inv.includes(s) && !ref.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [receipts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCollections = useMemo(() => receipts.reduce((acc, r) => acc + Number(r.amount_received || 0), 0), [receipts]);
  const totalTDSRealized = useMemo(() => receipts.reduce((acc, r) => acc + Number(r.tds_deducted_by_client || 0), 0), [receipts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Client Receipts' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Collections & Bank Remittance Receipts"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Realized Collections"
            value={`₹${(totalCollections / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Recorded Receipt Vouchers"
            value={`${receipts.length} Vouchers`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="TDS Credits (Form 26AS)"
            value={`₹${(totalTDSRealized / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<CreditCard className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Bank UTR Audit"
            value="100% Reconciled"
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
                placeholder="Search receipt no, UTR, invoice..."
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
              title="Print Receipt Register"
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
              Record Client Receipt
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
                  <th className="px-3 py-2 w-28">Receipt No</th>
                  <th className="px-3 py-2">Client & Linked Invoice</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Received Amount</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">TDS Deducted</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Mode & Bank Ref</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading receipt records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No receipt vouchers found.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {r.receipt_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.receipt_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.client_name}>
                            {r.client_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Against {r.invoice_no} • {r.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(r.amount_received / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        ₹{(r.tds_deducted_by_client / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        <div>{r.payment_mode}</div>
                        <div className="text-primary truncate">{r.bank_reference}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Credited
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Money Receipt 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(r)}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.receipt_no} • {r.receipt_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.client_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.invoice_no}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(r.amount_received / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 font-mono text-[11px] flex justify-between">
                <span>Bank Ref</span>
                <span className="font-bold text-primary truncate max-w-[180px]">{r.bank_reference}</span>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Receipt Voucher
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

      {/* View Money Receipt 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.receipt_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Realized Remittance</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.amount_received / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Receipt Date</span> <span className="font-mono">{viewingItem.receipt_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Mode</span> <span className="font-medium text-text-primary">{viewingItem.payment_mode}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bank UTR Reference</span> <span className="font-mono text-primary font-bold">{viewingItem.bank_reference}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Withheld (2%)</span> <span className="font-mono text-text-muted">₹{(viewingItem.tds_deducted_by_client / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked Invoice Ref</span> <span className="font-mono text-primary font-medium">{viewingItem.invoice_no}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Credited Bank Account</span> <span className="text-text-primary font-medium">{viewingItem.credited_account}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Remittance Advice Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Money Receipt
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Receipt Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={CreditCard}
          title={editingItem ? 'Edit Receipt Voucher' : 'Record Client Payment Receipt'}
          subtitle="Record client remittance, bank UTR reference, TDS credits, and credit project bank account."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="rct-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Receipt Voucher Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Receipt Voucher No" required error={errors.receipt_no}>
                  <Input
                    value={form.receipt_no}
                    onChange={(e) => handleFormChange('receipt_no', e.target.value)}
                    placeholder="RCT-2026-050"
                  />
                </FormField>

                <FormField label="Linked Invoice No">
                  <Input
                    value={form.invoice_no}
                    onChange={(e) => handleFormChange('invoice_no', e.target.value)}
                    placeholder="INV-2026-042"
                  />
                </FormField>

                <FormField label="Client Name" className="md:col-span-2">
                  <Input
                    value={form.client_name}
                    onChange={(e) => handleFormChange('client_name', e.target.value)}
                    placeholder="e.g. Metro Infrastructure & Realty Corp Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Remittance & Banking Details">
              <EntityEditModal.Grid>
                <FormField label="Received Amount (₹)" required>
                  <Input
                    type="number"
                    value={form.amount_received}
                    onChange={(e) => handleFormChange('amount_received', e.target.value)}
                  />
                </FormField>

                <FormField label="Payment Mode">
                  <Select
                    options={[
                      { value: 'RTGS / Online Transfer', label: 'RTGS / Online Transfer' },
                      { value: 'NEFT Online Transfer', label: 'NEFT Online Transfer' },
                      { value: 'Treasury RBI Transfer', label: 'Treasury RBI Transfer' },
                      { value: 'Cheque Payment', label: 'Cheque Payment' },
                    ]}
                    value={form.payment_mode}
                    onChange={(v) => handleFormChange('payment_mode', v)}
                  />
                </FormField>

                <FormField label="Bank Reference / UTR No" required error={errors.bank_reference} className="md:col-span-2">
                  <Input
                    value={form.bank_reference}
                    onChange={(e) => handleFormChange('bank_reference', e.target.value)}
                    placeholder="UTR-HDFC-991823719"
                  />
                </FormField>

                <FormField label="Credited Bank Account" className="md:col-span-2">
                  <Input
                    value={form.credited_account}
                    onChange={(e) => handleFormChange('credited_account', e.target.value)}
                    placeholder="e.g. HDFC Bank - Commercial Project Escrow (..4910)"
                  />
                </FormField>

                <FormField label="Remittance Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Bank advice remarks, client payment voucher reference..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="rct-form"
            submitLabel={editingItem ? 'Update Voucher' : 'Record Receipt'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Receipt Voucher"
        message={`Are you sure you want to delete "${deleteItem?.receipt_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
