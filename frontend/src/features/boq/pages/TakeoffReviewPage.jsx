import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2, CheckCircle2, Clock, AlertTriangle, Calculator,
  Search, Filter, Eye, Check, X, ShieldAlert, FileText,
  DraftingCompass, ArrowRight, UserCheck, Scale
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
import { projectsApi, request } from '../../../api/apiservice';



export function TakeoffReviewPage() {
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Removed localStorage effect
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Decision Modal
  const [activeItem, setActiveItem] = useState(null);
  const [auditAction, setAuditAction] = useState('Verify');
  const [verifiedQty, setVerifiedQty] = useState('0');
  const [auditNotes, setAuditNotes] = useState('');
  const [viewingReview, setViewingReview] = useState(null);

  // Load Projects
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await request.get('/boq-takeoff-reviews');
      setReviews(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (error) {
      // Ignore if it fails (e.g. 404 because backend is missing)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects || res?.projects || [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {});
    
    fetchReviews();
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (disciplineFilter !== 'all' && r.discipline !== disciplineFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (r.takeoff_code || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        const dwg = (r.drawing_ref_no || '').toLowerCase();
        const auditor = (r.auditor_name || '').toLowerCase();
        const notes = (r.audit_notes || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !dwg.includes(q) && !auditor.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, selectedProjectId, statusFilter, disciplineFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const verifiedCount = useMemo(() => reviews.filter(r => r.status === 'Verified').length, [reviews]);
  const pendingCount = useMemo(() => reviews.filter(r => r.status === 'Pending Audit').length, [reviews]);
  const discrepancyCount = useMemo(() => reviews.filter(r => r.status === 'Discrepancy Flagged').length, [reviews]);

  const handleOpenDecision = (item, action) => {
    setActiveItem(item);
    setAuditAction(action);
    setVerifiedQty(String(item.verified_quantity || item.measured_quantity));
    setAuditNotes(action === 'Verify' ? 'Quantities independently verified against drawing dimensions and IS 1200 standard.' : 'Discrepancy noted in measurements/deductions.');
  };

  const handleConfirmDecision = async () => {
    if (!activeItem) return;
    const isVerify = auditAction === 'Verify';
    const vQty = Number(verifiedQty) || activeItem.measured_quantity;

    try {
      const payload = {
        status: isVerify ? 'Verified' : 'Discrepancy Flagged',
        verified_quantity: vQty,
        audit_notes: auditNotes
      };
      
      await request.post(`/boq-takeoff-reviews/${activeItem.id}/audit`, payload);
      toast.success(`Takeoff ${activeItem.takeoff_code} ${isVerify ? 'Verified & Certified' : 'Discrepancy Flagged'}.`);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to audit takeoff.');
    } finally {
      setActiveItem(null);
    }
  };

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('verified')) return 'success';
    if (s.includes('pending')) return 'warning';
    if (s.includes('discrepancy') || s.includes('flagged')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'Takeoff Review' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Takeoff Review & Technical Audit"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Audit Packages"
            value={reviews.length}
            status="primary"
            icon={<FileCheck2 className="w-4 h-4" />}
          />
          <KpiCard
            label="Verified & Certified"
            value={verifiedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Audit"
            value={pendingCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Discrepancies Flagged"
            value={discrepancyCount}
            status="neutral"
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
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

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Verified', label: 'Verified & Certified' },
                  { value: 'Pending Audit', label: 'Pending Audit' },
                  { value: 'Discrepancy Flagged', label: 'Discrepancy Flagged' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Disciplines' },
                  { value: 'Structural', label: 'Structural' },
                  { value: 'Architectural', label: 'Architectural' },
                  { value: 'Highway', label: 'Highway' },
                ]}
                value={disciplineFilter}
                onChange={setDisciplineFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search code, DWG#, auditor..."
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
                  <th className="px-3 py-2 w-28">Takeoff Code</th>
                  <th className="px-3 py-2">Item Title & Drawing Ref</th>
                  <th className="px-3 py-2 text-right">Original Qty</th>
                  <th className="px-3 py-2 text-right">Verified Qty</th>
                  <th className="px-3 py-2 hidden md:table-cell">Auditor & Date</th>
                  <th className="px-3 py-2 text-center w-28">Audit Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading takeoff reviews...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No takeoff reviews found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => {
                    const isPending = r.status === 'Pending Audit';
                    const hasVariance = Number(r.variance_pct) !== 0;

                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {r.takeoff_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={r.title}>
                              {r.title}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              {r.drawing_ref_no} • {r.project_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                          {Number(r.measured_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {r.uom_name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                          <span className={hasVariance ? 'text-red-600' : 'text-text-primary'}>
                            {Number(r.verified_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {r.uom_name}
                            {hasVariance && <span className="block text-[10px] font-normal font-mono">({r.variance_pct}%)</span>}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex flex-col text-[11px]">
                            <span className="text-text-primary truncate">{r.auditor_name}</span>
                            <span className="text-[10px] text-text-muted font-mono">{r.audit_date}</span>
                          </div>
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
                              title="View Audit Detail"
                              onClick={() => setViewingReview(r)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {isPending && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Verify & Certify"
                                  onClick={() => handleOpenDecision(r, 'Verify')}
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600 hover:scale-110 transition-transform" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Flag Discrepancy"
                                  onClick={() => handleOpenDecision(r, 'Flag')}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.takeoff_code} • {r.drawing_ref_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.title}</h4>
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
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Measured Qty</span>
                  <span className="font-mono text-text-secondary text-[11px]">{Number(r.measured_quantity || 0).toLocaleString('en-IN')} {r.uom_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Verified Qty</span>
                  <span className="font-mono font-bold text-primary text-[11px]">{Number(r.verified_quantity || 0).toLocaleString('en-IN')} {r.uom_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{r.audit_date}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingReview(r)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {r.status === 'Pending Audit' && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenDecision(r, 'Verify')}>
                      <Check className="w-3 h-3 mr-1" /> Verify
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

      {/* View Review Modal */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingReview.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingReview.takeoff_code} • {viewingReview.drawing_ref_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingReview(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Initial Measured</span> <span className="font-mono text-text-secondary">{Number(viewingReview.measured_quantity || 0).toLocaleString('en-IN')} {viewingReview.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Verified & Certified</span> <span className="font-bold text-primary font-mono">{Number(viewingReview.verified_quantity || 0).toLocaleString('en-IN')} {viewingReview.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measured By</span> <span className="text-text-primary">{viewingReview.measured_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Auditor</span> <span className="text-emerald-600 font-semibold">{viewingReview.auditor_name}</span></div>
              </div>

              {viewingReview.audit_notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Audit Verification Certificate & Observations:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{viewingReview.audit_notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingReview(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Decision Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">
                  {auditAction === 'Verify' ? 'Certify & Verify Takeoff' : 'Flag Dimension Discrepancy'}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border space-y-1">
                <span className="text-text-muted block text-[10px] uppercase font-bold">Item & Original Quantity</span>
                <span className="font-semibold text-text-primary block text-sm">{activeItem.title}</span>
                <span className="font-mono text-text-secondary">{activeItem.measured_quantity} {activeItem.uom_name}</span>
              </div>

              <FormField label="Certified Final Net Quantity" required>
                <Input
                  type="number"
                  step="0.01"
                  value={verifiedQty}
                  onChange={(e) => setVerifiedQty(e.target.value)}
                />
              </FormField>

              <FormField label="Audit Sign-Off & Verification Notes" required>
                <Textarea
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="State dimension cross-checks, deductions applied..."
                />
              </FormField>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveItem(null)}>Cancel</Button>
              <Button
                variant={auditAction === 'Verify' ? 'primary' : 'destructive'}
                size="sm"
                onClick={handleConfirmDecision}
              >
                Confirm {auditAction === 'Verify' ? 'Verification' : 'Flag Discrepancy'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
