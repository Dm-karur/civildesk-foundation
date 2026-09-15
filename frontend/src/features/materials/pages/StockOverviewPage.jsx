import { useState, useEffect, useMemo } from 'react';
import {
  Boxes, CheckCircle2, AlertTriangle, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Plus, ArrowRight, Printer,
  ShieldCheck, AlertCircle, Sparkles, TrendingDown, ArrowUpRight
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
import { materialManagementApi, materialsApi, projectsApi, sitesApi } from '../../../api/apiservice';

export function StockOverviewPage() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects and Masters
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialsApi.catalogue.list().catch(() => ({ data: [] }))
    ]).then(([resProj, resSites, resMasters, resCat]) => {
      const pList = resProj?.data?.projects ?? resProj?.projects ?? [];
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = resSites?.data?.sites ?? resSites?.sites ?? (Array.isArray(resSites) ? resSites : []);
      setSites(Array.isArray(sList) ? sList : []);

      const uList = resMasters?.data?.masters?.units ?? resMasters?.masters?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const mList = resCat?.data?.materials ?? resCat?.materials ?? (Array.isArray(resCat) ? resCat : []);
      setMaterials(Array.isArray(mList) ? mList : []);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load initial data');
    }).finally(() => setLoading(false));
  }, []);

  // Load Stock Data when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    
    const fetchStockPromise = selectedProjectId === 'all'
      ? Promise.all(projects.map(p => materialManagementApi.stock({ project_id: p.id }).catch(() => ({ data: { material_stock: [] } }))))
          .then(responses => {
            const allStock = [];
            responses.forEach(res => {
              const list = res?.data?.material_stock ?? res?.data?.stock ?? res?.data?.data ?? [];
              if (Array.isArray(list)) {
                allStock.push(...list);
              }
            });
            return { data: { material_stock: allStock } };
          })
      : materialManagementApi.stock({ project_id: selectedProjectId });

    fetchStockPromise
      .then(res => {
        const list = res?.data?.material_stock ?? res?.data?.stock ?? res?.data?.data ?? [];
        if (Array.isArray(list)) {
          const mapped = list.map(item => {
            const mat = materials.find(m => String(m.id) === String(item.material_id));
            const uom = uoms.find(u => String(u.id) === String(item.base_uom_id));
            const site = sites.find(s => String(s.id) === String(item.site_id));
            const proj = projects.find(p => String(p.id) === String(item.project_id));
            
            const available = Number(item.available_qty || 0);
            const minQty = Number(item.minimum_stock_qty || 0);
            const reorderQty = Number(item.reorder_qty || 0);

            let health = 'In Stock';
            if (available <= minQty) {
              health = 'Low Stock';
            } else if (available <= reorderQty) {
              health = 'Reorder Required';
            }

            return {
              ...item,
              category_name: mat?.category_name || 'Uncategorized',
              uom_name: uom?.unit_name || uom?.unit_code || '',
              site_name: site?.site_name || '',
              project_name: proj?.project_name || '',
              status: health,
              stock_value: Math.round(available * Number(mat?.standard_rate || 0))
            };
          });
          setStock(mapped);
        } else {
          setStock([]);
        }
      })
      .catch(() => {
        toast.error('Failed to load stock data');
        setStock([]);
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId, materials, uoms, sites, projects]);

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const categoriesList = useMemo(() => {
    const set = new Set();
    stock.forEach(s => { if (s.category_name) set.add(s.category_name); });
    return Array.from(set);
  }, [stock]);

  const filtered = useMemo(() => {
    return stock.filter(s => {
      if (selectedProjectId !== 'all' && String(s.project_id) !== String(selectedProjectId)) return false;
      if (selectedSiteId !== 'all' && String(s.site_id) !== String(selectedSiteId)) return false;
      if (categoryFilter !== 'all' && s.category_name !== categoryFilter) return false;
      if (healthFilter !== 'all' && s.status !== healthFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (s.material_code || '').toLowerCase();
        const name = (s.material_name || '').toLowerCase();
        const cat = (s.category_name || '').toLowerCase();
        const site = (s.site_name || '').toLowerCase();
        const proj = (s.project_name || '').toLowerCase();
        const store = (s.primary_store || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !site.includes(q) && !proj.includes(q) && !store.includes(q)) return false;
      }
      return true;
    });
  }, [stock, selectedProjectId, selectedSiteId, categoryFilter, healthFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalSKUs = stock.length;
  const totalValuation = useMemo(() => stock.reduce((acc, s) => acc + Number(s.stock_value || 0), 0), [stock]);
  const lowStockCount = useMemo(() => stock.filter(s => s.status === 'Low Stock' || s.status === 'Reorder Required').length, [stock]);
  const healthyCount = useMemo(() => stock.filter(s => s.status === 'In Stock').length, [stock]);

  const getStatusVariant = (status) => {
    if (status === 'In Stock') return 'success';
    if (status === 'Reorder Required') return 'warning';
    if (status === 'Low Stock') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/stock' },
    { label: 'Stock Overview' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Central Yard & Warehouse Stock Overview"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Stock SKUs"
            value={totalSKUs}
            status="primary"
            icon={<Boxes className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Stock Valuation"
            value={`₹${totalValuation.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Healthy Stock Items"
            value={`${healthyCount} SKUs`}
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Low Stock / Reorder Alerts"
            value={`${lowStockCount} SKUs`}
            status={lowStockCount > 0 ? 'warning' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: p.project_name }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSiteId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Sites' },
                  ...sites
                    .filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId))
                    .map(s => ({ value: String(s.id), label: s.site_name }))
                ]}
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="text-xs h-8"
              />
            </div>
            
            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categoriesList.map(c => ({ value: c, label: c }))
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Stock Health' },
                  { value: 'In Stock', label: 'In Stock (Healthy)' },
                  { value: 'Low Stock', label: 'Low Stock (Alert)' },
                  { value: 'Reorder Required', label: 'Reorder Required' },
                ]}
                value={healthFilter}
                onChange={setHealthFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search SKU code, material, store..."
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
              title="Print Stock Register"
            >
              Print Register
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
                  <th className="px-3 py-2 w-28">Item Code</th>
                  <th className="px-3 py-2">Material Name & Category</th>
                  <th className="px-3 py-2 text-right w-28">Available Stock</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Min Buffer</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Reorder Qty</th>
                  <th className="px-3 py-2 text-right w-28">Valuation (₹)</th>
                  <th className="px-3 py-2 text-center w-28">Stock Health</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading yard stock levels...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material stock records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {s.material_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={s.material_name}>
                            {s.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {s.site_name ? `${s.site_name}` : s.category_name}
                            {s.project_name ? ` • ${s.project_name}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {s.available_qty} <span className="text-text-muted font-normal text-[10px]">{s.uom_name || s.uom}</span>
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {s.minimum_stock_qty} <span className="font-normal">{s.uom_name || s.uom}</span>
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {s.reorder_qty} <span className="font-normal">{s.uom_name || s.uom}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(s.stock_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(s.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Stock 360"
                            onClick={() => setViewingItem(s)}
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
          {paged.map((s, idx) => (
            <div key={s.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{s.material_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{s.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{s.site_name || s.category_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(s.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {s.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Available On-Hand</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{s.available_qty} {s.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Valuation</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(s.stock_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono truncate">{s.primary_store}</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(s)}>
                  <Eye className="w-3 h-3 mr-1" /> View 360
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

      {/* View Stock 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.material_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_code} • {viewingItem.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Available On-Hand</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.available_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Stock Value</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.stock_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Minimum Safety Stock</span> <span className="font-mono">{viewingItem.minimum_stock_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Reorder Trigger Level</span> <span className="font-mono">{viewingItem.reorder_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Unit Valuation Rate</span> <span className="font-mono">₹{viewingItem.unit_rate} / {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Stock Health</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Primary Storage Location</span> <span className="text-text-primary font-medium">{viewingItem.primary_store}</span></div>
              </div>
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
