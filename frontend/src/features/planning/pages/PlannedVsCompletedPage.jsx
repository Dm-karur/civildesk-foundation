import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Flame,
  Search, Filter, Eye, Edit, Layers, Activity,
  BarChart3, Scale, ArrowUpRight, ArrowDownRight, Percent
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



export function PlannedVsCompletedPage() {
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [actualQty, setActualQty] = useState('0');
  const [actualPct, setActualPct] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (selectedProjectId !== 'all' && String(item.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (item.activity_code || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        const zone = (item.zone_name || '').toLowerCase();
        const phase = (item.phase_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !zone.includes(q) && !phase.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const avgPlanned = useMemo(() => Math.round(items.reduce((acc, i) => acc + i.planned_progress_pct, 0) / items.length), [items]);
  const avgActual = useMemo(() => Math.round(items.reduce((acc, i) => acc + i.actual_progress_pct, 0) / items.length), [items]);
  const overallSpi = useMemo(() => (avgPlanned > 0 ? (avgActual / avgPlanned).toFixed(2) : '1.00'), [avgActual, avgPlanned]);
  const criticalDelays = useMemo(() => items.filter(i => i.status === 'Critical Slippage').length, [items]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setActualQty(String(item.actual_qty));
    setActualPct(String(item.actual_progress_pct));
    setRemarks(item.remarks || '');
  };

  const handleConfirmUpdate = () => {
    if (!editingItem) return;
    setSaving(true);

    const aQty = Number(actualQty) || 0;
    const aPct = Number(actualPct) || 0;
    const pPct = editingItem.planned_progress_pct;
    const vPct = aPct - pPct;
    const spi = pPct > 0 ? (aPct / pPct).toFixed(2) : 1.0;

    let newStatus = 'On Track';
    if (aPct >= 100) newStatus = 'Completed';
    else if (vPct > 0) newStatus = 'Ahead of Target';
    else if (vPct < -5) newStatus = 'Critical Slippage';
    else if (vPct < 0) newStatus = 'Minor Delay';

    setItems(prev => prev.map(i => {
      if (i.id === editingItem.id) {
        return {
          ...i,
          actual_qty: aQty,
          actual_progress_pct: aPct,
          variance_pct: vPct,
          spi_index: Number(spi),
          status: newStatus,
          remarks: remarks || i.remarks,
        };
      }
      return i;
    }));

    toast.success(`Progress updated for ${editingItem.activity_code}.`);
    setSaving(false);
    setEditingItem(null);
  };

  const getStatusVariant = (status) => {
    if (status === 'Completed' || status === 'Ahead of Target') return 'success';
    if (status === 'On Track') return 'primary';
    if (status === 'Minor Delay') return 'warning';
    if (status === 'Critical Slippage') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'Planned vs Completed' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Planned vs Completed Progress & Variance Analysis"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Target Planned Progress"
            value={`${avgPlanned}%`}
            status="neutral"
            icon={<Clock className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Actual Site Completion"
            value={`${avgActual}%`}
            status={avgActual >= avgPlanned ? 'success' : 'warning'}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Schedule Performance Index"
            value={`SPI ${overallSpi}`}
            status={Number(overallSpi) >= 1.0 ? 'success' : 'warning'}
            icon={<Scale className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Critical Slippages"
            value={`${criticalDelays} Activities`}
            status={criticalDelays > 0 ? 'error' : 'neutral'}
            icon={<Flame className="w-4 h-4 text-red-500" />}
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
                  { value: 'all', label: 'All Progress Status' },
                  { value: 'Completed', label: 'Completed (100%)' },
                  { value: 'Ahead of Target', label: 'Ahead of Target' },
                  { value: 'Minor Delay', label: 'Minor Delay' },
                  { value: 'Critical Slippage', label: 'Critical Slippage' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search activity, zone, phase..."
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
                  <th className="px-3 py-2 w-28">Activity</th>
                  <th className="px-3 py-2">Scope & Location</th>
                  <th className="px-3 py-2 text-right w-36 hidden md:table-cell">Physical Quantities</th>
                  <th className="px-3 py-2 w-44">Planned vs Actual (%)</th>
                  <th className="px-3 py-2 text-center w-20">SPI</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading variance tracking...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No activity variance records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((item, idx) => {
                    const isAhead = item.variance_pct > 0;
                    const isDelayed = item.variance_pct < 0;

                    return (
                      <tr key={item.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {item.activity_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {item.zone_name} • {item.phase_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px]">
                          <span className="text-text-primary font-bold">{Number(item.actual_qty).toLocaleString('en-IN')}</span>
                          <span className="text-text-muted text-[10px]"> / {Number(item.planned_qty).toLocaleString('en-IN')} {item.uom_name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-text-muted">Plan: {item.planned_progress_pct}%</span>
                              <span className="font-bold text-primary">Act: {item.actual_progress_pct}%</span>
                              <span className={`font-bold ${isAhead ? 'text-emerald-600' : isDelayed ? 'text-red-600' : 'text-text-muted'}`}>
                                ({isAhead ? '+' : ''}{item.variance_pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden flex border border-border/50">
                              <div
                                className="h-full bg-sky-400 opacity-60"
                                style={{ width: `${item.planned_progress_pct}%` }}
                              />
                              <div
                                className={`h-full -ml-full ${item.actual_progress_pct >= item.planned_progress_pct ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${item.actual_progress_pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-[11px]">
                          <span className={item.spi_index >= 1.0 ? 'text-emerald-600' : 'text-red-600'}>
                            {item.spi_index.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(item.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Variance 360"
                              onClick={() => setViewingItem(item)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Update Progress"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
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
          {paged.map((item, idx) => (
            <div key={item.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{item.activity_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{item.name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(item.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {item.status}
                </Badge>
              </div>

              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-text-muted">Plan: {item.planned_progress_pct}%</span>
                  <span className="font-bold text-primary">Act: {item.actual_progress_pct}% ({item.variance_pct > 0 ? '+' : ''}{item.variance_pct}%)</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${item.actual_progress_pct >= item.planned_progress_pct ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${item.actual_progress_pct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Executed Qty</span>
                  <span className="font-mono text-text-primary text-[11px]">{item.actual_qty} / {item.planned_qty} {item.uom_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">SPI Index</span>
                  <span className={`font-mono font-bold text-[11px] ${item.spi_index >= 1.0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    SPI {item.spi_index.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(item)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(item)}>
                  <Edit className="w-3 h-3 mr-1" /> Update
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

      {/* View Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.activity_code} • {viewingItem.phase_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Progress</span> <span className="font-mono">{viewingItem.planned_progress_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Completion</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.actual_progress_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Quantity Executed</span> <span className="font-mono font-bold text-text-primary">{viewingItem.actual_qty} / {viewingItem.planned_qty} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule SPI</span> <span className="font-bold font-mono">{viewingItem.spi_index.toFixed(2)}</span></div>
              </div>

              {viewingItem.remarks && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Site Status & Variance Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50">{viewingItem.remarks}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Update Actual Site Progress</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border space-y-1">
                <span className="text-text-muted block text-[10px] uppercase font-bold">Activity</span>
                <span className="font-semibold text-text-primary block text-sm">{editingItem.name}</span>
                <span className="font-mono text-text-muted">Target Qty: {editingItem.planned_qty} {editingItem.uom_name} (Plan: {editingItem.planned_progress_pct}%)</span>
              </div>

              <FormField label={`Cumulative Executed Quantity (${editingItem.uom_name})`} required>
                <Input
                  type="number"
                  step="0.01"
                  value={actualQty}
                  onChange={(e) => {
                    setActualQty(e.target.value);
                    const q = Number(e.target.value) || 0;
                    const tot = editingItem.planned_qty || 1;
                    const pct = Math.min(100, Math.round((q / tot) * 100));
                    setActualPct(String(pct));
                  }}
                />
              </FormField>

              <FormField label="Actual Completion Progress (%)" required>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={actualPct}
                  onChange={(e) => setActualPct(e.target.value)}
                />
              </FormField>

              <FormField label="Site Observations & Mitigation Remarks">
                <Textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="State reasons for delay or acceleration actions..."
                />
              </FormField>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmUpdate}
                disabled={saving}
              >
                Save Progress
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
