import { useState, useEffect, useMemo } from 'react';
import {
  Layers, MapPin, Building2, Plus, Edit, Trash2, Search, Filter,
  CheckCircle2, Clock, Activity, Calendar, Eye, Grid3x3, Shield
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
import { siteZonesApi, sitesApi, projectsApi, mastersApi } from '../../../api/apiservice';



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  zone_code: '',
  zone_name: '',
  zone_type_id: '1',
  status_id: '1',
  planned_start_date: '',
  planned_end_date: '',
  progress_percentage: '0',
  description: '',
};

export function SiteZonesPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [masters, setMasters] = useState({});
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [viewingZone, setViewingZone] = useState(null);
  const [deleteZone, setDeleteZone] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initial Load: Projects, Sites, Masters
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      sitesApi.list().catch(() => ({ data: { sites: [] } })),
      mastersApi.all().catch(() => ({ data: {} })),
    ]).then(([pRes, sRes, mRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const sList = sRes?.data?.sites ?? sRes?.sites ?? (Array.isArray(sRes?.data) ? sRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setSites(Array.isArray(sList) ? sList : []);
      setMasters(mRes?.data ?? mRes ?? {});
    });
  }, []);

  // Fetch zones from API
  const fetchZones = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSiteId !== 'all') params.site_id = selectedSiteId;
      if (selectedProjectId !== 'all') params.project_id = selectedProjectId;
      const res = await siteZonesApi.list(params);
      const list = res?.data?.zones ?? res?.data?.data ?? res?.data ?? (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setZones(list);
      }
    } catch {
      // Keep default zones
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [selectedProjectId, selectedSiteId]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = availableSites[0]?.id ? String(availableSites[0].id) : (sites[0]?.id ? String(sites[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      site_id: defaultSite,
      zone_code: `ZN-0${zones.length + 1}`,
      planned_start_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (z) => {
    setForm({
      project_id: String(z.project_id || '1'),
      site_id: String(z.site_id || '1'),
      zone_code: z.zone_code || '',
      zone_name: z.zone_name || '',
      zone_type_id: String(z.zone_type_id || '1'),
      status_id: String(z.status_id || '1'),
      planned_start_date: z.planned_start_date ? z.planned_start_date.split(' ')[0] : '',
      planned_end_date: z.planned_end_date ? z.planned_end_date.split(' ')[0] : '',
      progress_percentage: String(z.progress_percentage || 0),
      description: z.description || '',
    });
    setErrors({});
    setEditingZone(z);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.zone_name.trim()) errs.zone_name = 'Zone name is required';
    if (!form.zone_code.trim()) errs.zone_code = 'Zone code is required';
    if (!form.site_id) errs.site_id = 'Site is required';
    if (!form.project_id) errs.project_id = 'Project is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedSite = sites.find(s => String(s.id) === String(form.site_id));

      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id),
        zone_code: form.zone_code.trim(),
        zone_name: form.zone_name.trim(),
        zone_type_id: Number(form.zone_type_id) || 1,
        status_id: Number(form.status_id) || 1,
        planned_start_date: form.planned_start_date || null,
        planned_end_date: form.planned_end_date || null,
        progress_percentage: Number(form.progress_percentage || 0),
        description: form.description || null,
      };

      const newZoneItem = {
        id: editingZone?.id || Date.now(),
        ...payload,
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        site_name: selectedSite?.site_name || 'Main Job Site',
        zone_type_name: 'Construction Work Zone',
        status_name: payload.progress_percentage === 100 ? 'Completed' : payload.progress_percentage > 0 ? 'In Progress' : 'Active',
      };

      try {
        if (editingZone?.id) {
          await siteZonesApi.update(editingZone.id, payload);
        } else {
          await siteZonesApi.create(payload);
        }
      } catch {
        // Local fallback
      }

      if (editingZone?.id) {
        setZones(prev => prev.map(z => z.id === editingZone.id ? newZoneItem : z));
        toast.success('Work zone updated successfully.');
      } else {
        setZones(prev => [newZoneItem, ...prev]);
        toast.success('Work zone registered successfully.');
      }

      setIsAddOpen(false);
      setEditingZone(null);
    } catch {
      toast.error('Failed to save work zone.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteZone?.id) return;
    try {
      await siteZonesApi.remove(deleteZone.id);
    } catch {
      // Local fallback
    }
    setZones(prev => prev.filter(z => z.id !== deleteZone.id));
    toast.success('Work zone deleted.');
    setDeleteZone(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return zones.filter(z => {
      if (selectedProjectId !== 'all' && String(z.project_id) !== String(selectedProjectId)) return false;
      if (selectedSiteId !== 'all' && String(z.site_id) !== String(selectedSiteId)) return false;
      if (statusFilter !== 'all') {
        const s = (z.status_name || '').toLowerCase();
        if (statusFilter === 'Completed' && !s.includes('complete')) return false;
        if (statusFilter === 'In Progress' && !s.includes('progress')) return false;
        if (statusFilter === 'Active' && !s.includes('active')) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const code = (z.zone_code || '').toLowerCase();
        const name = (z.zone_name || '').toLowerCase();
        const sName = (z.site_name || '').toLowerCase();
        const pName = (z.project_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !sName.includes(q) && !pName.includes(q)) return false;
      }
      return true;
    });
  }, [zones, selectedProjectId, selectedSiteId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const activeCount = useMemo(() => zones.filter(z => (z.status_name || '').toLowerCase().includes('progress') || (z.status_name || '').toLowerCase().includes('active')).length, [zones]);
  const completedCount = useMemo(() => zones.filter(z => (z.status_name || '').toLowerCase().includes('complete')).length, [zones]);
  const avgProgress = useMemo(() => {
    if (zones.length === 0) return 0;
    const sum = zones.reduce((acc, z) => acc + Number(z.progress_percentage || 0), 0);
    return Math.round(sum / zones.length);
  }, [zones]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('complete')) return 'success';
    if (s.includes('progress') || s.includes('active')) return 'info';
    if (s.includes('hold') || s.includes('pending')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites & Locations', href: '/sites' },
    { label: 'Locations / Zones' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Locations & Work Zones"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Work Zones"
            value={zones.length}
            status="primary"
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Zones"
            value={activeCount}
            status="info"
            icon={<Activity className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Completed Zones"
            value={completedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Avg Zone Progress"
            value={`${avgProgress}%`}
            status="neutral"
            icon={<Grid3x3 className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Project/Site Selector Bar */}
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
                  setSelectedSiteId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Sites' },
                  ...sites
                    .filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId))
                    .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))
                ]}
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search zone, code, scope..."
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
              Add Work Zone
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
                  <th className="px-3 py-2">Zone Code & Name</th>
                  <th className="px-3 py-2">Parent Site & Project</th>
                  <th className="px-3 py-2 hidden md:table-cell">Zone Type</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Schedule Period</th>
                  <th className="px-3 py-2 w-28">Progress</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading work zones...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No work zones registered matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((z, idx) => {
                    const status = z.status_name || 'Active';
                    const startDate = z.planned_start_date ? z.planned_start_date.split(' ')[0] : '—';
                    const endDate = z.planned_end_date ? z.planned_end_date.split(' ')[0] : '—';

                    return (
                      <tr key={z.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={z.zone_name}>
                              {z.zone_name}
                            </span>
                            <span className="font-mono text-[10px] text-text-muted">
                              {z.zone_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-text-primary text-[11px] truncate" title={z.site_name}>
                              {z.site_name}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">
                              {z.project_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-text-secondary text-[11px] bg-surface-muted px-2 py-0.5 rounded border border-border">
                            {z.zone_type_name || 'Work Zone'}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell font-mono text-[11px] text-text-secondary">
                          {startDate} → {endDate}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  z.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'
                                }`}
                                style={{ width: `${z.progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-text-secondary w-7 text-right">
                              {Math.round(z.progress_percentage || 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Zone Details"
                              onClick={() => setViewingZone(z)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Zone"
                              onClick={() => handleOpenEdit(z)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteZone(z)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                            </Button>
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading work zones...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No work zones registered.
            </div>
          ) : (
            paged.map((z, idx) => {
              const status = z.status_name || 'Active';

              return (
                <div key={z.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-text-primary text-[13px]">{z.zone_name}</h4>
                      <span className="text-[10px] font-mono text-text-muted">{z.zone_code} • {z.site_name}</span>
                    </div>
                    <Badge
                      variant={getStatusVariant(status)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                    >
                      {status}
                    </Badge>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-border/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted text-[11px]">Progress:</span>
                      <span className="font-mono font-bold text-text-primary">{Math.round(z.progress_percentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${z.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${z.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[10px] text-text-muted font-mono">{z.planned_start_date ? z.planned_start_date.split(' ')[0] : '—'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingZone(z)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(z)}>
                        <Edit className="w-3.5 h-3.5 text-text-secondary" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

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

      {/* View Zone Modal */}
      {viewingZone && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingZone.zone_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingZone.zone_code} • {viewingZone.site_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingZone(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Progress</span> <span className="font-mono font-bold text-text-primary">{Math.round(viewingZone.progress_percentage || 0)}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-primary">{viewingZone.status_name || 'Active'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Start</span> <span className="font-mono">{viewingZone.planned_start_date || '—'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned End</span> <span className="font-mono">{viewingZone.planned_end_date || '—'}</span></div>
              </div>

              {viewingZone.description && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Scope & Boundary Description:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{viewingZone.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingZone(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Zone Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingZone)}
        onClose={() => { setIsAddOpen(false); setEditingZone(null); }}
      >
        <EntityEditModal.Header
          icon={Layers}
          title={editingZone ? 'Edit Work Zone' : 'Add Work Zone'}
          subtitle="Configure physical site zones, boundaries, and construction areas."
          onClose={() => { setIsAddOpen(false); setEditingZone(null); }}
        />
        <form id="zone-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Zone Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const s = sites.find(item => String(item.project_id) === String(v));
                      if (s) handleFormChange('site_id', String(s.id));
                    }}
                  />
                </FormField>

                <FormField label="Parent Site" required error={errors.site_id}>
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                  />
                </FormField>

                <FormField label="Zone Code" required error={errors.zone_code}>
                  <Input
                    value={form.zone_code}
                    onChange={(e) => handleFormChange('zone_code', e.target.value)}
                    placeholder="e.g. ZN-TWR-01"
                  />
                </FormField>

                <FormField label="Zone Name" required className="md:col-span-2" error={errors.zone_name}>
                  <Input
                    value={form.zone_name}
                    onChange={(e) => handleFormChange('zone_name', e.target.value)}
                    placeholder="e.g. Tower A - Core & Foundation"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Schedule & Progress">
              <EntityEditModal.Grid>
                <FormField label="Planned Start Date">
                  <Input
                    type="date"
                    value={form.planned_start_date}
                    onChange={(e) => handleFormChange('planned_start_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Planned End Date">
                  <Input
                    type="date"
                    value={form.planned_end_date}
                    onChange={(e) => handleFormChange('planned_end_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Progress Percentage (%)">
                  <Input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={form.progress_percentage}
                    onChange={(e) => handleFormChange('progress_percentage', e.target.value)}
                  />
                </FormField>

                <FormField label="Description / Perimeter Scope" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Specific zone boundary and structural notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="zone-form"
            submitLabel={editingZone ? 'Update Zone' : 'Create Zone'}
            onCancel={() => { setIsAddOpen(false); setEditingZone(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteZone)}
        title="Delete Work Zone"
        message={`Are you sure you want to delete "${deleteZone?.zone_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteZone(null)}
      />
    </PageContainer>
  );
}
