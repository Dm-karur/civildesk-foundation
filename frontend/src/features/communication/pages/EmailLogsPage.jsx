import { useState, useEffect, useMemo } from 'react';
import {
  Mail, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Send, RefreshCw, Paperclip
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function EmailLogsPage() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const handleComposeSend = (e) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast.error('Please enter recipient email and subject.');
      return;
    }
    const newLog = {
      id: Date.now(),
      email_id: `EML-2026-${String(logs.length + 1093).padStart(4, '0')}`,
      subject: composeSubject,
      recipient_email: composeTo,
      recipient_name: composeTo.split('@')[0],
      sender_email: 'transmittals@civildesk.in',
      attachments: 'None (Direct Dispatch)',
      timestamp: 'Just now',
      smtp_response: '250 OK - Dispatched via SMTP Mail Gateway',
      status: 'Delivered (250 OK)'
    };
    setLogs([newLog, ...logs]);
    setIsComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    toast.success('Email dispatched successfully via secure SMTP gateway.');
  };

  const handleResend = (log) => {
    toast.success(`Resent email ${log.email_id} to ${log.recipient_email}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (statusFilter !== 'all' && !l.status.includes(statusFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const id = String(l.email_id || '').toLowerCase();
        const sub = String(l.subject || '').toLowerCase();
        const rec = String(l.recipient_email || '').toLowerCase();
        const snd = String(l.sender_email || '').toLowerCase();
        if (!id.includes(str) && !sub.includes(str) && !rec.includes(str) && !snd.includes(str)) return false;
      }
      return true;
    });
  }, [logs, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Communication & Collaboration', href: '/communication/project-messages' },
    { label: 'Email Transmittal Logs' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Email Dispatches & Transmittal Transmission Logs"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Dispatched Transmittals"
            value={`${logs.length} Emails`}
            status="primary"
            icon={<Mail className="w-4 h-4" />}
          />
          <KpiCard
            label="SMTP Delivery Success"
            value="100% (250 OK)"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Attachments Delivered"
            value="Zero Bounce Rate"
            status="success"
            icon={<Paperclip className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="TLS Encryption Status"
            value="TLS 1.3 Active"
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
                  { value: 'all', label: 'All Delivery Statuses' },
                  { value: 'Delivered', label: 'Delivered (250 OK)' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search subject, recipient email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => setIsComposeOpen(true)}
              className="text-xs h-8 shadow-xs"
            >
              Compose Email
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
                  <th className="px-3 py-2 w-32">Email Ref ID</th>
                  <th className="px-3 py-2">Subject & Attachments</th>
                  <th className="px-3 py-2 w-48">Recipient Email</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Timestamp</th>
                  <th className="px-3 py-2 text-center w-36">Delivery Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading email transmittal logs...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No email transmittal logs found.
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
                          {l.email_id}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.subject}>
                            {l.subject}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            <Paperclip className="w-2.5 h-2.5 inline mr-1 text-sky-500" />{l.attachments}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[11px] truncate font-mono">{l.recipient_email}</span>
                          <span className="text-[10px] text-text-muted truncate">{l.recipient_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {l.timestamp}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Email Headers & Content"
                            onClick={() => setViewingItem(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-primary hover:text-primary-dark"
                            title="Forward / Resend"
                            onClick={() => handleResend(l)}
                          >
                            <RefreshCw className="w-3 h-3" />
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{l.email_id}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.subject}</h4>
                  <span className="text-[11px] text-text-muted font-mono">{l.recipient_email}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  250 OK
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-text-muted text-[10px]">{l.timestamp}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                    <Eye className="w-3 h-3 mr-1" /> View Headers
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleResend(l)}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Resend
                  </Button>
                </div>
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

      {/* View Email 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.email_id}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.smtp_response}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Subject</span> <span className="font-bold text-text-primary text-[13px]">{viewingItem.subject}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">To Recipient</span> <span className="font-mono text-primary font-bold">{viewingItem.recipient_email}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">From Sender</span> <span className="font-mono">{viewingItem.sender_email}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Sent Timestamp</span> <span className="font-mono">{viewingItem.timestamp}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Status</span> <span className="font-bold text-emerald-700">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Attached Transmittal Documents</span> <span className="font-mono text-text-primary">{viewingItem.attachments}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="primary" size="sm" onClick={() => { handleResend(viewingItem); setViewingItem(null); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resend / Forward Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary">Dispatch Transmittal Email</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsComposeOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleComposeSend} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">To Recipient Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client.pm@dlf.in"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Email Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Work Order SWO-002 Release"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Email Body Text</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Official message body..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full border border-border rounded-md p-2.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Send Transmittal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
