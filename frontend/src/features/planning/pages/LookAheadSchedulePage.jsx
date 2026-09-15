import { useState, useEffect, useMemo } from 'react';
import {
  FastForward, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, Calendar,
  Layers, Users, PackageCheck, FileCheck, HardHat, AlertCircle
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

const WINDOW_OPTIONS = [
  { id: '2w', name: '2-Week Lookahead' },
  { id: '3w', name: '3-Week Lookahead (Standard)' },
  { id: '4w', name: '4-Week Lookahead' },
  { id: '6w', name: '6-Week Lookahead' },
];



const EMPTY_FORM = {
  project_id: '',
  task_code: '',
  title: '',
  zone_name: '',
  start_date: '',
  end_date: '',
  duration_days: '14',
  target_quantity: '0',
  uom_name: 'Cu.M',
  crew_size: '10',
  drawings_ready: true,
  materials_ready: true,
  permit_ready: true,
  subcontractor_ready: true,
  readiness_status: 'Ready to Execute',
  constraint_notes: '',
};

export function LookAheadSchedulePage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedWindow, setSelectedWindow] = useState('3w');
  const [readinessFilter, setReadinessFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
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
      const saved = localStorage.getItem('mock_planning_LookAheadSchedulePage');
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_LookAheadSchedulePage');
    if (tasks.length > 0 || saved) {
       localStorage.setItem('mock_planning_LookAheadSchedulePage', JSON.stringify(tasks));
    }
  }, [tasks]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const today = new Date().toISOString().split('T')[0];
    const targetEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      task_code: `LAK-0${tasks.length + 1}01`,
      start_date: today,
      end_date: targetEnd,
      duration_days: '14',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (task) => {
    setForm({
      project_id: String(task.project_id || '1'),
      task_code: task.task_code || '',
      title: task.title || '',
      zone_name: task.zone_name || '',
      start_date: task.start_date || '',
      end_date: task.end_date || '',
      duration_days: String(task.duration_days || '14'),
      target_quantity: String(task.target_quantity || '0'),
      uom_name: task.uom_name || 'Cu.M',
      crew_size: String(task.crew_size || '10'),
      drawings_ready: Boolean(task.drawings_ready),
      materials_ready: Boolean(task.materials_ready),
      permit_ready: Boolean(task.permit_ready),
      subcontractor_ready: Boolean(task.subcontractor_ready),
      readiness_status: task.readiness_status || 'Ready to Execute',
      constraint_notes: task.constraint_notes || '',
    });
    setErrors({});
    setEditingTask(task);
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
      if (['drawings_ready', 'materials_ready', 'permit_ready', 'subcontractor_ready'].includes(field)) {
        if (!next.drawings_ready) next.readiness_status = 'Drawing Pending';
        else if (!next.materials_ready) next.readiness_status = 'Material Pending';
        else if (!next.permit_ready || !next.subcontractor_ready) next.readiness_status = 'Constraint Flagged';
        else next.readiness_status = 'Ready to Execute';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Task title is required';
    if (!form.task_code.trim()) errs.task_code = 'Task code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));

      const newTask = {
        id: editingTask?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        task_code: form.task_code,
        title: form.title,
        zone_name: form.zone_name || 'General Site',
        start_date: form.start_date,
        end_date: form.end_date,
        duration_days: Number(form.duration_days || 14),
        target_quantity: Number(form.target_quantity || 0),
        uom_name: form.uom_name,
        crew_size: Number(form.crew_size || 10),
        drawings_ready: form.drawings_ready,
        materials_ready: form.materials_ready,
        permit_ready: form.permit_ready,
        subcontractor_ready: form.subcontractor_ready,
        readiness_status: form.readiness_status,
        constraint_notes: form.constraint_notes,
      };

      if (editingTask?.id) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? newTask : t));
        toast.success('Lookahead task updated.');
      } else {
        setTasks(prev => [newTask, ...prev]);
        toast.success('Lookahead task added to window.');
      }

      setIsAddOpen(false);
      setEditingTask(null);
    } catch {
      toast.error('Failed to save Lookahead task.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteTask?.id) return;
    setTasks(prev => prev.filter(t => t.id !== deleteTask.id));
    toast.success('Lookahead task removed.');
    setDeleteTask(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (selectedProjectId !== 'all' && String(t.project_id) !== String(selectedProjectId)) return false;
      if (readinessFilter !== 'all' && t.readiness_status !== readinessFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (t.task_code || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const zone = (t.zone_name || '').toLowerCase();
        const notes = (t.constraint_notes || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !zone.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, readinessFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const readyCount = useMemo(() => tasks.filter(t => t.readiness_status === 'Ready to Execute').length, [tasks]);
  const constraintCount = useMemo(() => tasks.filter(t => t.readiness_status !== 'Ready to Execute').length, [tasks]);
  const totalCrew = useMemo(() => tasks.reduce((acc, t) => acc + Number(t.crew_size || 0), 0), [tasks]);

  const getStatusVariant = (status) => {
    if (status === 'Ready to Execute') return 'success';
    if (status === 'Material Pending' || status === 'Constraint Flagged') return 'warning';
    if (status === 'Drawing Pending') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Look-Ahead Schedule' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Look-Ahead Construction Schedule (3-6 Week Window)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Active Lookahead Tasks"
            value={tasks.length}
            status="primary"
            icon={<FastForward className="w-4 h-4" />}
          />
          <KpiCard
            label="Ready for Execution"
            value={readyCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Constraints / Bottlenecks"
            value={constraintCount}
            status={constraintCount > 0 ? 'warning' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Total Deployed Crew"
            value={`${totalCrew} Workers`}
            status="neutral"
            icon={<Users className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Lookahead Window Selector Bar */}
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

            <div className="w-full sm:w-44">
              <Select
                options={WINDOW_OPTIONS.map(w => ({ value: w.id, label: w.name }))}
                value={selectedWindow}
                onChange={setSelectedWindow}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Readiness' },
                  { value: 'Ready to Execute', label: 'Ready to Execute' },
                  { value: 'Material Pending', label: 'Material Pending' },
                  { value: 'Drawing Pending', label: 'Drawing Pending' },
                ]}
                value={readinessFilter}
                onChange={setReadinessFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search lookahead task, zone..."
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
              Add Task
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
                  <th className="px-3 py-2 w-28">Task Code</th>
                  <th className="px-3 py-2">Lookahead Task & Zone</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Target Window</th>
                  <th className="px-3 py-2 text-right w-28">Target Output</th>
                  <th className="px-3 py-2 text-center w-36 hidden lg:table-cell">Prerequisites</th>
                  <th className="px-3 py-2 text-center w-28">Readiness</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading lookahead schedule...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No lookahead tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {t.task_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={t.title}>
                            {t.title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {t.zone_name} • {t.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col text-[10px] font-mono">
                          <span className="text-text-primary">{t.start_date}</span>
                          <span className="text-text-muted">to {t.end_date} ({t.duration_days}d)</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">
                        <span className="font-bold text-primary">{t.target_quantity} {t.uom_name}</span>
                        <span className="text-[10px] text-text-muted block">({t.crew_size} workers)</span>
                      </td>
                      <td className="px-3 py-2 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono">
                          <span className={`px-1 py-0.5 rounded ${t.drawings_ready ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`} title="Drawings Ready">
                            DWG
                          </span>
                          <span className={`px-1 py-0.5 rounded ${t.materials_ready ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`} title="Materials in Store">
                            MAT
                          </span>
                          <span className={`px-1 py-0.5 rounded ${t.permit_ready ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`} title="Permit to Work">
                            PTW
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(t.readiness_status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {t.readiness_status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Lookahead 360"
                            onClick={() => setViewingTask(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Task"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteTask(t)}
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
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{t.task_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.title}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(t.readiness_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {t.readiness_status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Target Window</span>
                  <span className="font-mono text-text-primary text-[11px]">{t.start_date} to {t.end_date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Target Output</span>
                  <span className="font-mono font-bold text-primary text-[11px]">{t.target_quantity} {t.uom_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{t.zone_name}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingTask(t)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(t)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteTask(t)}>
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

      {/* View Task Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FastForward className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingTask.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingTask.task_code} • {viewingTask.zone_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingTask(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Execution Window</span> <span className="font-mono text-text-primary">{viewingTask.start_date} to {viewingTask.end_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Output</span> <span className="font-bold text-primary font-mono">{viewingTask.target_quantity} {viewingTask.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Crew Size</span> <span className="font-medium text-text-primary">{viewingTask.crew_size} Workers</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Readiness</span> <span className="font-semibold text-emerald-600">{viewingTask.readiness_status}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <span className="font-bold text-text-primary block text-[11px]">Prerequisite Readiness Verification:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">{viewingTask.drawings_ready ? '✅' : '❌'} GFC Drawings Approved</div>
                  <div className="flex items-center gap-1.5">{viewingTask.materials_ready ? '✅' : '❌'} Materials In Site Store</div>
                  <div className="flex items-center gap-1.5">{viewingTask.permit_ready ? '✅' : '❌'} Safety Permit to Work (PTW)</div>
                  <div className="flex items-center gap-1.5">{viewingTask.subcontractor_ready ? '✅' : '❌'} Subcontractor Gang Ready</div>
                </div>
              </div>

              {viewingTask.constraint_notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Mitigation & Constraint Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50">{viewingTask.constraint_notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingTask(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingTask)}
        onClose={() => { setIsAddOpen(false); setEditingTask(null); }}
      >
        <EntityEditModal.Header
          icon={FastForward}
          title={editingTask ? 'Edit Lookahead Task' : 'Add 3-6 Week Lookahead Task'}
          subtitle="Anticipate upcoming construction activities and verify site prerequisites."
          onClose={() => { setIsAddOpen(false); setEditingTask(null); }}
        />
        <form id="lak-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Task Identification & Location">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Task Code" required error={errors.task_code}>
                  <Input
                    value={form.task_code}
                    onChange={(e) => handleFormChange('task_code', e.target.value)}
                    placeholder="e.g. LAK-0201-COL"
                  />
                </FormField>

                <FormField label="Work Zone / Specific Grid" className="md:col-span-2">
                  <Input
                    value={form.zone_name}
                    onChange={(e) => handleFormChange('zone_name', e.target.value)}
                    placeholder="e.g. Podium Level 2 East Grid"
                  />
                </FormField>

                <FormField label="Task Title & Scope" required className="md:col-span-2" error={errors.title}>
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Podium Level 2 Column Shuttering & Concrete Pour"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Target Window & Prerequisites">
              <EntityEditModal.Grid>
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Finish Date">
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => handleFormChange('end_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Target Quantity">
                  <Input
                    type="number"
                    value={form.target_quantity}
                    onChange={(e) => handleFormChange('target_quantity', e.target.value)}
                  />
                </FormField>

                <FormField label="Required Gang / Crew Size">
                  <Input
                    type="number"
                    value={form.crew_size}
                    onChange={(e) => handleFormChange('crew_size', e.target.value)}
                  />
                </FormField>

                <FormField label="Constraint Notes & Action Plan" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.constraint_notes}
                    onChange={(e) => handleFormChange('constraint_notes', e.target.value)}
                    placeholder="State material delivery dates, crane slots, inspection dates..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="lak-form"
            submitLabel={editingTask ? 'Update Task' : 'Add to Lookahead'}
            onCancel={() => { setIsAddOpen(false); setEditingTask(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTask)}
        title="Delete Lookahead Task"
        message={`Are you sure you want to delete "${deleteTask?.task_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTask(null)}
      />
    </PageContainer>
  );
}
