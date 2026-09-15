import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Layers, Target,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, TrendingUp
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
import { dailyReportsApi, boqApi, projectsApi, mastersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  
  if (res?.data && typeof res.data === 'object') {
    for (const key in res.data) {
      if (Array.isArray(res.data[key])) return res.data[key];
    }
  }
  
  if (res && typeof res === 'object') {
    for (const key in res) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
};



const EMPTY_FORM = {
  project_id: '',
  report_id: '',
  date: '',
  boq_item_id: '',
  uom_id: '1',
  location: 'Grid C1-C8',
  uom: 'm³',
  planned_qty_today: '20.0',
  achieved_qty_today: '19.5',
  cumulative_achieved: '160.0',
  total_scope_qty: '200.0',
  completion_pct: '80.0',
  status: 'Completed for Today',
  foreman: 'Concrete Foreman',
  notes: '',
};

export function WorkCompletionPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [boqItems, setBoqItems] = useState([]);
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
  const [submitDebug, setSubmitDebug] = useState(null);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const projRes = await projectsApi.list();
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      // Fetch masters
      try {
        const mRes = await mastersApi.all();
        let uList = [];
        if (Array.isArray(mRes)) uList = mRes;
        else if (Array.isArray(mRes?.data)) uList = mRes.data;
        else if (Array.isArray(mRes?.data?.units_of_measurement)) uList = mRes.data.units_of_measurement;
        else if (Array.isArray(mRes?.data?.uoms)) uList = mRes.data.uoms;
        else if (Array.isArray(mRes?.units_of_measurement)) uList = mRes.units_of_measurement;
        else if (Array.isArray(mRes?.uoms)) uList = mRes.uoms;
        
        if (!uList || uList.length === 0) {
          uList = [{ id: 1, uom_code: 'Cu.M', uom_name: 'Cubic Metre' }, { id: 2, uom_code: 'Sq.M', uom_name: 'Square Metre' }];
        }
        setUoms(uList);
      } catch(e) {
        setUoms([{ id: 1, uom_code: 'Cu.M', uom_name: 'Cubic Metre' }, { id: 2, uom_code: 'Sq.M', uom_name: 'Square Metre' }]);
      }

      if (dailyReportsApi?.list) {
        const dprRes = await dailyReportsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
        const rList = dprRes?.data?.daily_site_reports ?? dprRes?.data?.reports ?? dprRes?.data?.data ?? [];
        setReports(Array.isArray(rList) ? rList : []);
        
        let allProgress = [];
        let boqCache = {};
        for (const r of (Array.isArray(rList) ? rList : [])) {
          try {
            if (!boqCache[r.project_id]) {
              boqCache[r.project_id] = [];
              const bRes = await boqApi.list({ project_id: r.project_id }).catch(() => null);
              if (bRes) {
                const bList = extractArray(bRes);
                for (const b of bList) {
                  const iRes = await boqApi.items.list(b.id || b.boq_id).catch(() => null);
                  if (iRes) boqCache[r.project_id] = [...boqCache[r.project_id], ...extractArray(iRes)];
                }
              }
            }

            const wpRes = await dailyReportsApi.workProgress.list(r.id);
            const wpList = extractArray(wpRes);
            const projectItems = boqCache[r.project_id] || [];

            const withMeta = wpList.map(wp => {
              const boqItem = projectItems.find(i => String(i.id) === String(wp.boq_item_id)) || {};
              return { 
                ...wp, 
                report_id: r.id, 
                project_id: r.project_id, 
                date: r.report_date || wp.date, 
                project_code: r.project_code,
                boq_item_name: boqItem.item_name || boqItem.name || boqItem.description || wp.boq_item_name || wp.item_name || wp.activity_name || wp.boq_item?.name || wp.boq_item?.item_name || 'Unknown Activity',
                boq_item_ref: boqItem.item_code || boqItem.code || wp.boq_item_code || wp.item_code || wp.activity_code || wp.boq_item?.code || wp.boq_item?.item_code || 'N/A',
                location: wp.location_description || wp.location || wp.site_location || '',
                planned_qty_today: Number(wp.planned_qty_for_day || wp.planned_qty_today || wp.planned_qty || wp.planned || 0).toFixed(2),
                achieved_qty_today: Number(wp.completed_qty_for_day || wp.achieved_qty_today || wp.achieved_qty || wp.achieved || wp.qty || 0).toFixed(2),
                cumulative_achieved: Number(wp.cumulative_qty_after || wp.cumulative_achieved || wp.cumulative || 0).toFixed(2),
                total_scope_qty: Number(wp.total_scope_qty || wp.total_qty || wp.scope_qty || boqItem.quantity || boqItem.qty || wp.boq_item?.quantity || 0).toFixed(2),
                completion_pct: Number(wp.completion_percentage || wp.completion_pct || wp.percentage || wp.progress || 0).toFixed(1),
                uom_name: wp.uom_name || boqItem.uom_name || boqItem.uom || wp.uom || wp.unit || 'm³',
                foreman: wp.foreman || wp.supervisor || 'N/A'
              };
            });
            allProgress = [...allProgress, ...withMeta];
          } catch(e) { /* ignore individual failures */ }
        }
        setActivities(allProgress);
      }
    } catch (e) {
      console.error(e);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Load Initial
  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  // Fetch BOQ Items when form.project_id changes
  useEffect(() => {
    if (form.project_id && form.project_id !== 'all') {
      boqApi.list({ project_id: form.project_id }).then(async (bRes) => {
        const bList = extractArray(bRes);
        let allItems = [];
        for (const b of bList) {
          try {
            const iRes = await boqApi.items.list(b.id || b.boq_id);
            const list = extractArray(iRes);
            allItems = [...allItems, ...list];
          } catch(e) {}
        }
        setBoqItems(allItems);
      }).catch(() => setBoqItems([]));
    } else {
      setBoqItems([]);
    }
  }, [form.project_id]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      report_id: '',
      date: today,
    });
    setErrors({});
    setSubmitDebug(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      report_id: String(item.report_id || ''),
      date: item.date || '',
      boq_item_id: String(item.boq_item_id || ''),
      location: item.location || '',
      uom_id: String(item.uom_id || item.uom || '1'),
      planned_qty_today: String(item.planned_qty_today || '20'),
      achieved_qty_today: String(item.achieved_qty_today || '19.5'),
      cumulative_achieved: String(item.cumulative_achieved || '160'),
      total_scope_qty: String(item.total_scope_qty || '200'),
      completion_pct: String(item.completion_pct || '80'),
      status: item.status || 'Completed for Today',
      foreman: item.foreman || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'cumulative_achieved' || field === 'total_scope_qty') {
        const cum = Number(field === 'cumulative_achieved' ? value : prev.cumulative_achieved) || 0;
        const tot = Number(field === 'total_scope_qty' ? value : prev.total_scope_qty) || 1;
        next.completion_pct = String(Number(((cum / tot) * 100).toFixed(1)));
      }
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.report_id) errs.report_id = 'Daily Report is required';
    if (!form.boq_item_id) errs.boq_item_id = 'BOQ Item is required';
    if (!form.location?.trim()) errs.location = 'Location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    let payload = {};
    try {
      const selectedReport = reports.find(r => String(r.id) === String(form.report_id));
      
      const selectedBoqItem = boqItems.find(b => String(b.id) === String(form.boq_item_id));
      payload = {
        project_id: Number(form.project_id),
        report_id: Number(form.report_id),
        date: form.date,
        boq_item_id: Number(form.boq_item_id),
        location_description: form.location,
        uom_id: Number(form.uom_id || 1),
        planned_qty_for_day: Number(form.planned_qty_today || 0),
        completed_qty_for_day: Number(form.achieved_qty_today || 0),
        cumulative_qty_after: Number(form.cumulative_achieved || 0),
        completion_percentage: Number(form.completion_pct || 0),
        quality_status_id: 1, // Required by backend
        work_status_id: 1, // Required by backend
        remarks: form.notes,
      };

      if (editingItem?.id) {
        await dailyReportsApi.workProgress.update(form.report_id, editingItem.id, payload);
        toast.success('Work completion log updated.');
      } else {
        await dailyReportsApi.workProgress.create(form.report_id, payload);
        toast.success('Work completion logged.');
      }

      loadData(); // Reload from db
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("WORK PROGRESS BACKEND VALIDATION ERRORS:", err?.errors || err);
      setSubmitDebug({ payload, backendErrors: err?.errors || err });
      if (err?.errors) {
        setErrors(err.errors);
        toast.error(Object.values(err.errors).flat().join('\n') || 'Validation failed.');
      } else {
        toast.error(err?.message || 'Failed to save work progress.');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id || !deleteItem?.report_id) return;
    try {
      await dailyReportsApi.workProgress.remove(deleteItem.report_id, deleteItem.id);
      toast.success('Work completion log removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to remove work completion log.');
    } finally {
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const code = String(a.activity_code || '').toLowerCase();
        const name = String(a.activity_name || '').toLowerCase();
        const loc = String(a.location || '').toLowerCase();
        const formn = String(a.foreman || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s) && !loc.includes(s) && !formn.includes(s)) return false;
      }
      return true;
    });
  }, [activities, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Work Progress & Completion' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Work Activity Progress & Milestone Completion"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Monitored Activities Today"
            value={activities.length}
            status="primary"
            icon={<Target className="w-4 h-4" />}
          />
          <KpiCard
            label="Average Scope Completed"
            value="67.8%"
            status="success"
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Schedule Variance"
            value="+4.2% Ahead"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Foreman Sign-offs"
            value="100% Signed"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search activity code, name, location..."
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
              title="Print Work Register"
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
              Log Work Completion
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
                  <th className="px-3 py-2 w-28">Activity Code</th>
                  <th className="px-3 py-2">Activity Description & Location</th>
                  <th className="px-3 py-2 text-right w-24">Target Today</th>
                  <th className="px-3 py-2 text-right w-24">Achieved</th>
                  <th className="px-3 py-2 text-right w-28">Cumulative</th>
                  <th className="px-3 py-2 text-center w-24">Progress %</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Foreman</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading work completion records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No work activity records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary text-[12px] truncate">{a.boq_item_name || a.activity_name}</span>
                          <span className="text-[10px] text-text-muted font-mono">{a.boq_item_ref || a.activity_code}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] text-text-secondary">{a.location}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {a.planned_qty_today} {a.uom_name || a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {a.achieved_qty_today} {a.uom_name || a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        {a.cumulative_achieved} / {a.total_scope_qty} {a.uom_name || a.uom}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {a.completion_pct}%
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell text-[11px] text-text-secondary truncate">
                        {a.foreman}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Activity 360"
                            onClick={() => setViewingItem(a)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(a)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteItem(a)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-500" />
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
          {paged.map((a, idx) => (
            <div key={a.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.boq_item_ref || a.activity_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.boq_item_name || a.activity_name}</h4>
                  <span className="text-[11px] text-text-muted">📍 {a.location}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {a.completion_pct}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Today's Output</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{a.achieved_qty_today} / {a.planned_qty_today} {a.uom_name || a.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Cumulative Scope</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">{a.cumulative_achieved} {a.uom_name || a.uom}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(a)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-red-600" onClick={() => setDeleteItem(a)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
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

      {/* View Activity 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.boq_item_ref || viewingItem.activity_code}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.boq_item_name || viewingItem.activity_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Today Achieved Output</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.achieved_qty_today} {viewingItem.uom_name || viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Target Today</span> <span className="font-mono">{viewingItem.planned_qty_today} {viewingItem.uom_name || viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Output</span> <span className="font-mono font-bold text-emerald-600 text-sm">{viewingItem.cumulative_achieved} / {viewingItem.total_scope_qty} {viewingItem.uom_name || viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Scope Completed</span> <span className="font-bold text-emerald-600 font-mono text-sm">{viewingItem.completion_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Foreman</span> <span className="text-text-primary font-medium">{viewingItem.foreman}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Activity Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Grid / Work Location</span> <span className="text-text-primary font-medium">{viewingItem.location}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Execution Details & Deficit Justifications:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Completion Card
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Target}
          title={editingItem ? 'Edit Activity Output' : 'Log Daily Activity Progress'}
          subtitle="Record planned vs achieved physical output and cumulative milestone progress."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="act-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            {submitDebug && (
              <div className="bg-red-50 text-red-600 p-3 mb-4 rounded border border-red-200 text-xs font-mono whitespace-pre-wrap">
                RAW BACKEND ERRORS: {JSON.stringify(submitDebug.backendErrors, null, 2)}
                <br/>
                API PAYLOAD SENT: {JSON.stringify(submitDebug.payload, null, 2)}
              </div>
            )}
            <EntityEditModal.Section title="Activity Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Link to Daily Report *" required error={errors.report_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Daily Report...' },
                      ...reports.filter(r => String(r.project_id) === form.project_id).map(r => ({ value: String(r.id), label: `${r.report_date} - ${r.site_name || 'Report'}` }))
                    ]}
                    value={form.report_id}
                    onChange={(v) => handleFormChange('report_id', v)}
                    disabled={!form.project_id}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="BOQ Item *" required error={errors.boq_item_id}>
                    <Select
                      options={[
                        { value: '', label: 'Select BOQ Item...' },
                        ...boqItems.map(b => ({ value: String(b.id || b.item_id || b.boq_item_id || ''), label: `${b.item_code} - ${b.item_name || b.title || 'Item'}` }))
                      ]}
                      value={form.boq_item_id}
                      onChange={(v) => handleFormChange('boq_item_id', v)}
                    />
                  </FormField>
                </div>

                <FormField label="Work Grid / Location *" required error={errors.location}>
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Grid C1-C8"
                  />
                </FormField>

                <FormField label="Unit of Measurement *" error={errors.uom_id}>
                  <Select
                    options={uoms.map(u => ({ 
                      value: String(u.id || u.unit_id || u.uom_id || ''), 
                      label: u.uom_name || u.uom_code || u.name || u.code || u.unit_name || String(u.id || 'Unknown')
                    }))}
                    value={form.uom_id}
                    onChange={(v) => handleFormChange('uom_id', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Quantities & Progress Outputs">
              <EntityEditModal.Grid>
                <FormField label="Planned Output Today">
                  <Input
                    type="number"
                    value={form.planned_qty_today}
                    onChange={(e) => handleFormChange('planned_qty_today', e.target.value)}
                  />
                </FormField>

                <FormField label="Achieved Output Today">
                  <Input
                    type="number"
                    value={form.achieved_qty_today}
                    onChange={(e) => handleFormChange('achieved_qty_today', e.target.value)}
                  />
                </FormField>

                <FormField label="Cumulative Total Achieved">
                  <Input
                    type="number"
                    value={form.cumulative_achieved}
                    onChange={(e) => handleFormChange('cumulative_achieved', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Scope Quantity">
                  <Input
                    type="number"
                    value={form.total_scope_qty}
                    onChange={(e) => handleFormChange('total_scope_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Foreman Incharge">
                  <Input
                    value={form.foreman}
                    onChange={(e) => handleFormChange('foreman', e.target.value)}
                    placeholder="e.g. M. Selvam"
                  />
                </FormField>

                <FormField label="Execution Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Equipment breakdown delays, weather impact, rework notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="act-form"
            submitLabel={editingItem ? 'Update Output' : 'Save Activity Progress'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Activity Log"
        message={`Are you sure you want to delete "${deleteItem?.activity_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
