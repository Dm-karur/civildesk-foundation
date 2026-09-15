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



export function RABillApprovalPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bills, setBills] = useState([]);
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
    setBills(prev => prev.map(b => b.id === item.id ? { ...b, status_name: 'Certified & Authorized' } : b));
    toast.success(`RA Bill ${item.ra_bill_no} authorized and passed to accounts for disbursement.`);
  };

  const handleReturn = (item) => {
    setBills(prev => prev.map(b => b.id === item.id ? { ...b, status_name: 'Returned for Quantity Clarification' } : b));
    toast.success(`RA Bill ${item.ra_bill_no} returned to subcontractor.`);
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return bills.filter(b => {
      if (selectedProjectId !== 'all' && String(b.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !b.status_name.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(b.ra_bill_no || '').toLowerCase();
        const vno = String(b.contractor_bill_no || '').toLowerCase();
        const cont = String(b.contractor_name || '').toLowerCase();
        if (!no.includes(s) && !vno.includes(s) && !cont.includes(s)) return false;
      }
      return true;
    });
  }, [bills, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => bills.filter(b => b.status_name.includes('Pending')).length, [bills]);
  const approvedCount = useMemo(() => bills.filter(b => b.status_name.includes('Certified') || b.status_name.includes('Authorized')).length, [bills]);

  const getStatusVariant = (st) => {
    if (st.includes('Certified') || st.includes('Authorized')) return 'success';
    if (st.includes('Pending')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'RA Bill Verification Queue' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractor RA Bill Verification & Authorization Queue"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Submitted RA Bills"
            value={bills.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Director Sign-off"
            value={`${pendingCount} RA Bills`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Certified & Passed"
            value={`${approvedCount} Bills`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="3-Way Match Audit"
            value="100% Reconciled"
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
                  { value: 'Certified', label: 'Certified & Passed' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search RA bill, vendor inv..."
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
                  <th className="px-3 py-2 w-28">RA Bill No</th>
                  <th className="px-3 py-2">Contractor & Vendor Invoice</th>
                  <th className="px-3 py-2 text-right w-28">Gross Work</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Net Certified</th>
                  <th className="px-3 py-2 text-center w-36">Approval Stage</th>
                  <th className="px-3 py-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading RA bill verification queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No RA bills found in approval queue.
                    </td>
                  </tr>
                ) : (
                  paged.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {b.ra_bill_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{b.bill_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={b.contractor_name}>
                            {b.contractor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Inv: {b.contractor_bill_no} • {b.work_order_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{b.gross_work_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{b.net_certified_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(b.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {b.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View RA Bill 360"
                            onClick={() => setViewingItem(b)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {b.status_name.includes('Pending') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Authorize Bill"
                                onClick={() => handleApprove(b)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Authorize
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(b)}
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
          {paged.map((b, idx) => (
            <div key={b.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{b.ra_bill_no} • {b.bill_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{b.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">Inv: {b.contractor_bill_no}</span>
                </div>
                <Badge
                  variant={getStatusVariant(b.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {b.status_name}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 font-mono text-[11px] flex justify-between">
                <span>Net Certified</span>
                <span className="font-bold text-emerald-600">₹{b.net_certified_amount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(b)}>
                  <Eye className="w-3 h-3 mr-1" /> View Bill
                </Button>
                {b.status_name.includes('Pending') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(b)}>
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

      {/* View RA Bill 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.ra_bill_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Work Value</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.gross_work_value.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Certified Payable</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.net_certified_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention (5%)</span> <span className="font-mono text-amber-600 font-bold">-₹{viewingItem.retention_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS (2%)</span> <span className="font-mono">-₹{viewingItem.tds_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contractor Invoice</span> <span className="font-mono text-primary font-medium">{viewingItem.contractor_bill_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Authorized Approver</span> <span className="text-emerald-700 font-medium">{viewingItem.designated_approver}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Bill Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
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
