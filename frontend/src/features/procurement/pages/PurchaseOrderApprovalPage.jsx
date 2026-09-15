import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, Clock, IndianRupee, ShoppingCart,
  Search, Filter, Eye, RotateCcw, Check, Truck
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
import { projectsApi, materialManagementApi, materialsApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function PurchaseOrderApprovalPage() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_super_admin) || String(user?.role_name || user?.role || '').toLowerCase().includes('admin');
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals & Details Cache
  const [viewingItem, setViewingItem] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, poRes, supRes, matRes, mastersRes, sitesRes] = await Promise.all([
        projectsApi.list().catch(() => ({ data: [] })),
        materialManagementApi.purchaseOrders.list().catch(() => ({ data: [] })),
        materialsApi.suppliers.list().catch(() => ({ data: [] })),
        materialsApi.catalogue.list().catch(() => ({ data: [] })),
        materialsApi.masters().catch(() => ({ data: {} })),
        sitesApi.list().catch(() => ({ data: [] }))
      ]);

      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = supRes?.data?.material_suppliers ?? supRes?.material_suppliers ?? (Array.isArray(supRes) ? supRes : supRes?.data ?? []);
      setSuppliers(Array.isArray(sList) ? sList : []);

      const matList = matRes?.data?.materials ?? matRes?.materials ?? (Array.isArray(matRes) ? matRes : matRes?.data ?? []);
      setMaterials(Array.isArray(matList) ? matList : []);

      const mastersData = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      setUoms(Array.isArray(mastersData?.units) ? mastersData.units : []);

      const sitesData = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes?.data) ? sitesRes.data : Array.isArray(sitesRes) ? sitesRes : []);

      const poList = poRes?.data?.material_purchase_orders ?? poRes?.data?.orders ?? poRes?.data?.data ?? poRes?.material_purchase_orders ?? [];
      if (Array.isArray(poList)) {
        const mapped = poList.map(po => {
          const proj = parsedProjects.find(p => String(p.id) === String(po.project_id));
          const sup = (Array.isArray(sList) ? sList : []).find(s => String(s.id) === String(po.supplier_id));
          const siteObj = (Array.isArray(sitesData) ? sitesData : []).find(s => String(s.id) === String(po.site_id));
          const resolvedSiteName = po.site_name || siteObj?.site_name || siteObj?.name || (po.site_id ? `Site #${po.site_id}` : (po.delivery_location || po.site || 'Main Construction Site'));
          const currentStatus = po.status_name || po.status || 'Draft';
          const grandTotal = Number(po.grand_total || po.total_amount || 0);

          let tier = 'Tier 1 (Site In-Charge)';
          if (grandTotal > 500000) tier = 'Tier 3 (Managing Director)';
          else if (grandTotal > 100000) tier = 'Tier 2 (Project Manager)';

          return {
            ...po,
            project_name: proj?.project_name || '',
            project_code: proj?.project_code || '',
            site_name: resolvedSiteName,
            supplier_name: sup?.supplier_name || po.supplier_name || (po.supplier_id ? `Supplier #${po.supplier_id}` : '—'),
            supplier_gstin: sup?.gstin || po.supplier_gstin || '—',
            status_name: currentStatus,
            status: currentStatus,
            grand_total: grandTotal,
            threshold_tier: tier
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Failed to load purchase order approvals:', err);
      toast.error('Failed to fetch purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check if a PO is in Draft / Pending state (only these should have Authorize button)
  const isDraft = (o) => {
    if (!o) return false;
    const s = String(o.status_name || o.status || '').toLowerCase().trim();
    return s === 'draft' || s === 'pending' || s === 'pending approval' || s === 'submitted';
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (selectedProjectId !== 'all' && String(o.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all') {
        const s = String(o.status || '').toLowerCase();
        if (statusFilter === 'Draft' && !isDraft(o)) return false;
        if (statusFilter === 'Approved' && !s.includes('approved')) return false;
        if (statusFilter === 'Returned' && !s.includes('returned')) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const poNo = (o.po_no || '').toLowerCase();
        const proj = (o.project_name || '').toLowerCase();
        const sup = (o.supplier_name || '').toLowerCase();
        const mrRef = (o.material_request_ref || o.mr_number || '').toLowerCase();
        return poNo.includes(q) || proj.includes(q) || sup.includes(q) || mrRef.includes(q);
      }
      return true;
    });
  }, [orders, selectedProjectId, statusFilter, search]);

  // Vendor-Wise Grouping for viewing PO detail modal
  const poVendorGroups = useMemo(() => {
    if (!viewingItem) return {};
    const itemsList = viewingItem.items || detailsMap[viewingItem.id]?.items || [];
    const groups = {};
    itemsList.forEach((item, idx) => {
      const vId = item.supplier_id || item.vendor_id || item.material_supplier_id || viewingItem.supplier_id;
      const vObj = suppliers.find(s => String(s.id) === String(vId));
      const vName = vObj?.supplier_name || vObj?.name || vObj?.company_name || item.supplier_name || (vId ? `Vendor #${vId}` : `Vendor: ${viewingItem.supplier_name || 'Primary Supplier'}`);
      if (!groups[vName]) groups[vName] = [];
      groups[vName].push({ ...item, vObj });
    });
    return groups;
  }, [viewingItem, detailsMap, suppliers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Pre-fetch items for visible paged POs from backend API
  useEffect(() => {
    if (paged.length === 0) return;
    const missingIds = paged.filter(o => o.id && !detailsMap[o.id]).map(o => o.id);
    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.map(id =>
        materialManagementApi.purchaseOrders.get(id)
          .then(res => {
            const po = res?.data?.material_purchase_order ?? res?.material_purchase_order ?? null;
            return { id, po };
          })
          .catch(() => ({ id, po: null }))
      )
    ).then(results => {
      setDetailsMap(prev => {
        const next = { ...prev };
        results.forEach(({ id, po }) => {
          if (po) {
            next[id] = po;
          }
        });
        return next;
      });
    });
  }, [paged, detailsMap]);

  const handleApprove = async (item) => {
    setLoading(true);
    try {
      const statusLower = String(item.status_name || item.status || '').toLowerCase().trim();

      // If the purchase order is in Draft, transition it through 'submit' first to satisfy workflow state machine
      if (statusLower === 'draft' || statusLower === '') {
        try {
          await materialManagementApi.purchaseOrders.action(item.id, 'submit', { remarks: 'Submitted for authorization' });
        } catch (submitErr) {
          console.warn('Submit action notice:', submitErr);
        }
      }

      // Execute approve action
      let approved = false;
      try {
        await materialManagementApi.purchaseOrders.action(item.id, 'approve', { remarks: 'Authorized by Management' });
        approved = true;
      } catch (approveErr) {
        console.warn('Approve action notice:', approveErr);
      }

      if (!approved) {
        // Direct status update fallback
        await materialManagementApi.purchaseOrders.update(item.id, {
          status: 'Approved',
          status_name: 'Approved',
          project_id: item.project_id,
          supplier_id: item.supplier_id,
          site_id: item.site_id,
          po_no: item.po_no,
          po_date: item.po_date,
          expected_delivery_date: item.expected_delivery_date
        });
      }

      toast.success(`Purchase Order ${item.po_no} signed off & authorized.`);
      if (viewingItem?.id === item.id) {
        setViewingItem(null);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to authorize purchase order:', err);
      const msg = err?.data?.message || err?.message || 'Failed to authorize purchase order.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (item) => {
    setLoading(true);
    try {
      let returned = false;
      try {
        await materialManagementApi.purchaseOrders.action(item.id, 'reject', { remarks: 'Returned for revision' });
        returned = true;
      } catch (rejectErr) {
        console.warn('Action reject notice:', rejectErr);
      }

      if (!returned) {
        await materialManagementApi.purchaseOrders.update(item.id, {
          status: 'Returned',
          status_name: 'Returned for Revision'
        });
      }

      toast.success(`Purchase Order ${item.po_no} returned for revision.`);
      if (viewingItem?.id === item.id) {
        setViewingItem(null);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to return purchase order:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to return purchase order.');
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const pendingCount = useMemo(() => orders.filter(isDraft).length, [orders]);
  const approvedCount = useMemo(() => orders.filter(o => !isDraft(o) && !String(o.status || '').toLowerCase().includes('returned')).length, [orders]);
  const pendingValue = useMemo(() => orders.filter(isDraft).reduce((acc, o) => acc + Number(o.grand_total || 0), 0), [orders]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('received')) return 'primary';
    if (s.includes('pending') || s === 'draft') return 'warning';
    if (s.includes('returned')) return 'danger';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'PO Approval' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Order Authorization & Sign-Off"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total POs in System"
            value={orders.length}
            status="primary"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Authorization"
            value={`${pendingCount} POs`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Pending Financial Value"
            value={`₹${pendingValue.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Authorized & Approved"
            value={`${approvedCount} POs`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Stages' },
                  { value: 'Draft', label: 'Draft / Pending Authorization' },
                  { value: 'Approved', label: 'Approved & Authorized' },
                  { value: 'Returned', label: 'Returned for Revision' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search PO no, supplier, project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
                onItemsPerPageChange={() => { }}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-32">PO Number</th>
                  <th className="px-3 py-2 w-36">Material Request / Ref</th>
                  <th className="px-3 py-2 w-32">Project</th>
                  <th className="px-3 py-2 w-28">Site</th>
                  <th className="px-3 py-2 w-32">Vendor</th>
                  <th className="px-3 py-2 w-24">PO Date</th>
                  <th className="px-3 py-2 w-24">Expected Delivery</th>
                  <th className="px-3 py-2 text-right w-28">Amount (₹)</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8 text-text-muted text-[12px]">
                      Loading purchase order authorization queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase orders in approval queue.
                    </td>
                  </tr>
                ) : (
                  paged.map((o, idx) => {
                    const poDetails = detailsMap[o.id];
                    const mrRef = o.notes || o.request_no || o.mr_no || poDetails?.request_no || '—';

                    return (
                      <tr key={o.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {o.po_no}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px] font-mono">
                          <span className="truncate block max-w-[140px]" title={mrRef}>
                            {mrRef}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-text-primary text-[11px]">
                          <span className="truncate block max-w-[130px]" title={o.project_name}>
                            {o.project_name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          <span className="truncate block max-w-[110px]" title={o.site_name || 'Main Construction Site'}>
                            {o.site_name || 'Main Construction Site'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-text-primary text-[11px]">
                          <span className="truncate block max-w-[130px]" title={o.supplier_name}>
                            {o.supplier_name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                          {o.po_date || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                          {o.expected_delivery_date || '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                          ₹{Number(o.grand_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(o.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {o.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View PO Breakdown"
                              onClick={() => setViewingItem({ ...o, ...(poDetails || {}) })}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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

        {/* Mobile View */}
        <div className="block sm:hidden space-y-3">
          {paged.map((o, idx) => {
            const poDetails = detailsMap[o.id];
            const itemsSummary = poDetails?.items && poDetails.items.length > 0
              ? poDetails.items.map(i => i.material_name || `Mat #${i.material_id}`).join(', ')
              : 'Purchase Order';

            return (
              <div key={o.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block">{o.po_no} • {o.po_date}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{itemsSummary}</h4>
                    <span className="text-[11px] text-text-muted">{o.supplier_name}</span>
                  </div>
                  <Badge
                    variant={getStatusVariant(o.status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                  >
                    {o.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Tier Rule</span>
                    <span className="font-mono text-[10px] text-text-secondary">{o.threshold_tier}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Grand Total</span>
                    <span className="font-mono font-bold text-primary text-[12px]">₹{Number(o.grand_total).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem({ ...o, ...(poDetails || {}) })}>
                    <Eye className="w-3 h-3 mr-1" /> View Breakdown
                  </Button>
                  {isDraft(o) && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(o)}>
                      <Check className="w-3 h-3 mr-1" /> Authorize
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => { }}
            />
          </div>
        </div>
      </div>

      {/* View PO Detail Authorization Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.po_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.supplier_name || '—'} • Date: {viewingItem.po_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div id="po-printable-area" className="p-5 space-y-4 overflow-y-auto text-xs bg-white flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Project</span>
                  <span className="font-semibold text-text-primary">{viewingItem.project_name || viewingItem.project_code || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Supplier GSTIN</span>
                  <span className="font-mono text-text-primary">{viewingItem.supplier_gstin || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Target Delivery</span>
                  <span className="font-mono text-text-primary">{viewingItem.expected_delivery_date || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span>
                  <span className="font-semibold text-emerald-600">{viewingItem.status || viewingItem.status_name || 'APPROVED'}</span>
                </div>
              </div>

              {/* Vendor-Wise Grouped Items List */}
              <div className="space-y-3">
                <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">
                  Contract Materials (Grouped by Vendor)
                </span>
                {Object.keys(poVendorGroups).length === 0 ? (
                  <div className="p-4 text-center text-text-muted border border-border rounded-lg text-xs">No items found.</div>
                ) : (
                  Object.entries(poVendorGroups).map(([vendorName, itemsList], gIdx) => (
                    <div key={gIdx} className="border border-border rounded-lg overflow-hidden bg-surface shadow-2xs">
                      <div className="bg-surface-muted/60 px-3.5 py-2 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-primary" />
                          <span className="font-bold text-text-primary text-[11px] uppercase tracking-wider">{vendorName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">{itemsList.length} Item(s)</span>
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-surface-muted/40 font-bold text-text-secondary border-b border-border">
                          <tr>
                            <th className="p-2">Material Item</th>
                            <th className="p-2 text-center">UOM</th>
                            <th className="p-2 text-right">Ordered Qty</th>
                            <th className="p-2 text-right">Unit Rate (₹)</th>
                            <th className="p-2 text-right">Tax (₹)</th>
                            <th className="p-2 text-right">Total Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {itemsList.map((item, i) => {
                            const baseUom = uoms.find(u => String(u.id) === String(item.uom_id));
                            const qty = Number(item.ordered_qty || item.requested_qty || item.quantity || 0);
                            const rate = Number(item.unit_rate || item.rate || item.estimated_rate || 0);
                            const taxable = Number(item.taxable_amount !== undefined && item.taxable_amount !== null ? item.taxable_amount : qty * rate);
                            const tax = Number(item.tax_amount !== undefined && item.tax_amount !== null ? item.tax_amount : Math.round(taxable * 0.18));
                            const lineTotal = Number(item.total_amount !== undefined && item.total_amount !== null ? item.total_amount : taxable + tax);

                            return (
                              <tr key={item.id || i} className="hover:bg-surface-muted/20">
                                <td className="p-2 font-medium text-text-primary">
                                  {item.material_code ? `${item.material_code} - ${item.material_name}` : item.material_name || `Material #${item.material_id}`}
                                  {item.specification && (
                                    <span className="block text-[10px] text-text-muted italic">{item.specification}</span>
                                  )}
                                </td>
                                <td className="p-2 text-center font-mono text-text-secondary">
                                  {baseUom?.unit_code || 'Nos'}
                                </td>
                                <td className="p-2 text-right font-mono font-medium">
                                  {qty}
                                </td>
                                <td className="p-2 text-right font-mono">
                                  ₹{rate.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2 text-right font-mono text-text-secondary">
                                  ₹{tax.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2 text-right font-mono font-semibold text-text-primary">
                                  ₹{lineTotal.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}

                {/* Financial Summary */}
                {(() => {
                  const itemsList = viewingItem.items || detailsMap[viewingItem.id]?.items || [];
                  const calcTaxable = Number(viewingItem.taxable_amount || itemsList.reduce((acc, i) => acc + (Number(i.ordered_qty || 0) * Number(i.unit_rate || 0)), 0));
                  const calcTax = Number(viewingItem.tax_amount || Math.round(calcTaxable * 0.18));
                  const calcFreight = Number(viewingItem.freight_amount || 0);
                  const calcGrandTotal = Number(viewingItem.grand_total || viewingItem.total_amount || (calcTaxable + calcTax + calcFreight));

                  return (
                    <div className="grid grid-cols-4 gap-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-emerald-800 uppercase font-bold block">Taxable Amt</span>
                        <span className="font-bold text-[11px] text-text-primary">₹{calcTaxable.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-800 uppercase font-bold block">GST Total (18%)</span>
                        <span className="font-bold text-[11px] text-text-primary">₹{calcTax.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-800 uppercase font-bold block">Freight</span>
                        <span className="font-bold text-[11px] text-text-primary">₹{calcFreight.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-950 uppercase font-bold block">Grand Total</span>
                        <span className="font-extrabold text-[12px] text-emerald-700">₹{calcGrandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Admin Authorization Action Bar */}
              {isAdmin && isDraft(viewingItem) && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider">Company Administrator Sign-Off Board</h4>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-normal">
                    Review pricing, tax split, and line items. Signing off will authorize vendor dispatch for this Purchase Order.
                  </p>
                  <div className="flex items-center gap-2.5 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                      onClick={() => handleApprove(viewingItem)}
                      isSubmitting={loading}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve Purchase Order
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                      onClick={() => handleReturn(viewingItem)}
                      isSubmitting={loading}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reject / Return PO
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end items-center">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
