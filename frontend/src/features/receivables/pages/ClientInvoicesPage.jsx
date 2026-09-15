import { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, Calculator
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
  client_name: '',
  billing_type: 'RA Progress Bill',
  taxable_amount: '10000000',
  gst_amount: '1800000',
  gross_invoice_amount: '11800000',
  tds_amount: '200000',
  retention_deduction: '500000',
  net_receivable: '11100000',
  notes: '',
};

export function ClientInvoicesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ClientInvoicesPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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

  
  useEffect(() => {
    localStorage.setItem('mock_receivables_ClientInvoicesPage', JSON.stringify(invoices));
  }, [invoices]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      invoice_no: `INV-2026-04${invoices.length + 5}`,
      invoice_date: today,
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
      client_name: item.client_name || '',
      billing_type: item.billing_type || 'RA Progress Bill',
      taxable_amount: String(item.taxable_amount || '10000000'),
      gst_amount: String(item.gst_amount || '1800000'),
      gross_invoice_amount: String(item.gross_invoice_amount || '11800000'),
      tds_amount: String(item.tds_amount || '200000'),
      retention_deduction: String(item.retention_deduction || '500000'),
      net_receivable: String(item.net_receivable || '11100000'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'taxable_amount') {
        const tax = Number(value) || 0;
        const gst = tax * 0.18;
        const gross = tax + gst;
        const tds = tax * 0.02;
        const ret = tax * 0.05;
        next.gst_amount = String(gst);
        next.gross_invoice_amount = String(gross);
        next.tds_amount = String(tds);
        next.retention_deduction = String(ret);
        next.net_receivable = String(gross - tds - ret);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.invoice_no.trim()) errs.invoice_no = 'Invoice number is required';
    if (!form.client_name.trim()) errs.client_name = 'Client name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const tax = Number(form.taxable_amount || 0);
      const gst = Number(form.gst_amount || 0);
      const gross = tax + gst;
      const tds = Number(form.tds_amount || 0);
      const ret = Number(form.retention_deduction || 0);
      const net = gross - tds - ret;

      const newInv = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        invoice_no: form.invoice_no,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        client_name: form.client_name,
        billing_type: form.billing_type,
        taxable_amount: tax,
        gst_amount: gst,
        gross_invoice_amount: gross,
        tds_amount: tds,
        retention_deduction: ret,
        net_receivable: net,
        amount_received: editingItem?.amount_received || 0,
        balance_due: net - (editingItem?.amount_received || 0),
        status: editingItem?.status || 'Issued (Pending Payment)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setInvoices(prev => prev.map(i => i.id === editingItem.id ? newInv : i));
        toast.success('Tax invoice updated.');
      } else {
        setInvoices(prev => [newInv, ...prev]);
        toast.success('GST Tax Invoice generated and issued.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save tax invoice.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setInvoices(prev => prev.filter(i => i.id !== deleteItem.id));
    toast.success('Tax invoice removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return invoices.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !i.status.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(i.invoice_no || '').toLowerCase();
        const cli = String(i.client_name || '').toLowerCase();
        const typ = String(i.billing_type || '').toLowerCase();
        const proj = String(i.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !typ.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [invoices, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalGrossInvoiced = useMemo(() => invoices.reduce((acc, i) => acc + Number(i.gross_invoice_amount || 0), 0), [invoices]);
  const totalCollections = useMemo(() => invoices.reduce((acc, i) => acc + Number(i.amount_received || 0), 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((acc, i) => acc + Number(i.balance_due || 0), 0), [invoices]);

  const getStatusVariant = (st) => {
    if (st.includes('Fully Settled')) return 'success';
    if (st.includes('Partially')) return 'info';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Client Tax Invoices' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Tax Invoices Master & GST Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Gross Invoiced"
            value={`₹${(totalGrossInvoiced / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Collected to Date"
            value={`₹${(totalCollections / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Outstanding Balance"
            value={`₹${(totalOutstanding / 10000000).toFixed(2)} Cr`}
            status="warning"
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="GST & TDS Reconciliation"
            value="100% Compliant"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Fully Settled', label: 'Fully Settled' },
                  { value: 'Partially', label: 'Partially Paid' },
                  { value: 'Issued', label: 'Issued (Pending)' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-60">
              <SearchField
                placeholder="Search invoice no, client, type..."
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
              title="Print Tax Invoice Register"
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
              Raise Tax Invoice
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
                  <th className="px-3 py-2">Billing Type & Client</th>
                  <th className="px-3 py-2 text-right w-28">Taxable Sum</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">GST 18%</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Gross Total</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600">Received</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading tax invoices...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No client invoices found.
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
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{i.invoice_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.billing_type}>
                            {i.billing_type}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {i.client_name} • {i.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(i.taxable_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        ₹{(i.gst_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(i.gross_invoice_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(i.amount_received / 100000).toFixed(2)}L
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
                            title="View GST Tax Invoice 360"
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
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{i.billing_type}</h4>
                  <span className="text-[11px] text-text-muted">{i.client_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(i.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(i.gross_invoice_amount / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Received</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(i.amount_received / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance Due</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(i.balance_due / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(i)}>
                  <Eye className="w-3 h-3 mr-1" /> View GST Invoice
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

      {/* View GST Tax Invoice 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.invoice_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Taxable Basic Value</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.taxable_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST Amount (18%)</span> <span className="font-bold text-text-primary font-mono text-base">₹{(viewingItem.gst_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Invoice Sum</span> <span className="font-mono font-bold text-emerald-600 text-sm">₹{(viewingItem.gross_invoice_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Deduction (2%)</span> <span className="font-mono">-₹{(viewingItem.tds_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Deduction (5%)</span> <span className="font-mono text-amber-600">-₹{(viewingItem.retention_deduction / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Receivable Realized</span> <span className="font-mono font-bold text-emerald-700">₹{(viewingItem.amount_received / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Due Date</span> <span className="font-mono">{viewingItem.due_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Invoice Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Invoice Scope Details:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print GST Tax Invoice
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
          icon={FileText}
          title={editingItem ? 'Edit Tax Invoice' : 'Raise Client GST Tax Invoice'}
          subtitle="Generate tax invoice with automated 18% GST calculation, TDS and retention deductions."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="inv-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Invoice Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Tax Invoice No" required error={errors.invoice_no}>
                  <Input
                    value={form.invoice_no}
                    onChange={(e) => handleFormChange('invoice_no', e.target.value)}
                    placeholder="INV-2026-050"
                  />
                </FormField>

                <FormField label="Billing Scope Type">
                  <Select
                    options={[
                      { value: 'RA Progress Bill', label: 'RA Progress Bill' },
                      { value: 'Milestone Progress Claim', label: 'Milestone Progress Claim' },
                      { value: 'Mobilization Advance Claim', label: 'Mobilization Advance Claim' },
                      { value: 'Material Advance Claim', label: 'Material Advance Claim' },
                    ]}
                    value={form.billing_type}
                    onChange={(v) => handleFormChange('billing_type', v)}
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

                <FormField label="Client Name" required error={errors.client_name}>
                  <Input
                    value={form.client_name}
                    onChange={(e) => handleFormChange('client_name', e.target.value)}
                    placeholder="e.g. Metro Infrastructure & Realty Corp Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Tax Valuation & Deductions">
              <EntityEditModal.Grid>
                <FormField label="Basic Taxable Value (₹)" required>
                  <Input
                    type="number"
                    value={form.taxable_amount}
                    onChange={(e) => handleFormChange('taxable_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Amount (18%)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono"
                    value={`₹${Number(form.gst_amount || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Gross Invoice Total (₹)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono font-bold text-primary"
                    value={`₹${Number(form.gross_invoice_amount || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="TDS Deduction (2%)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono"
                    value={`₹${Number(form.tds_amount || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Retention Deduction (5%)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono text-amber-600"
                    value={`₹${Number(form.retention_deduction || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Net Receivable Amount (₹)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono font-bold text-emerald-600"
                    value={`₹${Number(form.net_receivable || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Invoice Description & Measurement Scope" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Reference joint measurement sheet, structural column casting..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="inv-form"
            submitLabel={editingItem ? 'Update Invoice' : 'Raise Invoice'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Tax Invoice"
        message={`Are you sure you want to delete "${deleteItem?.invoice_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
