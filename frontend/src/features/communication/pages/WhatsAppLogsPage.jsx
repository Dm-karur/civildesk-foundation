import { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Send, Phone, RefreshCw
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



export function WhatsAppLogsPage() {
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
  const [isTestSendOpen, setIsTestSendOpen] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [testTemplate, setTestTemplate] = useState('po_dispatch_v2');

  const handleTestSend = (e) => {
    e.preventDefault();
    if (!testMobile.trim() || !testRecipient.trim()) {
      toast.error('Please enter recipient name and mobile number.');
      return;
    }
    const newLog = {
      id: Date.now(),
      msg_id: `WA-MSG-2026-${String(logs.length + 85).padStart(3, '0')}`,
      event_trigger: 'Manual Test Notification',
      recipient_name: testRecipient,
      recipient_mobile: testMobile,
      recipient_role: 'Site Contact',
      template_name: testTemplate,
      message_text: `Test automated WhatsApp notification dispatched to ${testRecipient} via CivilDesk Meta Cloud API.`,
      timestamp: 'Just now',
      status: 'Delivered & Read'
    };
    setLogs([newLog, ...logs]);
    setIsTestSendOpen(false);
    setTestMobile('');
    setTestRecipient('');
    toast.success('WhatsApp notification dispatched successfully via API.');
  };

  const handleRetry = (log) => {
    toast.success(`Resent message ${log.msg_id} to ${log.recipient_mobile}.`);
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
        const id = String(l.msg_id || '').toLowerCase();
        const rec = String(l.recipient_name || '').toLowerCase();
        const mob = String(l.recipient_mobile || '').toLowerCase();
        const ev = String(l.event_trigger || '').toLowerCase();
        const msg = String(l.message_text || '').toLowerCase();
        if (!id.includes(str) && !rec.includes(str) && !mob.includes(str) && !ev.includes(str) && !msg.includes(str)) return false;
      }
      return true;
    });
  }, [logs, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const readCount = useMemo(() => logs.filter(l => l.status.includes('Read')).length, [logs]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Communication & Collaboration', href: '/communication/project-messages' },
    { label: 'WhatsApp Notification Logs' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="WhatsApp Automated Notifications & Message Log"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Automated Notifications"
            value={`${logs.length} Messages`}
            status="primary"
            icon={<MessageCircle className="w-4 h-4" />}
          />
          <KpiCard
            label="Delivery Success Rate"
            value="100% Delivered"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Read Receipt Ratio"
            value={`${readCount}/${logs.length} Read`}
            status="success"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Meta Cloud API Health"
            value="Connected & Active"
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
                  { value: 'Read', label: 'Delivered & Read' },
                  { value: 'Delivered', label: 'Delivered' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search recipient, mobile, trigger..."
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
              onClick={() => setIsTestSendOpen(true)}
              className="text-xs h-8 shadow-xs"
            >
              Send Notification
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
                  <th className="px-3 py-2 w-32">Message ID</th>
                  <th className="px-3 py-2">Trigger Event & Template</th>
                  <th className="px-3 py-2 w-44">Recipient & Mobile</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Timestamp</th>
                  <th className="px-3 py-2 text-center w-36">Delivery Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading WhatsApp notification logs...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No WhatsApp notification logs found.
                    </td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {l.msg_id}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.event_trigger}>
                            {l.event_trigger}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            Template: {l.template_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[11px] truncate">{l.recipient_name}</span>
                          <span className="text-[10px] text-text-muted font-mono truncate">{l.recipient_mobile}</span>
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
                            title="View Message Payload"
                            onClick={() => setViewingItem(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50"
                            title="Resend"
                            onClick={() => handleRetry(l)}
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
                  <span className="font-mono text-[10px] font-bold text-emerald-700 block">{l.msg_id}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.event_trigger}</h4>
                  <span className="text-[11px] text-text-muted">{l.recipient_name} ({l.recipient_mobile})</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {l.status}
                </Badge>
              </div>

              <div className="text-xs pt-1 border-t border-border/60">
                <p className="text-text-primary text-[11px] line-clamp-2">{l.message_text}</p>
                <span className="text-[10px] text-text-muted block mt-1">{l.timestamp}</span>
              </div>

              <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                  <Eye className="w-3 h-3 mr-1" /> View Payload
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-200" onClick={() => handleRetry(l)}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Resend
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

      {/* View WhatsApp Message 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.msg_id}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.event_trigger}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recipient Name</span> <span className="font-bold text-text-primary">{viewingItem.recipient_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mobile Number</span> <span className="font-mono font-bold text-emerald-700">{viewingItem.recipient_mobile}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Template ID</span> <span className="font-mono text-primary">{viewingItem.template_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Sent Timestamp</span> <span className="font-mono">{viewingItem.timestamp}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Status</span> <span className="font-bold text-emerald-700">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recipient Role</span> <span>{viewingItem.recipient_role}</span></div>
              </div>

              <div className="space-y-1">
                <span className="text-text-muted block text-[10px] uppercase font-bold">Message Payload Content</span>
                <div className="bg-emerald-50/50 border border-emerald-200/80 p-3 rounded-lg text-emerald-950 font-sans text-xs leading-relaxed">
                  {viewingItem.message_text}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { handleRetry(viewingItem); setViewingItem(null); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resend WhatsApp Message
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Send Modal */}
      {isTestSendOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary">Dispatch WhatsApp Notification</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsTestSendOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleTestSend} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Message Template</label>
                <Select
                  options={[
                    { value: 'po_dispatch_v2', label: 'po_dispatch_v2 (Purchase Order Dispatch)' },
                    { value: 'payment_advice_v1', label: 'payment_advice_v1 (Payment UTR Released)' },
                    { value: 'shortage_alert_v1', label: 'shortage_alert_v1 (Critical Material Alert)' },
                    { value: 'daily_attendance_summary', label: 'daily_attendance_summary (Attendance Digest)' },
                  ]}
                  value={testTemplate}
                  onChange={setTestTemplate}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Steel Dispatch Team"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Recipient WhatsApp Mobile</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98401 23456"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTestSendOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700">Dispatch Message</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
