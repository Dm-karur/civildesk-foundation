import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck, CheckCircle2, Clock, XCircle, IndianRupee,
  Building2, Search, Filter, Eye, Check, X, FileText,
  UserCheck, AlertTriangle, ArrowRight, MessageSquare
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
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, budgetsApi, request } from '../../../api/apiservice';



export function BudgetApprovalsPage() {
  const [projects, setProjects] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Decision Modal
  const [decisionItem, setDecisionItem] = useState(null);
  const [decisionAction, setDecisionAction] = useState('Approve');
  const [decisionComments, setDecisionComments] = useState('');
  const [viewingApproval, setViewingApproval] = useState(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await request.get('/budget-approvals');
      setApprovals(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (error) {
      // Ignore if it fails (e.g. 404 because backend is missing)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    projectsApi.list().then(res => {
      const pList = res?.data?.projects || res?.projects || [];
      setProjects(Array.isArray(pList) ? pList : []);
    }).catch(() => {});
    
    fetchApprovals();
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return approvals.filter(item => {
      if (selectedProjectId !== 'all' && String(item.project_id) !== String(selectedProjectId)) return false;
      if (levelFilter !== 'all' && String(item.approval_level) !== String(levelFilter)) return false;
      if (statusFilter !== 'all') {
        const s = (item.status || '').toLowerCase();
        if (statusFilter === 'Approved' && !s.includes('approved')) return false;
        if (statusFilter === 'Pending' && !s.includes('pending') && !s.includes('review')) return false;
        if (statusFilter === 'Rejected' && !s.includes('rejected')) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const bCode = (item.budget_code || '').toLowerCase();
        const bName = (item.budget_name || '').toLowerCase();
        const pName = (item.project_name || '').toLowerCase();
        const req = (item.requested_by || '').toLowerCase();
        const comm = (item.comments || '').toLowerCase();
        if (!bCode.includes(q) && !bName.includes(q) && !pName.includes(q) && !req.includes(q) && !comm.includes(q)) return false;
      }
      return true;
    });
  }, [approvals, selectedProjectId, levelFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => approvals.filter(a => a.status.includes('Pending') || a.status.includes('Review')).length, [approvals]);
  const approvedCount = useMemo(() => approvals.filter(a => a.status.includes('Approved')).length, [approvals]);
  const rejectedCount = useMemo(() => approvals.filter(a => a.status.includes('Rejected')).length, [approvals]);

  const handleOpenDecision = (item, action) => {
    setDecisionItem(item);
    setDecisionAction(action);
    setDecisionComments(action === 'Approve' ? 'Approved after commercial rate verification and budget audit.' : 'Returned with comments for revision.');
  };

  const handleConfirmDecision = async () => {
    if (!decisionItem) return;
    try {
      const payload = {
        status: decisionAction,
        remarks: decisionComments
      };
      
      await request.post(`/budget-approvals/${decisionItem.id}/review`, payload);
      toast.success(`Request ${decisionAction} successfully.`);
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to process approval.');
    } finally {
      setDecisionItem(null);
      setDecisionComments('');
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('pending') || s.includes('review')) return 'warning';
    if (s.includes('rejected')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/budgets' },
    { label: 'Change Approval' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Budget Approvals & Authorizations"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Review Requests"
            value={approvals.length}
            status="primary"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Action"
            value={pendingCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Authorized & Approved"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Rejected / Revision Required"
            value={rejectedCount}
            status="neutral"
            icon={<XCircle className="w-4 h-4 text-red-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
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
                  { value: 'all', label: 'All Approval Tiers' },
                  { value: '1', label: 'Level 1: Project Director' },
                  { value: '2', label: 'Level 2: Commercial / QS' },
                  { value: '3', label: 'Level 3: Executive MD' },
                ]}
                value={levelFilter}
                onChange={setLevelFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Pending', label: 'Pending Review' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search budget, author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                  <th className="px-3 py-2">Budget & Revision Scope</th>
                  <th className="px-3 py-2 hidden md:table-cell">Approval Level Tier</th>
                  <th className="px-3 py-2 text-right w-28">Valuation (₹)</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Submitted By</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading budget approvals...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No approval records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((item, idx) => {
                    const isPending = item.status.includes('Pending') || item.status.includes('Review');

                    return (
                      <tr key={item.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                {item.budget_code}
                              </span>
                              <span className="font-semibold text-text-primary text-[12px] truncate" title={item.budget_name}>
                                {item.budget_name}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-muted font-mono mt-0.5">
                              {item.revision_tag} • {item.project_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-text-primary text-[11px] font-medium bg-surface-muted px-2 py-0.5 rounded border border-border">
                            {item.approval_level_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                          ₹{Number(item.total_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <div className="flex flex-col text-[11px]">
                            <span className="text-text-primary truncate">{item.requested_by}</span>
                            <span className="text-[10px] text-text-muted font-mono">{item.submitted_at}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(item.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Full Approval Detail"
                              onClick={() => setViewingApproval(item)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {isPending && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Approve Budget"
                                  onClick={() => handleOpenDecision(item, 'Approve')}
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600 hover:scale-110 transition-transform" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Reject Budget"
                                  onClick={() => handleOpenDecision(item, 'Reject')}
                                >
                                  <X className="w-3.5 h-3.5 text-red-600 hover:scale-110 transition-transform" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((item, idx) => (
            <div key={item.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{item.budget_code} • {item.revision_tag}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{item.budget_name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(item.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {item.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Tier</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{item.approval_level_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Valuation</span>
                  <span className="font-mono font-bold text-primary text-[11px]">₹{Number(item.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{item.submitted_at}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingApproval(item)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {(item.status.includes('Pending') || item.status.includes('Review')) && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenDecision(item, 'Approve')}>
                      <Check className="w-3 h-3 mr-1" /> Decide
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

      {/* View Approval Modal */}
      {viewingApproval && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingApproval.budget_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingApproval.budget_code} • {viewingApproval.revision_tag}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingApproval(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Valuation</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingApproval.total_amount || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span> <span className="font-semibold text-emerald-600">{viewingApproval.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Submitted By</span> <span className="font-medium text-text-primary">{viewingApproval.requested_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Decided By</span> <span className="font-medium text-text-primary">{viewingApproval.decided_by}</span></div>
              </div>

              {viewingApproval.comments && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Approver Decision & Audit Comments:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{viewingApproval.comments}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingApproval(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">
                  {decisionAction === 'Approve' ? 'Authorize & Approve Budget' : 'Reject Budget Proposal'}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDecisionItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border">
                <span className="text-text-muted block text-[10px] uppercase font-bold">Budget Item</span>
                <span className="font-semibold text-text-primary block text-sm">{decisionItem.budget_name}</span>
                <span className="font-mono text-primary font-bold">₹{Number(decisionItem.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>

              <FormField label="Decision Notes & Audit Endorsement" required>
                <Textarea
                  rows={3}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  placeholder="State review findings or requirements for resubmission..."
                />
              </FormField>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDecisionItem(null)}>Cancel</Button>
              <Button
                variant={decisionAction === 'Approve' ? 'primary' : 'destructive'}
                size="sm"
                onClick={handleConfirmDecision}
              >
                Confirm {decisionAction}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
