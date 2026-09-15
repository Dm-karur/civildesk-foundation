import { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, AlertTriangle
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
  debit_note_no: '',
  return_date: '',
  po_reference: 'PO-2026-088',
  grn_reference: 'GRN-2026-081',
  supplier_name: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  return_qty: '20',
  uom: 'Bags',
  unit_rate: '340',
  debit_amount: '6800',
  reason: 'Damaged in transit',
  status: 'Debit Note Issued (Vendor Credit Acknowledged)',
  notes: '',
};

export function ProcurementReturnsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [returns, setReturns] = useState([]);
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

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_procurement_ProcurementReturnsPage');
      if (saved) {
        setReturns(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_procurement_ProcurementReturnsPage');
    if (returns.length > 0 || saved) {
       localStorage.setItem('mock_procurement_ProcurementReturnsPage', JSON.stringify(returns));
    }
  }, [returns]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      debit_note_no: `DN-2026-01${returns.length + 7}`,
      return_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      debit_note_no: item.debit_note_no || '',
      return_date: item.return_date || '',
      po_reference: item.po_reference || '',
      grn_reference: item.grn_reference || '',
      supplier_name: item.supplier_name || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      return_qty: String(item.return_qty || '20'),
      uom: item.uom || 'Nos',
      unit_rate: String(item.unit_rate || '340'),
      debit_amount: String(item.debit_amount || '6800'),
      reason: item.reason || '',
      status: item.status || 'Debit Note Issued',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'return_qty' || field === 'unit_rate') {
        const qty = Number(field === 'return_qty' ? value : prev.return_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.debit_amount = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.debit_note_no.trim()) errs.debit_note_no = 'Debit Note No is required';
    if (!form.supplier_name.trim()) errs.supplier_name = 'Supplier is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const qty = Number(form.return_qty || 0);
      const rate = Number(form.unit_rate || 0);

      const newReturn = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        debit_note_no: form.debit_note_no,
        return_date: form.return_date,
        po_reference: form.po_reference,
        grn_reference: form.grn_reference,
        supplier_name: form.supplier_name,
        material_code: form.material_code,
        material_name: form.material_name,
        return_qty: qty,
        uom: form.uom,
        unit_rate: rate,
        debit_amount: Number(form.debit_amount || qty * rate),
        reason: form.reason,
        status: form.status,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setReturns(prev => prev.map(r => r.id === editingItem.id ? newReturn : r));
        toast.success('Purchase return / Debit note updated.');
      } else {
        setReturns(prev => [newReturn, ...prev]);
        toast.success('Vendor debit note issued and stock adjusted.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save purchase return.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setReturns(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('Debit note removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return returns.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(r.debit_note_no || '').toLowerCase();
        const sup = String(r.supplier_name || '').toLowerCase();
        const po = String(r.po_reference || '').toLowerCase();
        const mat = String(r.material_name || '').toLowerCase();
        const reas = String(r.reason || '').toLowerCase();
        if (!no.includes(s) && !sup.includes(s) && !po.includes(s) && !mat.includes(s) && !reas.includes(s)) return false;
      }
      return true;
    });
  }, [returns, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalDebitValue = useMemo(() => returns.reduce((acc, r) => acc + Number(r.debit_amount || 0), 0), [returns]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Purchase Returns & Debit Notes' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Returns & Vendor Debit Notes"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Debit Notes"
            value={returns.length}
            status="primary"
            icon={<RotateCcw className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Debited Value"
            value={`₹${totalDebitValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Defective Lot Recoveries"
            value="100% Credited"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Vendor Compliance"
            value="Resolved"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search debit note, supplier, PO, reason..."
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
              title="Print Debit Register"
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
              Issue Debit Note
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
                  <th className="px-3 py-2 w-28">Debit Note</th>
                  <th className="px-3 py-2">Supplier & References</th>
                  <th className="px-3 py-2">Material Item & Justification</th>
                  <th className="px-3 py-2 text-right w-24">Return Qty</th>
                  <th className="px-3 py-2 text-right w-28">Debit Value (₹)</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading debit notes...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase returns or debit notes found.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {r.debit_note_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.return_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.supplier_name}>
                            {r.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {r.po_reference} • {r.grn_reference}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate block" title={r.material_name}>
                            {r.material_name}
                          </span>
                          <span className="text-[10px] text-red-600 truncate" title={r.reason}>
                            ⚠ {r.reason}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.return_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-red-600 text-[11px]">
                        -₹{Number(r.debit_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="neutral"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Credit Settled
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Debit Note 360"
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
                  <span className="font-mono text-[10px] font-bold text-red-600 block">{r.debit_note_no} • {r.return_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.supplier_name}</span>
                </div>
                <Badge
                  variant="neutral"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  Credit Note
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Returned Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.return_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Debited Amount</span>
                  <span className="font-mono font-bold text-red-600 text-[12px]">-₹{Number(r.debit_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Note
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

      {/* View Debit Note 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.debit_note_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.supplier_name} • {viewingItem.return_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Material Returned</span> <span className="font-semibold text-text-primary">{viewingItem.material_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Debited Value</span> <span className="font-bold text-red-600 font-mono text-base">-₹{Number(viewingItem.debit_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Returned Quantity</span> <span className="font-mono font-bold text-text-primary">{viewingItem.return_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked PO Reference</span> <span className="font-mono">{viewingItem.po_reference}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked GRN Voucher</span> <span className="font-mono">{viewingItem.grn_reference}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Debit Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Return Reason</span> <span className="text-red-700 font-medium">{viewingItem.reason}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Audit Remarks & Credit Adjustment:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Debit Note
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Return Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={RotateCcw}
          title={editingItem ? 'Edit Debit Note' : 'Issue Vendor Debit Note (Return)'}
          subtitle="Record rejected/damaged delivery returns and debit the vendor's ledger account."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="debit-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Supplier & PO Reference">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Debit Note Ref Number" required error={errors.debit_note_no}>
                  <Input
                    value={form.debit_note_no}
                    onChange={(e) => handleFormChange('debit_note_no', e.target.value)}
                    placeholder="DN-2026-020"
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

                <FormField label="Supplier Name" required error={errors.supplier_name} className="md:col-span-2">
                  <Input
                    value={form.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                    placeholder="e.g. UltraTech Cement Distributors Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Return Quantities & Debit Calculations">
              <EntityEditModal.Grid>
                <FormField label="Material Item">
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                  />
                </FormField>

                <FormField label="Return Quantity">
                  <Input
                    type="number"
                    value={form.return_qty}
                    onChange={(e) => handleFormChange('return_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Billing Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Debit Value (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-red-600 bg-surface-muted"
                    value={`₹${Number(form.debit_amount).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Return Justification" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Moisture ingress, bend rebar bundles, failed lab crush test..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="debit-form"
            submitLabel={editingItem ? 'Update Note' : 'Issue Debit Note'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Debit Note"
        message={`Are you sure you want to delete "${deleteItem?.debit_note_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
