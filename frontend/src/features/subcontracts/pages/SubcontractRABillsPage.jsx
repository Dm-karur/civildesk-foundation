import { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, IndianRupee, Clock, ShieldCheck,
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
import { projectsApi, subcontractsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  ra_bill_no: '',
  bill_date: '',
  contractor_bill_no: '',
  work_order_no: 'WO-2026-012',
  contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
  gross_work_value: '500000',
  retention_amount: '25000',
  advance_recovery: '50000',
  tds_amount: '10000',
  gst_amount: '90000',
  net_certified_amount: '415000',
  notes: '',
};

export function SubcontractRABillsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [raBills, setRaBills] = useState([]);
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

  const [workOrders, setWorkOrders] = useState([]);
  const [contractors, setContractors] = useState([]);

  const fetchList = () => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      subcontractsApi.contractors.list().catch(() => ({ data: [] })),
      subcontractsApi.workOrders.list().catch(() => ({ data: [] })),
      subcontractsApi.raBills.list().catch(() => ({ data: [] }))
    ]).then(([projRes, contrRes, woRes, raRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);

      const cList = contrRes?.data?.subcontractors ?? contrRes?.data?.data ?? [];
      setContractors(Array.isArray(cList) ? cList : []);

      const woList = woRes?.data?.work_orders ?? woRes?.data?.data ?? [];
      setWorkOrders(Array.isArray(woList) ? woList : []);

      const rList = raRes?.data?.ra_bills ?? raRes?.data?.data ?? [];
      if (Array.isArray(rList)) {
        const normalized = rList.map((r, idx) => {
          const matchedProj = pList.find(p => String(p.id) === String(r.project_id));
          const matchedContr = cList.find(c => String(c.id) === String(r.contractor_id));
          const matchedWo = woList.find(w => String(w.id) === String(r.work_order_id));
          return {
            id: r.id,
            project_id: r.project_id,
            project_code: matchedProj?.project_code || 'PRJ-01',
            project_name: matchedProj?.project_name || 'Project Name',
            ra_bill_no: r.ra_bill_no || `RA-${r.id}`,
            bill_date: r.bill_date || '',
            contractor_bill_no: r.contractor_bill_no || '',
            work_order_id: r.work_order_id,
            work_order_no: matchedWo?.work_order_no || 'WO-00',
            contractor_id: r.contractor_id,
            contractor_name: matchedContr?.contractor_name || 'Subcontractor Partner',
            gross_work_value: Number(r.gross_work_value || 0),
            retention_amount: Number(r.retention_amount || 0),
            advance_recovery: Number(r.advance_recovery || 0),
            tds_amount: Number(r.tds_amount || 0),
            gst_amount: Number(r.cgst_amount || 0) + Number(r.sgst_amount || 0) + Number(r.igst_amount || 0),
            cgst_amount: Number(r.cgst_amount || 0),
            sgst_amount: Number(r.sgst_amount || 0),
            igst_amount: Number(r.igst_amount || 0),
            net_certified_amount: Number(r.net_certified_amount || 0),
            status_name: r.status_name || 'Draft',
            certified_by: 'Er. Suresh Babu (Project Director)',
            notes: r.remarks || '',
          };
        });
        setRaBills(normalized);
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
      ra_bill_no: `RA-2026-00${raBills.length + 5}`,
      bill_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      ra_bill_no: item.ra_bill_no || '',
      bill_date: item.bill_date || '',
      contractor_bill_no: item.contractor_bill_no || '',
      work_order_id: String(item.work_order_id || ''),
      contractor_id: String(item.contractor_id || ''),
      gross_work_value: String(item.gross_work_value || ''),
      retention_amount: String(item.retention_amount || ''),
      advance_recovery: String(item.advance_recovery || ''),
      tds_amount: String(item.tds_amount || ''),
      gst_amount: String(item.gst_amount || ''),
      net_certified_amount: String(item.net_certified_amount || ''),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'gross_work_value' || field === 'retention_amount' || field === 'advance_recovery' || field === 'tds_amount') {
        const gross = Number(field === 'gross_work_value' ? value : prev.gross_work_value) || 0;
        const ret = Number(field === 'retention_amount' ? value : prev.retention_amount) || 0;
        const adv = Number(field === 'advance_recovery' ? value : prev.advance_recovery) || 0;
        const tds = Number(field === 'tds_amount' ? value : prev.tds_amount) || 0;
        next.net_certified_amount = String(gross - ret - adv - tds);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.work_order_id) errs.work_order_id = 'Work Order is required';
    if (!form.ra_bill_no.trim()) errs.ra_bill_no = 'RA Bill number is required';
    if (!form.bill_date) errs.bill_date = 'Bill Date is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedWo = workOrders.find(w => String(w.id) === String(form.work_order_id));
      const contractorId = selectedWo ? selectedWo.contractor_id : form.contractor_id;

      const payload = {
        project_id: Number(form.project_id),
        work_order_id: Number(form.work_order_id),
        contractor_id: Number(contractorId),
        ra_bill_no: form.ra_bill_no,
        contractor_bill_no: form.contractor_bill_no || null,
        bill_date: form.bill_date,
        retention_amount: Number(form.retention_amount || 0),
        advance_recovery: Number(form.advance_recovery || 0),
        cgst_amount: Number(form.gst_amount || 0) / 2,
        sgst_amount: Number(form.gst_amount || 0) / 2,
        igst_amount: 0,
        tds_amount: Number(form.tds_amount || 0),
        remarks: form.notes,
      };

      if (editingItem?.id) {
        await subcontractsApi.raBills.update(editingItem.id, payload);
        toast.success('RA Bill updated.');
      } else {
        await subcontractsApi.raBills.create(payload);
        toast.success('Subcontractor RA Bill submitted.');
      }
      fetchList();
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save RA Bill.');
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
    return raBills.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !r.status_name.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(r.ra_bill_no || '').toLowerCase();
        const vno = String(r.contractor_bill_no || '').toLowerCase();
        const wo = String(r.work_order_no || '').toLowerCase();
        const cont = String(r.contractor_name || '').toLowerCase();
        if (!no.includes(s) && !vno.includes(s) && !wo.includes(s) && !cont.includes(s)) return false;
      }
      return true;
    });
  }, [raBills, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalBilledGross = useMemo(() => raBills.reduce((acc, r) => acc + Number(r.gross_work_value || 0), 0), [raBills]);
  const totalNetCertified = useMemo(() => raBills.reduce((acc, r) => acc + Number(r.net_certified_amount || 0), 0), [raBills]);

  const getStatusVariant = (st) => {
    if (st.includes('Certified') || st.includes('Passed')) return 'success';
    if (st.includes('Submitted')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Subcontract Management', href: '/subcontracts/work-orders' },
    { label: 'Subcontractor RA Bills' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractor Running Account Bills (RA Bills)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Gross Billed"
            value={`₹${(totalBilledGross / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Net Certified"
            value={`₹${(totalNetCertified / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Processed RA Bills"
            value={`${raBills.length} Bills`}
            status="neutral"
            icon={<FileText className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Statutory GST & TDS"
            value="100% Reconciled"
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Certified', label: 'Certified & Passed' },
                  { value: 'Submitted', label: 'Submitted for Review' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search RA bill, vendor inv, WO..."
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
              title="Print RA Bill Register"
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
              Submit RA Bill
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
                  <th className="px-3 py-2 w-28">RA Bill No</th>
                  <th className="px-3 py-2">Contractor & Vendor Invoice</th>
                  <th className="px-3 py-2 text-right w-28">Gross Work</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Retention</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">TDS</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Net Certified</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading RA bills...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No RA bills found.
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
                          {r.ra_bill_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.bill_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.contractor_name}>
                            {r.contractor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            Inv: {r.contractor_bill_no} • {r.work_order_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{r.gross_work_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        -₹{r.retention_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        -₹{r.tds_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{r.net_certified_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status_name)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View RA Bill 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.ra_bill_no} • {r.bill_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">Inv: {r.contractor_bill_no}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{r.net_certified_amount.toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Gross Work</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{r.gross_work_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Deductions (Ret+TDS)</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">-₹{(r.retention_amount + r.tds_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Full RA Bill
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(r)}>
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

      {/* View RA Bill 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.ra_bill_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name} • {viewingItem.work_order_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Gross Work Value</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.gross_work_value.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Net Certified Payable</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingItem.net_certified_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Retention Held (5%)</span> <span className="font-mono font-bold text-amber-600">-₹{viewingItem.retention_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Deduction (2%)</span> <span className="font-mono">-₹{viewingItem.tds_amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Vendor Invoice Ref</span> <span className="font-mono text-primary font-medium">{viewingItem.contractor_bill_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">QS Certified Signatory</span> <span className="text-emerald-700 font-medium">{viewingItem.certified_by}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Bill Verification Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Certified RA Bill
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit RA Bill Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingItem ? 'Edit RA Bill' : 'Submit Subcontractor RA Bill'}
          subtitle="Record gross work valuation, retention, advance deduction, and compute net certified payable."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="ra-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="RA Bill Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="RA Bill Number" required error={errors.ra_bill_no}>
                  <Input
                    value={form.ra_bill_no}
                    onChange={(e) => handleFormChange('ra_bill_no', e.target.value)}
                    placeholder="RA-2026-008"
                  />
                </FormField>

                <FormField label="Vendor Tax Invoice No">
                  <Input
                    value={form.contractor_bill_no}
                    onChange={(e) => handleFormChange('contractor_bill_no', e.target.value)}
                    placeholder="SMI-INV-050"
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

            <EntityEditModal.Section title="Bill Valuation & Deductions">
              <EntityEditModal.Grid>
                <FormField label="Gross Work Value (₹)" required>
                  <Input
                    type="number"
                    value={form.gross_work_value}
                    onChange={(e) => handleFormChange('gross_work_value', e.target.value)}
                  />
                </FormField>

                <FormField label="Retention Deduction (5%)">
                  <Input
                    type="number"
                    value={form.retention_amount}
                    onChange={(e) => handleFormChange('retention_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Advance Recovery (10%)">
                  <Input
                    type="number"
                    value={form.advance_recovery}
                    onChange={(e) => handleFormChange('advance_recovery', e.target.value)}
                  />
                </FormField>

                <FormField label="TDS Deduction (2%)">
                  <Input
                    type="number"
                    value={form.tds_amount}
                    onChange={(e) => handleFormChange('tds_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Net Certified Amount (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.net_certified_amount || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Certification & Bill Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Reference MB sheets, work completed on columns/beams..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="ra-form"
            submitLabel={editingItem ? 'Update RA Bill' : 'Submit RA Bill'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete RA Bill"
        message={`Are you sure you want to delete "${deleteItem?.ra_bill_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
