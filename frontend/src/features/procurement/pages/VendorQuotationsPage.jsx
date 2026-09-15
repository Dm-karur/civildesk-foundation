import { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Tag
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
  quotation_no: '',
  quotation_date: '',
  rfq_reference: 'RFQ-2026-031',
  supplier_name: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement (500 Bags)',
  base_rate: '340',
  gst_rate: '28',
  freight_rate: '15',
  landed_rate: '382.2',
  total_bid_value: '191100',
  validity_date: '',
  credit_terms: '30 Days Credit',
  notes: '',
};

export function VendorQuotationsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
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
      const saved = localStorage.getItem('mock_procurement_VendorQuotationsPage');
      if (saved) {
        setQuotes(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_procurement_VendorQuotationsPage');
    if (quotes.length > 0 || saved) {
       localStorage.setItem('mock_procurement_VendorQuotationsPage', JSON.stringify(quotes));
    }
  }, [quotes]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultValidity = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      quotation_no: `QT-VEN-2026-${100 + quotes.length}`,
      quotation_date: today,
      validity_date: defaultValidity,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      quotation_no: item.quotation_no || '',
      quotation_date: item.quotation_date || '',
      rfq_reference: item.rfq_reference || '',
      supplier_name: item.supplier_name || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      base_rate: String(item.base_rate || '340'),
      gst_rate: String(item.gst_rate || '28'),
      freight_rate: String(item.freight_rate || '15'),
      landed_rate: String(item.landed_rate || '382.2'),
      total_bid_value: String(item.total_bid_value || '191100'),
      validity_date: item.validity_date || '',
      credit_terms: item.credit_terms || '30 Days Credit',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'base_rate' || field === 'gst_rate' || field === 'freight_rate') {
        const base = Number(field === 'base_rate' ? value : prev.base_rate) || 0;
        const gst = Number(field === 'gst_rate' ? value : prev.gst_rate) || 0;
        const freight = Number(field === 'freight_rate' ? value : prev.freight_rate) || 0;
        const landed = Number(((base * (1 + gst / 100)) + freight).toFixed(1));
        next.landed_rate = String(landed);
        next.total_bid_value = String(Math.round(landed * 500));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.quotation_no.trim()) errs.quotation_no = 'Quote No is required';
    if (!form.supplier_name.trim()) errs.supplier_name = 'Supplier is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const base = Number(form.base_rate || 0);
      const gst = Number(form.gst_rate || 0);
      const freight = Number(form.freight_rate || 0);
      const landed = Number(((base * (1 + gst / 100)) + freight).toFixed(1));

      const newQuote = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        quotation_no: form.quotation_no,
        quotation_date: form.quotation_date,
        rfq_reference: form.rfq_reference,
        supplier_name: form.supplier_name,
        material_code: form.material_code,
        material_name: form.material_name,
        base_rate: base,
        gst_rate: gst,
        freight_rate: freight,
        landed_rate: landed,
        total_bid_value: Number(form.total_bid_value || Math.round(landed * 500)),
        validity_date: form.validity_date,
        credit_terms: form.credit_terms,
        rank: editingItem?.rank || 'Bid Logged',
        status: 'Evaluated',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setQuotes(prev => prev.map(q => q.id === editingItem.id ? newQuote : q));
        toast.success('Vendor quotation updated.');
      } else {
        setQuotes(prev => [newQuote, ...prev]);
        toast.success('Vendor quotation submitted for evaluation.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save vendor quotation.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setQuotes(prev => prev.filter(q => q.id !== deleteItem.id));
    toast.success('Quotation removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return quotes.filter(q => {
      if (selectedProjectId !== 'all' && String(q.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(q.quotation_no || '').toLowerCase();
        const sup = String(q.supplier_name || '').toLowerCase();
        const rfq = String(q.rfq_reference || '').toLowerCase();
        const mat = String(q.material_name || '').toLowerCase();
        if (!no.includes(s) && !sup.includes(s) && !rfq.includes(s) && !mat.includes(s)) return false;
      }
      return true;
    });
  }, [quotes, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Vendor Quotations' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Vendor Quotation & Bid Submissions"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Received Bids"
            value={quotes.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Lowest L1 Landed Rate"
            value="₹382.2 / Bag"
            status="success"
            icon={<Tag className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Lowest L1 Bid Value"
            value="₹1,91,100"
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Shortlist Status"
            value="1 L1 Recommended"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search quote no, supplier, RFQ..."
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
              title="Print Quote Register"
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
              Log Vendor Quote
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
                  <th className="px-3 py-2 w-28">Quote Ref</th>
                  <th className="px-3 py-2">Supplier Bidder</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">Base Rate</th>
                  <th className="px-3 py-2 text-right w-24">Landed Rate</th>
                  <th className="px-3 py-2 text-right w-28">Total Bid (₹)</th>
                  <th className="px-3 py-2 text-center w-24">Rank</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading vendor quotations...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No vendor quotes found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((q, idx) => (
                    <tr key={q.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {q.quotation_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">RFQ: {q.rfq_reference}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={q.supplier_name}>
                            {q.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Terms: {q.credit_terms}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={q.material_name}>
                          {q.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{q.base_rate}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{q.landed_rate}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(q.total_bid_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={q.rank.includes('L1') ? 'success' : 'neutral'}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {q.rank}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Quote 360"
                            onClick={() => setViewingItem(q)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(q)}
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
          {paged.map((q, idx) => (
            <div key={q.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{q.quotation_no} • {q.quotation_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{q.supplier_name}</h4>
                  <span className="text-[11px] text-text-muted">{q.material_name}</span>
                </div>
                <Badge
                  variant={q.rank.includes('L1') ? 'success' : 'neutral'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {q.rank}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Landed Rate</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{q.landed_rate}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Bid Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(q.total_bid_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(q)}>
                  <Eye className="w-3 h-3 mr-1" /> View Quote
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

      {/* View Quote 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.quotation_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.supplier_name} • {viewingItem.quotation_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Landed Unit Rate</span> <span className="font-bold text-primary font-mono text-sm">₹{viewingItem.landed_rate}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Bid Amount</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.total_bid_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Base Rate & GST</span> <span className="font-mono">₹{viewingItem.base_rate} (+{viewingItem.gst_rate}% GST)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Freight / Unloading</span> <span className="font-mono">₹{viewingItem.freight_rate} / unit</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Commercial Ranking</span> <span className="font-bold text-emerald-600">{viewingItem.rank}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Credit Payment Terms</span> <span className="text-text-primary font-medium">{viewingItem.credit_terms}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Quote Validity</span> <span className="text-text-primary font-mono">Valid until {viewingItem.validity_date}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Vendor Proposal Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Quote Sheet
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Quote Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingItem ? 'Edit Vendor Quotation' : 'Log Vendor Quotation'}
          subtitle="Record supplier price bids, GST tax rates, freight charges, and credit terms."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="quote-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Supplier & RFQ Reference">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Quotation Ref Number" required error={errors.quotation_no}>
                  <Input
                    value={form.quotation_no}
                    onChange={(e) => handleFormChange('quotation_no', e.target.value)}
                    placeholder="QT-2026-088"
                  />
                </FormField>

                <FormField label="Supplier Bidder Name" required error={errors.supplier_name} className="md:col-span-2">
                  <Input
                    value={form.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                    placeholder="e.g. UltraTech Cement Distributors Ltd"
                  />
                </FormField>

                <FormField label="Linked RFQ Number">
                  <Input
                    value={form.rfq_reference}
                    onChange={(e) => handleFormChange('rfq_reference', e.target.value)}
                    placeholder="RFQ-2026-031"
                  />
                </FormField>

                <FormField label="Validity Deadline">
                  <Input
                    type="date"
                    value={form.validity_date}
                    onChange={(e) => handleFormChange('validity_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Pricing & Landed Cost Breakdown">
              <EntityEditModal.Grid>
                <FormField label="Base Rate per Unit (₹)">
                  <Input
                    type="number"
                    value={form.base_rate}
                    onChange={(e) => handleFormChange('base_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Rate (%)">
                  <Select
                    options={[
                      { value: '5', label: '5%' },
                      { value: '12', label: '12%' },
                      { value: '18', label: '18%' },
                      { value: '28', label: '28%' },
                    ]}
                    value={form.gst_rate}
                    onChange={(v) => handleFormChange('gst_rate', v)}
                  />
                </FormField>

                <FormField label="Freight & Delivery (₹/unit)">
                  <Input
                    type="number"
                    value={form.freight_rate}
                    onChange={(e) => handleFormChange('freight_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Landed Rate (₹/unit)">
                  <Input
                    readOnly
                    className="font-mono font-bold bg-surface-muted"
                    value={`₹${form.landed_rate}`}
                  />
                </FormField>

                <FormField label="Credit Payment Terms" className="md:col-span-2">
                  <Input
                    value={form.credit_terms}
                    onChange={(e) => handleFormChange('credit_terms', e.target.value)}
                    placeholder="e.g. 30 Days Credit / Advance against dispatch"
                  />
                </FormField>

                <FormField label="Commercial Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Doorstep delivery, unloading terms, price escalation clauses..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="quote-form"
            submitLabel={editingItem ? 'Update Quote' : 'Submit Quotation'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Quotation"
        message={`Are you sure you want to delete "${deleteItem?.quotation_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
