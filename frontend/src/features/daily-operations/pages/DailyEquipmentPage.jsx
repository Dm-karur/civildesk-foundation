import { useState, useEffect, useMemo } from 'react';
import {
  Truck, CheckCircle2, Clock, Fuel, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Gauge
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
import { projectsApi, dailyReportsApi } from '../../../api/apiservice';
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
};const EMPTY_FORM = {
  project_id: '',
  report_id: '',
  date: '',
  equipment_code: 'EQP-CRN-001',
  equipment_name: 'Tower Crane 5 Ton (TC-1)',
  operator_name: 'Equipment Operator',
  running_hours: '8.0',
  idle_hours: '0.5',
  breakdown_hours: '0.0',
  fuel_consumed_litres: '35',
  assigned_work: '',
  location: 'Site Staging Yard',
  status: 'Operational (Normal)',
  notes: '',
};

export function DailyEquipmentPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const projRes = await projectsApi.list();
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      if (dailyReportsApi?.list) {
        const dprRes = await dailyReportsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
        const rList = dprRes?.data?.daily_site_reports ?? dprRes?.data?.reports ?? dprRes?.data?.data ?? [];
        setReports(Array.isArray(rList) ? rList : []);

        let allEquipment = [];
        for (const r of (Array.isArray(rList) ? rList.slice(0, 20) : [])) {
          try {
            const eqRes = await dailyReportsApi.equipment.list(r.id);
            const eqList = extractArray(eqRes);
            const withMeta = eqList.map(eq => ({ ...eq, report_id: r.id, project_id: r.project_id, date: r.report_date, project_code: r.project_code }));
            allEquipment = [...allEquipment, ...withMeta];
          } catch (e) { /* ignore individual report fetch failures */ }
        }
        setLogs(allEquipment);
      }
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load Initial
  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

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
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      report_id: String(item.report_id || ''),
      date: item.date || '',
      equipment_code: item.equipment_code || '',
      equipment_name: item.equipment_name || '',
      operator_name: item.operator_name || '',
      running_hours: String(item.working_hours ?? item.running_hours ?? '8.0'),
      idle_hours: String(item.idle_hours ?? '0.5'),
      breakdown_hours: String(item.breakdown_hours ?? '0.0'),
      fuel_consumed_litres: String(item.fuel_consumed ?? item.fuel_consumed_litres ?? '35'),
      assigned_work: item.work_description ?? item.assigned_work ?? '',
      location: item.location || '',
      status: item.status || 'Operational (Normal)',
      notes: item.remarks ?? item.notes ?? '',
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
    if (!form.report_id) errs.report_id = 'Daily Report is required';
    if (!form.equipment_name?.trim()) errs.equipment_name = 'Equipment name is required';
    if (!form.assigned_work?.trim()) errs.assigned_work = 'Assigned work is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        equipment_code: form.equipment_code,
        equipment_name: form.equipment_name,
        operator_name: form.operator_name,
        working_hours: Number(form.running_hours || 0),
        idle_hours: Number(form.idle_hours || 0),
        breakdown_hours: Number(form.breakdown_hours || 0),
        fuel_consumed: Number(form.fuel_consumed_litres || 0),
        work_description: form.assigned_work,
        location: form.location,
        status: form.status,
        remarks: form.notes,
        // Backend mapping fields that throw 'Select a valid controlled value' if missing
        ownership_type_id: 1, // 1 = Owned
        status_id: 1, // 1 = Working
      };

      if (editingItem?.id) {
        await dailyReportsApi.equipment.update(form.report_id, editingItem.id, payload);
        toast.success('Equipment deployment updated.');
      } else {
        await dailyReportsApi.equipment.create(form.report_id, payload);
        toast.success('Daily equipment logged.');
      }

      loadData(); // Reload from db
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
        toast.error(Object.values(err.errors).flat().join('\n') || 'Validation failed.');
      } else {
        toast.error(err?.message || 'Failed to save equipment log.');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id || !deleteItem?.report_id) return;
    try {
      await dailyReportsApi.equipment.remove(deleteItem.report_id, deleteItem.id);
      toast.success('Equipment log removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to remove equipment log.');
    } finally {
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const code = String(l.equipment_code || '').toLowerCase();
        const name = String(l.equipment_name || '').toLowerCase();
        const oper = String(l.operator_name || '').toLowerCase();
        const work = String(l.assigned_work || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s) && !oper.includes(s) && !work.includes(s)) return false;
      }
      return true;
    });
  }, [logs, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalRunHours = useMemo(() => logs.reduce((acc, l) => acc + Number(l.running_hours || 0), 0), [logs]);
  const totalDiesel = useMemo(() => logs.reduce((acc, l) => acc + Number(l.fuel_consumed_litres || 0), 0), [logs]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Heavy Machinery & Equipment' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Heavy Machinery & Equipment Operating Log"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Active Equipment Deployed"
            value={`${logs.length} Units`}
            status="primary"
            icon={<Truck className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Running Hours Today"
            value={`${totalRunHours} Hours`}
            status="success"
            icon={<Clock className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Diesel Consumed Today"
            value={`${totalDiesel} Litres`}
            status="warning"
            icon={<Fuel className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Fleet Uptime Availability"
            value="98.5%"
            status="neutral"
            icon={<Gauge className="w-4 h-4 text-sky-500" />}
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
                placeholder="Search equipment, operator, task..."
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
              title="Print Equipment Log"
            >
              Print Log
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Log Equipment Hours
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
                onItemsPerPageChange={() => { }}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-28">Asset Code</th>
                  <th className="px-3 py-2">Machinery & Operator</th>
                  <th className="px-3 py-2">Assigned Work & Location</th>
                  <th className="px-3 py-2 text-center w-20">Run Hrs</th>
                  <th className="px-3 py-2 text-center w-20">Idle Hrs</th>
                  <th className="px-3 py-2 text-right w-24">Fuel (Ltr)</th>
                  <th className="px-3 py-2 text-center w-28">Health</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading equipment log entries...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No equipment logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {l.equipment_code}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{l.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.equipment_name}>
                            {l.equipment_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Operator: {l.operator_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-text-secondary truncate block" title={l.assigned_work}>
                            {l.assigned_work}
                          </span>
                          <span className="text-[10px] text-primary truncate">
                            📍 {l.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {l.running_hours}h
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {l.idle_hours}h
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {l.fuel_consumed_litres > 0 ? `${l.fuel_consumed_litres} L` : 'Electric'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Normal
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Equipment 360"
                            onClick={() => setViewingItem(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(l)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteItem(l)}
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
          {paged.map((l, idx) => (
            <div key={l.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{l.equipment_code} • {l.date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.equipment_name}</h4>
                  <span className="text-[11px] text-text-muted">Operator: {l.operator_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {l.running_hours} Hours
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Fuel Consumed</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{l.fuel_consumed_litres > 0 ? `${l.fuel_consumed_litres} Litres` : 'Electric'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Idle / Breakdown</span>
                  <span className="font-mono text-[11px] text-text-secondary">{l.idle_hours}h / {l.breakdown_hours}h</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                  <Eye className="w-3 h-3 mr-1" /> View Equipment Log
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
              onItemsPerPageChange={() => { }}
            />
          </div>
        </div>
      </div>

      {/* View Equipment 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.equipment_code}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.equipment_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Running Operating Hours</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.running_hours} Hours</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Idle / Standby Hours</span> <span className="font-mono text-text-secondary">{viewingItem.idle_hours} Hours</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Fuel (Diesel) Consumed</span> <span className="font-mono font-bold text-amber-600">{viewingItem.fuel_consumed_litres > 0 ? `${viewingItem.fuel_consumed_litres} Litres` : 'Electric Powered'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Designated Operator</span> <span className="text-text-primary font-medium">{viewingItem.operator_name}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Work Task</span> <span className="text-text-primary font-medium">{viewingItem.assigned_work}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Location & Bay</span> <span className="text-text-primary font-medium">{viewingItem.location}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Safety Checklist & Operator Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Equipment Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Truck}
          title={editingItem ? 'Edit Machinery Log' : 'Log Daily Machinery & Fuel Usage'}
          subtitle="Record operating hours, idle standby, diesel consumed, and work output."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="equipment-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Equipment & Operator Identification">
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

                <FormField label="Equipment Code/ID">
                  <Input
                    value={form.equipment_code}
                    onChange={(e) => handleFormChange('equipment_code', e.target.value)}
                    placeholder="EQP-EXC-005"
                  />
                </FormField>

                <FormField label="Machinery Name" required error={errors.equipment_name}>
                  <Input
                    value={form.equipment_name}
                    onChange={(e) => handleFormChange('equipment_name', e.target.value)}
                    placeholder="e.g. Tower Crane 5 Ton (TC-1)"
                  />
                </FormField>

                <FormField label="Operator Name" className="md:col-span-2">
                  <Input
                    value={form.operator_name}
                    onChange={(e) => handleFormChange('operator_name', e.target.value)}
                    placeholder="e.g. S. Ganesan"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Operating Hours & Fuel">
              <EntityEditModal.Grid>
                <FormField label="Running Hours (Hrs)">
                  <Input
                    type="number"
                    value={form.running_hours}
                    onChange={(e) => handleFormChange('running_hours', e.target.value)}
                  />
                </FormField>

                <FormField label="Idle Standby Hours">
                  <Input
                    type="number"
                    value={form.idle_hours}
                    onChange={(e) => handleFormChange('idle_hours', e.target.value)}
                  />
                </FormField>

                <FormField label="Fuel / Diesel Consumed (Ltrs)">
                  <Input
                    type="number"
                    value={form.fuel_consumed_litres}
                    onChange={(e) => handleFormChange('fuel_consumed_litres', e.target.value)}
                  />
                </FormField>

                <FormField label="Assigned Work Task" required error={errors.assigned_work} className="md:col-span-2">
                  <Input
                    value={form.assigned_work}
                    onChange={(e) => handleFormChange('assigned_work', e.target.value)}
                    placeholder="e.g. Lifting rebar bundles & shuttering ply to Level 2"
                  />
                </FormField>

                <FormField label="Location / Staging Bay" className="md:col-span-2">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Core 1 Tower Base"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="equipment-form"
            submitLabel={editingItem ? 'Update Log' : 'Save Machinery Log'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Equipment Log"
        message={`Are you sure you want to delete "${deleteItem?.equipment_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
