import { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Send, User, Tag
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



export function ProjectMessagesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newChannel, setNewChannel] = useState('Structural & Concrete');
  const [newPriority, setNewPriority] = useState('Normal');
  const [newMessageBody, setNewMessageBody] = useState('');
  const [composeProjectId, setComposeProjectId] = useState('1');

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleComposeSubmit = (e) => {
    e.preventDefault();
    if (!newTopic.trim() || !newMessageBody.trim()) {
      toast.error('Please enter a topic and message body.');
      return;
    }
    const proj = projects.find(p => String(p.id) === String(composeProjectId)) || { project_code: 'PRJ-2026-001', project_name: 'Civil Project' };
    const newMsg = {
      id: Date.now(),
      project_id: Number(composeProjectId),
      project_code: proj.project_code,
      project_name: proj.project_name,
      thread_topic: newTopic,
      channel: newChannel,
      sender_name: 'You (Project Lead)',
      sender_role: 'Lead Project Engineer',
      last_message_preview: newMessageBody,
      replies_count: 0,
      last_updated: 'Just now',
      priority: newPriority,
      status: 'Active Thread'
    };
    setMessages([newMsg, ...messages]);
    setIsComposeOpen(false);
    setNewTopic('');
    setNewMessageBody('');
    toast.success('Message thread created successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return messages.filter(m => {
      if (selectedProjectId !== 'all' && String(m.project_id) !== String(selectedProjectId)) return false;
      if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
      if (search) {
        const str = search.toLowerCase();
        const top = String(m.thread_topic || '').toLowerCase();
        const snd = String(m.sender_name || '').toLowerCase();
        const msg = String(m.last_message_preview || '').toLowerCase();
        const prj = String(m.project_name || '').toLowerCase();
        if (!top.includes(str) && !snd.includes(str) && !msg.includes(str) && !prj.includes(str)) return false;
      }
      return true;
    });
  }, [messages, selectedProjectId, channelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const activeCount = useMemo(() => messages.filter(m => m.status === 'Active Thread').length, [messages]);
  const highPriorityCount = useMemo(() => messages.filter(m => m.priority.includes('High') || m.priority.includes('Critical')).length, [messages]);

  const getPriorityBadge = (pr) => {
    if (pr.includes('High') || pr.includes('Critical')) return 'danger';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Communication & Collaboration', href: '/communication/project-messages' },
    { label: 'Project Message Threads' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Messages & Site Coordination Threads"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Active Coordination Threads"
            value={`${activeCount} Open Topics`}
            status="primary"
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <KpiCard
            label="High Priority Action Items"
            value={`${highPriorityCount} Urgent Queries`}
            status={highPriorityCount > 0 ? 'danger' : 'success'}
            icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Average Resolution Time"
            value="1.8 Hours Fast"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Team Collaboration Status"
            value="100% Connected"
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
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Channels' },
                  { value: 'Structural & Concrete', label: 'Structural & Concrete' },
                  { value: 'Procurement & Store', label: 'Procurement & Store' },
                  { value: 'Quality & Testing', label: 'Quality & Testing' },
                  { value: 'MEP Coordination', label: 'MEP Coordination' },
                ]}
                value={channelFilter}
                onChange={setChannelFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search topic, sender, message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsComposeOpen(true)}
              className="text-xs h-8 shadow-xs"
            >
              New Thread
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
                  <th className="px-3 py-2">Topic & Channel</th>
                  <th className="px-3 py-2">Last Message Preview</th>
                  <th className="px-3 py-2 w-36">Initiated By</th>
                  <th className="px-3 py-2 text-center w-20">Replies</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading message threads...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No message threads found.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={m.thread_topic}>
                            {m.thread_topic}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            <Tag className="w-2.5 h-2.5 inline mr-1 text-primary" />{m.channel} • {m.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-text-secondary truncate max-w-xs" title={m.last_message_preview}>
                        {m.last_message_preview}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[11px] truncate">{m.sender_name}</span>
                          <span className="text-[9px] text-text-muted truncate">{m.sender_role}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-primary text-[11px]">
                        {m.replies_count} msgs
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getPriorityBadge(m.priority)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {m.priority.includes('High') ? 'Urgent' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Message Thread"
                            onClick={() => setViewingItem(m)}
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((m, idx) => (
            <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{m.channel}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.thread_topic}</h4>
                </div>
                <Badge
                  variant={getPriorityBadge(m.priority)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {m.replies_count} msgs
                </Badge>
              </div>

              <div className="text-xs pt-1 border-t border-border/60">
                <p className="text-text-primary text-[11px] line-clamp-2">{m.last_message_preview}</p>
                <span className="text-[10px] text-text-muted block mt-1">By {m.sender_name} ({m.sender_role})</span>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(m)}>
                  <Eye className="w-3 h-3 mr-1" /> Open Thread
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

      {/* View Thread 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.thread_topic}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.channel} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="bg-surface-muted/30 p-3.5 rounded-lg border border-border space-y-2">
                <div className="flex justify-between items-center text-[10px] text-text-muted">
                  <span className="font-bold text-text-primary">{viewingItem.sender_name} ({viewingItem.sender_role})</span>
                  <span>{viewingItem.last_updated}</span>
                </div>
                <p className="text-[12px] text-text-primary leading-relaxed bg-surface p-2.5 rounded border border-border/80">
                  {viewingItem.last_message_preview}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Quick Reply</h4>
                <textarea
                  className="w-full border border-border rounded-lg p-2.5 text-xs bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows="3"
                  placeholder="Type your response to the site team..."
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="primary" size="sm" onClick={() => { toast.success('Reply posted to thread.'); setViewingItem(null); }}>
                <Send className="w-3.5 h-3.5 mr-1" /> Post Reply
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Thread Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary">Start New Message Thread</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsComposeOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleComposeSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Project</label>
                <Select
                  options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                  value={composeProjectId}
                  onChange={setComposeProjectId}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Channel / Topic Tag</label>
                <Select
                  options={[
                    { value: 'Structural & Concrete', label: 'Structural & Concrete' },
                    { value: 'Procurement & Store', label: 'Procurement & Store' },
                    { value: 'Quality & Testing', label: 'Quality & Testing' },
                    { value: 'MEP Coordination', label: 'MEP Coordination' },
                    { value: 'Safety & EHS', label: 'Safety & EHS' },
                  ]}
                  value={newChannel}
                  onChange={setNewChannel}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Priority</label>
                <Select
                  options={[
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High / Critical', label: 'High / Critical' },
                  ]}
                  value={newPriority}
                  onChange={setNewPriority}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Thread Title / Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower B Raft Concrete Pouring"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Initial Message</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe the update, question or instruction..."
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  className="w-full border border-border rounded-md p-2.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Create Thread</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
