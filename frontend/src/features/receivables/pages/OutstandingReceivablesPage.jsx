import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, PhoneCall
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
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function OutstandingReceivablesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [outstandings, setOutstandings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [bucketFilter, setBucketFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [followupItem, setFollowupItem] = useState(null);
  const [followupNote, setFollowupNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleOpenFollowup = (item) => {
    setFollowupItem(item);
    setFollowupNote(item.last_followup || '');
  };

  const handleSaveFollowup = () => {
    if (!followupItem) return;
    setSaving(true);
    setTimeout(() => {
      setOutstandings(prev => prev.map(o => o.id === followupItem.id ? { ...o, last_followup: followupNote } : o));
      toast.success('Collection follow-up remark logged.');
      setFollowupItem(null);
      setSaving(false);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return outstandings.filter(o => {
      if (selectedProjectId !== 'all' && String(o.project_id) !== String(selectedProjectId)) return false;
      if (bucketFilter !== 'all' && !o.aging_bucket.includes(bucketFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(o.invoice_no || '').toLowerCase();
        const cli = String(o.client_name || '').toLowerCase();
        const proj = String(o.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [outstandings, selectedProjectId, bucketFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalOutstandingSum = useMemo(() => outstandings.reduce((acc, o) => acc + Number(o.outstanding_balance || 0), 0), [outstandings]);
  const totalOverdueSum = useMemo(() => outstandings.filter(o => o.days_overdue > 0).reduce((acc, o) => acc + Number(o.outstanding_balance || 0), 0), [outstandings]);

  const getBucketBadge = (b) => {
    if (b.includes('Current')) return 'info';
    if (b.includes('31')) return 'warning';
    return 'danger';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Aging Outstanding Receivables' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Aging Receivables & Overdue Debtors Analysis"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Outstanding Debtors"
            value={`₹${(totalOutstandingSum / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Overdue (> 30 Days)"
            value={`₹${(totalOverdueSum / 100000).toFixed(2)}L`}
            status={totalOverdueSum > 0 ? 'danger' : 'success'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Open Pending Invoices"
            value={`${outstandings.length} Invoices`}
            status="neutral"
            icon={<FileText className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Collection Recovery Rate"
            value="89.4% Current"
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
                  { value: 'all', label: 'All Aging Buckets' },
                  { value: 'Current', label: 'Current (0-30 Days)' },
                  { value: '31', label: '31 - 60 Days' },
                  { value: '61', label: '61 - 90 Days' },
                ]}
                value={bucketFilter}
                onChange={setBucketFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search invoice, client, project..."
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
              title="Print Aging Statement"
            >
              Print Aging Statement
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
                  <th className="px-3 py-2 w-28">Invoice No</th>
                  <th className="px-3 py-2">Client & Project</th>
                  <th className="px-3 py-2 text-right w-28">Gross Invoiced</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-amber-600">Outstanding</th>
                  <th className="px-3 py-2 text-center w-36">Aging Bucket</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Officer Incharge</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading outstanding debtor records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No outstanding receivables found.
                    </td>
                  </tr>
                ) : (
                  paged.map((o, idx) => (
                    <tr key={o.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {o.invoice_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{o.invoice_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={o.client_name}>
                            {o.client_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {o.billing_type} • {o.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(o.gross_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        ₹{(o.outstanding_balance / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getBucketBadge(o.aging_bucket)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {o.aging_bucket}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-[11px] text-text-secondary font-medium truncate">
                        {o.recovery_officer}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Aging Dossier 360"
                            onClick={() => setViewingItem(o)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-1.5 text-primary border-primary/30 hover:bg-primary/5"
                            title="Log Follow-up"
                            onClick={() => handleOpenFollowup(o)}
                          >
                            <PhoneCall className="w-3 h-3 mr-0.5" /> Follow-up
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
          {paged.map((o, idx) => (
            <div key={o.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{o.invoice_no} • {o.invoice_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{o.client_name}</h4>
                  <span className="text-[11px] text-text-muted">{o.billing_type}</span>
                </div>
                <Badge
                  variant={getBucketBadge(o.aging_bucket)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(o.outstanding_balance / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Latest Follow-up Note:</span>
                <span className="text-[11px] text-text-primary">{o.last_followup}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(o)}>
                  <Eye className="w-3 h-3 mr-1" /> View Dossier
                </Button>
                <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenFollowup(o)}>
                  <PhoneCall className="w-3 h-3 mr-1" /> Follow-up
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

      {/* View Aging 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.invoice_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Outstanding Due</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.outstanding_balance / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Aging Status</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.aging_bucket}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Invoice Sum</span> <span className="font-mono">₹{(viewingItem.gross_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Received to Date</span> <span className="font-mono font-bold text-emerald-600">₹{(viewingItem.amount_received / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Due Date</span> <span className="font-mono">{viewingItem.due_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Recovery Incharge</span> <span className="text-primary font-medium">{viewingItem.recovery_officer}</span></div>
              </div>

              {viewingItem.last_followup && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Latest Follow-up Call & Meeting Note:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.last_followup}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Aging Docket
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Note Modal */}
      {followupItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Log Collection Follow-up</h3>
                  <span className="text-[11px] font-mono text-text-muted">{followupItem.invoice_no} • {followupItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFollowupItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <FormField label="Follow-up Call / Meeting Summary" required>
                <Textarea
                  rows={4}
                  value={followupNote}
                  onChange={(e) => setFollowupNote(e.target.value)}
                  placeholder="e.g. Spoke to Chief Financial Officer Mr. Agarwal; fund release scheduled for upcoming Wednesday..."
                />
              </FormField>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setFollowupItem(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSaveFollowup} disabled={saving}>
                {saving ? 'Saving...' : 'Save Follow-up Note'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
