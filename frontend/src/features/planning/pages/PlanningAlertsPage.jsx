import { useState, useEffect, useMemo } from 'react';
import {
  Bell, AlertTriangle, Flame, ShieldAlert, CheckCircle2,
  Clock, Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  HardHat, Boxes, FileQuestion, CloudRain, Check, AlertCircle
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

const ALERT_CATEGORIES = [
  { id: 'all', name: 'All Alert Categories' },
  { id: 'schedule', name: 'Critical Path Slippage' },
  { id: 'material', name: 'Material Stockout & Delay' },
  { id: 'labour', name: 'Labour Shortage & Productivity' },
  { id: 'technical', name: 'Drawing & Technical RFI' },
  { id: 'weather', name: 'Weather & Site Obstruction' },
];



const EMPTY_FORM = {
  project_id: '',
  alert_code: '',
  title: '',
  category_id: 'schedule',
  priority: 'Critical',
  impacted_scope: '',
  assigned_to: '',
  mitigation_plan: '',
  status: 'Active',
};

export function PlanningAlertsPage() {
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [viewingAlert, setViewingAlert] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState(null);
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
      const saved = localStorage.getItem('mock_planning_PlanningAlertsPage');
      if (saved) {
        setAlerts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_planning_PlanningAlertsPage');
    if (alerts.length > 0 || saved) {
       localStorage.setItem('mock_planning_PlanningAlertsPage', JSON.stringify(alerts));
    }
  }, [alerts]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      alert_code: `ALT-GEN-0${alerts.length + 1}`,
      assigned_to: 'Project Engineer',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (alt) => {
    setForm({
      project_id: String(alt.project_id || '1'),
      alert_code: alt.alert_code || '',
      title: alt.title || '',
      category_id: alt.category_id || 'schedule',
      priority: alt.priority || 'Critical',
      impacted_scope: alt.impacted_scope || '',
      assigned_to: alt.assigned_to || '',
      mitigation_plan: alt.mitigation_plan || '',
      status: alt.status || 'Active',
    });
    setErrors({});
    setEditingAlert(alt);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Alert title is required';
    if (!form.alert_code.trim()) errs.alert_code = 'Alert code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const catObj = ALERT_CATEGORIES.find(c => c.id === form.category_id);

      const newAlert = {
        id: editingAlert?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        alert_code: form.alert_code,
        title: form.title,
        category_id: form.category_id,
        category_name: catObj?.name || 'Schedule Early Warning',
        priority: form.priority,
        triggered_at: editingAlert?.triggered_at || new Date().toISOString().split('T')[0],
        aging_days: editingAlert ? editingAlert.aging_days : 0,
        impacted_scope: form.impacted_scope || 'General Schedule',
        assigned_to: form.assigned_to,
        mitigation_plan: form.mitigation_plan,
        status: form.status,
      };

      if (editingAlert?.id) {
        setAlerts(prev => prev.map(a => a.id === editingAlert.id ? newAlert : a));
        toast.success('Alert updated.');
      } else {
        setAlerts(prev => [newAlert, ...prev]);
        toast.success('New project alert logged.');
      }

      setIsAddOpen(false);
      setEditingAlert(null);
    } catch {
      toast.error('Failed to save Alert.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = (alt) => {
    setAlerts(prev => prev.map(a => a.id === alt.id ? { ...a, status: 'Resolved' } : a));
    toast.success(`Alert ${alt.alert_code} marked as Resolved.`);
  };

  const confirmDelete = () => {
    if (!deleteAlert?.id) return;
    setAlerts(prev => prev.filter(a => a.id !== deleteAlert.id));
    toast.success('Alert record removed.');
    setDeleteAlert(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (categoryFilter !== 'all' && a.category_id !== categoryFilter) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (a.alert_code || '').toLowerCase();
        const title = (a.title || '').toLowerCase();
        const scope = (a.impacted_scope || '').toLowerCase();
        const incharge = (a.assigned_to || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !scope.includes(q) && !incharge.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, selectedProjectId, categoryFilter, priorityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const criticalCount = useMemo(() => alerts.filter(a => a.priority === 'Critical' && a.status !== 'Resolved').length, [alerts]);
  const activeCount = useMemo(() => alerts.filter(a => a.status !== 'Resolved').length, [alerts]);
  const resolvedCount = useMemo(() => alerts.filter(a => a.status === 'Resolved').length, [alerts]);

  const getPriorityVariant = (priority) => {
    if (priority === 'Critical') return 'error';
    if (priority === 'High') return 'warning';
    if (priority === 'Medium') return 'neutral';
    return 'neutral';
  };

  const getCategoryIcon = (catId) => {
    if (catId === 'schedule') return <Clock className="w-3.5 h-3.5 text-red-500" />;
    if (catId === 'material') return <Boxes className="w-3.5 h-3.5 text-amber-500" />;
    if (catId === 'labour') return <HardHat className="w-3.5 h-3.5 text-sky-500" />;
    if (catId === 'technical') return <FileQuestion className="w-3.5 h-3.5 text-purple-500" />;
    if (catId === 'weather') return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-primary" />;
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Planning Alerts' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Planning & Schedule Early Warning Alerts (EWS)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Active Early Warnings"
            value={activeCount}
            status="primary"
            icon={<Bell className="w-4 h-4" />}
          />
          <KpiCard
            label="Critical Schedule Blockers"
            value={criticalCount}
            status="error"
            icon={<Flame className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="High & Moderate Alerts"
            value={activeCount - criticalCount}
            status="warning"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Resolved Risks"
            value={resolvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
        </div>

        {/* Filter and Priority Selector Bar */}
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
                  { value: 'all', label: 'All Priorities' },
                  { value: 'Critical', label: 'Critical / Blocker' },
                  { value: 'High', label: 'High Warning' },
                  { value: 'Medium', label: 'Medium Advisory' },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search alert, task, incharge..."
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
              Log Alert
            </Button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {ALERT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                categoryFilter === cat.id
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
                  <th className="px-3 py-2 w-28">Alert Code</th>
                  <th className="px-3 py-2">Early Warning Description & Impact</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Category</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 w-32 hidden lg:table-cell">Assigned Incharge</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading planning alerts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No active planning alerts found. Project schedule is running smoothly.
                    </td>
                  </tr>
                ) : (
                  paged.map((a, idx) => {
                    const isResolved = a.status === 'Resolved';

                    return (
                      <tr key={a.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                            {a.alert_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={a.title}>
                              {a.title}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              Impact: {a.impacted_scope} • Triggered: {a.triggered_at} ({a.aging_days}d ago)
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-[11px] text-text-primary">
                            {getCategoryIcon(a.category_id)}
                            <span className="truncate">{a.category_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getPriorityVariant(a.priority)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {a.priority}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-[11px] text-text-secondary truncate">
                          {a.assigned_to}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={isResolved ? 'success' : 'warning'}
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
                              title="View Alert 360"
                              onClick={() => setViewingAlert(a)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {!isResolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Acknowledge & Resolve"
                                onClick={() => handleResolve(a)}
                              >
                                <Check className="w-3 h-3 mr-1" /> Resolve
                              </Button>
                            )}
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
                    );
                  })
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
                  <span className="font-mono text-[10px] font-bold text-red-600 block">{a.alert_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.title}</h4>
                </div>
                <Badge
                  variant={getPriorityVariant(a.priority)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {a.priority}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/30 rounded border border-border/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Impacted Scope</span>
                <span className="text-text-primary text-[11px] font-medium block">{a.impacted_scope}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{a.category_name}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingAlert(a)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {a.status !== 'Resolved' && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleResolve(a)}>
                      <Check className="w-3 h-3 mr-1" /> Resolve
                    </Button>
                  )}
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

      {/* View Alert Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingAlert.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingAlert.alert_code} • {viewingAlert.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingAlert(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Severity Priority</span> <span className="font-bold text-red-600">{viewingAlert.priority}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Triggered Date</span> <span className="font-mono text-text-primary">{viewingAlert.triggered_at}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Incharge</span> <span className="font-medium text-text-primary">{viewingAlert.assigned_to}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingAlert.status}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Impacted Construction Scope:</span>
                <p className="text-text-secondary">{viewingAlert.impacted_scope}</p>
              </div>

              {viewingAlert.mitigation_plan && (
                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 space-y-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-[11px]">Mitigation & Recovery Action Plan:</span>
                  <p className="text-text-secondary">{viewingAlert.mitigation_plan}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingAlert(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Alert Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingAlert)}
        onClose={() => { setIsAddOpen(false); setEditingAlert(null); }}
      >
        <EntityEditModal.Header
          icon={Bell}
          title={editingAlert ? 'Edit Project Alert' : 'Log Early Warning Alert'}
          subtitle="Record critical path slippages, material shortages, and site risk mitigations."
          onClose={() => { setIsAddOpen(false); setEditingAlert(null); }}
        />
        <form id="alert-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Alert Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Alert Category" required>
                  <Select
                    options={ALERT_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id}
                    onChange={(v) => handleFormChange('category_id', v)}
                  />
                </FormField>

                <FormField label="Alert Reference Code" required error={errors.alert_code}>
                  <Input
                    value={form.alert_code}
                    onChange={(e) => handleFormChange('alert_code', e.target.value)}
                    placeholder="e.g. ALT-SCH-01"
                  />
                </FormField>

                <FormField label="Priority / Severity">
                  <Select
                    options={[
                      { value: 'Critical', label: 'Critical / Schedule Blocker' },
                      { value: 'High', label: 'High Warning' },
                      { value: 'Medium', label: 'Medium Advisory' },
                    ]}
                    value={form.priority}
                    onChange={(v) => handleFormChange('priority', v)}
                  />
                </FormField>

                <FormField label="Alert Title & Summary" required className="md:col-span-2" error={errors.title}>
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Podium Level 2 Column Casting Slipped by 8 Days"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Impacted Scope & Recovery Action">
              <EntityEditModal.Grid>
                <FormField label="Impacted Scope / Activity">
                  <Input
                    value={form.impacted_scope}
                    onChange={(e) => handleFormChange('impacted_scope', e.target.value)}
                    placeholder="e.g. ACT-0201-COL (Threatens Level 3 Slab Cycle)"
                  />
                </FormField>

                <FormField label="Assigned Incharge">
                  <Input
                    value={form.assigned_to}
                    onChange={(e) => handleFormChange('assigned_to', e.target.value)}
                    placeholder="e.g. Er. Rajesh Kumar"
                  />
                </FormField>

                <FormField label="Mitigation & Recovery Action Plan" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.mitigation_plan}
                    onChange={(e) => handleFormChange('mitigation_plan', e.target.value)}
                    placeholder="Describe recovery schedule, extra shift deployment, supplier expediting..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="alert-form"
            submitLabel={editingAlert ? 'Update Alert' : 'Log Alert'}
            onCancel={() => { setIsAddOpen(false); setEditingAlert(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteAlert)}
        title="Delete Alert Record"
        message={`Are you sure you want to delete "${deleteAlert?.alert_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlert(null)}
      />
    </PageContainer>
  );
}
