import { useState, useEffect, useMemo, useCallback } from 'react';
import { Mail, ShieldCheck, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { systemAdminApi } from '../../../api/apiservice';

export function NotificationLogsPage() {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  // View modal state
  const [viewingItem, setViewingItem] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resLogs, resSummary] = await Promise.all([
        systemAdminApi.notifications(),
        systemAdminApi.notificationSummary(),
      ]);

      const logList = resLogs?.data?.notifications ?? resLogs?.notifications ?? (Array.isArray(resLogs) ? resLogs : []);
      setNotifications(Array.isArray(logList) ? logList : []);

      const sumObj = resSummary?.data?.notification_summary ?? resSummary?.notification_summary ?? null;
      setSummary(sumObj);
    } catch (err) {
      toast.error('Failed to load system notification logs.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filters & Search
  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.message || '').toLowerCase().includes(q) ||
        String(item.recipient_email || '').toLowerCase().includes(q) ||
        String(item.first_name || '').toLowerCase().includes(q) ||
        String(item.last_name || '').toLowerCase().includes(q)
      );
    });
  }, [notifications, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Summary Metrics
  const totalCount = summary?.totals?.total ?? notifications.length;
  const unreadCount = summary?.totals?.unread ?? 0;
  const failedCount = summary?.totals?.email_failed ?? 0;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Administration' },
    { label: 'Notification Logs' },
  ];

  return (
    <PageContainer>
      <PageHeader title="System Notification Dispatch Log" breadcrumbs={breadcrumbs} />

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Total Dispatched Logs" value={totalCount} icon={<Mail />} status="primary" />
        <KpiCard label="Email Delivery Failures" value={failedCount} icon={<AlertCircle />} status="error" />
        <KpiCard label="Unread Inbox Alert States" value={unreadCount} icon={<ShieldCheck />} status="info" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by subject, message, recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-[13px]"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh Logs
            </Button>
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
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-12 text-center">#</th>
                <th className="px-3 py-2 w-32">Timestamp</th>
                <th className="px-3 py-2 w-48">Alert Topic / Title</th>
                <th className="px-3 py-2 w-44">Recipient</th>
                <th className="px-3 py-2 hidden md:table-cell">Message Content</th>
                <th className="px-3 py-2 w-28 text-center">Email Status</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-muted text-[12px]">
                    Loading dispatched notifications...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-muted text-[12px]">
                    No notification logs found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-text-primary text-[11px]">
                      {item.created_at || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.title || '—'}
                    </td>
                    <td className="px-3 py-2 text-text-primary text-[11px] truncate">
                      {item.first_name ? `${item.first_name} ${item.last_name || ''}` : '—'} <br />
                      <span className="text-[10px] text-text-muted">{item.recipient_email}</span>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.message || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.email_sent ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/10 text-success">
                          Sent
                        </span>
                      ) : item.email_error ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-error/10 text-error">
                          Failed
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Details"
                          onClick={() => setViewingItem(item)}
                        >
                          <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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

      {/* View Details Modal */}
      <EntityEditModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
      >
        <EntityEditModal.Header
          icon={Mail}
          title="Notification Log Specifications"
          subtitle="Details of the system dispatched message and delivery status."
          onClose={() => setViewingItem(null)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Alert Details">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Alert Subject</div>
                  <div className="text-[13px] font-medium text-text-primary mt-1">{viewingItem?.title || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Timestamp</div>
                  <div className="text-[13px] font-mono text-text-primary mt-1">{viewingItem?.created_at || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Recipient Name</div>
                  <div className="text-[13px] text-text-primary mt-1">
                    {viewingItem?.first_name ? `${viewingItem.first_name} ${viewingItem.last_name || ''}` : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Recipient Email</div>
                  <div className="text-[13px] font-mono text-text-primary mt-1">{viewingItem?.recipient_email || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Email Send Status</div>
                  <div className="mt-1">
                    {viewingItem?.email_sent ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/10 text-success">
                        Sent (Success)
                      </span>
                    ) : viewingItem?.email_error ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-error/10 text-error">
                        Delivery Failure
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary">
                        Pending Queue
                      </span>
                    )}
                  </div>
                </div>

                {viewingItem?.email_error && (
                  <div className="md:col-span-2">
                    <div className="text-[10px] uppercase font-bold text-error tracking-wider">Delivery Error Logs</div>
                    <div className="text-[12px] text-error bg-error/5 border border-error/20 p-2.5 rounded mt-1 font-mono">
                      {viewingItem.email_error}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Alert Message Body</div>
                  <div className="text-[12px] text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed bg-surface-muted p-3 rounded border border-border/60">
                    {viewingItem?.message || '—'}
                  </div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <div className="flex items-center justify-end border-t border-border px-4 py-3 bg-surface-subtle">
            <Button variant="ghost" className="h-9 px-4 text-[13px]" onClick={() => setViewingItem(null)}>
              Close
            </Button>
          </div>
        </div>
      </EntityEditModal>
    </PageContainer>
  );
}
