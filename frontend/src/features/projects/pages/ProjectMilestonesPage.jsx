import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, Flag, Plus, Edit,
  Trash2, Search, Filter, TrendingUp, IndianRupee, Layers, Eye,
  Briefcase, ArrowRight, ShieldCheck
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
import { projectsApi, request, mastersApi } from '../../../api/apiservice';
import clsx from 'clsx';

const MILESTONE_PHASES = [
  { id: 'all', name: 'All Phases' },
  { id: 'foundation', name: 'Substructure & Foundation' },
  { id: 'superstructure', name: 'Superstructure & RCC' },
  { id: 'mep', name: 'MEP & Services' },
  { id: 'finishing', name: 'Finishing & Façade' },
  { id: 'handover', name: 'Testing, Commissioning & Handover' },
];



const EMPTY_FORM = {
  project_id: '',
  milestone_code: '',
  milestone_name: '',
  phase_id: 'foundation',
  weightage_percent: '',
  target_date: '',
  actual_date: '',
  linked_billing_amount: '',
  progress_percentage: '0',
  status: 'Pending',
  deliverables: '',
};

export function ProjectMilestonesPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activePhase, setActivePhase] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [viewingMilestone, setViewingMilestone] = useState(null);
  const [deleteMilestone, setDeleteMilestone] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [phases, setPhases] = useState(MILESTONE_PHASES);

  // Load Projects and Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, mileRes, mastersRes, stagesRes] = await Promise.all([
        projectsApi.list().catch(() => ({ data: { projects: [] } })),
        request.get('/project-milestones', { params: { per_page: 1000, all: true } }).catch(() => ({ data: { project_milestones: [] } })),
        mastersApi.all().catch(() => ({ data: {} })),
        request.get('/execution-stages').catch(() => null)
      ]);
      const pData = projRes?.data?.projects || projRes?.projects || (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pData) ? pData : []);
      
      const mData = mileRes?.data?.project_milestones ?? mileRes?.data?.milestones ?? mileRes?.project_milestones ?? mileRes?.milestones ?? mileRes?.data?.data ?? mileRes?.data ?? mileRes ?? [];
      setMilestones(Array.isArray(mData) ? mData : []);

      const rawStages = stagesRes?.data?.execution_stages ?? stagesRes?.data?.data ?? stagesRes?.data ?? mastersRes?.data?.execution_stages ?? mastersRes?.data?.project_phases ?? mastersRes?.data?.milestone_phases ?? mastersRes?.data?.phases ?? mastersRes?.data?.stages ?? [];
      if (Array.isArray(rawStages) && rawStages.length > 0) {
        setPhases([
          { id: 'all', name: 'All Phases' },
          ...rawStages.map(s => ({ id: String(s.id), name: s.name || s.stage_name || s.phase_name || s.title }))
        ]);
      }
    } catch (err) {
      toast.error('Failed to fetch data.');
      setProjects([]);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({
      ...EMPTY_FORM,
      project_id: selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1'),
      phase_id: phases.length > 1 ? phases[1].id : 'foundation',
      milestone_code: `MS-0${milestones.length + 1}`,
      target_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (m) => {
    setForm({
      project_id: String(m.project_id || '1'),
      milestone_code: m.milestone_code || '',
      milestone_name: m.milestone_name || '',
      phase_id: m.phase_id || 'foundation',
      weightage_percent: String(m.weightage_percent || ''),
      target_date: m.target_date ? m.target_date.split(' ')[0] : '',
      actual_date: m.actual_date ? m.actual_date.split(' ')[0] : '',
      linked_billing_amount: String(m.linked_billing_amount || ''),
      progress_percentage: String(m.progress_percentage || 0),
      status: m.status || 'Pending',
      deliverables: m.deliverables || '',
    });
    setErrors({});
    setEditingMilestone(m);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.milestone_name.trim()) errs.milestone_name = 'Name is required';
    if (!form.milestone_code.trim()) errs.milestone_code = 'Code is required';
    if (!form.target_date) errs.target_date = 'Target date is required';
    if (!form.project_id) errs.project_id = 'Project is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const phaseObj = phases.find(p => String(p.id) === String(form.phase_id));

      const PHASE_MAP = { 'foundation': 1, 'superstructure': 2, 'mep': 3, 'finishing': 4, 'handover': 5 };
      let mappedPhaseId = form.phase_id;
      if (isNaN(mappedPhaseId) && PHASE_MAP[mappedPhaseId]) {
         mappedPhaseId = PHASE_MAP[mappedPhaseId];
      } else if (isNaN(mappedPhaseId)) {
         mappedPhaseId = 1;
      }

      const newM = {
        project_id: Number(form.project_id),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        milestone_code: form.milestone_code,
        milestone_name: form.milestone_name,
        phase_id: mappedPhaseId,
        project_phase_id: mappedPhaseId,
        milestone_phase_id: mappedPhaseId,
        execution_stage_id: mappedPhaseId, // added for backend
        stage_id: mappedPhaseId, // fallback
        phase_name: phaseObj?.name || 'General Phase',
        weightage_percent: Number(form.weightage_percent || 0),
        target_date: form.target_date || null,
        actual_date: form.actual_date || null,
        linked_billing_amount: Number(form.linked_billing_amount || 0),
        progress_percentage: Number(form.progress_percentage || 0),
        status: form.status,
        deliverables: form.deliverables,
      };

      if (editingMilestone?.id) {
        const res = await request.patch(`/project-milestones/${encodeURIComponent(editingMilestone.id)}`, newM);
        const updated = res?.data?.data ?? res?.data ?? res ?? newM;
        setMilestones(prev => prev.map(m => String(m.id) === String(editingMilestone.id) ? { ...m, ...updated } : m));
        toast.success('Milestone updated successfully.');
      } else {
        const res = await request.post('/project-milestones', newM);
        const created = res?.data?.data ?? res?.data ?? res ?? { ...newM, id: Date.now() };
        setMilestones(prev => [created, ...prev]);
        toast.success('Milestone created successfully.');
      }

      setIsAddOpen(false);
      setEditingMilestone(null);
    } catch (err) {
      console.error('Milestone upload error:', err);
      let errMsg = err.message || 'Failed to save milestone.';
      const validationErrors = err.errors || err.response?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        const firstError = Array.isArray(Object.values(validationErrors)[0]) 
          ? Object.values(validationErrors)[0][0] 
          : Object.values(validationErrors)[0];
        errMsg = `${errMsg}: ${firstError}`;
      }
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMilestone?.id) return;
    try {
      await request.delete(`/project-milestones/${encodeURIComponent(deleteMilestone.id)}`);
      setMilestones(prev => prev.filter(m => String(m.id) !== String(deleteMilestone.id)));
      toast.success('Milestone deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete milestone.');
    } finally {
      setDeleteMilestone(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return milestones.filter(m => {
      if (selectedProjectId !== 'all' && String(m.project_id) !== String(selectedProjectId)) return false;
      if (activePhase !== 'all') {
        const PHASE_MAP = { 'foundation': '1', 'superstructure': '2', 'mep': '3', 'finishing': '4', 'handover': '5' };
        const expectedId = PHASE_MAP[activePhase] || activePhase;
        const mPhaseId = String(m.phase_id || m.execution_stage_id || m.project_phase_id || m.stage_id);
        if (mPhaseId !== expectedId && mPhaseId !== activePhase) return false;
      }
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (m.milestone_code || '').toLowerCase();
        const name = (m.milestone_name || '').toLowerCase();
        const pCode = (m.project_code || '').toLowerCase();
        const deliv = (m.deliverables || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !pCode.includes(q) && !deliv.includes(q)) return false;
      }
      return true;
    });
  }, [milestones, selectedProjectId, activePhase, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const completedCount = useMemo(() => milestones.filter(m => m.status === 'Completed').length, [milestones]);
  const inProgressCount = useMemo(() => milestones.filter(m => m.status === 'In Progress').length, [milestones]);
  const totalBillingValue = useMemo(() => milestones.reduce((acc, m) => acc + Number(m.linked_billing_amount || 0), 0), [milestones]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('completed')) return 'success';
    if (s.includes('progress')) return 'info';
    if (s.includes('delayed') || s.includes('critical')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Milestones' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Milestones & Deliverables"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Milestones"
            value={milestones.length}
            status="primary"
            icon={<Flag className="w-4 h-4" />}
          />
          <KpiCard
            label="Completed Deliverables"
            value={`${completedCount} / ${milestones.length}`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active In-Progress"
            value={inProgressCount}
            status="info"
            icon={<Clock className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Linked Milestone Value"
            value={`₹${totalBillingValue.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'all', label: 'All Projects (Consolidated)' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search milestone, code, scope..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Delayed', label: 'Delayed' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
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
              Add Milestone
            </Button>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {phases.map(phase => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                activePhase === phase.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {phase.name}
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
                totalResults={filtered.length}
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
                  <th className="px-3 py-2">Milestone & Stage</th>
                  <th className="px-3 py-2 hidden md:table-cell">Project</th>
                  <th className="px-3 py-2 text-center w-20">Weight %</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Target Date</th>
                  <th className="px-3 py-2 text-right">Trigger Value</th>
                  <th className="px-3 py-2 w-28">Progress</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading project milestones...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No milestones found for this selection.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => {
                    const billingVal = Number(m.linked_billing_amount || 0);

                    return (
                      <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {m.milestone_code}
                              </span>
                              <span className="font-semibold text-text-primary text-[12px] truncate" title={m.milestone_name}>
                                {m.milestone_name}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-muted mt-0.5">
                              {m.phase_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-text-primary text-[11px] font-medium truncate block" title={m.project_name}>
                            {m.project_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-semibold text-text-secondary text-[11px]">
                          {m.weightage_percent}%
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell font-mono text-[11px] text-text-secondary">
                          <div className="flex flex-col">
                            <span>{m.target_date || '—'}</span>
                            {m.actual_date && (
                              <span className="text-[10px] text-emerald-600">Done: {m.actual_date}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[12px] font-bold text-text-primary">
                          {billingVal > 0 ? `₹${billingVal.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  m.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'
                                }`}
                                style={{ width: `${m.progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-text-secondary w-7 text-right">
                              {m.progress_percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(m.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {m.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Deliverable Scope"
                              onClick={() => setViewingMilestone(m)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Milestone"
                              onClick={() => handleOpenEdit(m)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteMilestone(m)}
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
          {loading ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading project milestones...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No milestones found.
            </div>
          ) : (
            paged.map((m, idx) => {
              const billingVal = Number(m.linked_billing_amount || 0);

              return (
                <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {m.milestone_code}
                        </span>
                        <span className="text-[10px] text-text-muted">{m.phase_name}</span>
                      </div>
                      <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.milestone_name}</h4>
                    </div>
                    <Badge
                      variant={getStatusVariant(m.status)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                    >
                      {m.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-border/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted text-[11px]">Progress:</span>
                      <span className="font-mono font-bold text-text-primary">{m.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${m.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Target Date</span>
                      <span className="font-mono text-text-secondary text-[11px]">{m.target_date || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Trigger Value</span>
                      <span className="font-mono font-bold text-text-primary text-[11px]">
                        {billingVal > 0 ? `₹${billingVal.toLocaleString('en-IN')}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2"
                      onClick={() => setViewingMilestone(m)}
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenEdit(m)}
                    >
                      <Edit className="w-3.5 h-3.5 text-text-secondary" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalResults={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View Deliverable Modal */}
      {viewingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingMilestone.milestone_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingMilestone.milestone_code} • {viewingMilestone.phase_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingMilestone(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Weightage</span> <span className="font-mono font-bold text-text-primary">{viewingMilestone.weightage_percent}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-primary">{viewingMilestone.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Date</span> <span className="font-mono">{viewingMilestone.target_date || '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Billing Trigger</span> <span className="font-mono font-bold text-emerald-600">₹{Number(viewingMilestone.linked_billing_amount || 0).toLocaleString('en-IN')}</span></div>
              </div>

              {viewingMilestone.deliverables && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Deliverables & Scope Description:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{viewingMilestone.deliverables}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingMilestone(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Milestone Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingMilestone)}
        onClose={() => { setIsAddOpen(false); setEditingMilestone(null); }}
      >
        <EntityEditModal.Header
          icon={Flag}
          title={editingMilestone ? 'Edit Project Milestone' : 'Add Project Milestone'}
          subtitle="Define schedule stages, weightage, and milestone billing triggers."
          onClose={() => { setIsAddOpen(false); setEditingMilestone(null); }}
        />
        <form id="milestone-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Milestone Identification">
              <EntityEditModal.Grid>
                <FormField label="Target Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Execution Phase / Stage" required>
                  <Select
                    options={phases.filter(p => p.id !== 'all').map(p => ({ value: p.id, label: p.name }))}
                    value={form.phase_id}
                    onChange={(v) => handleFormChange('phase_id', v)}
                  />
                </FormField>

                <FormField label="Milestone Code" required error={errors.milestone_code}>
                  <Input
                    value={form.milestone_code}
                    onChange={(e) => handleFormChange('milestone_code', e.target.value)}
                    placeholder="e.g. MS-01"
                  />
                </FormField>

                <FormField label="Milestone Name" required className="md:col-span-2" error={errors.milestone_name}>
                  <Input
                    value={form.milestone_name}
                    onChange={(e) => handleFormChange('milestone_name', e.target.value)}
                    placeholder="e.g. Raft Foundation Casting & Curing Complete"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Schedule, Commercials & Progress">
              <EntityEditModal.Grid>
                <FormField label="Target Date" required error={errors.target_date}>
                  <Input
                    type="date"
                    value={form.target_date}
                    onChange={(e) => handleFormChange('target_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Actual Completion Date">
                  <Input
                    type="date"
                    value={form.actual_date}
                    onChange={(e) => handleFormChange('actual_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Project Weightage (%)">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="e.g. 15"
                    value={form.weightage_percent}
                    onChange={(e) => handleFormChange('weightage_percent', e.target.value)}
                  />
                </FormField>

                <FormField label="Linked Billing Amount (₹)">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.linked_billing_amount}
                    onChange={(e) => handleFormChange('linked_billing_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Progress Percentage (%)">
                  <Input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={form.progress_percentage}
                    onChange={(e) => handleFormChange('progress_percentage', e.target.value)}
                  />
                </FormField>

                <FormField label="Milestone Status">
                  <Select
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Delayed', label: 'Delayed / Critical' },
                    ]}
                    value={form.status}
                    onChange={(v) => handleFormChange('status', v)}
                  />
                </FormField>

                <FormField label="Deliverables & Quality Criteria" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.deliverables}
                    onChange={(e) => handleFormChange('deliverables', e.target.value)}
                    placeholder="e.g. Concrete cube strength report approval and joint client site inspection."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="milestone-form"
            submitLabel={editingMilestone ? 'Update Milestone' : 'Create Milestone'}
            onCancel={() => { setIsAddOpen(false); setEditingMilestone(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteMilestone)}
        title="Delete Milestone"
        message={`Are you sure you want to delete "${deleteMilestone?.milestone_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteMilestone(null)}
      />
    </PageContainer>
  );
}
