import { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, Filter, Download, Users, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { toast } from '../../../components/composite/Toast';
import { employeeAttendanceApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const STATUS_COLORS = { PRESENT:'success', ABSENT:'danger', HALF_DAY:'warning', LEAVE:'info', LATE:'warning', EARLY_EXIT:'warning', OVERTIME:'success', WEEK_OFF:'neutral', HOLIDAY:'info', PERMISSION:'info' };
const STATUSES = ['PRESENT','ABSENT','HALF_DAY','LEAVE','LATE','EARLY_EXIT','OVERTIME','WEEK_OFF','HOLIDAY','PERMISSION'];

export function EmployeeAttendanceRegisterPage() {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [siteId, setSiteId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    sitesApi.list().then(r => setSites(r?.data?.sites ?? r?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {};
        if (selectedDate && !dateFrom && !dateTo) params.date = selectedDate;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (siteId) params.site_id = siteId;
        if (statusFilter) params.status = statusFilter;
        if (search) params.search = search;
        const res = await employeeAttendanceApi.list(params);
        setRecords(res?.data?.attendances ?? []);
      } catch (err) { toast.error(err.message || 'Failed to load attendance.'); }
      finally { setLoading(false); }
    }
    load();
  }, [selectedDate, dateFrom, dateTo, siteId, statusFilter, search]);

  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, late: 0, halfDay: 0, total: records.length };
    records.forEach(r => {
      if (['PRESENT','LATE','EARLY_EXIT','OVERTIME'].includes(r.status)) s.present++;
      if (r.status === 'ABSENT') s.absent++;
      if (r.status === 'LEAVE') s.leave++;
      if (r.status === 'LATE') s.late++;
      if (r.status === 'HALF_DAY') s.halfDay++;
    });
    return s;
  }, [records]);

  const paged = useMemo(() => records.slice((page - 1) * perPage, page * perPage), [records, page]);

  return (
    <PageContainer>
      <PageHeader title="Attendance Register" subtitle="View daily and monthly employee attendance records" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 mb-6">
        <KpiCard label="Total" value={stats.total} icon={Users} />
        <KpiCard label="Present" value={stats.present} icon={CheckCircle2} variant="success" />
        <KpiCard label="Absent" value={stats.absent} icon={XCircle} variant="danger" />
        <KpiCard label="Leave" value={stats.leave} icon={Calendar} variant="info" />
        <KpiCard label="Late" value={stats.late} icon={AlertTriangle} variant="warning" />
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
          <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setDateFrom(''); setDateTo(''); setPage(1); }} />
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-text-secondary mb-1">From</label>
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setSelectedDate(''); setPage(1); }} />
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setSelectedDate(''); setPage(1); }} />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-text-secondary mb-1">Site</label>
          <Select value={siteId} onChange={e => { setSiteId(e.target.value); setPage(1); }}>
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
          </Select>
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
          <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchField value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search employee..." />
        </div>
      </div>

      <DataTableContainer loading={loading}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
              <th className="px-3 py-3">Employee</th>
              <th className="px-3 py-3">Site</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Check In</th>
              <th className="px-3 py-3">Check Out</th>
              <th className="px-3 py-3">Hours</th>
              <th className="px-3 py-3">Late</th>
              <th className="px-3 py-3">OT</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-text-secondary">No attendance records found.</td></tr>
            )}
            {paged.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-text-primary">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-text-secondary">{r.employee_code}</div>
                </td>
                <td className="px-3 py-2.5 text-text-secondary">{r.site_name}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.attendance_date}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '—'}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '—'}</td>
                <td className="px-3 py-2.5 font-medium">{r.working_hours ?? '—'}</td>
                <td className="px-3 py-2.5">{r.late_minutes > 0 ? <Badge variant="warning">{r.late_minutes}m</Badge> : '—'}</td>
                <td className="px-3 py-2.5">{r.overtime_hours > 0 ? <Badge variant="success">{r.overtime_hours}h</Badge> : '—'}</td>
                <td className="px-3 py-2.5"><Badge variant={STATUS_COLORS[r.status] || 'neutral'}>{r.status?.replace('_', ' ')}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableContainer>

      {records.length > perPage && (
        <Pagination current={page} total={Math.ceil(records.length / perPage)} onChange={setPage} />
      )}
    </PageContainer>
  );
}
