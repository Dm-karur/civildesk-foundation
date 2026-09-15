import { useState, useEffect, useMemo } from 'react';
import {
  Lock, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  Check, AlertCircle, Sparkles, Printer, ArrowRight, Unlock, Calculator
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
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
  work_order_no: 'WO-2026-012',
  package_title: '',
  total_retention_deducted: '200000',
  retention_released: '0',
  balance_retention_held: '200000',
  dlp_expiry_date: '',
  notes: '',
};

export function RetentionLedgerPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [retentions, setRetentions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [releaseModalItem, setReleaseModalItem] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleOpenRelease = (item) => {
    setReleaseModalItem(item);
    setReleaseAmount(String(item.balance_retention_held || '0'));
  };

  const handleConfirmRelease = () => {
    if (!releaseModalItem) return;
    const rel = Number(releaseAmount || 0);
    if (rel <= 0 || rel > releaseModalItem.balance_retention_held) {
      toast.error('Invalid release amount. Must be within held balance.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setRetentions(prev => prev.map(r => {
        if (r.id === releaseModalItem.id) {
          const newRel = r.retention_released + rel;
          const newBal = r.total_retention_deducted - newRel;
          return {
            ...r,
            retention_released: newRel,
            balance_retention_held: newBal,
            status_name: newBal === 0 ? '100% Fully Released (DLP Closed)' : `${((newRel / r.total_retention_deducted) * 100).toFixed(0)}% Released (DLP Active)`,
          };
        }
        return r;
      }));
      toast.success(`Retention payment of ₹${rel.toLocaleString('en-IN')} released to subcontractor.`);
      setReleaseModalItem(null);
      setSaving(false);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return retentions.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const cont = String(r.contractor_name || '').toLowerCase();
        const wo = String(r.work_order_no || '').toLowerCase();
        const pack = String(r.package_title || '').toLowerCase();
        if (!cont.includes(s) && !wo.includes(s) && !pack.includes(s)) return false;
      }
      return true;
    });
  }, [retentions, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalHeldInEscrow = useMemo(() => retentions.reduce((acc, r) => acc + Number(r.balance_retention_held || 0), 0), [retentions]);
  const totalReleased = useMemo(() => retentions.reduce((acc, r) => acc + Number(r.retention_released || 0), 0), [retentions]);

  const getStatusVariant = (st) => {
    if (st.includes('Fully Released')) return 'success';
    if (st.includes('Released')) return 'info';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Retention Money Ledger' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Retention Money Ledger & Defect Liability (DLP)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Retention Held"
            value={`₹${(totalHeldInEscrow / 100000).toFixed(2)}L`}
            status="primary"
            icon={<Lock className="w-4 h-4" />}
          />
          <KpiCard
            label="Released to Date"
            value={`₹${(totalReleased / 100000).toFixed(2)}L`}
            status="success"
            icon={<Unlock className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Retention Accounts"
            value={`${retentions.length} Accounts`}
            status="neutral"
            icon={<Calculator className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="DLP Protection Status"
            value="100% Protected"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search contractor, WO no, package..."
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
              title="Print Retention Ledger"
            >
              Print Ledger
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
                  <th className="px-3 py-2 w-28">Contractor</th>
                  <th className="px-3 py-2">Work Package & WO No</th>
                  <th className="px-3 py-2 text-right w-28">Total Deducted</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Released</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Balance Held</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">DLP Expiry</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading retention ledger...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No retention accounts found.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={r.contractor_name}>
                          {r.contractor_name}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{r.project_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-text-primary truncate" title={r.package_title}>
                            {r.package_title}
                          </span>
                          <span className="text-[10px] text-primary font-mono truncate">
                            {r.work_order_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{r.total_retention_deducted.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-emerald-600 font-semibold">
                        ₹{r.retention_released.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        ₹{r.balance_retention_held.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-muted">
                        {r.dlp_expiry_date}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Retention Dossier 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {r.balance_retention_held > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                              title="Release Retention"
                              onClick={() => handleOpenRelease(r)}
                            >
                              <Unlock className="w-3 h-3 mr-0.5" /> Release
                            </Button>
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
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.contractor_name}</h4>
                  <span className="text-[11px] text-primary font-mono">{r.work_order_no}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{r.balance_retention_held.toLocaleString('en-IN')} Held
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Deducted</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{r.total_retention_deducted.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Released to Date</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{r.retention_released.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Details
                </Button>
                {r.balance_retention_held > 0 && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-amber-600 hover:bg-amber-700" onClick={() => handleOpenRelease(r)}>
                    <Unlock className="w-3 h-3 mr-1" /> Release
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

      {/* View Retention 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.contractor_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.work_order_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Retention Deducted</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.total_retention_deducted.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Balance Held in Escrow</span> <span className="font-bold text-amber-600 font-mono text-base">₹{viewingItem.balance_retention_held.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Released</span> <span className="font-mono font-bold text-emerald-600">₹{viewingItem.retention_released.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">DLP Expiry Deadline</span> <span className="font-mono font-medium">{viewingItem.dlp_expiry_date}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Package Scope</span> <span className="text-text-primary font-medium">{viewingItem.package_title}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Ledger Audit Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Retention Certificate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Release Retention Modal */}
      {releaseModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Release Retention Money</h3>
                  <span className="text-[11px] font-mono text-text-muted">{releaseModalItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReleaseModalItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold">Total Available Escrow Balance:</div>
                <div className="text-base font-mono font-bold">₹{releaseModalItem.balance_retention_held.toLocaleString('en-IN')}</div>
              </div>

              <FormField label="Amount to Release (₹)" required>
                <Input
                  type="number"
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(e.target.value)}
                  placeholder="Enter release amount in ₹"
                />
              </FormField>

              <p className="text-[11px] text-text-muted">
                Ensure Defect Liability Inspection (DLP) or Taking-Over Certificate (TOC) has been signed by the resident engineer.
              </p>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReleaseModalItem(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleConfirmRelease} disabled={saving}>
                {saving ? 'Processing...' : 'Confirm Release Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
