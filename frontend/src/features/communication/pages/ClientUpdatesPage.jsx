import { useState, useEffect, useMemo } from 'react';
import {
  Bell, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Send, Mail, MessageCircle
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
import { projectsApi, clientsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function ClientUpdatesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNoticeType, setNewNoticeType] = useState('Milestone Completion Intimation');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [createProjectId, setCreateProjectId] = useState('1');

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast.error('Please enter a subject.');
      return;
    }
    const proj = projects.find(p => String(p.id) === String(createProjectId)) || { project_code: 'PRJ-2026-001', project_name: 'Civil Project', client_name: 'Client Corp' };
    const newNotice = {
      id: Date.now(),
      notice_no: `CL-NOT-2026-${String(updates.length + 15).padStart(3, '0')}`,
      project_id: Number(createProjectId),
      project_code: proj.project_code,
      project_name: proj.project_name,
      client_name: proj.client_name || 'Project Client',
      notice_type: newNoticeType,
      subject: newSubject,
      dispatch_channels: 'Client Portal • Email',
      sent_date: new Date().toISOString().split('T')[0],
      acknowledged_date: 'Pending',
      status: 'Sent / Pending Acknowledgment'
    };
    setUpdates([newNotice, ...updates]);
    setIsCreateOpen(false);
    setNewSubject('');
    setNewBody('');
    toast.success('Client update notice dispatched successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return updates.filter(u => {
      if (selectedProjectId !== 'all' && String(u.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(u.notice_no || '').toLowerCase();
        const sub = String(u.subject || '').toLowerCase();
        const cl = String(u.client_name || '').toLowerCase();
        const prj = String(u.project_name || '').toLowerCase();
        if (!no.includes(str) && !sub.includes(str) && !cl.includes(str) && !prj.includes(str)) return false;
      }
      return true;
    });
  }, [updates, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (st) => {
    if (st.includes('Acknowledged')) return 'success';
    if (st.includes('Review')) return 'warning';
    return 'info';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Communication & Collaboration', href: '/communication/project-messages' },
    { label: 'Client Bulletins & Notices' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Formal Client Progress Bulletins & Circulars Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Dispatched Circulars"
            value={`${updates.length} Official Notices`}
            status="primary"
            icon={<Bell className="w-4 h-4" />}
          />
          <KpiCard
            label="Client Acknowledged"
            value="100% On-Time"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Multi-Channel Delivery"
            value="Portal + Email + Letter"
            status="neutral"
            icon={<Mail className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Client Transparency Record"
            value="100% Compliant"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
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

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search notice no, subject, client..."
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
              onClick={() => setIsCreateOpen(true)}
              className="text-xs h-8 shadow-xs"
            >
              Compose Notice
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
                  <th className="px-3 py-2 w-28">Notice No</th>
                  <th className="px-3 py-2">Subject & Notice Type</th>
                  <th className="px-3 py-2 w-36">Client & Project</th>
                  <th className="px-3 py-2 w-24">Date Sent</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading client update notices...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No client update notices found.
                    </td>
                  </tr>
                ) : (
                  paged.map((u, idx) => (
                    <tr key={u.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {u.notice_no}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={u.subject}>
                            {u.subject}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {u.notice_type} • {u.dispatch_channels}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[11px] truncate">{u.client_name}</span>
                          <span className="text-[10px] text-text-muted truncate">{u.project_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                        {u.sent_date}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(u.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Notice 360"
                            onClick={() => setViewingItem(u)}
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
          {paged.map((u, idx) => (
            <div key={u.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{u.notice_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{u.subject}</h4>
                  <span className="text-[11px] text-text-muted">{u.client_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(u.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {u.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-text-muted text-[10px]">Date: {u.sent_date}</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(u)}>
                  <Eye className="w-3 h-3 mr-1" /> View Circular
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

      {/* View Notice 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.notice_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Notice Type</span> <span className="font-bold text-text-primary">{viewingItem.notice_type}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Dispatch Channels</span> <span className="font-mono text-primary">{viewingItem.dispatch_channels}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Date Sent</span> <span className="font-mono">{viewingItem.sent_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Client Acknowledged Date</span> <span className="font-mono text-emerald-700">{viewingItem.acknowledged_date}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Subject</span> <span className="text-text-primary font-medium">{viewingItem.subject}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Official Circular Letter
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Notice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary">Dispatch Formal Client Notice</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Project</label>
                <Select
                  options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                  value={createProjectId}
                  onChange={setCreateProjectId}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Notice Classification</label>
                <Select
                  options={[
                    { value: 'Milestone Completion Intimation', label: 'Milestone Completion Intimation' },
                    { value: 'Billing Intimation (RA Bill Submission)', label: 'Billing Intimation (RA Bill Submission)' },
                    { value: 'Monthly Progress Circular', label: 'Monthly Progress Circular' },
                    { value: 'Weather Delay & Force Majeure Notice', label: 'Weather Delay & Force Majeure Notice' },
                    { value: 'Extra Item / Variation Submission', label: 'Extra Item / Variation Submission' },
                  ]}
                  value={newNoticeType}
                  onChange={setNewNoticeType}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Notice Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intimation of Superstructure Completion"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Notice Body / Transmittal Text</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Official circular letter text..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full border border-border rounded-md p-2.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Dispatch Notice</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
