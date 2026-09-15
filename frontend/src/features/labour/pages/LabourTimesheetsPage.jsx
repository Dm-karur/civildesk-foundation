import { useState, useEffect, useMemo } from 'react';
import {
  Clock, CheckCircle2, IndianRupee, Users, Search, Filter,
  Eye, Edit, Trash2, Plus, ArrowLeft, ArrowRight, Check,
  Calendar, Layers, ShieldCheck, Printer, FileSpreadsheet
} from 'lucide-react';
import { UnderConstructionPage } from '../../masters/pages/UnderConstructionPage';
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
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, request } from '../../../api/apiservice';



const EMPTY_FORM = {
  project_id: '',
  worker_code: '',
  worker_name: '',
  category_name: 'General Helper',
  contractor_name: '',
  rate_per_day: '850',
  mon_hrs: '8', mon_ot: '0',
  tue_hrs: '8', tue_ot: '0',
  wed_hrs: '8', wed_ot: '0',
  thu_hrs: '8', thu_ot: '0',
  fri_hrs: '8', fri_ot: '0',
  sat_hrs: '8', sat_ot: '0',
  sun_hrs: '0', sun_ot: '0',
  status: 'Pending Review',
  notes: '',
};

export function LabourTimesheetsPage() {
  return (
    <UnderConstructionPage 
      title="Weekly Timesheets" 
      moduleName="Labour" 
      description="The Timesheets module is currently under development. It will be wired up to the backend soon." 
    />
  );
}

// Preserved for future use once the backend endpoints are ready
export function LabourTimesheetsPage_Future() {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentWeekLabel, setCurrentWeekLabel] = useState('Week 34 (17 Aug - 23 Aug 2026)');
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      worker_code: `LAB-00${timesheets.length + 1}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      worker_code: item.worker_code || '',
      worker_name: item.worker_name || '',
      category_name: item.category_name || '',
      contractor_name: item.contractor_name || '',
      rate_per_day: String(item.rate_per_day || '850'),
      mon_hrs: String(item.mon_hrs || '8'), mon_ot: String(item.mon_ot || '0'),
      tue_hrs: String(item.tue_hrs || '8'), tue_ot: String(item.tue_ot || '0'),
      wed_hrs: String(item.wed_hrs || '8'), wed_ot: String(item.wed_ot || '0'),
      thu_hrs: String(item.thu_hrs || '8'), thu_ot: String(item.thu_ot || '0'),
      fri_hrs: String(item.fri_hrs || '8'), fri_ot: String(item.fri_ot || '0'),
      sat_hrs: String(item.sat_hrs || '8'), sat_ot: String(item.sat_ot || '0'),
      sun_hrs: String(item.sun_hrs || '0'), sun_ot: String(item.sun_ot || '0'),
      status: item.status || 'Pending Review',
      notes: item.notes || '',
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
    if (!form.worker_name.trim()) errs.worker_name = 'Worker name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const rRate = Number(form.rate_per_day || 850);
      const hourlyRate = rRate / 8;

      const regHrs = Number(form.mon_hrs) + Number(form.tue_hrs) + Number(form.wed_hrs) +
                     Number(form.thu_hrs) + Number(form.fri_hrs) + Number(form.sat_hrs) + Number(form.sun_hrs);
      const otHrs = Number(form.mon_ot) + Number(form.tue_ot) + Number(form.wed_ot) +
                    Number(form.thu_ot) + Number(form.fri_ot) + Number(form.sat_ot) + Number(form.sun_ot);
      const gross = Math.round((regHrs * hourlyRate) + (otHrs * hourlyRate * 1.5));

      const newTimesheet = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        worker_code: form.worker_code || 'LAB-000',
        worker_name: form.worker_name,
        category_name: form.category_name,
        contractor_name: form.contractor_name || 'Direct Roll',
        week_period: '17 Aug - 23 Aug 2026',
        rate_per_day: rRate,
        mon_hrs: Number(form.mon_hrs), mon_ot: Number(form.mon_ot),
        tue_hrs: Number(form.tue_hrs), tue_ot: Number(form.tue_ot),
        wed_hrs: Number(form.wed_hrs), wed_ot: Number(form.wed_ot),
        thu_hrs: Number(form.thu_hrs), thu_ot: Number(form.thu_ot),
        fri_hrs: Number(form.fri_hrs), fri_ot: Number(form.fri_ot),
        sat_hrs: Number(form.sat_hrs), sat_ot: Number(form.sat_ot),
        sun_hrs: Number(form.sun_hrs), sun_ot: Number(form.sun_ot),
        total_reg_hrs: regHrs,
        total_ot_hrs: otHrs,
        gross_wage: gross,
        status: form.status,
        notes: form.notes,
      };

      if (editingItem?.id) {
        try { await request.patch(`/labour-attendance/timesheets/${editingItem.id}`, newTimesheet); } catch(e){}
        setTimesheets(prev => prev.map(t => t.id === editingItem.id ? newTimesheet : t));
        toast.success('Timesheet updated.');
      } else {
        try { await request.post('/labour-attendance/timesheets', newTimesheet); } catch(e){}
        setTimesheets(prev => [newTimesheet, ...prev]);
        toast.success('Timesheet line added.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save Timesheet.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item) => {
    try { await request.patch(`/labour-attendance/timesheets/${item.id}`, { status: 'Approved' }); } catch(e){}
    setTimesheets(prev => prev.map(t => t.id === item.id ? { ...t, status: 'Approved' } : t));
    toast.success(`Timesheet approved for ${item.worker_name}.`);
  };

  const handleApproveAll = () => {
    setTimesheets(prev => prev.map(t => ({ ...t, status: 'Approved' })));
    toast.success('All weekly timesheets approved.');
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await request.delete(`/labour-attendance/timesheets/${deleteItem.id}`); } catch(e){}
      setTimesheets(prev => prev.filter(t => t.id !== deleteItem.id));
      toast.success('Timesheet record deleted.');
    } catch {
      toast.error('Failed to delete timesheet.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return timesheets.filter(t => {
      if (selectedProjectId !== 'all' && String(t.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (t.worker_code || '').toLowerCase();
        const name = (t.worker_name || '').toLowerCase();
        const cat = (t.category_name || '').toLowerCase();
        const cont = (t.contractor_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !cont.includes(q)) return false;
      }
      return true;
    });
  }, [timesheets, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalRegHrs = useMemo(() => timesheets.reduce((acc, t) => acc + Number(t.total_reg_hrs || 0), 0), [timesheets]);
  const totalOtHrs = useMemo(() => timesheets.reduce((acc, t) => acc + Number(t.total_ot_hrs || 0), 0), [timesheets]);
  const grossWagePayout = useMemo(() => timesheets.reduce((acc, t) => acc + Number(t.gross_wage || 0), 0), [timesheets]);
  const pendingApprovalCount = useMemo(() => timesheets.filter(t => t.status === 'Pending Review').length, [timesheets]);

  const getStatusVariant = (status) => {
    if (status === 'Approved') return 'success';
    if (status === 'Pending Review') return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Timesheets' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Weekly Labour Timesheets & Hours Roll"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Workforce on Timesheet"
            value={timesheets.length}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Regular Billable Hours"
            value={`${totalRegHrs} hrs`}
            status="success"
            icon={<Clock className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Overtime Logged"
            value={`${totalOtHrs} hrs OT`}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Gross Weekly Payroll"
            value={`₹${grossWagePayout.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Week Selector & Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Week Navigator */}
            <div className="flex items-center gap-1 bg-surface-muted/60 p-1 rounded-lg border border-border">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Previous Week">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-semibold text-text-primary px-2">{currentWeekLabel}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Next Week">
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="w-full sm:w-44">
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
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Pending Review', label: 'Pending Review' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search worker, gang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleApproveAll}
              className="text-xs h-8 shadow-xs"
              title="Approve all pending timesheets"
            >
              Approve All
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Timesheet
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
                  <th className="px-3 py-2 w-28">Worker Code</th>
                  <th className="px-3 py-2">Worker & Skill</th>
                  <th className="px-3 py-2 text-center w-64 hidden md:table-cell">7-Day Hours (M • T • W • T • F • S • S)</th>
                  <th className="px-3 py-2 text-right w-24">Hours (Reg/OT)</th>
                  <th className="px-3 py-2 text-right w-24">Gross Wage</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading timesheets...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No timesheets found matching filter criteria.
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
                          {t.worker_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={t.worker_name}>
                            {t.worker_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {t.category_name} • {t.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border/50" title="Monday">{t.mon_hrs}h</span>
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border/50" title="Tuesday">{t.tue_hrs}h</span>
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border/50" title="Wednesday">{t.wed_hrs}h</span>
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border/50" title="Thursday">{t.thu_hrs}h</span>
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border/50" title="Friday">{t.fri_hrs}h</span>
                          <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border/50" title="Saturday">{t.sat_hrs}h</span>
                          <span className="bg-surface-muted/40 text-text-muted px-1.5 py-0.5 rounded" title="Sunday">{t.sun_hrs}h</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">
                        <span className="font-bold text-text-primary">{t.total_reg_hrs}h</span>
                        {t.total_ot_hrs > 0 && <span className="text-amber-600 font-semibold block text-[10px]">+{t.total_ot_hrs}h OT</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(t.gross_wage).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(t.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Timesheet 360"
                            onClick={() => setViewingItem(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {t.status === 'Pending Review' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Approve Timesheet"
                              onClick={() => handleApprove(t)}
                            >
                              <Check className="w-3 h-3 mr-0.5" /> Approve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(t)}
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
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{t.worker_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{t.category_name} • {t.contractor_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(t.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {t.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Weekly Hours</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{t.total_reg_hrs}h Reg {t.total_ot_hrs > 0 ? `(+${t.total_ot_hrs}h OT)` : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Gross Wage</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(t.gross_wage).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(t)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {t.status === 'Pending Review' && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(t)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
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

      {/* View Timesheet Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.worker_code} • {viewingItem.week_period}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Billable Hours</span> <span className="font-mono font-bold text-text-primary text-sm">{viewingItem.total_reg_hrs}h Reg + {viewingItem.total_ot_hrs}h OT</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Weekly Wage</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.gross_wage).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Base Rate</span> <span className="font-mono">₹{viewingItem.rate_per_day}/day</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <span className="font-bold text-text-primary block text-[11px]">7-Day Hours Breakdown:</span>
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
                  <div className="bg-surface-muted p-1.5 rounded border border-border">
                    <span className="text-text-muted block">Mon</span>
                    <span className="font-bold">{viewingItem.mon_hrs}h</span>
                    {viewingItem.mon_ot > 0 && <span className="text-amber-600 block">+{viewingItem.mon_ot}h</span>}
                  </div>
                  <div className="bg-surface-muted p-1.5 rounded border border-border">
                    <span className="text-text-muted block">Tue</span>
                    <span className="font-bold">{viewingItem.tue_hrs}h</span>
                    {viewingItem.tue_ot > 0 && <span className="text-amber-600 block">+{viewingItem.tue_ot}h</span>}
                  </div>
                  <div className="bg-surface-muted p-1.5 rounded border border-border">
                    <span className="text-text-muted block">Wed</span>
                    <span className="font-bold">{viewingItem.wed_hrs}h</span>
                    {viewingItem.wed_ot > 0 && <span className="text-amber-600 block">+{viewingItem.wed_ot}h</span>}
                  </div>
                  <div className="bg-surface-muted p-1.5 rounded border border-border">
                    <span className="text-text-muted block">Thu</span>
                    <span className="font-bold">{viewingItem.thu_hrs}h</span>
                    {viewingItem.thu_ot > 0 && <span className="text-amber-600 block">+{viewingItem.thu_ot}h</span>}
                  </div>
                  <div className="bg-surface-muted p-1.5 rounded border border-border">
                    <span className="text-text-muted block">Fri</span>
                    <span className="font-bold">{viewingItem.fri_hrs}h</span>
                    {viewingItem.fri_ot > 0 && <span className="text-amber-600 block">+{viewingItem.fri_ot}h</span>}
                  </div>
                  <div className="bg-surface-muted p-1.5 rounded border border-border">
                    <span className="text-text-muted block">Sat</span>
                    <span className="font-bold">{viewingItem.sat_hrs}h</span>
                    {viewingItem.sat_ot > 0 && <span className="text-amber-600 block">+{viewingItem.sat_ot}h</span>}
                  </div>
                  <div className="bg-surface-muted/40 p-1.5 rounded border border-border text-text-muted">
                    <span className="block">Sun</span>
                    <span>{viewingItem.sun_hrs}h</span>
                  </div>
                </div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Work Scope & Site Incharge Notes:</span>
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

      {/* Add / Edit Timesheet Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Clock}
          title={editingItem ? 'Edit Weekly Timesheet' : 'Add Weekly Timesheet'}
          subtitle="Record daily working hours, approved overtime, and payroll computation."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="ts-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Worker Code" required>
                  <Input
                    value={form.worker_code}
                    onChange={(e) => handleFormChange('worker_code', e.target.value)}
                    placeholder="e.g. LAB-0001"
                  />
                </FormField>

                <FormField label="Worker Name" required error={errors.worker_name}>
                  <Input
                    value={form.worker_name}
                    onChange={(e) => handleFormChange('worker_name', e.target.value)}
                    placeholder="e.g. K. Selvam"
                  />
                </FormField>

                <FormField label="Daily Wage Rate (₹)">
                  <Input
                    type="number"
                    value={form.rate_per_day}
                    onChange={(e) => handleFormChange('rate_per_day', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Daily Regular & OT Hours (Mon - Sun)">
              <EntityEditModal.Grid>
                <FormField label="Monday (Reg / OT)">
                  <div className="flex gap-2">
                    <Input type="number" value={form.mon_hrs} onChange={(e) => handleFormChange('mon_hrs', e.target.value)} placeholder="Reg" />
                    <Input type="number" value={form.mon_ot} onChange={(e) => handleFormChange('mon_ot', e.target.value)} placeholder="OT" />
                  </div>
                </FormField>

                <FormField label="Tuesday (Reg / OT)">
                  <div className="flex gap-2">
                    <Input type="number" value={form.tue_hrs} onChange={(e) => handleFormChange('tue_hrs', e.target.value)} placeholder="Reg" />
                    <Input type="number" value={form.tue_ot} onChange={(e) => handleFormChange('tue_ot', e.target.value)} placeholder="OT" />
                  </div>
                </FormField>

                <FormField label="Wednesday (Reg / OT)">
                  <div className="flex gap-2">
                    <Input type="number" value={form.wed_hrs} onChange={(e) => handleFormChange('wed_hrs', e.target.value)} placeholder="Reg" />
                    <Input type="number" value={form.wed_ot} onChange={(e) => handleFormChange('wed_ot', e.target.value)} placeholder="OT" />
                  </div>
                </FormField>

                <FormField label="Thursday (Reg / OT)">
                  <div className="flex gap-2">
                    <Input type="number" value={form.thu_hrs} onChange={(e) => handleFormChange('thu_hrs', e.target.value)} placeholder="Reg" />
                    <Input type="number" value={form.thu_ot} onChange={(e) => handleFormChange('thu_ot', e.target.value)} placeholder="OT" />
                  </div>
                </FormField>

                <FormField label="Friday (Reg / OT)">
                  <div className="flex gap-2">
                    <Input type="number" value={form.fri_hrs} onChange={(e) => handleFormChange('fri_hrs', e.target.value)} placeholder="Reg" />
                    <Input type="number" value={form.fri_ot} onChange={(e) => handleFormChange('fri_ot', e.target.value)} placeholder="OT" />
                  </div>
                </FormField>

                <FormField label="Saturday (Reg / OT)">
                  <div className="flex gap-2">
                    <Input type="number" value={form.sat_hrs} onChange={(e) => handleFormChange('sat_hrs', e.target.value)} placeholder="Reg" />
                    <Input type="number" value={form.sat_ot} onChange={(e) => handleFormChange('sat_ot', e.target.value)} placeholder="OT" />
                  </div>
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="ts-form"
            submitLabel={editingItem ? 'Update Timesheet' : 'Save Timesheet'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Timesheet"
        message={`Are you sure you want to delete this timesheet?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
