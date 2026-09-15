import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, AlertTriangle, Send
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



export function VendorPayablesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [payModalItem, setPayModalItem] = useState(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleOpenDisburse = (item) => {
    setPayModalItem(item);
    setDisburseAmount(String(item.outstanding_due || '0'));
  };

  const handleConfirmDisburse = () => {
    if (!payModalItem) return;
    const amt = Number(disburseAmount || 0);
    if (amt <= 0 || amt > payModalItem.outstanding_due) {
      toast.error('Invalid payment disbursement amount.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setPayables(prev => prev.map(p => {
        if (p.id === payModalItem.id) {
          const newPaid = p.total_paid + amt;
          const newBal = p.outstanding_due - amt;
          return {
            ...p,
            total_paid: newPaid,
            outstanding_due: newBal,
            last_payment_date: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      }));
      toast.success(`Disbursement voucher of ₹${amt.toLocaleString('en-IN')} approved.`);
      setPayModalItem(null);
      setSaving(false);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return payables.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (priorityFilter !== 'all' && !p.priority.includes(priorityFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const vnd = String(p.vendor_name || '').toLowerCase();
        const cat = String(p.category || '').toLowerCase();
        const proj = String(p.project_name || '').toLowerCase();
        if (!vnd.includes(str) && !cat.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [payables, selectedProjectId, priorityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalOutstanding = useMemo(() => payables.reduce((acc, p) => acc + Number(p.outstanding_due || 0), 0), [payables]);
  const totalPaidToDate = useMemo(() => payables.reduce((acc, p) => acc + Number(p.total_paid || 0), 0), [payables]);

  const getPriorityBadge = (pr) => {
    if (pr.includes('Critical')) return 'danger';
    if (pr.includes('High')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Vendor & Subcontractor Payables' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Vendor & Subcontractor Aging Payables & Outstanding Dues"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Vendor Outstanding"
            value={`₹${(totalOutstanding / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Disbursed to Date"
            value={`₹${(totalPaidToDate / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Creditors"
            value={`${payables.length} Accounts`}
            status="neutral"
            icon={<CreditCard className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Credit Payment Terms"
            value="30-45 Days Normal"
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
                  { value: 'all', label: 'All Priorities' },
                  { value: 'Critical', label: 'Critical' },
                  { value: 'High', label: 'High Priority' },
                  { value: 'Normal', label: 'Normal' },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search vendor, category..."
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
              title="Print Payables Statement"
            >
              Print Statement
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
                  <th className="px-3 py-2">Vendor / Creditor Name</th>
                  <th className="px-3 py-2 text-right w-28">Total Billed</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600">Paid to Date</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-amber-600">Outstanding</th>
                  <th className="px-3 py-2 text-center w-32">Aging Bucket</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Priority</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading vendor payables...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No vendor payable records found.
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
                            {p.category} • {p.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(p.total_billed / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(p.total_paid / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        ₹{(p.outstanding_due / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] font-mono text-text-secondary">
                          {p.aging_bucket}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-center">
                        <Badge
                          variant={getPriorityBadge(p.priority)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {p.priority}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Payables Dossier 360"
                            onClick={() => setViewingItem(p)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {p.outstanding_due > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Disburse Payment"
                              onClick={() => handleOpenDisburse(p)}
                            >
                              <Send className="w-3 h-3 mr-0.5" /> Pay
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
          {paged.map((p, idx) => (
            <div key={p.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.vendor_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.category}</span>
                </div>
                <Badge
                  variant={getPriorityBadge(p.priority)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(p.outstanding_due / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Paid to Date</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(p.total_paid / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance Due</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(p.outstanding_due / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Dossier
                </Button>
                {p.outstanding_due > 0 && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleOpenDisburse(p)}>
                    <Send className="w-3 h-3 mr-1" /> Pay Due
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

      {/* View Payables 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.vendor_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.category}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Outstanding Due</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.outstanding_due / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Paid to Date</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.total_paid / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Invoiced</span> <span className="font-mono">₹{(viewingItem.total_billed / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Aging Status</span> <span className="font-mono font-medium">{viewingItem.aging_bucket}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Last Payment Date</span> <span className="font-mono">{viewingItem.last_payment_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Priority Status</span> <span className="text-amber-700 font-medium">{viewingItem.priority}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Payables Statement
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {payModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Disburse Vendor Payment</h3>
                  <span className="text-[11px] font-mono text-text-muted">{payModalItem.vendor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPayModalItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold">Total Outstanding Due:</div>
                <div className="text-base font-mono font-bold">₹{payModalItem.outstanding_due.toLocaleString('en-IN')}</div>
              </div>

              <FormField label="Disbursement Amount (₹)" required>
                <Input
                  type="number"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  placeholder="Enter amount to disburse"
                />
              </FormField>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPayModalItem(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleConfirmDisburse} disabled={saving}>
                {saving ? 'Processing...' : 'Authorize Disbursement'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
