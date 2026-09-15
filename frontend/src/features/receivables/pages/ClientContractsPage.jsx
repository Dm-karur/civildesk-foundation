import { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  Check, AlertCircle, Sparkles, Printer, ArrowRight, Award, FileCheck
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
  contract_no: '',
  contract_date: '',
  client_name: '',
  contract_title: '',
  contract_value: '100000000',
  commencement_date: '',
  completion_deadline: '',
  retention_pct: '5.0',
  advance_pct: '10.0',
  dlp_months: '24',
  liquidated_damages: '0.5% per week of delay (Max 10%)',
  notes: '',
};

export function ClientContractsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ClientContractsPage');
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
    localStorage.setItem('mock_receivables_ClientContractsPage', JSON.stringify(contracts));
  }, [contracts]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      contract_no: `CTR-2026-00${contracts.length + 1}`,
      contract_date: today,
      commencement_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      contract_no: item.contract_no || '',
      contract_date: item.contract_date || '',
      client_name: item.client_name || '',
      contract_title: item.contract_title || '',
      contract_value: String(item.contract_value || '100000000'),
      commencement_date: item.commencement_date || '',
      completion_deadline: item.completion_deadline || '',
      retention_pct: String(item.retention_pct || '5.0'),
      advance_pct: String(item.advance_pct || '10.0'),
      dlp_months: String(item.dlp_months || '24'),
      liquidated_damages: item.liquidated_damages || '',
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
    if (!form.contract_no.trim()) errs.contract_no = 'Contract number is required';
    if (!form.contract_title.trim()) errs.contract_title = 'Contract title is required';
    if (!form.client_name.trim()) errs.client_name = 'Client name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const val = Number(form.contract_value || 0);

      const newCtr = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        contract_no: form.contract_no,
        contract_date: form.contract_date,
        client_name: form.client_name,
        contract_title: form.contract_title,
        contract_value: val,
        commencement_date: form.commencement_date,
        completion_deadline: form.completion_deadline,
        retention_pct: Number(form.retention_pct || 5),
        advance_pct: Number(form.advance_pct || 10),
        dlp_months: Number(form.dlp_months || 24),
        liquidated_damages: form.liquidated_damages,
        status: editingItem?.status || 'Active (In Progress)',
        billed_to_date: editingItem?.billed_to_date || 0,
        collected_to_date: editingItem?.collected_to_date || 0,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setContracts(prev => prev.map(c => c.id === editingItem.id ? newCtr : c));
        toast.success('Contract agreement updated.');
      } else {
        setContracts(prev => [newCtr, ...prev]);
        toast.success('Client contract agreement registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save contract agreement.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setContracts(prev => prev.filter(c => c.id !== deleteItem.id));
    toast.success('Contract removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(c.contract_no || '').toLowerCase();
        const cli = String(c.client_name || '').toLowerCase();
        const tit = String(c.contract_title || '').toLowerCase();
        const proj = String(c.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !tit.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [contracts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalContractSum = useMemo(() => contracts.reduce((acc, c) => acc + Number(c.contract_value || 0), 0), [contracts]);
  const totalBilledSum = useMemo(() => contracts.reduce((acc, c) => acc + Number(c.billed_to_date || 0), 0), [contracts]);
  const totalCollectedSum = useMemo(() => contracts.reduce((acc, c) => acc + Number(c.collected_to_date || 0), 0), [contracts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Client Contracts' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Master Contracts & Agreement Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Order Book Value"
            value={`₹${(totalContractSum / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Billed to Date"
            value={`₹${(totalBilledSum / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Realized Collections"
            value={`₹${(totalCollectedSum / 10000000).toFixed(2)} Cr`}
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Active Contract Agreements"
            value={`${contracts.length} Contracts`}
            status="neutral"
            icon={<FileCheck className="w-4 h-4 text-primary" />}
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
                placeholder="Search contract no, client, project..."
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
              title="Print Contracts Register"
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
              Add Client Contract
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
                  <th className="px-3 py-2 w-28">Contract No</th>
                  <th className="px-3 py-2">Contract Title & Client</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Contract Sum</th>
                  <th className="px-3 py-2 text-right w-28">Billed to Date</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600">Collected</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Duration</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading client contracts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No client contracts found.
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
                          {c.contract_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{c.contract_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.contract_title}>
                            {c.contract_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.client_name} • {c.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(c.contract_value / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(c.billed_to_date / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(c.collected_to_date / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        <div>{c.commencement_date}</div>
                        <div className="text-text-muted">to {c.completion_deadline}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
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
                            title="View Contract 360"
                            onClick={() => setViewingItem(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Contract"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.contract_no} • {c.contract_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.contract_title}</h4>
                  <span className="text-[11px] text-text-muted">{c.client_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(c.contract_value / 10000000).toFixed(2)} Cr
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Billed to Date</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{(c.billed_to_date / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Collected</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(c.collected_to_date / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View Full Contract
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

      {/* View Contract 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.contract_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Contract Sum</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.contract_value / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Realized Collections</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.collected_to_date / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Deduction</span> <span className="font-mono font-bold text-amber-600">{viewingItem.retention_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mobilization Advance</span> <span className="font-mono font-bold">{viewingItem.advance_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Defect Liability (DLP)</span> <span className="font-mono font-medium">{viewingItem.dlp_months} Months</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Term</span> <span className="font-mono">{viewingItem.commencement_date} to {viewingItem.completion_deadline}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Liquidated Damages Clause</span> <span className="text-red-700 font-medium">{viewingItem.liquidated_damages}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Scope Title</span> <span className="text-text-primary font-medium">{viewingItem.contract_title}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Agreement Notes & Bank Guarantee:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Contract Summary
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contract Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingItem ? 'Edit Client Contract' : 'Register Client Contract Agreement'}
          subtitle="Formulate master contract agreement, contract sum, retention % and milestone deadlines."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="ctr-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Contract Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Contract Agreement No" required error={errors.contract_no}>
                  <Input
                    value={form.contract_no}
                    onChange={(e) => handleFormChange('contract_no', e.target.value)}
                    placeholder="CTR-2026-004"
                  />
                </FormField>

                <FormField label="Client Entity Name" required error={errors.client_name} className="md:col-span-2">
                  <Input
                    value={form.client_name}
                    onChange={(e) => handleFormChange('client_name', e.target.value)}
                    placeholder="e.g. Metro Infrastructure & Realty Corp Ltd"
                  />
                </FormField>

                <FormField label="Contract Title / Scope" required error={errors.contract_title} className="md:col-span-2">
                  <Input
                    value={form.contract_title}
                    onChange={(e) => handleFormChange('contract_title', e.target.value)}
                    placeholder="e.g. Civil Construction & Finishing Works of Commercial Tower"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Contract Sum & Commercial Clauses">
              <EntityEditModal.Grid>
                <FormField label="Total Contract Sum (₹)" required>
                  <Input
                    type="number"
                    value={form.contract_value}
                    onChange={(e) => handleFormChange('contract_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Retention Percentage (%)">
                  <Input
                    type="number"
                    value={form.retention_pct}
                    onChange={(e) => handleFormChange('retention_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Mobilization Advance (%)">
                  <Input
                    type="number"
                    value={form.advance_pct}
                    onChange={(e) => handleFormChange('advance_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Defect Liability Period (Months)">
                  <Input
                    type="number"
                    value={form.dlp_months}
                    onChange={(e) => handleFormChange('dlp_months', e.target.value)}
                  />
                </FormField>

                <FormField label="Commencement Date">
                  <Input
                    type="date"
                    value={form.commencement_date}
                    onChange={(e) => handleFormChange('commencement_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Target Completion Deadline">
                  <Input
                    type="date"
                    value={form.completion_deadline}
                    onChange={(e) => handleFormChange('completion_deadline', e.target.value)}
                  />
                </FormField>

                <FormField label="Liquidated Damages (LD) Clause" className="md:col-span-2">
                  <Input
                    value={form.liquidated_damages}
                    onChange={(e) => handleFormChange('liquidated_damages', e.target.value)}
                    placeholder="e.g. 0.5% per week of delay (Max 10%)"
                  />
                </FormField>

                <FormField label="Contract Agreement Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Performance BG validity dates, price escalation formula..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="ctr-form"
            submitLabel={editingItem ? 'Update Contract' : 'Register Contract'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Client Contract"
        message={`Are you sure you want to delete "${deleteItem?.contract_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
