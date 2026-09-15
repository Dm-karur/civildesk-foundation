import { ClipboardList, Send } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { dailyReportsApi } from '../../../api/apiservice';

/* Backend: DailySiteReportsController → ok('...','daily_site_reports', [...])
   DB: daily_site_reports (via DailySiteReports model) */
const extract = (res) => res?.data?.daily_site_reports ?? res?.data?.data ?? [];

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
];

export function DailyWorkReportPage() {
  return (
    <DocumentListPage
      title="Daily Work Reports"
      icon={ClipboardList}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Daily Site Operations' }, { label: 'Daily Work Reports' }]}
      api={dailyReportsApi}
      extractList={extract}
      columns={[
        { key: 'report_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'project_name', label: 'Project', className: 'w-36' },
        { key: 'site_name', label: 'Site', className: 'w-28' },
        { key: 'zone_name', label: 'Zone', className: 'w-24' },
        { key: 'weather', label: 'Weather', className: 'w-20' },
        { key: 'overall_progress', label: 'Progress%', className: 'w-20 text-right' },
        { key: 'total_manpower', label: 'Manpower', className: 'w-20 text-right' },
        { key: 'total_equipment', label: 'Equipment', className: 'w-20 text-right' },
        { key: 'issues_count', label: 'Issues', className: 'w-16 text-right' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['project_name', 'site_name', 'zone_name']}
      statusOptions={STATUS}
      entityName="Daily Report"
      permissionPrefix="daily_reports"
      actions={[
        { name: 'submit', label: 'Submit', icon: <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />, condition: (i) => String(i.status_name || '').toLowerCase().includes('draft') },
      ]}
    />
  );
}
