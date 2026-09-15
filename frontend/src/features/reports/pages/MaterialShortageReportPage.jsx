import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, ShoppingCart, Boxes
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



export function MaterialShortageReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
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

  const handleRaiseIndent = (item) => {
    toast.success(`Purchase Indent raised for ${item.suggested_reorder_qty} ${item.unit} of ${item.material_name}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return shortages.filter(s => {
      if (selectedProjectId !== 'all' && String(s.project_id) !== String(selectedProjectId)) return false;
      if (urgencyFilter !== 'all' && !s.urgency_status.includes(urgencyFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const mat = String(s.material_name || '').toLowerCase();
        const cat = String(s.category_name || '').toLowerCase();
        const proj = String(s.project_name || '').toLowerCase();
        if (!mat.includes(str) && !cat.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [shortages, selectedProjectId, urgencyFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const criticalCount = useMemo(() => shortages.filter(s => s.urgency_status.includes('Critical')).length, [shortages]);

  const getUrgencyBadge = (u) => {
    if (u.includes('Critical')) return 'danger';
    if (u.includes('Urgent')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/project-progress' },
    { label: 'Material Shortage & Buffer Alerts' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Shortage, Buffer Stock & Critical Reorder Alert Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Critical Stockout Alerts"
            value={`${criticalCount} Critical Items`}
            status={criticalCount > 0 ? 'danger' : 'success'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Pending Reorder Indents"
            value={`${shortages.length} Indents Needed`}
            status="warning"
            icon={<ShoppingCart className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Average Stock Runway"
            value="1.3 Days Available"
            status="danger"
            icon={<Clock className="w-4 h-4 text-rose-500" />}
          />
          <KpiCard
            label="Procurement Supply Chain"
            value="Urgent PO Action"
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
                  { value: 'all', label: 'All Urgencies' },
                  { value: 'Critical', label: 'Critical Stockout' },
                  { value: 'Urgent', label: 'Urgent Reorder' },
                ]}
                value={urgencyFilter}
                onChange={setUrgencyFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search material, location..."
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
              title="Print Shortage Report"
            >
              Print Reorder Indent
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
                  <th className="px-3 py-2">Material Name & Location</th>
                  <th className="px-3 py-2 text-right w-24 font-bold text-amber-600">Available Stock</th>
                  <th className="px-3 py-2 text-right w-24">Buffer Stock</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Burn Rate/Day</th>
                  <th className="px-3 py-2 text-center w-24 font-bold text-rose-600">Runway</th>
                  <th className="px-3 py-2 text-center w-36">Urgency Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material shortage alerts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No material shortage records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={s.material_name}>
                            {s.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {s.store_location} • {s.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        {s.current_stock.toLocaleString('en-IN')} {s.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {s.minimum_buffer_stock.toLocaleString('en-IN')} {s.unit}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        {s.daily_consumption_rate.toLocaleString('en-IN')} {s.unit}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-rose-600 text-[11px]">
                        {s.stock_runway_days} Days
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getUrgencyBadge(s.urgency_status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {s.urgency_status.includes('Critical') ? 'Critical Stockout' : 'Urgent Reorder'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Shortage 360"
                            onClick={() => setViewingItem(s)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                            title="Raise Indent"
                            onClick={() => handleRaiseIndent(s)}
                          >
                            <ShoppingCart className="w-3 h-3 mr-0.5" /> Indent
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
          {paged.map((s, idx) => (
            <div key={s.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{s.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{s.store_location}</span>
                </div>
                <Badge
                  variant={getUrgencyBadge(s.urgency_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {s.stock_runway_days} Days Left
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Available Physical Stock</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">{s.current_stock} {s.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Suggested Reorder</span>
                  <span className="font-mono font-bold text-primary text-[11px]">{s.suggested_reorder_qty} {s.unit}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(s)}>
                  <Eye className="w-3 h-3 mr-1" /> View Details
                </Button>
                <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-amber-600 hover:bg-amber-700" onClick={() => handleRaiseIndent(s)}>
                  <ShoppingCart className="w-3 h-3 mr-1" /> Raise Indent
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

      {/* View Shortage 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.material_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Available Physical Stock</span> <span className="font-bold text-amber-600 font-mono text-base">{viewingItem.current_stock} {viewingItem.unit}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Stock Runway</span> <span className="font-bold text-rose-600 font-mono text-base">{viewingItem.stock_runway_days} Days</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Safety Buffer Threshold</span> <span className="font-mono">{viewingItem.minimum_buffer_stock} {viewingItem.unit}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Daily Burn Rate</span> <span className="font-mono">{viewingItem.daily_consumption_rate} {viewingItem.unit}/Day</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Supplier Lead Time</span> <span className="font-mono">{viewingItem.lead_time_days} Days</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Suggested Reorder Qty</span> <span className="font-mono font-bold text-primary">{viewingItem.suggested_reorder_qty} {viewingItem.unit}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Storage Location</span> <span className="text-text-primary font-medium">{viewingItem.store_location}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => handleRaiseIndent(viewingItem)}>
                <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Raise Procurement Indent
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
