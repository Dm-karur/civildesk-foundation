import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownToLine, CheckCircle2, AlertCircle, Truck,
  Building, Save, FileText, Layers, IndianRupee, ShieldCheck, Check
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { FormField } from '../../../components/composite/FormField';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, materialManagementApi, sitesApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const initialSeq = String(Date.now()).slice(-4);
const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  supplier_id: '',
  purchase_order_id: '',
  po_no: '',
  po_date: '',
  expected_delivery_date: '',
  delivery_address: '',
  receipt_no: `GRN-2026-${initialSeq}`,
  receipt_date: new Date().toISOString().split('T')[0],
  supplier_challan_no: `DC-2026-${initialSeq}`,
  supplier_challan_date: new Date().toISOString().split('T')[0],
  invoice_no: '',
  invoice_date: '',
  vehicle_no: '',
  received_by: '',
  notes: '',
  items: []
};

export function ReceivePoDeliveryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Master States
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);

  // Check if PO is approved
  const isPoApproved = (po) => {
    if (!po) return false;
    const s = String(po.status_name || po.status || '').toUpperCase().trim();
    return s.includes('APPROV') || s.includes('ACTIVE') || s.includes('ORDER') || s.includes('RECEIV') || s.includes('PARTIAL') || s.includes('COMPLET');
  };

  // Helper: calculate previously received quantity for a given PO and PO item
  const getPreviouslyReceivedQty = (poId, poItemId, currentReceiptId = null) => {
    if (!poId || !poItemId) return 0;
    let total = 0;
    allReceipts.forEach(r => {
      if (String(r.purchase_order_id) === String(poId) && String(r.id) !== String(currentReceiptId)) {
        const items = r.items || [];
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
      if (poItems.length === 0) return true; // If items not yet loaded, allow selection to fetch details

      return poItems.some(it => {
        const ord = Number(it.ordered_qty || 0);
        const prevRec = getPreviouslyReceivedQty(po.id, it.id, id);
        const backendRec = Number(it.received_qty || 0);
        const effectiveRec = Math.max(prevRec, backendRec);
        return ord > effectiveRec;
      });
    });
  }, [purchaseOrders, allReceipts, id]);

  const getSupplierName = (suppId) => {
    const s = suppliers.find(sup => String(sup.id) === String(suppId));
    return s ? s.supplier_name : (suppId ? `Supplier #${suppId}` : '—');
  };

  // Load Initial API Data
  useEffect(() => {
    setInitialLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.suppliers.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.purchaseOrders.list().catch(() => ({ data: [] })),
      materialManagementApi.receipts.list().catch(() => ({ data: [] }))
    ]).then(([projRes, sitesRes, suppRes, catRes, mastersRes, poRes, recRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const supList = suppRes?.data?.material_suppliers ?? suppRes?.material_suppliers ?? (Array.isArray(suppRes) ? suppRes : []);
      setSuppliers(Array.isArray(supList) ? supList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const mastersData = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      setUoms(Array.isArray(mastersData?.units) ? mastersData.units : []);

      const poList = poRes?.data?.material_purchase_orders ?? poRes?.data?.orders ?? poRes?.data?.data ?? (Array.isArray(poRes) ? poRes : []);
      setPurchaseOrders(Array.isArray(poList) ? poList : []);

      const rList = recRes?.data?.material_receipts ?? recRes?.data?.receipts ?? recRes?.data?.data ?? (Array.isArray(recRes) ? recRes : []);
      setAllReceipts(Array.isArray(rList) ? rList : []);

      if (id) {
        // Edit Mode: fetch receipt details
        materialManagementApi.receipts.get(id).then(res => {
          const rec = res?.data?.material_receipt ?? res?.material_receipt;
          if (rec) {
            setForm({
              project_id: String(rec.project_id || ''),
              site_id: String(rec.site_id || ''),
              supplier_id: String(rec.supplier_id || ''),
              purchase_order_id: String(rec.purchase_order_id || ''),
              po_no: rec.po_no || `PO-${rec.purchase_order_id}`,
              po_date: rec.po_date || '',
              expected_delivery_date: rec.expected_delivery_date || '',
              delivery_address: rec.delivery_address || '',
              receipt_no: rec.receipt_no || '',
              receipt_date: rec.receipt_date || new Date().toISOString().split('T')[0],
              supplier_challan_no: rec.supplier_challan_no || '',
              supplier_challan_date: rec.supplier_challan_date || '',
              invoice_no: rec.invoice_no || '',
              invoice_date: rec.invoice_date || '',
              vehicle_no: rec.vehicle_no || '',
              received_by: rec.received_by || '',
              notes: rec.remarks || '',
              items: (rec.items || []).map(it => ({
                id: it.id,
                purchase_order_item_id: it.purchase_order_item_id,
                material_id: String(it.material_id),
                material_name: it.material_name || `Material #${it.material_id}`,
                material_code: it.material_code || 'MAT',
                specification: it.specification || '',
                uom_id: String(it.uom_id || ''),
                uom_name: it.uom_name || 'Nos',
                ordered_qty: Number(it.ordered_qty || it.received_qty || 0),
                previously_received_qty: 0,
                pending_po_balance: Number(it.ordered_qty || it.received_qty || 0),
                received_qty: String(it.received_qty || ''),
                unit_rate: Number(it.unit_rate || 0),
                taxable_amount: Number(it.taxable_amount || 0),
                tax_amount: Number(it.tax_amount || 0),
                line_total: Number(it.line_total || (Number(it.received_qty || 0) * Number(it.unit_rate || 0))),
                remarks: it.remarks || ''
              }))
            });
          }
        }).catch(err => {
          console.error('Failed to load receipt for edit:', err);
          toast.error('Failed to load goods receipt details.');
        });
      } else {
        // Create Mode defaults
        const today = new Date().toISOString().split('T')[0];
        const nextNum = String(rList.length + 1).padStart(3, '0');
        setForm(prev => ({
          ...prev,
          receipt_no: prev.receipt_no && !prev.receipt_no.startsWith('GRN-2026-') ? prev.receipt_no : `GRN-2026-${nextNum}`,
          supplier_challan_no: prev.supplier_challan_no && !prev.supplier_challan_no.startsWith('DC-2026-') ? prev.supplier_challan_no : `DC-2026-${nextNum}`,
          receipt_date: today,
          supplier_challan_date: today,
          received_by: user?.name || user?.username || 'Site Engineer'
        }));
      }
    }).catch(err => {
      console.error('Failed to initialize page data:', err);
      toast.error('Failed to load form dependencies.');
    }).finally(() => {
      setInitialLoading(false);
    });
  }, [id, user]);

  // Select Approved Purchase Order & Auto-fill Details
  const handleSelectPurchaseOrder = async (poId) => {
    if (!poId) {
      setForm(prev => ({
        ...prev,
        purchase_order_id: '',
        po_no: '',
        po_date: '',
        expected_delivery_date: '',
        supplier_id: '',
        delivery_address: '',
        items: []
      }));
      return;
    }

    setLoading(true);
    try {
      const res = await materialManagementApi.purchaseOrders.get(poId);
      const fullPo = res?.data?.material_purchase_order ?? res?.material_purchase_order;
      const poObj = fullPo || purchaseOrders.find(p => String(p.id) === String(poId));

      if (poObj) {
        const poItems = poObj.items || [];
        const mappedItems = poItems.map(item => {
          const mat = materials.find(m => String(m.id) === String(item.material_id));
          const uom = uoms.find(u => String(u.id) === String(item.uom_id || mat?.base_uom_id));
          const ordQty = Number(item.ordered_qty || item.requested_qty || 0);
          const prevRecQty = getPreviouslyReceivedQty(poObj.id, item.id, id);
          const backendRecQty = Number(item.received_qty || 0);
          const effectivePrevRec = Math.max(prevRecQty, backendRecQty);
          const pendingBalance = Math.max(0, ordQty - effectivePrevRec);
          const unitRate = Number(item.unit_rate || item.rate || mat?.standard_rate || 0);

          return {
            purchase_order_item_id: item.id,
            material_id: String(item.material_id),
            material_name: item.material_name || mat?.material_name || `Material #${item.material_id}`,
            material_code: item.material_code || mat?.material_code || 'MAT',
            specification: item.specification || item.variant || mat?.specification || '',
            uom_id: String(item.uom_id || mat?.base_uom_id || ''),
            uom_name: uom?.unit_code || item.uom_name || 'Nos',
            ordered_qty: ordQty,
            previously_received_qty: effectivePrevRec,
            pending_po_balance: pendingBalance,
            received_qty: '', // User enters actual inward quantity
            unit_rate: unitRate,
            taxable_amount: 0,
            tax_amount: 0,
            line_total: 0,
            remarks: ''
          };
        });

        const matchingSite = sites.find(s => String(s.id) === String(poObj.site_id));
        setForm(prev => ({
          ...prev,
          purchase_order_id: String(poObj.id),
          po_no: poObj.po_no || `PO-${poObj.id}`,
          po_date: poObj.po_date || '',
          expected_delivery_date: poObj.expected_delivery_date || '',
          project_id: String(poObj.project_id || prev.project_id),
          site_id: String(poObj.site_id || (matchingSite?.id ? String(matchingSite.id) : '')),
          supplier_id: String(poObj.supplier_id || ''),
          delivery_address: poObj.delivery_address || matchingSite?.site_name || '',
          items: mappedItems
        }));
      }
    } catch (err) {
      console.error('Failed to load purchase order details:', err);
      toast.error('Failed to load purchase order details.');
    } finally {
      setLoading(false);
    }
  };

  // Item inward quantity change handler with validation
  const handleItemQtyChange = (idx, val) => {
    setForm(prev => {
      const nextItems = [...prev.items];
      const it = { ...nextItems[idx] };
      const numVal = val === '' ? '' : Math.max(0, Number(val));
      it.received_qty = val;

      const rec = Number(numVal || 0);
      const rate = Number(it.unit_rate || 0);
      const taxable = Math.round(rec * rate * 100) / 100;
      const tax = Math.round(taxable * 0.18 * 100) / 100;

      it.taxable_amount = taxable;
      it.tax_amount = tax;
      it.line_total = taxable + tax;

      nextItems[idx] = it;
      return { ...prev, items: nextItems };
    });

    setErrors(prev => {
      if (!prev.items) return prev;
      const nextItemErrors = { ...prev.items };
      delete nextItemErrors[idx];
      return { ...prev, items: nextItemErrors };
    });
  };

  // Inward item remarks update
  const handleItemRemarksChange = (idx, val) => {
    setForm(prev => {
      const nextItems = [...prev.items];
      nextItems[idx] = { ...nextItems[idx], remarks: val };
      return { ...prev, items: nextItems };
    });
  };

  // Summary Totals
  const totalInwardQty = useMemo(() => {
    return form.items.reduce((acc, it) => acc + Number(it.received_qty || 0), 0);
  }, [form.items]);

  const totalInwardAmount = useMemo(() => {
    return form.items.reduce((acc, it) => acc + Number(it.line_total || 0), 0);
  }, [form.items]);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!form.purchase_order_id) errs.purchase_order_id = 'Approved Purchase Order is required';
    if (!form.receipt_no?.trim()) errs.receipt_no = 'GRN Number is required';
    if (!form.receipt_date) errs.receipt_date = 'Receipt date is required';
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.site_id) errs.site_id = 'Site location is required';
    if (!form.supplier_id) errs.supplier_id = 'Supplier is required';
    if (!form.supplier_challan_no?.trim()) errs.supplier_challan_no = 'Supplier Challan No is required';

    const itemErrors = [];
    let hasAtLeastOneItemReceived = false;

    form.items.forEach((it, idx) => {
      const itErr = {};
      const rec = Number(it.received_qty || 0);

      if (it.received_qty !== '' && rec > 0) {
        hasAtLeastOneItemReceived = true;
      }

      // Check balance: inward quantity cannot exceed pending balance
      if (rec > it.pending_po_balance) {
        itErr.received_qty = `Cannot exceed pending balance (${it.pending_po_balance} ${it.uom_name})`;
      }

      if (Object.keys(itErr).length > 0) {
        itemErrors[idx] = itErr;
      }
    });

    if (!hasAtLeastOneItemReceived) {
      errs.general = 'Please enter inward received quantity for at least one delivery item.';
    }

    if (itemErrors.length > 0) {
      errs.items = itemErrors;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.general) toast.error(errs.general);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id),
        supplier_id: Number(form.supplier_id),
        purchase_order_id: Number(form.purchase_order_id),
        receipt_no: form.receipt_no,
        receipt_date: form.receipt_date,
        supplier_challan_no: form.supplier_challan_no,
        supplier_challan_date: form.supplier_challan_date || form.receipt_date,
        invoice_no: form.invoice_no || null,
        invoice_date: form.invoice_date || null,
        vehicle_no: form.vehicle_no || null,
        received_by: form.received_by || null,
        remarks: form.notes || null,
        status: 'Created',
        status_name: 'Created',
        quality_status: 'Pending Inspection'
      };

      if (id) {
        // Update header
        await materialManagementApi.receipts.update(id, payload);

        // Sync items
        for (const it of form.items) {
          const rec = Number(it.received_qty || 0);
          if (rec > 0) {
            const itemPayload = {
              material_id: Number(it.material_id),
              uom_id: Number(it.uom_id),
              received_qty: rec,
              unit_rate: Number(it.unit_rate || 0),
              purchase_order_item_id: it.purchase_order_item_id ? Number(it.purchase_order_item_id) : null,
              specification: it.specification || null,
              remarks: it.remarks || null
            };
            if (it.id) {
              await materialManagementApi.receipts.updateItem(id, it.id, itemPayload);
            } else {
              await materialManagementApi.receipts.addItem(id, itemPayload);
            }
          }
        }
        toast.success('Goods Receipt (GRN) updated successfully.');
      } else {
        // Create new receipt header
        const res = await materialManagementApi.receipts.create(payload);
        const receiptId = res?.data?.material_receipt?.id ?? res?.material_receipt?.id ?? res?.id ?? res?.data?.id;

        if (receiptId) {
          // Add items with inward received quantity > 0
          for (const it of form.items) {
            const rec = Number(it.received_qty || 0);
            if (rec > 0) {
              await materialManagementApi.receipts.addItem(receiptId, {
                material_id: Number(it.material_id),
                uom_id: Number(it.uom_id),
                received_qty: rec,
                unit_rate: Number(it.unit_rate || 0),
                purchase_order_item_id: it.purchase_order_item_id ? Number(it.purchase_order_item_id) : null,
                specification: it.specification || null,
                remarks: it.remarks || null
              });
            }
          }
        }
        toast.success(`Goods Receipt ${form.receipt_no} created successfully.`);
      }

      navigate('/procurement/goods-receipt');
    } catch (err) {
      console.error('Failed to save goods receipt:', err);
      toast.error(err?.message || 'Failed to save goods receipt.');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Goods Receipt', href: '/procurement/goods-receipt' },
    { label: id ? 'Edit Goods Receipt' : 'Receive PO Delivery' }
  ];

  if (initialLoading) {
    return (
      <PageContainer>
        <PageHeader title={id ? "Edit Goods Receipt (GRN)" : "Receive PO Delivery"} breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-center h-64 text-text-muted">Loading delivery details...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4 mb-4">
        <PageHeader
          title={id ? "Edit Goods Receipt (GRN)" : "Receive Purchase Order Delivery"}
          breadcrumbs={breadcrumbs}
        />
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/procurement/goods-receipt')}
          className="text-xs h-9 shadow-xs"
        >
          Back to Goods Receipts
        </Button>
      </div>

      <form id="receive-po-delivery-form" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Select Approved Purchase Order */}
        <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-surface-muted/50 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">1. Select Approved Purchase Order</h3>
            </div>
            <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">Step 1</Badge>
          </div>
          <div className="p-5 space-y-4">
            <FormField
              label="Select Approved Purchase Order (Only Approved POs with pending balances)"
              required
              error={errors.purchase_order_id}
            >
              <Select
                options={[
                  { value: '', label: '-- Select Approved Purchase Order to Inward --' },
                  ...eligibleApprovedPurchaseOrders.map(p => {
                    const supName = getSupplierName(p.supplier_id);
                    const proj = projects.find(pr => String(pr.id) === String(p.project_id));
                    const projCode = proj?.project_code || 'PRJ';
                    return {
                      value: String(p.id),
                      label: `${p.po_no || `PO-${p.id}`} | ${supName} | ${projCode} [APPROVED]`
                    };
                  })
                ]}
                value={form.purchase_order_id}
                onChange={(v) => handleSelectPurchaseOrder(v)}
                disabled={Boolean(id)}
                placeholder="Choose approved purchase order..."
              />
            </FormField>

            {eligibleApprovedPurchaseOrders.length === 0 && !id && (
              <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No approved purchase orders with pending balances found. Goods receipts can only be generated for authorized purchase orders.</span>
              </div>
            )}

            {/* PO Summary Card */}
            {form.purchase_order_id && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-primary/5 p-4 rounded-lg border border-primary/20 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Purchase Order</span>
                  <span className="font-mono font-bold text-primary text-sm">{form.po_no}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">PO Date</span>
                  <span className="font-mono font-medium text-text-primary text-sm">{form.po_date || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Vendor / Supplier</span>
                  <span className="font-semibold text-text-primary text-sm truncate block" title={getSupplierName(form.supplier_id)}>
                    {getSupplierName(form.supplier_id)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Expected Delivery</span>
                  <span className="font-mono text-emerald-700 font-semibold text-sm">{form.expected_delivery_date || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Inward Gate & Challan Details */}
        {form.purchase_order_id && (
          <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-surface-muted/50 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">2. Inward Gate & Delivery Challan Details</h3>
              </div>
              <Badge variant="neutral" className="text-[10px] font-bold uppercase tracking-wider">Step 2</Badge>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FormField label="GRN Number" required error={errors.receipt_no} helperText="Auto-generated (Non-editable)">
                  <Input
                    readOnly
                    value={form.receipt_no}
                    className="bg-surface-muted font-mono font-bold text-primary cursor-not-allowed select-none border-border"
                    placeholder="Auto-generated GRN"
                  />
                </FormField>

                <FormField label="Receipt Date" required error={errors.receipt_date}>
                  <Input
                    type="date"
                    value={form.receipt_date}
                    onChange={(e) => setForm(prev => ({ ...prev, receipt_date: e.target.value }))}
                  />
                </FormField>

                <FormField label="Supplier Challan No" required error={errors.supplier_challan_no} helperText="Auto-generated (Non-editable)">
                  <Input
                    readOnly
                    value={form.supplier_challan_no}
                    className="bg-surface-muted font-mono font-bold text-text-primary cursor-not-allowed select-none border-border"
                    placeholder="Auto-generated Challan"
                  />
                </FormField>

                <FormField label="Challan Date">
                  <Input
                    type="date"
                    value={form.supplier_challan_date}
                    onChange={(e) => setForm(prev => ({ ...prev, supplier_challan_date: e.target.value }))}
                  />
                </FormField>

                <FormField label="Invoice / Bill No (Optional)">
                  <Input
                    value={form.invoice_no}
                    onChange={(e) => setForm(prev => ({ ...prev, invoice_no: e.target.value }))}
                    placeholder="e.g. INV-2026-441"
                  />
                </FormField>

                <FormField label="Invoice Date">
                  <Input
                    type="date"
                    value={form.invoice_date}
                    onChange={(e) => setForm(prev => ({ ...prev, invoice_date: e.target.value }))}
                  />
                </FormField>

                <FormField label="Delivery Vehicle No">
                  <Input
                    value={form.vehicle_no}
                    onChange={(e) => setForm(prev => ({ ...prev, vehicle_no: e.target.value }))}
                    placeholder="e.g. TN-45-AZ-1024"
                  />
                </FormField>

                <FormField label="Received By (Site Staff)">
                  <Input
                    value={form.received_by}
                    onChange={(e) => setForm(prev => ({ ...prev, received_by: e.target.value }))}
                    placeholder="Site Engineer / Supervisor"
                  />
                </FormField>

                <FormField label="Receiving Yard / Bay" required error={errors.site_id} className="sm:col-span-2">
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => setForm(prev => ({ ...prev, site_id: v }))}
                    placeholder="Select Site Yard..."
                  />
                </FormField>

                <FormField label="Gate Inward Remarks" className="sm:col-span-2 md:col-span-4">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Packaging condition, vehicle driver notes, seal checks, batch notes..."
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Material Items Reconciliation */}
        {form.purchase_order_id && (
          <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-surface-muted/50 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">3. Material Delivery Items (Enter Inward Received Quantity)</h3>
              </div>
              <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider">
                {form.items.length} Line Items
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/80 font-bold text-text-secondary border-b border-border">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4 min-w-[200px]">Material & Variant</th>
                    <th className="py-3 px-3 text-center">UOM</th>
                    <th className="py-3 px-3 text-right">PO Ordered</th>
                    <th className="py-3 px-3 text-right">Prev. Rec'd</th>
                    <th className="py-3 px-3 text-right">Pending Balance</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Inward Rec'd *</th>
                    <th className="py-3 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-3 px-4 text-right">Line Total (₹)</th>
                    <th className="py-3 px-4 min-w-[160px]">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {form.items.map((it, idx) => {
                    const itemErr = errors.items?.[idx] || {};
                    const recNum = Number(it.received_qty || 0);

                    return (
                      <tr key={idx} className="hover:bg-surface-muted/20 transition-colors">
                        <td className="py-3 px-4 text-text-muted font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-text-primary block text-[13px]">{it.material_name}</span>
                          <span className="text-[10px] text-text-muted font-mono block">Code: {it.material_code}</span>
                          {it.specification && (
                            <span className="text-[11px] text-text-secondary mt-0.5 block italic">Variant: {it.specification}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-text-secondary">
                          {it.uom_name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-text-primary">
                          {it.ordered_qty}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-muted">
                          {it.previously_received_qty}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Badge
                            variant={it.pending_po_balance > 0 ? "success" : "neutral"}
                            className="font-mono text-[11px] font-bold"
                          >
                            {it.pending_po_balance} {it.uom_name}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            max={it.pending_po_balance}
                            value={it.received_qty}
                            onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                            placeholder="0.00"
                            className={`text-right font-mono font-bold h-9 text-xs ${itemErr.received_qty ? 'border-error ring-1 ring-error' : 'border-primary/40 focus:border-primary'}`}
                          />
                          {itemErr.received_qty && (
                            <span className="text-[10px] text-error font-medium block text-right mt-1">
                              {itemErr.received_qty}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-text-secondary">
                          ₹{Number(it.unit_rate || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                          ₹{Number(it.line_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            value={it.remarks || ''}
                            onChange={(e) => handleItemRemarksChange(idx, e.target.value)}
                            placeholder="Damage / Batch check..."
                            className="h-8 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-4 bg-surface-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-text-muted">
                Note: Inward received quantity will establish the initial GRN. QC Inspection will record accepted and rejected quantities.
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Total Delivery Items</span>
                  <span className="font-mono font-bold text-text-primary text-sm">{totalInwardQty} Units</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Estimated Inward Value</span>
                  <span className="font-mono font-bold text-primary text-base">
                    ₹{totalInwardAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/procurement/goods-receipt')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            disabled={saving || !form.purchase_order_id}
            className="bg-primary hover:bg-primary-hover px-6"
          >
            {saving ? 'Saving...' : id ? 'Update Goods Receipt' : 'Create Goods Receipt (GRN)'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
