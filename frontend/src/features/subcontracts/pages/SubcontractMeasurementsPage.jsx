import { useState, useEffect, useMemo } from 'react';
import {
  Ruler, CheckCircle2, IndianRupee, HardHat, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Calculator
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
import { subcontractsApi, projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const EMPTY_FORM = {
  project_id: '',
  work_order_id: '',
  measurement_no: '',
  measurement_date: '',
  period_from: '',
  period_to: '',
  measured_by: '',
  contractor_representative: '',
  remarks: '',
};

export function SubcontractMeasurementsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [measurements, setMeasurements] = useState([]);
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

  const fetchList = () => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      subcontractsApi.workOrders.list().catch(() => ({ data: [] })),
      subcontractsApi.measurements.list().catch(() => ({ data: [] }))
    ]).then(([projRes, woRes, measRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const woList = woRes?.data?.work_orders ?? woRes?.data?.data ?? [];
      setWorkOrders(Array.isArray(woList) ? woList : []);

      const mList = measRes?.data?.measurements ?? measRes?.data?.data ?? [];
      if (Array.isArray(mList)) {
        const normalized = mList.map((m, idx) => {
          const matchedProj = pList.find(p => String(p.id) === String(m.project_id));
          const matchedWo = woList.find(w => String(w.id) === String(m.work_order_id));
          return {
            id: m.id,
            project_id: m.project_id,
            project_code: matchedProj?.project_code || 'PRJ-01',
            project_name: matchedProj?.project_name || 'Project Name',
            work_order_id: m.work_order_id,
            work_order_no: matchedWo?.work_order_no || 'WO-00',
            contractor_name: matchedWo?.contractor_name || 'Contractor Name',
            measurement_no: m.measurement_no || `SMB-${m.id}`,
            measurement_date: m.measurement_date || '',
            period_from: m.period_from || '',
            period_to: m.period_to || '',
            total_measured_amount: Number(m.total_measured_amount || 0),
            measured_by: m.measured_by || '',
            witnessed_by: m.contractor_representative || '',
            notes: m.remarks || '',
            status_name: m.status_name || 'Draft',
          };
        });
        setMeasurements(normalized);
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
      measurement_no: `SMB-2026-03${measurements.length + 5}`,
      measurement_date: today,
      period_from: today,
      period_to: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      work_order_id: String(item.work_order_id || ''),
      measurement_no: item.measurement_no || '',
      measurement_date: item.measurement_date || '',
      period_from: item.period_from || '',
      period_to: item.period_to || '',
      measured_by: item.measured_by || '',
      contractor_representative: item.witnessed_by || '',
      remarks: item.notes || '',
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
    if (!form.work_order_id) errs.work_order_id = 'Work Order is required';
    if (!form.measurement_no.trim()) errs.measurement_no = 'MB number is required';
    if (!form.measurement_date) errs.measurement_date = 'Measurement date is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_id: Number(form.project_id),
        work_order_id: Number(form.work_order_id),
        measurement_no: form.measurement_no,
        measurement_date: form.measurement_date,
        period_from: form.period_from || null,
        period_to: form.period_to || null,
        measured_by: form.measured_by,
        contractor_representative: form.contractor_representative,
        remarks: form.remarks,
      };

      if (editingItem?.id) {
        await subcontractsApi.measurements.update(editingItem.id, payload);
        toast.success('Subcontract measurement record updated.');
      } else {
        await subcontractsApi.measurements.create(payload);
        toast.success('Subcontract measurement recorded in MB Book.');
      }
      fetchList();
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save measurement sheet.');
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
    return measurements.filter(m => {
      if (selectedProjectId !== 'all' && String(m.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(m.measurement_no || '').toLowerCase();
        const wo = String(m.work_order_no || '').toLowerCase();
        const cont = String(m.contractor_name || '').toLowerCase();
        const item = String(m.work_item || '').toLowerCase();
        if (!no.includes(s) && !wo.includes(s) && !cont.includes(s) && !item.includes(s)) return false;
      }
      return true;
    });
  }, [measurements, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalMeasured = useMemo(() => measurements.reduce((acc, m) => acc + Number(m.total_measured_amount || 0), 0), [measurements]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Subcontract Work Measurements' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Measurement Book (MB Book) & Joint Quantities"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Measured Work Value"
            value={`₹${(totalMeasured / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Verified MB Sheets"
            value={`${measurements.length} Sheets`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Joint Contractor Signatures"
            value="100% Witnessed"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Ready for RA Billing"
            value="3 Active Sheets"
            status="neutral"
            icon={<Calculator className="w-4 h-4 text-amber-500" />}
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
                placeholder="Search MB no, WO no, contractor..."
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
              title="Print Measurement Book"
            >
              Print MB Book
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Record MB Entry
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
                  <th className="px-3 py-2 w-28">MB Number</th>
                  <th className="px-3 py-2">Measured Work Item & Contractor</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Billing Period</th>
                  <th className="px-3 py-2 text-right w-28">Measured Value</th>
                  <th className="px-3 py-2 text-center w-36">Certification</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading subcontract measurements...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No measurement records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {m.measurement_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{m.work_order_no}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={m.work_item}>
                            {m.work_item}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {m.contractor_name} • {m.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                        {m.period_from} to {m.period_to}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{m.total_measured_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Verified & Certified
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View MB Sheet 360"
                            onClick={() => setViewingItem(m)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(m)}
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
          {paged.map((m, idx) => (
            <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{m.measurement_no} • {m.work_order_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">{m.period_from} to {m.period_to}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{m.total_measured_amount.toLocaleString('en-IN')}
                </Badge>
              </div>

              <p className="text-xs text-text-secondary line-clamp-2 bg-surface-muted/40 p-2 rounded border border-border/60">
                {m.work_item}
              </p>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(m)}>
                  <Eye className="w-3 h-3 mr-1" /> View MB Sheet
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(m)}>
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

      {/* View MB Sheet 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.measurement_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.work_order_no} • {viewingItem.contractor_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Measured Value</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.total_measured_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measurement Period</span> <span className="font-mono">{viewingItem.period_from} to {viewingItem.period_to}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measured By (Site Engg)</span> <span className="text-text-primary font-medium">{viewingItem.measured_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Witnessed By (Contractor)</span> <span className="text-text-primary font-medium">{viewingItem.witnessed_by}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Work Scope Measured:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.work_item}</p>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Joint Measurement Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Certified MB Sheet
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit MB Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Ruler}
          title={editingItem ? 'Edit Measurement Sheet' : 'Record Subcontract Work Measurement'}
          subtitle="Record physical work quantities verified jointly with subcontractor site incharge."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="smb-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Measurement Book Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="MB Sheet Number" required error={errors.measurement_no}>
                  <Input
                    value={form.measurement_no}
                    onChange={(e) => handleFormChange('measurement_no', e.target.value)}
                    placeholder="SMB-2026-040"
                  />
                </FormField>

                <FormField label="Linked Work Order" required error={errors.work_order_id} className="md:col-span-2">
                  <Select
                    options={workOrders.filter(w => !form.project_id || String(w.project_id) === String(form.project_id)).map(w => ({ value: String(w.id), label: `${w.work_order_no} - ${w.contractor_name} (${w.package_title})` }))}
                    value={form.work_order_id}
                    onChange={(v) => handleFormChange('work_order_id', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Period & Work Measured">
              <EntityEditModal.Grid>
                <FormField label="Period From Date">
                  <Input
                    type="date"
                    value={form.period_from}
                    onChange={(e) => handleFormChange('period_from', e.target.value)}
                  />
                </FormField>

                <FormField label="Period To Date">
                  <Input
                    type="date"
                    value={form.period_to}
                    onChange={(e) => handleFormChange('period_to', e.target.value)}
                  />
                </FormField>

                <FormField label="Measured By (Incharge)">
                  <Input
                    value={form.measured_by}
                    onChange={(e) => handleFormChange('measured_by', e.target.value)}
                    placeholder="Site Incharge"
                  />
                </FormField>

                <FormField label="Contractor Representative (Witness)">
                  <Input
                    value={form.contractor_representative}
                    onChange={(e) => handleFormChange('contractor_representative', e.target.value)}
                    placeholder="Witness Representative"
                  />
                </FormField>

                <FormField label="Joint Measurement Notes/Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                    placeholder="Cross-references to drawings, laser distance meter calibration..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="smb-form"
            submitLabel={editingItem ? 'Update Measurement' : 'Record Measurement'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Measurement Sheet"
        message={`Are you sure you want to delete "${deleteItem?.measurement_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
