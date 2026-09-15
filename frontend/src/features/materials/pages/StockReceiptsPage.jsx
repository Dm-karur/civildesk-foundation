import { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine, CheckCircle2, XCircle, Clock, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight, Truck,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers, Printer
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
import { projectsApi, materialManagementApi, sitesApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  purchase_order_id: '',
  receipt_no: '',
  receipt_date: '',
  supplier_id: '',
  supplier_challan_no: '',
  invoice_no: '',
  vehicle_no: '',
  notes: '',
  items: [{ material_id: '', uom_id: '', received_qty: '100', unit_rate: '0', purchase_order_item_id: null }]
};

export function StockReceiptsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [inspectingItem, setInspectingItem] = useState(null);
  
  const [inspectForm, setInspectForm] = useState({
    items: []
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [sites, setSites] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [qualityStatuses, setQualityStatuses] = useState([]);

  // Cache for fully fetched receipts (with items)
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Safe Filtered List
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all') {
        const s = String(r.quality_status || r.status_name || '').toUpperCase();
        if (statusFilter === 'POSTED' && !s.includes('POSTED')) return false;
        if (statusFilter === 'DRAFT' && !s.includes('DRAFT') && !s.includes('STORED')) return false;
        if (statusFilter === 'ACCEPTED' && !s.includes('ACCEPT') && !s.includes('PASS')) return false;
        if (statusFilter === 'REJECTED' && !s.includes('REJECT') && !s.includes('FAIL')) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const no = String(r.receipt_no || '').toLowerCase();
        const sup = String(r.supplier_name || '').toLowerCase();
        const ch = String(r.supplier_challan_no || '').toLowerCase();
        const veh = String(r.vehicle_no || '').toLowerCase();
        if (!no.includes(q) && !sup.includes(q) && !ch.includes(q) && !veh.includes(q)) return false;
      }
      return true;
    });
  }, [receipts, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Load Initial API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.suppliers.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.receipts.list().catch(() => ({ data: [] })),
      materialManagementApi.purchaseOrders.list().catch(() => ({ data: [] }))
    ]).then(([projRes, sitesRes, suppRes, catRes, mastersRes, recRes, poRes]) => {
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
      const uList = mastersData?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const qList = mastersData?.quality_statuses ?? [];
      setQualityStatuses(Array.isArray(qList) ? qList : []);

      const poList = poRes?.data?.material_purchase_orders ?? poRes?.data?.orders ?? poRes?.data?.data ?? poRes?.material_purchase_orders ?? [];
      setPurchaseOrders(Array.isArray(poList) ? poList : []);

      const rList = recRes?.data?.material_receipts ?? recRes?.data?.receipts ?? recRes?.data?.data ?? [];
      if (Array.isArray(rList)) {
        const normalized = rList.map((r, idx) => {
          const project = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const site = sList.find(s => String(s.id) === String(r.site_id));
          const supplier = supList.find(s => String(s.id) === String(r.supplier_id));

          return {
            ...r,
            project_code: project?.project_code || 'PRJ-2026-001',
            project_name: project?.project_name || 'Civil Project',
            site_name: site?.site_name || 'Yard Storage',
            supplier_name: supplier?.supplier_name || 'Supplier Partner',
            status_name: r.status_name || r.status || 'Received & Stored',
            quality_status: r.status_name || 'Pending Inspection'
          };
        });
        setReceipts(normalized);
      }
    }).catch((e) => {
      console.error(e);
    }).finally(() => setLoading(false));
  }, []);

  // Load Receipt items details asynchronously for visible page
  useEffect(() => {
    const missingIds = paged
      .map(r => r.id)
      .filter(id => !detailsMap[id]);

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
          if (receipt) {
            next[id] = receipt;
          }
        });
        return next;
      });
    }).finally(() => {
      setDetailsLoading(false);
    });
  }, [paged, detailsMap]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      receipt_no: `GRN-2026-${String(Date.now()).slice(-4)}`,
      receipt_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.receipts.get(item.id);
      const fullReceipt = res?.data?.material_receipt ?? res?.material_receipt ?? item;
      const recItems = fullReceipt.items || [];

      setForm({
        project_id: String(fullReceipt.project_id || ''),
        site_id: String(fullReceipt.site_id || ''),
        purchase_order_id: String(fullReceipt.purchase_order_id || ''),
        receipt_no: fullReceipt.receipt_no || '',
        receipt_date: fullReceipt.receipt_date || '',
        supplier_id: String(fullReceipt.supplier_id || ''),
        supplier_challan_no: fullReceipt.supplier_challan_no || '',
        invoice_no: fullReceipt.invoice_no || '',
        vehicle_no: fullReceipt.vehicle_no || '',
        notes: fullReceipt.remarks || '',
        items: recItems.length > 0 ? recItems.map(i => ({
          id: i.id,
          material_id: String(i.material_id || ''),
          uom_id: String(i.uom_id || ''),
          received_qty: String(i.received_qty || '100'),
          unit_rate: String(i.unit_rate || '0'),
          purchase_order_item_id: i.purchase_order_item_id
        })) : [{ material_id: '', uom_id: '', received_qty: '100', unit_rate: '0', purchase_order_item_id: null }]
      });
      setErrors({});
      setEditingItem(fullReceipt);
      setIsAddOpen(true);
    } catch {
      toast.error('Failed to load goods receipt details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleUpdateItem = (idx, updates) => {
    setForm(prev => {
      const nextItems = [...prev.items];
      nextItems[idx] = { ...nextItems[idx], ...updates };
      return { ...prev, items: nextItems };
    });
    setErrors(prev => {
      if (!prev.items) return prev;
      const nextItemErrors = { ...prev.items };
      delete nextItemErrors[idx];
      return { ...prev, items: nextItemErrors };
    });
  };

  // Pre-fill from selected PO
  const handleLinkPurchaseOrder = async (poId) => {
    if (!poId) {
      handleFormChange('purchase_order_id', '');
      return;
    }

    setLoading(true);
    try {
      const res = await materialManagementApi.purchaseOrders.get(poId);
      const po = res?.data?.material_purchase_order ?? res?.material_purchase_order;
      if (po) {
        setForm(prev => ({
          ...prev,
          purchase_order_id: String(poId),
          project_id: String(po.project_id || prev.project_id),
          supplier_id: String(po.supplier_id || prev.supplier_id),
          site_name: po.site_name || prev.site_name,
          items: po.items?.map(item => {
            const selectedMat = materials.find(m => String(m.id) === String(item.material_id));
            const rate = Number(item.unit_rate) > 0 ? Number(item.unit_rate) : Number(selectedMat?.standard_rate || 0);
            return {
              material_id: String(item.material_id),
              uom_id: String(item.uom_id || selectedMat?.base_uom_id || ''),
              received_qty: String(item.ordered_qty),
              unit_rate: String(rate),
              purchase_order_item_id: item.id
            };
          }) || [{ material_id: '', uom_id: '', received_qty: '100', unit_rate: '0', purchase_order_item_id: null }]
        }));
      }
    } catch {
      toast.error('Failed to pre-fill from purchase order.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.receipt_no?.trim()) errs.receipt_no = 'GRN No is required';
    if (!form.receipt_date) errs.receipt_date = 'Receipt date is required';
    if (!form.supplier_id) errs.supplier_id = 'Supplier is required';
    if (!form.site_id) errs.site_id = 'Yard storage bay is required';
    
    // Validate items
    const itemErrors = [];
    form.items.forEach((item, index) => {
      const itemErr = {};
      if (!item.material_id) itemErr.material_id = 'Material is required';
      if (!item.received_qty || Number(item.received_qty) <= 0) itemErr.received_qty = 'Quantity must be > 0';
      if (Object.keys(itemErr).length > 0) {
        itemErrors[index] = itemErr;
      }
    });
    if (itemErrors.length > 0) {
      errs.items = itemErrors;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      let receiptId = editingItem?.id;
      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id),
        supplier_id: Number(form.supplier_id),
        purchase_order_id: form.purchase_order_id ? Number(form.purchase_order_id) : null,
        receipt_no: form.receipt_no,
        receipt_date: form.receipt_date,
        supplier_challan_no: form.supplier_challan_no,
        invoice_no: form.invoice_no,
        vehicle_no: form.vehicle_no,
        remarks: form.notes
      };

      if (receiptId) {
        await materialManagementApi.receipts.update(receiptId, payload);

        // Sync items
        const origItems = editingItem.items || [];
        const origItemIds = origItems.map(i => i.id);
        const newItemIds = form.items.filter(i => i.id).map(i => i.id);

        const deletedIds = origItemIds.filter(id => !newItemIds.includes(id));
        for (const itemId of deletedIds) {
          await materialManagementApi.receipts.removeItem(receiptId, itemId);
        }

        for (const item of form.items) {
          const itemPayload = {
            material_id: Number(item.material_id),
            uom_id: Number(item.uom_id),
            received_qty: Number(item.received_qty),
            unit_rate: Number(item.unit_rate),
            purchase_order_item_id: item.purchase_order_item_id ? Number(item.purchase_order_item_id) : null
          };
          if (item.id) {
            await materialManagementApi.receipts.updateItem(receiptId, item.id, itemPayload);
          } else {
            await materialManagementApi.receipts.addItem(receiptId, itemPayload);
          }
        }
        toast.success('Goods receipt updated successfully.');
      } else {
        const headerRes = await materialManagementApi.receipts.create(payload);
        receiptId = headerRes?.data?.material_receipt?.id ?? headerRes?.material_receipt?.id ?? headerRes?.id;
        
        if (receiptId) {
          for (const item of form.items) {
            await materialManagementApi.receipts.addItem(receiptId, {
              material_id: Number(item.material_id),
              uom_id: Number(item.uom_id),
              received_qty: Number(item.received_qty),
              unit_rate: Number(item.unit_rate),
              purchase_order_item_id: item.purchase_order_item_id ? Number(item.purchase_order_item_id) : null
            });
          }
        }
        toast.success('Goods received note logged.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      await loadReceipts();
    } catch (err) {
      toast.error(err?.message || 'Failed to save goods receipt.');
    } finally {
      setSaving(false);
    }
  };

  const loadReceipts = async () => {
    try {
      const recRes = await materialManagementApi.receipts.list();
      const rList = recRes?.data?.material_receipts ?? recRes?.data?.receipts ?? recRes?.data?.data ?? [];
      if (Array.isArray(rList)) {
        const normalized = rList.map(r => {
          const project = projects.find(p => String(p.id) === String(r.project_id));
          const site = sites.find(s => String(s.id) === String(r.site_id));
          const supplier = suppliers.find(s => String(s.id) === String(r.supplier_id));

          return {
            ...r,
            project_code: project?.project_code || 'PRJ-2026-001',
            project_name: project?.project_name || 'Civil Project',
            site_name: site?.site_name || 'Yard Storage',
            supplier_name: supplier?.supplier_name || 'Supplier Partner',
            status_name: r.status_name || r.status || 'Received & Stored',
            quality_status: r.status_name || 'Pending Inspection'
          };
        });
        setReceipts(normalized);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await materialManagementApi.receipts.remove(deleteItem.id);
      toast.success('Goods receipt removed.');
      setDeleteItem(null);
      await loadReceipts();
    } catch {
      toast.error('Failed to delete goods receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInspect = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.receipts.get(item.id);
      const fullReceipt = res?.data?.material_receipt ?? res?.material_receipt ?? item;
      const receiptItems = fullReceipt.items || [];
      
      setInspectingItem(fullReceipt);
      setInspectForm({
        items: receiptItems.map(i => ({
          id: i.id,
          material_name: i.material_name || `Material #${i.material_id}`,
          received_qty: i.received_qty,
          accepted_qty: String(i.received_qty),
          rejected_qty: '0',
          quality_status_id: String(qualityStatuses[0]?.id || ''),
          rejection_reason: ''
        }))
      });
      setErrors({});
    } catch {
      toast.error('Failed to load receipt for inspection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    
    // Validate quantities
    for (const i of inspectForm.items) {
      const acc = Number(i.accepted_qty) || 0;
      const rej = Number(i.rejected_qty) || 0;
      const rec = Number(i.received_qty) || 0;
      if (Math.abs((acc + rej) - rec) > 0.0001) {
        toast.error(`For ${i.material_name}, Accepted + Rejected qty must equal Received qty (${rec}).`);
        return;
      }
      if (!i.quality_status_id) {
        toast.error(`Please select a Quality Status for ${i.material_name}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        items: inspectForm.items.map(i => ({
          id: i.id,
          accepted_qty: Number(i.accepted_qty),
          rejected_qty: Number(i.rejected_qty),
          quality_status_id: Number(i.quality_status_id),
          rejection_reason: i.rejection_reason
        }))
      };
      
      await materialManagementApi.receipts.inspect(inspectingItem.id, payload);
      toast.success('QC Inspection submitted successfully.');
      setInspectingItem(null);
      await loadReceipts();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit QC Inspection.');
    } finally {
      setSaving(false);
    }
  };

  const handlePostReceipt = async (item) => {
    try {
      await materialManagementApi.receipts.post(item.id, {});
      toast.success('Receipt posted to Inventory Ledger.');
      await loadReceipts();
    } catch {
      toast.error('Failed to post receipt.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter and pagination calculations completed above

  // Metrics
  const totalInwardValue = useMemo(() => {
    return receipts.reduce((sum, r) => {
      const details = detailsMap[r.id];
      const itemsSum = details?.items?.reduce((acc, i) => acc + (Number(i.received_qty) * Number(i.unit_rate || 0)), 0) || 0;
      return sum + itemsSum;
    }, 0);
  }, [receipts, detailsMap]);

  const qcPassedCount = useMemo(() => receipts.filter(r => {
    const q = String(r.quality_status || '').toLowerCase();
    return q.includes('accept') || q.includes('pass') || q.includes('posted');
  }).length, [receipts]);

  const getQualityVariant = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('ACCEPT') || s === 'POSTED' || s.includes('PASS')) return 'success';
    if (s.includes('INSPECT') || s === 'DRAFT' || s === 'RECEIVED & STORED') return 'warning';
    if (s.includes('REJECT') || s.includes('FAIL')) return 'error';
    return 'neutral';
  };

  const getSupplierName = (id) => {
    const s = suppliers.find(sup => String(sup.id) === String(id));
    return s ? s.supplier_name : `Supplier #${id}`;
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Receipts' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inward Goods Receipts (GRN) & Gate Entry"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Inward GRNs"
            value={receipts.length}
            status="primary"
            icon={<ArrowDownToLine className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Inward Value"
            value={`₹${totalInwardValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="QC Accepted Deliveries"
            value={`${qcPassedCount} Lots`}
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Vehicles Inward Gate"
            value={`${receipts.length} Trucks`}
            status="neutral"
            icon={<Truck className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Quality Status' },
                  { value: 'POSTED', label: 'Posted' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'ACCEPTED', label: 'Accepted' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search GRN, supplier, vehicle, challan..."
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
              title="Print Inward Register"
            >
              Print Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Inward Receipt (GRN)
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
                totalResults={filtered.length}
                pageSize={perPage}
                onPageChange={setPage}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-28">GRN No.</th>
                  <th className="px-3 py-2">Supplier & Challan</th>
                  <th className="px-3 py-2">Storage Yard Bay</th>
                  <th className="px-3 py-2 w-48">Items</th>
                  <th className="px-3 py-2 text-right w-28">Total Value</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Vehicle No.</th>
                  <th className="px-3 py-2 text-center w-28">Quality Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock receipts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No goods receipts found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => {
                    const receiptDetails = detailsMap[r.id];
                    const receiptValue = receiptDetails?.items?.reduce((sum, item) => sum + (Number(item.received_qty) * Number(item.unit_rate || 0)), 0) || 0;

                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {r.receipt_no}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.receipt_date}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={getSupplierName(r.supplier_id)}>
                              {getSupplierName(r.supplier_id)}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              DC: {r.supplier_challan_no} • Inv: {r.invoice_no || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          {r.site_name || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {receiptDetails ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-text-primary text-[11px]">
                                {receiptDetails.items?.length || 0} {receiptDetails.items?.length === 1 ? 'item' : 'items'}
                              </span>
                              <span className="text-[10px] text-text-muted truncate max-w-[150px] block" title={receiptDetails.items?.map(i => i.material_name || `Mat #${i.material_id}`).join(', ')}>
                                {receiptDetails.items?.map(i => i.material_name || `Mat #${i.material_id}`).join(', ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-text-muted text-[11px] italic animate-pulse">Loading...</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                          ₹{receiptValue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                          {r.vehicle_no || '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getQualityVariant(r.quality_status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {r.quality_status || 'Accepted'}
                          </Badge>
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
                            
                            {(r.status_name === 'Received & Stored' || String(r.status_name).toUpperCase() === 'DRAFT') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  title="QC Inspection"
                                  onClick={() => handleOpenInspect(r)}
                                >
                                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Inspect
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Edit"
                                  onClick={() => handleOpenEdit(r)}
                                >
                                  <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Delete"
                                  onClick={() => setDeleteItem(r)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                                </Button>
                              </>
                            )}
                            
                            {String(r.status_name).toUpperCase().includes('ACCEPTED') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Post to Inventory"
                                onClick={() => handlePostReceipt(r)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Post
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
          {paged.map((r, idx) => {
            const receiptDetails = detailsMap[r.id];
            const receiptValue = receiptDetails?.items?.reduce((sum, item) => sum + (Number(item.received_qty) * Number(item.unit_rate || 0)), 0) || 0;

            return (
              <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block">{r.receipt_no} • {r.receipt_date}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">
                      {receiptDetails?.items?.[0]?.material_name || 'Goods Receipt'}
                      {receiptDetails?.items && receiptDetails.items.length > 1 && ` + ${receiptDetails.items.length - 1} more`}
                    </h4>
                    <span className="text-[11px] text-text-muted">{getSupplierName(r.supplier_id)}</span>
                  </div>
                  <Badge
                    variant={getQualityVariant(r.quality_status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                  >
                    {r.quality_status || 'Accepted'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Items Inwarded</span>
                    <span className="font-mono font-bold text-text-primary text-[11px]">{receiptDetails?.items?.length || '—'} items</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Total Value</span>
                    <span className="font-mono font-bold text-primary text-[12px]">₹{receiptValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                    <Eye className="w-3 h-3 mr-1" /> View GRN
                  </Button>
                  
                  {(r.status_name === 'Received & Stored' || String(r.status_name).toUpperCase() === 'DRAFT') && (
                    <>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleOpenInspect(r)}>
                        <ShieldCheck className="w-3 h-3 mr-1" /> Inspect
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(r)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteItem(r)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </>
                  )}
                  
                  {String(r.status_name).toUpperCase().includes('ACCEPTED') && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handlePostReceipt(r)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Post
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
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View GRN 360 Modal */}
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
                  <span className="text-[11px] font-mono text-text-muted">{getSupplierName(viewingItem.supplier_id)} • {viewingItem.receipt_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Challan / Invoice</span>
                  <span className="font-mono text-text-primary font-semibold">DC: {viewingItem.supplier_challan_no} • Inv: {viewingItem.invoice_no || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Vehicle Gate Entry</span>
                  <span className="font-mono text-text-primary font-bold">{viewingItem.vehicle_no || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Storage yard bay</span>
                  <span className="font-semibold text-text-primary">{viewingItem.site_name || 'Yard Bay Storage'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Inward Value</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{(viewingItem.items?.reduce((sum, item) => sum + (Number(item.received_qty) * Number(item.unit_rate || 0)), 0) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">QC Status</span>
                  <span className="font-bold text-primary">{viewingItem.quality_status || 'Pending Inspection'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Fulfillment Status</span>
                  <span className="text-text-primary font-medium">{viewingItem.status_name || 'Received & Stored'}</span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-text-primary block text-[11px]">Material Items Received</span>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-surface-muted font-bold text-text-secondary border-b border-border">
                      <tr>
                        <th className="p-2">Material Item</th>
                        <th className="p-2 text-center">UOM</th>
                        <th className="p-2 text-right">Received Qty</th>
                        <th className="p-2 text-right">Accepted Qty</th>
                        <th className="p-2 text-right">Rejected Qty</th>
                        <th className="p-2 text-right">Unit Rate</th>
                        <th className="p-2 text-right">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {viewingItem.items?.map((item, i) => {
                        const baseUom = uoms.find(u => String(u.id) === String(item.uom_id));
                        return (
                          <tr key={item.id || i} className="hover:bg-surface-muted/20">
                            <td className="p-2 font-medium text-text-primary">
                              {item.material_code ? `${item.material_code} - ${item.material_name}` : item.material_name || `Material #${item.material_id}`}
                            </td>
                            <td className="p-2 text-center font-mono text-text-secondary">
                              {baseUom?.unit_code || '—'}
                            </td>
                            <td className="p-2 text-right font-mono font-medium">
                              {item.received_qty}
                            </td>
                            <td className="p-2 text-right font-mono text-emerald-600 font-bold">
                              {item.accepted_qty ?? '—'}
                            </td>
                            <td className="p-2 text-right font-mono text-red-600 font-bold">
                              {item.rejected_qty ?? '0'}
                            </td>
                            <td className="p-2 text-right font-mono">
                              ₹{Number(item.unit_rate || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 text-right font-mono font-semibold text-text-primary">
                              ₹{Number((item.received_qty || 0) * (item.unit_rate || 0)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks */}
              {viewingItem.remarks && (
                <div className="border border-border rounded-lg p-3 space-y-1 bg-surface-muted/10">
                  <span className="font-bold text-text-primary block text-[11px]">Gate Entry Remarks / Inspector Notes:</span>
                  <p className="text-text-secondary text-[11px] leading-relaxed italic">"{viewingItem.remarks}"</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print GRN Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit GRN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ArrowDownToLine}
          title={editingItem ? 'Edit Goods Receipt (GRN)' : 'Inward Goods Receipt (GRN)'}
          subtitle="Log supplier gate delivery, vehicle challan, received quantities, and QC verification."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="grn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Purchase Order Linkage & Gate Entry">
              <EntityEditModal.Grid>
                <FormField label="Link Active Purchase Order (PO)">
                  <Select
                    options={[
                      { value: '', label: 'Select PO (Optional)' },
                      ...purchaseOrders.map(po => ({ value: String(po.id), label: `${po.po_no} - ${getSupplierName(po.supplier_id)}` }))
                    ]}
                    value={form.purchase_order_id}
                    onChange={handleLinkPurchaseOrder}
                    placeholder="Link PO for prefill"
                  />
                </FormField>

                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="GRN Number" required error={errors.receipt_no}>
                  <Input
                    value={form.receipt_no}
                    onChange={(e) => handleFormChange('receipt_no', e.target.value)}
                    placeholder="GRN-2026-085"
                  />
                </FormField>

                <FormField label="Receipt Date" required error={errors.receipt_date}>
                  <Input
                    type="date"
                    value={form.receipt_date}
                    onChange={(e) => handleFormChange('receipt_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Supplier Vendor" required error={errors.supplier_id} className="md:col-span-2">
                  <Select
                    options={suppliers.map(s => ({ value: String(s.id), label: s.supplier_name }))}
                    value={form.supplier_id}
                    onChange={(v) => handleFormChange('supplier_id', v)}
                    placeholder="Select Supplier"
                  />
                </FormField>

                <FormField label="Supplier Delivery Challan">
                  <Input
                    value={form.supplier_challan_no}
                    onChange={(e) => handleFormChange('supplier_challan_no', e.target.value)}
                    placeholder="DC-9812"
                  />
                </FormField>

                <FormField label="Vehicle Number">
                  <Input
                    value={form.vehicle_no}
                    onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                    placeholder="TN-45-AZ-1024"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Inward List">
              <div className="space-y-3">
                {form.items && form.items.map((item, idx) => {
                  const selectedMat = materials.find(m => String(m.id) === String(item.material_id));
                  const baseUom = uoms.find(u => String(u.id) === String(selectedMat?.base_uom_id));
                  const itemErr = errors.items?.[idx] || {};

                  return (
                    <div key={idx} className="bg-surface-muted/30 p-3 rounded-lg border border-border/60 space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                        <div className="flex-1 w-full">
                          <FormField label="Material Item" required error={itemErr.material_id}>
                            <Select
                              options={materials.map(m => ({ value: String(m.id), label: `${m.material_code} - ${m.material_name}` }))}
                              value={item.material_id}
                              onChange={(v) => {
                                const mat = materials.find(m => String(m.id) === String(v));
                                handleUpdateItem(idx, {
                                  material_id: v,
                                  uom_id: mat?.base_uom_id ? String(mat.base_uom_id) : '',
                                  unit_rate: String(mat?.standard_rate !== undefined && mat?.standard_rate !== null ? mat.standard_rate : '0')
                                });
                              }}
                              placeholder="Select Material"
                            />
                          </FormField>
                        </div>

                        <div className="w-24 shrink-0">
                          <FormField label="UOM">
                            <Input
                              value={baseUom?.unit_code || baseUom?.unit_name || '—'}
                              disabled
                              className="bg-surface-muted/50 font-mono text-center h-9"
                            />
                          </FormField>
                        </div>

                        <div className="w-32 shrink-0">
                          <FormField label="Received Qty" required error={itemErr.received_qty}>
                            <Input
                              type="number"
                              value={item.received_qty}
                              onChange={(e) => handleUpdateItem(idx, { received_qty: e.target.value })}
                            />
                          </FormField>
                        </div>

                        <div className="w-32 shrink-0">
                          <FormField label="Valuation Rate (₹)">
                            <Input
                              type="number"
                              value={item.unit_rate}
                              onChange={(e) => handleUpdateItem(idx, { unit_rate: e.target.value })}
                            />
                          </FormField>
                        </div>

                        {form.items.length > 1 && (
                          <div className="pt-5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => {
                                const nextItems = form.items.filter((_, i) => i !== idx);
                                handleFormChange('items', nextItems);
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const nextItems = [
                      ...form.items,
                      { material_id: '', uom_id: '', received_qty: '100', unit_rate: '0', purchase_order_item_id: null }
                    ];
                    handleFormChange('items', nextItems);
                  }}
                  className="mt-1 text-xs"
                >
                  Add Another Item
                </Button>
              </div>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Yard storage & remarks">
              <EntityEditModal.Grid>
                <FormField label="Yard Storage Bay Location" required error={errors.site_id} className="md:col-span-2">
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Yard/Site Location"
                  />
                </FormField>

                <FormField label="Gate Entry Notes & QC Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Test certificate verified, weighbridge slip reference..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="grn-form"
            submitLabel={editingItem ? 'Update GRN' : 'Inward to Inventory'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Goods Receipt"
        description={`Are you sure you want to delete goods receipt "${deleteItem?.receipt_no}"?`}
        confirmLabel="Delete"
        destructive={true}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />

      {/* QC Inspection Modal */}
      <EntityEditModal
        isOpen={Boolean(inspectingItem)}
        onClose={() => setInspectingItem(null)}
      >
        <EntityEditModal.Header
          title="Quality Control Inspection"
          subtitle={inspectingItem ? `Inspect receipt ${inspectingItem.receipt_no}` : ''}
          onClose={() => setInspectingItem(null)}
        />
        <form id="qc-form" onSubmit={handleInspectSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <div className="space-y-4">
              {inspectForm.items.map((item, idx) => (
                <EntityEditModal.Section key={item.id} title={`Item inspection: ${item.material_name}`}>
                  <EntityEditModal.Grid>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase block font-mono">Received Quantity</span>
                      <span className="font-bold text-text-primary text-[13px]">{item.received_qty}</span>
                    </div>

                    <FormField label="Accepted Quantity" required>
                      <Input
                        type="number"
                        value={item.accepted_qty}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const nextItems = [...inspectForm.items];
                          nextItems[idx] = {
                            ...nextItems[idx],
                            accepted_qty: e.target.value,
                            rejected_qty: String(Math.max(0, Number(item.received_qty) - val))
                          };
                          setInspectForm({ items: nextItems });
                        }}
                      />
                    </FormField>

                    <FormField label="Rejected Quantity">
                      <Input
                        type="number"
                        value={item.rejected_qty}
                        disabled
                        className="bg-surface-muted"
                      />
                    </FormField>

                    <FormField label="Quality Status" required className="md:col-span-2">
                      <Select
                        options={qualityStatuses.map(q => ({ value: String(q.id), label: q.quality_status_name }))}
                        value={item.quality_status_id}
                        onChange={(v) => {
                          const nextItems = [...inspectForm.items];
                          nextItems[idx] = { ...nextItems[idx], quality_status_id: v };
                          setInspectForm({ items: nextItems });
                        }}
                        placeholder="Select Quality Status"
                      />
                    </FormField>

                    {Number(item.rejected_qty) > 0 && (
                      <FormField label="Rejection Reason" required className="md:col-span-2">
                        <Textarea
                          rows={2}
                          value={item.rejection_reason}
                          onChange={(e) => {
                            const nextItems = [...inspectForm.items];
                            nextItems[idx] = { ...nextItems[idx], rejection_reason: e.target.value };
                            setInspectForm({ items: nextItems });
                          }}
                          placeholder="Specify why materials were rejected..."
                        />
                      </FormField>
                    )}
                  </EntityEditModal.Grid>
                </EntityEditModal.Section>
              ))}
            </div>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="qc-form"
            submitLabel="Submit Inspection"
            onCancel={() => setInspectingItem(null)}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
