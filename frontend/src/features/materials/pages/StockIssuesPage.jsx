import { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpFromLine, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, Users
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
  issue_no: '',
  issue_date: '',
  contractor_name: 'Sri Murugan Labour Services',
  work_activity: '',
  material_id: '',
  uom_id: '',
  issued_qty: '50',
  unit_rate: '385',
  total_value: '19250',
  issued_by: 'Store Incharge',
  received_by: 'Site Foreman',
  notes: '',
};

export function StockIssuesPage() {
  const { user, hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
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

  const fetchIssuesList = async (pList = projects, sList = sites) => {
    setLoading(true);
    try {
      const txRes = await materialManagementApi.transactions.list({ transaction_type_id: 1 });
      const tList = txRes?.data?.material_transactions ?? txRes?.data?.data ?? [];
      if (Array.isArray(tList)) {
        const normalized = tList.map((t, idx) => {
          const project = pList.find(p => String(p.id) === String(t.project_id));
          const site = sList.find(s => String(s.id) === String(t.from_site_id));
          
          let issued_by = 'Store Incharge';
          let received_by = 'Site Foreman';
          let actualRemarks = t.remarks || '';
          try {
            const parsed = JSON.parse(t.remarks);
            if (parsed && typeof parsed === 'object') {
              issued_by = parsed.issued_by_name || 'Store Incharge';
              received_by = parsed.received_by_name || 'Site Foreman';
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
            issue_no: t.transaction_no,
            issue_date: t.transaction_date,
            contractor_name: t.work_description || 'Sri Murugan Labour Services',
            work_activity: t.purpose || 'Tower A Column Concreting',
            material_name: t.material_name || 'Construction Material',
            issued_qty: Number(t.quantity || t.issued_qty || 0),
            unit_rate: Number(t.unit_rate || 0),
            total_value: Number(t.line_value || (t.quantity * t.unit_rate) || 0),
            status: t.status_name || 'Issued & Debited',
            issued_by: issued_by,
            received_by: received_by,
            notes: actualRemarks,
          };
        });
        setIssues(normalized);
      }
    } catch {
      // Keep empty array
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

      fetchIssuesList(parsedProjects, sList);
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
      await fetchIssuesList();
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

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await materialManagementApi.transactions.remove(deleteItem.id);
      toast.success('Stock issue deleted successfully.');
      setDeleteItem(null);
      await fetchIssuesList();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      issue_no: `MIN-2026-11${issues.length + 1}`,
      issue_date: today,
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

      let issued_by = 'Store Incharge';
      let received_by = 'Site Foreman';
      let actualRemarks = fullTx.remarks || '';
      try {
        const parsed = JSON.parse(fullTx.remarks);
        if (parsed && typeof parsed === 'object') {
          issued_by = parsed.issued_by_name || 'Store Incharge';
          received_by = parsed.received_by_name || 'Site Foreman';
          actualRemarks = parsed.remarks || '';
        }
      } catch {
        // Not JSON
      }

      setForm({
        project_id: String(fullTx.project_id || ''),
        site_id: String(fullTx.from_site_id || ''),
        issue_no: fullTx.transaction_no || '',
        issue_date: fullTx.transaction_date || '',
        contractor_name: firstItem.work_description || '',
        work_activity: fullTx.purpose || '',
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        issued_qty: String(firstItem.quantity || '50'),
        unit_rate: String(firstItem.unit_rate || '385'),
        total_value: String(firstItem.line_value || Math.round(Number(firstItem.quantity || 0) * Number(firstItem.unit_rate || 0))),
        issued_by: issued_by,
        received_by: received_by,
        notes: actualRemarks,
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
      if (field === 'issued_qty' || field === 'unit_rate') {
        const qty = Number(field === 'issued_qty' ? value : prev.issued_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.total_value = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.issue_no.trim()) errs.issue_no = 'Issue No is required';
    if (!form.material_id) errs.material_id = 'Material item is required';
    if (!form.site_id) errs.site_id = 'Site location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      if (editingItem?.id) {
        const remarksPayload = JSON.stringify({
          issued_by_name: form.issued_by,
          received_by_name: form.received_by,
          remarks: form.notes
        });

        await materialManagementApi.transactions.update(editingItem.id, {
          project_id: Number(form.project_id),
          transaction_no: form.issue_no,
          transaction_date: form.issue_date,
          from_site_id: Number(form.site_id),
          purpose: form.work_activity,
          issued_by: user?.id ? Number(user.id) : null,
          received_by: null,
          remarks: remarksPayload
        });

        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.transactions.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.issued_qty),
            unit_rate: Number(form.unit_rate),
            work_description: form.contractor_name
          });
        }
        toast.success('Material issue updated.');
      } else {
        const remarksPayload = JSON.stringify({
          issued_by_name: form.issued_by,
          received_by_name: form.received_by,
          remarks: form.notes
        });

        const headerRes = await materialManagementApi.transactions.create({
          project_id: Number(form.project_id),
          transaction_no: form.issue_no,
          transaction_date: form.issue_date,
          transaction_type_id: 1, // ISSUE
          from_site_id: Number(form.site_id),
          purpose: form.work_activity,
          issued_by: user?.id ? Number(user.id) : null,
          received_by: null,
          remarks: remarksPayload
        });

        const txId = headerRes?.data?.transaction?.id ?? headerRes?.transaction?.id;
        if (txId) {
          await materialManagementApi.transactions.addItem(txId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            quantity: Number(form.issued_qty),
            unit_rate: Number(form.unit_rate),
            work_description: form.contractor_name
          });
        }
        toast.success('Material issue note (MIN) recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      fetchIssuesList();
    } catch {
      toast.error('Failed to save material issue.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    setSaving(true);
    try {
      await materialManagementApi.transactions.delete(deleteItem.id);
      toast.success('Material issue removed.');
      fetchIssuesList();
    } catch {
      toast.error('Failed to delete material issue.');
    } finally {
      setSaving(false);
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return issues.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (i.issue_no || '').toLowerCase();
        const cont = (i.contractor_name || '').toLowerCase();
        const mat = (i.material_name || '').toLowerCase();
        const act = (i.work_activity || '').toLowerCase();
        if (!no.includes(q) && !cont.includes(q) && !mat.includes(q) && !act.includes(q)) return false;
      }
      return true;
    });
  }, [issues, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalIssueValue = useMemo(() => issues.reduce((acc, i) => acc + Number(i.total_value || 0), 0), [issues]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Issues' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Issue Notes (MIN) & Contractor Slips"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Issue Slips"
            value={issues.length}
            status="primary"
            icon={<ArrowUpFromLine className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Issued Value"
            value={`₹${totalIssueValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Subcontractors"
            value="2 Gangs"
            status="neutral"
            icon={<Users className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Status"
            value="100% Debited"
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
                placeholder="Search MIN no, contractor, material..."
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
              title="Print Issue Register"
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
              Issue Material (MIN)
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
                  <th className="px-3 py-2 w-28">Issue Ref</th>
                  <th className="px-3 py-2">Contractor & Scope</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Site Location</th>
                  <th className="px-3 py-2 text-right w-24">Issued Qty</th>
                  <th className="px-3 py-2 text-right w-28">Total Value</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material issues...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material issue slips found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((i, idx) => (
                    <tr key={i.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {i.issue_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{i.issue_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.contractor_name}>
                            {i.contractor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate" title={i.work_activity}>
                            {i.work_activity}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={i.material_name}>
                          {i.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-[11px] text-text-secondary truncate block" title={i.site_name}>
                          {i.site_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {i.issued_qty} {i.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(i.total_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {i.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Transaction"
                            onClick={() => setViewingItem(i)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          
                          {(i.status_name === 'Submitted' || i.status === 'Pending Approval') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve"
                                onClick={() => handleApprove(i)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject"
                                onClick={() => handleReject(i)}
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          
                          {(i.status_code || i.status_name || '').toUpperCase().includes('DRAFT') && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Submit Issue"
                                onClick={() => handleSubmitRequest(i)}
                              >
                                <ArrowUpFromLine className="w-3 h-3 mr-0.5" /> Submit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Edit"
                                onClick={() => handleOpenEdit(i)}
                              >
                                <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Delete"
                                onClick={() => setDeleteItem(i)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                              </Button>
                            </div>
                          )}

                          {String(i.status_name).toUpperCase().includes('APPROVED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Post to Ledger"
                              onClick={() => handlePost(i)}
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
          {paged.map((i, idx) => (
            <div key={i.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{i.issue_no} • {i.issue_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{i.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{i.contractor_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  Issued
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Issued Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{i.issued_qty} {i.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(i.total_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(i)}>
                  <Eye className="w-3 h-3 mr-1" /> View MIN
                </Button>
                {(i.status_code || i.status || '').toUpperCase().includes('DRAFT') && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(i)}>
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

      {/* View MIN 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ArrowUpFromLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.issue_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Issued Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.issued_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Debited Value</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.total_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Issue Date</span> <span className="font-mono">{viewingItem.issue_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Issued By (Store)</span> <span className="text-text-primary">{viewingItem.issued_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Received By (Site)</span> <span className="text-text-primary">{viewingItem.received_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Site Location</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.work_activity && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Work Scope & Activity:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.work_activity}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print MIN Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit MIN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ArrowUpFromLine}
          title={editingItem ? 'Edit Material Issue (MIN)' : 'Create Material Issue (MIN)'}
          subtitle="Issue materials to contractor gang, record debited values, and log handover signatures."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="min-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Project & Contractor Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Issue Note Number" required error={errors.issue_no}>
                  <Input
                    value={form.issue_no}
                    onChange={(e) => handleFormChange('issue_no', e.target.value)}
                    placeholder="MIN-2026-115"
                  />
                </FormField>

                <FormField label="Contractor Gang" required className="md:col-span-2">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Labour Services"
                  />
                </FormField>

                <FormField label="Work Activity / WBS" required className="md:col-span-2">
                  <Input
                    value={form.work_activity}
                    onChange={(e) => handleFormChange('work_activity', e.target.value)}
                    placeholder="e.g. Level 2 Column & Shear Wall Concreting"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Issue Quantities">
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

                <FormField label="Issued Quantity">
                  <Input
                    type="number"
                    value={form.issued_qty}
                    onChange={(e) => handleFormChange('issued_qty', e.target.value)}
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
                    value={`₹${Number(form.total_value).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Receiver Foreman Name">
                  <Input
                    value={form.received_by}
                    onChange={(e) => handleFormChange('received_by', e.target.value)}
                    placeholder="e.g. S. Natesan (Foreman)"
                  />
                </FormField>

                <FormField label="Site Location" required error={errors.site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Yard/Site Location"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="min-form"
            submitLabel={editingItem ? 'Update Issue Slip' : 'Issue Material'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Stock Issue"
        description={`Are you sure you want to delete transaction "${deleteItem?.issue_no}"?`}
        confirmLabel="Delete"
        destructive={true}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
