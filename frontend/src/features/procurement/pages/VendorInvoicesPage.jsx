import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, CheckCircle2, Clock, IndianRupee, FileCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers, Printer
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
  invoice_no: '',
  invoice_date: '',
  due_date: '',
  po_reference: 'PO-2026-088',
  grn_reference: 'GRN-2026-081',
  supplier_name: '',
  supplier_gstin: '',
  material_name: '',
  taxable_amount: '100000',
  gst_amount: '18000',
  tds_deduction: '2000',
  net_payable: '116000',
  three_way_match: 'Matched (PO + GRN + Invoice)',
  status: 'Pending Finance Clearance',
  notes: '',
};

export function VendorInvoicesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
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
      const saved = localStorage.getItem('mock_procurement_VendorInvoicesPage');
      if (saved) {
        setInvoices(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_procurement_VendorInvoicesPage');
    if (invoices.length > 0 || saved) {
       localStorage.setItem('mock_procurement_VendorInvoicesPage', JSON.stringify(invoices));
    }
  }, [invoices]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      invoice_no: `INV-2026-${100 + invoices.length}`,
      invoice_date: today,
      due_date: defaultDue,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      invoice_no: item.invoice_no || '',
      invoice_date: item.invoice_date || '',
      due_date: item.due_date || '',
      po_reference: item.po_reference || '',
      grn_reference: item.grn_reference || '',
      supplier_name: item.supplier_name || '',
      supplier_gstin: item.supplier_gstin || '',
      material_name: item.material_name || '',
      taxable_amount: String(item.taxable_amount || '100000'),
      gst_amount: String(item.gst_amount || '18000'),
      tds_deduction: String(item.tds_deduction || '2000'),
      net_payable: String(item.net_payable || '116000'),
      three_way_match: item.three_way_match || 'Matched (PO + GRN + Invoice)',
      status: item.status || 'Pending Finance Clearance',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'taxable_amount' || field === 'gst_amount' || field === 'tds_deduction') {
        const taxable = Number(field === 'taxable_amount' ? value : prev.taxable_amount) || 0;
        const gst = Number(field === 'gst_amount' ? value : prev.gst_amount) || 0;
        const tds = Number(field === 'tds_deduction' ? value : prev.tds_deduction) || 0;
        next.net_payable = String(taxable + gst - tds);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.invoice_no.trim()) errs.invoice_no = 'Invoice No is required';
    if (!form.supplier_name.trim()) errs.supplier_name = 'Supplier is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const taxable = Number(form.taxable_amount || 0);
      const gst = Number(form.gst_amount || 0);
      const tds = Number(form.tds_deduction || 0);

      const newInv = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        invoice_no: form.invoice_no,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        po_reference: form.po_reference,
        grn_reference: form.grn_reference,
        supplier_name: form.supplier_name,
        supplier_gstin: form.supplier_gstin,
        material_name: form.material_name,
        taxable_amount: taxable,
        gst_amount: gst,
        tds_deduction: tds,
        net_payable: Number(form.net_payable || (taxable + gst - tds)),
        three_way_match: form.three_way_match,
        status: form.status,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setInvoices(prev => prev.map(i => i.id === editingItem.id ? newInv : i));
        toast.success('Vendor invoice updated.');
      } else {
        setInvoices(prev => [newInv, ...prev]);
        toast.success('Vendor invoice logged with 3-way match.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save vendor invoice.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setInvoices(prev => prev.filter(i => i.id !== deleteItem.id));
    toast.success('Invoice removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return invoices.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !i.status.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(i.invoice_no || '').toLowerCase();
        const sup = String(i.supplier_name || '').toLowerCase();
        const po = String(i.po_reference || '').toLowerCase();
        const grn = String(i.grn_reference || '').toLowerCase();
        if (!no.includes(s) && !sup.includes(s) && !po.includes(s) && !grn.includes(s)) return false;
      }
      return true;
    });
  }, [invoices, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalPayable = useMemo(() => invoices.reduce((acc, i) => acc + Number(i.net_payable || 0), 0), [invoices]);

  const getStatusVariant = (status) => {
    if (status.includes('Paid')) return 'neutral';
    if (status.includes('Approved')) return 'success';
    if (status.includes('Pending')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Vendor Invoices' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Vendor Invoices & 3-Way Matching (PO-GRN-Invoice)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Vendor Invoices"
            value={invoices.length}
            status="primary"
            icon={<Receipt className="w-4 h-4" />}
          />
          <KpiCard
            label="Net Invoiced Amount"
            value={`₹${totalPayable.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="3-Way Match Verification"
            value="100% Matched"
            status="neutral"
            icon={<FileCheck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="GST ITC Claimable"
            value="100% Eligible"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved for Payout' },
                  { value: 'Pending', label: 'Pending Finance Clearance' },
                  { value: 'Paid', label: 'Paid & Settled' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search invoice no, supplier, PO, GRN..."
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
              title="Print Invoice Register"
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
              Process Vendor Invoice
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
                  <th className="px-3 py-2 w-28">Invoice No</th>
                  <th className="px-3 py-2">Supplier Vendor</th>
                  <th className="px-3 py-2">PO & GRN Matches</th>
                  <th className="px-3 py-2 text-right w-24">Taxable</th>
                  <th className="px-3 py-2 text-right w-24">GST Tax</th>
                  <th className="px-3 py-2 text-right w-28">Net Payable (₹)</th>
                  <th className="px-3 py-2 text-center w-32">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading vendor invoices...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No vendor invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((i, idx) => (
                    <tr key={i.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {i.invoice_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">Due: {i.due_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.supplier_name}>
                            {i.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            GSTIN: {i.supplier_gstin}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[11px] font-semibold text-text-primary">
                            {i.po_reference} ➔ {i.grn_reference}
                          </span>
                          <span className="text-[10px] text-emerald-600 truncate">
                            ✓ {i.three_way_match}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{Number(i.taxable_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{Number(i.gst_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(i.net_payable).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(i.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {i.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Invoice 360"
                            onClick={() => setViewingItem(i)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(i)}
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
          {paged.map((i, idx) => (
            <div key={i.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{i.invoice_no} • {i.invoice_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{i.supplier_name}</h4>
                  <span className="text-[11px] text-text-muted">{i.po_reference} • {i.grn_reference}</span>
                </div>
                <Badge
                  variant={getStatusVariant(i.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {i.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Payment Due</span>
                  <span className="font-mono text-[11px] text-text-primary">{i.due_date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Net Payable</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(i.net_payable).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(i)}>
                  <Eye className="w-3 h-3 mr-1" /> View Invoice
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

      {/* View Invoice 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.invoice_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.supplier_name} • {viewingItem.invoice_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Taxable Amount</span> <span className="font-mono">₹{Number(viewingItem.taxable_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST Amount</span> <span className="font-mono text-emerald-600">+₹{Number(viewingItem.gst_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS / Deductions</span> <span className="font-mono text-red-600">-₹{Number(viewingItem.tds_deduction).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Payout</span> <span className="font-bold text-primary font-mono text-base">₹{Number(viewingItem.net_payable).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked PO Reference</span> <span className="font-mono">{viewingItem.po_reference}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked GRN Receipt</span> <span className="font-mono">{viewingItem.grn_reference}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Due Date</span> <span className="font-mono font-bold text-text-primary">{viewingItem.due_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Invoice Matching Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Tax Voucher
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Invoice Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Receipt}
          title={editingItem ? 'Edit Vendor Invoice' : 'Process Vendor Tax Invoice'}
          subtitle="Match vendor bill against PO and GRN, verify GST input credit, and queue for payout."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="invoice-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Invoice & 3-Way Matching">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Vendor Invoice Number" required error={errors.invoice_no}>
                  <Input
                    value={form.invoice_no}
                    onChange={(e) => handleFormChange('invoice_no', e.target.value)}
                    placeholder="INV-2026-445"
                  />
                </FormField>

                <FormField label="Linked PO Ref">
                  <Input
                    value={form.po_reference}
                    onChange={(e) => handleFormChange('po_reference', e.target.value)}
                    placeholder="PO-2026-088"
                  />
                </FormField>

                <FormField label="Linked GRN Ref">
                  <Input
                    value={form.grn_reference}
                    onChange={(e) => handleFormChange('grn_reference', e.target.value)}
                    placeholder="GRN-2026-081"
                  />
                </FormField>

                <FormField label="Supplier Vendor" required error={errors.supplier_name} className="md:col-span-2">
                  <Input
                    value={form.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                    placeholder="e.g. UltraTech Cement Distributors Ltd"
                  />
                </FormField>

                <FormField label="Invoice Date">
                  <Input
                    type="date"
                    value={form.invoice_date}
                    onChange={(e) => handleFormChange('invoice_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Payment Due Date">
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => handleFormChange('due_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Tax Billing & Payout Amounts">
              <EntityEditModal.Grid>
                <FormField label="Taxable Base Amount (₹)">
                  <Input
                    type="number"
                    value={form.taxable_amount}
                    onChange={(e) => handleFormChange('taxable_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Tax Amount (₹)">
                  <Input
                    type="number"
                    value={form.gst_amount}
                    onChange={(e) => handleFormChange('gst_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="TDS / Withholding Deductions (₹)">
                  <Input
                    type="number"
                    value={form.tds_deduction}
                    onChange={(e) => handleFormChange('tds_deduction', e.target.value)}
                  />
                </FormField>

                <FormField label="Net Payable Amount (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-primary bg-surface-muted"
                    value={`₹${Number(form.net_payable).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Verification Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="E-way bill number, weighbridge receipt verification..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="invoice-form"
            submitLabel={editingItem ? 'Update Invoice' : 'Submit for Payment'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Vendor Invoice"
        message={`Are you sure you want to delete "${deleteItem?.invoice_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
