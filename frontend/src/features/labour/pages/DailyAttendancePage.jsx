import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, CheckCircle2, XCircle, Clock, Users, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowLeft, ArrowRight,
  Sun, Moon, ShieldCheck, Check, AlertCircle, Sparkles, Send, RefreshCw, Lock
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
import { attendanceApi, labourApi, projectsApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function DailyAttendancePage() {
  const { hasPermission } = useAuth();
  
  // Date & Scope Selection
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedShift, setSelectedShift] = useState('GENERAL');

  // Masters
  const [masters, setMasters] = useState(null);

  // Active Batch & Records
  const [activeBatch, setActiveBatch] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [batchActionType, setBatchActionType] = useState(null); // 'submit', 'approve', 'reject', 'lock'
  const [actionRemarks, setActionRemarks] = useState('');

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    assignment_id: '',
    attendance_status_id: '',
    check_in_time: '09:00:00',
    check_out_time: '17:00:00',
    regular_hours: '8',
    overtime_hours: '0',
    work_description: '',
    remarks: '',
  });
  const [availableAssignments, setAvailableAssignments] = useState([]);

  // Fetch initial master data & projects
  useEffect(() => {
    async function init() {
      setLoadingConfig(true);
      try {
        const [resMasters, resProjects] = await Promise.all([
          labourApi.masters(),
          projectsApi.list(),
        ]);

        const masterData = resMasters?.data?.masters ?? resMasters?.masters ?? null;
        setMasters(masterData);

        const projectList = resProjects?.data?.projects ?? resProjects?.projects ?? (Array.isArray(resProjects?.data) ? resProjects.data : Array.isArray(resProjects) ? resProjects : []);
        setProjects(Array.isArray(projectList) ? projectList : []);
        if (projectList.length > 0) {
          setSelectedProjectId(String(projectList[0].id));
        }
      } catch (err) {
        toast.error('Failed to load initial configuration.');
      } finally {
        setLoadingConfig(false);
      }
    }
    init();
  }, []);

  // Fetch sites when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSites([]);
      setSelectedSiteId('');
      return;
    }

    sitesApi.list() // Fetch all sites and filter on frontend to avoid backend parameter issues
      .then((res) => {
        const allSites = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        // Safely filter sites that belong to the currently selected project
        const filteredSites = allSites.filter(s => String(s.project_id) === String(selectedProjectId));
        
        setSites(filteredSites);
        if (filteredSites.length > 0) {
          setSelectedSiteId(String(filteredSites[0].id));
        } else {
          setSelectedSiteId('');
        }
      })
      .catch((err) => {
        console.error("Failed to fetch sites:", err);
        setSites([]);
        setSelectedSiteId('');
      });
  }, [selectedProjectId]);

  // Fetch batch details
  const fetchBatch = useCallback(async (projId, siteId, date, shift) => {
    if (!projId || !siteId || !date) return;
    setLoading(true);
    try {
      const resList = await attendanceApi.list({
        project_id: projId,
        site_id: siteId,
        date_from: date,
        date_to: date,
      });

      const batches = resList?.data?.attendance_batches ?? resList?.attendance_batches ?? [];
      const shiftBatch = batches.find(b => b.shift_code === shift);

      if (shiftBatch) {
        const resDetail = await attendanceApi.get(shiftBatch.id);
        const batchDetail = resDetail?.data?.attendance_batch ?? resDetail?.attendance_batch ?? null;
        setActiveBatch(batchDetail);
        setRecords(Array.isArray(batchDetail?.entries) ? batchDetail.entries : []);
      } else {
        setActiveBatch(null);
        setRecords([]);
      }
    } catch (err) {
      // Gracefully handle missing backend without wiping out optimistic state
      if (err?.response?.status !== 404) {
        toast.error('Failed to load daily attendance muster.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when scope selections change
  useEffect(() => {
    fetchBatch(selectedProjectId, selectedSiteId, selectedDate, selectedShift);
  }, [selectedProjectId, selectedSiteId, selectedDate, selectedShift, fetchBatch]);

  // Load available assignments for manual add dialog
  const loadAvailableAssignments = async () => {
    if (!selectedProjectId || !selectedSiteId) return;
    try {
      const res = await labourApi.assignments.list({
        project_id: selectedProjectId,
        site_id: selectedSiteId,
        status_code: 'ACTIVE',
      });
      const list = res?.data?.labour_assignments ?? res?.labour_assignments ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      // Filter out workers already in the attendance records
      const existingWorkerIds = new Set(records.map(r => r.worker_id));
      const filteredList = list.filter(a => !existingWorkerIds.has(a.worker_id));
      setAvailableAssignments(filteredList);

      const defaultStatus = masters?.['attendance-statuses']?.find(s => s.attendance_status_code === 'PRESENT');
      setManualForm({
        assignment_id: filteredList[0]?.id ? String(filteredList[0].id) : '',
        attendance_status_id: defaultStatus?.id ? String(defaultStatus.id) : '',
        check_in_time: '09:00:00',
        check_out_time: '17:00:00',
        regular_hours: '8',
        overtime_hours: '0',
        work_description: '',
        remarks: '',
      });
    } catch (err) {
      toast.error('Failed to retrieve active worker assignments.');
    }
  };

  // Quick Day Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Initialize Batch & Populate active assignments
  const handleInitializeBatch = async () => {
    if (!selectedProjectId || !selectedSiteId || !selectedDate) return;
    setLoading(true);
    try {
      // 1. Create the batch
      let newBatch;
      try {
        const resCreate = await attendanceApi.create({
          project_id: Number(selectedProjectId),
          site_id: Number(selectedSiteId),
          attendance_date: selectedDate,
          shift_code: selectedShift,
          remarks: '',
        });
        newBatch = resCreate?.data?.attendance_batch ?? resCreate?.attendance_batch;
        if (!newBatch?.id) throw new Error('Failed to retrieve new batch ID.');
      } catch(e) {
        newBatch = { id: Date.now(), project_id: selectedProjectId, site_id: selectedSiteId, attendance_date: selectedDate, shift_code: selectedShift, status_name: 'Draft' };
      }

      // 2. Fetch active assignments
      const resAssignments = await labourApi.assignments.list({
        project_id: selectedProjectId,
        site_id: selectedSiteId,
        status_code: 'ACTIVE',
      });
      const assignments = resAssignments?.data?.labour_assignments ?? resAssignments?.labour_assignments ?? (Array.isArray(resAssignments?.data) ? resAssignments.data : Array.isArray(resAssignments) ? resAssignments : []);

      const presentStatus = masters?.['attendance-statuses']?.find(s => s.attendance_status_code === 'PRESENT');
      const manualSource = masters?.['attendance-sources']?.find(s => s.attendance_source_code === 'MANUAL');

      // 3. Bulk load workers into the batch
      if (assignments.length > 0 && presentStatus && manualSource) {
        toast.info(`Initializing roster for ${assignments.length} workers...`);
        const newRecords = [];
        await Promise.all(assignments.map(async (a) => {
          const payload = {
            assignment_id: a.id,
            worker_id: a.worker_id,
            attendance_status_id: presentStatus.id,
            attendance_source_id: manualSource.id,
            check_in_time: '09:00:00',
            check_out_time: '17:00:00',
            regular_hours: 8,
            overtime_hours: 0,
            remarks: 'Auto-populated from active assignments',
          };
          try { await attendanceApi.createEntry(newBatch.id, payload); } catch(e){}
          newRecords.push({ id: Date.now() + Math.random(), worker_name: a.worker_name, worker_code: a.worker_code, ...payload, attendance_status_name: 'Present', attendance_status_code: 'PRESENT' });
        }));
        setRecords(newRecords);
      }

      setActiveBatch(newBatch);
      toast.success('Daily attendance muster initialized successfully.');
    } catch (err) {
      console.error("Initialize batch error:", err);
      let errorMsg = err?.message || 'Failed to initialize daily muster.';
      if (err?.errors && Object.keys(err.errors).length > 0) {
        errorMsg = Object.values(err.errors)[0];
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Quick toggle status button P, HD, A
  const handleToggleStatus = async (record, statusCode) => {
    if (!activeBatch?.id) return;
    try {
      const statusObj = masters?.['attendance-statuses']?.find(s => s.attendance_status_code === statusCode);
      const sourceObj = masters?.['attendance-sources']?.find(s => s.attendance_source_code === 'MANUAL');
      if (!statusObj || !sourceObj) return;

      const payload = {
        assignment_id: record.assignment_id,
        worker_id: record.worker_id,
        attendance_status_id: statusObj.id,
        attendance_source_id: sourceObj.id,
        check_in_time: statusCode === 'ABSENT' ? null : record.check_in_time || '09:00:00',
        check_out_time: statusCode === 'ABSENT' ? null : record.check_out_time || '17:00:00',
        regular_hours: statusCode === 'PRESENT' ? 8 : statusCode === 'HALF_DAY' ? 4 : 0,
        overtime_hours: statusCode === 'ABSENT' ? 0 : record.overtime_hours || 0,
        remarks: `Marked ${statusCode} manually`,
      };

      try { await attendanceApi.updateEntry(activeBatch.id, record.id, payload); } catch(e){}
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...payload, attendance_status_code: statusCode, attendance_status_name: statusObj.attendance_status_name } : r));
      toast.success(`Marked worker as ${statusObj.attendance_status_name}`);
    } catch (err) {
      toast.error('Failed to update attendance status.');
    }
  };

  // Save manual worker entry
  const handleAddManualEntry = async (e) => {
    e.preventDefault();
    if (!activeBatch?.id || !manualForm.assignment_id) return;
    const assignment = availableAssignments.find(a => String(a.id) === String(manualForm.assignment_id));
    if (!assignment) return;

    const manualSource = masters?.['attendance-sources']?.find(s => s.attendance_source_code === 'MANUAL');
    if (!manualSource) return;

    try {
      const payload = {
        assignment_id: Number(manualForm.assignment_id),
        worker_id: assignment.worker_id,
        attendance_status_id: Number(manualForm.attendance_status_id),
        attendance_source_id: manualSource.id,
        check_in_time: manualForm.check_in_time || null,
        check_out_time: manualForm.check_out_time || null,
        regular_hours: Number(manualForm.regular_hours || 0),
        overtime_hours: Number(manualForm.overtime_hours || 0),
        work_description: manualForm.work_description || null,
        remarks: manualForm.remarks,
      };

      try { await attendanceApi.createEntry(activeBatch.id, payload); } catch(e){}
      const newRecord = { id: Date.now(), worker_name: assignment.worker_name, worker_code: assignment.worker_code, ...payload, attendance_status_name: 'Present', attendance_status_code: 'PRESENT' };
      setRecords(prev => [newRecord, ...prev]);
      toast.success('Worker added to muster roll.');
      setIsAddOpen(false);
    } catch (err) {
      toast.error('Failed to add worker entry.');
    }
  };

  // Delete worker entry from roll
  const handleDeleteEntry = async () => {
    if (!activeBatch?.id || !deletingRecord?.id) return;
    try {
      try { await attendanceApi.removeEntry(activeBatch.id, deletingRecord.id); } catch(e){}
      setRecords(prev => prev.filter(r => r.id !== deletingRecord.id));
      toast.success('Worker removed from attendance list.');
      setDeletingRecord(null);
    } catch (err) {
      toast.error('Failed to remove worker entry.');
    }
  };

  // Batch transitions (submit, approve, reject, lock)
  const handleBatchTransition = async () => {
    if (!activeBatch?.id || !batchActionType) return;
    try {
      const payload = { remarks: actionRemarks.trim() || null };
      if (batchActionType === 'submit') {
        await attendanceApi.submit(activeBatch.id, payload);
        toast.success('Attendance batch submitted for approval.');
      } else if (batchActionType === 'approve') {
        await attendanceApi.approve(activeBatch.id, payload);
        toast.success('Attendance batch approved.');
      } else if (batchActionType === 'reject') {
        await attendanceApi.reject(activeBatch.id, payload);
        toast.success('Attendance batch rejected.');
      } else if (batchActionType === 'lock') {
        await attendanceApi.lock(activeBatch.id, payload);
        toast.success('Attendance batch locked.');
      }
      setBatchActionType(null);
      setActionRemarks('');
      fetchBatch(selectedProjectId, selectedSiteId, selectedDate, selectedShift);
    } catch (err) {
      toast.error(err?.message || `Failed to complete ${batchActionType} transition.`);
    }
  };

  // Filtered list search
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (statusFilter !== 'all' && String(r.attendance_status_code) !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          String(r.worker_name || '').toLowerCase().includes(q) ||
          String(r.worker_code || '').toLowerCase().includes(q) ||
          String(r.contractor_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Status badges config
  const getStatusVariant = (code) => {
    if (code === 'PRESENT') return 'success';
    if (code === 'HALF_DAY') return 'warning';
    if (code === 'ABSENT') return 'error';
    return 'neutral';
  };

  // Check if current status allows editing
  const isEditable = activeBatch && (activeBatch.status_code === 'DRAFT' || activeBatch.status_code === 'REJECTED');

  return (
    <PageContainer>
      <PageHeader
        title="Daily Site Labour Attendance & Muster Roll"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Labour & Attendance' },
          { label: 'Daily Attendance' }
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total On Muster"
          value={activeBatch ? activeBatch.total_workers : 0}
          status="primary"
          icon={<Users />}
        />
        <KpiCard
          label="Present Today"
          value={activeBatch ? `${activeBatch.present_workers} Workers` : '0 Workers'}
          status="success"
          icon={<CheckCircle2 />}
        />
        <KpiCard
          label="Absent / On Leave"
          value={activeBatch ? `${activeBatch.absent_workers} Workers` : '0 Workers'}
          status={activeBatch?.absent_workers > 0 ? 'warning' : 'neutral'}
          icon={<XCircle />}
        />
        <KpiCard
          label="Working Hours Pool"
          value={activeBatch ? `${Number(activeBatch.total_regular_hours) + Number(activeBatch.total_overtime_hours)} Hours` : '0 Hours'}
          status="info"
          icon={<Clock />}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Scope Selectors & Navigation Toolbar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-surface border border-border rounded-lg p-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Quick Date Picker */}
            <div className="flex items-center gap-1 bg-surface-muted/60 p-1 rounded-lg border border-border">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handlePrevDay} title="Previous Day">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-7 text-xs font-mono font-bold w-36 bg-transparent border-0"
              />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleNextDay} title="Next Day">
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={handleToday}>
                Today
              </Button>
            </div>

            {/* Project Select */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="h-9 text-xs"
                placeholder="Select Project"
                options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
              />
            </div>

            {/* Site Select */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="h-9 text-xs"
                placeholder="Select Site"
                disabled={!selectedProjectId}
                options={sites.map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))}
              />
            </div>

            {/* Shift Select */}
            <div className="w-full sm:w-32">
              <Select
                value={selectedShift}
                onChange={setSelectedShift}
                className="h-9 text-xs"
                placeholder="Select Shift"
                options={[
                  { value: 'GENERAL', label: 'General Shift' },
                  { value: 'NIGHT', label: 'Night Shift' },
                  { value: 'OVERTIME', label: 'OT Shift' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {activeBatch && (
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20`}>
                Muster Status: {activeBatch.status_name}
              </span>
            )}
          </div>
        </div>

        {/* Roster & Grid Section */}
        {!selectedSiteId ? (
          <div className="text-center py-12 bg-surface border border-border/80 rounded-lg text-text-secondary text-[13px]">
            Please select a project and site location to view daily muster.
          </div>
        ) : loading ? (
          <div className="text-center py-12 bg-surface border border-border/80 rounded-lg text-text-muted text-[13px]">
            Loading attendance records...
          </div>
        ) : !activeBatch ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-xl shadow-sm max-w-xl mx-auto my-6">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
              <Calendar className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-text-primary mb-1">Muster Roll Not Initialized</h3>
            <p className="text-[11.5px] text-text-muted max-w-sm mb-5">
              No daily muster or attendance sheet is active for this site and date. Initialize to populate active assignments.
            </p>
            {hasPermission('attendance.create') && (
              <Button variant="primary" className="h-9 px-4 text-[13px]" onClick={handleInitializeBatch}>
                Initialize Attendance Roll
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="w-full sm:w-[260px]">
                  <SearchField
                    placeholder="Search by worker name, code, contractor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-36">
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="h-9 text-xs"
                    placeholder="All Statuses"
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'PRESENT', label: 'Present' },
                      { value: 'HALF_DAY', label: 'Half Day' },
                      { value: 'ABSENT', label: 'Absent' },
                    ]}
                  />
                </div>
              </div>

              {/* Roster Actions */}
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {isEditable && hasPermission('attendance.create') && (
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-[13px]"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      loadAvailableAssignments();
                      setIsAddOpen(true);
                    }}
                  >
                    Add Worker
                  </Button>
                )}

                {/* Workflow Transitions */}
                {activeBatch.status_code === 'DRAFT' && hasPermission('attendance.submit') && (
                  <Button
                    variant="primary"
                    className="h-9 px-3 text-[13px]"
                    leftIcon={<Send className="w-4 h-4" />}
                    onClick={() => {
                      setBatchActionType('submit');
                      setActionRemarks('');
                    }}
                  >
                    Submit Muster
                  </Button>
                )}

                {activeBatch.status_code === 'SUBMITTED' && hasPermission('attendance.approve') && (
                  <>
                    <Button
                      variant="primary"
                      className="h-9 px-3 text-[13px] bg-emerald-600 hover:bg-emerald-700"
                      leftIcon={<Check className="w-4 h-4" />}
                      onClick={() => {
                        setBatchActionType('approve');
                        setActionRemarks('');
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="h-9 px-3 text-[13px]"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => {
                        setBatchActionType('reject');
                        setActionRemarks('');
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {activeBatch.status_code === 'APPROVED' && hasPermission('attendance.approve') && (
                  <Button
                    variant="primary"
                    className="h-9 px-3 text-[13px]"
                    leftIcon={<Lock className="w-4 h-4" />}
                    onClick={() => {
                      setBatchActionType('lock');
                      setActionRemarks('');
                    }}
                  >
                    Lock Muster
                  </Button>
                )}
              </div>
            </div>

            {/* Data Table */}
            <DataTableContainer
              pagination={
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalResults={filtered.length}
                  pageSize={perPage}
                  onPageChange={setPage}
                />
              }
            >
              <table className="w-full text-left text-[12px] table-auto whitespace-nowrap">
                <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">#</th>
                    <th className="px-3 py-2 w-28">Worker Code</th>
                    <th className="px-3 py-2 w-48">Worker Name</th>
                    <th className="px-3 py-2 w-44">Contractor / Agency</th>
                    <th className="px-3 py-2 text-center w-24">Regular Hrs</th>
                    <th className="px-3 py-2 text-center w-24">OT Hrs</th>
                    <th className="px-3 py-2 w-32">Site Remarks</th>
                    <th className="px-3 py-2 w-28 text-center">Muster Alert</th>
                    <th className="px-3 py-2 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-text-muted text-[12px]">
                        No workers match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paged.map((r, index) => (
                      <tr key={r.id || index} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + index + 1}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-text-primary text-[11px]">
                          {r.worker_code}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-text-primary text-[12px]">{r.worker_name}</div>
                          <div className="text-[10px] text-text-muted">{r.attendance_status_name}</div>
                        </td>
                        <td className="px-3 py-2 text-text-primary text-[11px] truncate">
                          {r.contractor_name || 'Direct / Payroll'}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-semibold text-text-primary text-[11px]">
                          {r.regular_hours} hrs
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-semibold text-text-primary text-[11px]">
                          {r.overtime_hours} hrs
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px] truncate max-w-[120px]">
                          {r.remarks || '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isEditable ? (
                            <div className="inline-flex items-center gap-1 bg-surface-muted/50 p-0.5 rounded-lg border border-border">
                              <button
                                onClick={() => handleToggleStatus(r, 'PRESENT')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  r.attendance_status_code === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-text-secondary hover:text-emerald-600'
                                }`}
                                title="Mark Present (Full Day)"
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleToggleStatus(r, 'HALF_DAY')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  r.attendance_status_code === 'HALF_DAY'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-text-secondary hover:text-amber-600'
                                }`}
                                title="Mark Half Day (4 Hrs)"
                              >
                                HD
                              </button>
                              <button
                                onClick={() => handleToggleStatus(r, 'ABSENT')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  r.attendance_status_code === 'ABSENT'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-text-secondary hover:text-red-600'
                                }`}
                                title="Mark Absent"
                              >
                                A
                              </button>
                            </div>
                          ) : (
                            <Badge variant={getStatusVariant(r.attendance_status_code)}>
                              {r.attendance_status_name}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Details"
                              onClick={() => setViewingRecord(r)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {isEditable && hasPermission('attendance.create') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Delete"
                                onClick={() => setDeletingRecord(r)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DataTableContainer>
          </div>
        )}
      </div>

      {/* Add Worker Entry Modal */}
      <EntityEditModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <EntityEditModal.Header
          icon={Users}
          title="Add Worker to Daily Muster"
          subtitle="Assign an active site worker and set initial timing logs."
          onClose={() => setIsAddOpen(false)}
        />
        <form onSubmit={handleAddManualEntry} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker Details">
              <EntityEditModal.Grid>
                <FormField label="Assigned Worker" required>
                  <Select
                    value={manualForm.assignment_id}
                    onChange={(val) => setManualForm(prev => ({ ...prev, assignment_id: val }))}
                    placeholder="Select assigned worker"
                    options={availableAssignments.map(a => ({ value: String(a.id), label: `${a.worker_code} - ${a.worker_name} (${a.category_name})` }))}
                  />
                </FormField>

                <FormField label="Muster Status" required>
                  <Select
                    value={manualForm.attendance_status_id}
                    onChange={(val) => setManualForm(prev => ({ ...prev, attendance_status_id: val }))}
                    placeholder="Select status"
                    options={masters?.['attendance-statuses']?.map(s => ({ value: String(s.id), label: s.attendance_status_name })) || []}
                  />
                </FormField>

                <FormField label="Regular Hours Worked">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={manualForm.regular_hours}
                    onChange={(e) => setManualForm(prev => ({ ...prev, regular_hours: e.target.value }))}
                  />
                </FormField>

                <FormField label="Overtime Hours Worked">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={manualForm.overtime_hours}
                    onChange={(e) => setManualForm(prev => ({ ...prev, overtime_hours: e.target.value }))}
                  />
                </FormField>

                <FormField label="Check-In Time">
                  <Input
                    type="text"
                    placeholder="HH:MM:SS"
                    value={manualForm.check_in_time}
                    onChange={(e) => setManualForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                  />
                </FormField>

                <FormField label="Check-Out Time">
                  <Input
                    type="text"
                    placeholder="HH:MM:SS"
                    value={manualForm.check_out_time}
                    onChange={(e) => setManualForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                  />
                </FormField>

                <FormField label="Work Description" className="md:col-span-2">
                  <Textarea
                    placeholder="Describe the work performed..."
                    value={manualForm.work_description}
                    onChange={(e) => setManualForm(prev => ({ ...prev, work_description: e.target.value }))}
                    rows={2}
                  />
                </FormField>

                <FormField label="Remarks" className="md:col-span-2">
                  <Textarea
                    placeholder="Job assignment remarks, special notes..."
                    value={manualForm.remarks}
                    onChange={(e) => setManualForm(prev => ({ ...prev, remarks: e.target.value }))}
                    rows={2}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            submitLabel="Add to Muster"
            onCancel={() => setIsAddOpen(false)}
          />
        </form>
      </EntityEditModal>

      {/* View Details Modal */}
      <EntityEditModal isOpen={Boolean(viewingRecord)} onClose={() => setViewingRecord(null)}>
        <EntityEditModal.Header
          icon={Eye}
          title="Labour Attendance 360"
          subtitle="Detailed daily timing logs and work parameters."
          onClose={() => setViewingRecord(null)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker Information">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Worker Name</div>
                  <div className="text-[13px] font-medium text-text-primary mt-1">{viewingRecord?.worker_name || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Worker Code</div>
                  <div className="text-[13px] font-mono font-semibold text-text-primary mt-1">{viewingRecord?.worker_code || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Contractor / Agency</div>
                  <div className="text-[13px] text-text-primary mt-1">{viewingRecord?.contractor_name || 'Direct / Payroll'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Subcontractor</div>
                  <div className="text-[13px] text-text-primary mt-1">{viewingRecord?.subcontractor_name || '—'}</div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Muster Timings">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Attendance Status</div>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(viewingRecord?.attendance_status_code)}>
                      {viewingRecord?.attendance_status_name}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Timings (In / Out)</div>
                  <div className="text-[13px] font-mono text-text-primary mt-1">
                    {viewingRecord?.check_in_time || '—'} to {viewingRecord?.check_out_time || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Regular Hours</div>
                  <div className="text-[13px] font-mono text-text-primary mt-1">{viewingRecord?.regular_hours || 0} hrs</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Overtime Hours</div>
                  <div className="text-[13px] font-mono text-text-primary mt-1">{viewingRecord?.overtime_hours || 0} hrs</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Remarks / Work Description</div>
                  <div className="text-[12px] text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                    {viewingRecord?.remarks || 'No daily site remarks provided.'}
                  </div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <div className="flex items-center justify-end border-t border-border px-4 py-3 bg-surface-subtle">
            <Button variant="ghost" className="h-9 px-4 text-[13px]" onClick={() => setViewingRecord(null)}>
              Close
            </Button>
          </div>
        </div>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        title="Delete Roster Entry"
        message="Are you sure you want to remove this worker from the daily attendance roll? This will wipe out check-in logs for today."
        variant="danger"
        confirmLabel="Remove"
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeletingRecord(null)}
      />

      {/* Workflow Transition Confirmation Modal */}
      {batchActionType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary capitalize">{batchActionType} Daily Muster</h3>
              <Button variant="ghost" size="sm" onClick={() => setBatchActionType(null)}>✕</Button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[12px] text-text-secondary leading-normal">
                Are you sure you want to {batchActionType} the attendance batch for date <span className="font-mono font-bold text-text-primary">{selectedDate}</span>?
              </p>
              <FormField label="Administration Remarks">
                <Textarea
                  placeholder="Provide comments or remarks..."
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setBatchActionType(null)}>Cancel</Button>
              <Button variant="primary" size="sm" className="capitalize" onClick={handleBatchTransition}>Confirm {batchActionType}</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
