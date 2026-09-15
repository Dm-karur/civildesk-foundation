import { useState, useEffect, useMemo } from 'react';
import {
  Link2, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Split
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
  allocation_no: '',
  allocation_date: '',
  client_name: '',
  receipt_no: 'RCT-2026-042',
  receipt_amount: '10000000',
  allocated_invoice_no: 'INV-2026-042',
  allocated_amount: '10000000',
  unallocated_balance: '0',
  notes: '',
};

export function ReceiptAllocationsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allocations, setAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ReceiptAllocationsPage');
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
    localStorage.setItem('mock_receivables_ReceiptAllocationsPage', JSON.stringify(allocations));
  }, [allocations]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      allocation_no: `ALC-2026-04${allocations.length + 5}`,
      allocation_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      allocation_no: item.allocation_no || '',
      allocation_date: item.allocation_date || '',
      client_name: item.client_name || '',
      receipt_no: item.receipt_no || '',
      receipt_amount: String(item.receipt_amount || '10000000'),
      allocated_invoice_no: item.allocated_invoice_no || '',
      allocated_amount: String(item.allocated_amount || '10000000'),
      unallocated_balance: String(item.unallocated_balance || '0'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'receipt_amount' || field === 'allocated_amount') {
        const rAmt = Number(field === 'receipt_amount' ? value : prev.receipt_amount) || 0;
        const aAmt = Number(field === 'allocated_amount' ? value : prev.allocated_amount) || 0;
        next.unallocated_balance = String(Math.max(0, rAmt - aAmt));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.allocation_no.trim()) errs.allocation_no = 'Allocation number is required';
    if (!form.allocated_invoice_no.trim()) errs.allocated_invoice_no = 'Target invoice number is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const rAmt = Number(form.receipt_amount || 0);
      const aAmt = Number(form.allocated_amount || 0);
      const unalloc = Math.max(0, rAmt - aAmt);

      const newAlc = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        allocation_no: form.allocation_no,
        allocation_date: form.allocation_date,
        client_name: form.client_name,
        receipt_no: form.receipt_no,
        receipt_amount: rAmt,
        allocated_invoice_no: form.allocated_invoice_no,
        invoice_title: 'Tax Invoice Allocation',
        allocated_amount: aAmt,
        unallocated_balance: unalloc,
        status: unalloc === 0 ? '100% Fully Allocated' : 'Partially Allocated',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setAllocations(prev => prev.map(a => a.id === editingItem.id ? newAlc : a));
        toast.success('Receipt allocation updated.');
      } else {
        setAllocations(prev => [newAlc, ...prev]);
        toast.success('Receipt line-item allocation reconciled.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save allocation.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setAllocations(prev => prev.filter(a => a.id !== deleteItem.id));
    toast.success('Allocation removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return allocations.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(a.allocation_no || '').toLowerCase();
        const rno = String(a.receipt_no || '').toLowerCase();
        const inv = String(a.allocated_invoice_no || '').toLowerCase();
        const cli = String(a.client_name || '').toLowerCase();
        const proj = String(a.project_name || '').toLowerCase();
        if (!no.includes(s) && !rno.includes(s) && !inv.includes(s) && !cli.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [allocations, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalAllocatedSum = useMemo(() => allocations.reduce((acc, a) => acc + Number(a.allocated_amount || 0), 0), [allocations]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Receipt Allocations' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Receipt Line-Item Allocation & Invoice Reconciliation"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Reconciled Allocations"
            value={`₹${(totalAllocatedSum / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<Link2 className="w-4 h-4" />}
          />
          <KpiCard
            label="Matched Tax Invoices"
            value={`${allocations.length} Invoices`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Unallocated Float Balance"
            value="₹0.00 (Zero Float)"
            status="neutral"
            icon={<Split className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Line-Item Reconciled"
            value="100% Matched"
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
                placeholder="Search allocation no, receipt, invoice..."
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
              title="Print Allocation Register"
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
              Allocate Receipt
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
                  <th className="px-3 py-2 w-28">Allocation No</th>
                  <th className="px-3 py-2">Receipt Voucher & Client</th>
                  <th className="px-3 py-2">Target Tax Invoice</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Allocated Amount</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading allocation entries...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No allocation records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {a.allocation_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{a.allocation_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.client_name}>
                            {a.client_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Via {a.receipt_no} • {a.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[11px] font-bold text-primary truncate">
                            {a.allocated_invoice_no}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {a.invoice_title}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(a.allocated_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Allocation 360"
                            onClick={() => setViewingItem(a)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(a)}
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
          {paged.map((a, idx) => (
            <div key={a.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.allocation_no} • {a.allocation_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.client_name}</h4>
                  <span className="text-[11px] text-text-muted">Target: {a.allocated_invoice_no}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(a.allocated_amount / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-primary block">Receipt Ref: {a.receipt_no}</span>
                <span className="text-[11px] text-text-muted font-mono">{a.invoice_title}</span>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View Allocation
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

      {/* View Allocation 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.allocation_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Allocated Amount</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.allocated_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Allocation Date</span> <span className="font-mono">{viewingItem.allocation_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Remittance Receipt</span> <span className="font-mono text-primary font-bold">{viewingItem.receipt_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Tax Invoice</span> <span className="font-mono text-primary font-bold">{viewingItem.allocated_invoice_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Unallocated Balance</span> <span className="font-mono">₹{viewingItem.unallocated_balance}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Reconciliation Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Reconciliation Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Reconciliation Statement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Allocation Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Link2}
          title={editingItem ? 'Edit Receipt Allocation' : 'Reconcile Receipt Line-Item Allocation'}
          subtitle="Match client bank remittance receipt against specific open tax invoice."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="alc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Allocation Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Allocation Entry No" required error={errors.allocation_no}>
                  <Input
                    value={form.allocation_no}
                    onChange={(e) => handleFormChange('allocation_no', e.target.value)}
                    placeholder="ALC-2026-050"
                  />
                </FormField>

                <FormField label="Remittance Receipt Ref">
                  <Input
                    value={form.receipt_no}
                    onChange={(e) => handleFormChange('receipt_no', e.target.value)}
                    placeholder="RCT-2026-042"
                  />
                </FormField>

                <FormField label="Target Tax Invoice No" required error={errors.allocated_invoice_no}>
                  <Input
                    value={form.allocated_invoice_no}
                    onChange={(e) => handleFormChange('allocated_invoice_no', e.target.value)}
                    placeholder="INV-2026-042"
                  />
                </FormField>

                <FormField label="Allocated Amount (₹)" required>
                  <Input
                    type="number"
                    value={form.allocated_amount}
                    onChange={(e) => handleFormChange('allocated_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Client Name" className="md:col-span-2">
                  <Input
                    value={form.client_name}
                    onChange={(e) => handleFormChange('client_name', e.target.value)}
                    placeholder="e.g. Metro Infrastructure & Realty Corp Ltd"
                  />
                </FormField>

                <FormField label="Allocation Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Full settlement of RA Bill 3, TDS deduction confirmation..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="alc-form"
            submitLabel={editingItem ? 'Update Allocation' : 'Reconcile Allocation'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Allocation"
        message={`Are you sure you want to delete "${deleteItem?.allocation_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
