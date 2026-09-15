import { Shield, Clock } from 'lucide-react';
import { ReportPage } from '../../shared/components/ReportPage';
import { systemAdminApi } from '../../../api/apiservice';

export function AuditLogsPage() {
  return (
    <ReportPage
      title="Audit Logs"
      icon={Shield}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }, { label: 'Audit Logs' }]}
      fetchData={systemAdminApi.auditLogs}
      extractList={(res) => res?.data?.audit_logs ?? res?.audit_logs ?? []}
      columns={[
        { key: 'occurred_at', label: 'Timestamp', className: 'w-36', format: 'date' },
        { key: 'user_name', label: 'User', className: 'w-36', cellClass: 'font-medium text-text-primary', render: (row) => row.first_name ? `${row.first_name} ${row.last_name || ''}` : row.user_email || '—' },
        { key: 'action_code', label: 'Action', className: 'w-24' },
        { key: 'entity_type', label: 'Entity', className: 'w-28' },
        { key: 'entity_id', label: 'ID', className: 'w-16' },
        { key: 'description', label: 'Description', className: 'w-64' },
        { key: 'ip_address', label: 'IP', className: 'w-28' },
      ]}
      searchKeys={['user_email', 'first_name', 'last_name', 'action_code', 'entity_type', 'description']}
    />
  );
}
