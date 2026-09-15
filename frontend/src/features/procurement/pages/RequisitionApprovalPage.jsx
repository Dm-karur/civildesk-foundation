import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, XCircle, IndianRupee, ShoppingCart,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers, RotateCcw
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
import { Input } from '../../../components/ui/Input';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, materialManagementApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function RequisitionApprovalPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects & Requisitions
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      materialManagementApi.requests.list().catch(() => ({ data: [] }))
    ]).then(([projRes, reqRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? [];
      if (Array.isArray(rList) && rList.length > 0) {
        const normalized = rList.map((r, idx) => {
          const proj = parsedProjects.find(p => String(p.id) === String(r.project_id));
          return {
            id: r.id || idx + 1,
            project_id: r.project_id || 1,
            project_code: proj?.project_code || 'PRJ-2026-001',
            project_name: proj?.project_name || 'Civil Project',
            requisition_no: `PR-2026-${String(idx + 1).padStart(3, '0')}`,
            mr_no: r.request_no || `MRN-2026-${String(idx + 1).padStart(3, '0')}`,
            requisition_date: r.request_date || new Date().toISOString().split('T')[0],
            required_by_date: r.required_by_date || new Date().toISOString().split('T')[0],
            priority: r.priority_name || r.priority || 'Normal',
            material_code: r.material_code || 'MAT-GEN-001',
            material_name: r.material_name || 'Construction Material',
            quantity: Number(r.quantity || r.requested_qty || 100),
            uom: r.uom || 'Nos',
            estimated_rate: Number(r.estimated_rate || 385),
            estimated_total: Number(r.estimated_total || (Number(r.quantity || r.requested_qty || 100) * Number(r.estimated_rate || 385))),
            requested_by: r.requested_by || 'Site Engineer',
            status: r.status_name || r.status || 'Pending PR Approval',
            purpose: r.purpose || '',
          };
        });
        setRequisitions(normalized);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleApprove = (item) => {
    setRequisitions(prev => prev.map(r => r.id === item.id ? { ...r, status: 'Approved' } : r));
    toast.success(`Purchase Requisition ${item.requisition_no} approved. Ready for RFQ float.`);
  };

  const handleReturn = (item) => {
    setRequisitions(prev => prev.map(r => r.id === item.id ? { ...r, status: 'Returned for Revision' } : r));
    toast.success(`Requisition ${item.requisition_no} returned to site engineer.`);
  };

  const handleReject = (item) => {
    setRequisitions(prev => prev.map(r => r.id === item.id ? { ...r, status: 'Rejected' } : r));
    toast.success(`Requisition ${item.requisition_no} rejected.`);
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return requisitions.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && String(r.status || '') !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = String(r.requisition_no || '').toLowerCase();
        const mat = String(r.material_name || '').toLowerCase();
        const proj = String(r.project_name || '').toLowerCase();
        const req = String(r.requested_by || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !proj.includes(q) && !req.includes(q)) return false;
      }
      return true;
    });
  }, [requisitions, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => requisitions.filter(r => String(r.status || '').toLowerCase().includes('pending')).length, [requisitions]);
  const approvedCount = useMemo(() => requisitions.filter(r => String(r.status || '').toLowerCase().includes('approved')).length, [requisitions]);
  const pendingBudget = useMemo(() => requisitions.filter(r => String(r.status || '').toLowerCase().includes('pending')).reduce((acc, r) => acc + Number(r.estimated_total || 0), 0), [requisitions]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('pending')) return 'warning';
    if (s.includes('returned')) return 'neutral';
    if (s.includes('rejected')) return 'error';
    return 'neutral';
  };

  const getPriorityVariant = (priority) => {
    if (priority === 'Critical') return 'error';
    if (priority === 'Urgent') return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Requisition Approval' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Requisition Authorization & Sign-Off"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total PRs in Queue"
            value={requisitions.length}
            status="primary"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending PM Sign-Off"
            value={`${pendingCount} PRs`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Pending Approval Value"
            value={`₹${pendingBudget.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Approved for Procurement"
            value={`${approvedCount} PRs`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
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
                  { value: 'all', label: 'All Approval Stages' },
                  { value: 'Pending PM Approval', label: 'Pending PM Approval' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Returned for Revision', label: 'Returned for Revision' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search PR no, material, requester..."
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
                  <th className="px-3 py-2 w-28">PR Ref</th>
                  <th className="px-3 py-2">Material Item & Scope</th>
                  <th className="px-3 py-2">Requester & Project</th>
                  <th className="px-3 py-2 text-right w-24">Req Qty</th>
                  <th className="px-3 py-2 text-right w-28">Est. Budget</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading approval queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase requisitions in approval queue.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {r.requisition_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.requisition_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.material_name}>
                            {r.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate" title={r.purpose}>
                            {r.purpose}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.requested_by}>
                            {r.requested_by}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.quantity} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(r.estimated_total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getPriorityVariant(r.priority)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.priority}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View PR 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {String(r.status || '').toLowerCase().includes('pending') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve Requisition"
                                onClick={() => handleApprove(r)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(r)}
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-500 hover:text-amber-700" />
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.requisition_no} • {r.requisition_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.project_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Required Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.quantity} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Est. Budget</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(r.estimated_total).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {String(r.status || '').toLowerCase().includes('pending') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(r)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
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

      {/* View PR 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.requisition_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Budget</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.estimated_total).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Priority Level</span> <span className="font-semibold text-red-600">{viewingItem.priority}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Required Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.quantity} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Required On Site By</span> <span className="font-mono font-bold text-text-primary">{viewingItem.required_by_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Current Approver</span> <span className="font-semibold text-text-primary">{viewingItem.current_approver || 'Project Manager'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Requested By</span> <span className="text-text-primary">{viewingItem.requested_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Site</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Work Scope & Justification:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.purpose}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
