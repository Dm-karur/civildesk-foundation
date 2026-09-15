import { useState, useEffect, useMemo } from 'react';
import {
  CalendarRange, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Plus, Edit, Trash2, Search, Filter, Eye, Layers,
  Milestone, ArrowRight, Activity, Flame, ShieldAlert, BarChart3
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


const EMPTY_FORM = {
  project_id: '',
  stage_code: '',
  stage_name: '',
  baseline_start: '',
  baseline_end: '',
  baseline_duration: '90',
  actual_start: '',
  actual_end: '',
  planned_progress_pct: '0',
  actual_progress_pct: '0',
  schedule_variance_days: '0',
  status: 'Not Started',
  milestones: '',
  mitigation_notes: '',
};

export function WorkProgrammePage() {
  const [projects, setProjects] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [viewingPkg, setViewingPkg] = useState(null);
  const [deletePkg, setDeletePkg] = useState(null);
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
      const saved = localStorage.getItem('mock_planning_WorkProgrammePage');
      if (saved) {
        setPackages(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_WorkProgrammePage');
    if (packages.length > 0 || saved) {
       localStorage.setItem('mock_planning_WorkProgrammePage', JSON.stringify(packages));
    }
  }, [packages]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const today = new Date().toISOString().split('T')[0];
    const targetEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      stage_code: `STG-0${packages.length + 1}`,
      baseline_start: today,
      baseline_end: targetEnd,
      baseline_duration: '90',
      actual_start: today,
      actual_end: targetEnd,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setForm({
      project_id: String(pkg.project_id || '1'),
      stage_code: pkg.stage_code || '',
      stage_name: pkg.stage_name || '',
      baseline_start: pkg.baseline_start || '',
      baseline_end: pkg.baseline_end || '',
      baseline_duration: String(pkg.baseline_duration || '90'),
      actual_start: pkg.actual_start || '',
      actual_end: pkg.actual_end || '',
      planned_progress_pct: String(pkg.planned_progress_pct || '0'),
      actual_progress_pct: String(pkg.actual_progress_pct || '0'),
      schedule_variance_days: String(pkg.schedule_variance_days || '0'),
      status: pkg.status || 'Not Started',
      milestones: pkg.milestones || '',
      mitigation_notes: pkg.mitigation_notes || '',
    });
    setErrors({});
    setEditingPkg(pkg);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'baseline_start' || field === 'baseline_end') {
        if (next.baseline_start && next.baseline_end) {
          const s = new Date(next.baseline_start);
          const e = new Date(next.baseline_end);
          const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
          next.baseline_duration = String(diff);
        }
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.stage_name.trim()) errs.stage_name = 'Stage title is required';
    if (!form.stage_code.trim()) errs.stage_code = 'Stage code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));

      const newPkg = {
        id: editingPkg?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        stage_code: form.stage_code,
        stage_name: form.stage_name,
        baseline_start: form.baseline_start,
        baseline_end: form.baseline_end,
        baseline_duration: Number(form.baseline_duration || 90),
        actual_start: form.actual_start || form.baseline_start,
        actual_end: form.actual_end || form.baseline_end,
        planned_progress_pct: Number(form.planned_progress_pct || 0),
        actual_progress_pct: Number(form.actual_progress_pct || 0),
        schedule_variance_days: Number(form.schedule_variance_days || 0),
        status: form.status,
        milestones: form.milestones,
        mitigation_notes: form.mitigation_notes,
      };

      if (editingPkg?.id) {
        setPackages(prev => prev.map(p => p.id === editingPkg.id ? newPkg : p));
        toast.success('Work Programme stage updated.');
      } else {
        setPackages(prev => [newPkg, ...prev]);
        toast.success('Work Programme stage added.');
      }

      setIsAddOpen(false);
      setEditingPkg(null);
    } catch {
      toast.error('Failed to save Work Programme.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deletePkg?.id) return;
    setPackages(prev => prev.filter(p => p.id !== deletePkg.id));
    toast.success('Programme stage deleted.');
    setDeletePkg(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return packages.filter(pkg => {
      if (selectedProjectId !== 'all' && String(pkg.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && pkg.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (pkg.stage_code || '').toLowerCase();
        const name = (pkg.stage_name || '').toLowerCase();
        const miles = (pkg.milestones || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !miles.includes(q)) return false;
      }
      return true;
    });
  }, [packages, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const avgPlanned = useMemo(() => {
    if (packages.length === 0) return 0;
    return Math.round(packages.reduce((acc, p) => acc + p.planned_progress_pct, 0) / packages.length);
  }, [packages]);

  const avgActual = useMemo(() => {
    if (packages.length === 0) return 0;
    return Math.round(packages.reduce((acc, p) => acc + p.actual_progress_pct, 0) / packages.length);
  }, [packages]);

  const onScheduleCount = useMemo(() => packages.filter(p => p.status === 'On Schedule' || p.status === 'Ahead of Schedule').length, [packages]);

  const getStatusVariant = (status) => {
    if (status === 'Ahead of Schedule') return 'primary';
    if (status === 'On Schedule') return 'success';
    if (status === 'Minor Delay' || status === 'Critical Delay') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Work Programme' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Master Work Programme & Baseline Schedule"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Programme Stages"
            value={packages.length}
            status="primary"
            icon={<CalendarRange className="w-4 h-4" />}
          />
          <KpiCard
            label="Planned Progress"
            value={`${avgPlanned}%`}
            status="neutral"
            icon={<Clock className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Actual Site Progress"
            value={`${avgActual}%`}
            status={avgActual >= avgPlanned ? 'success' : 'warning'}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Schedule Health"
            value={`${onScheduleCount} / ${packages.length} On Track`}
            status="success"
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
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
                  { value: 'Ahead of Schedule', label: 'Ahead of Schedule' },
                  { value: 'On Schedule', label: 'On Schedule' },
                  { value: 'Minor Delay', label: 'Minor Delay' },
                  { value: 'Not Started', label: 'Not Started' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search stage code, title, milestone..."
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
              Add Stage
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
                  <th className="px-3 py-2 w-24">Stage</th>
                  <th className="px-3 py-2">Master Programme Scope & Milestones</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Baseline Period</th>
                  <th className="px-3 py-2 w-36">Progress S-Curve (Plan vs Act)</th>
                  <th className="px-3 py-2 text-center w-24 hidden lg:table-cell">Variance</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading work programme...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No work programme packages found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((pkg, idx) => {
                    const isAhead = pkg.schedule_variance_days < 0;
                    const isDelayed = pkg.schedule_variance_days > 0;

                    return (
                      <tr key={pkg.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {pkg.stage_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={pkg.stage_name}>
                              {pkg.stage_name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {pkg.milestones}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex flex-col text-[10px] font-mono">
                            <span className="text-text-primary">{pkg.baseline_start}</span>
                            <span className="text-text-muted">to {pkg.baseline_end} ({pkg.baseline_duration}d)</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-text-muted">Plan: {pkg.planned_progress_pct}%</span>
                              <span className="font-bold text-primary">Act: {pkg.actual_progress_pct}%</span>
                            </div>
                            <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden flex border border-border/50">
                              <div
                                className="h-full bg-sky-400 opacity-60"
                                style={{ width: `${pkg.planned_progress_pct}%` }}
                                title={`Planned: ${pkg.planned_progress_pct}%`}
                              />
                              <div
                                className={`h-full -ml-full ${pkg.actual_progress_pct >= pkg.planned_progress_pct ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${pkg.actual_progress_pct}%` }}
                                title={`Actual: ${pkg.actual_progress_pct}%`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center hidden lg:table-cell font-mono text-[11px] font-semibold">
                          {pkg.schedule_variance_days === 0 ? (
                            <span className="text-text-muted">0d</span>
                          ) : (
                            <span className={isAhead ? 'text-emerald-600' : 'text-red-600'}>
                              {isAhead ? `${Math.abs(pkg.schedule_variance_days)}d ahead` : `+${pkg.schedule_variance_days}d delay`}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(pkg.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {pkg.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Stage Details"
                              onClick={() => setViewingPkg(pkg)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Stage"
                              onClick={() => handleOpenEdit(pkg)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeletePkg(pkg)}
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
          {paged.map((pkg, idx) => (
            <div key={pkg.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{pkg.stage_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{pkg.stage_name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(pkg.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {pkg.status}
                </Badge>
              </div>

              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-text-muted">Plan: {pkg.planned_progress_pct}%</span>
                  <span className="font-bold text-primary">Actual: {pkg.actual_progress_pct}%</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${pkg.actual_progress_pct >= pkg.planned_progress_pct ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pkg.actual_progress_pct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Baseline Finish</span>
                  <span className="font-mono text-text-primary text-[11px]">{pkg.baseline_end}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Variance</span>
                  <span className={`font-mono font-bold text-[11px] ${pkg.schedule_variance_days <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {pkg.schedule_variance_days <= 0 ? 'On Track' : `+${pkg.schedule_variance_days}d`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingPkg(pkg)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(pkg)}>
                  <Edit className="w-3.5 h-3.5 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeletePkg(pkg)}>
                  <Trash2 className="w-3.5 h-3.5 text-error" />
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

      {/* View Stage Modal */}
      {viewingPkg && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingPkg.stage_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingPkg.stage_code} • {viewingPkg.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingPkg(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Baseline Period</span> <span className="font-mono text-text-primary">{viewingPkg.baseline_start} to {viewingPkg.baseline_end}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Duration</span> <span className="font-mono font-bold text-primary">{viewingPkg.baseline_duration} Days</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Progress</span> <span className="font-mono">{viewingPkg.planned_progress_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Site Progress</span> <span className="font-bold text-emerald-600 font-mono text-sm">{viewingPkg.actual_progress_pct}%</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div>
                  <span className="font-bold text-text-primary block text-[11px]">Milestone Scope & Deliverables:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50">{viewingPkg.milestones}</p>
                </div>
                {viewingPkg.mitigation_notes && (
                  <div className="pt-2 border-t border-border">
                    <span className="font-bold text-text-primary block text-[11px]">Schedule Recovery / Mitigation Action:</span>
                    <p className="text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">{viewingPkg.mitigation_notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingPkg(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Stage Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingPkg)}
        onClose={() => { setIsAddOpen(false); setEditingPkg(null); }}
      >
        <EntityEditModal.Header
          icon={CalendarRange}
          title={editingPkg ? 'Edit Programme Stage' : 'Add Master Programme Stage'}
          subtitle="Define master schedule packages, baseline dates, S-curve targets, and milestones."
          onClose={() => { setIsAddOpen(false); setEditingPkg(null); }}
        />
        <form id="pkg-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Programme Classification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Stage Code" required error={errors.stage_code}>
                  <Input
                    value={form.stage_code}
                    onChange={(e) => handleFormChange('stage_code', e.target.value)}
                    placeholder="e.g. STG-01"
                  />
                </FormField>

                <FormField label="Programme Stage Name" required className="md:col-span-2" error={errors.stage_name}>
                  <Input
                    value={form.stage_name}
                    onChange={(e) => handleFormChange('stage_name', e.target.value)}
                    placeholder="e.g. Stage 1: Basement Excavation & Foundation Raft"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Baseline Targets & S-Curve Progress">
              <EntityEditModal.Grid>
                <FormField label="Baseline Start Date">
                  <Input
                    type="date"
                    value={form.baseline_start}
                    onChange={(e) => handleFormChange('baseline_start', e.target.value)}
                  />
                </FormField>

                <FormField label="Baseline Finish Date">
                  <Input
                    type="date"
                    value={form.baseline_end}
                    onChange={(e) => handleFormChange('baseline_end', e.target.value)}
                  />
                </FormField>

                <FormField label="Planned Progress Target (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.planned_progress_pct}
                    onChange={(e) => handleFormChange('planned_progress_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Actual Site Progress (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.actual_progress_pct}
                    onChange={(e) => handleFormChange('actual_progress_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Milestone Scope & Deliverables" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.milestones}
                    onChange={(e) => handleFormChange('milestones', e.target.value)}
                    placeholder="Describe major stage milestones, formwork cycles..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="pkg-form"
            submitLabel={editingPkg ? 'Update Stage' : 'Create Stage'}
            onCancel={() => { setIsAddOpen(false); setEditingPkg(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletePkg)}
        title="Delete Programme Stage"
        message={`Are you sure you want to delete "${deletePkg?.stage_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletePkg(null)}
      />
    </PageContainer>
  );
}
