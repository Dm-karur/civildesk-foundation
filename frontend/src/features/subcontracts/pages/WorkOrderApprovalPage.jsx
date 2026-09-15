import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, IndianRupee, Clock, RotateCcw,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  Check, AlertCircle, Sparkles, Printer, ArrowRight, FileText
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
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function WorkOrderApprovalPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleApprove = (item) => {
    setWorkOrders(prev => prev.map(w => w.id === item.id ? { ...w, status_name: 'Authorized & Active' } : w));
    toast.success(`Work Order ${item.work_order_no} authorized & executed.`);
  };

  const handleReturn = (item) => {
    setWorkOrders(prev => prev.map(w => w.id === item.id ? { ...w, status_name: 'Returned for Commercial Revision' } : w));
    toast.success(`Work Order ${item.work_order_no} returned to QS engineer.`);
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return workOrders.filter(w => {
      if (selectedProjectId !== 'all' && String(w.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !w.status_name.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(w.work_order_no || '').toLowerCase();
        const cont = String(w.contractor_name || '').toLowerCase();
        const pack = String(w.package_title || '').toLowerCase();
        if (!no.includes(s) && !cont.includes(s) && !pack.includes(s)) return false;
      }
      return true;
    });
  }, [workOrders, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => workOrders.filter(w => w.status_name.includes('Pending')).length, [workOrders]);
  const approvedCount = useMemo(() => workOrders.filter(w => w.status_name.includes('Authorized') || w.status_name.includes('Active')).length, [workOrders]);

  const getStatusVariant = (st) => {
    if (st.includes('Authorized') || st.includes('Active')) return 'success';
    if (st.includes('Pending')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'WO Approval Queue' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Work Order Commercial Approval Queue"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Submitted WOs"
            value={workOrders.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Director Sign-off"
            value={`${pendingCount} Work Orders`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Authorized & Active"
            value={`${approvedCount} Executed`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Budget Compliance"
            value="100% Within BOQ"
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Pending', label: 'Pending Approval' },
                  { value: 'Authorized', label: 'Authorized & Active' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search WO no, contractor, package..."
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
                  <th className="px-3 py-2 w-28">WO Number</th>
                  <th className="px-3 py-2">Package Scope & Contractor</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Duration</th>
                  <th className="px-3 py-2 text-right w-28">Contract Sum</th>
                  <th className="px-3 py-2 text-center w-36">Sign-Off Stage</th>
                  <th className="px-3 py-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading approval queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No work orders found in approval queue.
                    </td>
                  </tr>
                ) : (
                  paged.map((w, idx) => (
                    <tr key={w.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {w.work_order_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{w.work_order_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={w.package_title}>
                            {w.package_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {w.contractor_name} • {w.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        {w.start_date} to {w.completion_date}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{w.total_order_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(w.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {w.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View WO 360"
                            onClick={() => setViewingItem(w)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {w.status_name.includes('Pending') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Authorize WO"
                                onClick={() => handleApprove(w)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Authorize
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(w)}
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
          {paged.map((w, idx) => (
            <div key={w.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{w.work_order_no} • {w.work_order_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{w.package_title}</h4>
                  <span className="text-[11px] text-text-muted">{w.contractor_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(w.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {w.status_name}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 font-mono text-[11px] flex justify-between">
                <span>Contract Value</span>
                <span className="font-bold text-primary">₹{w.total_order_value.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(w)}>
                  <Eye className="w-3 h-3 mr-1" /> View WO
                </Button>
                {w.status_name.includes('Pending') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(w)}>
                    <Check className="w-3 h-3 mr-1" /> Authorize
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

      {/* View WO 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.work_order_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Contract Value</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.total_order_value.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contractor Partner</span> <span className="font-semibold text-text-primary">{viewingItem.contractor_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Deduction</span> <span className="font-mono">{viewingItem.retention_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mobilization Advance</span> <span className="font-mono">{viewingItem.advance_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Term</span> <span className="font-mono">{viewingItem.start_date} to {viewingItem.completion_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Designated Signatory</span> <span className="text-emerald-700 font-medium">{viewingItem.designated_approver}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Work Scope Details:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.scope_summary}</p>
              </div>
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
