import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, CheckCircle2, Clock, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, Truck, XCircle, Download, RotateCcw
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
import { projectsApi, materialManagementApi, materialsApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';
import html2pdf from 'html2pdf.js';

const toIsoDate = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [day, month, year] = s.split('-');
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date().toISOString().split('T')[0] : parsed.toISOString().split('T')[0];
};

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  po_no: '',
  po_date: new Date().toISOString().split('T')[0],
  expected_delivery_date: '',
  supplier_id: '',
  supplier_gstin: '',
  site_name: '',
  notes: '',
  taxable_amount: 0,
  tax_amount: 0,
  freight_amount: '0',
  grand_total: 0,
  items: [{ material_id: '', uom_id: '', ordered_qty: '', unit_rate: '0', taxable_amount: 0, tax_amount: 0, request_item_id: null }]
};

export function PurchaseOrdersPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = Boolean(user?.is_super_admin) || String(user?.role_name || user?.role || '').toLowerCase().includes('admin');
  const isDraft = (o) => {
    if (!o) return false;
    const s = String(o.status_name || o.status || '').toLowerCase().trim();
    return s === 'draft' || s === 'pending' || s === 'pending approval' || s === 'submitted';
  };
  const isApproved = (o) => {
    if (!o) return false;
    const s = String(o.status_name || o.status || '').toUpperCase().trim();
    return s.includes('APPROV') || s.includes('RECEIV') || s.includes('COMPLET') || s.includes('ACTIVE') || s.includes('ORDER');
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mrId = searchParams.get('mr_id');

  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [selectedMrForImport, setSelectedMrForImport] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sites, setSites] = useState([]);
  const [uoms, setUoms] = useState([]);

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Cache for fully fetched POs (with items)
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Safe Filtered List
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (selectedProjectId !== 'all' && String(o.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all') {
        const s = String(o.status_name || o.status || '').toUpperCase();
        if (statusFilter === 'Active' && !s.includes('ACTIVE') && !s.includes('APPROV')) return false;
        if (statusFilter === 'Partial' && !s.includes('PARTIAL')) return false;
        if (statusFilter === 'Completed' && !s.includes('COMPLET') && !s.includes('CLOSE')) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const no = String(o.po_no || '').toLowerCase();
        const sup = String(o.supplier_name || '').toLowerCase();
        const notes = String(o.notes || '').toLowerCase();
        const proj = String(o.project_name || '').toLowerCase();
        if (!no.includes(s) && !sup.includes(s) && !notes.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [orders, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Vendor-Wise Grouping for viewing PO detail modal
  const poVendorGroups = useMemo(() => {
    if (!viewingItem) return {};
    const itemsList = viewingItem.items || detailsMap[viewingItem.id]?.items || [];
    const groups = {};
    itemsList.forEach((item) => {
      const vId = item.supplier_id || item.vendor_id || item.material_supplier_id || viewingItem.supplier_id;
      const vObj = suppliers.find(s => String(s.id) === String(vId));
      const vName = vObj?.supplier_name || vObj?.name || vObj?.company_name || item.supplier_name || (vId ? `Vendor #${vId}` : (viewingItem.supplier_name ? `Vendor: ${viewingItem.supplier_name}` : 'Primary Supplier'));
      if (!groups[vName]) groups[vName] = [];
      groups[vName].push({ ...item, vObj });
    });
    return groups;
  }, [viewingItem, detailsMap, suppliers]);

  // Load PO details on viewing modal open if not cached
  useEffect(() => {
    if (!viewingItem?.id || detailsMap[viewingItem.id]) return;
    materialManagementApi.purchaseOrders.get(viewingItem.id)
      .then(res => {
        const po = res?.data?.material_purchase_order ?? res?.material_purchase_order;
        if (po) {
          setDetailsMap(prev => ({ ...prev, [viewingItem.id]: po }));
        }
      })
      .catch(() => {});
  }, [viewingItem, detailsMap]);

  // Load Initial API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      materialManagementApi.purchaseOrders.list().catch(() => ({ data: [] })),
      materialsApi.suppliers.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.requests.list().catch(() => ({ data: [] }))
    ]).then(([projRes, poRes, supRes, matRes, sitesRes, mastersRes, reqRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const supList = supRes?.data?.material_suppliers ?? supRes?.material_suppliers ?? (Array.isArray(supRes) ? supRes : supRes?.data ?? []);
      setSuppliers(Array.isArray(supList) ? supList : []);

      const matList = matRes?.data?.materials ?? matRes?.materials ?? (Array.isArray(matRes) ? matRes : matRes?.data ?? []);
      setMaterials(Array.isArray(matList) ? matList : []);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const mastersData = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      setUoms(Array.isArray(mastersData?.units) ? mastersData.units : []);

      const poList = poRes?.data?.material_purchase_orders ?? poRes?.data?.orders ?? poRes?.data?.data ?? poRes?.material_purchase_orders ?? [];
      if (Array.isArray(poList)) {
        const mapped = poList.map(po => {
          const proj = parsedProjects.find(p => String(p.id) === String(po.project_id));
          const siteObj = (Array.isArray(sList) ? sList : []).find(s => String(s.id) === String(po.site_id));
          const resolvedSiteName = po.site_name || siteObj?.site_name || siteObj?.name || (po.site_id ? `Site #${po.site_id}` : (po.delivery_location || po.site || 'Main Construction Site'));
          return {
            ...po,
            project_name: proj?.project_name || '',
            project_code: proj?.project_code || '',
            site_name: resolvedSiteName,
            status_name: po.status_name || po.status || 'Approved'
          };
        });
        setOrders(mapped);
      }

      const rList = reqRes?.data?.material_requests ?? reqRes?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? (Array.isArray(reqRes) ? reqRes : []);
      if (Array.isArray(rList)) {
        const mappedRequests = rList.map(r => {
          const proj = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const site = sList.find(s => String(s.id) === String(r.site_id));
          return {
            ...r,
            project_name: proj?.project_name || r.project_name || '',
            site_name: site?.site_name || r.site_name || '',
            approval_code: r.approval_code || (r.request_no ? `MRA-2026-${String(r.id).padStart(3, '0')}` : '')
          };
        });
        setApprovedRequests(mappedRequests);
      }
    }).catch((e) => {
      console.error(e);
    }).finally(() => setLoading(false));
  }, []);

  // Import Handler from Approved Material Request
  const handleImportApprovedMR = async (mrIdVal) => {
    setSelectedMrForImport(mrIdVal);
    if (!mrIdVal) return;
    setLoading(true);
    try {
      const res = await materialManagementApi.requests.get(mrIdVal);
      const mr = res?.data?.material_request ?? res?.material_request;
      if (mr) {
        const today = new Date().toISOString().split('T')[0];
        const defaultDelivery = mr.required_by_date || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const poItems = mr.items?.map(item => {
          const selectedMat = materials.find(m => String(m.id) === String(item.material_id));
          const specVal = item.specification || item.variant || item.size || item.spec || item.item_specification || item.material_variant || selectedMat?.specification || selectedMat?.variant || '';
          const qty = Number(item.approved_qty ?? item.requested_qty ?? 0);
          const rate = Number(item.estimated_rate) > 0 
            ? Number(item.estimated_rate) 
            : Number(selectedMat?.standard_rate || 0);
          const taxable = Math.round(qty * rate * 100) / 100;
          const tax = Math.round(taxable * 0.18 * 100) / 100;
          return {
            material_id: String(item.material_id),
            specification: specVal,
            variant: specVal,
            spec: specVal,
            uom_id: String(item.uom_id || selectedMat?.base_uom_id || ''),
            ordered_qty: String(qty),
            unit_rate: String(rate),
            supplier_id: String(item.supplier_id || item.vendor_id || ''),
            remarks: item.remarks || '',
            taxable_amount: taxable,
            tax_amount: tax,
            request_item_id: item.id
          };
        }) || [];

        const totalTaxable = poItems.reduce((sum, item) => sum + item.taxable_amount, 0);
        const totalTax = poItems.reduce((sum, item) => sum + item.tax_amount, 0);

        const matchingSite = sites.find(s => String(s.id) === String(mr.site_id) || (String(s.project_id) === String(mr.project_id)));
        const resolvedSiteId = mr.site_id ? String(mr.site_id) : (matchingSite ? String(matchingSite.id) : '');

        // Check if items have a common supplier_id
        const firstSupplier = poItems.find(i => i.supplier_id)?.supplier_id || '';

        setForm(prev => ({
          ...prev,
          project_id: String(mr.project_id || ''),
          site_id: resolvedSiteId,
          site_name: mr.site_name || matchingSite?.site_name || '',
          po_no: prev.po_no || `PO-2026-${String(Date.now()).slice(-4)}`,
          po_date: today,
          expected_delivery_date: defaultDelivery,
          supplier_id: firstSupplier || prev.supplier_id || '',
          notes: `Issued against Material Indent ${mr.request_no || ''}. Scope: ${mr.purpose || 'General site requirement.'}`,
          taxable_amount: totalTaxable,
          tax_amount: totalTax,
          grand_total: totalTaxable + totalTax,
          items: poItems.length > 0 ? poItems : [{ material_id: '', uom_id: '', ordered_qty: '100', unit_rate: '0', taxable_amount: 0, tax_amount: 0, request_item_id: null }]
        }));
        toast.success(`Material request ${mr.request_no} imported successfully.`);
      }
    } catch {
      toast.error('Failed to import material request.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill from MR if query param mr_id is present
  useEffect(() => {
    if (mrId && projects.length > 0 && materials.length > 0 && uoms.length > 0) {
      handleImportApprovedMR(mrId);
      setIsAddOpen(true);
    }
  }, [mrId, projects, materials, uoms]);

  // Load PO items details asynchronously for current visible paged list
  useEffect(() => {
    const missingIds = paged
      .map(po => po.id)
      .filter(id => !detailsMap[id]);

    if (missingIds.length === 0) return;

    setDetailsLoading(true);
    Promise.all(
      missingIds.map(id =>
        materialManagementApi.purchaseOrders.get(id)
          .then(res => {
            const po = res?.data?.material_purchase_order ?? res?.material_purchase_order;
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
    }).finally(() => {
      setDetailsLoading(false);
    });
  }, [paged, detailsMap]);

  // PDF Export Handler
  const handleDownloadPdf = async (item) => {
    if (!item) return;
    if (!isApproved(item)) {
      toast.warning('PDF & Print available after PO is Approved by Admin.');
      return;
    }
    toast.info('Preparing Purchase Order PDF...');
    try {
      let poData = item;
      if (!poData.items || poData.items.length === 0) {
        if (detailsMap[item.id]) {
          poData = { ...item, ...detailsMap[item.id] };
        } else {
          try {
            const res = await materialManagementApi.purchaseOrders.get(item.id);
            const fetched = res?.data?.material_purchase_order ?? res?.material_purchase_order;
            if (fetched) {
              poData = { ...item, ...fetched };
              setDetailsMap(prev => ({ ...prev, [item.id]: fetched }));
            }
          } catch (e) {
            console.error('Failed to fetch PO details for PDF:', e);
          }
        }
      }

      const itemsList = poData.items || [];
      const calcTaxable = Number(poData.taxable_amount || itemsList.reduce((acc, i) => acc + (Number(i.ordered_qty || 0) * Number(i.unit_rate || 0)), 0));
      const calcTax = Number(poData.tax_amount || Math.round(calcTaxable * 0.18));
      const calcFreight = Number(poData.freight_amount || 0);
      const calcGrandTotal = Number(poData.grand_total || poData.total_amount || (calcTaxable + calcTax + calcFreight));
      const supplierName = getSupplierName(poData.supplier_id) || poData.supplier_name || '—';
      const supplierObj = suppliers.find(s => String(s.id) === String(poData.supplier_id));

      const container = document.createElement('div');
      container.style.width = '750px';
      container.style.padding = '28px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.background = '#ffffff';
      container.style.color = '#1f2937';

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #70b816; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 22px; font-weight: bold; color: #70b816; margin: 0; letter-spacing: 0.5px;">KS CONSTRUCTION ERP</h1>
            <p style="font-size: 11px; color: #4B5563; margin: 3px 0 0 0;">Official Purchase Order Voucher</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0; color: #111827;">${poData.po_no || 'PO VOUCHER'}</h2>
            <p style="font-size: 11px; color: #6B7280; margin: 3px 0 0 0;">Date: ${poData.po_date || new Date().toISOString().split('T')[0]}</p>
            <p style="font-size: 10px; color: #059669; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase;">Status: ${poData.status_name || poData.status || 'Active'}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 20px; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; background: #F9FAFB;">
          <div style="width: 48%;">
            <strong style="color: #70b816; display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase;">PROJECT & DELIVERY DETAILS</strong>
            <div style="margin-bottom: 3px;"><span style="color: #6B7280;">Project:</span> <strong>${poData.project_name || '—'}</strong></div>
            <div style="margin-bottom: 3px;"><span style="color: #6B7280;">Site Location:</span> <strong>${poData.site_name || 'Main Site Yard'}</strong></div>
            <div><span style="color: #6B7280;">Expected Delivery:</span> <strong>${poData.expected_delivery_date || '—'}</strong></div>
          </div>
          <div style="width: 48%; text-align: right;">
            <strong style="color: #70b816; display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase;">VENDOR / SUPPLIER DETAILS</strong>
            <div style="margin-bottom: 3px;"><span style="color: #6B7280;">Supplier:</span> <strong>${supplierName}</strong></div>
            <div style="margin-bottom: 3px;"><span style="color: #6B7280;">GSTIN:</span> <strong>${poData.supplier_gstin || supplierObj?.gstin || '—'}</strong></div>
            <div><span style="color: #6B7280;">Contact:</span> ${supplierObj?.phone || supplierObj?.mobile || supplierObj?.email || '—'}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #70b816; color: white;">
              <th style="padding: 8px; text-align: left;">Item Description</th>
              <th style="padding: 8px; text-align: center;">UOM</th>
              <th style="padding: 8px; text-align: right;">Ordered Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Rate (₹)</th>
              <th style="padding: 8px; text-align: right;">GST (18%)</th>
              <th style="padding: 8px; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList.length === 0 ? `
              <tr>
                <td colspan="6" style="padding: 16px; text-align: center; color: #9CA3AF;">No line items detailed in this purchase order.</td>
              </tr>
            ` : itemsList.map((item, idx) => {
              const qty = Number(item.ordered_qty || item.requested_qty || 0);
              const rate = Number(item.unit_rate || item.rate || 0);
              const txable = Number(item.taxable_amount ?? (qty * rate));
              const tx = Number(item.tax_amount ?? Math.round(txable * 0.18));
              const tot = Number(item.total_amount ?? (txable + tx));
              const baseUom = uoms.find(u => String(u.id) === String(item.uom_id));
              const matObj = materials.find(m => String(m.id) === String(item.material_id));
              const desc = item.material_name || (item.material_code ? `${item.material_code} - ${item.material_name}` : matObj ? `${matObj.material_code} - ${matObj.material_name}` : `Material #${item.material_id}`);
              const spec = item.specification || item.variant || item.size || '';
              return `
                <tr style="border-bottom: 1px solid #E5E7EB; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
                  <td style="padding: 8px;">
                    <strong>${desc}</strong>
                    ${spec ? `<br/><small style="color: #6B7280; font-style: italic;">Variant: ${spec}</small>` : ''}
                  </td>
                  <td style="padding: 8px; text-align: center; color: #4B5563;">${baseUom?.unit_code || item.uom_name || 'Nos'}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold;">${qty}</td>
                  <td style="padding: 8px; text-align: right;">₹${rate.toLocaleString('en-IN')}</td>
                  <td style="padding: 8px; text-align: right; color: #6B7280;">₹${tx.toLocaleString('en-IN')}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #111827;">₹${tot.toLocaleString('en-IN')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 11px;">
          <div>
            <span style="font-size: 9px; color: #065F46; text-transform: uppercase; font-weight: bold; display: block;">Taxable Value</span>
            <span style="font-size: 13px; font-weight: bold; font-family: monospace;">₹${calcTaxable.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span style="font-size: 9px; color: #065F46; text-transform: uppercase; font-weight: bold; display: block;">GST Total (18%)</span>
            <span style="font-size: 13px; font-weight: bold; font-family: monospace;">₹${calcTax.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span style="font-size: 9px; color: #065F46; text-transform: uppercase; font-weight: bold; display: block;">Freight & Logistics</span>
            <span style="font-size: 13px; font-weight: bold; font-family: monospace;">₹${calcFreight.toLocaleString('en-IN')}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 9px; color: #064E3B; text-transform: uppercase; font-weight: bold; display: block;">Grand Total</span>
            <span style="font-size: 15px; font-weight: 800; color: #047857; font-family: monospace;">₹${calcGrandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        ${poData.notes ? `
          <div style="border: 1px solid #E5E7EB; padding: 10px; border-radius: 6px; margin-bottom: 20px; background: #F9FAFB;">
            <strong style="font-size: 11px; color: #374151; display: block; margin-bottom: 2px;">Commercial Notes & Terms:</strong>
            <p style="font-size: 11px; color: #4B5563; margin: 0; font-style: italic;">"${poData.notes}"</p>
          </div>
        ` : ''}

        <div style="margin-top: 35px; border-top: 1px solid #E5E7EB; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #6B7280;">
          <div>
            <p style="margin: 0 0 30px 0;">Prepared By: Central Procurement</p>
            <p style="margin: 0; font-size: 10px;">Computer Generated Purchase Order</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 30px 0;">Authorized Signatory</p>
            <p style="margin: 0; font-size: 10px;">KS Construction ERP Authorization</p>
          </div>
        </div>
      `;

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Purchase_Order_${poData.po_no || 'Voucher'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(container).save();
      toast.success('Purchase Order PDF downloaded successfully.');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF download.');
    }
  };

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');
    const defaultSite = sites.find(s => String(s.project_id) === defaultProj);

    // Refresh approved requests list in real time when opening modal
    materialManagementApi.requests.list().then(reqRes => {
      const rList = reqRes?.data?.material_requests ?? reqRes?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? (Array.isArray(reqRes) ? reqRes : []);
      if (Array.isArray(rList)) {
        const mappedRequests = rList.map(r => {
          const proj = projects.find(p => String(p.id) === String(r.project_id));
          const site = sites.find(s => String(s.id) === String(r.site_id));
          return {
            ...r,
            project_name: proj?.project_name || r.project_name || '',
            site_name: site?.site_name || r.site_name || '',
            approval_code: r.approval_code || (r.request_no ? `MRA-2026-${String(r.id).padStart(3, '0')}` : '')
          };
        });
        setApprovedRequests(mappedRequests);
      }
    }).catch(() => {});

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      site_id: defaultSite ? String(defaultSite.id) : (sites[0]?.id ? String(sites[0].id) : ''),
      site_name: defaultSite?.site_name || sites[0]?.site_name || '',
      po_no: `PO-2026-${String(Date.now()).slice(-4)}`,
      po_date: today,
      expected_delivery_date: defaultDelivery,
      items: [{ material_id: '', uom_id: '', ordered_qty: '', unit_rate: '0', taxable_amount: 0, tax_amount: 0, request_item_id: null }]
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.purchaseOrders.get(item.id);
      const fullPO = res?.data?.material_purchase_order ?? res?.material_purchase_order ?? {};
      const poItems = fullPO.items || [];

      setForm({
        project_id: String(fullPO.project_id || ''),
        site_id: String(fullPO.site_id || ''),
        po_no: fullPO.po_no || '',
        po_date: fullPO.po_date || '',
        expected_delivery_date: fullPO.expected_delivery_date || '',
        supplier_id: String(fullPO.supplier_id || ''),
        supplier_gstin: fullPO.supplier_gstin || '',
        site_name: fullPO.site_name || '',
        notes: fullPO.notes || '',
        taxable_amount: fullPO.taxable_amount || 0,
        tax_amount: fullPO.tax_amount || 0,
        freight_amount: String(fullPO.freight_amount || '0'),
        grand_total: fullPO.grand_total || 0,
        items: poItems.length > 0 ? poItems.map(i => ({
          id: i.id,
          material_id: String(i.material_id || ''),
          uom_id: String(i.uom_id || ''),
          ordered_qty: String(i.ordered_qty || '100'),
          unit_rate: String(i.unit_rate || '0'),
          taxable_amount: Number(i.taxable_amount || 0),
          tax_amount: Number(i.tax_amount || 0),
          request_item_id: i.request_item_id
        })) : [{ material_id: '', uom_id: '', ordered_qty: '100', unit_rate: '0', taxable_amount: 0, tax_amount: 0, request_item_id: null }]
      });
      setErrors({});
      setEditingItem(fullPO);
      setIsAddOpen(true);
    } catch {
      toast.error('Failed to load purchase order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'items' || field === 'freight_amount') {
        const freight = Number(field === 'freight_amount' ? value : prev.freight_amount) || 0;
        const totalTaxable = next.items.reduce((sum, item) => sum + (Number(item.taxable_amount) || 0), 0);
        const totalTax = next.items.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
        next.taxable_amount = totalTaxable;
        next.tax_amount = totalTax;
        next.grand_total = totalTaxable + totalTax + freight;
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleUpdateItem = (idx, updates) => {
    setForm(prev => {
      const nextItems = [...prev.items];
      const currentItem = nextItems[idx] || {};
      const updatedItem = { ...currentItem, ...updates };

      const qty = Number(updates.ordered_qty !== undefined ? updates.ordered_qty : updatedItem.ordered_qty) || 0;
      const rate = Number(updates.unit_rate !== undefined ? updates.unit_rate : updatedItem.unit_rate) || 0;
      const taxable = Math.round(qty * rate * 100) / 100;
      const tax = Math.round(taxable * 0.18 * 100) / 100; // 18% standard GST assumption
      
      updatedItem.taxable_amount = taxable;
      updatedItem.tax_amount = tax;
      nextItems[idx] = updatedItem;

      const freight = Number(prev.freight_amount) || 0;
      const totalTaxable = nextItems.reduce((sum, item) => sum + (Number(item.taxable_amount) || 0), 0);
      const totalTax = nextItems.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);

      return {
        ...prev,
        items: nextItems,
        taxable_amount: totalTaxable,
        tax_amount: totalTax,
        grand_total: totalTaxable + totalTax + freight
      };
    });
    setErrors(prev => {
      if (!prev.items) return prev;
      const nextItemErrors = { ...prev.items };
      delete nextItemErrors[idx];
      return { ...prev, items: nextItemErrors };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.site_id) errs.site_id = 'Delivery site location is required';
    if (!form.po_no.trim()) errs.po_no = 'PO Number is required';
    
    const firstSupplierId = form.items?.find(i => i.supplier_id)?.supplier_id || form.supplier_id || (suppliers[0]?.id ? String(suppliers[0].id) : '');

    // Validate items
    const itemErrors = [];
    form.items.forEach((item, index) => {
      const itemErr = {};
      if (!item.material_id) itemErr.material_id = 'Material is required';
      if (!item.supplier_id) itemErr.supplier_id = 'Supplier Vendor is required';
      if (!item.ordered_qty || Number(item.ordered_qty) <= 0) itemErr.ordered_qty = 'Quantity must be > 0';
      if (item.unit_rate === '' || Number(item.unit_rate) < 0) itemErr.unit_rate = 'Rate cannot be negative';
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
      let poId = editingItem?.id;
      const formattedItems = form.items.map(item => ({
        material_id: Number(item.material_id),
        uom_id: Number(item.uom_id),
        ordered_qty: Number(item.ordered_qty),
        unit_rate: Number(item.unit_rate),
        taxable_amount: Number(item.taxable_amount || 0),
        tax_amount: Number(item.tax_amount || 0),
        request_item_id: item.request_item_id ? Number(item.request_item_id) : null
      }));

      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id),
        po_no: String(form.po_no || '').trim(),
        po_date: toIsoDate(form.po_date),
        expected_delivery_date: toIsoDate(form.expected_delivery_date),
        supplier_id: Number(form.supplier_id),
        site_name: form.site_name || '',
        notes: form.notes || '',
        subtotal: Number(form.taxable_amount || 0),
        taxable_amount: Number(form.taxable_amount || 0),
        tax_amount: Number(form.tax_amount || 0),
        freight_amount: Number(form.freight_amount || 0),
        grand_total: Number(form.grand_total || 0),
        total_amount: Number(form.grand_total || 0),
        items: formattedItems
      };

      if (poId) {
        // Update header
        await materialManagementApi.purchaseOrders.update(poId, payload);

        // Sync items
        const origItems = editingItem.items || [];
        const origItemIds = origItems.map(i => i.id);
        const newItemIds = form.items.filter(i => i.id).map(i => i.id);

        const deletedIds = origItemIds.filter(id => !newItemIds.includes(id));
        for (const itemId of deletedIds) {
          await materialManagementApi.purchaseOrders.removeItem(poId, itemId);
        }

        for (const item of form.items) {
          const suppId = item.supplier_id ? Number(item.supplier_id) : (form.supplier_id ? Number(form.supplier_id) : null);
          const specVal = item.specification || item.variant || item.size || item.spec || '';
          const itemPayload = {
            material_id: Number(item.material_id),
            uom_id: Number(item.uom_id),
            ordered_qty: Number(item.ordered_qty),
            unit_rate: Number(item.unit_rate),
            taxable_amount: Number(item.taxable_amount || 0),
            tax_amount: Number(item.tax_amount || 0),
            specification: specVal,
            variant: specVal,
            supplier_id: suppId,
            vendor_id: suppId,
            request_item_id: item.request_item_id ? Number(item.request_item_id) : null
          };
          if (item.id) {
            await materialManagementApi.purchaseOrders.updateItem(poId, item.id, itemPayload);
          } else {
            await materialManagementApi.purchaseOrders.addItem(poId, itemPayload);
          }
        }
        toast.success('Purchase order updated successfully.');
      } else {
        // Create header
        const headerRes = await materialManagementApi.purchaseOrders.create(payload);
        poId = headerRes?.data?.material_purchase_order?.id ?? headerRes?.material_purchase_order?.id;
        
        if (poId) {
          for (const item of form.items) {
            try {
              const suppId = item.supplier_id ? Number(item.supplier_id) : (form.supplier_id ? Number(form.supplier_id) : null);
              const specVal = item.specification || item.variant || item.size || item.spec || '';
              await materialManagementApi.purchaseOrders.addItem(poId, {
                material_id: Number(item.material_id),
                uom_id: Number(item.uom_id),
                ordered_qty: Number(item.ordered_qty),
                unit_rate: Number(item.unit_rate),
                taxable_amount: Number(item.taxable_amount || 0),
                tax_amount: Number(item.tax_amount || 0),
                specification: specVal,
                variant: specVal,
                supplier_id: suppId,
                vendor_id: suppId,
                request_item_id: item.request_item_id ? Number(item.request_item_id) : null
              });
            } catch (itemErr) {
              console.warn('Item add check:', itemErr);
            }
          }
          // Auto-submit created PO so it enters SUBMITTED status and appears in PO Approval queue
          try {
            await materialManagementApi.purchaseOrders.action(poId, 'submit', { remarks: 'Submitted for approval' });
          } catch (subErr) {
            console.warn('Auto-submit PO notice:', subErr);
          }
        }
        toast.success('Purchase order created and submitted for approval.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      await loadPurchaseOrders();
    } catch (err) {
      console.error('Failed to save purchase order:', err);
      const validationErrors = err?.errors || err?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        const msg = Object.entries(validationErrors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ');
        toast.error(`Validation error: ${msg}`);
      } else {
        toast.error(err?.message || 'Failed to save purchase order.');
      }
    } finally {
      setSaving(false);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const res = await materialManagementApi.purchaseOrders.list();
      const poList = res?.data?.material_purchase_orders ?? res?.data?.orders ?? res?.data?.data ?? res?.material_purchase_orders ?? [];
      if (Array.isArray(poList)) {
        const mapped = poList.map(po => {
          const proj = projects.find(p => String(p.id) === String(po.project_id));
          const siteObj = sites.find(s => String(s.id) === String(po.site_id));
          const resolvedSiteName = po.site_name || siteObj?.site_name || siteObj?.name || (po.site_id ? `Site #${po.site_id}` : (po.delivery_location || po.site || 'Main Construction Site'));
          return {
            ...po,
            project_name: proj?.project_name || '',
            project_code: proj?.project_code || '',
            site_name: resolvedSiteName,
            status_name: po.status_name || po.status || 'Approved'
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Failed to reload purchase orders:', err);
    }
  };

  const handleApprovePO = async (po) => {
    setLoading(true);
    try {
      await materialManagementApi.purchaseOrders.update(po.id, {
        status: 'Approved',
        status_name: 'Approved'
      }).catch(async () => {
        return await materialManagementApi.purchaseOrders.action(po.id, 'approve');
      });
      toast.success(`Purchase Order ${po.po_no} approved successfully.`);
      if (viewingItem?.id === po.id) {
        setViewingItem(prev => prev ? { ...prev, status_name: 'Approved', status: 'Approved' } : null);
      }
      await loadPurchaseOrders();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve purchase order.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await materialManagementApi.purchaseOrders.remove(deleteItem.id);
      toast.success('Purchase order deleted successfully.');
      setDeleteItem(null);
      await loadPurchaseOrders();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete purchase order.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter and pagination calculations completed above

  // Metrics
  const totalPOValue = useMemo(() => orders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0), [orders]);
  const activePOCount = useMemo(() => orders.filter(o => {
    const s = String(o.status_name || o.status || '').toUpperCase();
    return s.includes('ACTIVE') || s.includes('APPROV') || s.includes('PARTIAL');
  }).length, [orders]);

  const getStatusVariant = (status) => {
    const s = String(status).toUpperCase();
    if (s.includes('COMPLET') || s.includes('CLOSE')) return 'neutral';
    if (s.includes('ACTIVE') || s.includes('APPROV')) return 'success';
    if (s.includes('PARTIAL')) return 'info';
    return 'neutral';
  };

  const renderTimeline = (po) => {
    const status = (po.status_name || po.status || 'Approved').toUpperCase();
    const steps = [
      { key: 'ACTIVE', label: 'PO Active', desc: 'Issued & Active' },
      { key: 'PARTIAL', label: 'Partial Delivery', desc: 'Partially Received' },
      { key: 'COMPLETED', label: 'Closed', desc: 'Completed & Closed' }
    ];

    let currentIdx = 0;
    if (status.includes('PARTIAL')) currentIdx = 1;
    else if (status.includes('COMPLET') || status.includes('CLOSE')) currentIdx = 2;

    return (
      <div className="border border-border rounded-lg p-3 bg-surface-muted/20">
        <span className="font-bold text-text-primary block text-[11px] mb-2.5">PO Fulfillment Progression Timeline</span>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
            style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step, idx) => {
            const isDone = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold z-10 transition-colors
                    ${isDone ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-muted'}
                    ${isCurrent ? 'ring-2 ring-primary/40 ring-offset-2' : ''}`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isDone ? 'text-primary' : 'text-text-muted'}`}>{step.label}</span>
                <span className="text-[8px] text-text-muted hidden md:inline">{step.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getSupplierName = (id) => {
    const s = suppliers.find(sup => String(sup.id) === String(id));
    return s ? s.supplier_name : `Supplier #${id}`;
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement' },
    { label: 'Purchase Orders' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders (PO) & Supply Contracts"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Purchase Orders"
            value={orders.length}
            status="primary"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KpiCard
            label="Total PO Commitment"
            value={`₹${totalPOValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Orders In-Progress"
            value={`${activePOCount} Orders`}
            status="info"
            icon={<Truck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Delivery Adherence"
            value="100% On-Time"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Status' },
                  { value: 'Active', label: 'Issued & Active' },
                  { value: 'Partial', label: 'Partially Delivered' },
                  { value: 'Completed', label: 'Completed & Closed' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search PO no, supplier, terms..."
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
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Issue Purchase Order (PO)
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
                  <th className="px-3 py-2 w-32">PO Number</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Site</th>
                  <th className="px-3 py-2 text-center w-28">Delivery Date</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((o, idx) => {
                    const poDetails = detailsMap[o.id];
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
                        <td className="px-3 py-2">
                          <span className="font-semibold text-text-primary text-[12px] truncate block" title={getSupplierName(o.supplier_id)}>
                            {getSupplierName(o.supplier_id)}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-text-primary text-[11px]">
                          <span className="truncate block max-w-[140px]" title={o.project_name}>
                            {o.project_name || `Project #${o.project_id}`}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          <span className="truncate block max-w-[120px]" title={o.site_name || 'Main Construction Site'}>
                            {o.site_name || 'Main Construction Site'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                          {o.expected_delivery_date || '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(o.status_name || o.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {o.status_name || o.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View PO Voucher"
                              onClick={() => setViewingItem(o)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {isApproved(o) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Download PDF"
                                onClick={() => handleDownloadPdf(o)}
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-700" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(o)}
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
          {paged.map((o, idx) => {
            const poDetails = detailsMap[o.id];
            return (
              <div key={o.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block">{o.po_no} • {o.po_date}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">
                      {poDetails?.items?.[0]?.material_name || 'Purchase Order'}
                      {poDetails?.items && poDetails.items.length > 1 && ` + ${poDetails.items.length - 1} more`}
                    </h4>
                    <span className="text-[11px] text-text-muted">{getSupplierName(o.supplier_id)}</span>
                  </div>
                  <Badge
                    variant={getStatusVariant(o.status_name || o.status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                  >
                    {o.status_name || o.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Items Count</span>
                    <span className="font-mono font-bold text-text-primary text-[11px]">{poDetails?.items?.length || '—'} items</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Grand Total</span>
                    <span className="font-mono font-bold text-primary text-[12px]">₹{Number(o.grand_total).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                  {isApproved(o) && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleDownloadPdf(o)}>
                      <Download className="w-3 h-3 mr-1 text-emerald-600" /> PDF
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(o)}>
                    <Eye className="w-3 h-3 mr-1" /> View PO
                  </Button>
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

      {/* View PO 360 Voucher Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.po_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{getSupplierName(viewingItem.supplier_id)} • {viewingItem.po_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div id="po-printable-area-main" className="p-5 space-y-4 overflow-y-auto text-xs flex-1 bg-white">
              {/* General Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">PO Date</span>
                  <span className="font-mono text-text-primary font-semibold">{viewingItem.po_date}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Target Delivery</span>
                  <span className="font-mono text-text-primary font-bold text-red-600">{viewingItem.expected_delivery_date}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Billing Project</span>
                  <span className="font-semibold text-text-primary">{viewingItem.project_name || `Project #${viewingItem.project_id}`}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Supplier GSTIN</span>
                  <span className="font-mono text-text-primary font-medium">{viewingItem.supplier_gstin || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Fulfillment Status</span>
                  <span className="font-bold text-primary">{viewingItem.status_name || viewingItem.status || 'Approved'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Destination Site</span>
                  <span className="text-text-primary font-medium">{viewingItem.site_name || (sites.find(s => String(s.id) === String(viewingItem.site_id))?.site_name) || 'Main Construction Site'}</span>
                </div>
              </div>

              {/* Vendor-Wise Grouped Items List */}
              <div className="space-y-3">
                <span className="font-bold text-text-primary block text-[12px] uppercase tracking-wider">
                  Purchase Order Materials (Grouped by Vendor)
                </span>
                {Object.keys(poVendorGroups).length === 0 ? (
                  <div className="p-4 text-center text-text-muted border border-border rounded-lg text-xs">No items found in purchase order.</div>
                ) : (
                  Object.entries(poVendorGroups).map(([vendorName, itemsList], gIdx) => (
                    <div key={gIdx} className="border border-border rounded-lg overflow-hidden bg-surface shadow-2xs">
                      {/* Vendor Card Header */}
                      <div className="bg-surface-muted/60 px-3.5 py-2 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-primary" />
                          <span className="font-bold text-text-primary text-[12px] uppercase tracking-wider">{vendorName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">{itemsList.length} Item(s)</span>
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-surface-muted/40 font-bold text-text-secondary border-b border-border">
                          <tr>
                            <th className="p-2">Material Item</th>
                            <th className="p-2 text-center">UOM</th>
                            <th className="p-2 text-right">Ordered Qty</th>
                            <th className="p-2 text-right">Unit Rate</th>
                            <th className="p-2 text-right">GST (18%)</th>
                            <th className="p-2 text-right">Total Amount</th>
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
              </div>

              {/* Financial Totals Ribbon */}
              {(() => {
                const itemsList = viewingItem.items || [];
                const calcTaxable = Number(viewingItem.taxable_amount || itemsList.reduce((acc, i) => acc + (Number(i.ordered_qty || 0) * Number(i.unit_rate || 0)), 0));
                const calcTax = Number(viewingItem.tax_amount || Math.round(calcTaxable * 0.18));
                const calcFreight = Number(viewingItem.freight_amount || 0);
                const calcGrandTotal = Number(viewingItem.grand_total || viewingItem.total_amount || (calcTaxable + calcTax + calcFreight));

                return (
                  <div className="grid grid-cols-4 gap-2 bg-emerald-50/20 border border-emerald-100 p-2.5 rounded-lg text-center font-mono">
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

              {/* PO Notes / Payment Terms */}
              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1 bg-surface-muted/10">
                  <span className="font-bold text-text-primary block text-[11px]">Commercial Notes & Vendor Agreement Scope:</span>
                  <p className="text-text-secondary text-[11px] leading-relaxed italic">"{viewingItem.notes}"</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isApproved(viewingItem) ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="w-3.5 h-3.5 mr-1 text-primary" /> Print PO
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
                      onClick={() => handleDownloadPdf(viewingItem)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Download PDF
                    </Button>
                  </>
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>PDF & Print available after PO is Approved by Admin.</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit PO Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); if (mrId) navigate('/procurement/purchase-orders'); }}
      >
        <EntityEditModal.Header
          icon={ShoppingCart}
          title={editingItem ? 'Edit Purchase Order' : 'Issue Purchase Order (PO)'}
          subtitle="Generate binding vendor supply contract with billing rates, GST tax, and delivery dates."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); if (mrId) navigate('/procurement/purchase-orders'); }}
        />
        <form id="po-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            {!editingItem && (
              <EntityEditModal.Section title="Import From Material Request">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
                  <FormField label="Select Approved Request (Autofills Materials, Vendor & Scope)">
                    <Select
                      options={[
                        { value: '', label: '-- Select Material Request to Autofill PO --' },
                        ...approvedRequests.map(r => ({
                          value: String(r.id),
                          label: `${r.approval_code || r.request_no || `MR-#${r.id}`} - ${r.project_name || 'Project'} (${r.site_name || 'Site'}) [${String(r.status_name || r.status || 'Active').toUpperCase()}]`
                        }))
                      ]}
                      value={selectedMrForImport}
                      onChange={(mrIdVal) => handleImportApprovedMR(mrIdVal)}
                      placeholder="Select Request to Import..."
                    />
                  </FormField>
                </div>
              </EntityEditModal.Section>
            )}

            <EntityEditModal.Section title="Purchase Order Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const matchingSite = sites.find(s => String(s.project_id) === String(v));
                      if (matchingSite) {
                        handleFormChange('site_id', String(matchingSite.id));
                        handleFormChange('site_name', matchingSite.site_name);
                      }
                    }}
                    placeholder="Select Project"
                  />
                </FormField>

                <FormField label="Delivery Site Location / Yard" required error={errors.site_id}>
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => {
                      handleFormChange('site_id', v);
                      const s = sites.find(site => String(site.id) === String(v));
                      if (s) handleFormChange('site_name', s.site_name);
                    }}
                    placeholder="Select Site Location"
                  />
                </FormField>

                <FormField label="PO Number" required error={errors.po_no}>
                  <Input
                    value={form.po_no}
                    onChange={(e) => handleFormChange('po_no', e.target.value)}
                    placeholder="PO-2026-095"
                  />
                </FormField>

                <FormField label="Expected Delivery Date">
                  <Input
                    type="date"
                    value={form.expected_delivery_date}
                    onChange={(e) => handleFormChange('expected_delivery_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Items List">
              <div className="space-y-3.5">
                {form.items && form.items.map((item, idx) => {
                  const selectedMat = materials.find(m => String(m.id) === String(item.material_id));
                  const baseUom = uoms.find(u => String(u.id) === String(selectedMat?.base_uom_id));
                  const itemErr = errors.items?.[idx] || {};

                  return (
                    <div key={idx} className="bg-surface-muted/30 p-3.5 rounded-lg border border-border/70 space-y-3">
                      {/* Card Header with Item # and Delete action */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-text-primary">
                            {selectedMat ? `${selectedMat.material_code} - ${selectedMat.material_name}` : `Item #${idx + 1}`}
                          </span>
                        </div>
                        {form.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-[11px] px-2 py-0"
                            onClick={() => {
                              setForm(prev => {
                                const nextItems = prev.items.filter((_, i) => i !== idx);
                                const freight = Number(prev.freight_amount) || 0;
                                const totalTaxable = nextItems.reduce((sum, item) => sum + (Number(item.taxable_amount) || 0), 0);
                                const totalTax = nextItems.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
                                return {
                                  ...prev,
                                  items: nextItems,
                                  taxable_amount: totalTaxable,
                                  tax_amount: totalTax,
                                  grand_total: totalTaxable + totalTax + freight
                                };
                              });
                            }}
                          >
                            ✕ Remove Item
                          </Button>
                        )}
                      </div>

                      {/* Row 1: Material Item (5 cols), Variant/Spec (3 cols), Supplier Vendor (4 cols) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5">
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
                              placeholder="Select Material Item..."
                            />
                          </FormField>
                        </div>

                        <div className="sm:col-span-3">
                          <FormField label="Variant / Spec">
                            <Input
                              value={item.specification || ''}
                              onChange={(e) => handleUpdateItem(idx, { specification: e.target.value })}
                              placeholder="e.g. 12mm, Fe500D"
                            />
                          </FormField>
                        </div>

                        <div className="sm:col-span-4">
                          <FormField label="Supplier Vendor" required error={itemErr.supplier_id}>
                            <Select
                              options={[
                                { value: '', label: 'Select Vendor...' },
                                ...suppliers.map(s => ({ value: String(s.id), label: s.supplier_name || `Vendor #${s.id}` }))
                              ]}
                              value={item.supplier_id || ''}
                              onChange={(v) => {
                                handleUpdateItem(idx, { supplier_id: v });
                                if (!form.supplier_id && v) {
                                  handleFormChange('supplier_id', v);
                                  const selectedSup = suppliers.find(s => String(s.id) === String(v));
                                  if (selectedSup) handleFormChange('supplier_gstin', selectedSup.gstin || '');
                                }
                              }}
                              placeholder="Select Vendor..."
                            />
                          </FormField>
                        </div>
                      </div>

                      {/* Row 2: UOM (2 cols), Order Qty (3 cols), Unit Rate (3 cols), Tax & Total Summary (4 cols) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                        <div className="sm:col-span-2">
                          <FormField label="UOM">
                            <Input
                              value={baseUom?.unit_code || baseUom?.unit_name || '—'}
                              disabled
                              className="bg-surface-muted/50 font-mono text-center h-9 font-semibold"
                            />
                          </FormField>
                        </div>

                        <div className="sm:col-span-3">
                          <FormField label="Order Qty" required error={itemErr.ordered_qty}>
                            <Input
                              type="number"
                              value={item.ordered_qty}
                              onChange={(e) => handleUpdateItem(idx, { ordered_qty: e.target.value })}
                              className="font-mono text-sm"
                              placeholder="Enter qty"
                            />
                          </FormField>
                        </div>

                        <div className="sm:col-span-3">
                          <FormField label="Unit Rate (₹)" required error={itemErr.unit_rate}>
                            <Input
                              type="number"
                              value={item.unit_rate}
                              onChange={(e) => handleUpdateItem(idx, { unit_rate: e.target.value })}
                              className="font-mono text-sm"
                              placeholder="Enter unit rate"
                            />
                          </FormField>
                        </div>

                        <div className="sm:col-span-4 bg-surface-muted/60 p-2.5 rounded-lg border border-border/50 flex items-center justify-between font-mono text-xs h-9.5">
                          <div>
                            <span className="text-text-muted text-[10px] uppercase block leading-none">Taxable (+18% GST)</span>
                            <span className="font-bold text-text-primary">₹{Number(item.taxable_amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text-muted text-[10px] uppercase block leading-none">Line Total</span>
                            <span className="font-extrabold text-primary text-sm">₹{Number((item.taxable_amount || 0) + (item.tax_amount || 0)).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
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
                      { material_id: '', uom_id: '', ordered_qty: '100', unit_rate: '0', taxable_amount: 0, tax_amount: 0, request_item_id: null }
                    ];
                    handleFormChange('items', nextItems);
                  }}
                  className="mt-1.5 text-xs"
                >
                  Add Another Item
                </Button>
              </div>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Taxes, Freight & Shipping Details">
              <EntityEditModal.Grid>
                <FormField label="Freight & Delivery Charges (₹)">
                  <Input
                    type="number"
                    value={form.freight_amount}
                    onChange={(e) => handleFormChange('freight_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Destination Site Address" className="md:col-span-2">
                  <Input
                    value={form.site_name}
                    onChange={(e) => handleFormChange('site_name', e.target.value)}
                    placeholder="e.g. Site Yard #3, Central Sector Grid"
                  />
                </FormField>

                <FormField label="Contract / Payment Notes" className="md:col-span-3">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Payment schedule, penalty clauses, warranty notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            {/* Financial Summary Ribbon */}
            <div className="border border-emerald-100 bg-emerald-50/20 rounded-lg p-3 grid grid-cols-4 gap-2 text-center font-mono">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Taxable Sum</span>
                <span className="font-bold text-text-primary">₹{Number(form.taxable_amount).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">GST Sum (18%)</span>
                <span className="font-bold text-text-primary">₹{Number(form.tax_amount).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Freight</span>
                <span className="font-bold text-text-primary">₹{Number(form.freight_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-950 uppercase font-bold block">PO Value Commitment</span>
                <span className="font-extrabold text-[13px] text-emerald-700">₹{Number(form.grand_total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="po-form"
            submitLabel={editingItem ? 'Update Contract' : 'Dispatch Purchase Order'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); if (mrId) navigate('/procurement/purchase-orders'); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Purchase Order"
        description={`Are you sure you want to delete purchase order "${deleteItem?.po_no}"?`}
        confirmLabel="Delete"
        destructive={true}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
