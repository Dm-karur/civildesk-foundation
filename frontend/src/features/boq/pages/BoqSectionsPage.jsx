import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers, FolderTree, Plus, Edit, Trash2, Search, Filter,
  FileSpreadsheet, IndianRupee, Eye, ChevronRight, CheckCircle2,
  Boxes, ListTree
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
import { boqApi, projectsApi } from '../../../api/apiservice';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.boq_sections && Array.isArray(res.data.boq_sections)) return res.data.boq_sections;
  if (res?.data?.sections && Array.isArray(res.data.sections)) return res.data.sections;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  if (res?.sections && Array.isArray(res.sections)) return res.sections;
  if (res?.boq_sections && Array.isArray(res.boq_sections)) return res.boq_sections;
  return [];
};



const EMPTY_FORM = {
  project_id: '',
  boq_id: '',
  parent_section_id: '',
  section_code: '',
  section_name: '',
  display_order: '0',
  description: '',
};

export function BoqSectionsPage() {
  const [projects, setProjects] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedBoqId, setSelectedBoqId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [viewingSection, setViewingSection] = useState(null);
  const [deleteSection, setDeleteSection] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load Projects & BOQs
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      boqApi.list().catch(() => ({ data: { project_boqs: [] } })),
    ]).then(([pRes, bRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const bList = bRes?.data?.project_boqs ?? bRes?.project_boqs ?? (Array.isArray(bRes?.data) ? bRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setBoqs(Array.isArray(bList) ? bList : []);
    });
  }, []);

  // Fetch sections
  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedBoqId !== 'all') {
        const res = await boqApi.sections.list(Number(selectedBoqId));
        const list = extractArray(res);
        const b = boqs.find(boq => String(boq.id) === String(selectedBoqId));
        const enhancedList = list.map(s => ({
           ...s,
           boq_name: s.boq_name || b?.boq_name,
           boq_code: s.boq_code || b?.boq_code,
           project_id: s.project_id || b?.project_id,
           boq_id: s.boq_id || b?.id
        }));
        setSections(enhancedList);
      } else {
        const boqsToFetch = boqs.filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId));
        if (boqsToFetch.length === 0) {
          setSections([]);
        } else {
          let allSections = [];
          for (const b of boqsToFetch) {
            try {
              const res = await boqApi.sections.list(Number(b.id));
              const list = extractArray(res);
              const enhancedList = list.map(s => ({
                 ...s,
                 boq_name: s.boq_name || b.boq_name,
                 boq_code: s.boq_code || b.boq_code,
                 project_id: s.project_id || b.project_id,
                 boq_id: s.boq_id || b.id
              }));
              allSections = [...allSections, ...enhancedList];
            } catch (e) {}
          }
          setSections(allSections);
        }
      }
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBoqId, selectedProjectId, boqs]);

  useEffect(() => {
    fetchSections();
  }, [selectedBoqId, selectedProjectId, boqs, fetchSections]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableBoqs = boqs.filter(b => String(b.project_id) === String(defaultProj));
    const defaultBoq = selectedBoqId !== 'all' ? selectedBoqId : (availableBoqs[0]?.id ? String(availableBoqs[0].id) : (boqs[0]?.id ? String(boqs[0].id) : '1'));

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      boq_id: defaultBoq,
      section_code: `SEC-0${sections.length + 1}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (sec) => {
    setForm({
      project_id: String(sec.project_id || '1'),
      boq_id: String(sec.boq_id || '1'),
      parent_section_id: String(sec.parent_section_id || ''),
      section_code: sec.section_code || '',
      section_name: sec.section_name || '',
      display_order: String(sec.display_order || '0'),
      description: sec.description || '',
    });
    setErrors({});
    setEditingSection(sec);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.section_name.trim()) errs.section_name = 'Section name is required';
    if (!form.section_code.trim()) errs.section_code = 'Section code is required';
    if (!form.boq_id) errs.boq_id = 'Target BOQ is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedBoq = boqs.find(b => String(b.id) === String(form.boq_id));

      const payload = {
        project_id: Number(form.project_id || 1),
        boq_id: Number(form.boq_id),
        parent_section_id: form.parent_section_id ? Number(form.parent_section_id) : null,
        section_code: form.section_code.trim(),
        section_name: form.section_name.trim(),
        display_order: Number(form.display_order || 0),
        description: form.description || null,
      };

      const newSecItem = {
        id: editingSection?.id || Date.now(),
        ...payload,
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        boq_code: selectedBoq?.boq_code || 'BOQ-001',
        boq_name: selectedBoq?.boq_name || 'Project BOQ',
        item_count: editingSection?.item_count || 0,
        section_amount: editingSection?.section_amount || 0,
      };

      try {
        if (editingSection?.id) {
          await boqApi.sections.update(payload.boq_id, editingSection.id, payload);
          toast.success('BOQ section updated successfully.');
        } else {
          await boqApi.sections.create(payload.boq_id, payload);
          toast.success('BOQ section added successfully.');
        }
        fetchSections();
        
        setIsAddOpen(false);
        setEditingSection(null);
      } catch (error) {
        console.error('API Error:', error);
        setErrors(error?.errors || {});
        toast.error(error?.message || 'Failed to save BOQ section.');
      }
    } catch (error) {
      setErrors(error?.errors || {});
      toast.error(error?.message || 'Failed to save BOQ section.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteSection?.id) return;
    try {
      await boqApi.sections.remove(deleteSection.boq_id, deleteSection.id);
      setSections(prev => prev.filter(s => s.id !== deleteSection.id));
      toast.success('BOQ section deleted.');
      setDeleteSection(null);
    } catch (error) {
      toast.error('Failed to delete BOQ section.');
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return sections.filter(sec => {
      if (selectedProjectId !== 'all' && String(sec.project_id) !== String(selectedProjectId)) return false;
      if (selectedBoqId !== 'all' && String(sec.boq_id) !== String(selectedBoqId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (sec.section_code || '').toLowerCase();
        const name = (sec.section_name || '').toLowerCase();
        const boqN = (sec.boq_name || '').toLowerCase();
        const desc = (sec.description || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !boqN.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [sections, selectedProjectId, selectedBoqId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalAmount = useMemo(() => sections.reduce((acc, s) => acc + Number(s.section_amount || 0), 0), [sections]);
  const totalItemsCount = useMemo(() => sections.reduce((acc, s) => acc + Number(s.item_count || 0), 0), [sections]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'BOQ Sections' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="BOQ Sections & Breakdown"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total BOQ Sections"
            value={sections.length}
            status="primary"
            icon={<ListTree className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Line Items"
            value={totalItemsCount}
            status="info"
            icon={<Boxes className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="WBS Hierarchy Depth"
            value="2 Levels"
            status="success"
            icon={<FolderTree className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Section Value"
            value={`₹${(totalAmount / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Project/BOQ Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedBoqId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All BOQs (Consolidated)' },
                  ...boqs
                    .filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId))
                    .map(b => ({ value: String(b.id), label: `${b.boq_code} - ${b.boq_name}` }))
                ]}
                value={selectedBoqId}
                onChange={setSelectedBoqId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search section code, title, scope..."
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
              Add Section
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
                  <th className="px-3 py-2 w-32">Section Code</th>
                  <th className="px-3 py-2">Section & WBS Title</th>
                  <th className="px-3 py-2 hidden md:table-cell">Parent BOQ</th>
                  <th className="px-3 py-2 text-center w-24">Items Count</th>
                  <th className="px-3 py-2 text-right w-32">Total Value (₹)</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading BOQ sections...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No BOQ sections found in this selection.
                    </td>
                  </tr>
                ) : (
                  paged.map((sec, idx) => (
                    <tr key={sec.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                        <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                          {sec.section_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={sec.section_name}>
                            {sec.section_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {sec.description || 'Standard civil & structural scope'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="text-text-primary text-[11px] font-medium truncate" title={sec.boq_name}>
                            {sec.boq_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {sec.project_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="info" className="text-[10px] font-mono font-bold px-2">
                          {sec.item_count || 0} items
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
                        ₹{Number(sec.section_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Section Details"
                            onClick={() => setViewingSection(sec)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Section"
                            onClick={() => handleOpenEdit(sec)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteSection(sec)}
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
          {paged.map((sec, idx) => (
            <div key={sec.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{sec.section_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{sec.section_name}</h4>
                </div>
                <Badge variant="info" className="text-[9px] font-mono font-bold px-1.5 shrink-0">
                  {sec.item_count || 0} items
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">BOQ / Project</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{sec.boq_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Value</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{Number(sec.section_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingSection(sec)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(sec)}>
                  <Edit className="w-3.5 h-3.5 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteSection(sec)}>
                  <Trash2 className="w-3.5 h-3.5 text-error" />
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

      {/* View Section Modal */}
      {viewingSection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ListTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingSection.section_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingSection.section_code} • {viewingSection.boq_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingSection(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Line Items</span> <span className="font-bold text-text-primary font-mono">{viewingSection.item_count || 0} items</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Section Value</span> <span className="font-mono font-bold text-primary">₹{Number(viewingSection.section_amount || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Parent Project</span> <span className="font-medium text-text-primary">{viewingSection.project_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">BOQ Code</span> <span className="font-mono">{viewingSection.boq_code}</span></div>
              </div>

              {viewingSection.description && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Scope & Specifications:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{viewingSection.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingSection(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingSection)}
        onClose={() => { setIsAddOpen(false); setEditingSection(null); }}
      >
        <EntityEditModal.Header
          icon={ListTree}
          title={editingSection ? 'Edit BOQ Section' : 'Add BOQ Section'}
          subtitle="Define Work Breakdown Structure (WBS) groupings for the project BOQ."
          onClose={() => { setIsAddOpen(false); setEditingSection(null); }}
        />
        <form id="sec-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="BOQ & Section Mapping">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const b = boqs.find(item => String(item.project_id) === String(v));
                      if (b) handleFormChange('boq_id', String(b.id));
                    }}
                  />
                </FormField>

                <FormField label="Target BOQ" required error={errors.boq_id}>
                  <Select
                    options={boqs
                      .filter(b => !form.project_id || String(b.project_id) === String(form.project_id))
                      .map(b => ({ value: String(b.id), label: `${b.boq_code} - ${b.boq_name}` }))}
                    value={form.boq_id}
                    onChange={(v) => handleFormChange('boq_id', v)}
                  />
                </FormField>

                <FormField label="Section Code" required error={errors.section_code}>
                  <Input
                    value={form.section_code}
                    onChange={(e) => handleFormChange('section_code', e.target.value)}
                    placeholder="e.g. SEC-01-CIVIL"
                  />
                </FormField>

                <FormField label="Display Order">
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => handleFormChange('display_order', e.target.value)}
                  />
                </FormField>

                <FormField label="Section / WBS Title" required className="md:col-span-2" error={errors.section_name}>
                  <Input
                    value={form.section_name}
                    onChange={(e) => handleFormChange('section_name', e.target.value)}
                    placeholder="e.g. Plain & Reinforced Cement Concrete (RCC)"
                  />
                </FormField>

                <FormField label="Section Description / Scope Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Structural concrete grades, formwork types, rebar specifications..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="sec-form"
            submitLabel={editingSection ? 'Update Section' : 'Create Section'}
            onCancel={() => { setIsAddOpen(false); setEditingSection(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteSection)}
        title="Delete BOQ Section"
        message={`Are you sure you want to delete "${deleteSection?.section_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteSection(null)}
      />
    </PageContainer>
  );
}
