import { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Receipt, ArrowDownRight
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



export function ClientReceivablesReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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
    return receivables.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const cl = String(r.client_name || '').toLowerCase();
        const prj = String(r.project_name || '').toLowerCase();
        const code = String(r.project_code || '').toLowerCase();
        if (!cl.includes(str) && !prj.includes(str) && !code.includes(str)) return false;
      }
      return true;
    });
  }, [receivables, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalBilled = useMemo(() => receivables.reduce((acc, r) => acc + Number(r.cumulative_billed || 0), 0), [receivables]);
  const totalReceived = useMemo(() => receivables.reduce((acc, r) => acc + Number(r.cumulative_received || 0), 0), [receivables]);
  const totalOutstanding = useMemo(() => receivables.reduce((acc, r) => acc + Number(r.outstanding_balance || 0), 0), [receivables]);
  const totalRetention = useMemo(() => receivables.reduce((acc, r) => acc + Number(r.retention_held || 0), 0), [receivables]);

  const getStatusVariant = (st) => {
    if (st.includes('Settled')) return 'success';
    if (st.includes('Overdue')) return 'danger';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Client Receivables Report' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Receivables, RA Collections & Aging Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Cumulative Invoiced"
            value={`₹${(totalBilled / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Realized Cash Collections"
            value={`₹${(totalReceived / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Outstanding Receivables"
            value={`₹${(totalOutstanding / 100000).toFixed(2)} Lakhs`}
            status={totalOutstanding > 0 ? 'danger' : 'success'}
            icon={<ArrowDownRight className="w-4 h-4 text-rose-500" />}
          />
          <KpiCard
            label="Client Retention Withheld"
            value={`₹${(totalRetention / 100000).toFixed(2)} Lakhs`}
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
                placeholder="Search client, project..."
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
              title="Print Receivables Statement"
            >
              Print Receivables Report
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
                  <th className="px-3 py-2">Client Name & Project</th>
                  <th className="px-3 py-2 text-right w-28">Contract Value</th>
                  <th className="px-3 py-2 text-right w-28">Total Billed</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-emerald-600">Collected</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Retention</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-rose-600">Outstanding</th>
                  <th className="px-3 py-2 text-center w-24">Aging</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading client receivables records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No client receivables records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.client_name}>
                            {r.client_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.project_name} • {r.project_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(r.contract_value / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(r.cumulative_billed / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(r.cumulative_received / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{(r.retention_held / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 text-[11px]">
                        {r.outstanding_balance > 0 ? `₹${(r.outstanding_balance / 100000).toFixed(2)}L` : '₹0.00'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.aging_bucket}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Receivables 360"
                            onClick={() => setViewingItem(r)}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.client_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.project_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.aging_bucket}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Cumulative Collected</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(r.cumulative_received / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Outstanding Balance</span>
                  <span className="font-mono font-bold text-rose-600 text-[11px]">₹{(r.outstanding_balance / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Receivables
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

      {/* View Receivables 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.client_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Outstanding Balance</span> <span className="font-bold text-rose-600 font-mono text-base">₹{(viewingItem.outstanding_balance / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Collected Cash</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.cumulative_received / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Value</span> <span className="font-mono">₹{(viewingItem.contract_value / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Billed</span> <span className="font-mono">₹{(viewingItem.cumulative_billed / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Withheld (2%)</span> <span className="font-mono">₹{(viewingItem.tds_deducted / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Withheld (5%)</span> <span className="font-mono">₹{(viewingItem.retention_held / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Aging Status</span> <span className="font-medium text-amber-700">{viewingItem.aging_bucket} ({viewingItem.overdue_days} Days)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Status</span> <span className="font-medium text-emerald-700">{viewingItem.status}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Receivables Statement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
