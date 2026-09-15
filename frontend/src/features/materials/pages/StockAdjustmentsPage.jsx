import { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, AlertTriangle, ArrowUpDown, ArrowUpFromLine, XCircle
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
import { projectsApi, sitesApi, materialsApi, materialManagementApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  adjustment_no: '',
  adjustment_date: '',
  material_id: '',
  uom_id: '',
  book_qty: '100',
  physical_qty: '98',
  variance_qty: '-2',
  unit_rate: '385',
  variance_value: '-770',
  adjustment_type: 'Handling Loss / Wastage',
  auditor_name: 'Audit Lead',
  reason: '',
};

export function StockAdjustmentsPage() {
  const { user, hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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

  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [transactionStatuses, setTransactionStatuses] = useState([]);

  const fetchAdjustmentsList = async (pList = projects, sList = sites) => {
    setLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        materialManagementApi.transactions.list({ transaction_type_id: 4 }).catch(() => ({ data: [] })),
        materialManagementApi.transactions.list({ transaction_type_id: 5 }).catch(() => ({ data: [] }))
      ]);
      const inList = inRes?.data?.material_transactions ?? inRes?.data?.data ?? [];
      const outList = outRes?.data?.material_transactions ?? outRes?.data?.data ?? [];
      const tList = [...inList, ...outList];

      if (Array.isArray(tList)) {
        const normalized = tList.map((t, idx) => {
          const project = pList.find(p => String(p.id) === String(t.project_id));
          const site = sList.find(s => String(s.id) === String(t.from_site_id || t.to_site_id));
          
          let book_qty = 100;
          let physical_qty = 98;
          let adjustment_type = 'Handling Loss';
          let auditor_name = 'Audit Lead';
          let actualRemarks = t.remarks || '';
          try {
            const parsed = JSON.parse(t.remarks);
            if (parsed && typeof parsed === 'object') {
              book_qty = parsed.book_qty !== undefined ? Number(parsed.book_qty) : 100;
              physical_qty = parsed.physical_qty !== undefined ? Number(parsed.physical_qty) : 98;
              adjustment_type = parsed.adjustment_type || 'Handling Loss';
              auditor_name = parsed.auditor_name || 'Audit Lead';
              actualRemarks = parsed.remarks || '';
            }
          } catch {
            // Not JSON
          }

          const diff = Number((physical_qty - book_qty).toFixed(2));
          const totalVal = Math.round(diff * Number(t.unit_rate || 0));

          return {
            ...t,
            id: t.id || idx + 1,
            project_code: project?.project_code || 'PRJ-2026-001',
            project_name: project?.project_name || 'Civil Project',
            site_name: site?.site_name || 'Site Yard',
            adjustment_no: t.transaction_no,
            adjustment_date: t.transaction_date,
            material_name: t.material_name || 'Construction Material',
            book_qty: book_qty,
            physical_qty: physical_qty,
            variance_qty: diff,
            unit_rate: Number(t.unit_rate || 0),
            variance_value: totalVal,
            adjustment_type: adjustment_type,
            auditor_name: auditor_name,
            status: t.status_name || 'Approved & Reconciled',
            reason: actualRemarks,
          };
        });
        setAdjustments(normalized);
      }
    } catch {
      // Keep empty
    } finally {
      setLoading(false);
    }
  };

  // Load Projects & API Data safely
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
    ]).then(([projRes, sitesRes, catRes, mastersRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const mastersData = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      const uList = mastersData?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const sStatuses = mastersData?.transaction_statuses ?? [];
      setTransactionStatuses(Array.isArray(sStatuses) ? sStatuses : []);

      fetchAdjustmentsList(parsedProjects, sList);
    }).catch(() => setLoading(false));
  }, []);

  const handleDocumentAction = async (item, actionName) => {
    setLoading(true);
    try {
      if (actionName === 'post') {
        await materialManagementApi.transactions.postTransaction(item.id);
      } else {
        await materialManagementApi.transactions.action(item.id, actionName);
      }
      toast.success(`Adjustment ${actionName} successful.`);
      await fetchAdjustmentsList();
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName} adjustment.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = (item) => handleDocumentAction(item, 'submit');
  const handleApprove = (item) => handleDocumentAction(item, 'approve');
  const handleReject = (item) => handleDocumentAction(item, 'reject');
  const handlePost = (item) => handleDocumentAction(item, 'post');


  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      adjustment_no: `SAN-2026-01${adjustments.length + 1}`,
      adjustment_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.transactions.get(item.id);
      const fullTx = res?.data?.transaction ?? res?.transaction ?? {};
      const firstItem = fullTx.items?.[0] ?? {};

      let book_qty = 100;
      let physical_qty = 98;
      let adjustment_type = 'Handling Loss';
      let auditor_name = 'Audit Lead';
      let actualRemarks = fullTx.remarks || '';
      try {
        const parsed = JSON.parse(fullTx.remarks);
        if (parsed && typeof parsed === 'object') {
          book_qty = parsed.book_qty !== undefined ? Number(parsed.book_qty) : 100;
          physical_qty = parsed.physical_qty !== undefined ? Number(parsed.physical_qty) : 98;
          adjustment_type = parsed.adjustment_type || 'Handling Loss';
          auditor_name = parsed.auditor_name || 'Audit Lead';
          actualRemarks = parsed.remarks || '';
        }
      } catch {
        // Not JSON
      }

      const diff = Number((physical_qty - book_qty).toFixed(2));

      setForm({
        project_id: String(fullTx.project_id || ''),
        site_id: String(fullTx.from_site_id || fullTx.to_site_id || ''),
        adjustment_no: fullTx.transaction_no || '',
        adjustment_date: fullTx.transaction_date || '',
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        book_qty: String(book_qty),
        physical_qty: String(physical_qty),
        variance_qty: String(diff),
        unit_rate: String(firstItem.unit_rate || '385'),
        variance_value: String(Math.round(diff * Number(firstItem.unit_rate || 385))),
        adjustment_type: adjustment_type,
        auditor_name: auditor_name,
        reason: actualRemarks,
      });
      setErrors({});
      setEditingItem(fullTx);
    } catch {
      toast.error('Failed to load transaction details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'book_qty' || field === 'physical_qty' || field === 'unit_rate') {
        const book = Number(field === 'book_qty' ? value : prev.book_qty) || 0;
        const phys = Number(field === 'physical_qty' ? value : prev.physical_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        const diff = Number((phys - book).toFixed(2));
        next.variance_qty = String(diff);
        next.variance_value = String(Math.round(diff * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.adjustment_no.trim()) errs.adjustment_no = 'SAN No is required';
    if (!form.material_id) errs.material_id = 'Material item is required';
    if (!form.site_id) errs.site_id = 'Site location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const book = Number(form.book_qty || 0);
      const phys = Number(form.physical_qty || 0);
      const rate = Number(form.unit_rate || 0);
      const diff = Number((phys - book).toFixed(2));

      const isNegative = diff < 0;
      const typeId = isNegative ? 5 : 4; // 5 = ADJUSTMENT_OUT, 4 = ADJUSTMENT_IN

      const remarksPayload = JSON.stringify({
        book_qty: form.book_qty,
        physical_qty: form.physical_qty,
        adjustment_type: form.adjustment_type,
        auditor_name: form.auditor_name,
        remarks: form.reason
      });

      const headerPayload = {
        project_id: Number(form.project_id),
        transaction_no: form.adjustment_no,
        transaction_date: form.adjustment_date,
        transaction_type_id: typeId,
        purpose: 'Inventory Reconciliation Audit',
        issued_by: user?.id ? Number(user.id) : null,
        remarks: remarksPayload
      };

      if (isNegative) {
        headerPayload.from_site_id = Number(form.site_id);
      } else {
        headerPayload.to_site_id = Number(form.site_id);
      }

      if (editingItem?.id) {
        await materialManagementApi.transactions.update(editingItem.id, headerPayload);

        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.transactions.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Math.abs(diff),
            unit_rate: rate
          });
        }
        toast.success('Stock adjustment updated.');
      } else {
        const headerRes = await materialManagementApi.transactions.create(headerPayload);

        const txId = headerRes?.data?.transaction?.id ?? headerRes?.transaction?.id;
        if (txId) {
          await materialManagementApi.transactions.addItem(txId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Math.abs(diff),
            unit_rate: rate
          });
        }
        toast.success('Stock adjustment note (SAN) reconciled.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchAdjustmentsList();
    } catch {
      toast.error('Failed to save stock adjustment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setLoading(true);
    try {
      await materialManagementApi.transactions.remove(deleteItem.id);
      toast.success('Stock adjustment removed.');
      await fetchAdjustmentsList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete stock adjustment.');
    } finally {
      setLoading(false);
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return adjustments.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (a.adjustment_no || '').toLowerCase();
        const mat = (a.material_name || '').toLowerCase();
        const type = (a.adjustment_type || '').toLowerCase();
        const reas = (a.reason || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !type.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [adjustments, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const netVarianceValue = useMemo(() => adjustments.reduce((acc, a) => acc + Number(a.variance_value || 0), 0), [adjustments]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Adjustments' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Physical Stock Audit & Adjustment Notes (SAN)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Audited SANs"
            value={adjustments.length}
            status="primary"
            icon={<SlidersHorizontal className="w-4 h-4" />}
          />
          <KpiCard
            label="Net Reconciliation Value"
            value={`₹${Math.abs(netVarianceValue).toLocaleString('en-IN')}`}
            status={netVarianceValue < 0 ? 'warning' : 'success'}
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Physical Loss Tally"
            value="1 SAN"
            status="neutral"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Audit Status"
            value="100% Reconciled"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search SAN no, material, adjustment type..."
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
              title="Print Audit Register"
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
              New Adjustment (SAN)
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
                  <th className="px-3 py-2 w-28">SAN Ref</th>
                  <th className="px-3 py-2">Material Item & Store</th>
                  <th className="px-3 py-2 text-right w-24">Book Qty</th>
                  <th className="px-3 py-2 text-right w-24">Physical Qty</th>
                  <th className="px-3 py-2 text-right w-24">Variance (+/-)</th>
                  <th className="px-3 py-2 text-right w-28">Variance (₹)</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Adjustment Reason</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock adjustments...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No stock adjustment notes found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {a.adjustment_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{a.adjustment_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.material_name}>
                            {a.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {a.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {a.book_qty} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {a.physical_qty} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                        <span className={a.variance_qty < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {a.variance_qty > 0 ? `+${a.variance_qty}` : a.variance_qty} {a.uom}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                        <span className={a.variance_value < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {a.variance_value > 0 ? `+₹${Math.abs(a.variance_value).toLocaleString('en-IN')}` : `-₹${Math.abs(a.variance_value).toLocaleString('en-IN')}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate" title={a.adjustment_type}>
                        {a.adjustment_type}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View SAN 360"
                            onClick={() => setViewingItem(a)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {(a.status_name === 'Submitted' || a.status === 'Pending Approval') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve"
                                onClick={() => handleApprove(a)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(a)}
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          
                          {(a.status_code || a.status_name || a.status || '').toUpperCase().includes('DRAFT') && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Submit Adjustment"
                                onClick={() => handleSubmitRequest(a)}
                              >
                                <ArrowUpFromLine className="w-3 h-3 mr-0.5" /> Submit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Edit"
                                onClick={() => handleOpenEdit(a)}
                              >
                                <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Delete"
                                onClick={() => setDeleteItem(a)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                              </Button>
                            </div>
                          )}

                          {String(a.status_name || a.status).toUpperCase().includes('APPROVED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Post to Ledger"
                              onClick={() => handlePost(a)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Post
                            </Button>
                          )}
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
          {paged.map((a, idx) => (
            <div key={a.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.adjustment_no} • {a.adjustment_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{a.adjustment_type}</span>
                </div>
                <Badge
                  variant={a.variance_qty < 0 ? 'warning' : 'success'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {a.variance_qty > 0 ? `+${a.variance_qty}` : a.variance_qty} {a.uom}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Book vs Physical</span>
                  <span className="font-mono text-text-primary text-[11px]">{a.book_qty} ➔ {a.physical_qty} {a.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Variance Value</span>
                  <span className={`font-mono font-bold text-[12px] ${a.variance_value < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ₹{Math.abs(a.variance_value).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View SAN
                </Button>
                {(a.status_code || a.status || '').toUpperCase().includes('DRAFT') && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(a)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                )}
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

      {/* View SAN 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.adjustment_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.adjustment_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Book Stock Qty</span> <span className="font-mono text-text-primary">{viewingItem.book_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Physical Audit Count</span> <span className="font-mono font-bold text-primary">{viewingItem.physical_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Discrepancy Variance</span> <span className={`font-bold font-mono ${viewingItem.variance_qty < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{viewingItem.variance_qty > 0 ? `+${viewingItem.variance_qty}` : viewingItem.variance_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Reconciliation Value</span> <span className={`font-bold font-mono ${viewingItem.variance_value < 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{Math.abs(viewingItem.variance_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Adjustment Reason</span> <span className="text-text-primary">{viewingItem.adjustment_type}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Auditor Sign-Off</span> <span className="text-text-primary">{viewingItem.auditor_name}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Audited Storage Bay</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.reason && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Audit Remarks & Findings:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print SAN Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit SAN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={SlidersHorizontal}
          title={editingItem ? 'Edit Stock Adjustment' : 'Reconcile Physical Stock (SAN)'}
          subtitle="Log physical audit count variance against system book balance with justification."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="san-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Audit Location & Material">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="SAN Number" required error={errors.adjustment_no}>
                  <Input
                    value={form.adjustment_no}
                    onChange={(e) => handleFormChange('adjustment_no', e.target.value)}
                    placeholder="SAN-2026-018"
                  />
                </FormField>

                <FormField label="Material Item" required error={errors.material_id} className="md:col-span-2">
                  <Select
                    options={materials.map(m => ({ value: String(m.id), label: `${m.material_code} - ${m.material_name}` }))}
                    value={form.material_id}
                    onChange={(v) => {
                      const selectedMat = materials.find(mat => String(mat.id) === String(v));
                      handleFormChange('material_id', v);
                      if (selectedMat?.base_uom_id) {
                        handleFormChange('uom_id', String(selectedMat.base_uom_id));
                      }
                    }}
                    placeholder="Select Material"
                  />
                </FormField>

                <FormField label="Storage Site Yard" required error={errors.site_id} className="md:col-span-2">
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Storage Site Yard"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Book Qty vs Physical Count Variance">
              <EntityEditModal.Grid>
                <FormField label="System Book Qty">
                  <Input
                    type="number"
                    value={form.book_qty}
                    onChange={(e) => handleFormChange('book_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Physical Audit Count">
                  <Input
                    type="number"
                    value={form.physical_qty}
                    onChange={(e) => handleFormChange('physical_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Calculated Variance">
                  <Input
                    readOnly
                    className="font-mono font-bold bg-surface-muted"
                    value={form.variance_qty}
                  />
                </FormField>

                <FormField label="Unit Valuation Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Adjustment Reason Type" className="md:col-span-2">
                  <Select
                    options={[
                      { value: 'Handling Loss / Wastage', label: 'Handling Loss / Wastage' },
                      { value: 'Physical Excess Reconciliation', label: 'Physical Excess Reconciliation' },
                      { value: 'Moisture / Density Variation', label: 'Moisture / Density Variation' },
                      { value: 'Site Damage / Burst Loss', label: 'Site Damage / Burst Loss' },
                    ]}
                    value={form.adjustment_type}
                    onChange={(v) => handleFormChange('adjustment_type', v)}
                  />
                </FormField>

                <FormField label="Auditor Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Explain discrepancy cause and corrective storage measures..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="san-form"
            submitLabel={editingItem ? 'Update SAN' : 'Reconcile Stock'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Stock Adjustment"
        message={`Are you sure you want to delete "${deleteItem?.adjustment_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
