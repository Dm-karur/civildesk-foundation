import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, CheckCircle2, Clock, AlertTriangle,
  Eye, Edit, Trash2, Plus, MoreVertical,
  ShieldCheck, RefreshCw
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
import { parseSpecification, formatSpecification } from './MaterialRequestFormPage';

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  request_date: '',
  required_by_date: '',
  priority_id: '',
  purpose: '',
  remarks: '',
  is_boq_required: false,
  items: [{ material_id: '', brand: '', size: '', variant: '', supplier_id: '', requested_qty: '', uom_id: '', estimated_rate: '0' }]
};

export function MaterialRequestsPage() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Admin check using existing permission system
  const isAdmin = Boolean(user?.is_super_admin);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
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

  // Three-dot menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Change Status dialog
  const [statusChangeItem, setStatusChangeItem] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);

  const [sites, setSites] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [users, setUsers] = useState([]);

  // Cache for fully fetched requests (with items)
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  // Filtered List
  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (priorityFilter !== 'all' && r.priority_name !== priorityFilter) return false;
      if (statusFilter !== 'all' && String(r.status_name).toUpperCase() !== String(statusFilter).toUpperCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (r.request_no || '').toLowerCase();
        const purp = (r.purpose || '').toLowerCase();
        const req = (r.requested_by || '').toLowerCase();
        const site = (r.site_name || '').toLowerCase();
        if (!no.includes(q) && !purp.includes(q) && !req.includes(q) && !site.includes(q)) return false;
      }
      return true;
    });
  }, [requests, selectedProjectId, priorityFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Load Projects & API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.suppliers.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.requests.list().catch(() => ({ data: [] })),
      usersApi.list().catch(() => ({ data: [] }))
    ]).then(([projRes, sitesRes, catRes, suppRes, mastersMatRes, reqRes, usersRes]) => {
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

      // Store status options for admin Change Status
      const stList = mastersData?.request_statuses ?? [];
      setStatusOptions(Array.isArray(stList) ? stList : []);

      const uResList = usersRes?.data?.users ?? usersRes?.users ?? (Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []);
      setUsers(Array.isArray(uResList) ? uResList : []);

      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? [];
      if (Array.isArray(rList)) {
        const mapped = rList.map(r => {
          const site = sList.find(s => String(s.id) === String(r.site_id));
          const proj = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const prio = prioList.find(p => String(p.id) === String(r.priority_id));

          return {
            ...r,
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
    }).finally(() => setLoading(false));
  }, []);

  // Auto-generate reference number based on date
  const generateRefNumber = (dateStr) => {
    const datePart = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const existingCount = requests.filter(r => (r.request_no || '').includes(`MR-${datePart}`)).length;
    const seqPart = String(existingCount + 1).padStart(3, '0');
    return `MR-${datePart}-${seqPart}`;
  };

  const handleOpenAdd = () => {
    navigate('/materials/requests/new');
  };

  // Auto-fetch details for the current page requests
  useEffect(() => {
    const missingIds = paged
      .map(r => r.id)
      .filter(id => !detailsMap[id]);

    if (missingIds.length === 0) return;

    setDetailsLoading(true);
    Promise.all(
      missingIds.map(id => 
        materialManagementApi.requests.get(id)
          .then(res => {
            const req = res?.data?.material_request ?? res?.material_request;
            return { id, req };
          })
          .catch(() => ({ id, req: null }))
      )
    ).then(results => {
      setDetailsMap(prev => {
        const next = { ...prev };
        results.forEach(({ id, req }) => {
          if (req) {
            next[id] = req;
          }
        });
        return next;
      });
    }).finally(() => {
      setDetailsLoading(false);
    });
  }, [paged, detailsMap]);

  const getUserName = (userId) => {
    const u = users.find(usr => String(usr.id) === String(userId));
    return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : userId ? `User #${userId}` : '—';
  };

  const handleOpenEdit = (item) => {
    setOpenMenuId(null);
    navigate(`/materials/requests/${item.id}/edit`);
  };

  const handleOpenView = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.requests.get(item.id);
      const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
      setViewingItem({ ...item, ...fullReq });
    } catch {
      setViewingItem(item);
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
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.site_id) errs.site_id = 'Site location is required';
    if (!form.priority_id) errs.priority_id = 'Priority is required';
    
    // Validate items
    const itemErrors = [];
    form.items.forEach((item, index) => {
      const itemErr = {};
      if (!item.material_id) itemErr.material_id = 'Material is required';
      if (!item.requested_qty || Number(item.requested_qty) <= 0) itemErr.requested_qty = 'Quantity must be > 0';
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
      let requestId = editingItem?.id;

      const preparedItems = form.items.map(item => {
        const mat = materials.find(m => String(m.id) === String(item.material_id));
        const specVal = formatSpecification(item.brand, item.size, item.variant) || item.specification || item.variant || item.size || null;
        const suppId = item.supplier_id ? Number(item.supplier_id) : null;
        return {
          material_id: Number(item.material_id),
          uom_id: Number(item.uom_id || mat?.uom_id || mat?.unit_id || 1),
          requested_qty: Number(item.requested_qty),
          estimated_rate: Number(item.estimated_rate || 0),
          specification: specVal,
          specification_note: specVal,
          variant: specVal,
          spec: specVal,
          item_specification: specVal,
          material_variant: specVal,
          size: specVal,
          description: specVal,
          remarks: null,
          supplier_id: suppId,
          vendor_id: suppId,
          material_supplier_id: suppId,
          preferred_supplier_id: suppId
        };
      });

      const combinedPurpose = form.remarks 
        ? (form.purpose ? `${form.purpose} | Remarks: ${form.remarks}` : form.remarks)
        : (form.purpose || 'Site Material Requirement');

      if (requestId) {
        // Update header
        await materialManagementApi.requests.update(requestId, {
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_date: form.request_date || new Date().toISOString().split('T')[0],
          required_by_date: form.required_by_date || new Date().toISOString().split('T')[0],
          priority_id: Number(form.priority_id),
          purpose: combinedPurpose,
          remarks: form.remarks || ''
        });

        // Sync items
        const origItems = editingItem.items || [];
        const origItemIds = origItems.map(i => i.id);
        const newItemIds = form.items.filter(i => i.id).map(i => i.id);

        const deletedIds = origItemIds.filter(id => !newItemIds.includes(id));
        for (const itemId of deletedIds) {
          await materialManagementApi.requests.removeItem(requestId, itemId);
        }

        for (const itemPayload of preparedItems) {
          const matchingOrig = form.items.find(i => i.material_id === String(itemPayload.material_id) && i.id);
          if (matchingOrig?.id) {
            await materialManagementApi.requests.updateItem(requestId, matchingOrig.id, itemPayload);
          } else {
            await materialManagementApi.requests.addItem(requestId, itemPayload);
          }
        }
        toast.success('Material request updated.');
      } else {
        // Auto-generate reference number
        const autoRef = generateRefNumber(form.request_date);

        // Create header & items
        const headerRes = await materialManagementApi.requests.create({
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_no: autoRef,
          request_date: form.request_date || new Date().toISOString().split('T')[0],
          required_by_date: form.required_by_date || new Date().toISOString().split('T')[0],
          priority_id: Number(form.priority_id),
          purpose: combinedPurpose,
          remarks: form.remarks || '',
          items: preparedItems
        });

        requestId = headerRes?.data?.material_request?.id ?? headerRes?.material_request?.id ?? headerRes?.id;
        
        if (requestId) {
          // If items were not saved automatically during header creation, ensure items are attached
          const createdItems = headerRes?.data?.material_request?.items ?? headerRes?.material_request?.items ?? [];
          if (!createdItems || createdItems.length === 0) {
            for (const itemPayload of preparedItems) {
              try {
                await materialManagementApi.requests.addItem(requestId, itemPayload);
              } catch (itemErr) {
                console.warn('Item addition notice:', itemErr);
              }
            }
          }

          // Immediately submit to set status to SUBMITTED
          try {
            await materialManagementApi.requests.action(requestId, 'submit');
          } catch (subErr) {
            console.warn('Auto-submit action notice:', subErr);
          }
        }
        toast.success('Material request submitted successfully.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      await loadRequests();
    } catch (err) {
      console.error('Material request submit error:', err);
      toast.error(err?.message || err?.data?.message || 'Failed to save material request. Check required fields.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await materialManagementApi.requests.remove(deleteItem.id);
      toast.success('Material request deleted successfully.');
      setDeleteItem(null);
      await loadRequests();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete request.');
    } finally {
      setLoading(false);
    }
  };

  // Change Status handler (Admin only)
  const handleChangeStatus = async () => {
    if (!statusChangeItem || !selectedNewStatus) return;
    setLoading(true);
    try {
      await materialManagementApi.requests.update(statusChangeItem.id, {
        status_id: Number(selectedNewStatus)
      });
      toast.success('Status updated successfully.');
      setStatusChangeItem(null);
      setSelectedNewStatus('');
      await loadRequests();
    } catch (err) {
      toast.error(err?.message || 'Failed to change status.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const reqRes = await materialManagementApi.requests.list();
      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? [];
      if (Array.isArray(rList)) {
        const mapped = rList.map(r => {
          const site = sites.find(s => String(s.id) === String(r.site_id));
          const proj = projects.find(p => String(p.id) === String(r.project_id));
          const prio = priorities.find(p => String(p.id) === String(r.priority_id));
          
          return {
            ...r,
            site_name: site?.site_name || '',
            project_name: proj?.project_name || '',
            priority_name: prio?.priority_name || 'Normal',
            status_name: r.status_name || r.status_code || r.status || 'Submitted'
          };
        });
        setRequests(mapped);
      }
    } catch (err) {
      console.error('Failed to reload requests:', err);
    }
  };

  // Metrics
  const pendingCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'SUBMITTED' || s === 'PENDING APPROVAL';
  }).length, [requests]);
  
  const approvedCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'APPROVED' || s === 'ORDERED' || s === 'PARTIALLY ORDERED';
  }).length, [requests]);
  
  const criticalCount = useMemo(() => requests.filter(r => {
    const p = String(r.priority_name).toUpperCase();
    return p === 'CRITICAL' || p === 'URGENT';
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

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Requests' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Requests"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Indent Requests"
            value={requests.length}
            status="primary"
            icon={<Send className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Approvals"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved & Dispatched"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Urgent / Critical Priority"
            value={`${criticalCount} Indents`}
            status={criticalCount > 0 ? 'warning' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
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

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Submitted', label: 'Pending Approval' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Ordered', label: 'Ordered' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search indent no, material, purpose..."
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
              Material Request
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
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
                  <th className="px-3 py-2 w-32">Indent Ref Number</th>
                  <th className="px-3 py-2 w-32">Project</th>
                  <th className="px-3 py-2 w-32">Site</th>
                  <th className="px-3 py-2 w-28">Request By</th>
                  <th className="px-3 py-2 text-center w-24">Expected Date</th>
                  <th className="px-3 py-2 w-24 text-right">Amount</th>
                  <th className="px-3 py-2 text-center w-20">Priority</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material requests...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-text-muted text-[12px]">
                      No material requests found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => {
                    const reqDetails = detailsMap[r.id];
                    const estAmt = reqDetails?.items?.reduce((sum, item) => sum + Number(item.estimated_amount || 0), 0) ?? 0;
                    const isMenuOpen = openMenuId === r.id;

                    return (
                      <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {r.request_no}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-text-primary text-[11px]">
                          {r.project_name || '—'}
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          <span className="truncate block" title={r.site_name}>
                            {r.site_name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary text-[11px]">
                          {getUserName(r.requested_by || r.created_by)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px]">
                          <span className="text-text-primary font-medium">{r.required_by_date || '—'}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
                          {estAmt > 0 ? `₹${estAmt.toLocaleString('en-IN')}` : '—'}
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
                          <div className="flex items-center justify-center gap-0.5">
                            {/* View Button */}
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
                                  <button
                                    onClick={() => {
                                      handleOpenEdit(r);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                                    <span>Edit</span>
                                  </button>

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
            const reqDetails = detailsMap[r.id];
            const estAmt = reqDetails?.items?.reduce((sum, item) => sum + Number(item.estimated_amount || 0), 0) ?? 0;
            const isMenuOpen = openMenuId === `mobile-${r.id}`;

            return (
              <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary block">{r.request_no}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">
                      {r.project_name || 'Material Request'}
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

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60 font-mono">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Amount</span>
                    <span className="font-bold text-primary text-[12px]">{estAmt > 0 ? `₹${estAmt.toLocaleString('en-IN')}` : '—'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Expected Date</span>
                    <span className="text-text-primary text-[11px] font-medium">{r.required_by_date || '—'}</span>
                  </div>
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
                      title="More Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 bottom-8 z-50 w-44 bg-surface border border-border rounded-sm shadow-xl p-1 text-[11px] animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                        >
                          <Edit className="w-3.5 h-3.5 text-text-secondary" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => { setDeleteItem(r); setOpenMenuId(null); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-error/10 flex items-center gap-2 text-error"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                        {isAdmin && (
                          <>
                            <div className="border-t border-border my-1"></div>
                            <button
                              onClick={() => { setStatusChangeItem(r); setSelectedNewStatus(''); setOpenMenuId(null); }}
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

      {/* View Detail Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.request_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">
                    {viewingItem.project_name || projects.find(p => String(p.id) === String(viewingItem.project_id))?.project_name || '—'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">

              {/* General Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Request Date</span>
                  <span className="font-mono text-text-primary font-semibold">{viewingItem.request_date}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Expected Date</span>
                  <span className="font-mono text-text-primary font-bold text-red-600">{viewingItem.required_by_date}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Priority</span>
                  <span className="font-semibold text-text-primary uppercase">
                    {viewingItem.priority_name || priorities.find(p => String(p.id) === String(viewingItem.priority_id))?.name || viewingItem.priority || 'Normal'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-primary uppercase">
                    {viewingItem.status_name || viewingItem.status_code || viewingItem.status || 'Submitted'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Requested By</span>
                  <span className="text-text-primary font-semibold">{getUserName(viewingItem.requested_by || viewingItem.created_by)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Site Location</span>
                  <span className="text-text-primary font-medium">
                    {viewingItem.site_name || sites.find(s => String(s.id) === String(viewingItem.site_id))?.site_name || '—'}
                  </span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-text-primary block text-[11px]">Material Requisition Details</span>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-surface-muted font-bold text-text-secondary border-b border-border">
                      <tr>
                        <th className="p-2">Material Item</th>
                        <th className="p-2 text-center">UOM</th>
                        <th className="p-2 text-right">Requested Qty</th>
                        <th className="p-2 text-right">Approved Qty</th>
                        <th className="p-2 text-right">Est. Rate</th>
                        <th className="p-2 text-right">Est. Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {viewingItem.items?.map((item, i) => {
                        const baseUom = uoms.find(u => String(u.id) === String(item.uom_id));
                        const itemVendor = vendors.find(v => String(v.id) === String(item.supplier_id || item.vendor_id || item.material_supplier_id));
                        const mat = materials.find(m => String(m.id) === String(item.material_id));
                        const itemSpec = item.specification || item.variant || item.size || item.spec || item.item_specification || item.material_variant || item.description || mat?.specification || mat?.variant || mat?.size;
                        const parsedSpec = parseSpecification(itemSpec || '');
                        const brand = item.brand || parsedSpec.brand;
                        const size = item.size || parsedSpec.size;
                        const variant = item.variant || parsedSpec.variant;
                        return (
                          <tr key={item.id || i} className="hover:bg-surface-muted/20">
                            <td className="p-2 font-medium text-text-primary">
                              <div>
                                {item.material_code ? `${item.material_code} - ${item.material_name}` : item.material_name || `Material #${item.material_id}`}
                              </div>
                              {(brand || size || variant || itemVendor || item.remarks) && (
                                <div className="text-[11px] text-text-muted space-y-0.5 mt-1">
                                  {brand && <div><span className="font-semibold text-text-secondary">Brand:</span> {brand}</div>}
                                  {size && <div><span className="font-semibold text-text-secondary">Size:</span> {size}</div>}
                                  {variant && <div><span className="font-semibold text-text-secondary">Variant:</span> {variant}</div>}
                                  {itemVendor && <div><span className="font-semibold text-text-secondary">Vendor:</span> {itemVendor.supplier_name || itemVendor.name || itemVendor.company_name}</div>}
                                  {item.remarks && <div><span className="font-semibold text-text-secondary">Remarks:</span> {item.remarks}</div>}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-center font-mono text-text-secondary">
                              {baseUom?.unit_code || '—'}
                            </td>
                            <td className="p-2 text-right font-mono font-medium">
                              {item.requested_qty}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-600">
                              {item.approved_qty ?? item.requested_qty}
                            </td>
                            <td className="p-2 text-right font-mono text-text-secondary">
                              ₹{Number(item.estimated_rate || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 text-right font-mono font-semibold text-text-primary">
                              ₹{Number(item.estimated_amount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purpose */}
              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-3 space-y-1 bg-surface-muted/10">
                  <span className="font-bold text-text-primary block text-[11px]">Purpose & Scope:</span>
                  <p className="text-text-secondary text-[11px] leading-relaxed italic">"{viewingItem.purpose}"</p>
                </div>
              )}

            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Material Request Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Send}
          title={editingItem ? 'Edit Material Request' : 'New Material Request'}
          subtitle="Submit material requisition for project site requirements."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="mrn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Project & Location Information">
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

            <EntityEditModal.Section title="Urgency & Scope">
              <EntityEditModal.Grid>
                <FormField label="Priority Level" required error={errors.priority_id}>
                  <Select
                    options={priorities.map(p => ({ value: String(p.id), label: p.priority_name }))}
                    value={form.priority_id}
                    onChange={(v) => handleFormChange('priority_id', v)}
                    placeholder="Select Priority"
                  />
                </FormField>

                <FormField label="Expected Date">
                  <Input
                    type="date"
                    value={form.required_by_date}
                    onChange={(e) => handleFormChange('required_by_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Purpose & Activity Scope" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="Describe specific work activity requiring these materials..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Items List">
              <div className="space-y-3">
                {form.items && form.items.map((item, idx) => {
                  const itemErr = errors.items?.[idx] || {};

                  return (
                    <div key={idx} className="bg-surface-muted/30 p-3 rounded-lg border border-border/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-12 gap-2.5 items-end">
                        {/* 1. Material */}
                        <div className="sm:col-span-2 md:col-span-4 xl:col-span-4">
                          <FormField label={idx === 0 ? "Material" : ""} required error={itemErr.material_id}>
                            <Select
                              options={materials.map(m => ({ value: String(m.id), label: `${m.material_code} - ${m.material_name}` }))}
                              value={item.material_id}
                              onChange={(v) => {
                                const nextItems = [...form.items];
                                const mat = materials.find(m => String(m.id) === String(v));
                                nextItems[idx] = {
                                  ...nextItems[idx],
                                  material_id: v,
                                  uom_id: mat ? String(mat.base_uom_id || mat.unit_id || '') : '',
                                  estimated_rate: mat?.standard_rate ? String(mat.standard_rate) : '0'
                                };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="Select Material..."
                            />
                          </FormField>
                        </div>

                        {/* 2. Brand */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-2">
                          <FormField label={idx === 0 ? "Brand" : ""}>
                            <Input
                              value={item.brand || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], brand: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. Tata"
                            />
                          </FormField>
                        </div>

                        {/* 3. Size */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
                          <FormField label={idx === 0 ? "Size" : ""}>
                            <Input
                              value={item.size || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], size: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. 12mm"
                            />
                          </FormField>
                        </div>

                        {/* 4. Varient */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
                          <FormField label={idx === 0 ? "Varient" : ""}>
                            <Input
                              value={item.variant || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], variant: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. Fe500D"
                            />
                          </FormField>
                        </div>

                        {/* 5. Vendor */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-2">
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

                        {/* 6. Required Quantity */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
                          <FormField label={idx === 0 ? "Required Quantity" : ""} required error={itemErr.requested_qty}>
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

                        {/* Action / Delete */}
                        <div className={`sm:col-span-1 md:col-span-2 xl:col-span-1 flex items-center justify-center ${idx === 0 ? 'sm:pb-0.5' : 'sm:pb-0'}`}>
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
                              title="Delete Item"
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
                      { material_id: '', brand: '', size: '', variant: '', supplier_id: '', requested_qty: '', uom_id: '', estimated_rate: '0' }
                    ];
                    handleFormChange('items', nextItems);
                  }}
                  className="mt-2 text-xs"
                >
                  Add Another Item
                </Button>
              </div>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="General Remarks">
              <FormField>
                <Textarea
                  rows={3}
                  value={form.remarks || ''}
                  onChange={(e) => handleFormChange('remarks', e.target.value)}
                  placeholder="Enter any additional instructions or general remarks for this material request..."
                />
              </FormField>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="mrn-form"
            submitLabel={editingItem ? 'Update Material Request' : 'Submit Material Request'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
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
            <p className="text-xs text-text-secondary">
              Current Status: <Badge variant={getStatusVariant(statusChangeItem.status_name)} className="text-[9px] font-bold uppercase ml-1">{statusChangeItem.status_name}</Badge>
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
                        { value: 'ordered', label: 'Ordered' },
                        { value: 'cancelled', label: 'Cancelled' },
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
        description={`Are you sure you want to delete "${deleteItem?.request_no}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive={true}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
