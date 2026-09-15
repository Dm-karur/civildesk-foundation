import { useState, useEffect, useMemo } from 'react';
import {
  Scale, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Award
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
  cs_no: '',
  date: '',
  rfq_reference: 'RFQ-2026-031',
  material_scope: 'OPC 53 Grade Cement (500 Bags)',
  l1_vendor: '',
  l1_rate: '382.2',
  l1_total: '191100',
  budget_ceiling: '192500',
  variance_savings: '1400',
  recommended_vendor: '',
  status: 'Approved for PO Award',
  notes: '',
};

export function QuotationComparisonPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [comparisons, setComparisons] = useState([]);
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
      const saved = localStorage.getItem('mock_procurement_QuotationComparisonPage');
      if (saved) {
        setComparisons(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_procurement_QuotationComparisonPage');
    if (comparisons.length > 0 || saved) {
       localStorage.setItem('mock_procurement_QuotationComparisonPage', JSON.stringify(comparisons));
    }
  }, [comparisons]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      cs_no: `CS-2026-01${comparisons.length + 1}`,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      cs_no: item.cs_no || '',
      date: item.date || '',
      rfq_reference: item.rfq_reference || '',
      material_scope: item.material_scope || '',
      l1_vendor: item.l1_vendor || '',
      l1_rate: String(item.l1_rate || '382.2'),
      l1_total: String(item.l1_total || '191100'),
      budget_ceiling: String(item.budget_ceiling || '192500'),
      variance_savings: String(item.variance_savings || '1400'),
      recommended_vendor: item.recommended_vendor || '',
      status: item.status || 'Approved for PO Award',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'l1_total' || field === 'budget_ceiling') {
        const total = Number(field === 'l1_total' ? value : prev.l1_total) || 0;
        const budget = Number(field === 'budget_ceiling' ? value : prev.budget_ceiling) || 0;
        next.variance_savings = String(Math.max(0, budget - total));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.cs_no.trim()) errs.cs_no = 'CS No is required';
    if (!form.l1_vendor.trim()) errs.l1_vendor = 'L1 vendor is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const total = Number(form.l1_total || 0);
      const budget = Number(form.budget_ceiling || 0);

      const newCS = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        cs_no: form.cs_no,
        date: form.date,
        rfq_reference: form.rfq_reference,
        material_scope: form.material_scope,
        bidders_count: 3,
        l1_vendor: form.l1_vendor,
        l1_rate: Number(form.l1_rate || 0),
        l1_total: total,
        l2_vendor: 'Alternative Bidder 2',
        l3_vendor: 'Alternative Bidder 3',
        budget_ceiling: budget,
        variance_savings: Math.max(0, budget - total),
        recommended_vendor: form.recommended_vendor || form.l1_vendor,
        status: form.status,
        approved_by: 'Project Director',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setComparisons(prev => prev.map(c => c.id === editingItem.id ? newCS : c));
        toast.success('Comparative statement updated.');
      } else {
        setComparisons(prev => [newCS, ...prev]);
        toast.success('Commercial comparative statement generated.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save comparative statement.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = (item) => {
    setComparisons(prev => prev.map(c => c.id === item.id ? { ...c, status: 'Approved for PO Award' } : c));
    toast.success(`Comparative Statement ${item.cs_no} approved. L1 awarded.`);
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setComparisons(prev => prev.filter(c => c.id !== deleteItem.id));
    toast.success('Comparative statement removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return comparisons.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !c.status.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(c.cs_no || '').toLowerCase();
        const l1 = String(c.l1_vendor || '').toLowerCase();
        const rfq = String(c.rfq_reference || '').toLowerCase();
        const mat = String(c.material_scope || '').toLowerCase();
        if (!no.includes(s) && !l1.includes(s) && !rfq.includes(s) && !mat.includes(s)) return false;
      }
      return true;
    });
  }, [comparisons, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalSavings = useMemo(() => comparisons.reduce((acc, c) => acc + Number(c.variance_savings || 0), 0), [comparisons]);

  const getStatusVariant = (status) => {
    if (status.includes('Approved')) return 'success';
    if (status.includes('Pending')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Comparative Statement (CS)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Commercial Comparative Statements (CS / CST)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Evaluated Statements"
            value={comparisons.length}
            status="primary"
            icon={<Scale className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Budget Savings"
            value={`+₹${totalSavings.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Awarded to L1 Lowest"
            value="100% L1 Match"
            status="neutral"
            icon={<Award className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Evaluation Status"
            value="1 Approved for PO"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
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
                  { value: 'Approved', label: 'Approved for PO Award' },
                  { value: 'Pending', label: 'Pending Management Approval' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search CS no, L1 vendor, material..."
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
              title="Print CS Matrix"
            >
              Print Matrix
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Generate Statement (CS)
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
                  <th className="px-3 py-2 w-28">CS Ref</th>
                  <th className="px-3 py-2">Material Scope & RFQ</th>
                  <th className="px-3 py-2">L1 Recommended Bidder</th>
                  <th className="px-3 py-2 text-right w-28">L1 Total (₹)</th>
                  <th className="px-3 py-2 text-right w-24">Budget Savings</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading comparative statements...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No comparative statements found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {c.cs_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{c.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.material_scope}>
                            {c.material_scope}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            RFQ: {c.rfq_reference} ({c.bidders_count} Bids)
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-emerald-700 text-[12px] truncate" title={c.l1_vendor}>
                            {c.l1_vendor}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Rate: ₹{c.l1_rate} / unit
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(c.l1_total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        +₹{Number(c.variance_savings).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(c.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View CS 360 Matrix"
                            onClick={() => setViewingItem(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {c.status.includes('Pending') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Approve for PO"
                              onClick={() => handleApprove(c)}
                            >
                              <Check className="w-3 h-3 mr-0.5" /> Approve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(c)}
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
          {paged.map((c, idx) => (
            <div key={c.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.cs_no} • {c.date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.material_scope}</h4>
                  <span className="text-[11px] text-emerald-600 font-medium">{c.l1_vendor}</span>
                </div>
                <Badge
                  variant={getStatusVariant(c.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {c.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">L1 Total Bid</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(c.l1_total).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Budget Savings</span>
                  <span className="font-mono font-bold text-emerald-600 text-[12px]">+₹{Number(c.variance_savings).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View Matrix
                </Button>
                {c.status.includes('Pending') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(c)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
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

      {/* View CS 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.cs_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_scope}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border space-y-2">
                <span className="font-bold text-text-primary block text-[11px]">Commercial Bid Evaluation Matrix:</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center p-1.5 bg-emerald-50 rounded border border-emerald-200">
                    <span className="font-bold text-emerald-800">1. {viewingItem.l1_vendor} (L1 Lowest)</span>
                    <span className="font-bold text-emerald-700">₹{Number(viewingItem.l1_total).toLocaleString('en-IN')}</span>
                  </div>
                  {viewingItem.l2_vendor && (
                    <div className="flex justify-between items-center p-1.5 bg-surface rounded border border-border">
                      <span className="text-text-secondary">2. {viewingItem.l2_vendor}</span>
                      <span className="text-text-muted">L2</span>
                    </div>
                  )}
                  {viewingItem.l3_vendor && (
                    <div className="flex justify-between items-center p-1.5 bg-surface rounded border border-border">
                      <span className="text-text-secondary">3. {viewingItem.l3_vendor}</span>
                      <span className="text-text-muted">L3</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved Budget Ceiling</span> <span className="font-mono font-bold text-text-primary text-sm">₹{Number(viewingItem.budget_ceiling).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Budget Savings</span> <span className="font-bold text-emerald-600 font-mono text-sm">+₹{Number(viewingItem.variance_savings).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Evaluation Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved By</span> <span className="text-text-primary">{viewingItem.approved_by}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Evaluation Remarks & Justification:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print CS Statement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit CS Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Scale}
          title={editingItem ? 'Edit Comparative Statement' : 'Generate Comparative Statement (CS)'}
          subtitle="Tabulate received quotes, determine lowest L1 bidder, and recommend for PO award."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="cs-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Evaluation Reference & Scope">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="CS Number" required error={errors.cs_no}>
                  <Input
                    value={form.cs_no}
                    onChange={(e) => handleFormChange('cs_no', e.target.value)}
                    placeholder="CS-2026-015"
                  />
                </FormField>

                <FormField label="Linked RFQ Number">
                  <Input
                    value={form.rfq_reference}
                    onChange={(e) => handleFormChange('rfq_reference', e.target.value)}
                    placeholder="RFQ-2026-031"
                  />
                </FormField>

                <FormField label="Material Scope Name" required className="md:col-span-2">
                  <Input
                    value={form.material_scope}
                    onChange={(e) => handleFormChange('material_scope', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement (500 Bags)"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="L1 Lowest Bidder & Savings">
              <EntityEditModal.Grid>
                <FormField label="L1 Vendor Name" required error={errors.l1_vendor} className="md:col-span-2">
                  <Input
                    value={form.l1_vendor}
                    onChange={(e) => handleFormChange('l1_vendor', e.target.value)}
                    placeholder="e.g. UltraTech Cement Distributors Ltd"
                  />
                </FormField>

                <FormField label="L1 Total Amount (₹)">
                  <Input
                    type="number"
                    value={form.l1_total}
                    onChange={(e) => handleFormChange('l1_total', e.target.value)}
                  />
                </FormField>

                <FormField label="Budget Ceiling (₹)">
                  <Input
                    type="number"
                    value={form.budget_ceiling}
                    onChange={(e) => handleFormChange('budget_ceiling', e.target.value)}
                  />
                </FormField>

                <FormField label="Calculated Savings (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`+₹${Number(form.variance_savings).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Recommendation & Justification" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Technical compliance, delivery lead time advantages..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="cs-form"
            submitLabel={editingItem ? 'Update Statement' : 'Approve & Recommend L1'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Comparative Statement"
        message={`Are you sure you want to delete "${deleteItem?.cs_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
