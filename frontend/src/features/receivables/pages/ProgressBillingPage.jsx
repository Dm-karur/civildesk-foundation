import { useState, useEffect, useMemo } from 'react';
import {
  Layers, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Calculator
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
  bill_no: '',
  bill_date: '',
  period_from: '',
  period_to: '',
  client_name: '',
  cumulative_work_done: '20000000',
  previous_billed_value: '10000000',
  current_period_gross: '10000000',
  retention_deduction: '500000',
  advance_recovery: '1000000',
  tds_deduction: '200000',
  gst_addition: '1800000',
  net_payable_amount: '10100000',
  notes: '',
};

export function ProgressBillingPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_receivables_ProgressBillingPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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

  
  useEffect(() => {
    localStorage.setItem('mock_receivables_ProgressBillingPage', JSON.stringify(bills));
  }, [bills]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      bill_no: `RA-CLIENT-00${bills.length + 1}`,
      bill_date: today,
      period_from: today,
      period_to: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      bill_no: item.bill_no || '',
      bill_date: item.bill_date || '',
      period_from: item.period_from || '',
      period_to: item.period_to || '',
      client_name: item.client_name || '',
      cumulative_work_done: String(item.cumulative_work_done || '20000000'),
      previous_billed_value: String(item.previous_billed_value || '10000000'),
      current_period_gross: String(item.current_period_gross || '10000000'),
      retention_deduction: String(item.retention_deduction || '500000'),
      advance_recovery: String(item.advance_recovery || '1000000'),
      tds_deduction: String(item.tds_deduction || '200000'),
      gst_addition: String(item.gst_addition || '1800000'),
      net_payable_amount: String(item.net_payable_amount || '10100000'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'cumulative_work_done' || field === 'previous_billed_value') {
        const cum = Number(field === 'cumulative_work_done' ? value : prev.cumulative_work_done) || 0;
        const prevB = Number(field === 'previous_billed_value' ? value : prev.previous_billed_value) || 0;
        const curGross = Math.max(0, cum - prevB);
        const ret = curGross * 0.05;
        const adv = curGross * 0.10;
        const tds = curGross * 0.02;
        const gst = curGross * 0.18;
        next.current_period_gross = String(curGross);
        next.retention_deduction = String(ret);
        next.advance_recovery = String(adv);
        next.tds_deduction = String(tds);
        next.gst_addition = String(gst);
        next.net_payable_amount = String(curGross - ret - adv - tds + gst);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.bill_no.trim()) errs.bill_no = 'Bill number is required';
    if (!form.client_name.trim()) errs.client_name = 'Client name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const cum = Number(form.cumulative_work_done || 0);
      const prevB = Number(form.previous_billed_value || 0);
      const curGross = Number(form.current_period_gross || 0);
      const ret = Number(form.retention_deduction || 0);
      const adv = Number(form.advance_recovery || 0);
      const tds = Number(form.tds_deduction || 0);
      const gst = Number(form.gst_addition || 0);

      const newBill = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        bill_no: form.bill_no,
        bill_date: form.bill_date,
        period_from: form.period_from,
        period_to: form.period_to,
        client_name: form.client_name,
        cumulative_work_done: cum,
        previous_billed_value: prevB,
        current_period_gross: curGross,
        retention_deduction: ret,
        advance_recovery: adv,
        tds_deduction: tds,
        gst_addition: gst,
        net_payable_amount: curGross - ret - adv - tds + gst,
        status: editingItem?.status || 'Submitted for Client Verification',
        certified_by: 'Er. N. Sundararajan (PMC Chief QS)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setBills(prev => prev.map(b => b.id === editingItem.id ? newBill : b));
        toast.success('Progress billing sheet updated.');
      } else {
        setBills(prev => [newBill, ...prev]);
        toast.success('Client RA Progress Bill submitted.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save progress bill.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setBills(prev => prev.filter(b => b.id !== deleteItem.id));
    toast.success('Progress bill removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return bills.filter(b => {
      if (selectedProjectId !== 'all' && String(b.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(b.bill_no || '').toLowerCase();
        const cli = String(b.client_name || '').toLowerCase();
        const proj = String(b.project_name || '').toLowerCase();
        if (!no.includes(s) && !cli.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [bills, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalCumulativeDone = useMemo(() => bills.reduce((acc, b) => acc + Number(b.cumulative_work_done || 0), 0), [bills]);
  const totalCurrentBilled = useMemo(() => bills.reduce((acc, b) => acc + Number(b.current_period_gross || 0), 0), [bills]);
  const totalNetPayable = useMemo(() => bills.reduce((acc, b) => acc + Number(b.net_payable_amount || 0), 0), [bills]);

  const getStatusVariant = (st) => {
    if (st.includes('Settled') || st.includes('Certified')) return 'success';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Progress Billing Sheets' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Milestone & RA Progress Billing Sheets"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Cumulative Work Done"
            value={`₹${(totalCumulativeDone / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            label="Current Cycle Claims"
            value={`₹${(totalCurrentBilled / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Net Certified Payable"
            value={`₹${(totalNetPayable / 10000000).toFixed(2)} Cr`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Joint Measurement (JMR)"
            value="100% Verified"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
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

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search RA bill no, client, project..."
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
              title="Print Billing Register"
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
              Create Progress Bill
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
                  <th className="px-3 py-2 w-28">Bill No</th>
                  <th className="px-3 py-2">Client & Period</th>
                  <th className="px-3 py-2 text-right w-28">Cumulative Done</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Current Cycle</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Retention</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600 font-bold">Net Payable</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading progress billing sheets...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No progress billing records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {b.bill_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{b.bill_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={b.client_name}>
                            {b.client_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {b.period_from} to {b.period_to} • {b.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(b.cumulative_work_done / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(b.current_period_gross / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        -₹{(b.retention_deduction / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(b.net_payable_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(b.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Progress Bill 360"
                            onClick={() => setViewingItem(b)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(b)}
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
          {paged.map((b, idx) => (
            <div key={b.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{b.bill_no} • {b.bill_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{b.client_name}</h4>
                  <span className="text-[11px] text-text-muted">{b.period_from} to {b.period_to}</span>
                </div>
                <Badge
                  variant={getStatusVariant(b.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(b.net_payable_amount / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Current Cycle</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{(b.current_period_gross / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Cumulative Done</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(b.cumulative_work_done / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(b)}>
                  <Eye className="w-3 h-3 mr-1" /> View Progress Bill
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

      {/* View Progress Bill 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.bill_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.client_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Work Done</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.cumulative_work_done / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Certified Payable</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.net_payable_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Current Cycle Gross</span> <span className="font-mono font-bold">₹{(viewingItem.current_period_gross / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST Addition (18%)</span> <span className="font-mono text-text-primary">+₹{(viewingItem.gst_addition / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Deduction (5%)</span> <span className="font-mono text-amber-600">-₹{(viewingItem.retention_deduction / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Advance Recovery (10%)</span> <span className="font-mono text-text-muted">-₹{(viewingItem.advance_recovery / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measurement Period</span> <span className="font-mono">{viewingItem.period_from} to {viewingItem.period_to}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Authorized Signatory</span> <span className="text-emerald-700 font-medium">{viewingItem.certified_by}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Measurement & Certification Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Progress Bill
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Bill Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Layers}
          title={editingItem ? 'Edit Progress Bill' : 'Create Milestone & RA Progress Bill'}
          subtitle="Record cumulative measurement, calculate current cycle gross, deductions and net payable."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="pb-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Bill Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Progress Bill No" required error={errors.bill_no}>
                  <Input
                    value={form.bill_no}
                    onChange={(e) => handleFormChange('bill_no', e.target.value)}
                    placeholder="RA-CLIENT-004"
                  />
                </FormField>

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

                <FormField label="Client Name" required error={errors.client_name} className="md:col-span-2">
                  <Input
                    value={form.client_name}
                    onChange={(e) => handleFormChange('client_name', e.target.value)}
                    placeholder="e.g. Metro Infrastructure & Realty Corp Ltd"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Work Valuation & Contractual Deductions">
              <EntityEditModal.Grid>
                <FormField label="Cumulative Work Done (₹)" required>
                  <Input
                    type="number"
                    value={form.cumulative_work_done}
                    onChange={(e) => handleFormChange('cumulative_work_done', e.target.value)}
                  />
                </FormField>

                <FormField label="Previous Billed Value (₹)" required>
                  <Input
                    type="number"
                    value={form.previous_billed_value}
                    onChange={(e) => handleFormChange('previous_billed_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Current Cycle Gross Work (₹)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono font-bold text-primary"
                    value={`₹${Number(form.current_period_gross || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Retention Deduction (5%)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono text-amber-600"
                    value={`₹${Number(form.retention_deduction || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Mobilization Advance Recovery (10%)">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono"
                    value={`₹${Number(form.advance_recovery || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Net Certified Amount (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="bg-surface-muted font-mono font-bold text-emerald-600 text-base"
                    value={`₹${Number(form.net_payable_amount || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Joint Measurement Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Reference joint MB sheets, concrete pour cards..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="pb-form"
            submitLabel={editingItem ? 'Update Bill' : 'Submit Progress Bill'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Progress Bill"
        message={`Are you sure you want to delete "${deleteItem?.bill_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
