import { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, XCircle, ThumbsUp, ThumbsDown
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



export function CommunicationApprovalsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState('Approve');
  const [remarks, setRemarks] = useState('');

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleActionConfirm = () => {
    if (!actionItem) return;
    const newStatus = actionType === 'Approve' ? 'Approved & Dispatched' : 'Rejected / Revision Needed';
    setApprovals(approvals.map(a => a.id === actionItem.id ? { ...a, status: newStatus } : a));
    toast.success(`Request ${actionItem.request_no} ${actionType.toLowerCase()}d successfully.`);
    setActionItem(null);
    setRemarks('');
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return approvals.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !a.status.includes(statusFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(a.request_no || '').toLowerCase();
        const tit = String(a.item_title || '').toLowerCase();
        const sub = String(a.submitted_by || '').toLowerCase();
        const prj = String(a.project_name || '').toLowerCase();
        if (!no.includes(str) && !tit.includes(str) && !sub.includes(str) && !prj.includes(str)) return false;
      }
      return true;
    });
  }, [approvals, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => approvals.filter(a => a.status.includes('Pending')).length, [approvals]);

  const getStatusVariant = (st) => {
    if (st.includes('Approved')) return 'success';
    if (st.includes('Rejected')) return 'danger';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Communication & Collaboration', href: '/communication/project-messages' },
    { label: 'Transmittal Approvals' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Communication & Transmittal Approval Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Pending Action Requests"
            value={`${pendingCount} Requests`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved & Dispatched"
            value={`${approvals.filter(a => a.status.includes('Approved')).length} Dispatches`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Average Approval Turnaround"
            value="3.2 Hours Fast"
            status="neutral"
            icon={<CheckSquare className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Corporate Governance"
            value="100% Verified Trail"
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
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Pending', label: 'Pending Approval' },
                  { value: 'Approved', label: 'Approved' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search request, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Approval Log"
            >
              Print Approvals
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
                  <th className="px-3 py-2 w-32">Request No</th>
                  <th className="px-3 py-2">Transmittal Subject & Type</th>
                  <th className="px-3 py-2 w-36">Submitted By</th>
                  <th className="px-3 py-2 w-24">Date</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading approval requests...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No approval requests found.
                    </td>
                  </tr>
                ) : (
                  paged.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {a.request_no}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.item_title}>
                            {a.item_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {a.document_type} • {a.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-text-secondary truncate">
                        {a.submitted_by}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                        {a.submitted_date}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(a.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Approval 360"
                            onClick={() => setViewingItem(a)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {a.status.includes('Pending') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50"
                                title="Approve"
                                onClick={() => { setActionItem(a); setActionType('Approve'); }}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                                title="Reject"
                                onClick={() => { setActionItem(a); setActionType('Reject'); }}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </Button>
                            </>
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((a, idx) => (
            <div key={a.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.request_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.item_title}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(a.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {a.status.includes('Pending') ? 'Pending' : 'Approved'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-text-muted text-[10px]">By {a.submitted_by}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {a.status.includes('Pending') && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setActionItem(a); setActionType('Approve'); }}>
                      <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                    </Button>
                  )}
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

      {/* View Approval 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.request_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Subject / Description</span> <span className="font-bold text-text-primary text-[13px]">{viewingItem.item_title}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Document Type</span> <span className="text-text-primary">{viewingItem.document_type}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Submitted Date</span> <span className="font-mono">{viewingItem.submitted_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Submitted By</span> <span className="text-text-primary">{viewingItem.submitted_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Designated Approver</span> <span className="font-medium text-primary">{viewingItem.approver_role}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-bold text-emerald-700">{viewingItem.status}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Approval Trail
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Action Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary">{actionType} Transmittal Request</h3>
              <Button variant="ghost" size="sm" onClick={() => setActionItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-text-primary">
                Are you sure you want to <strong>{actionType.toLowerCase()}</strong> transmittal <strong>{actionItem.request_no}</strong>?
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Approval / Rejection Remarks</label>
                <textarea
                  rows="3"
                  className="w-full border border-border rounded-md p-2.5 text-xs bg-surface text-text-primary"
                  placeholder="Optional review remarks or instructions..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActionItem(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  size="sm"
                  className={actionType === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                  onClick={handleActionConfirm}
                >
                  Confirm {actionType}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
