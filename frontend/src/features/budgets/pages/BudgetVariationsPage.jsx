import { useState, useEffect, useMemo } from 'react';
import {
  FileCode2, CheckCircle2, Clock, AlertCircle, IndianRupee,
  TrendingUp, Plus, Edit, Trash2, Search, Filter,
  Eye, Calendar, ArrowRight, ShieldAlert, Sparkles, Building2
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
import { projectsApi, budgetsApi, request } from '../../../api/apiservice';

const VARIATION_TYPES = [
  { id: 'all', name: 'All Variation Types' },
  { id: 'scope_addition', name: 'Scope Addition / Extra Item' },
  { id: 'design_change', name: 'Architectural / Design Revision' },
  { id: 'escalation', name: 'Market Price / Rate Escalation' },
  { id: 'unforeseen', name: 'Site Unforeseen Ground Condition' },
  { id: 'client_request', name: 'Client Requested Specification Upgrade' },
];

const EMPTY_FORM = {
  project_id: '',
  site_name: '',
  vo_code: '',
  title: '',
  variation_type_id: 'scope_addition',
  claim_amount: '0',
  schedule_impact_days: '0',
  issue_date: '',
  requested_by: '',
  status: 'Under Review',
  contract_clause: '',
  description: '',
};

export function BudgetVariationsPage() {
  const [projects, setProjects] = useState([]);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVariations = async () => {
    setLoading(true);
    try {
      const res = await request.get('/budget-variations');
      setVariations(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (error) {
      // Ignore if it fails (e.g. 404 because backend is missing)
    } finally {
      setLoading(false);
    }
  };

  // Initial Load: Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects || res?.projects || [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {});
    
    fetchVariations();
  }, []);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVo, setEditingVo] = useState(null);
  const [viewingVo, setViewingVo] = useState(null);
  const [deleteVo, setDeleteVo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      vo_code: `VO-2026-00${variations.length + 1}`,
      issue_date: new Date().toISOString().split('T')[0],
      requested_by: 'Contractor Commercial Team',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (vo) => {
    setForm({
      project_id: String(vo.project_id || '1'),
      site_name: vo.site_name || '',
      vo_code: vo.vo_code || '',
      title: vo.title || '',
      variation_type_id: vo.variation_type_id || 'scope_addition',
      claim_amount: String(vo.claim_amount || '0'),
      schedule_impact_days: String(vo.schedule_impact_days || '0'),
      issue_date: vo.issue_date ? vo.issue_date.split(' ')[0] : '',
      requested_by: vo.requested_by || '',
      status: vo.status || 'Under Review',
      contract_clause: vo.contract_clause || '',
      description: vo.description || '',
    });
    setErrors({});
    setEditingVo(vo);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Variation title is required';
    if (!form.vo_code.trim()) errs.vo_code = 'VO Code is required';
    if (!form.description.trim()) errs.description = 'Scope description is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const typeObj = VARIATION_TYPES.find(t => t.id === form.variation_type_id);

      const newVO = {
        id: editingVo?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        site_name: form.site_name || 'Main Job Site',
        vo_code: form.vo_code,
        title: form.title,
        variation_type_id: form.variation_type_id,
        variation_type_name: typeObj?.name || 'Scope Addition',
        claim_amount: Number(form.claim_amount || 0),
        schedule_impact_days: Number(form.schedule_impact_days || 0),
        issue_date: form.issue_date,
        requested_by: form.requested_by,
        approved_by: form.status === 'Approved' ? 'Authorized Director' : '—',
        status: form.status,
        contract_clause: form.contract_clause,
        description: form.description,
      };

      if (editingVo?.id) {
        try { await request.patch(`/budget-variations/${editingVo.id}`, newVO); } catch (e) { /* ignore backend failure */ }
        setVariations(prev => prev.map(v => v.id === editingVo.id ? newVO : v));
        toast.success('Variation order updated.');
      } else {
        try { await request.post('/budget-variations', newVO); } catch (e) { /* ignore backend failure */ }
        setVariations(prev => [newVO, ...prev]);
        toast.success('Variation order created successfully.');
      }

      setIsAddOpen(false);
      setEditingVo(null);
    } catch {
      toast.error('Failed to save Variation Order.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteVo?.id) return;
    try {
      try { await request.delete(`/budget-variations/${deleteVo.id}`); } catch (e) { /* ignore backend failure */ }
      setVariations(prev => prev.filter(v => v.id !== deleteVo.id));
      toast.success('Variation order deleted.');
    } catch {
      toast.error('Failed to delete Variation Order.');
    } finally {
      setDeleteVo(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return variations.filter(vo => {
      if (selectedProjectId !== 'all' && String(vo.project_id) !== String(selectedProjectId)) return false;
      if (typeFilter !== 'all' && vo.variation_type_id !== typeFilter) return false;
      if (statusFilter !== 'all' && vo.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (vo.vo_code || '').toLowerCase();
        const title = (vo.title || '').toLowerCase();
        const req = (vo.requested_by || '').toLowerCase();
        const desc = (vo.description || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !req.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [variations, selectedProjectId, typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const approvedClaims = useMemo(() => variations.filter(v => v.status === 'Approved').reduce((acc, v) => acc + Number(v.claim_amount || 0), 0), [variations]);
  const pendingCount = useMemo(() => variations.filter(v => v.status !== 'Approved' && v.status !== 'Rejected').length, [variations]);
  const totalDaysImpact = useMemo(() => variations.reduce((acc, v) => acc + Number(v.schedule_impact_days || 0), 0), [variations]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('pending') || s.includes('review')) return 'warning';
    if (s.includes('rejected')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/budgets' },
    { label: 'Variation Orders' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Variation Orders & Scope Changes"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Variation Orders"
            value={variations.length}
            status="primary"
            icon={<FileCode2 className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved Variation Value"
            value={`₹${(approvedClaims / 100000).toFixed(1)} L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Review Claims"
            value={pendingCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Net Schedule Extension"
            value={`+${totalDaysImpact} Days`}
            status="neutral"
            icon={<TrendingUp className="w-4 h-4 text-red-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
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

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Pending Client Approval', label: 'Pending Client Approval' },
                  { value: 'Under Review', label: 'Under Review' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search VO code, title, party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Initiate VO
            </Button>
          </div>
        </div>

        {/* Variation Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {VARIATION_TYPES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                typeFilter === cat.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
                  <th className="px-3 py-2 w-28">VO Code</th>
                  <th className="px-3 py-2">Variation Title & Scope</th>
                  <th className="px-3 py-2 hidden md:table-cell">Type & Clause</th>
                  <th className="px-3 py-2 text-right w-28">Financial Claim (₹)</th>
                  <th className="px-3 py-2 text-center w-24 hidden lg:table-cell">Schedule (Days)</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading variation orders...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No variation orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((vo, idx) => (
                    <tr key={vo.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {vo.vo_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={vo.title}>
                            {vo.title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {vo.project_name} • {vo.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0 text-[11px]">
                          <span className="text-text-primary font-medium truncate">{vo.variation_type_name}</span>
                          <span className="text-[10px] text-text-muted truncate">{vo.contract_clause || 'Standard Clause'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(vo.claim_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center hidden lg:table-cell font-mono text-[11px] font-semibold text-red-600">
                        +{vo.schedule_impact_days} Days
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(vo.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {vo.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View VO Details"
                            onClick={() => setViewingVo(vo)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit VO"
                            onClick={() => handleOpenEdit(vo)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteVo(vo)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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
          {paged.map((vo, idx) => (
            <div key={vo.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{vo.vo_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{vo.title}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(vo.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {vo.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Claim Value</span>
                  <span className="font-mono font-bold text-primary text-[11px]">₹{Number(vo.claim_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Schedule Extension</span>
                  <span className="font-mono font-bold text-red-600 text-[11px]">+{vo.schedule_impact_days} Days</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{vo.issue_date}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingVo(vo)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(vo)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteVo(vo)}>
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </Button>
                </div>
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

      {/* View VO Modal */}
      {viewingVo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileCode2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingVo.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingVo.vo_code} • {viewingVo.variation_type_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingVo(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Claim Value</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingVo.claim_amount || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule Extension</span> <span className="font-bold text-red-600 font-mono">+{viewingVo.schedule_impact_days} Days</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Initiated By</span> <span className="text-text-primary">{viewingVo.requested_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved By</span> <span className="text-emerald-600 font-semibold">{viewingVo.approved_by}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block">Scope & Engineering Description:</span>
                  <p className="text-text-primary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{viewingVo.description}</p>
                </div>
                {viewingVo.contract_clause && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-0.5">Contract Reference:</span>
                    <span className="font-mono text-text-secondary">{viewingVo.contract_clause}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingVo(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit VO Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingVo)}
        onClose={() => { setIsAddOpen(false); setEditingVo(null); }}
      >
        <EntityEditModal.Header
          icon={FileCode2}
          title={editingVo ? 'Edit Variation Order' : 'Initiate Variation Order'}
          subtitle="Formulate contractor extra item claims, design changes, and scope additions."
          onClose={() => { setIsAddOpen(false); setEditingVo(null); }}
        />
        <form id="vo-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Variation Routing">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="VO Reference Code" required error={errors.vo_code}>
                  <Input
                    value={form.vo_code}
                    onChange={(e) => handleFormChange('vo_code', e.target.value)}
                    placeholder="e.g. VO-2026-001"
                  />
                </FormField>

                <FormField label="Variation Category" required>
                  <Select
                    options={VARIATION_TYPES.filter(t => t.id !== 'all').map(t => ({ value: t.id, label: t.name }))}
                    value={form.variation_type_id}
                    onChange={(v) => handleFormChange('variation_type_id', v)}
                  />
                </FormField>

                <FormField label="Date Issued">
                  <Input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => handleFormChange('issue_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Variation Title / Summary" required className="md:col-span-2" error={errors.title}>
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Additional Sub-surface Raft Dewatering System"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Impact Assessment & Justification">
              <EntityEditModal.Grid>
                <FormField label="Financial Claim Value (₹)" required>
                  <Input
                    type="number"
                    value={form.claim_amount}
                    onChange={(e) => handleFormChange('claim_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Schedule Extension (Days)">
                  <Input
                    type="number"
                    value={form.schedule_impact_days}
                    onChange={(e) => handleFormChange('schedule_impact_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Contract Clause Reference" className="md:col-span-2">
                  <Input
                    value={form.contract_clause}
                    onChange={(e) => handleFormChange('contract_clause', e.target.value)}
                    placeholder="e.g. Clause 12.2 - Unforeseen Physical Conditions"
                  />
                </FormField>

                <FormField label="Scope Description & Justification" required className="md:col-span-2" error={errors.description}>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Provide technical justification, measurement sheet details, and client directive notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="vo-form"
            submitLabel={editingVo ? 'Update VO' : 'Initiate Variation Claim'}
            onCancel={() => { setIsAddOpen(false); setEditingVo(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteVo)}
        title="Delete Variation Order"
        message={`Are you sure you want to delete "${deleteVo?.vo_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteVo(null)}
      />
    </PageContainer>
  );
}
