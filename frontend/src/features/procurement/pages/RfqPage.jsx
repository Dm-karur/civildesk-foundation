import { useState, useEffect, useMemo } from 'react';
import {
  Send, CheckCircle2, Clock, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, Users
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
  rfq_no: '',
  rfq_date: '',
  submission_deadline: '',
  pr_reference: 'PR-2026-041',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  required_qty: '100',
  uom: 'Bags',
  invited_vendors: 'UltraTech, Dalmia Bharat, Ramco Cements',
  status: 'Enquiry Floated (Awaiting Bids)',
  notes: '',
};

export function RfqPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [rfqs, setRfqs] = useState([]);
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
      const saved = localStorage.getItem('mock_procurement_RfqPage');
      if (saved) {
        setRfqs(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_procurement_RfqPage');
    if (rfqs.length > 0 || saved) {
       localStorage.setItem('mock_procurement_RfqPage', JSON.stringify(rfqs));
    }
  }, [rfqs]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      rfq_no: `RFQ-2026-03${rfqs.length + 1}`,
      rfq_date: today,
      submission_deadline: defaultDeadline,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      rfq_no: item.rfq_no || '',
      rfq_date: item.rfq_date || '',
      submission_deadline: item.submission_deadline || '',
      pr_reference: item.pr_reference || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      required_qty: String(item.required_qty || '100'),
      uom: item.uom || 'Nos',
      invited_vendors: item.invited_vendors || '',
      status: item.status || 'Enquiry Floated (Awaiting Bids)',
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
    if (!form.rfq_no.trim()) errs.rfq_no = 'RFQ No is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const count = form.invited_vendors.split(',').filter(Boolean).length;

      const newRfq = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        rfq_no: form.rfq_no,
        rfq_date: form.rfq_date,
        submission_deadline: form.submission_deadline,
        pr_reference: form.pr_reference,
        material_code: form.material_code,
        material_name: form.material_name,
        required_qty: Number(form.required_qty || 0),
        uom: form.uom,
        invited_vendors: form.invited_vendors,
        vendor_count: count,
        status: form.status,
        created_by: 'Procurement Cell',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setRfqs(prev => prev.map(r => r.id === editingItem.id ? newRfq : r));
        toast.success('RFQ enquiry updated.');
      } else {
        setRfqs(prev => [newRfq, ...prev]);
        toast.success('RFQ floated to shortlisted vendors.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save RFQ enquiry.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setRfqs(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('RFQ enquiry removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return rfqs.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !r.status.includes(statusFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = String(r.rfq_no || '').toLowerCase();
        const mat = String(r.material_name || '').toLowerCase();
        const pr = String(r.pr_reference || '').toLowerCase();
        const vends = String(r.invited_vendors || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !pr.includes(q) && !vends.includes(q)) return false;
      }
      return true;
    });
  }, [rfqs, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (status) => {
    if (status.includes('Received')) return 'success';
    if (status.includes('Floated') || status.includes('Awaiting')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Request for Quotation (RFQ)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Request for Quotation (RFQ) & Enquiry Floating"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Floated RFQs"
            value={rfqs.length}
            status="primary"
            icon={<Send className="w-4 h-4" />}
          />
          <KpiCard
            label="Bids Received Ready"
            value="1 RFQ"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Awaiting Vendor Quotes"
            value="1 RFQ"
            status="info"
            icon={<Clock className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Invited Suppliers"
            value="6 Suppliers"
            status="neutral"
            icon={<Users className="w-4 h-4 text-primary" />}
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
                  { value: 'Floated', label: 'Enquiry Floated' },
                  { value: 'Received', label: 'Bids Received' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search RFQ, material, PR ref, vendor..."
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
              title="Print RFQ Register"
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
              Float New RFQ
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
                  <th className="px-3 py-2 w-28">RFQ Ref</th>
                  <th className="px-3 py-2">Material Item & Scope</th>
                  <th className="px-3 py-2">Invited Suppliers</th>
                  <th className="px-3 py-2 text-right w-24">Req Qty</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Bid Deadline</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading RFQ enquiries...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No RFQ enquiries found matching criteria.
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
                          {r.rfq_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">PR: {r.pr_reference}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.material_name}>
                            {r.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] text-text-secondary truncate block" title={r.invited_vendors}>
                          {r.invited_vendors}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.required_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {r.submission_deadline}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View RFQ 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.rfq_no} • {r.rfq_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">PR: {r.pr_reference}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Required Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.required_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Bid Deadline</span>
                  <span className="font-mono text-text-primary text-[11px]">{r.submission_deadline}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View RFQ
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

      {/* View RFQ 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.rfq_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Scope Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.required_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bid Submission Deadline</span> <span className="font-bold text-red-600 font-mono text-sm">{viewingItem.submission_deadline}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked PR Number</span> <span className="font-mono text-text-primary">{viewingItem.pr_reference}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Enquiry Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Shortlisted Invited Vendors</span> <span className="text-text-primary font-medium">{viewingItem.invited_vendors}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Enquiry Technical Scope & Terms:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print RFQ Docket
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit RFQ Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Send}
          title={editingItem ? 'Edit RFQ Enquiry' : 'Float New RFQ Enquiry'}
          subtitle="Publish enquiry to shortlisted vendors with submission deadlines and terms."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="rfq-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Enquiry & Project Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="RFQ Number" required error={errors.rfq_no}>
                  <Input
                    value={form.rfq_no}
                    onChange={(e) => handleFormChange('rfq_no', e.target.value)}
                    placeholder="RFQ-2026-035"
                  />
                </FormField>

                <FormField label="Linked PR Reference">
                  <Input
                    value={form.pr_reference}
                    onChange={(e) => handleFormChange('pr_reference', e.target.value)}
                    placeholder="PR-2026-041"
                  />
                </FormField>

                <FormField label="Submission Deadline Date">
                  <Input
                    type="date"
                    value={form.submission_deadline}
                    onChange={(e) => handleFormChange('submission_deadline', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Scope & Invited Vendors">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Required Quantity">
                  <Input
                    type="number"
                    value={form.required_qty}
                    onChange={(e) => handleFormChange('required_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Invited Vendors (Comma-separated)" className="md:col-span-2">
                  <Input
                    value={form.invited_vendors}
                    onChange={(e) => handleFormChange('invited_vendors', e.target.value)}
                    placeholder="e.g. UltraTech, Dalmia Bharat, Ramco Cements"
                  />
                </FormField>

                <FormField label="Technical Specifications & Terms" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Specification requirements, delivery terms, payment terms..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="rfq-form"
            submitLabel={editingItem ? 'Update RFQ' : 'Float RFQ to Vendors'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete RFQ Enquiry"
        message={`Are you sure you want to delete "${deleteItem?.rfq_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
