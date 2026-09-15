import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine, CheckCircle2, XCircle, Clock, IndianRupee, Truck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight, ShieldCheck,
  Check, AlertCircle, Sparkles, Building, Layers, Printer, MoreVertical,
  RotateCcw, FileText, CheckCheck, PackageCheck, Send
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
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, materialManagementApi, sitesApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function ProcurementGoodsReceiptPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const isAdmin = Boolean(user?.is_super_admin) || String(user?.role_name || user?.role || '').toLowerCase().includes('admin');

  // Master States
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [qualityStatuses, setQualityStatuses] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Pagination
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [inspectingItem, setInspectingItem] = useState(null);
  const [approvingItem, setApprovingItem] = useState(null);
  const [postingItem, setPostingItem] = useState(null);

  // States
  const [saving, setSaving] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // QC Inspection Form State
  const [inspectForm, setInspectForm] = useState({ items: [], remarks: '' });

  // Receipt line item cache
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action Menu Dropdown State
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: check if PO is approved
  const isPoApproved = (po) => {
    if (!po) return false;
    const s = String(po.status_name || po.status || '').toUpperCase().trim();
    return s.includes('APPROV') || s.includes('ACTIVE') || s.includes('ORDER') || s.includes('RECEIV') || s.includes('PARTIAL') || s.includes('COMPLET');
  };

  // Helper: check receipt stage
  const getReceiptStage = (r) => {
    const s = String(r?.status_name || r?.quality_status || r?.status || '').toUpperCase().trim();
    if (s.includes('POSTED') || s.includes('STOCK POSTED')) return 'STOCK_POSTED';
    if (s.includes('APPROV')) return 'APPROVED';
    if (s.includes('INSPECT') || s.includes('QC') || s.includes('PASS') || s.includes('ACCEPT')) return 'QC_CHECKED';
    return 'CREATED';
  };

  // Helper: calculate previously received quantity for a given PO and PO item
  const getPreviouslyReceivedQty = (poId, poItemId, currentReceiptId = null) => {
    if (!poId || !poItemId) return 0;
    let total = 0;
    receipts.forEach(r => {
      if (String(r.purchase_order_id) === String(poId) && String(r.id) !== String(currentReceiptId)) {
        const details = detailsMap[r.id];
        const items = details?.items || r.items || [];
        items.forEach(it => {
          if (String(it.purchase_order_item_id) === String(poItemId)) {
            total += Number(it.received_qty || 0);
          }
        });
      }
    });
    return total;
  };

  // Compute eligible approved POs that have pending balance
  const eligibleApprovedPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (!isPoApproved(po)) return false;
      const poItems = po.items || [];
      if (poItems.length === 0) return true; // If items array not yet loaded, allow selection to fetch details

      // Check if any item has pending balance
      const hasPending = poItems.some(it => {
        const ord = Number(it.ordered_qty || 0);
        const prevRec = getPreviouslyReceivedQty(po.id, it.id);
        const backendRec = Number(it.received_qty || 0);
        const effectiveRec = Math.max(prevRec, backendRec);
        return ord > effectiveRec;
      });
      return hasPending;
    });
  }, [purchaseOrders, receipts, detailsMap]);

  // Load Initial API Data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [projRes, sitesRes, suppRes, catRes, mastersRes, recRes, poRes] = await Promise.all([
        projectsApi.list().catch(() => ({ data: [] })),
        sitesApi.list().catch(() => ({ data: [] })),
        materialsApi.suppliers.list().catch(() => ({ data: [] })),
        materialsApi.catalogue.list().catch(() => ({ data: [] })),
        materialsApi.masters().catch(() => ({ data: {} })),
        materialManagementApi.receipts.list().catch(() => ({ data: [] })),
        materialManagementApi.purchaseOrders.list().catch(() => ({ data: [] }))
      ]);

      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const supList = suppRes?.data?.material_suppliers ?? suppRes?.material_suppliers ?? (Array.isArray(suppRes) ? suppRes : []);
      setSuppliers(Array.isArray(supList) ? supList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const mastersData = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      setUoms(Array.isArray(mastersData?.units) ? mastersData.units : []);
      setQualityStatuses(Array.isArray(mastersData?.quality_statuses) ? mastersData.quality_statuses : []);

      const poList = poRes?.data?.material_purchase_orders ?? poRes?.data?.orders ?? poRes?.data?.data ?? (Array.isArray(poRes) ? poRes : []);
      setPurchaseOrders(Array.isArray(poList) ? poList : []);

      const rList = recRes?.data?.material_receipts ?? recRes?.data?.receipts ?? recRes?.data?.data ?? (Array.isArray(recRes) ? recRes : []);
      if (Array.isArray(rList)) {
        const normalized = rList.map(r => {
          const project = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const site = sList.find(s => String(s.id) === String(r.site_id));
          const supplier = supList.find(s => String(s.id) === String(r.supplier_id));
          const po = poList.find(p => String(p.id) === String(r.purchase_order_id));

          return {
            ...r,
            project_code: project?.project_code || 'PRJ-2026',
            project_name: project?.project_name || 'Civil Construction Project',
            site_name: site?.site_name || 'Site Yard Store',
            supplier_name: supplier?.supplier_name || r.supplier_name || 'Vendor Partner',
            po_no: po?.po_no || r.po_no || (r.purchase_order_id ? `PO-${r.purchase_order_id}` : '—'),
            po_date: po?.po_date || r.po_date || '—',
            status_name: r.status_name || r.status || 'Created',
            quality_status: r.quality_status || r.quality_status_name || 'Pending Inspection'
          };
        });
        setReceipts(normalized);
      }
    } catch (err) {
      console.error('Failed to load goods receipts data:', err);
      toast.error('Failed to load initial procurement receipt data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch missing receipt item details for visible page
  useEffect(() => {
    const missingIds = receipts
      .map(r => r.id)
      .filter(id => id && !detailsMap[id]);

    if (missingIds.length === 0) return;

    setDetailsLoading(true);
    Promise.all(
      missingIds.map(id =>
        materialManagementApi.receipts.get(id)
          .then(res => {
            const receipt = res?.data?.material_receipt ?? res?.material_receipt;
            return { id, receipt };
          })
          .catch(() => ({ id, receipt: null }))
      )
    ).then(results => {
      setDetailsMap(prev => {
        const next = { ...prev };
        results.forEach(({ id, receipt }) => {
          if (receipt) next[id] = receipt;
        });
        return next;
      });
    }).finally(() => setDetailsLoading(false));
  }, [receipts, detailsMap]);

  // Safe filtered list
  const qcStatusOptions = useMemo(() => {
    if (Array.isArray(qualityStatuses) && qualityStatuses.length > 0) {
      const mapped = qualityStatuses
        .map(q => ({
          value: String(q.id),
          label: String(q.quality_status_name || q.status_name || q.name || '').trim()
        }))
        .filter(opt => opt.value && opt.label);

      if (mapped.length > 0) return mapped;
    }
    return [
      { value: '1', label: 'Passed' },
      { value: '2', label: 'Failed' },
      { value: '3', label: 'Partial' }
    ];
  }, [qualityStatuses]);

  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all') {
        const stage = getReceiptStage(r);
        if (statusFilter === 'STOCK_POSTED' && stage !== 'STOCK_POSTED') return false;
        if (statusFilter === 'APPROVED' && stage !== 'APPROVED') return false;
        if (statusFilter === 'QC_CHECKED' && stage !== 'QC_CHECKED') return false;
        if (statusFilter === 'CREATED' && stage !== 'CREATED') return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const no = String(r.receipt_no || '').toLowerCase();
        const po = String(r.po_no || r.po_reference || '').toLowerCase();
        const sup = String(r.supplier_name || '').toLowerCase();
        const ch = String(r.supplier_challan_no || '').toLowerCase();
        const veh = String(r.vehicle_no || '').toLowerCase();
        if (!no.includes(q) && !po.includes(q) && !sup.includes(q) && !ch.includes(q) && !veh.includes(q)) return false;
      }
      return true;
    });
  }, [receipts, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // KPI Metrics Ribbon (Actual Backend Data)
  const totalReceivedValue = useMemo(() => {
    return receipts.reduce((sum, r) => {
      const details = detailsMap[r.id];
      const items = details?.items || r.items || [];
      const val = items.reduce((acc, i) => acc + (Number(i.received_qty || 0) * Number(i.unit_rate || 0)), 0);
      return sum + (val > 0 ? val : Number(r.total_amount || 0));
    }, 0);
  }, [receipts, detailsMap]);

  const qcPassedCount = useMemo(() => {
    return receipts.filter(r => {
      const s = String(r.quality_status || r.status_name || '').toUpperCase();
      return s.includes('PASS') || s.includes('ACCEPT') || s.includes('POSTED');
    }).length;
  }, [receipts]);

  const qcAcceptanceRatio = useMemo(() => {
    if (receipts.length === 0) return '100%';
    const pct = Math.round((qcPassedCount / receipts.length) * 100);
    return `${pct}% Passed`;
  }, [qcPassedCount, receipts]);

  const pendingPoDeliveriesCount = useMemo(() => {
    return eligibleApprovedPurchaseOrders.length;
  }, [eligibleApprovedPurchaseOrders]);

  // Helper formatting & badges
  const getSupplierName = (id) => {
    const s = suppliers.find(sup => String(sup.id) === String(id));
    return s ? s.supplier_name : (id ? `Supplier #${id}` : '—');
  };

  const getStatusBadge = (r) => {
    const stage = getReceiptStage(r);
    switch (stage) {
      case 'STOCK_POSTED':
        return <Badge variant="success" className="text-[9px] font-bold uppercase tracking-wider h-5 px-2">Stock Posted</Badge>;
      case 'APPROVED':
        return <Badge variant="primary" className="text-[9px] font-bold uppercase tracking-wider h-5 px-2">GRN Approved</Badge>;
      case 'QC_CHECKED':
        return <Badge variant="info" className="text-[9px] font-bold uppercase tracking-wider h-5 px-2">QC Checked</Badge>;
      default:
        return <Badge variant="warning" className="text-[9px] font-bold uppercase tracking-wider h-5 px-2">GRN Created</Badge>;
    }
  };

  const getQualityBadge = (r) => {
    const q = String(r?.quality_status || r?.quality_status_name || 'Pending Inspection').toUpperCase();
    if (q.includes('ACCEPT') || q.includes('PASS')) {
      return <Badge variant="success" className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center">Passed</Badge>;
    }
    if (q.includes('REJECT') || q.includes('FAIL')) {
      return <Badge variant="error" className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center">Rejected</Badge>;
    }
    if (q.includes('PARTIAL')) {
      return <Badge variant="warning" className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center">Partial</Badge>;
    }
    return <Badge variant="neutral" className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center">Pending QC</Badge>;
  };

  // --- RECEIVE PO DELIVERY (NEW GRN) ---
  const handleOpenReceiveDelivery = () => {
    navigate('/procurement/goods-receipt/new');
  };

  // --- OPEN QC INSPECTION MODAL ---
  const handleOpenInspect = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.receipts.get(item.id);
      const fullReceipt = res?.data?.material_receipt ?? res?.material_receipt ?? item;
      const recItems = fullReceipt.items || detailsMap[item.id]?.items || [];
      const defaultPassedId = qcStatusOptions.find(o => o.label.toLowerCase().includes('pass'))?.value || qcStatusOptions[0]?.value || '1';

      setInspectingItem(fullReceipt);
      setInspectForm({
        remarks: fullReceipt.qc_remarks || fullReceipt.remarks || '',
        items: recItems.map(i => {
          const mat = materials.find(m => String(m.id) === String(i.material_id));
          const uom = uoms.find(u => String(u.id) === String(i.uom_id));
          const rec = Number(i.received_qty || 0);
          return {
            id: i.id,
            material_name: i.material_name || mat?.material_name || `Material #${i.material_id}`,
            material_code: i.material_code || mat?.material_code || 'MAT',
            uom_name: uom?.unit_code || i.uom_name || 'Nos',
            received_qty: rec,
            accepted_qty: String(i.accepted_qty !== null && i.accepted_qty !== undefined ? i.accepted_qty : rec),
            rejected_qty: String(i.rejected_qty !== null && i.rejected_qty !== undefined ? i.rejected_qty : 0),
            quality_status_id: String(i.quality_status_id || defaultPassedId),
            rejection_reason: i.rejection_reason || ''
          };
        })
      });
    } catch (err) {
      console.error('Failed to load receipt for QC inspection:', err);
      toast.error('Failed to load receipt for QC inspection.');
    } finally {
      setLoading(false);
    }
  };

  // Submit QC Inspection
  const handleInspectSubmit = async (e) => {
    e.preventDefault();

    // Validate quantities: Accepted + Rejected must equal Received
    for (const it of inspectForm.items) {
      const acc = Number(it.accepted_qty || 0);
      const rej = Number(it.rejected_qty || 0);
      const rec = Number(it.received_qty || 0);

      if (Math.abs((acc + rej) - rec) > 0.001) {
        toast.error(`For ${it.material_name}, Accepted Qty (${acc}) + Rejected Qty (${rej}) must equal Received Qty (${rec}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        remarks: inspectForm.remarks,
        items: inspectForm.items.map(it => ({
          id: it.id,
          accepted_qty: Number(it.accepted_qty),
          rejected_qty: Number(it.rejected_qty),
          quality_status_id: Number(it.quality_status_id),
          rejection_reason: it.rejection_reason || null
        }))
      };

      // Call backend inspection endpoint
      await materialManagementApi.receipts.inspect(inspectingItem.id, payload);

      // Transition status to QC Checked
      try {
        await materialManagementApi.receipts.update(inspectingItem.id, {
          status: 'QC Checked',
          status_name: 'QC Checked',
          quality_status: 'Passed'
        });
      } catch (e) {
        console.warn('Status update after QC notice:', e);
      }

      toast.success('Quality Control (QC) inspection recorded successfully.');
      setInspectingItem(null);
      await loadInitialData();
    } catch (err) {
      console.error('QC inspection submission error:', err);
      toast.error(err?.message || 'Failed to submit QC inspection.');
    } finally {
      setSaving(false);
    }
  };

  // --- GRN APPROVAL ---
  const handleOpenApproveGrn = (item) => {
    setApprovingItem(item);
    setApprovalRemarks('Authorized delivery and quality inspection passed.');
  };

  const handleConfirmApproveGrn = async () => {
    if (!approvingItem) return;
    setSaving(true);
    try {
      await materialManagementApi.receipts.action(approvingItem.id, 'approve', { remarks: approvalRemarks });
      toast.success(`Goods Receipt ${approvingItem.receipt_no} approved successfully.`);
      setApprovingItem(null);
      await loadInitialData();
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error(err?.message || err?.data?.message || 'Failed to approve goods receipt. Ensure POST /material-management/receipts/:id/approve is defined in backend.');
    } finally {
      setSaving(false);
    }
  };

  // --- STOCK POSTING ---
  const handleConfirmPostStock = async () => {
    if (!postingItem) return;
    setSaving(true);
    try {
      await materialManagementApi.receipts.post(postingItem.id, {});
      toast.success(`Goods Receipt ${postingItem.receipt_no} posted to Inventory & Stock Ledger.`);
      setPostingItem(null);
      await loadInitialData();
    } catch (err) {
      console.error('Stock posting error:', err);
      toast.error(err?.message || 'Failed to post goods receipt to inventory.');
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE RECEIPT ---
  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    setLoading(true);
    try {
      await materialManagementApi.receipts.remove(deleteItem.id);
      toast.success(`Goods Receipt ${deleteItem.receipt_no} deleted successfully.`);
      setDeleteItem(null);
      await loadInitialData();
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      toast.error(err?.message || 'Failed to delete goods receipt.');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Goods Receipt' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Procurement Goods Receipt & PO Matching"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total PO Deliveries Logged"
            value={receipts.length}
            status="primary"
            icon={<ArrowDownToLine className="w-4 h-4" />}
          />
          <KpiCard
            label="Received Stock Value"
            value={`₹${totalReceivedValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="QC Acceptance Ratio"
            value={qcAcceptanceRatio}
            status="info"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Pending PO Deliveries"
            value={`${pendingPoDeliveriesCount} POs`}
            status="warning"
            icon={<Truck className="w-4 h-4 text-amber-500" />}
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
                  { value: 'all', label: 'All GRN Status' },
                  { value: 'CREATED', label: 'GRN Created' },
                  { value: 'QC_CHECKED', label: 'QC Checked' },
                  { value: 'APPROVED', label: 'GRN Approved' },
                  { value: 'STOCK_POSTED', label: 'Stock Posted' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search GRN, PO no, vendor, truck..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenReceiveDelivery}
              className="text-xs h-8 shadow-xs bg-primary hover:bg-primary-hover"
            >
              Receive PO Delivery
            </Button>
          </div>
        </div>

        {/* Desktop Table View */}
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
                  <th className="px-3 py-2 w-32">GRN Voucher</th>
                  <th className="px-3 py-2">Supplier & Challan</th>
                  <th className="px-3 py-2">Project & Site</th>
                  <th className="px-3 py-2 text-center w-24">Receipt Date</th>
                  <th className="px-3 py-2 text-right w-24">Received Qty</th>
                  <th className="px-3 py-2 text-center w-24">QC Status</th>
                  <th className="px-3 py-2 text-center w-28">GRN Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading goods receipts from server...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No goods receipt notes matching criteria. Click <strong>Receive PO Delivery</strong> to inward materials.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => {
                    const details = detailsMap[r.id];
                    const items = details?.items || r.items || [];
                    const totalQty = items.reduce((sum, i) => sum + Number(i.received_qty || 0), 0);
                    const stage = getReceiptStage(r);
                    const isMenuOpen = openMenuId === r.id;

                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {r.receipt_no}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono block pt-0.5">
                            PO: {r.po_no || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={r.supplier_name}>
                              {r.supplier_name}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              DC: {r.supplier_challan_no || '—'} • Veh: {r.vehicle_no || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-medium text-text-primary text-[11px] block truncate max-w-[150px]" title={r.project_name}>
                            {r.project_name}
                          </span>
                          <span className="text-[10px] text-text-muted block truncate max-w-[130px]" title={r.site_name}>
                            {r.site_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                          {r.receipt_date || '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                          {totalQty > 0 ? `${totalQty} Units` : `${items.length} item(s)`}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {getQualityBadge(r)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {getStatusBadge(r)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View GRN 360"
                              onClick={() => setViewingItem(r)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>

                            {/* Three-dot Context Menu */}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(isMenuOpen ? null : r.id);
                                }}
                                className={`h-6 w-6 p-0 ${isMenuOpen ? 'text-primary bg-surface-muted' : 'text-text-secondary'}`}
                                title="Actions"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>

                              {isMenuOpen && (
                                <div
                                  ref={menuRef}
                                  className="absolute right-0 top-7 z-50 w-44 bg-surface border border-border rounded-sm shadow-xl p-1 text-[11px] animate-in fade-in zoom-in-95 duration-100"
                                >
                                  {stage === 'CREATED' && (
                                    <button
                                      onClick={() => { setOpenMenuId(null); handleOpenInspect(r); }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-primary font-medium"
                                    >
                                      <PackageCheck className="w-3.5 h-3.5 text-primary" />
                                      <span>Perform QC Check</span>
                                    </button>
                                  )}

                                  {stage === 'QC_CHECKED' && isAdmin && (
                                    <button
                                      onClick={() => { setOpenMenuId(null); handleOpenApproveGrn(r); }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 font-medium"
                                    >
                                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Approve GRN</span>
                                    </button>
                                  )}

                                  {(stage === 'APPROVED' || stage === 'QC_CHECKED') && (
                                    <button
                                      onClick={() => { setOpenMenuId(null); setPostingItem(r); }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-blue-50 flex items-center gap-2 text-blue-700 font-medium"
                                    >
                                      <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Post to Stock</span>
                                    </button>
                                  )}

                                  {stage === 'CREATED' && (
                                    <>
                                      <button
                                        onClick={() => { setOpenMenuId(null); navigate(`/procurement/goods-receipt/${r.id}/edit`); }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                                      >
                                        <Edit className="w-3.5 h-3.5 text-text-secondary" />
                                        <span>Edit GRN</span>
                                      </button>
                                      <div className="border-t border-border my-1"></div>
                                      <button
                                        onClick={() => { setOpenMenuId(null); setDeleteItem(r); }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-error/10 flex items-center gap-2 text-error"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete GRN</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
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
          {paged.map((r, idx) => {
            const details = detailsMap[r.id];
            const items = details?.items || r.items || [];
            const totalQty = items.reduce((sum, i) => sum + Number(i.received_qty || 0), 0);
            const stage = getReceiptStage(r);

            return (
              <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block">{r.receipt_no}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.supplier_name}</h4>
                    <span className="text-[11px] text-text-muted">PO: {r.po_no} • {r.receipt_date}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(r)}
                    {getQualityBadge(r)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Project / Site</span>
                    <span className="font-medium text-text-primary text-[11px] truncate block">{r.project_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Inward Qty</span>
                    <span className="font-mono font-bold text-primary text-[12px]">{totalQty} Units</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                  <div>
                    {stage === 'CREATED' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 text-primary" onClick={() => handleOpenInspect(r)}>
                        <PackageCheck className="w-3 h-3 mr-1" /> QC Check
                      </Button>
                    )}
                    {stage === 'QC_CHECKED' && isAdmin && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 text-emerald-700 border-emerald-200" onClick={() => handleOpenApproveGrn(r)}>
                        <CheckCheck className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    )}
                    {(stage === 'APPROVED' || stage === 'QC_CHECKED') && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 text-blue-700 border-blue-200" onClick={() => setPostingItem(r)}>
                        <ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Post Stock
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                    <Eye className="w-3 h-3 mr-1" /> View GRN
                  </Button>
                </div>
              </div>
            );
          })}

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

      {/* --- QC INSPECTION MODAL --- */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Quality Control (QC) Inspection</h3>
                  <span className="text-[11px] font-mono text-text-muted">
                    {inspectingItem.receipt_no} • Supplier: {inspectingItem.supplier_name}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setInspectingItem(null)}>✕</Button>
            </div>

            <form onSubmit={handleInspectSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-lg p-3 text-emerald-900 text-[11px]">
                  <strong>Inspection Guidelines:</strong> Verify material visual quality, physical damage, and compliance with PO specifications.
                  Ensure <em>Accepted Qty + Rejected Qty = Received Qty</em>.
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-surface-muted/60 font-semibold text-text-secondary border-b border-border">
                      <tr>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-center w-20">Received</th>
                        <th className="p-2.5 text-center w-24">Accepted *</th>
                        <th className="p-2.5 text-center w-24">Rejected</th>
                        <th className="p-2.5 text-center w-36">QC Status</th>
                        <th className="p-2.5 min-w-[140px]">Rejection Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {inspectForm.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="p-2.5">
                            <span className="font-semibold text-text-primary block">{it.material_name}</span>
                            <span className="text-[10px] text-text-muted font-mono">{it.uom_name}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-text-primary">
                            {it.received_qty}
                          </td>
                          <td className="p-2.5 text-center">
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              max={it.received_qty}
                              value={it.accepted_qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                const rec = Number(it.received_qty || 0);
                                const acc = Number(val || 0);
                                const rej = Math.max(0, rec - acc);

                                let targetStatus = it.quality_status_id;
                                if (acc === rec) {
                                  targetStatus = qcStatusOptions.find(o => o.label.toLowerCase().includes('pass'))?.value || targetStatus;
                                } else if (acc === 0 && rej > 0) {
                                  targetStatus = qcStatusOptions.find(o => o.label.toLowerCase().includes('fail'))?.value || targetStatus;
                                } else if (acc > 0 && rej > 0) {
                                  targetStatus = qcStatusOptions.find(o => o.label.toLowerCase().includes('part'))?.value || targetStatus;
                                }

                                const nextItems = [...inspectForm.items];
                                nextItems[idx] = {
                                  ...it,
                                  accepted_qty: val,
                                  rejected_qty: String(rej),
                                  quality_status_id: targetStatus
                                };
                                setInspectForm(prev => ({ ...prev, items: nextItems }));
                              }}
                              className="text-center h-8 text-xs font-mono font-bold text-emerald-600"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              max={it.received_qty}
                              value={it.rejected_qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                const rec = Number(it.received_qty || 0);
                                const rej = Number(val || 0);
                                const acc = Math.max(0, rec - rej);

                                let targetStatus = it.quality_status_id;
                                if (rej === 0 && acc === rec) {
                                  targetStatus = qcStatusOptions.find(o => o.label.toLowerCase().includes('pass'))?.value || targetStatus;
                                } else if (rej === rec) {
                                  targetStatus = qcStatusOptions.find(o => o.label.toLowerCase().includes('fail'))?.value || targetStatus;
                                } else if (acc > 0 && rej > 0) {
                                  targetStatus = qcStatusOptions.find(o => o.label.toLowerCase().includes('part'))?.value || targetStatus;
                                }

                                const nextItems = [...inspectForm.items];
                                nextItems[idx] = {
                                  ...it,
                                  rejected_qty: val,
                                  accepted_qty: String(acc),
                                  quality_status_id: targetStatus
                                };
                                setInspectForm(prev => ({ ...prev, items: nextItems }));
                              }}
                              className="text-center h-8 text-xs font-mono font-bold text-red-600"
                            />
                          </td>
                          <td className="p-2.5 text-center w-36">
                            <Select
                              options={qcStatusOptions}
                              value={it.quality_status_id}
                              onChange={(v) => {
                                const rec = Number(it.received_qty || 0);
                                const selectedOpt = qcStatusOptions.find(o => o.value === v);
                                const lbl = (selectedOpt?.label || '').toLowerCase();
                                let newAcc = it.accepted_qty;
                                let newRej = it.rejected_qty;
                                if (lbl.includes('pass')) {
                                  newAcc = String(rec);
                                  newRej = '0';
                                } else if (lbl.includes('fail') || lbl.includes('reject')) {
                                  newAcc = '0';
                                  newRej = String(rec);
                                }
                                const nextItems = [...inspectForm.items];
                                nextItems[idx] = {
                                  ...it,
                                  quality_status_id: v,
                                  accepted_qty: newAcc,
                                  rejected_qty: newRej
                                };
                                setInspectForm(prev => ({ ...prev, items: nextItems }));
                              }}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <Input
                              value={it.rejection_reason}
                              onChange={(e) => {
                                const nextItems = [...inspectForm.items];
                                nextItems[idx] = { ...it, rejection_reason: e.target.value };
                                setInspectForm(prev => ({ ...prev, items: nextItems }));
                              }}
                              placeholder="e.g. Moisture damage"
                              className="h-8 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <FormField label="Quality Engineer Remarks">
                  <Textarea
                    rows={2}
                    value={inspectForm.remarks}
                    onChange={(e) => setInspectForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Batch certificate verification, test cube observations..."
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setInspectingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isSubmitting={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-3.5 h-3.5 mr-1" /> Submit QC Inspection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- GRN APPROVAL MODAL --- */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Approve Goods Receipt (GRN)
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setApprovingItem(null)}>✕</Button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              You are authorizing Goods Receipt <span className="font-mono font-bold text-primary">{approvingItem.receipt_no}</span> from <strong>{approvingItem.supplier_name}</strong>.
              Approving confirms the QC inspection results and enables inventory store posting.
            </p>

            <FormField label="Approval Review Remarks">
              <Textarea
                rows={2}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Authorization comments..."
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setApprovingItem(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmApproveGrn}
                isSubmitting={saving}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- STOCK POSTING CONFIRMATION --- */}
      {postingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-blue-600" />
                Post GRN to Stock Ledger
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setPostingItem(null)}>✕</Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
              <strong>Inventory Ledger Update:</strong>
              <p>Posting <span className="font-mono font-bold">{postingItem.receipt_no}</span> will create a binding Material Transaction in the Stock Ledger for <strong>{postingItem.project_name}</strong>.</p>
            </div>

            <p className="text-xs text-text-secondary">
              Once posted, the stock quantities are immediately available for site consumption, issues, and transfers.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPostingItem(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPostStock}
                isSubmitting={saving}
              >
                <ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Confirm Stock Posting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW GRN 360 DOCKET MODAL --- */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.receipt_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">
                    PO: {viewingItem.po_no} • {viewingItem.receipt_date}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Project</span>
                  <span className="font-semibold text-text-primary truncate block">{viewingItem.project_name}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Site Location</span>
                  <span className="font-medium text-text-secondary truncate block">{viewingItem.site_name}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Vendor Supplier</span>
                  <span className="font-semibold text-text-primary truncate block">{viewingItem.supplier_name}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Vehicle</span>
                  <span className="font-mono text-text-primary">{viewingItem.vehicle_no || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Supplier Challan</span>
                  <span className="font-mono">{viewingItem.supplier_challan_no || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Invoice Number</span>
                  <span className="font-mono">{viewingItem.invoice_no || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">QC Status</span>
                  {getQualityBadge(viewingItem)}
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">GRN Status</span>
                  {getStatusBadge(viewingItem)}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">
                  Received Materials Reconciliation
                </span>
                <div className="border border-border rounded-lg overflow-hidden bg-surface">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-surface-muted/60 font-semibold text-text-secondary border-b border-border">
                      <tr>
                        <th className="p-2">Material Description</th>
                        <th className="p-2 text-center">UOM</th>
                        <th className="p-2 text-right">Received Qty</th>
                        <th className="p-2 text-right">Accepted Qty</th>
                        <th className="p-2 text-right">Rejected Qty</th>
                        <th className="p-2 text-right">Unit Rate</th>
                        <th className="p-2 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(viewingItem.items || detailsMap[viewingItem.id]?.items || []).map((it, i) => {
                        const mat = materials.find(m => String(m.id) === String(it.material_id));
                        const uom = uoms.find(u => String(u.id) === String(it.uom_id));
                        const rec = Number(it.received_qty || 0);
                        const rate = Number(it.unit_rate || 0);
                        const tot = rec * rate;

                        return (
                          <tr key={i} className="hover:bg-surface-muted/10">
                            <td className="p-2">
                              <span className="font-medium text-text-primary block">{it.material_name || mat?.material_name || `Material #${it.material_id}`}</span>
                              {it.specification && <span className="text-[10px] text-text-muted italic">Variant: {it.specification}</span>}
                            </td>
                            <td className="p-2 text-center font-mono text-text-secondary">{uom?.unit_code || it.uom_name || 'Nos'}</td>
                            <td className="p-2 text-right font-mono font-bold text-text-primary">{rec}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-600">{it.accepted_qty ?? rec}</td>
                            <td className="p-2 text-right font-mono text-red-600">{it.rejected_qty ?? 0}</td>
                            <td className="p-2 text-right font-mono text-text-secondary">₹{rate.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-mono font-bold text-text-primary">₹{tot.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Notes */}
              {viewingItem.remarks && (
                <div className="border border-border rounded-lg p-3 space-y-1 bg-surface-muted/20">
                  <span className="font-bold text-text-primary block text-[11px]">Delivery & Inspection Notes:</span>
                  <p className="text-text-secondary text-[11px] leading-relaxed italic">"{viewingItem.remarks}"</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print GRN Docket
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Goods Receipt"
        message={`Are you sure you want to delete Goods Receipt "${deleteItem?.receipt_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
