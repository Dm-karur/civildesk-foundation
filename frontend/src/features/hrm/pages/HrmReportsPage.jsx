import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Calendar, Download, Search, Filter, Printer,
  Users, IndianRupee, Clock, AlertTriangle, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../components/composite/Toast';
import { employeeAttendanceApi, employeeLeaveApi, employeePayrollApi, sitesApi } from '../../../api/apiservice';

const TABS = [
  { id: 'attendance_summary', label: 'Monthly Attendance Summary', icon: Users },
  { id: 'late_early', label: 'Late Coming & Early Leaving', icon: Clock },
  { id: 'overtime', label: 'Overtime Register', icon: Clock },
  { id: 'leave_balance', label: 'Leave Register & Balances', icon: Calendar },
  { id: 'bank_statement', label: 'Bank / Salary Disbursal', icon: IndianRupee },
  { id: 'payroll_summary', label: 'Payroll Summary', icon: FileText },
];

export function HrmReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance_summary');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Load sites for filtering
  useEffect(() => {
    sitesApi.list({ per_page: 100 })
      .then((res) => {
        const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        setSites(list);
      })
      .catch(() => {});
  }, []);

  // Fetch report data when tab, month, or site changes
  useEffect(() => {
    setLoading(true);
    setPage(1);

    const params = { month: selectedMonth };
    if (selectedSite) params.site_id = selectedSite;

    if (activeTab === 'attendance_summary') {
      employeeAttendanceApi.monthlySummary(params)
        .then((res) => setData(res?.data?.summary || res?.data || []))
        .catch(() => setData([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'late_early') {
      employeeAttendanceApi.list({ ...params, status: 'LATE' })
        .then((res) => {
          const raw = res?.data?.data || res?.data || [];
          setData(Array.isArray(raw) ? raw : []);
        })
        .catch(() => setData([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'overtime') {
      employeeAttendanceApi.overtime(params)
        .then((res) => setData(res?.data?.data || res?.data || []))
        .catch(() => setData([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'leave_balance') {
      employeeLeaveApi.leaveBalances(params)
        .then((res) => setData(res?.data || []))
        .catch(() => setData([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'bank_statement' || activeTab === 'payroll_summary') {
      employeePayrollApi.list(params)
        .then((res) => setData(res?.data?.data || res?.data || []))
        .catch(() => setData([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab, selectedMonth, selectedSite]);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) => {
      const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
      const code = (item.employee_code || item.user_id || '').toString().toLowerCase();
      const site = (item.site_name || '').toLowerCase();
      const dept = (item.department || '').toLowerCase();
      return name.includes(q) || code.includes(q) || site.includes(q) || dept.includes(q);
    });
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const pagedData = filteredData.slice((page - 1) * perPage, page * perPage);

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredData.length) {
      toast.error('No data available to export');
      return;
    }

    let headers = [];
    let rows = [];

    if (activeTab === 'attendance_summary') {
      headers = ['Employee Code', 'Name', 'Site', 'Department', 'Working Days', 'Present', 'Absent', 'Half Days', 'Paid Leaves', 'Late Days', 'OT Hours'];
      rows = filteredData.map((r) => [
        r.employee_code || '-',
        `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.user_id,
        r.site_name || '-',
        r.department || '-',
        r.total_working_days || 0,
        r.present_days || 0,
        r.absent_days || 0,
        r.half_days || 0,
        r.paid_leaves || 0,
        r.late_days || 0,
        r.overtime_hours || 0,
      ]);
    } else if (activeTab === 'late_early') {
      headers = ['Date', 'Employee Code', 'Name', 'Site', 'Shift In', 'Actual In', 'Late (Mins)', 'Early Leaving (Mins)'];
      rows = filteredData.map((r) => [
        r.attendance_date,
        r.employee_code || '-',
        `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        r.site_name || '-',
        r.shift_start || '09:00',
        r.in_time ? new Date(r.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        r.late_minutes || 0,
        r.early_leaving_minutes || 0,
      ]);
    } else if (activeTab === 'overtime') {
      headers = ['Date', 'Employee Code', 'Name', 'Site', 'Hours', 'Rate Multiplier', 'OT Amount', 'Status'];
      rows = filteredData.map((r) => [
        r.ot_date,
        r.employee_code || '-',
        `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        r.site_name || '-',
        r.ot_hours,
        r.rate_multiplier || 1.5,
        r.ot_amount || 0,
        r.status || 'PENDING',
      ]);
    } else if (activeTab === 'leave_balance') {
      headers = ['Employee Code', 'Name', 'Leave Type', 'Opening', 'Credited', 'Availed', 'Balance'];
      rows = filteredData.map((r) => [
        r.employee_code || '-',
        `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        r.leave_type_name || r.leave_type_code,
        r.opening_balance || 0,
        r.credited_days || 0,
        r.availed_days || 0,
        r.balance_days || 0,
      ]);
    } else if (activeTab === 'bank_statement') {
      headers = ['Employee Code', 'Name', 'Bank Name', 'Account Number', 'IFSC Code', 'PAN Number', 'Net Payable (₹)'];
      rows = filteredData.map((r) => [
        r.employee_code || '-',
        `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        r.bank_name || '-',
        r.bank_account_number || '-',
        r.ifsc_code || '-',
        r.pan_number || '-',
        r.net_pay || 0,
      ]);
    } else if (activeTab === 'payroll_summary') {
      headers = ['Month', 'Employee Code', 'Name', 'Site', 'Basic Pay', 'HRA', 'Gross Earnings', 'PF', 'ESI', 'TDS', 'Advance', 'Net Payable', 'Status'];
      rows = filteredData.map((r) => [
        r.payroll_month,
        r.employee_code || '-',
        `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        r.site_name || '-',
        r.basic_pay || 0,
        r.hra || 0,
        r.gross_earnings || 0,
        r.pf_deduction || 0,
        r.esi_deduction || 0,
        r.tds_deduction || 0,
        r.advance_deduction || 0,
        r.net_pay || 0,
        r.status || 'DRAFT',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="HRM & Attendance Reports"
        description="Comprehensive workforce attendance, leave balances, overtime, and salary bank transfer statements."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'HRM', href: '/hrm/attendance' },
          { label: 'Reports' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border-default pb-px gap-1">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-neutral-light/50'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-md border border-border-default shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-secondary">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-3 rounded border border-border-default bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="w-48">
            <Select
              placeholder="All Sites"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              options={[
                { value: '', label: 'All Sites' },
                ...sites.map((s) => ({ value: String(s.site_id), label: s.site_name })),
              ]}
            />
          </div>
        </div>

        <div className="w-64">
          <SearchField
            placeholder="Search employee, site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Report Table View */}
      <DataTableContainer loading={loading} totalItems={filteredData.length}>
        {activeTab === 'attendance_summary' && (
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-neutral-light uppercase tracking-wider text-[11px] font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Site / Dept</th>
                <th className="px-4 py-3 text-center">Working Days</th>
                <th className="px-4 py-3 text-center text-emerald-600">Present</th>
                <th className="px-4 py-3 text-center text-rose-600">Absent</th>
                <th className="px-4 py-3 text-center text-amber-600">Half Days</th>
                <th className="px-4 py-3 text-center text-blue-600">Paid Leaves</th>
                <th className="px-4 py-3 text-center text-orange-600">Late Days</th>
                <th className="px-4 py-3 text-center">OT (Hrs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">No summary records found for this month</td>
                </tr>
              ) : (
                pagedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-light/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{row.first_name} {row.last_name}</div>
                      <div className="text-[11px] text-text-secondary">{row.employee_code || `User #${row.user_id}`}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary">{row.site_name || 'Head Office'}</div>
                      <div className="text-[11px] text-text-secondary">{row.department || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{row.total_working_days || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">{row.present_days || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-rose-600">{row.absent_days || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-600">{row.half_days || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-600">{row.paid_leaves || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-orange-600">{row.late_days || 0}</td>
                    <td className="px-4 py-3 text-center font-medium">{row.overtime_hours || 0}h</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'late_early' && (
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-neutral-light uppercase tracking-wider text-[11px] font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Shift Time</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3 text-rose-600">Late By</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3 text-amber-600">Early Leaving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">No late check-ins recorded for this month</td>
                </tr>
              ) : (
                pagedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-light/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.attendance_date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{row.first_name} {row.last_name}</div>
                      <div className="text-[11px] text-text-secondary">{row.employee_code}</div>
                    </td>
                    <td className="px-4 py-3">{row.site_name || 'Head Office'}</td>
                    <td className="px-4 py-3">{row.shift_start || '09:00'} - {row.shift_end || '18:00'}</td>
                    <td className="px-4 py-3 font-medium text-rose-600">
                      {row.in_time ? new Date(row.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{row.late_minutes || 0} mins</td>
                    <td className="px-4 py-3">
                      {row.out_time ? new Date(row.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-600">{row.early_leaving_minutes || 0} mins</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'overtime' && (
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-neutral-light uppercase tracking-wider text-[11px] font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3 text-center">OT Hours</th>
                <th className="px-4 py-3 text-center">Multiplier</th>
                <th className="px-4 py-3 text-right">Calculated Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No overtime entries found</td>
                </tr>
              ) : (
                pagedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-light/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.ot_date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{row.first_name} {row.last_name}</div>
                      <div className="text-[11px] text-text-secondary">{row.employee_code}</div>
                    </td>
                    <td className="px-4 py-3">{row.site_name || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-primary">{row.ot_hours} hrs</td>
                    <td className="px-4 py-3 text-center">{row.rate_multiplier || 1.5}x</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">₹{Number(row.ot_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {row.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'leave_balance' && (
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-neutral-light uppercase tracking-wider text-[11px] font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3 text-center">Opening Balance</th>
                <th className="px-4 py-3 text-center">Credited</th>
                <th className="px-4 py-3 text-center text-rose-600">Availed</th>
                <th className="px-4 py-3 text-center text-emerald-600">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No leave balance records found</td>
                </tr>
              ) : (
                pagedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-light/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{row.first_name} {row.last_name}</div>
                      <div className="text-[11px] text-text-secondary">{row.employee_code}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.leave_type_name || row.leave_type_code}</td>
                    <td className="px-4 py-3 text-center">{row.opening_balance || 0}</td>
                    <td className="px-4 py-3 text-center text-blue-600">+{row.credited_days || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-rose-600">-{row.availed_days || 0}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{row.balance_days || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'bank_statement' && (
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-neutral-light uppercase tracking-wider text-[11px] font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Bank Name</th>
                <th className="px-4 py-3">Account Number</th>
                <th className="px-4 py-3">IFSC Code</th>
                <th className="px-4 py-3">PAN</th>
                <th className="px-4 py-3 text-right">Net Payable Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No payroll records found for bank statement</td>
                </tr>
              ) : (
                pagedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-light/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{row.first_name} {row.last_name}</div>
                      <div className="text-[11px] text-text-secondary">{row.employee_code}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{row.bank_name || 'HDFC Bank'}</td>
                    <td className="px-4 py-3 font-mono font-medium">{row.bank_account_number || '••••••••' + (row.user_id * 137).toString().slice(-4)}</td>
                    <td className="px-4 py-3 font-mono">{row.ifsc_code || 'HDFC0001234'}</td>
                    <td className="px-4 py-3 font-mono uppercase">{row.pan_number || 'ABCDE1234F'}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 text-sm">
                      ₹{Number(row.net_pay || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'payroll_summary' && (
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-neutral-light uppercase tracking-wider text-[11px] font-semibold text-text-primary">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3 text-right">Gross Earnings</th>
                <th className="px-4 py-3 text-right text-rose-600">PF</th>
                <th className="px-4 py-3 text-right text-rose-600">ESI</th>
                <th className="px-4 py-3 text-right text-rose-600">TDS</th>
                <th className="px-4 py-3 text-right text-amber-600">Advance</th>
                <th className="px-4 py-3 text-right font-bold text-text-primary">Net Pay</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">No payroll summary records found</td>
                </tr>
              ) : (
                pagedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-light/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{row.first_name} {row.last_name}</div>
                      <div className="text-[11px] text-text-secondary">{row.employee_code}</div>
                    </td>
                    <td className="px-4 py-3">{row.site_name || 'Head Office'}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{Number(row.gross_earnings || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-rose-600">₹{Number(row.pf_deduction || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-rose-600">₹{Number(row.esi_deduction || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-rose-600">₹{Number(row.tds_deduction || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-amber-600">₹{Number(row.advance_deduction || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">₹{Number(row.net_pay || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        row.status === 'LOCKED' ? 'bg-emerald-100 text-emerald-800' :
                        row.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-200 text-neutral-800'
                      }`}>
                        {row.status || 'DRAFT'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </DataTableContainer>
    </PageContainer>
  );
}
