import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, IndianRupee, Clock, RotateCcw,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, Banknote
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



export function AdvanceApprovalPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [advances, setAdvances] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ClientAdvancesPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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

  useEffect(() => {
    localStorage.setItem('mock_receivables_ClientAdvancesPage', JSON.stringify(advances));
  }, [advances]);

  const handleApprove = (item) => {
    setAdvances(prev => prev.map(a => a.id === item.id ? { ...a, status: 'Authorized & Dispatched to Client' } : a));
    toast.success(`Advance claim ${item.advance_no} authorized and dispatched to client.`);
  };

  const handleReturn = (item) => {
    setAdvances(prev => prev.map(a => a.id === item.id ? { ...a, status: 'Returned for BG Revision' } : a));
    toast.success(`Advance claim ${item.advance_no} returned for correction.`);
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return advances.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !a.status.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(a.advance_no || '').toLowerCase();
        const cli = String(a.client_name || '').toLowerCase();
        const abg = String(a.abg_reference_no || '').toLowerCase();
        const proj = String(a.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !abg.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [advances, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => advances.filter(a => a.status.includes('Pending')).length, [advances]);
  const approvedCount = useMemo(() => advances.filter(a => a.status.includes('Authorized')).length, [advances]);

  const getStatusVariant = (st) => {
    if (st.includes('Authorized')) return 'success';
    if (st.includes('Pending')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Advance Claim Verification Queue' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Advance Claim Verification & Approval Queue"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Submitted Claims"
            value={`${advances.length} Claims`}
            status="primary"
            icon={<Banknote className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Director Review"
            value={`${pendingCount} Claims`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Authorized & Dispatched"
            value={`${approvedCount} Claims`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Bank Guarantee Audit"
            value="100% Vetted"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Pending', label: 'Pending Approval' },
                  { value: 'Authorized', label: 'Authorized' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search advance claim, ABG ref, client..."
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
                  <th className="px-3 py-2 w-28">Advance No</th>
                  <th className="px-3 py-2">Advance Scope & Client</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Claim Sum</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Bank Guarantee</th>
                  <th className="px-3 py-2 text-center w-36">Approval Stage</th>
                  <th className="px-3 py-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading advance approval queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No advance claims found in approval queue.
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
                          {a.advance_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{a.claim_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.advance_type}>
                            {a.advance_type}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {a.client_name} • {a.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(a.advance_amount / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        <div className="truncate font-semibold text-primary">{a.abg_reference_no}</div>
                        <div className="text-text-muted">Exp: {a.abg_validity_date}</div>
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
                            title="View Advance 360"
                            onClick={() => setViewingItem(a)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {a.status.includes('Pending') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Authorize Claim"
                                onClick={() => handleApprove(a)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Authorize
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(a)}
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
          {paged.map((a, idx) => (
            <div key={a.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.advance_no} • {a.claim_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.advance_type}</h4>
                  <span className="text-[11px] text-text-muted">{a.client_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(a.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(a.advance_amount / 10000000).toFixed(2)} Cr
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-primary block">ABG Ref: {a.abg_reference_no}</span>
                <span className="text-[11px] text-text-muted font-mono">Valid till {a.abg_validity_date}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View Details
                </Button>
                {a.status.includes('Pending') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(a)}>
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

      {/* View Advance 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.advance_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Advance Claim Sum</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.advance_amount / 10000000).toFixed(2)} Cr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Claim Date</span> <span className="font-mono">{viewingItem.claim_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bank Guarantee Ref</span> <span className="font-mono text-primary font-bold">{viewingItem.abg_reference_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">ABG Validity</span> <span className="font-mono">{viewingItem.abg_validity_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Prepared By</span> <span className="text-text-primary font-medium">{viewingItem.submitted_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Authorized Signatory</span> <span className="text-emerald-700 font-medium">{viewingItem.designated_approver}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Advance Scope</span> <span className="text-text-primary font-medium">{viewingItem.advance_type}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Verification & BG Vetting Notes:</span>
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
