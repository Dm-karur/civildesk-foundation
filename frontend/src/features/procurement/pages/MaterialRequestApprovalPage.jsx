import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, CheckCircle2, XCircle, Clock, AlertTriangle,
  Eye, Edit, Trash2, Plus, MoreVertical,
  ShieldCheck, Check, RotateCcw, RefreshCw, Truck, FileText, ShoppingCart
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
import { WorkflowTimeline } from '../../../components/composite/WorkflowTimeline';
import { projectsApi, materialManagementApi, sitesApi, mastersApi, materialsApi, usersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function MaterialRequestApprovalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Admin Check (Admin / Super Admin vs Accounts User)
  const isAdmin = Boolean(user?.is_super_admin) || String(user?.role_name || user?.role || '').toLowerCase().includes('admin');

  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals & Active Items
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [actionModalItem, setActionModalItem] = useState(null);
  const [statusChangeItem, setStatusChangeItem] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);

  // Form State for Edit Modal
  const [form, setForm] = useState({
    project_id: '',
    site_id: '',
    request_date: '',
    required_by_date: '',
    priority_id: '',
    purpose: '',
    items: []
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState('');

  // Three-dot menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Cache for full request details
  const [detailsMap, setDetailsMap] = useState({});

  // Close three-dot menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to format Approval ID: MRA-2026-001
  const getApprovalId = (req, idx) => {
    if (req.approval_id) return req.approval_id;
    const numPart = String(req.id || idx + 1).padStart(3, '0');
    return `MRA-2026-${numPart}`;
  };

  const getUserName = (userId) => {
    const u = users.find(usr => String(usr.id) === String(userId));
    return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : userId ? `User #${userId}` : '—';
  };

  // Load Data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [projRes, sitesRes, catRes, suppRes, mastersMatRes, reqRes, usersRes] = await Promise.all([
        projectsApi.list().catch(() => ({ data: [] })),
        sitesApi.list().catch(() => ({ data: [] })),
        materialsApi.catalogue.list().catch(() => ({ data: [] })),
        materialsApi.suppliers.list().catch(() => ({ data: [] })),
        materialsApi.masters().catch(() => ({ data: {} })),
        materialManagementApi.requests.list().catch(() => ({ data: [] })),
        usersApi.list().catch(() => ({ data: [] }))
      ]);

      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const vList = suppRes?.data?.material_suppliers ?? suppRes?.material_suppliers ?? (Array.isArray(suppRes?.data) ? suppRes.data : Array.isArray(suppRes) ? suppRes : []);
      setVendors(Array.isArray(vList) ? vList : []);

      const mastersData = mastersMatRes?.data?.masters ?? mastersMatRes?.masters ?? {};
      const uList = mastersData?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const prioList = mastersData?.request_priorities ?? [];
      setPriorities(Array.isArray(prioList) ? prioList : []);

      const stList = mastersData?.request_statuses ?? [];
      setStatusOptions(Array.isArray(stList) ? stList : []);

      const uResList = usersRes?.data?.users ?? usersRes?.users ?? (Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []);
      setUsers(Array.isArray(uResList) ? uResList : []);

      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? [];
      if (Array.isArray(rList)) {
        const mapped = rList.map((r, idx) => {
          const site = sList.find(s => String(s.id) === String(r.site_id));
          const proj = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const prio = prioList.find(p => String(p.id) === String(r.priority_id));

          return {
            ...r,
            approval_code: getApprovalId(r, idx),
            site_name: site?.site_name || '',
            project_name: proj?.project_name || '',
            priority_name: prio?.priority_name || 'Normal',
            status_name: r.status_name || r.status_code || r.status || 'Submitted'
          };
        });
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch (err) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return requests.filter((r, idx) => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (selectedSiteId !== 'all' && String(r.site_id) !== String(selectedSiteId)) return false;
      if (priorityFilter !== 'all' && r.priority_name !== priorityFilter) return false;
      if (statusFilter !== 'all' && String(r.status_name).toUpperCase() !== String(statusFilter).toUpperCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        const appNo = (r.approval_code || getApprovalId(r, idx)).toLowerCase();
        const reqNo = (r.request_no || '').toLowerCase();
        const proj = (r.project_name || '').toLowerCase();
        const reqBy = getUserName(r.requested_by || r.created_by).toLowerCase();
        if (!appNo.includes(q) && !reqNo.includes(q) && !proj.includes(q) && !reqBy.includes(q)) return false;
      }
      return true;
    });
  }, [requests, selectedProjectId, selectedSiteId, priorityFilter, statusFilter, search, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Auto-fetch item details for current page
  useEffect(() => {
    const missingIds = paged.map(r => r.id).filter(id => !detailsMap[id]);
    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.map(id =>
        materialManagementApi.requests.get(id)
          .then(res => ({ id, req: res?.data?.material_request ?? res?.material_request }))
          .catch(() => ({ id, req: null }))
      )
    ).then(results => {
      setDetailsMap(prev => {
        const next = { ...prev };
        results.forEach(({ id, req }) => {
          if (req) next[id] = req;
        });
        return next;
      });
    });
  }, [paged, detailsMap]);

  // Metrics
  const pendingCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'SUBMITTED' || s === 'PENDING APPROVAL';
  }).length, [requests]);

  const approvedCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'APPROVED' || s === 'ORDERED' || s === 'PARTIALLY ORDERED';
  }).length, [requests]);

  const rejectedCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'REJECTED' || s === 'CANCELLED';
  }).length, [requests]);

  const getStatusVariant = (status) => {
    const s = String(status).toUpperCase();
    if (s.includes('APPROV') || s.includes('ORDER')) return 'success';
    if (s.includes('SUBMIT') || s.includes('PENDING')) return 'warning';
    if (s.includes('REJECT') || s.includes('CANCEL')) return 'error';
    return 'neutral';
  };

  const getPriorityVariant = (priority) => {
    const p = String(priority).toUpperCase();
    if (p === 'CRITICAL' || p === 'HIGH') return 'error';
    if (p === 'URGENT') return 'warning';
    return 'neutral';
  };

  // Open View Detail Modal
  const handleOpenView = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.requests.get(item.id);
      const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
      setViewingItem({ ...item, ...fullReq });
    } catch {
      toast.error('Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  // Vendor-Wise Item Grouping for View Detail Modal
  const vendorGroups = useMemo(() => {
    if (!viewingItem?.items) return {};
    const groups = {};
    viewingItem.items.forEach((item, idx) => {
      const vId = item.supplier_id || item.vendor_id || item.material_supplier_id || item.preferred_supplier_id || item.supplier?.id || item.vendor?.id;
      const vendorObj = vendors.find(v => String(v.id) === String(vId) || (v.supplier_name && item.vendor_name && v.supplier_name.toLowerCase() === item.vendor_name.toLowerCase()));
      let vendorName = vendorObj?.supplier_name || vendorObj?.name || vendorObj?.company_name || item.supplier_name || item.vendor_name || item.supplier?.supplier_name;
      
      if (!vendorName) {
        if (vId) {
          vendorName = `Supplier Vendor #${vId}`;
        } else {
          vendorName = 'Unassigned Vendor / General Supply';
        }
      }

      if (!groups[vendorName]) groups[vendorName] = [];
      groups[vendorName].push({ ...item, vendorObj });
    });
    return groups;
  }, [viewingItem, vendors]);

  // Open Edit Modal (Accounts User or Admin)
  const handleOpenEdit = async (item) => {
    setLoading(true);
    setOpenMenuId(null);
    try {
      const res = await materialManagementApi.requests.get(item.id);
      const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
      const reqItems = fullReq.items || [];

      setForm({
        project_id: String(fullReq.project_id || ''),
        site_id: String(fullReq.site_id || ''),
        request_date: fullReq.request_date || '',
        required_by_date: fullReq.required_by_date || '',
        priority_id: String(fullReq.priority_id || ''),
        purpose: fullReq.purpose || '',
        items: reqItems.length > 0 ? reqItems.map(i => ({
          id: i.id,
          material_id: String(i.material_id || ''),
          specification: i.specification || '',
          requested_qty: String(i.requested_qty ?? ''),
          supplier_id: String(i.supplier_id || i.vendor_id || i.material_supplier_id || ''),
          remarks: i.remarks || '',
          uom_id: String(i.uom_id || ''),
          estimated_rate: String(i.estimated_rate || '0')
        })) : [{ material_id: '', specification: '', requested_qty: '', supplier_id: '', remarks: '', uom_id: '', estimated_rate: '0' }]
      });
      setErrors({});
      setEditingItem(fullReq);
    } catch {
      toast.error('Failed to load request details for editing.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Submit Edit (Allows editing Vendor & Quantity at item level)
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.site_id) errs.site_id = 'Site location is required';
    if (!form.priority_id) errs.priority_id = 'Priority is required';

    const itemErrors = [];
    form.items.forEach((item, index) => {
      const itemErr = {};
      if (!item.material_id) itemErr.material_id = 'Material is required';
      if (!item.requested_qty || Number(item.requested_qty) <= 0) itemErr.requested_qty = 'Quantity must be > 0';
      if (Object.keys(itemErr).length > 0) {
        itemErrors[index] = itemErr;
      }
    });
    if (itemErrors.length > 0) errs.items = itemErrors;

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const requestId = editingItem?.id;
      if (requestId) {
        await materialManagementApi.requests.update(requestId, {
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_date: form.request_date,
          required_by_date: form.required_by_date,
          priority_id: Number(form.priority_id),
          purpose: form.purpose
        });

        const origItems = editingItem.items || [];
        const origItemIds = origItems.map(i => i.id);
        const newItemIds = form.items.filter(i => i.id).map(i => i.id);

        const deletedIds = origItemIds.filter(id => !newItemIds.includes(id));
        for (const itemId of deletedIds) {
          await materialManagementApi.requests.removeItem(requestId, itemId);
        }

        for (const item of form.items) {
          const payload = {
            material_id: Number(item.material_id),
            uom_id: Number(item.uom_id || 1),
            requested_qty: Number(item.requested_qty),
            estimated_rate: Number(item.estimated_rate || 0),
            specification: item.specification || null,
            remarks: item.remarks || null,
            ...(item.supplier_id ? {
              supplier_id: Number(item.supplier_id),
              vendor_id: Number(item.supplier_id),
              material_supplier_id: Number(item.supplier_id)
            } : {})
          };
          if (item.id) {
            await materialManagementApi.requests.updateItem(requestId, item.id, payload);
          } else {
            await materialManagementApi.requests.addItem(requestId, payload);
          }
        }
        toast.success('Material request updated.');
        setEditingItem(null);
        await loadAllData();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update material request.');
    } finally {
      setSaving(false);
    }
  };

  // Admin Approval / Rejection Actions
  const handleDocumentAction = async (id, actionName, payload = {}) => {
    setLoading(true);
    try {
      await materialManagementApi.requests.action(id, actionName, payload);
      toast.success(`Material request ${actionName}d successfully.`);
      setActionModalItem(null);
      setViewingItem(null);
      setRemarks('');
      await loadAllData();
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName} request.`);
    } finally {
      setLoading(false);
    }
  };

  // Admin Change Status
  const handleChangeStatus = async () => {
    if (!statusChangeItem || !selectedNewStatus) return;
    setLoading(true);
    try {
      const selectedOpt = statusOptions.find(s => String(s.id) === String(selectedNewStatus) || String(s.status_name).toLowerCase() === String(selectedNewStatus).toLowerCase());
      const statusText = (selectedOpt?.status_name || selectedNewStatus || '').toLowerCase();
      
      let actionName = 'approve';
      if (statusText.includes('approv')) actionName = 'approve';
      else if (statusText.includes('reject')) actionName = 'reject';
      else if (statusText.includes('return')) actionName = 'return';
      else if (statusText.includes('cancel')) actionName = 'cancel';
      else if (statusText.includes('submit')) actionName = 'submit';
      else actionName = statusText;

      try {
        await materialManagementApi.requests.action(statusChangeItem.id, actionName, { remarks: 'Status updated by Admin' });
      } catch {
        await materialManagementApi.requests.update(statusChangeItem.id, {
          status_id: Number(selectedNewStatus)
        });
      }

      toast.success('Status updated successfully.');
      setStatusChangeItem(null);
      setSelectedNewStatus('');
      await loadAllData();
    } catch (err) {
      toast.error(err?.message || err?.data?.message || 'Failed to change status.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Handler (Admin only)
  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await materialManagementApi.requests.remove(deleteItem.id);
      toast.success('Material request deleted successfully.');
      setDeleteItem(null);
      await loadAllData();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete request.');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/requisitions' },
    { label: 'Material Request Approval' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Request Approval"
        subtitle="Review and approve submitted material requests before they proceed to procurement."
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Pending Approvals"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Rejected"
            value={rejectedCount}
            status={rejectedCount > 0 ? 'error' : 'neutral'}
            icon={<XCircle className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="Total Requests"
            value={requests.length}
            status="primary"
            icon={<Send className="w-4 h-4" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
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

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Sites' },
                  ...sites.map(s => ({ value: String(s.id), label: s.site_name }))
                ]}
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'Critical', label: 'Critical' },
                  { value: 'Urgent', label: 'Urgent' },
                  { value: 'Normal', label: 'Normal' },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Submitted', label: 'Submitted' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search Approval ID, Ref, Project, User..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Approval Table */}
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
                  <th className="px-3 py-2 w-32">Approval ID</th>
                  <th className="px-3 py-2 w-36">Project</th>
                  <th className="px-3 py-2 w-32">Site</th>
                  <th className="px-3 py-2 w-28">Requested By</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material requests...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No material requests are pending approval.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => {
                    const approvalId = r.approval_code || getApprovalId(r, (page - 1) * perPage + idx);
                    const isMenuOpen = openMenuId === r.id;

                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {approvalId}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-text-primary text-[11px]">
                          <span className="truncate block" title={r.project_name}>
                            {r.project_name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          <span className="truncate block" title={r.site_name}>
                            {r.site_name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          {getUserName(r.requested_by || r.created_by)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getPriorityVariant(r.priority_name)}
                            className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none rounded-full"
                          >
                            {r.priority_name}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(r.status_name)}
                            className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none rounded-full"
                          >
                            {r.status_name}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Icon */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Details"
                              onClick={() => handleOpenView(r)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>

                            {/* Three-dot Menu */}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(isMenuOpen ? null : r.id);
                                }}
                                className={`h-6 w-6 p-0 ${isMenuOpen ? 'text-primary bg-surface-muted' : 'text-text-secondary'}`}
                                title="More Options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>

                              {isMenuOpen && (
                                <div
                                  ref={menuRef}
                                  className="absolute right-0 top-7 z-50 w-44 bg-surface border border-border rounded-sm shadow-xl p-1 text-[11px] animate-in fade-in zoom-in-95 duration-100"
                                >
                                  {/* Issue Purchase Order (PO) */}
                                  {(String(r.status_name || r.status || '').toUpperCase().includes('APPROV') || String(r.status_name || r.status || '').toUpperCase().includes('ORDER')) && (
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        navigate(`/procurement/purchase-orders?mr_id=${r.id}`);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 font-semibold"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Issue PO</span>
                                    </button>
                                  )}

                                  {/* Edit (Accounts User & Admin) */}
                                  <button
                                    onClick={() => handleOpenEdit(r)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                                    <span>Edit</span>
                                  </button>

                                  {/* Delete (Admin Only) */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        setDeleteItem(r);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-error/10 flex items-center gap-2 text-error"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  )}

                                  {/* Change Status (Admin Only) */}
                                  {isAdmin && (
                                    <>
                                      <div className="border-t border-border my-1"></div>
                                      <button
                                        onClick={() => {
                                          setStatusChangeItem(r);
                                          setSelectedNewStatus('');
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Change Status</span>
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

        {/* Mobile View */}
        <div className="block sm:hidden space-y-3">
          {paged.map((r, idx) => {
            const approvalId = r.approval_code || getApprovalId(r, (page - 1) * perPage + idx);
            const isMenuOpen = openMenuId === `mobile-${r.id}`;

            return (
              <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block">{approvalId}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">
                      {r.project_name || 'Highway Project'}
                    </h4>
                    <span className="text-[11px] text-text-muted block">{r.site_name}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant={getStatusVariant(r.status_name)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                    >
                      {r.status_name}
                    </Badge>
                    <Badge
                      variant={getPriorityVariant(r.priority_name)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                    >
                      {r.priority_name}
                    </Badge>
                  </div>
                </div>

                <div className="text-xs pt-1 border-t border-border/60 font-mono flex justify-between">
                  <span className="text-[10px] text-text-muted">Requested By: <strong className="text-text-primary">{getUserName(r.requested_by || r.created_by)}</strong></span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenView(r)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : `mobile-${r.id}`);
                      }}
                      className={`h-7 w-7 p-0 ${isMenuOpen ? 'text-primary bg-surface-muted' : 'text-text-secondary'}`}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 bottom-8 z-50 w-44 bg-surface border border-border rounded-sm shadow-xl p-1 text-[11px]"
                      >
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                        >
                          <Edit className="w-3.5 h-3.5 text-text-secondary" />
                          <span>Edit</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { setDeleteItem(r); setOpenMenuId(null); }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-error/10 flex items-center gap-2 text-error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => { setStatusChangeItem(r); setSelectedNewStatus(''); setOpenMenuId(null); }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                            <span>Change Status</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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

      {/* View Detail Modal (Vendor-Wise Material Grouping) */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.request_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">
                    {viewingItem.project_name || projects.find(p => String(p.id) === String(viewingItem.project_id))?.project_name || (viewingItem.project_id ? `Project #${viewingItem.project_id}` : '—')}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Header Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Indent Reference</span>
                  <span className="font-mono text-text-primary font-bold">{viewingItem.request_no}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Project</span>
                  <span className="font-semibold text-text-primary">
                    {viewingItem.project_name || projects.find(p => String(p.id) === String(viewingItem.project_id))?.project_name || (viewingItem.project_id ? `Project #${viewingItem.project_id}` : '—')}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Site Location</span>
                  <span className="font-semibold text-text-primary">
                    {viewingItem.site_name || sites.find(s => String(s.id) === String(viewingItem.site_id))?.site_name || (viewingItem.site_id ? `Site #${viewingItem.site_id}` : '—')}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Requested By</span>
                  <span className="font-semibold text-text-primary">{getUserName(viewingItem.requested_by || viewingItem.created_by)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Request Date</span>
                  <span className="font-mono text-text-primary">{viewingItem.request_date}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Required Date</span>
                  <span className="font-mono font-bold text-red-600">{viewingItem.required_by_date}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Priority</span>
                  <Badge variant={getPriorityVariant(viewingItem.priority_name || viewingItem.priority)} className="text-[9px] uppercase font-bold">
                    {viewingItem.priority_name || priorities.find(p => String(p.id) === String(viewingItem.priority_id))?.name || viewingItem.priority || 'Normal'}
                  </Badge>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Status</span>
                  <Badge variant={getStatusVariant(viewingItem.status_name || viewingItem.status)} className="text-[9px] uppercase font-bold">
                    {viewingItem.status_name || viewingItem.status_code || viewingItem.status || 'Submitted'}
                  </Badge>
                </div>
              </div>

              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-2.5 bg-surface-muted/10">
                  <span className="font-bold text-text-primary block text-[11px]">Purpose / Activity Scope:</span>
                  <p className="text-text-secondary italic text-[11px]">"{viewingItem.purpose}"</p>
                </div>
              )}

              {/* VERY IMPORTANT: VENDOR-WISE MATERIAL GROUPING */}
              <div className="space-y-3">
                <span className="font-bold text-text-primary block text-[12px] uppercase tracking-wider">
                  Material Items (Grouped by Vendor)
                </span>

                {Object.keys(vendorGroups).length === 0 ? (
                  <div className="p-4 text-center text-text-muted border border-border rounded-lg">No material items found.</div>
                ) : (
                  Object.entries(vendorGroups).map(([vendorName, itemsList], gIdx) => (
                    <div key={gIdx} className="border border-border rounded-lg overflow-hidden bg-surface shadow-2xs">
                      {/* Vendor Header */}
                      <div className="bg-surface-muted/60 px-3.5 py-2 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-primary" />
                          <span className="font-bold text-text-primary text-[12px] uppercase tracking-wider">{vendorName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">{itemsList.length} Item(s)</span>
                      </div>

                      {/* Items Table for this Vendor */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-surface-muted/20 font-semibold text-text-secondary border-b border-border/60">
                            <tr>
                              <th className="p-2">Material</th>
                              <th className="p-2">Variant</th>
                              <th className="p-2 text-right">Required Qty</th>
                              <th className="p-2 text-center">UOM</th>
                              <th className="p-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {itemsList.map((item, i) => {
                              const baseUom = uoms.find(u => String(u.id) === String(item.uom_id));
                              const mat = materials.find(m => String(m.id) === String(item.material_id));
                              const itemSpec = item.specification || item.variant || item.size || item.spec || item.item_specification || item.material_variant || item.description || mat?.specification || mat?.variant || mat?.size || '—';
                              return (
                                <tr key={item.id || i} className="hover:bg-surface-muted/10">
                                  <td className="p-2 font-semibold text-text-primary">
                                    {item.material_code ? `${item.material_code} - ${item.material_name}` : item.material_name || `Material #${item.material_id}`}
                                  </td>
                                  <td className="p-2 text-text-secondary font-mono">
                                    {itemSpec}
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold text-primary">
                                    {item.requested_qty}
                                  </td>
                                  <td className="p-2 text-center font-mono text-text-secondary">
                                    {baseUom?.unit_code || '—'}
                                  </td>
                                  <td className="p-2 text-text-muted italic">
                                    {item.remarks || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ADMIN ONLY APPROVAL / REJECTION BUTTONS */}
              {isAdmin && (
                String(viewingItem.status_name || viewingItem.status || '').toUpperCase().includes('SUBMIT') ||
                String(viewingItem.status_name || viewingItem.status || '').toUpperCase().includes('PENDING') ||
                String(viewingItem.status_name || viewingItem.status || '').toUpperCase().includes('DRAFT')
              ) && (
                <div className="border border-emerald-200 bg-emerald-50/20 rounded-lg p-3 space-y-2">
                  <span className="font-bold text-emerald-900 block text-[11px]">Admin Approval Board Review</span>
                  <FormField label="Reviewer Remarks">
                    <Textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter approval remarks or reason for rejection..."
                    />
                  </FormField>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleDocumentAction(viewingItem.id, 'approve', { remarks })}
                      isSubmitting={loading}
                    >
                      Approve Request
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleDocumentAction(viewingItem.id, 'reject', { remarks })}
                      isSubmitting={loading}
                    >
                      Reject Request
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <div>
                {(String(viewingItem.status_name || viewingItem.status || '').toUpperCase().includes('APPROV') || String(viewingItem.status_name || viewingItem.status || '').toUpperCase().includes('ORDER')) && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                    leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const id = viewingItem.id;
                      setViewingItem(null);
                      navigate(`/procurement/purchase-orders?mr_id=${id}`);
                    }}
                  >
                    Issue Purchase Order (PO)
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Vendor & Quantity Editable at Item Level) */}
      <EntityEditModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      >
        <EntityEditModal.Header
          icon={Edit}
          title="Edit Material Request Items"
          subtitle="Adjust vendor assignments, quantities, specifications, or remarks before approval."
          onClose={() => setEditingItem(null)}
        />
        <form id="edit-mra-form" onSubmit={handleSubmitEdit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Header Scope">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Site Location" required error={errors.site_id}>
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Site Location"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            {/* Editable Item Rows */}
            <EntityEditModal.Section title="Material Items (Edit Vendor & Quantity)">
              <div className="space-y-3">
                {form.items && form.items.map((item, idx) => {
                  const itemErr = errors.items?.[idx] || {};

                  return (
                    <div key={idx} className="bg-surface-muted/30 p-3 rounded-lg border border-border/60 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        {/* 1. Material * */}
                        <div className="sm:col-span-3">
                          <FormField label={idx === 0 ? "Material *" : ""} required error={itemErr.material_id}>
                            <Select
                              options={materials.map(m => ({ value: String(m.id), label: `${m.material_code} - ${m.material_name}` }))}
                              value={item.material_id}
                              onChange={(v) => {
                                const nextItems = [...form.items];
                                const mat = materials.find(m => String(m.id) === String(v));
                                nextItems[idx] = {
                                  ...nextItems[idx],
                                  material_id: v,
                                  uom_id: mat ? String(mat.base_uom_id) : '',
                                  estimated_rate: mat?.standard_rate ? String(mat.standard_rate) : '0'
                                };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="Select Material..."
                            />
                          </FormField>
                        </div>

                        {/* 2. Variant */}
                        <div className="sm:col-span-2">
                          <FormField label={idx === 0 ? "Variant" : ""}>
                            <Input
                              value={item.specification || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], specification: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. 12mm, Fe500D"
                            />
                          </FormField>
                        </div>

                        {/* 3. Required Qty * */}
                        <div className="sm:col-span-2">
                          <FormField label={idx === 0 ? "Required Qty *" : ""} required error={itemErr.requested_qty}>
                            <Input
                              type="number"
                              step="any"
                              min="0.01"
                              value={item.requested_qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (Number(val) < 0) return;
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], requested_qty: val };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="0.00"
                            />
                          </FormField>
                        </div>

                        {/* 4. Vendor (Optional) */}
                        <div className="sm:col-span-2">
                          <FormField label={idx === 0 ? "Vendor" : ""}>
                            <Select
                              options={[
                                { value: '', label: 'Select Vendor...' },
                                ...vendors.map(v => ({ value: String(v.id), label: v.supplier_name || v.name || v.company_name || `Vendor #${v.id}` }))
                              ]}
                              value={item.supplier_id || ''}
                              onChange={(v) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], supplier_id: v };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="Select Vendor..."
                            />
                          </FormField>
                        </div>

                        {/* 5. Remarks (Optional) */}
                        <div className="sm:col-span-2">
                          <FormField label={idx === 0 ? "Remarks" : ""}>
                            <Input
                              value={item.remarks || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], remarks: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. Approved brand"
                            />
                          </FormField>
                        </div>

                        {/* Delete */}
                        <div className={`sm:col-span-1 flex items-center justify-center ${idx === 0 ? 'sm:pb-0.5' : 'sm:pb-0'}`}>
                          {form.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                              onClick={() => {
                                const nextItems = form.items.filter((_, i) => i !== idx);
                                handleFormChange('items', nextItems);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
                      { material_id: '', specification: '', requested_qty: '', supplier_id: '', remarks: '', uom_id: '', estimated_rate: '0' }
                    ];
                    handleFormChange('items', nextItems);
                  }}
                  className="mt-2 text-xs"
                >
                  Add Another Item
                </Button>
              </div>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="edit-mra-form"
            submitLabel="Save Changes"
            onCancel={() => setEditingItem(null)}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Admin Change Status Dialog */}
      {statusChangeItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                Change Status
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setStatusChangeItem(null)}>✕</Button>
            </div>

            <p className="text-xs text-text-secondary">
              Indent Reference: <span className="font-mono font-bold text-primary">{statusChangeItem.request_no}</span>
            </p>

            <FormField label="New Status" required>
              <Select
                options={
                  statusOptions.length > 0
                    ? statusOptions.map(s => ({ value: String(s.id), label: s.status_name || s.name }))
                    : [
                        { value: 'submitted', label: 'Submitted' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                      ]
                }
                value={selectedNewStatus}
                onChange={setSelectedNewStatus}
                placeholder="Select New Status"
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setStatusChangeItem(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleChangeStatus}
                isSubmitting={loading}
                disabled={!selectedNewStatus}
              >
                Update Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Material Request?"
        description={`Are you sure you want to delete "${deleteItem?.request_no}"?`}
        confirmLabel="Delete"
        destructive={true}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
