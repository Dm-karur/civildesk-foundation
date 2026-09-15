import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, CheckCircle2, Clock, AlertTriangle, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
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
import { projectsApi, materialManagementApi, materialsApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  project_id: '',
  site_name: '',
  requisition_no: '',
  mr_no: '',
  requisition_date: '',
  required_by_date: '',
  priority: 'Normal',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  quantity: '100',
  uom: 'Bags',
  estimated_rate: '385',
  estimated_total: '38500',
  requested_by: 'Site Engineer',
  department: 'Civil Structural Works',
  status: 'Pending PR Approval',
  purpose: '',
  suggested_supplier: '',
};

export function PurchaseRequisitionsPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Load Projects & API Data safely
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialManagementApi.requests.list().catch(() => ({ data: [] }))
    ]).then(([projRes, sitesRes, catRes, reqRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? [];
      if (Array.isArray(rList) && rList.length > 0) {
        const normalized = rList.map((r, idx) => {
          const proj = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const site = sList.find(s => String(s.id) === String(r.site_id));

          return {
            id: r.id || idx + 1,
            project_id: r.project_id || 1,
            project_code: proj?.project_code || 'PRJ-2026-001',
            project_name: proj?.project_name || 'Civil Project',
            site_name: site?.site_name || r.site_name || 'Site Yard',
            requisition_no: `PR-2026-${String(idx + 1).padStart(3, '0')}`,
            mr_no: r.request_no || `MRN-2026-${String(idx + 1).padStart(3, '0')}`,
            requisition_date: r.request_date || new Date().toISOString().split('T')[0],
            required_by_date: r.required_by_date || new Date().toISOString().split('T')[0],
            priority: r.priority_name || r.priority || 'Normal',
            material_code: r.material_code || 'MAT-GEN-001',
            material_name: r.material_name || 'Construction Material',
            quantity: Number(r.quantity || r.requested_qty || 100),
            uom: r.uom || 'Nos',
            estimated_rate: Number(r.estimated_rate || 385),
            estimated_total: Number(r.estimated_total || (Number(r.quantity || r.requested_qty || 100) * Number(r.estimated_rate || 385))),
            requested_by: r.requested_by || 'Site Engineer',
            department: r.department || 'Civil Works',
            status: r.status_name || r.status || 'Pending PR Approval',
            purpose: r.purpose || '',
            suggested_supplier: r.suggested_supplier || 'Approved Vendor',
          };
        });
        setRequisitions(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Handle URL query param / navigation state from Material Requests page
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mrId = searchParams.get('mr_id');
    if (mrId && requisitions.length > 0) {
      const sourceReq = requisitions.find(r => String(r.id) === String(mrId));
      if (sourceReq) {
        setForm({
          ...EMPTY_FORM,
          project_id: String(sourceReq.project_id),
          site_name: sourceReq.site_name,
          mr_no: sourceReq.mr_no,
          requisition_no: `PR-2026-MR-${sourceReq.id}`,
          requisition_date: new Date().toISOString().split('T')[0],
          required_by_date: sourceReq.required_by_date,
          priority: sourceReq.priority,
          material_code: sourceReq.material_code,
          material_name: sourceReq.material_name,
          quantity: String(sourceReq.quantity),
          uom: sourceReq.uom,
          estimated_rate: String(sourceReq.estimated_rate),
          estimated_total: String(sourceReq.estimated_total),
          purpose: sourceReq.purpose,
          status: 'Pending PR Approval',
        });
        setIsAddOpen(true);
      }
    }
  }, [location.search, requisitions]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultRequired = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      requisition_no: `PR-2026-04${requisitions.length + 1}`,
      requisition_date: today,
      required_by_date: defaultRequired,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      site_name: item.site_name || '',
      requisition_no: item.requisition_no || '',
      requisition_date: item.requisition_date || '',
      required_by_date: item.required_by_date || '',
      priority: item.priority || 'Normal',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      quantity: String(item.quantity || '100'),
      uom: item.uom || 'Nos',
      estimated_rate: String(item.estimated_rate || '385'),
      estimated_total: String(item.estimated_total || '38500'),
      requested_by: item.requested_by || 'Site Engineer',
      department: item.department || 'Civil Structural Works',
      status: item.status || 'Pending PM Approval',
      purpose: item.purpose || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'estimated_rate') {
        const qty = Number(field === 'quantity' ? value : prev.quantity) || 0;
        const rate = Number(field === 'estimated_rate' ? value : prev.estimated_rate) || 0;
        next.estimated_total = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.requisition_no.trim()) errs.requisition_no = 'PR No is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const qty = Number(form.quantity || 0);
      const rate = Number(form.estimated_rate || 0);

      const newPR = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        site_name: form.site_name || 'Site Yard',
        requisition_no: form.requisition_no,
        requisition_date: form.requisition_date,
        required_by_date: form.required_by_date,
        priority: form.priority,
        material_code: form.material_code,
        material_name: form.material_name,
        quantity: qty,
        uom: form.uom,
        estimated_rate: rate,
        estimated_total: Number(form.estimated_total || qty * rate),
        requested_by: form.requested_by,
        department: form.department,
        status: form.status,
        purpose: form.purpose,
      };

      if (editingItem?.id) {
        setRequisitions(prev => prev.map(r => r.id === editingItem.id ? newPR : r));
        toast.success('Purchase requisition updated.');
      } else {
        setRequisitions(prev => [newPR, ...prev]);
        toast.success('Purchase requisition (PR) created.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save purchase requisition.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setRequisitions(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('Purchase requisition removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return requisitions.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && String(r.status || '') !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = String(r.requisition_no || '').toLowerCase();
        const mat = String(r.material_name || '').toLowerCase();
        const proj = String(r.project_name || '').toLowerCase();
        const purp = String(r.purpose || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !proj.includes(q) && !purp.includes(q)) return false;
      }
      return true;
    });
  }, [requisitions, selectedProjectId, priorityFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalEstimatedValue = useMemo(() => requisitions.reduce((acc, r) => acc + Number(r.estimated_total || 0), 0), [requisitions]);
  const pendingCount = useMemo(() => requisitions.filter(r => String(r.status || '').toLowerCase().includes('pending')).length, [requisitions]);
  const approvedCount = useMemo(() => requisitions.filter(r => String(r.status || '').toLowerCase().includes('approved')).length, [requisitions]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('pending')) return 'warning';
    if (s.includes('rejected')) return 'error';
    return 'neutral';
  };

  const getPriorityVariant = (priority) => {
    if (priority === 'Critical') return 'error';
    if (priority === 'Urgent') return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Purchase Requisitions' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Requisitions (PR) & Material Indents"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Requisitions"
            value={requisitions.length}
            status="primary"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Estimated Budget"
            value={`₹${totalEstimatedValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Approvals"
            value={`${pendingCount} PRs`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved for Procurement"
            value={`${approvedCount} PRs`}
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Pending PM Approval', label: 'Pending PM Approval' },
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
                placeholder="Search PR no, material, purpose..."
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
              title="Print Requisitions"
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              New Requisition (PR)
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
                  <th className="px-3 py-2 w-28">PR No.</th>
                  <th className="px-3 py-2">Material Item & Scope</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Site Location</th>
                  <th className="px-3 py-2 text-right w-24">Req Qty</th>
                  <th className="px-3 py-2 text-right w-28">Est. Budget</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading purchase requisitions...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase requisitions found matching criteria.
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
                          {r.requisition_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.requisition_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.material_name}>
                            {r.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate" title={r.purpose}>
                            {r.purpose}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-[11px] text-text-secondary truncate block" title={r.site_name}>
                          {r.site_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.quantity} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(r.estimated_total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getPriorityVariant(r.priority)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.priority}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View PR 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.requisition_no} • {r.requisition_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.site_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Required Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.quantity} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Est. Budget</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(r.estimated_total).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View PR
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

      {/* View PR 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.requisition_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Requested Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.quantity} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Budget</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.estimated_total).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Priority Level</span> <span className="font-semibold text-red-600">{viewingItem.priority}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Required On Site By</span> <span className="font-mono font-bold text-text-primary">{viewingItem.required_by_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Requested By</span> <span className="text-text-primary">{viewingItem.requested_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Site Location</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Work Scope & Justification:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.purpose}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print PR Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit PR Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ShoppingCart}
          title={editingItem ? 'Edit Purchase Requisition' : 'Create Purchase Requisition (PR)'}
          subtitle="Raise formal purchase requirement for project materials, equipment, or consumables."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="pr-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Project & Delivery Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="PR Number" required error={errors.requisition_no}>
                  <Input
                    value={form.requisition_no}
                    onChange={(e) => handleFormChange('requisition_no', e.target.value)}
                    placeholder="PR-2026-045"
                  />
                </FormField>

                <FormField label="Delivery Site / Store" className="md:col-span-2">
                  <Input
                    value={form.site_name}
                    onChange={(e) => handleFormChange('site_name', e.target.value)}
                    placeholder="e.g. Main Central Godown Bay 1"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Item & Estimated Budget">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Required Quantity">
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => handleFormChange('quantity', e.target.value)}
                  />
                </FormField>

                <FormField label="Estimated Unit Rate (₹)">
                  <Input
                    type="number"
                    value={form.estimated_rate}
                    onChange={(e) => handleFormChange('estimated_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Estimated Budget (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-primary bg-surface-muted"
                    value={`₹${Number(form.estimated_total).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Priority Level">
                  <Select
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Urgent', label: 'Urgent' },
                      { value: 'Critical', label: 'Critical' },
                    ]}
                    value={form.priority}
                    onChange={(v) => handleFormChange('priority', v)}
                  />
                </FormField>

                <FormField label="Required By Date">
                  <Input
                    type="date"
                    value={form.required_by_date}
                    onChange={(e) => handleFormChange('required_by_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Work Scope & Purpose" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="Describe specific structural element pour, masonry zone..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="pr-form"
            submitLabel={editingItem ? 'Update PR' : 'Create Requisition'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Requisition"
        message={`Are you sure you want to delete "${deleteItem?.requisition_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
