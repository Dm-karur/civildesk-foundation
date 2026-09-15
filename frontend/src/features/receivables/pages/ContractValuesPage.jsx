import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, CheckCircle2, IndianRupee, Clock, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, FileText
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
  variation_no: '',
  contract_no: 'CTR-2026-001',
  variation_date: '',
  title: '',
  original_contract_value: '285000000',
  variation_amount: '10000000',
  price_escalation_amount: '0',
  revised_contract_value: '295000000',
  approval_ref: '',
  status: 'In Client Review',
  notes: '',
};

export function ContractValuesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [variations, setVariations] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ContractValuesPage');
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
    localStorage.setItem('mock_receivables_ContractValuesPage', JSON.stringify(variations));
  }, [variations]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      variation_no: `VO-2026-00${variations.length + 1}`,
      variation_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      variation_no: item.variation_no || '',
      contract_no: item.contract_no || '',
      variation_date: item.variation_date || '',
      title: item.title || '',
      original_contract_value: String(item.original_contract_value || '285000000'),
      variation_amount: String(item.variation_amount || '10000000'),
      price_escalation_amount: String(item.price_escalation_amount || '0'),
      revised_contract_value: String(item.revised_contract_value || '295000000'),
      approval_ref: item.approval_ref || '',
      status: item.status || 'In Client Review',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'original_contract_value' || field === 'variation_amount' || field === 'price_escalation_amount') {
        const orig = Number(field === 'original_contract_value' ? value : prev.original_contract_value) || 0;
        const varAmt = Number(field === 'variation_amount' ? value : prev.variation_amount) || 0;
        const escAmt = Number(field === 'price_escalation_amount' ? value : prev.price_escalation_amount) || 0;
        next.revised_contract_value = String(orig + varAmt + escAmt);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.variation_no.trim()) errs.variation_no = 'Variation Order No is required';
    if (!form.title.trim()) errs.title = 'Variation title is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const orig = Number(form.original_contract_value || 0);
      const varAmt = Number(form.variation_amount || 0);
      const escAmt = Number(form.price_escalation_amount || 0);

      const newVO = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        variation_no: form.variation_no,
        contract_no: form.contract_no,
        variation_date: form.variation_date,
        title: form.title,
        original_contract_value: orig,
        variation_amount: varAmt,
        price_escalation_amount: escAmt,
        revised_contract_value: orig + varAmt + escAmt,
        approval_ref: form.approval_ref,
        status: form.status,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setVariations(prev => prev.map(v => v.id === editingItem.id ? newVO : v));
        toast.success('Contract variation updated.');
      } else {
        setVariations(prev => [newVO, ...prev]);
        toast.success('Variation order (VO) logged.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save variation order.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setVariations(prev => prev.filter(v => v.id !== deleteItem.id));
    toast.success('Variation order removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return variations.filter(v => {
      if (selectedProjectId !== 'all' && String(v.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(v.variation_no || '').toLowerCase();
        const tit = String(v.title || '').toLowerCase();
        const ref = String(v.approval_ref || '').toLowerCase();
        const proj = String(v.project_name || '').toLowerCase();
        if (!no.includes(s) && !tit.includes(s) && !ref.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [variations, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalNetVariations = useMemo(() => variations.reduce((acc, v) => acc + Number(v.variation_amount || 0), 0), [variations]);
  const totalEscalations = useMemo(() => variations.reduce((acc, v) => acc + Number(v.price_escalation_amount || 0), 0), [variations]);

  const getStatusVariant = (st) => {
    if (st.includes('Approved')) return 'success';
    if (st.includes('Review')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Contract Variations & Escalations' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Contract Value Revisions, Variations & Escalations"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Approved Variations"
            value={`+₹${(totalNetVariations / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KpiCard
            label="Price Escalations Realized"
            value={`+₹${(totalEscalations / 100000).toFixed(2)}L`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Logged Variation Orders"
            value={`${variations.length} Orders`}
            status="neutral"
            icon={<Layers className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Client Formal Approval"
            value="100% Endorsed"
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
                placeholder="Search VO no, title, approval ref..."
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
              title="Print Variation Register"
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
              Log Variation Order
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
                  <th className="px-3 py-2 w-28">VO Number</th>
                  <th className="px-3 py-2">Scope Variation Title & Project</th>
                  <th className="px-3 py-2 text-right w-28">Original Sum</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600 font-bold">Variation (+/-)</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Revised Sum</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading contract variations...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No variation orders found.
                    </td>
                  </tr>
                ) : (
                  paged.map((v, idx) => (
                    <tr key={v.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {v.variation_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{v.variation_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={v.title}>
                            {v.title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Ref: {v.approval_ref || 'In Approval'} • {v.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(v.original_contract_value / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        +₹{(v.variation_amount / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(v.revised_contract_value / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(v.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {v.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Variation 360"
                            onClick={() => setViewingItem(v)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(v)}
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
          {paged.map((v, idx) => (
            <div key={v.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{v.variation_no} • {v.variation_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{v.title}</h4>
                  <span className="text-[11px] text-text-muted">{v.project_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(v.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  +₹{(v.variation_amount / 10000000).toFixed(2)} Cr
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Original Sum</span>
                  <span className="font-mono text-text-secondary text-[11px]">₹{(v.original_contract_value / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Revised Sum</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(v.revised_contract_value / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(v)}>
                  <Eye className="w-3 h-3 mr-1" /> View Variation
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

      {/* View Variation 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.variation_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contract_no} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved Variation Addition</span> <span className="font-bold text-emerald-600 font-mono text-base">+₹{(viewingItem.variation_amount / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Price Escalation Claim</span> <span className="font-bold text-primary font-mono text-base">+₹{(viewingItem.price_escalation_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Original Contract Sum</span> <span className="font-mono">₹{(viewingItem.original_contract_value / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Current Revised Contract</span> <span className="font-mono font-bold text-emerald-700 text-sm">₹{(viewingItem.revised_contract_value / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Client Approval Ref</span> <span className="font-mono text-primary font-medium">{viewingItem.approval_ref}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Endorsement Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Scope Variation Title</span> <span className="text-text-primary font-medium">{viewingItem.title}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Consultant Approval Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Variation Order
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Variation Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={TrendingUp}
          title={editingItem ? 'Edit Variation Order' : 'Log Contract Variation Order (VO)'}
          subtitle="Record approved scope additions, drawing revisions, and price escalations."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="vo-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Variation Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Variation Order No" required error={errors.variation_no}>
                  <Input
                    value={form.variation_no}
                    onChange={(e) => handleFormChange('variation_no', e.target.value)}
                    placeholder="VO-2026-005"
                  />
                </FormField>

                <FormField label="Client Approval Letter Ref">
                  <Input
                    value={form.approval_ref}
                    onChange={(e) => handleFormChange('approval_ref', e.target.value)}
                    placeholder="e.g. METRO/PMC/VO/2026/020"
                  />
                </FormField>

                <FormField label="Variation Order Date">
                  <Input
                    type="date"
                    value={form.variation_date}
                    onChange={(e) => handleFormChange('variation_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Scope Variation Title" required error={errors.title} className="md:col-span-2">
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Additional Basement MLCP Stilt Floor & High-Speed Elevator Shafts"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Valuation Revisions">
              <EntityEditModal.Grid>
                <FormField label="Original Contract Sum (₹)" required>
                  <Input
                    type="number"
                    value={form.original_contract_value}
                    onChange={(e) => handleFormChange('original_contract_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Approved Variation Addition (₹)" required>
                  <Input
                    type="number"
                    value={form.variation_amount}
                    onChange={(e) => handleFormChange('variation_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Price Escalation Addition (₹)">
                  <Input
                    type="number"
                    value={form.price_escalation_amount}
                    onChange={(e) => handleFormChange('price_escalation_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Revised Contract Sum (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.revised_contract_value || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Variation Justification Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Drawing changes, rate analysis approvals, client engineer sign-off..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="vo-form"
            submitLabel={editingItem ? 'Update Variation' : 'Save Variation Order'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Variation Order"
        message={`Are you sure you want to delete "${deleteItem?.variation_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
