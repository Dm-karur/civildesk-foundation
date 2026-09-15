import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Layers
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
  package_title: '',
  contractor_name: '',
  work_order_no: 'WO-2026-015',
  contract_value: '2500000',
  certified_value: '1000000',
  paid_value: '850000',
  retention_held: '50000',
  remaining_commitment: '1500000',
  notes: '',
};

export function SubcontractCostsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [subcontractCosts, setSubcontractCosts] = useState([]);
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
      const saved = localStorage.getItem('mock_finance_SubcontractCostsPage');
      if (saved) {
        setSubcontractCosts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_finance_SubcontractCostsPage');
    if (subcontractCosts.length > 0 || saved) {
       localStorage.setItem('mock_finance_SubcontractCostsPage', JSON.stringify(subcontractCosts));
    }
  }, [subcontractCosts]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      package_title: item.package_title || '',
      contractor_name: item.contractor_name || '',
      work_order_no: item.work_order_no || '',
      contract_value: String(item.contract_value || '2500000'),
      certified_value: String(item.certified_value || '1000000'),
      paid_value: String(item.paid_value || '850000'),
      retention_held: String(item.retention_held || '50000'),
      remaining_commitment: String(item.remaining_commitment || '1500000'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'contract_value' || field === 'certified_value') {
        const ctr = Number(field === 'contract_value' ? value : prev.contract_value) || 0;
        const cert = Number(field === 'certified_value' ? value : prev.certified_value) || 0;
        next.remaining_commitment = String(Math.max(0, ctr - cert));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.package_title.trim()) errs.package_title = 'Package title is required';
    if (!form.contractor_name.trim()) errs.contractor_name = 'Contractor name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const ctr = Number(form.contract_value || 0);
      const cert = Number(form.certified_value || 0);
      const paid = Number(form.paid_value || 0);
      const ret = Number(form.retention_held || 0);
      const rem = Math.max(0, ctr - cert);
      const pct = ctr > 0 ? (cert / ctr) * 100 : 0;

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        package_title: form.package_title,
        contractor_name: form.contractor_name,
        work_order_no: form.work_order_no,
        contract_value: ctr,
        certified_value: cert,
        paid_value: paid,
        retention_held: ret,
        remaining_commitment: rem,
        financial_progress_pct: Number(pct.toFixed(1)),
        status: pct >= 100 ? 'Completed (100% Certified)' : 'In Progress',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setSubcontractCosts(prev => prev.map(s => s.id === editingItem.id ? newItem : s));
        toast.success('Subcontract cost ledger updated.');
      } else {
        setSubcontractCosts(prev => [newItem, ...prev]);
        toast.success('Subcontract package cost registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save subcontract cost item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setSubcontractCosts(prev => prev.filter(s => s.id !== deleteItem.id));
    toast.success('Subcontract cost record removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return subcontractCosts.filter(s => {
      if (selectedProjectId !== 'all' && String(s.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const pack = String(s.package_title || '').toLowerCase();
        const cont = String(s.contractor_name || '').toLowerCase();
        const wo = String(s.work_order_no || '').toLowerCase();
        const proj = String(s.project_name || '').toLowerCase();
        if (!pack.includes(str) && !cont.includes(str) && !wo.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [subcontractCosts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalSubcontractVal = useMemo(() => subcontractCosts.reduce((acc, s) => acc + Number(s.contract_value || 0), 0), [subcontractCosts]);
  const totalCertifiedVal = useMemo(() => subcontractCosts.reduce((acc, s) => acc + Number(s.certified_value || 0), 0), [subcontractCosts]);
  const totalPaidVal = useMemo(() => subcontractCosts.reduce((acc, s) => acc + Number(s.paid_value || 0), 0), [subcontractCosts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Subcontract Cost Ledger' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Package Commitment & Valuation Cost Ledger"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Awarded Packages"
            value={`₹${(totalSubcontractVal / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Cumulative Certified Work"
            value={`₹${(totalCertifiedVal / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Disbursed Settlements"
            value={`₹${(totalPaidVal / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<Briefcase className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Active Contract Packages"
            value={`${subcontractCosts.length} Packages`}
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
                placeholder="Search package, contractor, WO..."
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
              title="Print Subcontract Ledger"
            >
              Print Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Subcontract Package
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
                  <th className="px-3 py-2">Package Title & Contractor</th>
                  <th className="px-3 py-2 text-right w-28">Order Value</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Certified Work</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600">Paid Amount</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell text-amber-600">Retention</th>
                  <th className="px-3 py-2 text-right w-28">Balance WO</th>
                  <th className="px-3 py-2 text-center w-20">Progress %</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading subcontract cost ledger...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No subcontract cost items found.
                    </td>
                  </tr>
                ) : (
                  paged.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={s.package_title}>
                            {s.package_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {s.contractor_name} • {s.work_order_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(s.contract_value / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(s.certified_value / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(s.paid_value / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{(s.retention_held / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(s.remaining_commitment / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {s.financial_progress_pct}%
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Package 360"
                            onClick={() => setViewingItem(s)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(s)}
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
          {paged.map((s, idx) => (
            <div key={s.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{s.package_title}</h4>
                  <span className="text-[11px] text-text-muted">{s.contractor_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {s.financial_progress_pct}% Done
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Order Value</span>
                  <span className="font-mono text-text-secondary text-[11px]">₹{(s.contract_value / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Paid to Date</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(s.paid_value / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(s)}>
                  <Eye className="w-3 h-3 mr-1" /> View Package Cost
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

      {/* View Subcontract 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.package_title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Work Order Sum</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.contract_value / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Certified Work Value</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.certified_value / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Paid Settlements</span> <span className="font-mono font-bold">₹{(viewingItem.paid_value / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Withheld (5%)</span> <span className="font-mono text-amber-600">₹{(viewingItem.retention_held / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Remaining Commitment</span> <span className="font-mono">₹{(viewingItem.remaining_commitment / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Work Order Ref</span> <span className="font-mono text-primary font-medium">{viewingItem.work_order_no}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Subcontract Financial Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Package Cost Sheet
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
          icon={Briefcase}
          title={editingItem ? 'Edit Subcontract Cost Package' : 'Add Subcontract Cost Package'}
          subtitle="Record work order commitment, certified billings, disbursements and retention."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="sc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Package Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Work Order No">
                  <Input
                    value={form.work_order_no}
                    onChange={(e) => handleFormChange('work_order_no', e.target.value)}
                    placeholder="WO-2026-015"
                  />
                </FormField>

                <FormField label="Package Scope Title" required error={errors.package_title} className="md:col-span-2">
                  <Input
                    value={form.package_title}
                    onChange={(e) => handleFormChange('package_title', e.target.value)}
                    placeholder="e.g. RCC Structure & Framing Package"
                  />
                </FormField>

                <FormField label="Contractor Name" required error={errors.contractor_name} className="md:col-span-2">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Civil Infra Pvt Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Valuation">
              <EntityEditModal.Grid>
                <FormField label="Total Contract Sum (₹)" required>
                  <Input
                    type="number"
                    value={form.contract_value}
                    onChange={(e) => handleFormChange('contract_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Certified Work (₹)">
                  <Input
                    type="number"
                    value={form.certified_value}
                    onChange={(e) => handleFormChange('certified_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Paid to Date (₹)">
                  <Input
                    type="number"
                    value={form.paid_value}
                    onChange={(e) => handleFormChange('paid_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Retention Held (5%)">
                  <Input
                    type="number"
                    value={form.retention_held}
                    onChange={(e) => handleFormChange('retention_held', e.target.value)}
                  />
                </FormField>

                <FormField label="Remaining Commitment (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.remaining_commitment || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="sc-form"
            submitLabel={editingItem ? 'Update Package' : 'Save Package Cost'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Subcontract Record"
        message={`Are you sure you want to delete "${deleteItem?.package_title}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
