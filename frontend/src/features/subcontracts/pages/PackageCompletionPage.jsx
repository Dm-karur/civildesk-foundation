import { useState, useEffect, useMemo } from 'react';
import {
  Award, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  Check, AlertCircle, Sparkles, Printer, ArrowRight, Layers, FileCheck
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
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  certificate_no: '',
  package_title: '',
  work_order_no: 'WO-2026-012',
  contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
  actual_completion_date: '',
  final_contract_value: '1500000',
  snag_list_status: '100% Snags Cleared',
  dlp_period: '12 Months',
  as_built_status: 'Handed Over & Approved',
  notes: '',
};

export function PackageCompletionPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [completions, setCompletions] = useState([]);
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_subcontracts_PackageCompletionPage');
      if (saved) {
        setCompletions(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_subcontracts_PackageCompletionPage');
    if (completions.length > 0 || saved) {
       localStorage.setItem('mock_subcontracts_PackageCompletionPage', JSON.stringify(completions));
    }
  }, [completions]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      certificate_no: `TOC-2026-00${completions.length + 6}`,
      actual_completion_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      certificate_no: item.certificate_no || '',
      package_title: item.package_title || '',
      work_order_no: item.work_order_no || '',
      contractor_name: item.contractor_name || '',
      actual_completion_date: item.actual_completion_date || '',
      final_contract_value: String(item.final_contract_value || '1500000'),
      snag_list_status: item.snag_list_status || '100% Snags Cleared',
      dlp_period: item.dlp_period || '12 Months',
      as_built_status: item.as_built_status || 'Handed Over & Approved',
      notes: item.notes || '',
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
    if (!form.certificate_no.trim()) errs.certificate_no = 'Certificate number is required';
    if (!form.package_title.trim()) errs.package_title = 'Package title is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const val = Number(form.final_contract_value || 0);

      const newTOC = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        certificate_no: form.certificate_no,
        package_title: form.package_title,
        work_order_no: form.work_order_no,
        contractor_name: form.contractor_name,
        actual_completion_date: form.actual_completion_date,
        final_contract_value: val,
        snag_list_status: form.snag_list_status,
        dlp_period: form.dlp_period,
        as_built_status: form.as_built_status,
        status_name: 'Taking-Over Certified (TOC Issued)',
        certified_by: 'Er. Suresh Babu (Project Director)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setCompletions(prev => prev.map(c => c.id === editingItem.id ? newTOC : c));
        toast.success('Completion handover certificate updated.');
      } else {
        setCompletions(prev => [newTOC, ...prev]);
        toast.success('Taking-Over Certificate (TOC) issued.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to issue completion certificate.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setCompletions(prev => prev.filter(c => c.id !== deleteItem.id));
    toast.success('Certificate removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return completions.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(c.certificate_no || '').toLowerCase();
        const pack = String(c.package_title || '').toLowerCase();
        const cont = String(c.contractor_name || '').toLowerCase();
        if (!no.includes(s) && !pack.includes(s) && !cont.includes(s)) return false;
      }
      return true;
    });
  }, [completions, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCompletedVal = useMemo(() => completions.reduce((acc, c) => acc + Number(c.final_contract_value || 0), 0), [completions]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Package Completion & TOC' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Package Completion & Taking-Over Handover"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Completed Packages"
            value={`${completions.length} Packages`}
            status="primary"
            icon={<Award className="w-4 h-4" />}
          />
          <KpiCard
            label="Final Reconciled Value"
            value={`₹${(totalCompletedVal / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Snag List Clearance"
            value="100% Cleared"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Defect Liability (DLP)"
            value="Active Monitoring"
            status="neutral"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
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
                placeholder="Search TOC no, package, contractor..."
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
              title="Print TOC Register"
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
              Issue Completion Certificate
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
                  <th className="px-3 py-2 w-28">TOC No</th>
                  <th className="px-3 py-2">Completed Package & Contractor</th>
                  <th className="px-3 py-2 w-28">Completion</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Final Value</th>
                  <th className="px-3 py-2 text-center w-36">Snags & DLP</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading package completion records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No package completion certificates found.
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
                          {c.certificate_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{c.work_order_no}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.package_title}>
                            {c.package_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.contractor_name} • {c.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                        {c.actual_completion_date}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{c.final_contract_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="text-[10px] font-mono text-emerald-700 font-semibold">{c.snag_list_status}</div>
                        <div className="text-[9px] text-text-muted truncate">{c.dlp_period}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          TOC Certified
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View TOC 360"
                            onClick={() => setViewingItem(c)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.certificate_no} • {c.actual_completion_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.package_title}</h4>
                  <span className="text-[11px] text-text-muted">{c.contractor_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{c.final_contract_value.toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 text-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">✓ {c.snag_list_status}</span>
                <span className="text-[11px] text-text-muted font-mono">{c.dlp_period}</span>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View TOC Dossier
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

      {/* View TOC 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.certificate_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Final Settled Value</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.final_contract_value.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Completion Date</span> <span className="font-mono">{viewingItem.actual_completion_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Snag List Clearance</span> <span className="font-semibold text-emerald-700">{viewingItem.snag_list_status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Defect Liability (DLP)</span> <span className="font-mono">{viewingItem.dlp_period}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Package Scope Title</span> <span className="text-text-primary font-medium">{viewingItem.package_title}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Handover & Demobilization Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print TOC Certificate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit TOC Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Award}
          title={editingItem ? 'Edit Completion Certificate' : 'Issue Taking-Over Certificate (TOC)'}
          subtitle="Record final package reconciliation, snag clearance, as-built drawings, and DLP warranty."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="toc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Certificate Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="TOC Certificate No" required error={errors.certificate_no}>
                  <Input
                    value={form.certificate_no}
                    onChange={(e) => handleFormChange('certificate_no', e.target.value)}
                    placeholder="TOC-2026-008"
                  />
                </FormField>

                <FormField label="Package Scope Title" required error={errors.package_title} className="md:col-span-2">
                  <Input
                    value={form.package_title}
                    onChange={(e) => handleFormChange('package_title', e.target.value)}
                    placeholder="e.g. Basement Deep Dewatering & Piling Scope"
                  />
                </FormField>

                <FormField label="Contractor Name" className="md:col-span-2">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Civil Infra Pvt Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Completion Valuation & Warranty (DLP)">
              <EntityEditModal.Grid>
                <FormField label="Final Contract Value (₹)" required>
                  <Input
                    type="number"
                    value={form.final_contract_value}
                    onChange={(e) => handleFormChange('final_contract_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Actual Completion Date">
                  <Input
                    type="date"
                    value={form.actual_completion_date}
                    onChange={(e) => handleFormChange('actual_completion_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Defect Liability Period (DLP)">
                  <Input
                    value={form.dlp_period}
                    onChange={(e) => handleFormChange('dlp_period', e.target.value)}
                    placeholder="12 Months (Valid till 2027-08-31)"
                  />
                </FormField>

                <FormField label="Snag List Clearance Status">
                  <Input
                    value={form.snag_list_status}
                    onChange={(e) => handleFormChange('snag_list_status', e.target.value)}
                    placeholder="100% Snags Cleared (0 Pending)"
                  />
                </FormField>

                <FormField label="Handover Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="As-built drawings verified, safety and environmental demobilization signed..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="toc-form"
            submitLabel={editingItem ? 'Update TOC' : 'Issue Taking-Over Certificate'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete TOC Certificate"
        message={`Are you sure you want to delete "${deleteItem?.certificate_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
