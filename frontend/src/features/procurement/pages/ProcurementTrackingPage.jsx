import { useState, useEffect, useMemo } from 'react';
import {
  Compass, CheckCircle2, Clock, IndianRupee, Truck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers, Printer, Phone
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function ProcurementTrackingPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [trackings, setTrackings] = useState([]);
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

  const handleExpedite = (item) => {
    toast.success(`Expediting notification sent to ${item.supplier_name} (${item.supplier_phone})`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return trackings.filter(t => {
      if (selectedProjectId !== 'all' && String(t.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(t.po_no || '').toLowerCase();
        const sup = String(t.supplier_name || '').toLowerCase();
        const mat = String(t.material_name || '').toLowerCase();
        const stg = String(t.current_stage || '').toLowerCase();
        if (!no.includes(s) && !sup.includes(s) && !mat.includes(s) && !stg.includes(s)) return false;
      }
      return true;
    });
  }, [trackings, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStageVariant = (step) => {
    if (step >= 5) return 'success';
    if (step >= 3) return 'info';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Shipment Tracking' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="PO Lifecycle & Shipment Expediting Tracker"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Active Monitored Shipments"
            value={trackings.length}
            status="primary"
            icon={<Compass className="w-4 h-4" />}
          />
          <KpiCard
            label="In-Transit Deliveries"
            value="1 Vehicle En-Route"
            status="info"
            icon={<Truck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Delivery Adherence"
            value="100% On Schedule"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Expediting Status"
            value="Live GPS Tracking"
            status="neutral"
            icon={<Clock className="w-4 h-4 text-primary" />}
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
                placeholder="Search PO, supplier, material, vehicle..."
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
              title="Print Shipment Schedule"
            >
              Print Schedule
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
                  <th className="px-3 py-2 w-28">PO Number</th>
                  <th className="px-3 py-2">Supplier & Contact</th>
                  <th className="px-3 py-2">Material Scope & Site</th>
                  <th className="px-3 py-2">Live Transit Status</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Target Date</th>
                  <th className="px-3 py-2 text-center w-36">Lifecycle Stage</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading shipment tracking records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No active shipments found.
                    </td>
                  </tr>
                ) : (
                  paged.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {t.po_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{t.project_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={t.supplier_name}>
                            {t.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {t.supplier_phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate block" title={t.material_name}>
                            {t.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {t.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-emerald-700 truncate" title={t.transit_location}>
                            📍 {t.transit_location}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {t.delay_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {t.expected_delivery}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStageVariant(t.stage_step)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {t.current_stage}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Lifecycle 360"
                            onClick={() => setViewingItem(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-1.5 text-primary border-primary/30"
                            title="Expedite Supplier"
                            onClick={() => handleExpedite(t)}
                          >
                            <Phone className="w-3 h-3 mr-0.5" /> Call
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
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{t.po_no} • {t.expected_delivery}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{t.supplier_name}</span>
                </div>
                <Badge
                  variant={getStageVariant(t.stage_step)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  Step {t.stage_step}/5
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 text-xs">
                <span className="text-[10px] font-bold text-text-muted block uppercase">Current Location</span>
                <span className="text-[11px] text-emerald-700 font-medium">{t.transit_location}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(t)}>
                  <Eye className="w-3 h-3 mr-1" /> View Pipeline
                </Button>
                <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleExpedite(t)}>
                  <Phone className="w-3 h-3 mr-1" /> Expedite
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

      {/* View Shipment Lifecycle 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.po_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Visual Pipeline */}
              <div className="bg-surface-muted/30 p-3.5 rounded-lg border border-border space-y-2">
                <span className="font-bold text-text-primary block text-[11px]">Procurement Milestone Pipeline:</span>
                <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px]">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded font-bold">1. PO Issued</div>
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded font-bold">2. Dispatched</div>
                  <div className={`p-1.5 rounded font-bold ${viewingItem.stage_step >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-surface text-text-muted border border-border'}`}>3. In Transit</div>
                  <div className={`p-1.5 rounded font-bold ${viewingItem.stage_step >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-surface text-text-muted border border-border'}`}>4. GRN Inward</div>
                  <div className={`p-1.5 rounded font-bold ${viewingItem.stage_step >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-surface text-text-muted border border-border'}`}>5. QC Passed</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Supplier</span> <span className="font-semibold text-text-primary">{viewingItem.supplier_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Driver / Dispatch Contact</span> <span className="font-mono font-bold text-primary">{viewingItem.supplier_phone}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Site Delivery</span> <span className="font-mono font-bold text-text-primary">{viewingItem.expected_delivery}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule Health</span> <span className="font-semibold text-emerald-600">{viewingItem.delay_status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Live GPS Checkpoint</span> <span className="text-text-primary font-medium">{viewingItem.transit_location}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Expediting Log Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="primary" size="sm" onClick={() => handleExpedite(viewingItem)}>
                <Phone className="w-3.5 h-3.5 mr-1" /> Call Dispatch Hotline
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
