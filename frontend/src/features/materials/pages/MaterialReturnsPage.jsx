import { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, AlertTriangle, ArrowUpFromLine, XCircle
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
  return_no: '',
  return_date: '',
  return_type: 'Site Surplus Return',
  site_id: '',
  contractor_name: '',
  material_id: '',
  uom_id: '',
  returned_qty: '10',
  unit_rate: '385',
  return_value: '3850',
  condition: 'Good (Unopened Bags)',
  reason: '',
};

export function MaterialReturnsPage() {
  const { user, hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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

  const fetchReturnsList = async (pList = projects, sList = sites) => {
    setLoading(true);
    try {
      const txRes = await materialManagementApi.transactions.list({ transaction_type_id: 2 });
      const tList = txRes?.data?.material_transactions ?? txRes?.data?.data ?? [];
      if (Array.isArray(tList)) {
        const normalized = tList.map((t, idx) => {
          const project = pList.find(p => String(p.id) === String(t.project_id));
          const site = sList.find(s => String(s.id) === String(t.to_site_id));
          
          let return_type = 'Site Surplus Return';
          let condition = 'Good (Unopened Bags)';
          let actualRemarks = t.remarks || '';
          try {
            const parsed = JSON.parse(t.remarks);
            if (parsed && typeof parsed === 'object') {
              return_type = parsed.return_type || 'Site Surplus Return';
              condition = parsed.condition || 'Good (Unopened Bags)';
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
            site_name: site?.site_name || 'Site Yard',
            return_no: t.transaction_no,
            return_date: t.transaction_date,
            return_type: return_type,
            contractor_name: t.work_description || '',
            material_name: t.material_name || 'Construction Material',
            returned_qty: Number(t.quantity || t.returned_qty || 0),
            unit_rate: Number(t.unit_rate || 0),
            return_value: Number(t.line_value || (t.quantity * t.unit_rate) || 0),
            condition: condition,
            status: t.status_name || 'Stock Restocked & Credited',
            reason: actualRemarks,
          };
        });
        setReturns(normalized);
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

      fetchReturnsList(parsedProjects, sList);
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
      toast.success(`Return ${actionName} successful.`);
      await fetchReturnsList();
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName} return.`);
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
      return_no: `RTN-2026-02${returns.length + 1}`,
      return_date: today,
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

      let return_type = 'Site Surplus Return';
      let condition = 'Good (Unopened Bags)';
      let actualRemarks = fullTx.remarks || '';
      try {
        const parsed = JSON.parse(fullTx.remarks);
        if (parsed && typeof parsed === 'object') {
          return_type = parsed.return_type || 'Site Surplus Return';
          condition = parsed.condition || 'Good (Unopened Bags)';
          actualRemarks = parsed.remarks || '';
        }
      } catch {
        // Not JSON
      }

      setForm({
        project_id: String(fullTx.project_id || ''),
        return_no: fullTx.transaction_no || '',
        return_date: fullTx.transaction_date || '',
        return_type: return_type,
        site_id: String(fullTx.to_site_id || ''),
        contractor_name: firstItem.work_description || '',
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        returned_qty: String(firstItem.quantity || '10'),
        unit_rate: String(firstItem.unit_rate || '385'),
        return_value: String(firstItem.line_value || Math.round(Number(firstItem.quantity || 0) * Number(firstItem.unit_rate || 0))),
        condition: condition,
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
      if (field === 'returned_qty' || field === 'unit_rate') {
        const qty = Number(field === 'returned_qty' ? value : prev.returned_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.return_value = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.return_no.trim()) errs.return_no = 'Return No is required';
    if (!form.material_id) errs.material_id = 'Material item is required';
    if (!form.site_id) errs.site_id = 'Site location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const remarksPayload = JSON.stringify({
        return_type: form.return_type,
        condition: form.condition,
        issued_by_name: 'Contractor Agent',
        remarks: form.reason
      });

      if (editingItem?.id) {
        await materialManagementApi.transactions.update(editingItem.id, {
          project_id: Number(form.project_id),
          transaction_no: form.return_no,
          transaction_date: form.return_date,
          to_site_id: Number(form.site_id),
          purpose: 'Material Return Note',
          issued_by: user?.id ? Number(user.id) : null,
          remarks: remarksPayload
        });

        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.transactions.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.returned_qty),
            unit_rate: Number(form.unit_rate),
            work_description: form.contractor_name
          });
        }
        toast.success('Material return updated.');
      } else {
        const headerRes = await materialManagementApi.transactions.create({
          project_id: Number(form.project_id),
          transaction_no: form.return_no,
          transaction_date: form.return_date,
          transaction_type_id: 2, // RETURN
          to_site_id: Number(form.site_id),
          purpose: 'Material Return Note',
          issued_by: user?.id ? Number(user.id) : null,
          remarks: remarksPayload
        });

        const txId = headerRes?.data?.transaction?.id ?? headerRes?.transaction?.id;
        if (txId) {
          await materialManagementApi.transactions.addItem(txId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.returned_qty),
            unit_rate: Number(form.unit_rate),
            work_description: form.contractor_name
          });
        }
        toast.success('Material return logged and inventory credited.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchReturnsList();
    } catch {
      toast.error('Failed to save material return.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;
    setLoading(true);
    try {
      await materialManagementApi.transactions.remove(deleteItem.id);
      toast.success('Material return removed.');
      await fetchReturnsList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete material return.');
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
    return returns.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (typeFilter !== 'all' && r.return_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (r.return_no || '').toLowerCase();
        const mat = (r.material_name || '').toLowerCase();
        const party = (r.contractor_name || '').toLowerCase();
        const reas = (r.reason || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !party.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [returns, selectedProjectId, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalReturnValue = useMemo(() => returns.reduce((acc, r) => acc + Number(r.return_value || 0), 0), [returns]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Returns' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Returns & Credit Notes"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Return Slips"
            value={returns.length}
            status="primary"
            icon={<RotateCcw className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Credited Value"
            value={`₹${totalReturnValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Site Surplus Restocked"
            value="1 Return"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Supplier Defective Returns"
            value="1 Return"
            status="neutral"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
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
                  { value: 'all', label: 'All Return Types' },
                  { value: 'Site Surplus Return', label: 'Site Surplus Return' },
                  { value: 'Defective Supplier Return', label: 'Defective Supplier Return' },
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search return no, material, party..."
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
              title="Print Return Register"
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
              Log Material Return
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
                  <th className="px-3 py-2 w-28">Return Ref</th>
                  <th className="px-3 py-2">Return Type & Party</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">Return Qty</th>
                  <th className="px-3 py-2 text-right w-28">Credit Value</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Condition</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material returns...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material return slips found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {r.return_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.return_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.return_type}>
                            {r.return_type}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.contractor_name || r.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={r.material_name}>
                          {r.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.returned_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{Number(r.return_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate" title={r.condition}>
                        {r.condition}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status || r.status_name || 'Credited'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Return 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          
                          {(r.status_name === 'Submitted' || r.status === 'Pending Approval') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve"
                                onClick={() => handleApprove(r)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(r)}
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          
                          {(r.status_code || r.status_name || r.status || '').toUpperCase().includes('DRAFT') && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Submit Return"
                                onClick={() => handleSubmitRequest(r)}
                              >
                                <ArrowUpFromLine className="w-3 h-3 mr-0.5" /> Submit
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
                            </div>
                          )}

                          {String(r.status_name || r.status).toUpperCase().includes('APPROVED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Post to Ledger"
                              onClick={() => handlePost(r)}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.return_no} • {r.return_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.return_type}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  Credited
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Return Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.returned_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Credit Value</span>
                  <span className="font-mono font-bold text-emerald-600 text-[12px]">₹{Number(r.return_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Return
                </Button>
                {(r.status_code || r.status || '').toUpperCase().includes('DRAFT') && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(r)}>
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

      {/* View Return 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.return_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.return_type}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Returned Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.returned_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Credited Amount</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.return_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Return Date</span> <span className="font-mono">{viewingItem.return_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Material Condition</span> <span className="font-semibold text-text-primary">{viewingItem.condition}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Source Party / Site</span> <span className="text-text-primary font-medium">{viewingItem.contractor_name || viewingItem.site_name}</span></div>
              </div>

              {viewingItem.reason && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Return Reason & Inspection Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Return Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={RotateCcw}
          title={editingItem ? 'Edit Material Return' : 'Log Material Return (Credit Note)'}
          subtitle="Record surplus site return back to godown or defective lot return to supplier."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="rtn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Return Type & Location">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Return Note Number" required error={errors.return_no}>
                  <Input
                    value={form.return_no}
                    onChange={(e) => handleFormChange('return_no', e.target.value)}
                    placeholder="RTN-2026-025"
                  />
                </FormField>

                <FormField label="Return Type" required>
                  <Select
                    options={[
                      { value: 'Site Surplus Return', label: 'Site Surplus Return (Restock to Yard)' },
                      { value: 'Defective Supplier Return', label: 'Defective Supplier Return (Vendor Credit)' },
                    ]}
                    value={form.return_type}
                    onChange={(v) => handleFormChange('return_type', v)}
                  />
                </FormField>

                <FormField label="Party / Subcontractor / Supplier">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Labour Services"
                  />
                </FormField>

                <FormField label="To (Destination Site)" required error={errors.site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Target Yard"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Return Quantities">
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

                <FormField label="Returned Quantity">
                  <Input
                    type="number"
                    value={form.returned_qty}
                    onChange={(e) => handleFormChange('returned_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Credited Value (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.return_value).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Material Condition" className="md:col-span-2">
                  <Input
                    value={form.condition}
                    onChange={(e) => handleFormChange('condition', e.target.value)}
                    placeholder="e.g. Good Unopened / Rain Damaged / Scrap Offcut"
                  />
                </FormField>

                <FormField label="Return Reason & Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Surplus left over after concrete pour..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="rtn-form"
            submitLabel={editingItem ? 'Update Return' : 'Log Return'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Material Return"
        message={`Are you sure you want to delete "${deleteItem?.return_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
