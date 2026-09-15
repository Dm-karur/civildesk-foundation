import { useState, useEffect, useMemo } from 'react';
import {
  Link2, CheckCircle2, Clock, AlertCircle, IndianRupee,
  Layers, Search, Filter, Eye, ArrowRight, Unlink,
  ListOrdered, Boxes, FileSpreadsheet, Sparkles, Check
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
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, boqApi } from '../../../api/apiservice';



const AVAILABLE_ACTIVITIES = [
  { code: 'ACT-0101-EXC', name: 'Basement Mass Excavation & Soil Stacking', period: '2026-06-01 to 2026-07-15' },
  { code: 'ACT-0102-RAFT', name: 'Foundation Raft Reinforcement & M40 Concrete Pour', period: '2026-07-16 to 2026-08-20' },
  { code: 'ACT-0201-COL', name: 'Ground to Level 4 Peripheral RC Columns Casting', period: '2026-08-22 to 2026-10-15' },
  { code: 'ACT-0301-MEP', name: 'Basement Drainage Sump & Firefighting Header Piping', period: '2026-09-01 to 2026-10-30' },
  { code: 'ACT-0401-AAC', name: 'Internal Office AAC Block Masonry Walls', period: '2026-11-01 to 2026-12-31' },
];

export function PlanningBoqMappingPage() {
  const [projects, setProjects] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Mapping Modal
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [selectedActCode, setSelectedActCode] = useState('ACT-0101-EXC');
  const [weightagePct, setWeightagePct] = useState('100');

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return mappings.filter(m => {
      if (selectedProjectId !== 'all' && String(m.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const iCode = (m.item_code || '').toLowerCase();
        const iName = (m.item_name || '').toLowerCase();
        const aCode = (m.activity_code || '').toLowerCase();
        const aName = (m.activity_name || '').toLowerCase();
        const sec = (m.section_name || '').toLowerCase();
        if (!iCode.includes(q) && !iName.includes(q) && !aCode.includes(q) && !aName.includes(q) && !sec.includes(q)) return false;
      }
      return true;
    });
  }, [mappings, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const mappedCount = useMemo(() => mappings.filter(m => m.status === 'Mapped').length, [mappings]);
  const unmappedCount = useMemo(() => mappings.filter(m => m.status === 'Unmapped').length, [mappings]);
  const mappedAmount = useMemo(() => mappings.filter(m => m.status === 'Mapped').reduce((acc, m) => acc + Number(m.amount || 0), 0), [mappings]);

  const handleOpenMap = (item) => {
    setEditingItem(item);
    setSelectedActCode(item.activity_code !== '—' ? item.activity_code : AVAILABLE_ACTIVITIES[0].code);
    setWeightagePct(String(item.weightage_pct || 100));
  };

  const handleConfirmMap = () => {
    if (!editingItem) return;
    const actObj = AVAILABLE_ACTIVITIES.find(a => a.code === selectedActCode);

    setMappings(prev => prev.map(m => {
      if (m.id === editingItem.id) {
        return {
          ...m,
          activity_code: actObj?.code || selectedActCode,
          activity_name: actObj?.name || 'Linked Activity',
          activity_period: actObj?.period || '2026-06-01 to 2026-12-31',
          weightage_pct: Number(weightagePct) || 100,
          status: 'Mapped'
        };
      }
      return m;
    }));

    toast.success(`BOQ Item ${editingItem.item_code} mapped to ${selectedActCode}.`);
    setEditingItem(null);
  };

  const handleUnmap = (item) => {
    setMappings(prev => prev.map(m => {
      if (m.id === item.id) {
        return {
          ...m,
          activity_code: '—',
          activity_name: 'Unmapped',
          activity_period: '—',
          weightage_pct: 0,
          status: 'Unmapped'
        };
      }
      return m;
    }));
    toast.success(`Unlinked ${item.item_code} from activity.`);
  };

  const getStatusVariant = (status) => {
    if (status === 'Mapped') return 'success';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Planning', href: '/planning/activities' },
    { label: 'BOQ Mapping' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Planning & BOQ Activity Mapping (4D Cost-Schedule)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total BOQ Items"
            value={mappings.length}
            status="primary"
            icon={<Boxes className="w-4 h-4" />}
          />
          <KpiCard
            label="Mapped to WBS Activities"
            value={mappedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Unmapped Items"
            value={unmappedCount}
            status="warning"
            icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="4D Linked BOQ Value"
            value={`₹${(mappedAmount / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Mapped', label: 'Mapped' },
                  { value: 'Unmapped', label: 'Unmapped' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search BOQ code, item, activity..."
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
                  <th className="px-3 py-2 w-28">BOQ Item</th>
                  <th className="px-3 py-2">Item Description & Section</th>
                  <th className="px-3 py-2">Mapped WBS Activity</th>
                  <th className="px-3 py-2 text-right w-28">BOQ Amount (₹)</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading BOQ mappings...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No BOQ mapping records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => {
                    const isMapped = m.status === 'Mapped';

                    return (
                      <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {m.item_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={m.item_name}>
                              {m.item_name}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              {m.section_name} • {m.boq_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {isMapped ? (
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  {m.activity_code}
                                </span>
                                <span className="text-[11px] font-medium text-text-primary truncate" title={m.activity_name}>
                                  {m.activity_name}
                                </span>
                              </div>
                              <span className="text-[10px] text-text-muted font-mono truncate">
                                {m.activity_period} ({m.weightage_pct}% wt)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-text-muted italic flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-500" /> Pending Linkage
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                          ₹{Number(m.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(m.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {m.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Details"
                              onClick={() => setViewingItem(m)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title={isMapped ? 'Re-map Activity' : 'Map to Activity'}
                              onClick={() => handleOpenMap(m)}
                            >
                              <Link2 className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {isMapped && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Unlink"
                                onClick={() => handleUnmap(m)}
                              >
                                <Unlink className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                              </Button>
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
          {paged.map((m, idx) => (
            <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{m.item_code} • {m.boq_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.item_name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(m.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {m.status}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/30 rounded border border-border/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Linked Activity</span>
                <span className="font-semibold text-text-primary text-[11px] block">{m.activity_code}: {m.activity_name}</span>
                <span className="font-mono text-[10px] text-text-muted">{m.activity_period}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="font-mono font-bold text-primary text-[11px]">₹{Number(m.amount || 0).toLocaleString('en-IN')}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(m)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenMap(m)}>
                    <Link2 className="w-3 h-3 mr-1" /> Link
                  </Button>
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

      {/* View Mapping Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.item_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.item_code} • {viewingItem.section_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measured Quantity</span> <span className="font-mono font-bold text-text-primary">{Number(viewingItem.quantity || 0).toLocaleString('en-IN')} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total BOQ Value</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.amount || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Linked WBS Code</span> <span className="font-mono text-emerald-600 font-bold">{viewingItem.activity_code}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cost Weightage</span> <span className="font-mono">{viewingItem.weightage_pct}%</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">WBS Activity Scope:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50">{viewingItem.activity_name}</p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Map BOQ Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Link BOQ to WBS Activity</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border space-y-1">
                <span className="text-text-muted block text-[10px] uppercase font-bold">BOQ Item</span>
                <span className="font-semibold text-text-primary block text-sm">{editingItem.item_name}</span>
                <span className="font-mono text-primary font-bold">₹{Number(editingItem.amount || 0).toLocaleString('en-IN')} ({editingItem.quantity} {editingItem.uom_name})</span>
              </div>

              <FormField label="Target WBS Activity" required>
                <Select
                  options={AVAILABLE_ACTIVITIES.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
                  value={selectedActCode}
                  onChange={setSelectedActCode}
                />
              </FormField>

              <FormField label="Cost Contribution / Weightage (%)" required>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={weightagePct}
                  onChange={(e) => setWeightagePct(e.target.value)}
                />
              </FormField>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Link2 className="w-3.5 h-3.5" />}
                onClick={handleConfirmMap}
              >
                Save Linkage
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
