import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, Truck, FileText, ArrowUpFromLine, XCircle
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
  challan_no: '',
  challan_date: '',
  consignee_name: '',
  transporter_name: '',
  vehicle_no: '',
  driver_name: '',
  material_id: '',
  uom_id: '',
  dispatched_qty: '50',
  gate_pass_no: '',
  status: 'Gate Outward Stamped',
  prepared_by: 'Dispatch Incharge',
  notes: '',
};

export function DeliveryChallansPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [challans, setChallans] = useState([]);
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

  const fetchChallansList = async (pList = projects, sList = sites) => {
    setLoading(true);
    try {
      const txRes = await materialManagementApi.transactions.list({ transaction_type_id: 3 });
      const tList = txRes?.data?.material_transactions ?? txRes?.data?.data ?? [];
      if (Array.isArray(tList)) {
        const normalized = [];
        tList.forEach((t, idx) => {
          let isDc = false;
          let gate_pass_no = '';
          let transporter_name = '';
          let vehicle_no = '';
          let driver_name = '';
          let notes = t.remarks || '';
          
          try {
            const parsed = JSON.parse(t.remarks);
            if (parsed && typeof parsed === 'object') {
              isDc = parsed.is_delivery_challan === true;
              gate_pass_no = parsed.gate_pass_no || '';
              transporter_name = parsed.transporter_name || '';
              vehicle_no = parsed.vehicle_no || '';
              driver_name = parsed.driver_name || '';
              notes = parsed.remarks || '';
            }
          } catch {
            // Not JSON
          }

          if (isDc) {
            const project = pList.find(p => String(p.id) === String(t.project_id));
            const site = sList.find(s => String(s.id) === String(t.from_site_id));

            normalized.push({
              ...t,
              id: t.id || idx + 1,
              project_code: project?.project_code || 'PRJ-2026-001',
              project_name: project?.project_name || 'Civil Project',
              site_name: site?.site_name || 'Dispatch store',
              challan_no: t.transaction_no,
              challan_date: t.transaction_date,
              consignee_name: t.received_by || 'Destination Site',
              transporter_name: transporter_name,
              vehicle_no: vehicle_no,
              driver_name: driver_name,
              material_name: t.material_name || 'Construction Material',
              dispatched_qty: Number(t.quantity || 0),
              gate_pass_no: gate_pass_no,
              status: t.status_name || 'Gate Outward Stamped',
              prepared_by: t.issued_by || 'Dispatch Incharge',
              notes: notes,
            });
          }
        });
        setChallans(normalized);
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

      fetchChallansList(parsedProjects, sList);
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
      toast.success(`Challan ${actionName} successful.`);
      await fetchChallansList();
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName} challan.`);
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
      challan_no: `DC-2026-09${challans.length + 1}`,
      challan_date: today,
      gate_pass_no: `GP-OUT-${9000 + challans.length}`,
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

      let gate_pass_no = '';
      let transporter_name = '';
      let vehicle_no = '';
      let driver_name = '';
      let notes = fullTx.remarks || '';
      
      try {
        const parsed = JSON.parse(fullTx.remarks);
        if (parsed && typeof parsed === 'object') {
          gate_pass_no = parsed.gate_pass_no || '';
          transporter_name = parsed.transporter_name || '';
          vehicle_no = parsed.vehicle_no || '';
          driver_name = parsed.driver_name || '';
          notes = parsed.remarks || '';
        }
      } catch {
        // Not JSON
      }

      setForm({
        project_id: String(fullTx.project_id || ''),
        site_id: String(fullTx.from_site_id || ''),
        challan_no: fullTx.transaction_no || '',
        challan_date: fullTx.transaction_date || '',
        consignee_name: fullTx.received_by || '',
        transporter_name: transporter_name,
        vehicle_no: vehicle_no,
        driver_name: driver_name,
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        dispatched_qty: String(firstItem.quantity || '50'),
        gate_pass_no: gate_pass_no,
        status: fullTx.status_name || 'Gate Outward Stamped',
        prepared_by: fullTx.issued_by || 'Dispatch Incharge',
        notes: notes,
      });
      setErrors({});
      setEditingItem(fullTx);
    } catch {
      toast.error('Failed to load challan details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.challan_no.trim()) errs.challan_no = 'Challan No is required';
    if (!form.material_id) errs.material_id = 'Material item is required';
    if (!form.site_id) errs.site_id = 'Dispatch site store is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const remarksPayload = JSON.stringify({
        is_delivery_challan: true,
        gate_pass_no: form.gate_pass_no,
        transporter_name: form.transporter_name,
        vehicle_no: form.vehicle_no,
        driver_name: form.driver_name,
        remarks: form.notes
      });

      if (editingItem?.id) {
        await materialManagementApi.transactions.update(editingItem.id, {
          project_id: Number(form.project_id),
          transaction_no: form.challan_no,
          transaction_date: form.challan_date,
          from_site_id: Number(form.site_id),
          purpose: 'Outbound Delivery Challan Dispatch',
          issued_by: form.prepared_by,
          received_by: form.consignee_name,
          remarks: remarksPayload
        });

        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.transactions.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.dispatched_qty),
            unit_rate: 0 // challans do not mandate direct financial value
          });
        }
        toast.success('Delivery challan updated.');
      } else {
        const headerRes = await materialManagementApi.transactions.create({
          project_id: Number(form.project_id),
          transaction_no: form.challan_no,
          transaction_date: form.challan_date,
          transaction_type_id: 3, // TRANSFER
          from_site_id: Number(form.site_id),
          purpose: 'Outbound Delivery Challan Dispatch',
          issued_by: form.prepared_by,
          received_by: form.consignee_name,
          remarks: remarksPayload
        });

        const txId = headerRes?.data?.transaction?.id ?? headerRes?.transaction?.id;
        if (txId) {
          await materialManagementApi.transactions.addItem(txId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.dispatched_qty),
            unit_rate: 0
          });
        }
        toast.success('Delivery challan note generated.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchChallansList();
    } catch {
      toast.error('Failed to save delivery challan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setLoading(true);
    try {
      await materialManagementApi.transactions.remove(deleteItem.id);
      toast.success('Delivery challan removed.');
      await fetchChallansList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete delivery challan.');
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
    return challans.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (c.challan_no || '').toLowerCase();
        const mat = (c.material_name || '').toLowerCase();
        const dest = (c.consignee_name || '').toLowerCase();
        const veh = (c.vehicle_no || '').toLowerCase();
        const gp = (c.gate_pass_no || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !dest.includes(q) && !veh.includes(q) && !gp.includes(q)) return false;
      }
      return true;
    });
  }, [challans, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (status) => {
    if (status.includes('Delivered')) return 'success';
    if (status.includes('Stamped')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Delivery Challans' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Delivery Challans & Dispatch Gate Passes"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Dispatched Challans"
            value={challans.length}
            status="primary"
            icon={<FileCheck2 className="w-4 h-4" />}
          />
          <KpiCard
            label="Gate Pass Outward Stamped"
            value="1 Challan"
            status="info"
            icon={<Truck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Delivered & Acknowledged"
            value="1 Challan"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Transporters Active"
            value="2 Fleets"
            status="neutral"
            icon={<Layers className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Gate Status' },
                  { value: 'Gate Outward Stamped', label: 'Gate Outward Stamped' },
                  { value: 'Delivered & Acknowledged', label: 'Delivered & Acknowledged' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search challan, destination, vehicle..."
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
              title="Print Challan Register"
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
              New Delivery Challan
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
                  <th className="px-3 py-2 w-28">Challan Ref</th>
                  <th className="px-3 py-2">Consignee Destination</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">Qty Sent</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Vehicle No.</th>
                  <th className="px-3 py-2 text-center w-28 hidden lg:table-cell">Gate Pass</th>
                  <th className="px-3 py-2 text-center w-32">Security Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading delivery challans...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No delivery challans found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {c.challan_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{c.challan_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.consignee_name}>
                            {c.consignee_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.transporter_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={c.material_name}>
                          {c.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {c.dispatched_qty} {c.uom}
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {c.vehicle_no || '—'}
                      </td>
                      <td className="px-3 py-2 text-center hidden lg:table-cell font-mono text-[10px] text-text-muted">
                        {c.gate_pass_no}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(c.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Challan 360"
                            onClick={() => setViewingItem(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {(c.status_name === 'Submitted' || c.status === 'Pending Approval') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve"
                                onClick={() => handleApprove(c)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(c)}
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          
                          {(c.status_code || c.status_name || c.status || '').toUpperCase().includes('DRAFT') && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Submit Challan"
                                onClick={() => handleSubmitRequest(c)}
                              >
                                <ArrowUpFromLine className="w-3 h-3 mr-0.5" /> Submit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Edit"
                                onClick={() => handleOpenEdit(c)}
                              >
                                <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Delete"
                                onClick={() => setDeleteItem(c)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                              </Button>
                            </div>
                          )}

                          {String(c.status_name || c.status).toUpperCase().includes('APPROVED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Post Challan"
                              onClick={() => handlePost(c)}
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
          {paged.map((c, idx) => (
            <div key={c.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.challan_no} • {c.challan_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{c.consignee_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(c.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {c.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Dispatched Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{c.dispatched_qty} {c.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Vehicle</span>
                  <span className="font-mono text-text-primary text-[11px]">{c.vehicle_no}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View Challan
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(c)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
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

      {/* View Challan 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.challan_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.challan_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Dispatched Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.dispatched_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gate Pass Number</span> <span className="font-mono text-text-primary">{viewingItem.gate_pass_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Vehicle & Driver</span> <span className="font-mono text-text-primary">{viewingItem.vehicle_no} ({viewingItem.driver_name})</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Security Outward</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transporter</span> <span className="text-text-primary">{viewingItem.transporter_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Prepared By</span> <span className="text-text-primary">{viewingItem.prepared_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Consignee Delivery Point</span> <span className="text-text-primary font-medium">{viewingItem.consignee_name}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Gate Dispatch Instructions:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Delivery Challan
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Challan Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileCheck2}
          title={editingItem ? 'Edit Delivery Challan' : 'Create Delivery Challan & Gate Pass'}
          subtitle="Generate official transport delivery challan with vehicle details and security stamps."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="dc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Consignee & Transporter Info">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Challan Number" required error={errors.challan_no}>
                  <Input
                    value={form.challan_no}
                    onChange={(e) => handleFormChange('challan_no', e.target.value)}
                    placeholder="DC-2026-095"
                  />
                </FormField>

                <FormField label="Consignee Destination Site" required className="md:col-span-2">
                  <Input
                    value={form.consignee_name}
                    onChange={(e) => handleFormChange('consignee_name', e.target.value)}
                    placeholder="e.g. Tower A Core - Level 2 Yard"
                  />
                </FormField>

                 <FormField label="From Dispatch Site Store" required error={errors.site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Dispatch Store"
                  />
                </FormField>

                <FormField label="Transporter Name">
                  <Input
                    value={form.transporter_name}
                    onChange={(e) => handleFormChange('transporter_name', e.target.value)}
                    placeholder="e.g. City Fast Freight Lines"
                  />
                </FormField>
 
                 <FormField label="Vehicle Number">
                   <Input
                     value={form.vehicle_no}
                     onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                     placeholder="TN-45-AZ-9901"
                   />
                 </FormField>
               </EntityEditModal.Grid>
             </EntityEditModal.Section>
 
             <EntityEditModal.Section title="Material Dispatch Quantities">
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

                <FormField label="Dispatched Quantity">
                  <Input
                    type="number"
                    value={form.dispatched_qty}
                    onChange={(e) => handleFormChange('dispatched_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Driver Name & Contact" className="md:col-span-2">
                  <Input
                    value={form.driver_name}
                    onChange={(e) => handleFormChange('driver_name', e.target.value)}
                    placeholder="e.g. K. Muthu (9842109822)"
                  />
                </FormField>

                <FormField label="Gate Outward Instructions" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Security seal numbers, delivery contact at site..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="dc-form"
            submitLabel={editingItem ? 'Update Challan' : 'Issue Gate Pass'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Delivery Challan"
        message={`Are you sure you want to delete "${deleteItem?.challan_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
