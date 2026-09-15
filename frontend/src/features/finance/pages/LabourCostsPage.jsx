import { useState, useEffect, useMemo } from 'react';
import {
  Users, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, HardHat
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
  trade_name: '',
  gang_contractor: '',
  mandays_deployed: '500',
  nmr_wages_paid: '450000',
  piecerate_paid: '200000',
  overtime_allowance: '50000',
  total_labour_cost: '700000',
  productivity_index: '1.00',
  notes: '',
};

export function LabourCostsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [labourCosts, setLabourCosts] = useState([]);
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

  // Load Costs from LocalStorage (Mock Backend)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_finance_labour_costs');
      if (saved) {
        setCosts(JSON.parse(saved));
      } else {
        // Default mock data if empty
        setCosts([
          {
            id: 1,
            project_id: 1,
            wbs_code: 'WBS-1.1',
            trade_name: 'Testing the labour cost',
            category_name: 'RCC Concrete Squad',
            contractor_name: 'Direct Roll',
            mandays_spent: 50,
            regular_hours: 400,
            ot_hours: 20,
            output_qty: 100,
            uom: 'cum',
            budgeted_cost: 60000,
            actual_cost: 55000,
            variance_amount: 5000,
            variance_pct: 8.3,
            unit_rate_actual: 550,
            unit_rate_budget: 600,
            status: 'Under Budget',
            notes: '',
          }
        ]);
      }
    } catch (e) {
      console.error('Failed to load mock finance labour costs', e);
    }
  }, []);

  // Save Costs to LocalStorage
  useEffect(() => {
    if (costs.length > 0) {
      localStorage.setItem('mock_finance_labour_costs', JSON.stringify(costs));
    }
  }, [costs]);

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
      trade_name: item.trade_name || '',
      gang_contractor: item.gang_contractor || '',
      mandays_deployed: String(item.mandays_deployed || '500'),
      nmr_wages_paid: String(item.nmr_wages_paid || '450000'),
      piecerate_paid: String(item.piecerate_paid || '200000'),
      overtime_allowance: String(item.overtime_allowance || '50000'),
      total_labour_cost: String(item.total_labour_cost || '700000'),
      productivity_index: item.productivity_index || '1.00',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'nmr_wages_paid' || field === 'piecerate_paid' || field === 'overtime_allowance') {
        const nmr = Number(field === 'nmr_wages_paid' ? value : prev.nmr_wages_paid) || 0;
        const pr = Number(field === 'piecerate_paid' ? value : prev.piecerate_paid) || 0;
        const ot = Number(field === 'overtime_allowance' ? value : prev.overtime_allowance) || 0;
        next.total_labour_cost = String(nmr + pr + ot);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.trade_name.trim()) errs.trade_name = 'Trade name is required';
    if (!form.gang_contractor.trim()) errs.gang_contractor = 'Gang contractor name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const nmr = Number(form.nmr_wages_paid || 0);
      const pr = Number(form.piecerate_paid || 0);
      const ot = Number(form.overtime_allowance || 0);
      const tot = nmr + pr + ot;

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        trade_name: form.trade_name,
        gang_contractor: form.gang_contractor,
        mandays_deployed: Number(form.mandays_deployed || 0),
        nmr_wages_paid: nmr,
        piecerate_paid: pr,
        overtime_allowance: ot,
        total_labour_cost: tot,
        productivity_index: form.productivity_index,
        status: 'Optimal',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setLabourCosts(prev => prev.map(l => l.id === editingItem.id ? newItem : l));
        toast.success('Labour cost record updated.');
      } else {
        setLabourCosts(prev => [newItem, ...prev]);
        toast.success('Labour gang cost record registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save labour cost item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setLabourCosts(prev => prev.filter(l => l.id !== deleteItem.id));
    toast.success('Labour cost record removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return labourCosts.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const trd = String(l.trade_name || '').toLowerCase();
        const gng = String(l.gang_contractor || '').toLowerCase();
        const proj = String(l.project_name || '').toLowerCase();
        if (!trd.includes(s) && !gng.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [labourCosts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalLabourCost = useMemo(() => labourCosts.reduce((acc, l) => acc + Number(l.total_labour_cost || 0), 0), [labourCosts]);
  const totalMandays = useMemo(() => labourCosts.reduce((acc, l) => acc + Number(l.mandays_deployed || 0), 0), [labourCosts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Labour Cost Ledger' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Gang & Piece-rate Wage Cost Ledger"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Labour Wages Incurred"
            value={`₹${(totalLabourCost / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Mandays Deployed"
            value={`${totalMandays.toLocaleString('en-IN')} Mandays`}
            status="neutral"
            icon={<Users className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Average Wage per Manday"
            value={`₹${totalMandays > 0 ? (totalLabourCost / totalMandays).toFixed(0) : '0'}/Day`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Muster Roll (NMR) Audit"
            value="100% Biometric Verified"
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
                placeholder="Search trade, gang contractor..."
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
              title="Print Labour Cost Ledger"
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
              Add Labour Cost Entry
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
                  <th className="px-3 py-2">Labour Trade & Gang Contractor</th>
                  <th className="px-3 py-2 text-center w-24">Mandays</th>
                  <th className="px-3 py-2 text-right w-28">NMR Wages</th>
                  <th className="px-3 py-2 text-right w-28">Piece-rate</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Overtime</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-emerald-600">Total Cost</th>
                  <th className="px-3 py-2 text-center w-24">Productivity</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading labour cost ledger...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No labour cost records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.trade_name}>
                            {l.trade_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {l.gang_contractor} • {l.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-primary">
                        {l.mandays_deployed}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(l.nmr_wages_paid / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(l.piecerate_paid / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{(l.overtime_allowance / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(l.total_labour_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[10px] text-emerald-700 font-semibold">
                        {l.productivity_index}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Labour 360"
                            onClick={() => setViewingItem(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(l)}
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
          {paged.map((l, idx) => (
            <div key={l.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.trade_name}</h4>
                  <span className="text-[11px] text-text-muted">{l.gang_contractor}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(l.total_labour_cost / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Mandays Deployed</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{l.mandays_deployed} Mandays</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Productivity Index</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">{l.productivity_index}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                  <Eye className="w-3 h-3 mr-1" /> View Labour Cost
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

      {/* View Labour 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.trade_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.gang_contractor}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Labour Cost</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.total_labour_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Mandays</span> <span className="font-bold text-primary font-mono text-base">{viewingItem.mandays_deployed}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Daily Muster Roll (NMR)</span> <span className="font-mono">₹{(viewingItem.nmr_wages_paid / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Piece-rate Gang Amount</span> <span className="font-mono">₹{(viewingItem.piecerate_paid / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Overtime Allowance</span> <span className="font-mono text-amber-600">₹{(viewingItem.overtime_allowance / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Productivity Rating</span> <span className="text-emerald-700 font-medium">{viewingItem.productivity_index}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Wage Muster Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Labour Cost Docket
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
          icon={HardHat}
          title={editingItem ? 'Edit Labour Cost Entry' : 'Add Labour Cost Entry'}
          subtitle="Record muster roll daily wages, piece-rate subcontractor allocations, and overtime."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="lab-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Trade Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Trade Name" required error={errors.trade_name}>
                  <Input
                    value={form.trade_name}
                    onChange={(e) => handleFormChange('trade_name', e.target.value)}
                    placeholder="e.g. Shuttering & Formwork Carpenters"
                  />
                </FormField>

                <FormField label="Gang Contractor Name" required error={errors.gang_contractor} className="md:col-span-2">
                  <Input
                    value={form.gang_contractor}
                    onChange={(e) => handleFormChange('gang_contractor', e.target.value)}
                    placeholder="e.g. Balaji Formwork Gang"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Wage Allocation & Overtime">
              <EntityEditModal.Grid>
                <FormField label="Mandays Deployed" required>
                  <Input
                    type="number"
                    value={form.mandays_deployed}
                    onChange={(e) => handleFormChange('mandays_deployed', e.target.value)}
                  />
                </FormField>

                <FormField label="Daily Muster Roll NMR (₹)">
                  <Input
                    type="number"
                    value={form.nmr_wages_paid}
                    onChange={(e) => handleFormChange('nmr_wages_paid', e.target.value)}
                  />
                </FormField>

                <FormField label="Piece-rate Paid (₹)">
                  <Input
                    type="number"
                    value={form.piecerate_paid}
                    onChange={(e) => handleFormChange('piecerate_paid', e.target.value)}
                  />
                </FormField>

                <FormField label="Overtime Allowance (₹)">
                  <Input
                    type="number"
                    value={form.overtime_allowance}
                    onChange={(e) => handleFormChange('overtime_allowance', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Labour Cost (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.total_labour_cost || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="lab-form"
            submitLabel={editingItem ? 'Update Entry' : 'Save Labour Cost'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Labour Cost Record"
        message={`Are you sure you want to delete "${deleteItem?.trade_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
