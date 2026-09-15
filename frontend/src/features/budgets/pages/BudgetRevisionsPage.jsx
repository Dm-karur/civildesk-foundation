import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GitBranch, CheckCircle2, Clock, AlertCircle, IndianRupee,
  TrendingUp, TrendingDown, Plus, Edit, Trash2, Search, Filter,
  Eye, FileText, ArrowRight, ShieldCheck, Wallet
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

import { UnderDevelopment } from '../../masters/pages/UnderDevelopment';


const EMPTY_FORM = {
  project_id: '',
  budget_id: '',
  revision_no: '1',
  revision_date: '',
  previous_total: '0',
  revised_total: '0',
  variance_amount: '0',
  status_name: 'Pending Approval',
  requested_by_name: '',
  reason: '',
  decision_note: '',
};

export function BudgetRevisionsPage_Future() {
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedBudgetId, setSelectedBudgetId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRev, setEditingRev] = useState(null);
  const [viewingRev, setViewingRev] = useState(null);
  const [deleteRev, setDeleteRev] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const res = await request.get('/budget-revisions');
      setRevisions(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (error) {
      // Ignore if it fails (e.g. 404 because backend is missing)
    } finally {
      setLoading(false);
    }
  };

  // Initial Load: Projects, Budgets
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      budgetsApi.list().catch(() => ({ data: { project_budgets: [] } })),
    ]).then(([pRes, bRes]) => {
      const pList = pRes?.data?.projects || pRes?.projects || [];
      const bList = bRes?.data?.project_budgets || bRes?.project_budgets || [];
      setProjects(Array.isArray(pList) ? pList : []);
      setBudgets(Array.isArray(bList) ? bList : []);
    });
    
    fetchRevisions();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableBudgets = budgets.filter(b => String(b.project_id) === String(defaultProj));
    const targetBudget = availableBudgets[0] || budgets[0];
    const prevAmount = targetBudget?.total_amount || 21625000;

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      budget_id: targetBudget?.id ? String(targetBudget.id) : '1',
      revision_no: String(revisions.length + 1),
      revision_date: new Date().toISOString().split('T')[0],
      previous_total: String(prevAmount),
      revised_total: String(Number(prevAmount) + 500000),
      variance_amount: '500000',
      requested_by_name: 'Current User',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (rev) => {
    setForm({
      project_id: String(rev.project_id || '1'),
      budget_id: String(rev.budget_id || '1'),
      revision_no: String(rev.revision_no || '1'),
      revision_date: rev.revision_date ? rev.revision_date.split(' ')[0] : '',
      previous_total: String(rev.previous_total || '0'),
      revised_total: String(rev.revised_total || '0'),
      variance_amount: String(rev.variance_amount || '0'),
      status_name: rev.status_name || 'Pending Approval',
      requested_by_name: rev.requested_by_name || '',
      reason: rev.reason || '',
      decision_note: rev.decision_note || '',
    });
    setErrors({});
    setEditingRev(rev);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'revised_total' || field === 'previous_total') {
        const rev = Number(field === 'revised_total' ? value : prev.revised_total) || 0;
        const old = Number(field === 'previous_total' ? value : prev.previous_total) || 0;
        next.variance_amount = String(rev - old);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.reason.trim()) errs.reason = 'Variance reason / justification is required';
    if (!form.budget_id) errs.budget_id = 'Target budget is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const newRev = {
        project_id: Number(form.project_id || 1),
        budget_id: Number(form.budget_id),
        revision_no: Number(form.revision_no || 1),
        revision_date: form.revision_date || new Date().toISOString().split('T')[0],
        previous_total: Number(form.previous_total || 0),
        revised_total: Number(form.revised_total || 0),
        variance_amount: Number(form.variance_amount || 0),
        status_name: form.status_name || 'Pending Approval',
        requested_by_name: form.requested_by_name || 'QS Engineer',
        reason: form.reason.trim(),
        decision_note: form.decision_note || '',
      };

      if (editingRev?.id) {
        await request.patch(`/budget-revisions/${editingRev.id}`, newRev);
        toast.success('Budget revision updated.');
      } else {
        await request.post('/budget-revisions', newRev);
        toast.success('Budget revision created successfully.');
      }

      fetchRevisions();
      setIsAddOpen(false);
      setEditingRev(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to save budget revision.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRev?.id) return;
    try {
      await request.delete(`/budget-revisions/${deleteRev.id}`);
      toast.success('Revision deleted.');
      fetchRevisions();
    } catch (error) {
      toast.error('Failed to delete revision.');
    } finally {
      setDeleteRev(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return revisions.filter(rev => {
      if (selectedProjectId !== 'all' && String(rev.project_id) !== String(selectedProjectId)) return false;
      if (selectedBudgetId !== 'all' && String(rev.budget_id) !== String(selectedBudgetId)) return false;
      if (statusFilter !== 'all') {
        const s = (rev.status_name || '').toLowerCase();
        if (statusFilter === 'Approved' && !s.includes('approved')) return false;
        if (statusFilter === 'Pending' && !s.includes('pending') && !s.includes('review')) return false;
        if (statusFilter === 'Draft' && !s.includes('draft')) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const bCode = (rev.budget_code || '').toLowerCase();
        const bName = (rev.budget_name || '').toLowerCase();
        const pName = (rev.project_name || '').toLowerCase();
        const reason = (rev.reason || '').toLowerCase();
        if (!bCode.includes(q) && !bName.includes(q) && !pName.includes(q) && !reason.includes(q)) return false;
      }
      return true;
    });
  }, [revisions, selectedProjectId, selectedBudgetId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const approvedCount = useMemo(() => revisions.filter(r => (r.status_name || '').includes('Approved')).length, [revisions]);
  const pendingCount = useMemo(() => revisions.filter(r => (r.status_name || '').includes('Pending') || (r.status_name || '').includes('Review')).length, [revisions]);
  const netVariance = useMemo(() => revisions.reduce((acc, r) => acc + Number(r.variance_amount || 0), 0), [revisions]);

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
    { label: 'Budget Revisions' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Budget Revisions & Variance Analysis"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Revisions"
            value={revisions.length}
            status="primary"
            icon={<GitBranch className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved Revisions"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Review"
            value={pendingCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Net Cost Variance"
            value={`+ ₹${(netVariance / 100000).toFixed(1)} L`}
            status={netVariance > 0 ? 'warning' : 'neutral'}
            icon={<TrendingUp className="w-4 h-4 text-red-500" />}
          />
        </div>

        {/* Filter and Project/Budget Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedBudgetId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Budgets' },
                  ...budgets
                    .filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId))
                    .map(b => ({ value: String(b.id), label: `${b.budget_code} - ${b.budget_name}` }))
                ]}
                value={selectedBudgetId}
                onChange={setSelectedBudgetId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Pending', label: 'Pending Review' },
                  { value: 'Draft', label: 'Draft' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search revision, reason..."
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
              Request Revision
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
                  <th className="px-3 py-2 w-28">Revision Tag</th>
                  <th className="px-3 py-2">Budget & Project</th>
                  <th className="px-3 py-2 hidden md:table-cell">Date & Requester</th>
                  <th className="px-3 py-2 text-right">Previous (₹)</th>
                  <th className="px-3 py-2 text-right">Revised (₹)</th>
                  <th className="px-3 py-2 text-right">Variance (₹)</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading budget revisions...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No budget revisions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((rev, idx) => {
                    const variancePct = rev.previous_total > 0 ? ((rev.variance_amount / rev.previous_total) * 100).toFixed(1) : 0;
                    const isPositive = Number(rev.variance_amount) > 0;

                    return (
                      <tr key={rev.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              Rev-{rev.revision_no}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={rev.budget_name}>
                              {rev.budget_name}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              {rev.budget_code} • {rev.project_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex flex-col text-[11px]">
                            <span className="text-text-primary font-mono text-[10px]">{rev.revision_date}</span>
                            <span className="text-text-muted text-[10px] truncate">{rev.requested_by_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                          ₹{Number(rev.previous_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
                          ₹{Number(rev.revised_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-mono font-bold text-[11px] ${isPositive ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isPositive ? '+' : ''}₹{Number(rev.variance_amount || 0).toLocaleString('en-IN')} ({variancePct}%)
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(rev.status_name)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {rev.status_name}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Revision Details"
                              onClick={() => setViewingRev(rev)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Revision"
                              onClick={() => handleOpenEdit(rev)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteRev(rev)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((rev, idx) => (
            <div key={rev.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">Rev-{rev.revision_no} • {rev.budget_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{rev.budget_name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(rev.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {rev.status_name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Revised Budget</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{Number(rev.revised_total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Variance</span>
                  <span className="font-mono font-bold text-red-600 text-[11px]">+₹{Number(rev.variance_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{rev.revision_date}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingRev(rev)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(rev)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteRev(rev)}>
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

      {/* View Revision Modal */}
      {viewingRev && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Budget Revision #{viewingRev.revision_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingRev.budget_code} • {viewingRev.budget_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingRev(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-2 bg-surface-muted/30 p-3 rounded-lg border border-border text-center">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Previous Total</span>
                  <span className="font-mono text-text-secondary">₹{Number(viewingRev.previous_total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Revised Total</span>
                  <span className="font-mono font-bold text-text-primary">₹{Number(viewingRev.revised_total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Cost Delta</span>
                  <span className="font-mono font-bold text-red-600">+₹{Number(viewingRev.variance_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block">Justification & Scope Escalation:</span>
                  <p className="text-text-primary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{viewingRev.reason}</p>
                </div>
                {viewingRev.decision_note && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Approval Decision Note:</span>
                    <p className="text-text-secondary bg-emerald-500/5 p-2 rounded border border-emerald-500/20">{viewingRev.decision_note}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingRev(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Revision Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingRev)}
        onClose={() => { setIsAddOpen(false); setEditingRev(null); }}
      >
        <EntityEditModal.Header
          icon={GitBranch}
          title={editingRev ? 'Edit Budget Revision Request' : 'Request Budget Revision'}
          subtitle="Formulate formal budget variance proposals for management approval."
          onClose={() => { setIsAddOpen(false); setEditingRev(null); }}
        />
        <form id="rev-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Budget Mapping">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const b = budgets.find(item => String(item.project_id) === String(v));
                      if (b) {
                        handleFormChange('budget_id', String(b.id));
                        handleFormChange('previous_total', String(b.total_amount || 0));
                      }
                    }}
                  />
                </FormField>

                <FormField label="Target Budget (Approved only)" required error={errors.budget_id}>
                  <Select
                    options={budgets
                      .filter(b => (!form.project_id || String(b.project_id) === String(form.project_id)) && (b.status_code === 'APPROVED' || b.status_name === 'APPROVED'))
                      .map(b => ({ value: String(b.id), label: `${b.budget_code} - ${b.budget_name}` }))}
                    value={form.budget_id}
                    onChange={(v) => {
                      handleFormChange('budget_id', v);
                      const b = budgets.find(item => String(item.id) === String(v));
                      if (b) handleFormChange('previous_total', String(b.total_amount || 0));
                    }}
                  />
                </FormField>

                <FormField label="Revision Number">
                  <Input
                    type="number"
                    value={form.revision_no}
                    onChange={(e) => handleFormChange('revision_no', e.target.value)}
                  />
                </FormField>

                <FormField label="Revision Date">
                  <Input
                    type="date"
                    value={form.revision_date}
                    onChange={(e) => handleFormChange('revision_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Financial Variance Comparison">
              <EntityEditModal.Grid>
                <FormField label="Previous Baseline Budget (₹)">
                  <Input
                    type="number"
                    value={form.previous_total}
                    onChange={(e) => handleFormChange('previous_total', e.target.value)}
                  />
                </FormField>

                <FormField label="Proposed Revised Budget (₹)">
                  <Input
                    type="number"
                    value={form.revised_total}
                    onChange={(e) => handleFormChange('revised_total', e.target.value)}
                  />
                </FormField>

                <FormField label="Net Variance Amount (₹)" className="md:col-span-2">
                  <Input
                    type="number"
                    value={form.variance_amount}
                    readOnly
                    className="bg-surface-muted font-bold text-red-600"
                  />
                </FormField>

                <FormField label="Revision Reason & Justification" required className="md:col-span-2" error={errors.reason}>
                  <Textarea
                    rows={3}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Describe specific engineering variations, market inflation, or extra quantities required..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="rev-form"
            submitLabel={editingRev ? 'Update Proposal' : 'Submit Revision Proposal'}
            onCancel={() => { setIsAddOpen(false); setEditingRev(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteRev)}
        title="Delete Revision Request"
        message={`Are you sure you want to delete Revision #${deleteRev?.revision_no}?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRev(null)}
      />
    </PageContainer>
  );
}

export function BudgetRevisionsPage() {
  return (
    <UnderDevelopment 
      title="Budget Revisions" 
      featureName="Budget Management"
    />
  );
}
