import { useState, useEffect, useMemo } from 'react';
import {
  Banknote, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Lock
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
  advance_no: '',
  contract_no: 'CTR-2026-001',
  client_name: '',
  claim_date: '',
  advance_type: 'Mobilization Advance (10%)',
  advance_amount: '20000000',
  abg_reference_no: '',
  abg_validity_date: '',
  recovery_mechanism: '10% deduction per RA Bill',
  notes: '',
};

export function ClientAdvancesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [advances, setAdvances] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ClientAdvancesPage');
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
    localStorage.setItem('mock_receivables_ClientAdvancesPage', JSON.stringify(advances));
  }, [advances]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      advance_no: `ADV-2026-00${advances.length + 1}`,
      claim_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      advance_no: item.advance_no || '',
      contract_no: item.contract_no || '',
      client_name: item.client_name || '',
      claim_date: item.claim_date || '',
      advance_type: item.advance_type || 'Mobilization Advance (10%)',
      advance_amount: String(item.advance_amount || '20000000'),
      abg_reference_no: item.abg_reference_no || '',
      abg_validity_date: item.abg_validity_date || '',
      recovery_mechanism: item.recovery_mechanism || '10% deduction per RA Bill',
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
    if (!form.advance_no.trim()) errs.advance_no = 'Advance claim invoice number is required';
    if (!form.abg_reference_no.trim()) errs.abg_reference_no = 'Bank guarantee reference is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const amt = Number(form.advance_amount || 0);

      const newAdv = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        advance_no: form.advance_no,
        contract_no: form.contract_no,
        client_name: form.client_name || 'Client Corp',
        claim_date: form.claim_date,
        advance_type: form.advance_type,
        advance_amount: amt,
        abg_reference_no: form.abg_reference_no,
        abg_validity_date: form.abg_validity_date,
        recovered_amount: editingItem?.recovered_amount || 0,
        balance_outstanding: amt - (editingItem?.recovered_amount || 0),
        recovery_mechanism: form.recovery_mechanism,
        status: editingItem?.status || 'Claim Raised (Pending BG Verification)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setAdvances(prev => prev.map(a => a.id === editingItem.id ? newAdv : a));
        toast.success('Advance claim invoice updated.');
      } else {
        setAdvances(prev => [newAdv, ...prev]);
        toast.success('Mobilization advance claim registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save advance claim.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setAdvances(prev => prev.filter(a => a.id !== deleteItem.id));
    toast.success('Advance record removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return advances.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(a.advance_no || '').toLowerCase();
        const cli = String(a.client_name || '').toLowerCase();
        const abg = String(a.abg_reference_no || '').toLowerCase();
        const proj = String(a.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !abg.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [advances, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalAdvancesClaimed = useMemo(() => advances.reduce((acc, a) => acc + Number(a.advance_amount || 0), 0), [advances]);
  const totalRecoveredToDate = useMemo(() => advances.reduce((acc, a) => acc + Number(a.recovered_amount || 0), 0), [advances]);
  const totalOutstandingAdvances = useMemo(() => advances.reduce((acc, a) => acc + Number(a.balance_outstanding || 0), 0), [advances]);

  const getStatusVariant = (st) => {
    if (st.includes('Fully Recovered')) return 'success';
    if (st.includes('In Recovery')) return 'primary';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Mobilization & Material Advances' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Mobilization & Material Advance Invoices"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Advances Received"
            value={`₹${(totalAdvancesClaimed / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<Banknote className="w-4 h-4" />}
          />
          <KpiCard
            label="Recovered via RA Bills"
            value={`₹${(totalRecoveredToDate / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Outstanding Balance"
            value={`₹${(totalOutstandingAdvances / 10000000).toFixed(2)} Cr`}
            status="warning"
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Bank Guarantee (ABG)"
            value="100% Secured"
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

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search advance no, ABG ref, client..."
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
              title="Print Advance Register"
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
              Claim Mobilization Advance
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
                  <th className="px-3 py-2 w-28">Advance No</th>
                  <th className="px-3 py-2">Advance Type & Client</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Claim Amount</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600">Recovered</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-amber-600">Balance</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">ABG Reference</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading advance claims...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No advance claims found.
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
                          {a.advance_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{a.claim_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.advance_type}>
                            {a.advance_type}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {a.client_name} • {a.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(a.advance_amount / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-emerald-600 font-semibold">
                        ₹{(a.recovered_amount / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        ₹{(a.balance_outstanding / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        <div className="truncate font-semibold text-primary">{a.abg_reference_no}</div>
                        <div className="text-text-muted">Exp: {a.abg_validity_date}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(a.status)}
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
                            title="View Advance 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.advance_no} • {a.claim_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.advance_type}</h4>
                  <span className="text-[11px] text-text-muted">{a.client_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(a.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(a.advance_amount / 10000000).toFixed(2)} Cr
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Recovered</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(a.recovered_amount / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance Due</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(a.balance_outstanding / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View Advance
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

      {/* View Advance 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.advance_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Advance Claim</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.advance_amount / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Outstanding Balance</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.balance_outstanding / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recovered to Date</span> <span className="font-mono font-bold text-emerald-600">₹{(viewingItem.recovered_amount / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bank Guarantee Ref</span> <span className="font-mono text-primary font-bold">{viewingItem.abg_reference_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">ABG Expiry Date</span> <span className="font-mono">{viewingItem.abg_validity_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recovery Mechanism</span> <span className="text-text-primary">{viewingItem.recovery_mechanism}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Bank Guarantee & Verification Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Advance Invoice
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Advance Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Banknote}
          title={editingItem ? 'Edit Advance Claim' : 'Claim Client Mobilization Advance'}
          subtitle="Generate advance invoice against Advance Bank Guarantee (ABG) submission."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="adv-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Advance Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Advance Claim Invoice No" required error={errors.advance_no}>
                  <Input
                    value={form.advance_no}
                    onChange={(e) => handleFormChange('advance_no', e.target.value)}
                    placeholder="ADV-2026-005"
                  />
                </FormField>

                <FormField label="Advance Type">
                  <Select
                    options={[
                      { value: 'Mobilization Advance (10%)', label: 'Mobilization Advance (10%)' },
                      { value: 'Material Advance (15%)', label: 'Material Advance (15%)' },
                      { value: 'Plant & Machinery Advance', label: 'Plant & Machinery Advance' },
                    ]}
                    value={form.advance_type}
                    onChange={(v) => handleFormChange('advance_type', v)}
                  />
                </FormField>

                <FormField label="Claim Date">
                  <Input
                    type="date"
                    value={form.claim_date}
                    onChange={(e) => handleFormChange('claim_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Amount & Bank Guarantee (ABG)">
              <EntityEditModal.Grid>
                <FormField label="Claim Advance Amount (₹)" required>
                  <Input
                    type="number"
                    value={form.advance_amount}
                    onChange={(e) => handleFormChange('advance_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Bank Guarantee (ABG) Ref No" required error={errors.abg_reference_no}>
                  <Input
                    value={form.abg_reference_no}
                    onChange={(e) => handleFormChange('abg_reference_no', e.target.value)}
                    placeholder="e.g. ABG-HDFC-2026-99120"
                  />
                </FormField>

                <FormField label="ABG Expiry / Validity Date">
                  <Input
                    type="date"
                    value={form.abg_validity_date}
                    onChange={(e) => handleFormChange('abg_validity_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Recovery Schedule Mechanism">
                  <Input
                    value={form.recovery_mechanism}
                    onChange={(e) => handleFormChange('recovery_mechanism', e.target.value)}
                    placeholder="e.g. 10% pro-rata deduction per RA Bill"
                  />
                </FormField>

                <FormField label="Verification & Escrow Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Bank confirmation letter reference, escrow account details..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="adv-form"
            submitLabel={editingItem ? 'Update Advance' : 'Claim Advance'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Advance Claim"
        message={`Are you sure you want to delete "${deleteItem?.advance_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
