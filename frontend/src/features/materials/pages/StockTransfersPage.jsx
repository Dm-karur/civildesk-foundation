import { useState, useEffect, useMemo } from 'react';
import {
  Truck, CheckCircle2, ArrowRight, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, MapPin, Printer, ArrowUpFromLine, XCircle
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
  transfer_no: '',
  transfer_date: '',
  from_site_id: '',
  to_site_id: '',
  vehicle_no: '',
  material_id: '',
  uom_id: '',
  transfer_qty: '50',
  unit_rate: '385',
  transfer_value: '19250',
  status: 'In-Transit',
  dispatched_by: 'Store Incharge',
  purpose: '',
};

export function StockTransfersPage() {
  const { user, hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [transactionStatuses, setTransactionStatuses] = useState([]);

  const fetchTransfersList = async (pList = projects, sList = sites) => {
    setLoading(true);
    try {
      const txRes = await materialManagementApi.transactions.list({ transaction_type_id: 3 });
      const tList = txRes?.data?.material_transactions ?? txRes?.data?.data ?? [];
      if (Array.isArray(tList)) {
        const normalized = tList.map((t, idx) => {
          const project = pList.find(p => String(p.id) === String(t.project_id));
          const fromSite = sList.find(s => String(s.id) === String(t.from_site_id));
          const toSite = sList.find(s => String(s.id) === String(t.to_site_id));
          
          let vehicle_no = '';
          let dispatched_by = 'Store Incharge';
          let actualRemarks = t.remarks || '';
          try {
            const parsed = JSON.parse(t.remarks);
            if (parsed && typeof parsed === 'object') {
              vehicle_no = parsed.vehicle_no || '';
              dispatched_by = parsed.dispatched_by_name || 'Store Incharge';
              actualRemarks = parsed.remarks || '';
            }
          } catch {
            // Not JSON
          }

          return {
            ...t,
            id: t.id || idx + 1,
            project_code: project?.project_code || 'PRJ-2026-001',
            project_name: project?.project_name || 'Civil Project',
            from_site_name: fromSite?.site_name || 'Central Godown',
            to_site_name: toSite?.site_name || 'Site Yard',
            transfer_no: t.transaction_no,
            transfer_date: t.transaction_date,
            vehicle_no: vehicle_no,
            material_name: t.material_name || 'Construction Material',
            transfer_qty: Number(t.quantity || t.transfer_qty || 0),
            unit_rate: Number(t.unit_rate || 0),
            transfer_value: Number(t.line_value || (t.quantity * t.unit_rate) || 0),
            status: t.status_name || 'In-Transit',
            dispatched_by: dispatched_by,
            purpose: actualRemarks,
          };
        });
        setTransfers(normalized);
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

      fetchTransfersList(parsedProjects, sList);
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
      toast.success(`Transaction ${actionName} successful.`);
      await fetchTransfersList();
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName} transaction.`);
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
      transfer_no: `STN-2026-04${transfers.length + 1}`,
      transfer_date: today,
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

      let vehicle_no = '';
      let dispatched_by = 'Store Incharge';
      let actualRemarks = fullTx.remarks || '';
      try {
        const parsed = JSON.parse(fullTx.remarks);
        if (parsed && typeof parsed === 'object') {
          vehicle_no = parsed.vehicle_no || '';
          dispatched_by = parsed.dispatched_by_name || 'Store Incharge';
          actualRemarks = parsed.remarks || '';
        }
      } catch {
        // Not JSON
      }

      setForm({
        project_id: String(fullTx.project_id || ''),
        transfer_no: fullTx.transaction_no || '',
        transfer_date: fullTx.transaction_date || '',
        from_site_id: String(fullTx.from_site_id || ''),
        to_site_id: String(fullTx.to_site_id || ''),
        vehicle_no: vehicle_no,
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        transfer_qty: String(firstItem.quantity || '50'),
        unit_rate: String(firstItem.unit_rate || '385'),
        transfer_value: String(firstItem.line_value || Math.round(Number(firstItem.quantity || 0) * Number(firstItem.unit_rate || 0))),
        status: fullTx.status_name || 'In-Transit',
        dispatched_by: dispatched_by,
        purpose: actualRemarks,
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
      if (field === 'transfer_qty' || field === 'unit_rate') {
        const qty = Number(field === 'transfer_qty' ? value : prev.transfer_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.transfer_value = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.transfer_no.trim()) errs.transfer_no = 'Transfer No is required';
    if (!form.material_id) errs.material_id = 'Material item is required';
    if (!form.from_site_id) errs.from_site_id = 'Source location is required';
    if (!form.to_site_id) errs.to_site_id = 'Destination location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const remarksPayload = JSON.stringify({
        vehicle_no: form.vehicle_no,
        dispatched_by_name: form.dispatched_by,
        remarks: form.purpose
      });

      if (editingItem?.id) {
        await materialManagementApi.transactions.update(editingItem.id, {
          project_id: Number(form.project_id),
          transaction_no: form.transfer_no,
          transaction_date: form.transfer_date,
          from_site_id: Number(form.from_site_id),
          to_site_id: Number(form.to_site_id),
          purpose: 'Stock Transfer Note',
          issued_by: user?.id ? Number(user.id) : null,
          remarks: remarksPayload
        });

        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.transactions.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.transfer_qty),
            unit_rate: Number(form.unit_rate)
          });
        }
        toast.success('Stock transfer updated.');
      } else {
        const headerRes = await materialManagementApi.transactions.create({
          project_id: Number(form.project_id),
          transaction_no: form.transfer_no,
          transaction_date: form.transfer_date,
          transaction_type_id: 3, // TRANSFER
          from_site_id: Number(form.from_site_id),
          to_site_id: Number(form.to_site_id),
          purpose: 'Stock Transfer Note',
          issued_by: user?.id ? Number(user.id) : null,
          remarks: remarksPayload
        });

        const txId = headerRes?.data?.transaction?.id ?? headerRes?.transaction?.id;
        if (txId) {
          await materialManagementApi.transactions.addItem(txId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.transfer_qty),
            unit_rate: Number(form.unit_rate)
          });
        }
        toast.success('Inter-site stock transfer note (STN) created.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchTransfersList();
    } catch {
      toast.error('Failed to save stock transfer.');
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async (item) => {
    // Acknowledge logic translates to posting the transaction in our context for transit flows
    await handleDocumentAction(item, 'post');
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setLoading(true);
    try {
      await materialManagementApi.transactions.remove(deleteItem.id);
      toast.success('Stock transfer removed.');
      await fetchTransfersList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete stock transfer.');
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
    return transfers.filter(t => {
      if (selectedProjectId !== 'all' && String(t.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (t.transfer_no || '').toLowerCase();
        const from = (t.from_site_name || '').toLowerCase();
        const to = (t.to_site_name || '').toLowerCase();
        const mat = (t.material_name || '').toLowerCase();
        const veh = (t.vehicle_no || '').toLowerCase();
        if (!no.includes(q) && !from.includes(q) && !to.includes(q) && !mat.includes(q) && !veh.includes(q)) return false;
      }
      return true;
    });
  }, [transfers, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalTransferValue = useMemo(() => transfers.reduce((acc, t) => acc + Number(t.transfer_value || 0), 0), [transfers]);
  const inTransitCount = useMemo(() => transfers.filter(t => t.status === 'In-Transit').length, [transfers]);

  const getStatusVariant = (status) => {
    if (status === 'Received & Accepted') return 'success';
    if (status === 'In-Transit') return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Transfers' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inter-Site Stock Transfer Notes (STN)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total STN Transfers"
            value={transfers.length}
            status="primary"
            icon={<Truck className="w-4 h-4" />}
          />
          <KpiCard
            label="Transfers In-Transit"
            value={`${inTransitCount} Loads`}
            status={inTransitCount > 0 ? 'info' : 'success'}
            icon={<MapPin className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Total Transfer Value"
            value={`₹${totalTransferValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Transfer Health"
            value="100% Tracked"
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
                  { value: 'In-Transit', label: 'In-Transit (On Road)' },
                  { value: 'Received & Accepted', label: 'Received & Accepted' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search STN, origin, destination, vehicle..."
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
              title="Print Transfer Register"
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
              New Stock Transfer (STN)
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
                  <th className="px-3 py-2 w-28">STN No.</th>
                  <th className="px-3 py-2">Transfer Route (From ➔ To)</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Vehicle No.</th>
                  <th className="px-3 py-2 text-right w-24">Qty Sent</th>
                  <th className="px-3 py-2 text-right w-28">Total Value</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock transfers...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No stock transfers found matching criteria.
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
                          {t.transfer_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{t.transfer_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[12px] truncate" title={t.from_site_name}>
                            {t.from_site_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                            ➔ <span className="text-primary font-semibold">{t.to_site_name}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={t.material_name}>
                          {t.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {t.vehicle_no || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {t.transfer_qty} {t.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(t.transfer_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(t.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View STN 360"
                            onClick={() => setViewingItem(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {(t.status_name === 'Submitted' || t.status === 'Pending Approval') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve"
                                onClick={() => handleApprove(t)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(t)}
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          
                          {(t.status_code || t.status_name || t.status || '').toUpperCase().includes('DRAFT') && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Submit Transfer"
                                onClick={() => handleSubmitRequest(t)}
                              >
                                <ArrowUpFromLine className="w-3 h-3 mr-0.5" /> Submit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Edit"
                                onClick={() => handleOpenEdit(t)}
                              >
                                <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Delete"
                                onClick={() => setDeleteItem(t)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                              </Button>
                            </div>
                          )}

                          {String(t.status_name || t.status).toUpperCase().includes('APPROVED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Post to Ledger (Transit)"
                              onClick={() => handlePost(t)}
                            >
                              <Truck className="w-3 h-3 mr-0.5" /> Dispatch
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
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{t.transfer_no} • {t.transfer_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{t.from_site_name} ➔ {t.to_site_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(t.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {t.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Qty Sent</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{t.transfer_qty} {t.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Transfer Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(t.transfer_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(t)}>
                  <Eye className="w-3 h-3 mr-1" /> View STN
                </Button>
                {(t.status_code || t.status || '').toUpperCase().includes('DRAFT') && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(t)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                )}
                {t.status === 'In-Transit' && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAcknowledge(t)}>
                    <Check className="w-3 h-3 mr-1" /> Receive
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

      {/* View STN 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.transfer_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.transfer_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transfer Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.transfer_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transfer Value</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.transfer_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transit Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transport Vehicle</span> <span className="font-mono text-text-primary">{viewingItem.vehicle_no || 'Site Internal Cart'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Origin Location</span> <span className="text-text-primary font-medium">{viewingItem.from_site_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Destination Site</span> <span className="text-primary font-bold">{viewingItem.to_site_name}</span></div>
              </div>

              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Transfer Purpose:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.purpose}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Transfer Pass
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit STN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Truck}
          title={editingItem ? 'Edit Stock Transfer (STN)' : 'New Inter-Site Stock Transfer (STN)'}
          subtitle="Dispatch stock between central warehouse, godowns, and active project site yards."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="stn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Transfer Routing & Vehicle">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Transfer Note Number" required error={errors.transfer_no}>
                  <Input
                    value={form.transfer_no}
                    onChange={(e) => handleFormChange('transfer_no', e.target.value)}
                    placeholder="STN-2026-045"
                  />
                </FormField>

                <FormField label="From (Origin Store)" required error={errors.from_site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.from_site_id}
                    onChange={(v) => handleFormChange('from_site_id', v)}
                    placeholder="Select Origin Store"
                  />
                </FormField>

                <FormField label="To (Destination Site)" required error={errors.to_site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.to_site_id}
                    onChange={(v) => handleFormChange('to_site_id', v)}
                    placeholder="Select Destination Site"
                  />
                </FormField>

                <FormField label="Vehicle Number" className="md:col-span-2">
                  <Input
                    value={form.vehicle_no}
                    onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                    placeholder="TN-45-AZ-9901"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Transfer Quantities">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_id}>
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

                <FormField label="Transfer Quantity">
                  <Input
                    type="number"
                    value={form.transfer_qty}
                    onChange={(e) => handleFormChange('transfer_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Valuation Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Value (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-primary bg-surface-muted"
                    value={`₹${Number(form.transfer_value).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Transfer Purpose" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="Describe specific reason or urgent pour requirements..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="stn-form"
            submitLabel={editingItem ? 'Update STN' : 'Dispatch Transfer'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Stock Transfer"
        message={`Are you sure you want to delete "${deleteItem?.transfer_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
