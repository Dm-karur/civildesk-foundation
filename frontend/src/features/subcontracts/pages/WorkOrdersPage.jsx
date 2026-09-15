import { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, IndianRupee, Clock, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, Send
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
import { projectsApi, subcontractsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  work_order_no: '',
  work_order_date: '',
  contractor_id: '',
  package_title: '',
  start_date: '',
  completion_date: '',
  total_order_value: '',
  retention_pct: '5.0',
  advance_pct: '10.0',
  scope_summary: '',
};

export function WorkOrdersPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
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

  const fetchList = () => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      subcontractsApi.contractors.list().catch(() => ({ data: [] })),
      subcontractsApi.workOrders.list().catch(() => ({ data: [] }))
    ]).then(([projRes, contrRes, woRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const cList = contrRes?.data?.subcontractors ?? contrRes?.data?.data ?? [];
      setContractors(Array.isArray(cList) ? cList : []);

      const woList = woRes?.data?.work_orders ?? woRes?.data?.data ?? [];
      if (Array.isArray(woList)) {
        const normalized = woList.map((w, idx) => {
          const matchedProj = pList.find(p => String(p.id) === String(w.project_id));
          const matchedContr = cList.find(c => String(c.id) === String(w.contractor_id));
          return {
            id: w.id,
            project_id: w.project_id,
            project_code: matchedProj?.project_code || 'PRJ-01',
            project_name: matchedProj?.project_name || 'Project Name',
            work_order_no: w.work_order_no || `WO-${w.id}`,
            work_order_date: w.work_order_date || '',
            contractor_id: w.contractor_id,
            contractor_name: matchedContr?.contractor_name || 'Subcontractor Partner',
            package_title: w.scope_of_work || 'Work Package',
            start_date: w.start_date || '',
            completion_date: w.completion_date || '',
            total_order_value: Number(w.total_order_value || 0),
            retention_pct: Number(w.retention_percent || 0),
            advance_pct: Number(w.advance_amount ? ((w.advance_amount / (w.total_order_value || 1)) * 100) : 0),
            certified_amount: Number(w.certified_amount || 0),
            paid_amount: Number(w.paid_amount || 0),
            status_name: w.status_name || 'Draft',
            signed_by: 'Er. Suresh Babu (Project Director)',
            scope_summary: w.scope_of_work || '',
          };
        });
        setWorkOrders(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      work_order_no: `WO-2026-0${workOrders.length + 15}`,
      work_order_date: today,
      start_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      work_order_no: item.work_order_no || '',
      work_order_date: item.work_order_date || '',
      contractor_id: String(item.contractor_id || ''),
      package_title: item.package_title || '',
      start_date: item.start_date || '',
      completion_date: item.completion_date || '',
      total_order_value: String(item.total_order_value || ''),
      retention_pct: String(item.retention_pct || '5.0'),
      advance_pct: String(item.advance_pct || '10.0'),
      scope_summary: item.scope_summary || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.contractor_id) errs.contractor_id = 'Contractor is required';
    if (!form.work_order_no.trim()) errs.work_order_no = 'WO number is required';
    if (!form.package_title.trim()) errs.package_title = 'Package title is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const orderVal = Number(form.total_order_value || 0);
      const advPct = Number(form.advance_pct || 0);
      const todayStr = new Date().toISOString().split('T')[0];
      const payload = {
        project_id: Number(form.project_id),
        contractor_id: Number(form.contractor_id),
        work_order_no: form.work_order_no,
        work_order_date: form.work_order_date || form.start_date || todayStr,
        scope_of_work: form.package_title,
        start_date: form.start_date || null,
        completion_date: form.completion_date || null,
        retention_percent: Number(form.retention_pct || 0),
        advance_amount: orderVal * (advPct / 100),
        currency_code: 'INR',
        terms_and_conditions: form.scope_summary,
      };

      if (editingItem?.id) {
        await subcontractsApi.workOrders.update(editingItem.id, payload);
        toast.success('Work order contract updated.');
      } else {
        await subcontractsApi.workOrders.create(payload);
        toast.success('Work order (WO) issued successfully.');
      }
      fetchList();
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save work order.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return workOrders.filter(w => {
      if (selectedProjectId !== 'all' && String(w.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !w.status_name.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(w.work_order_no || '').toLowerCase();
        const cont = String(w.contractor_name || '').toLowerCase();
        const pack = String(w.package_title || '').toLowerCase();
        const proj = String(w.project_name || '').toLowerCase();
        if (!no.includes(s) && !cont.includes(s) && !pack.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [workOrders, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCommitment = useMemo(() => workOrders.reduce((acc, w) => acc + Number(w.total_order_value || 0), 0), [workOrders]);
  const totalCertified = useMemo(() => workOrders.reduce((acc, w) => acc + Number(w.certified_amount || 0), 0), [workOrders]);

  const getStatusVariant = (st) => {
    if (st.includes('Approved') || st.includes('Active')) return 'success';
    if (st.includes('Submitted') || st.includes('Review')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Subcontract Work Orders (WO)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Work Orders (WO) & Packages"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Contracted Value"
            value={`₹${(totalCommitment / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Cumulative Certified"
            value={`₹${(totalCertified / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Contract Packages"
            value={`${workOrders.length} Packages`}
            status="neutral"
            icon={<Layers className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Average Retention"
            value="5.0% Standard"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
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
                  { value: 'Approved', label: 'Approved & Active' },
                  { value: 'Submitted', label: 'Submitted for Review' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search WO no, contractor, package..."
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
              title="Print WO Register"
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
              Issue Work Order
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
                  <th className="px-3 py-2 w-28">WO Number</th>
                  <th className="px-3 py-2">Package Title & Contractor</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Duration</th>
                  <th className="px-3 py-2 text-right w-28">Order Value</th>
                  <th className="px-3 py-2 text-right w-28">Certified</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading subcontract work orders...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No work orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((w, idx) => (
                    <tr key={w.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {w.work_order_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{w.work_order_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={w.package_title}>
                            {w.package_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {w.contractor_name} • {w.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        <div>{w.start_date}</div>
                        <div className="text-text-muted">to {w.completion_date}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{w.total_order_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-emerald-600 font-semibold">
                        ₹{w.certified_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(w.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {w.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View WO 360 Contract"
                            onClick={() => setViewingItem(w)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(w)}
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
          {paged.map((w, idx) => (
            <div key={w.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{w.work_order_no} • {w.work_order_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{w.package_title}</h4>
                  <span className="text-[11px] text-text-muted">{w.contractor_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(w.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {w.status_name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Contract Value</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{w.total_order_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Certified to Date</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{w.certified_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(w)}>
                  <Eye className="w-3 h-3 mr-1" /> View Full WO
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(w)}>
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

      {/* View Work Order 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.work_order_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Total Value</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.total_order_value.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Certified to Date</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.certified_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Deduction</span> <span className="font-mono font-bold text-amber-600">{viewingItem.retention_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Mobilization Advance</span> <span className="font-mono font-bold">{viewingItem.advance_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Contract Start Date</span> <span className="font-mono">{viewingItem.start_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Completion</span> <span className="font-mono text-primary font-bold">{viewingItem.completion_date}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Work Package Scope</span> <span className="text-text-primary font-medium">{viewingItem.package_title}</span></div>
              </div>

              {viewingItem.scope_summary && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Contract Specifications & Milestones:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.scope_summary}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Work Order Contract
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit WO Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingItem ? 'Edit Work Order' : 'Issue Subcontract Work Order (WO)'}
          subtitle="Formulate package agreement, contract sum, retention % and completion schedules."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="wo-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Work Order Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Work Order No" required error={errors.work_order_no}>
                  <Input
                    value={form.work_order_no}
                    onChange={(e) => handleFormChange('work_order_no', e.target.value)}
                    placeholder="WO-2026-020"
                  />
                </FormField>

                <FormField label="Contractor Name" required error={errors.contractor_id} className="md:col-span-2">
                  <Select
                    options={contractors.map(c => ({ value: String(c.id), label: `${c.contractor_code} - ${c.contractor_name}` }))}
                    value={form.contractor_id}
                    onChange={(v) => handleFormChange('contractor_id', v)}
                  />
                </FormField>

                <FormField label="Package Scope Title" required error={errors.package_title} className="md:col-span-2">
                  <Input
                    value={form.package_title}
                    onChange={(e) => handleFormChange('package_title', e.target.value)}
                    placeholder="e.g. RCC Sub-structure & Superstructure Work Package"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Terms & Schedule">
              <EntityEditModal.Grid>
                <FormField label="Total Contract Order Value (₹)" required>
                  <Input
                    type="number"
                    value={form.total_order_value}
                    onChange={(e) => handleFormChange('total_order_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Retention Percentage (%)">
                  <Input
                    type="number"
                    value={form.retention_pct}
                    onChange={(e) => handleFormChange('retention_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Mobilization Advance (%)">
                  <Input
                    type="number"
                    value={form.advance_pct}
                    onChange={(e) => handleFormChange('advance_pct', e.target.value)}
                  />
                </FormField>

                <FormField label="Contract Start Date">
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Target Completion Date" className="md:col-span-2">
                  <Input
                    type="date"
                    value={form.completion_date}
                    onChange={(e) => handleFormChange('completion_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Scope Specifications & Inclusions" className="md:col-span-2">
                  <Textarea
                    rows={3}
                    value={form.scope_summary}
                    onChange={(e) => handleFormChange('scope_summary', e.target.value)}
                    placeholder="Describe bill of quantities, unit rates, safety PPE requirements..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="wo-form"
            submitLabel={editingItem ? 'Update Work Order' : 'Issue Work Order'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Work Order"
        message={`Are you sure you want to delete "${deleteItem?.work_order_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
