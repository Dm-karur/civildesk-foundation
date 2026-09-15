import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight, Sun,
  CloudRain, ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers, Printer, Send
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
import { projectsApi, dailyReportsApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  site_name: 'Tower Core 1',
  zone_name: 'Level 2 Slab',
  report_date: '',
  weather: 'Sunny & Clear (32°C)',
  overall_progress: '68.5',
  total_manpower: '45',
  total_equipment: '5',
  material_consumption_summary: '40 m³ Concrete, 2.5 MT Steel',
  issues_count: '0',
  status_name: 'Submitted for Review',
  submitted_by: 'Site Incharge',
  work_summary: '',
};

export function DailyProgressReportsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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

  // Load Projects & API Data
  const loadData = () => {
    setLoading(true);
    projectsApi.list().then(projRes => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
    }).catch(() => setProjects([]));

    if (dailyReportsApi?.list) {
      dailyReportsApi.list().then(dprRes => {
        const rList = dprRes?.data?.daily_site_reports ?? dprRes?.data?.reports ?? dprRes?.data?.data ?? [];
        if (Array.isArray(rList)) {
          setReports(rList);
        }
      }).catch(e => {
        console.error('Failed to load daily progress reports', e);
        if (e?.response?.status !== 404 && e?.response?.status !== 422) {
          toast.error('Failed to load reports from server.');
        }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch sites when project_id changes
  useEffect(() => {
    if (form.project_id && form.project_id !== 'all') {
      sitesApi.list({ project_id: form.project_id }).then(res => {
        const sList = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : []);
        setSites(Array.isArray(sList) ? sList : []);
      }).catch(() => setSites([]));
    } else {
      setSites([]);
    }
  }, [form.project_id]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      report_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      site_id: String(item.site_id || ''),
      site_name: item.site_name || '',
      zone_name: item.zone_name || '',
      report_date: item.report_date || '',
      weather: item.weather || '',
      overall_progress: String(item.overall_progress || '65'),
      total_manpower: String(item.total_manpower || '40'),
      total_equipment: String(item.total_equipment || '5'),
      material_consumption_summary: item.material_consumption_summary || '',
      issues_count: String(item.issues_count || '0'),
      status_name: item.status_name || 'Submitted for Review',
      submitted_by: item.submitted_by || 'Site Engineer',
      work_summary: item.work_summary || '',
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
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.site_id) errs.site_id = 'Project Site is required';
    if (!form.report_date.trim()) errs.report_date = 'Report date is required';
    if (!form.work_summary.trim()) errs.work_summary = 'Work summary is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id), 
        report_no: `DPR-${Date.now()}`, 
        report_date: form.report_date,
        shift_type_id: 1, 
        overall_work_summary: form.work_summary,
        planned_progress_percentage: Number(form.overall_progress || 0),
        actual_progress_percentage: Number(form.overall_progress || 0),
        weather_conditions: form.weather,
        weather: form.weather, // Fallback
        total_manpower: Number(form.total_manpower || 0),
        total_equipment: Number(form.total_equipment || 0),
        material_consumption: form.material_consumption_summary,
        material_consumption_summary: form.material_consumption_summary, // Fallback
        issues_count: Number(form.issues_count || 0),
        status_name: form.status_name,
        submitted_by: form.submitted_by,
      };

      if (editingItem?.id) {
        await dailyReportsApi.update(editingItem.id, payload);
        toast.success('Daily progress report updated.');
      } else {
        await dailyReportsApi.create(payload);
        toast.success('Daily progress report (DPR) submitted.');
      }

      loadData(); // Reload from server
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
        toast.error(Object.values(err.errors).flat().join('\n') || 'Validation failed.');
      } else {
        toast.error(err?.message || 'Failed to save daily report.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDpr = async (item) => {
    try {
      await dailyReportsApi.submit(item.id, { remarks: 'Submitted by Site Engineer' });
      toast.success(`DPR for ${item.report_date} submitted successfully.`);
      loadData(); // Reload from server
    } catch (err) {
      toast.error(err?.message || 'Failed to submit DPR.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await dailyReportsApi.remove(deleteItem.id); } catch(e){}
      setReports(prev => prev.filter(r => r.id !== deleteItem.id));
      toast.success('Daily report removed.');
    } catch (err) {
      toast.error('Failed to remove report.');
    } finally {
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !r.status_name.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const site = String(r.site_name || '').toLowerCase();
        const zone = String(r.zone_name || '').toLowerCase();
        const proj = String(r.project_name || '').toLowerCase();
        const work = String(r.work_summary || '').toLowerCase();
        if (!site.includes(s) && !zone.includes(s) && !proj.includes(s) && !work.includes(s)) return false;
      }
      return true;
    });
  }, [reports, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalHeadcount = useMemo(() => reports.reduce((acc, r) => acc + Number(r.total_manpower || 0), 0), [reports]);
  const approvedCount = useMemo(() => reports.filter(r => r.status_name.includes('Approved')).length, [reports]);

  const getStatusVariant = (status) => {
    if (status.includes('Approved')) return 'success';
    if (status.includes('Submitted') || status.includes('Review')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Daily Work Reports (DPR)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Daily Progress Reports (DPR) Master Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Submitted DPRs"
            value={reports.length}
            status="primary"
            icon={<ClipboardList className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Site Manpower"
            value={`${totalHeadcount} Workers`}
            status="neutral"
            icon={<Users className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Approved by PM/Client"
            value={`${approvedCount} Reports`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Safety & Obstacles"
            value="1 Logged Issue"
            status="warning"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
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
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Review', label: 'Submitted for Review' },
                  { value: 'Draft', label: 'Draft' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search site, zone, work summary..."
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
              title="Print DPR Register"
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
              Submit Today's DPR
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
                  <th className="px-3 py-2 w-28">Date</th>
                  <th className="px-3 py-2">Site Location & Zone</th>
                  <th className="px-3 py-2">Work Executed Today</th>
                  <th className="px-3 py-2 text-center w-20">Manpower</th>
                  <th className="px-3 py-2 text-center w-20">Machinery</th>
                  <th className="px-3 py-2 text-center w-24">Progress %</th>
                  <th className="px-3 py-2 text-center w-32">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading daily progress reports...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No daily reports found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px] font-bold text-primary block">
                          {r.report_date}
                        </span>
                        <span className="text-[10px] text-text-muted truncate block">{r.weather}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.site_name}>
                            {r.site_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.zone_name} • {r.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] text-text-secondary truncate block" title={r.work_summary}>
                          {r.work_summary}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-text-primary text-[11px]">
                        {r.total_manpower}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {r.total_equipment}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {r.overall_progress}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View DPR Dossier 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {(r.status_code === 'DRAFT' || r.status_name?.toUpperCase() === 'DRAFT') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Submit DPR to PM"
                              onClick={() => handleSubmitDpr(r)}
                            >
                              <Send className="w-3.5 h-3.5 text-blue-500 hover:text-blue-700" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(r)}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.report_date} • {r.weather}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.site_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.zone_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.overall_progress}%
                </Badge>
              </div>

              <p className="text-xs text-text-secondary line-clamp-2 bg-surface-muted/40 p-2 rounded border border-border/60">
                {r.work_summary}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Manpower</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.total_manpower} Workers</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Status</span>
                  <span className="text-[11px] font-semibold text-primary">{r.status_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View 360
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(r)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                {(r.status_code === 'DRAFT' || r.status_name?.toUpperCase() === 'DRAFT') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleSubmitDpr(r)}>
                    <Send className="w-3 h-3 mr-1" /> Submit
                  </Button>
                )}
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

      {/* View DPR 360 Dossier Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">DPR - {viewingItem.report_date}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.site_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Weather Condition</span> <span className="font-medium text-text-primary">{viewingItem.weather}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Progress</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.overall_progress}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Deployed Manpower</span> <span className="font-mono font-bold">{viewingItem.total_manpower} Persons</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Machinery / Equipment</span> <span className="font-mono font-bold">{viewingItem.total_equipment} Units</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Report Prepared By</span> <span className="text-text-primary font-medium">{viewingItem.submitted_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Sign-off</span> <span className="font-semibold text-emerald-600">{viewingItem.approved_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Material Pour Summary</span> <span className="font-mono text-primary font-medium">{viewingItem.material_consumption_summary}</span></div>
              </div>

              {viewingItem.work_summary && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Site Execution Activity Details:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.work_summary}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print DPR Dossier
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit DPR Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ClipboardList}
          title={editingItem ? 'Edit Daily Progress Report' : "Submit Today's Daily Work Report (DPR)"}
          subtitle="Log daily site execution, weather, active workforce, machinery hours, and progress."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="dpr-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Project & Site Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Report Date" required error={errors.report_date}>
                  <Input
                    type="date"
                    value={form.report_date}
                    onChange={(e) => handleFormChange('report_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Project Site *" required error={errors.site_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select a Site...' },
                      ...sites.map(s => ({ value: String(s.id), label: s.site_name || s.name || `Site ${s.id}` }))
                    ]}
                    value={form.site_id || ''}
                    onChange={(v) => handleFormChange('site_id', v)}
                    disabled={!form.project_id}
                  />
                </FormField>

                <FormField label="Specific Zone / Floor">
                  <Input
                    value={form.zone_name}
                    onChange={(e) => handleFormChange('zone_name', e.target.value)}
                    placeholder="e.g. Level 2 Slab / Column Grid C3-C7"
                  />
                </FormField>

                <FormField label="Weather & Site Conditions" className="md:col-span-2">
                  <Input
                    value={form.weather}
                    onChange={(e) => handleFormChange('weather', e.target.value)}
                    placeholder="e.g. Sunny & Clear (32°C) / Light Drizzle"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Workforce, Machinery & Progress">
              <EntityEditModal.Grid>
                <FormField label="Total Site Manpower">
                  <Input
                    type="number"
                    value={form.total_manpower}
                    onChange={(e) => handleFormChange('total_manpower', e.target.value)}
                  />
                </FormField>

                <FormField label="Active Machinery Count">
                  <Input
                    type="number"
                    value={form.total_equipment}
                    onChange={(e) => handleFormChange('total_equipment', e.target.value)}
                  />
                </FormField>

                <FormField label="Overall Cumulative Progress (%)">
                  <Input
                    type="number"
                    value={form.overall_progress}
                    onChange={(e) => handleFormChange('overall_progress', e.target.value)}
                  />
                </FormField>

                <FormField label="Daily Material Consumption Summary" className="md:col-span-2">
                  <Input
                    value={form.material_consumption_summary}
                    onChange={(e) => handleFormChange('material_consumption_summary', e.target.value)}
                    placeholder="e.g. 45 m³ M30 Concrete, 3.2 MT Rebar"
                  />
                </FormField>

                <FormField label="Work Summary & Milestone Notes" required error={errors.work_summary} className="md:col-span-2">
                  <Textarea
                    rows={3}
                    value={form.work_summary}
                    onChange={(e) => handleFormChange('work_summary', e.target.value)}
                    placeholder="Detail work executed, concrete pour start/end times, inspections done..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="dpr-form"
            submitLabel={editingItem ? 'Update DPR' : 'Submit Daily Report'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Daily Report"
        message={`Are you sure you want to delete report for "${deleteItem?.report_date}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
