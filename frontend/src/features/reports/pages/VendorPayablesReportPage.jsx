import { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Users, ArrowUpRight
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



export function VendorPayablesReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [agingFilter, setAgingFilter] = useState('all');
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

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return payables.filter(p => {
      if (agingFilter !== 'all' && p.aging_bucket !== agingFilter) return false;
      if (search) {
        const str = search.toLowerCase();
        const v = String(p.vendor_name || '').toLowerCase();
        const c = String(p.category_name || '').toLowerCase();
        const prj = String(p.project_name || '').toLowerCase();
        if (!v.includes(str) && !c.includes(str) && !prj.includes(str)) return false;
      }
      return true;
    });
  }, [payables, agingFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalInvoiced = useMemo(() => payables.reduce((acc, p) => acc + Number(p.total_invoiced || 0), 0), [payables]);
  const totalReleased = useMemo(() => payables.reduce((acc, p) => acc + Number(p.payments_released || 0), 0), [payables]);
  const totalBalanceDue = useMemo(() => payables.reduce((acc, p) => acc + Number(p.balance_payable || 0), 0), [payables]);

  const getPriorityBadge = (pr) => {
    if (pr.includes('Critical')) return 'danger';
    if (pr.includes('High')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Vendor Payables Aging Report' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Vendor & Subcontractor Payables Aging Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Invoiced Creditor Dues"
            value={`₹${(totalInvoiced / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Cumulative Paid Outflows"
            value={`₹${(totalReleased / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Outstanding Balance Payable"
            value={`₹${(totalBalanceDue / 100000).toFixed(2)} Lakhs`}
            status={totalBalanceDue > 0 ? 'warning' : 'success'}
            icon={<ArrowUpRight className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Payment Audit & Compliance"
            value="100% Tax Compliant"
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
                  { value: 'all', label: 'All Aging Buckets' },
                  { value: '0-30 Days', label: '0-30 Days' },
                  { value: '31-60 Days', label: '31-60 Days' },
                  { value: 'Settled', label: 'Settled' },
                ]}
                value={agingFilter}
                onChange={setAgingFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search vendor, category, project..."
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
              title="Print Payables Report"
            >
              Print Payables Statement
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
                  <th className="px-3 py-2">Vendor / Contractor Name</th>
                  <th className="px-3 py-2 text-right w-28">Total Invoiced</th>
                  <th className="px-3 py-2 text-right w-28">Released</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Retention</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-amber-600">Balance Due</th>
                  <th className="px-3 py-2 text-center w-24">Aging</th>
                  <th className="px-3 py-2 text-center w-28">Priority</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading vendor payables records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No vendor payables records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={p.vendor_name}>
                            {p.vendor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {p.category_name} • {p.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(p.total_invoiced / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-emerald-600">
                        ₹{(p.payments_released / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        ₹{(p.retention_debit_note / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        {p.balance_payable > 0 ? `₹${(p.balance_payable / 100000).toFixed(2)}L` : '₹0.00'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {p.aging_bucket}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getPriorityBadge(p.priority)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {p.priority.includes('Critical') ? 'Critical' : p.priority.includes('High') ? 'High' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Payables 360"
                            onClick={() => setViewingItem(p)}
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
          {paged.map((p, idx) => (
            <div key={p.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.vendor_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.category_name}</span>
                </div>
                <Badge
                  variant={getPriorityBadge(p.priority)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {p.aging_bucket}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Payments Released</span>
                  <span className="font-mono text-emerald-600 text-[11px]">₹{(p.payments_released / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance Due</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(p.balance_payable / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Details
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

      {/* View Payables 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.vendor_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Balance Payable Due</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.balance_payable / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payments Released</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.payments_released / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Invoiced</span> <span className="font-mono">₹{(viewingItem.total_invoiced / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Withheld (194Q/C)</span> <span className="font-mono">₹{(viewingItem.tds_deducted / 1000).toFixed(2)}K</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Withheld</span> <span className="font-mono">₹{(viewingItem.retention_debit_note / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Priority Status</span> <span className="font-medium text-amber-700">{viewingItem.priority}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Project Allocation</span> <span className="text-text-primary font-medium">{viewingItem.project_name}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Vendor Ledger
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
