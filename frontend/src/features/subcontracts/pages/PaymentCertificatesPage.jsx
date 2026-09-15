import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  Check, AlertCircle, Sparkles, Printer, ArrowRight, Calculator
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
  issue_date: '',
  period_from: '',
  period_to: '',
  work_order_no: 'WO-2026-012',
  contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
  gross_certified_value: '500000',
  retention_deduction: '25000',
  advance_recovery: '50000',
  tds_deduction: '10000',
  net_certified_amount: '415000',
  notes: '',
};

export function PaymentCertificatesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
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
      const saved = localStorage.getItem('mock_subcontracts_PaymentCertificatesPage');
      if (saved) {
        setCertificates(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_subcontracts_PaymentCertificatesPage');
    if (certificates.length > 0 || saved) {
       localStorage.setItem('mock_subcontracts_PaymentCertificatesPage', JSON.stringify(certificates));
    }
  }, [certificates]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      certificate_no: `IPC-2026-02${certificates.length + 5}`,
      issue_date: today,
      period_from: today,
      period_to: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      certificate_no: item.certificate_no || '',
      issue_date: item.issue_date || '',
      period_from: item.period_from || '',
      period_to: item.period_to || '',
      work_order_no: item.work_order_no || '',
      contractor_name: item.contractor_name || '',
      gross_certified_value: String(item.gross_certified_value || '500000'),
      retention_deduction: String(item.retention_deduction || '25000'),
      advance_recovery: String(item.advance_recovery || '50000'),
      tds_deduction: String(item.tds_deduction || '10000'),
      net_certified_amount: String(item.net_certified_amount || '415000'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'gross_certified_value' || field === 'retention_deduction' || field === 'advance_recovery' || field === 'tds_deduction') {
        const gross = Number(field === 'gross_certified_value' ? value : prev.gross_certified_value) || 0;
        const ret = Number(field === 'retention_deduction' ? value : prev.retention_deduction) || 0;
        const adv = Number(field === 'advance_recovery' ? value : prev.advance_recovery) || 0;
        const tds = Number(field === 'tds_deduction' ? value : prev.tds_deduction) || 0;
        next.net_certified_amount = String(gross - ret - adv - tds);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.certificate_no.trim()) errs.certificate_no = 'Certificate number is required';
    if (!form.contractor_name.trim()) errs.contractor_name = 'Contractor name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const gross = Number(form.gross_certified_value || 0);
      const ret = Number(form.retention_deduction || 0);
      const adv = Number(form.advance_recovery || 0);
      const tds = Number(form.tds_deduction || 0);

      const newCert = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        certificate_no: form.certificate_no,
        issue_date: form.issue_date,
        period_from: form.period_from,
        period_to: form.period_to,
        work_order_no: form.work_order_no,
        contractor_name: form.contractor_name,
        gross_certified_value: gross,
        retention_deduction: ret,
        advance_recovery: adv,
        tds_deduction: tds,
        net_certified_amount: gross - ret - adv - tds,
        status_name: editingItem?.status_name || 'Certified for Payment',
        certified_by: 'Er. Suresh Babu (Project Director)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setCertificates(prev => prev.map(c => c.id === editingItem.id ? newCert : c));
        toast.success('Payment certificate updated.');
      } else {
        setCertificates(prev => [newCert, ...prev]);
        toast.success('Interim Payment Certificate (IPC) issued.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to issue payment certificate.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setCertificates(prev => prev.filter(c => c.id !== deleteItem.id));
    toast.success('Certificate removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return certificates.filter(c => {
      if (selectedProjectId !== 'all' && String(c.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(c.certificate_no || '').toLowerCase();
        const wo = String(c.work_order_no || '').toLowerCase();
        const cont = String(c.contractor_name || '').toLowerCase();
        if (!no.includes(s) && !wo.includes(s) && !cont.includes(s)) return false;
      }
      return true;
    });
  }, [certificates, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalNetCertified = useMemo(() => certificates.reduce((acc, c) => acc + Number(c.net_certified_amount || 0), 0), [certificates]);
  const totalRetentionHeld = useMemo(() => certificates.reduce((acc, c) => acc + Number(c.retention_deduction || 0), 0), [certificates]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Payment Certificates (IPC)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Interim Payment Certificates (IPC) & Work Certification"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Net Certified"
            value={`₹${(totalNetCertified / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Retention Deducted (5%)"
            value={`₹${(totalRetentionHeld / 100000).toFixed(2)}L`}
            status="warning"
            icon={<Calculator className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Issued IPC Certificates"
            value={`${certificates.length} Issued`}
            status="success"
            icon={<FileCheck className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Tax Compliance (TDS 2%)"
            value="100% Deducted"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
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
                placeholder="Search certificate no, WO, contractor..."
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
              title="Print IPC Register"
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
              Issue Payment Certificate
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
                  <th className="px-3 py-2 w-28">Certificate No</th>
                  <th className="px-3 py-2">Contractor & Work Order</th>
                  <th className="px-3 py-2 text-right w-28">Gross Value</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Retention</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">TDS 2%</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Net Certified</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading payment certificates...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No payment certificates found.
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
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{c.issue_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={c.contractor_name}>
                            {c.contractor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {c.work_order_no} • {c.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{c.gross_certified_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        -₹{c.retention_deduction.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        -₹{c.tds_deduction.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{c.net_certified_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {c.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View IPC Dossier 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{c.certificate_no} • {c.issue_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{c.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">{c.work_order_no}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{c.net_certified_amount.toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Gross Certified</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{c.gross_certified_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Deductions (Ret+TDS)</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">-₹{(c.retention_deduction + c.tds_deduction).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(c)}>
                  <Eye className="w-3 h-3 mr-1" /> View IPC Certificate
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

      {/* View IPC Certificate 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.certificate_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name} • {viewingItem.work_order_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Certified Work</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.gross_certified_value.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Certified Payable</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.net_certified_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Deduction (5%)</span> <span className="font-mono font-bold text-amber-600">-₹{viewingItem.retention_deduction.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Deduction (2%)</span> <span className="font-mono">-₹{viewingItem.tds_deduction.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Certified Period</span> <span className="font-mono">{viewingItem.period_from} to {viewingItem.period_to}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Authorized Signatory</span> <span className="text-emerald-700 font-medium">{viewingItem.certified_by}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Quantity Surveyor Verification Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print IPC Certificate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Certificate Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileCheck}
          title={editingItem ? 'Edit Payment Certificate' : 'Issue Interim Payment Certificate (IPC)'}
          subtitle="Record certified gross work value, statutory TDS, retention and net payable amount."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="ipc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
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

                <FormField label="Certificate No" required error={errors.certificate_no}>
                  <Input
                    value={form.certificate_no}
                    onChange={(e) => handleFormChange('certificate_no', e.target.value)}
                    placeholder="IPC-2026-025"
                  />
                </FormField>

                <FormField label="Linked Work Order No">
                  <Input
                    value={form.work_order_no}
                    onChange={(e) => handleFormChange('work_order_no', e.target.value)}
                    placeholder="WO-2026-012"
                  />
                </FormField>

                <FormField label="Subcontractor Name" required error={errors.contractor_name} className="md:col-span-2">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Civil Infra Pvt Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Valuation & Contractual Deductions">
              <EntityEditModal.Grid>
                <FormField label="Gross Certified Work Value (₹)" required>
                  <Input
                    type="number"
                    value={form.gross_certified_value}
                    onChange={(e) => handleFormChange('gross_certified_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Retention Money Deduction (5%)">
                  <Input
                    type="number"
                    value={form.retention_deduction}
                    onChange={(e) => handleFormChange('retention_deduction', e.target.value)}
                  />
                </FormField>

                <FormField label="Mobilization Advance Recovery">
                  <Input
                    type="number"
                    value={form.advance_recovery}
                    onChange={(e) => handleFormChange('advance_recovery', e.target.value)}
                  />
                </FormField>

                <FormField label="TDS Deduction (2%)">
                  <Input
                    type="number"
                    value={form.tds_deduction}
                    onChange={(e) => handleFormChange('tds_deduction', e.target.value)}
                  />
                </FormField>

                <FormField label="Net Certified Amount Payable (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.net_certified_amount || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Certification Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Joint MB sheet references, quality clearance..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="ipc-form"
            submitLabel={editingItem ? 'Update Certificate' : 'Issue Certificate'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Certificate"
        message={`Are you sure you want to delete "${deleteItem?.certificate_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
