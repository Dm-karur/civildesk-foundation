import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, CheckCircle2, Clock, AlertTriangle, PlayCircle,
  Plus, Edit, Trash2, Search, Filter, Eye, Layers,
  ListOrdered, GitCommit, ArrowRight, UserCheck, Flame, Percent
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

const PHASES = [
  { id: 'all', name: 'All WBS Phases' },
  { id: 'substructure', name: 'Phase 1: Substructure & Foundation' },
  { id: 'superstructure', name: 'Phase 2: Superstructure & RCC Framing' },
  { id: 'mep', name: 'Phase 3: MEP & Building Services' },
  { id: 'finishes', name: 'Phase 4: Architectural & Finishes' },
  { id: 'handover', name: 'Phase 5: Testing & Handover' },
];



const EMPTY_FORM = {
  project_id: '',
  activity_code: '',
  name: '',
  phase_id: 'substructure',
  zone_name: '',
  start_date: '',
  end_date: '',
  duration_days: '30',
  progress_pct: '0',
  is_critical: false,
  predecessor: '',
  assigned_to: '',
  status: 'Not Started',
};

export function PlanningActivitiesPage() {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAct, setEditingAct] = useState(null);
  const [viewingAct, setViewingAct] = useState(null);
  const [deleteAct, setDeleteAct] = useState(null);
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
      const saved = localStorage.getItem('mock_planning_PlanningActivitiesPage');
      if (saved) {
        setActivities(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_PlanningActivitiesPage');
    if (activities.length > 0 || saved) {
       localStorage.setItem('mock_planning_PlanningActivitiesPage', JSON.stringify(activities));
    }
  }, [activities]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const today = new Date().toISOString().split('T')[0];
    const targetEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      activity_code: `ACT-0${activities.length + 1}01`,
      start_date: today,
      end_date: targetEnd,
      duration_days: '30',
      assigned_to: 'Site Incharge',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (act) => {
    setForm({
      project_id: String(act.project_id || '1'),
      activity_code: act.activity_code || '',
      name: act.name || '',
      phase_id: act.phase_id || 'substructure',
      zone_name: act.zone_name || '',
      start_date: act.start_date || '',
      end_date: act.end_date || '',
      duration_days: String(act.duration_days || '30'),
      progress_pct: String(act.progress_pct || '0'),
      is_critical: Boolean(act.is_critical),
      predecessor: act.predecessor || '',
      assigned_to: act.assigned_to || '',
      status: act.status || 'Not Started',
    });
    setErrors({});
    setEditingAct(act);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'start_date' || field === 'end_date') {
        if (next.start_date && next.end_date) {
          const s = new Date(next.start_date);
          const e = new Date(next.end_date);
          const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
          next.duration_days = String(diff);
        }
      }
      if (field === 'progress_pct') {
        const p = Number(value);
        if (p >= 100) next.status = 'Completed';
        else if (p > 0) next.status = 'In Progress';
        else next.status = 'Not Started';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Activity title is required';
    if (!form.activity_code.trim()) errs.activity_code = 'Activity code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const phaseObj = PHASES.find(p => p.id === form.phase_id);

      const newAct = {
        id: editingAct?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        activity_code: form.activity_code,
        name: form.name,
        phase_id: form.phase_id,
        phase_name: phaseObj?.name || 'Substructure',
        zone_name: form.zone_name || 'General Site',
        start_date: form.start_date,
        end_date: form.end_date,
        duration_days: Number(form.duration_days || 30),
        progress_pct: Number(form.progress_pct || 0),
        is_critical: Boolean(form.is_critical),
        predecessor: form.predecessor || 'None',
        assigned_to: form.assigned_to,
        status: form.status,
      };

      if (editingAct?.id) {
        setActivities(prev => prev.map(a => a.id === editingAct.id ? newAct : a));
        toast.success('Activity updated successfully.');
      } else {
        setActivities(prev => [newAct, ...prev]);
        toast.success('WBS Activity added.');
      }

      setIsAddOpen(false);
      setEditingAct(null);
    } catch {
      toast.error('Failed to save Activity.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteAct?.id) return;
    setActivities(prev => prev.filter(a => a.id !== deleteAct.id));
    toast.success('Activity deleted.');
    setDeleteAct(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return activities.filter(act => {
      if (selectedProjectId !== 'all' && String(act.project_id) !== String(selectedProjectId)) return false;
      if (phaseFilter !== 'all' && act.phase_id !== phaseFilter) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'Critical' && !act.is_critical) return false;
        if (statusFilter !== 'Critical' && act.status !== statusFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const code = (act.activity_code || '').toLowerCase();
        const name = (act.name || '').toLowerCase();
        const zone = (act.zone_name || '').toLowerCase();
        const resp = (act.assigned_to || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !zone.includes(q) && !resp.includes(q)) return false;
      }
      return true;
    });
  }, [activities, selectedProjectId, phaseFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const completedCount = useMemo(() => activities.filter(a => a.status === 'Completed').length, [activities]);
  const inProgressCount = useMemo(() => activities.filter(a => a.status === 'In Progress').length, [activities]);
  const criticalCount = useMemo(() => activities.filter(a => a.is_critical).length, [activities]);
  const avgProgress = useMemo(() => {
    if (activities.length === 0) return 0;
    const sum = activities.reduce((acc, a) => acc + Number(a.progress_pct || 0), 0);
    return Math.round(sum / activities.length);
  }, [activities]);

  const getStatusVariant = (status) => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'primary';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Activities Master' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Work Breakdown & Activities (WBS)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total WBS Activities"
            value={activities.length}
            status="primary"
            icon={<ListOrdered className="w-4 h-4" />}
          />
          <KpiCard
            label="Completed Milestones"
            value={completedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="In Progress / Active"
            value={inProgressCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Critical Path (CPM)"
            value={`${criticalCount} Tasks`}
            status={criticalCount > 0 ? 'error' : 'neutral'}
            icon={<Flame className="w-4 h-4 text-red-500" />}
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

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Critical', label: 'Critical Path' },
                  { value: 'Not Started', label: 'Not Started' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search activity code, name, zone..."
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
              Add Activity
            </Button>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {PHASES.map(ph => (
            <button
              key={ph.id}
              onClick={() => setPhaseFilter(ph.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                phaseFilter === ph.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {ph.name}
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
                  <th className="px-3 py-2 w-28">Activity Code</th>
                  <th className="px-3 py-2">Activity Description & Zone</th>
                  <th className="px-3 py-2 hidden md:table-cell">Duration</th>
                  <th className="px-3 py-2 w-36">Schedule Dates</th>
                  <th className="px-3 py-2 w-32">Progress %</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading WBS activities...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No WBS activities found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((act, idx) => (
                    <tr key={act.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {act.activity_code}
                          </span>
                          {act.is_critical && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-500/10 px-1 rounded border border-red-500/20" title="Critical Path Activity">
                              CPM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={act.name}>
                            {act.name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {act.zone_name} • {act.phase_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {act.duration_days} Days
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col text-[10px] font-mono">
                          <span className="text-text-primary">{act.start_date}</span>
                          <span className="text-text-muted">to {act.end_date}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-text-primary">{act.progress_pct}%</span>
                          </div>
                          <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden border border-border/50">
                            <div
                              className={`h-full rounded-full transition-all ${
                                act.progress_pct === 100
                                  ? 'bg-emerald-500'
                                  : act.is_critical
                                  ? 'bg-red-500'
                                  : 'bg-primary'
                              }`}
                              style={{ width: `${act.progress_pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(act.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {act.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Activity Details"
                            onClick={() => setViewingAct(act)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Activity"
                            onClick={() => handleOpenEdit(act)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteAct(act)}
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
          {paged.map((act, idx) => (
            <div key={act.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-mono text-[10px] font-bold text-primary block">{act.activity_code}</span>
                    {act.is_critical && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-500/10 px-1 rounded">CPM</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{act.name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(act.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {act.status}
                </Badge>
              </div>

              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-text-muted">Progress</span>
                  <span className="font-bold text-primary">{act.progress_pct}%</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${act.progress_pct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${act.progress_pct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Duration</span>
                  <span className="font-mono text-text-primary text-[11px]">{act.duration_days} Days</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Finish Date</span>
                  <span className="font-mono font-medium text-text-primary text-[11px]">{act.end_date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{act.zone_name}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingAct(act)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(act)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteAct(act)}>
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

      {/* View Activity Modal */}
      {viewingAct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingAct.name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingAct.activity_code} • {viewingAct.phase_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingAct(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Period</span> <span className="font-mono text-text-primary">{viewingAct.start_date} to {viewingAct.end_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Duration</span> <span className="font-mono font-bold text-primary">{viewingAct.duration_days} Days</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Progress</span> <span className="font-bold text-emerald-600 font-mono text-sm">{viewingAct.progress_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Critical Path</span> <span className={viewingAct.is_critical ? 'font-bold text-red-600' : 'text-text-secondary'}>{viewingAct.is_critical ? 'Yes (CPM Critical)' : 'No'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Predecessor</span> <span className="font-mono text-text-secondary">{viewingAct.predecessor || 'None'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned To</span> <span className="font-medium text-text-primary">{viewingAct.assigned_to}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingAct(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingAct)}
        onClose={() => { setIsAddOpen(false); setEditingAct(null); }}
      >
        <EntityEditModal.Header
          icon={ListOrdered}
          title={editingAct ? 'Edit WBS Activity' : 'Add WBS Schedule Activity'}
          subtitle="Define project activity scheduling, durations, dependencies, and critical path."
          onClose={() => { setIsAddOpen(false); setEditingAct(null); }}
        />
        <form id="act-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="WBS Phase & Classification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="WBS Phase / Stage" required>
                  <Select
                    options={PHASES.filter(p => p.id !== 'all').map(p => ({ value: p.id, label: p.name }))}
                    value={form.phase_id}
                    onChange={(v) => handleFormChange('phase_id', v)}
                  />
                </FormField>

                <FormField label="Activity Code" required error={errors.activity_code}>
                  <Input
                    value={form.activity_code}
                    onChange={(e) => handleFormChange('activity_code', e.target.value)}
                    placeholder="e.g. ACT-0101-EXC"
                  />
                </FormField>

                <FormField label="Work Zone / Location">
                  <Input
                    value={form.zone_name}
                    onChange={(e) => handleFormChange('zone_name', e.target.value)}
                    placeholder="e.g. Basement 1 & 2 / Grid A1-D6"
                  />
                </FormField>

                <FormField label="Activity Name & Scope" required className="md:col-span-2" error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g. Basement Mass Excavation & Soil Stacking"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Schedule Period & Progress">
              <EntityEditModal.Grid>
                <FormField label="Planned Start Date">
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Planned End Date">
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => handleFormChange('end_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Duration (Days)">
                  <Input
                    type="number"
                    value={form.duration_days}
                    onChange={(e) => handleFormChange('duration_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Completion Progress (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress_pct}
                    onChange={(e) => handleFormChange('progress_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Predecessor Dependency" className="md:col-span-1">
                  <Input
                    value={form.predecessor}
                    onChange={(e) => handleFormChange('predecessor', e.target.value)}
                    placeholder="e.g. ACT-0101 (FS)"
                  />
                </FormField>

                <FormField label="Assigned Team / Incharge" className="md:col-span-1">
                  <Input
                    value={form.assigned_to}
                    onChange={(e) => handleFormChange('assigned_to', e.target.value)}
                    placeholder="e.g. Arun Prakash / Earthworks Agency"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="act-form"
            submitLabel={editingAct ? 'Update Activity' : 'Create Activity'}
            onCancel={() => { setIsAddOpen(false); setEditingAct(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteAct)}
        title="Delete WBS Activity"
        message={`Are you sure you want to delete "${deleteAct?.activity_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAct(null)}
      />
    </PageContainer>
  );
}
