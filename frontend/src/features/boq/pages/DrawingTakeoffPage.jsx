import { useState, useEffect, useMemo } from 'react';
import {
  Ruler, CheckCircle2, Clock, Calculator, IndianRupee,
  FileCode, Plus, Edit, Trash2, Search, Filter,
  Eye, FileText, ArrowRight, Layers, ArrowUpRight, DraftingCompass
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
import { projectsApi, request } from '../../../api/apiservice';

const DRAWING_CATEGORIES = [
  { id: 'all', name: 'All Drawing Disciplines' },
  { id: 'structural', name: 'Structural Framing & Foundation (STR)' },
  { id: 'architectural', name: 'Architectural Plans & Masonry (ARC)' },
  { id: 'mep', name: 'MEP Services & Plumbing (MEP)' },
  { id: 'highway', name: 'Road Alignment & Cross Sections (HWY)' },
];



const EMPTY_FORM = {
  project_id: '',
  drawing_category_id: 'structural',
  drawing_ref_no: '',
  takeoff_code: '',
  title: '',
  location_name: '',
  uom_name: 'Cu.M',
  multiplier: '1',
  length_m: '0',
  breadth_m: '0',
  depth_m: '0',
  calculated_quantity: '0',
  status: 'In Progress',
  notes: '',
};

export function DrawingTakeoffPage() {
  const [projects, setProjects] = useState([]);
  const [takeoffs, setTakeoffs] = useState([]);

  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTakeoff, setEditingTakeoff] = useState(null);
  const [viewingTakeoff, setViewingTakeoff] = useState(null);
  const [deleteTakeoff, setDeleteTakeoff] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load Projects
  const fetchTakeoffs = async () => {
    setLoading(true);
    try {
      const res = await request.get('/boq-takeoffs');
      setTakeoffs(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (error) {
      // Ignore if it fails (e.g. 404 because backend is missing)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects || res?.projects || [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {});
    
    fetchTakeoffs();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      takeoff_code: `QTO-2026-00${takeoffs.length + 1}`,
      drawing_ref_no: 'DWG-STR-001 Rev-R0',
      multiplier: '1',
      length_m: '10.0',
      breadth_m: '5.0',
      depth_m: '0.15',
      calculated_quantity: '7.5',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t) => {
    setForm({
      project_id: String(t.project_id || '1'),
      drawing_category_id: t.drawing_category_id || 'structural',
      drawing_ref_no: t.drawing_ref_no || '',
      takeoff_code: t.takeoff_code || '',
      title: t.title || '',
      location_name: t.location_name || '',
      uom_name: t.uom_name || 'Cu.M',
      multiplier: String(t.multiplier || '1'),
      length_m: String(t.length_m || '0'),
      breadth_m: String(t.breadth_m || '0'),
      depth_m: String(t.depth_m || '0'),
      calculated_quantity: String(t.calculated_quantity || '0'),
      status: t.status || 'In Progress',
      notes: t.notes || '',
    });
    setErrors({});
    setEditingTakeoff(t);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (['multiplier', 'length_m', 'breadth_m', 'depth_m'].includes(field)) {
        const n = Number(field === 'multiplier' ? value : prev.multiplier) || 1;
        const l = Number(field === 'length_m' ? value : prev.length_m) || 0;
        const b = Number(field === 'breadth_m' ? value : prev.breadth_m) || (prev.uom_name === 'Sq.M' ? 1 : 0);
        const d = Number(field === 'depth_m' ? value : prev.depth_m) || (prev.uom_name === 'Cu.M' ? 0 : 1);
        
        let qty = 0;
        if (next.uom_name === 'Cu.M') {
          qty = n * l * (b || 1) * (d || 1);
        } else if (next.uom_name === 'Sq.M') {
          qty = n * l * (b || d || 1);
        } else {
          qty = n * l;
        }
        next.calculated_quantity = qty.toFixed(2);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Takeoff title is required';
    if (!form.takeoff_code.trim()) errs.takeoff_code = 'Takeoff code is required';
    if (!form.drawing_ref_no.trim()) errs.drawing_ref_no = 'Drawing reference number is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const catObj = DRAWING_CATEGORIES.find(c => c.id === form.drawing_category_id);

      const n = Number(form.multiplier || 1);
      const l = Number(form.length_m || 0);
      const b = Number(form.breadth_m || 0);
      const d = Number(form.depth_m || 0);

      const newTakeoff = {
        id: editingTakeoff?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        drawing_category_id: form.drawing_category_id,
        drawing_category_name: catObj?.name || 'Structural Takeoff',
        drawing_ref_no: form.drawing_ref_no,
        takeoff_code: form.takeoff_code,
        title: form.title,
        location_name: form.location_name || 'General Site Area',
        uom_name: form.uom_name,
        multiplier: n,
        length_m: l,
        breadth_m: b,
        depth_m: d,
        calculated_quantity: Number(form.calculated_quantity || 0),
        status: form.status,
        measured_by: 'Current Estimator',
        verified_by: form.status === 'Verified' ? 'Lead Auditor' : '—',
        formula_display: `${n} × ${l}m × ${b}m × ${d}m = ${form.calculated_quantity} ${form.uom_name}`,
        notes: form.notes,
      };

      if (editingTakeoff?.id) {
        await request.patch(`/boq-takeoffs/${editingTakeoff.id}`, newTakeoff);
        toast.success('Takeoff updated successfully.');
      } else {
        await request.post('/boq-takeoffs', newTakeoff);
        toast.success('Takeoff record created successfully.');
      }

      fetchTakeoffs();
      setIsAddOpen(false);
      setEditingTakeoff(null);
    } catch {
      toast.error('Failed to save Takeoff.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTakeoff?.id) return;
    try {
      await request.delete(`/boq-takeoffs/${deleteTakeoff.id}`);
      toast.success('Takeoff deleted successfully.');
      fetchTakeoffs();
    } catch (error) {
      toast.error('Failed to delete takeoff.');
    } finally {
      setDeleteTakeoff(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return takeoffs.filter(t => {
      if (selectedProjectId !== 'all' && String(t.project_id) !== String(selectedProjectId)) return false;
      if (categoryFilter !== 'all' && t.drawing_category_id !== categoryFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (t.takeoff_code || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const dwg = (t.drawing_ref_no || '').toLowerCase();
        const loc = (t.location_name || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !dwg.includes(q) && !loc.includes(q)) return false;
      }
      return true;
    });
  }, [takeoffs, selectedProjectId, categoryFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const verifiedCount = useMemo(() => takeoffs.filter(t => t.status === 'Verified').length, [takeoffs]);
  const inProgressCount = useMemo(() => takeoffs.filter(t => t.status !== 'Verified').length, [takeoffs]);
  const totalVolume = useMemo(() => takeoffs.filter(t => t.uom_name === 'Cu.M').reduce((acc, t) => acc + Number(t.calculated_quantity || 0), 0), [takeoffs]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('verified')) return 'success';
    if (s.includes('progress')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'Drawing Quantity Takeoff' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Drawing Quantity Takeoff (QTO)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Takeoff Sheets"
            value={takeoffs.length}
            status="primary"
            icon={<DraftingCompass className="w-4 h-4" />}
          />
          <KpiCard
            label="Verified & Audit Passed"
            value={verifiedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="In Progress / Draft"
            value={inProgressCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Total Measured Concrete"
            value={`${Math.round(totalVolume).toLocaleString('en-IN')} Cu.M`}
            status="neutral"
            icon={<Calculator className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
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
                  { value: 'all', label: 'All Status' },
                  { value: 'Verified', label: 'Verified' },
                  { value: 'In Progress', label: 'In Progress' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search takeoff, DWG#, item..."
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
              Create Takeoff
            </Button>
          </div>
        </div>

        {/* Discipline Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {DRAWING_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                categoryFilter === cat.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
                  <th className="px-3 py-2 w-28">Takeoff Code</th>
                  <th className="px-3 py-2">Item Name & Drawing Reference</th>
                  <th className="px-3 py-2 hidden md:table-cell">Location / Grid</th>
                  <th className="px-3 py-2 text-right w-28">Measured Qty</th>
                  <th className="px-3 py-2 text-center w-16">UOM</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading drawing takeoffs...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No drawing takeoffs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {t.takeoff_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={t.title}>
                            {t.title}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {t.drawing_ref_no} • {t.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-text-primary text-[11px] font-medium truncate block" title={t.location_name}>
                          {t.location_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[12px]">
                        {Number(t.calculated_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="neutral" className="text-[10px] font-mono px-1.5">
                          {t.uom_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(t.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Measurement Formula"
                            onClick={() => setViewingTakeoff(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Takeoff"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Push to BOQ"
                            onClick={() => toast.success(`Quantity for ${t.takeoff_code} ready to push to BOQ.`)}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-text-secondary hover:text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteTakeoff(t)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{t.takeoff_code} • {t.drawing_ref_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.title}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(t.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {t.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Location</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{t.location_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Measured Quantity</span>
                  <span className="font-mono font-bold text-primary text-[11px]">{Number(t.calculated_quantity || 0).toLocaleString('en-IN')} {t.uom_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{t.measured_by}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingTakeoff(t)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(t)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteTakeoff(t)}>
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </Button>
                </div>
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

      {/* View Takeoff Modal */}
      {viewingTakeoff && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DraftingCompass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingTakeoff.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingTakeoff.takeoff_code} • {viewingTakeoff.drawing_ref_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingTakeoff(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="bg-primary/5 p-3.5 rounded-lg border border-primary/20 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Measurement Formula Computation</span>
                <p className="font-mono text-sm font-bold text-primary">{viewingTakeoff.formula_display || `${viewingTakeoff.multiplier} × ${viewingTakeoff.length_m}m × ${viewingTakeoff.breadth_m}m × ${viewingTakeoff.depth_m}m = ${viewingTakeoff.calculated_quantity} ${viewingTakeoff.uom_name}`}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Measured</span> <span className="font-bold text-text-primary font-mono">{Number(viewingTakeoff.calculated_quantity || 0).toLocaleString('en-IN')} {viewingTakeoff.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingTakeoff.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measured By</span> <span className="text-text-primary">{viewingTakeoff.measured_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Verified By</span> <span className="text-text-primary">{viewingTakeoff.verified_by}</span></div>
              </div>

              {viewingTakeoff.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Drawing Notes & Mix Specification:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{viewingTakeoff.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingTakeoff(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Takeoff Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingTakeoff)}
        onClose={() => { setIsAddOpen(false); setEditingTakeoff(null); }}
      >
        <EntityEditModal.Header
          icon={DraftingCompass}
          title={editingTakeoff ? 'Edit Takeoff Sheet' : 'Create Quantity Takeoff (QTO)'}
          subtitle="Extract measurements directly from drawing dimensions (Nos × L × B × D)."
          onClose={() => { setIsAddOpen(false); setEditingTakeoff(null); }}
        />
        <form id="qto-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Drawing & Sheet Routing">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Drawing Discipline" required>
                  <Select
                    options={DRAWING_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.drawing_category_id}
                    onChange={(v) => handleFormChange('drawing_category_id', v)}
                  />
                </FormField>

                <FormField label="Takeoff Sheet Code" required error={errors.takeoff_code}>
                  <Input
                    value={form.takeoff_code}
                    onChange={(e) => handleFormChange('takeoff_code', e.target.value)}
                    placeholder="e.g. QTO-FND-001"
                  />
                </FormField>

                <FormField label="Drawing Reference / DWG No." required error={errors.drawing_ref_no}>
                  <Input
                    value={form.drawing_ref_no}
                    onChange={(e) => handleFormChange('drawing_ref_no', e.target.value)}
                    placeholder="e.g. DWG-STR-FND-002 Rev-R2"
                  />
                </FormField>

                <FormField label="Takeoff Item Description" required className="md:col-span-2" error={errors.title}>
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Raft Foundation Concrete Volume Takeoff (Grid A1-D6)"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Dimension Formula & Quantity Extraction">
              <EntityEditModal.Grid>
                <FormField label="Unit of Measurement (UOM)">
                  <Select
                    options={[
                      { value: 'Cu.M', label: 'Cubic Metre (Cu.M)' },
                      { value: 'Sq.M', label: 'Square Metre (Sq.M)' },
                      { value: 'MT', label: 'Metric Tonne (MT)' },
                      { value: 'R.M', label: 'Running Metre (R.M)' },
                      { value: 'Nos', label: 'Numbers (Nos)' },
                    ]}
                    value={form.uom_name}
                    onChange={(v) => handleFormChange('uom_name', v)}
                  />
                </FormField>

                <FormField label="No. of Members (Nos / Multiplier)">
                  <Input
                    type="number"
                    step="1"
                    value={form.multiplier}
                    onChange={(e) => handleFormChange('multiplier', e.target.value)}
                  />
                </FormField>

                <FormField label="Length (m)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.length_m}
                    onChange={(e) => handleFormChange('length_m', e.target.value)}
                  />
                </FormField>

                <FormField label="Breadth / Width (m)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.breadth_m}
                    onChange={(e) => handleFormChange('breadth_m', e.target.value)}
                  />
                </FormField>

                <FormField label="Height / Depth / Thickness (m)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.depth_m}
                    onChange={(e) => handleFormChange('depth_m', e.target.value)}
                  />
                </FormField>

                <FormField label="Calculated Net Quantity">
                  <Input
                    type="number"
                    value={form.calculated_quantity}
                    readOnly
                    className="bg-surface-muted font-bold text-primary text-base"
                  />
                </FormField>

                <FormField label="Drawing & Deductions Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Deductions for sump pits, columns, openings..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="qto-form"
            submitLabel={editingTakeoff ? 'Update Takeoff' : 'Save Takeoff Sheet'}
            onCancel={() => { setIsAddOpen(false); setEditingTakeoff(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTakeoff)}
        title="Delete Takeoff Sheet"
        message={`Are you sure you want to delete "${deleteTakeoff?.takeoff_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTakeoff(null)}
      />
    </PageContainer>
  );
}
