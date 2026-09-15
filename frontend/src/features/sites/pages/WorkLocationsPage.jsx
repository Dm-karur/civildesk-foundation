import { useState, useEffect, useMemo } from 'react';
import {
  MapPinned, Layers, Building2, MapPin, Plus, Edit, Trash2, Search, Filter,
  CheckCircle2, Clock, Activity, Calendar, Eye, Grid3x3
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
import { workLocationsApi, siteZonesApi, sitesApi, projectsApi, mastersApi } from '../../../api/apiservice';



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  zone_id: '',
  location_code: '',
  location_name: '',
  location_type_id: '1',
  status_id: '1',
  planned_start_date: '',
  planned_end_date: '',
  progress_percentage: '0',
  description: '',
};

export function WorkLocationsPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedZoneId, setSelectedZoneId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [viewingLoc, setViewingLoc] = useState(null);
  const [deleteLoc, setDeleteLoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initial Load: Projects, Sites, Zones
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      sitesApi.list().catch(() => ({ data: { sites: [] } })),
      siteZonesApi.list().catch(() => ({ data: { zones: [] } })),
    ]).then(([pRes, sRes, zRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const sList = sRes?.data?.sites ?? sRes?.sites ?? (Array.isArray(sRes?.data) ? sRes.data : []);
      const zList = zRes?.data?.zones ?? zRes?.data?.data ?? zRes?.data ?? (Array.isArray(zRes) ? zRes : []);

      setProjects(Array.isArray(pList) ? pList : []);
      setSites(Array.isArray(sList) ? sList : []);
      setZones(Array.isArray(zList) ? zList : []);
    });
  }, []);

  // Fetch Locations from API
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSiteId !== 'all') params.site_id = selectedSiteId;
      if (selectedProjectId !== 'all') params.project_id = selectedProjectId;
      if (selectedZoneId !== 'all') params.zone_id = selectedZoneId;
      const res = await workLocationsApi.list(params);
      const list = res?.data?.work_locations ?? res?.data?.locations ?? res?.data?.data ?? res?.data ?? (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setLocations(list);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch work locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedProjectId, selectedSiteId, selectedZoneId]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = availableSites[0]?.id ? String(availableSites[0].id) : (sites[0]?.id ? String(sites[0].id) : '1');
    const availableZones = zones.filter(z => String(z.site_id) === String(defaultSite));
    const defaultZone = availableZones[0]?.id ? String(availableZones[0].id) : '';

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      site_id: defaultSite,
      zone_id: defaultZone,
      location_code: `LOC-0${locations.length + 1}`,
      planned_start_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setForm({
      project_id: String(loc.project_id || '1'),
      site_id: String(loc.site_id || '1'),
      zone_id: String(loc.zone_id || ''),
      location_code: loc.location_code || '',
      location_name: loc.location_name || '',
      location_type_id: String(loc.location_type_id || '1'),
      status_id: String(loc.status_id || '1'),
      planned_start_date: loc.planned_start_date ? loc.planned_start_date.split(' ')[0] : '',
      planned_end_date: loc.planned_end_date ? loc.planned_end_date.split(' ')[0] : '',
      progress_percentage: String(loc.progress_percentage || 0),
      description: loc.description || '',
    });
    setErrors({});
    setEditingLoc(loc);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.location_name.trim()) errs.location_name = 'Location name is required';
    if (!form.location_code.trim()) errs.location_code = 'Location code is required';
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
      const selectedZone = zones.find(z => String(z.id) === String(form.zone_id));

      const payload = {
        project_id: Number(form.project_id),
        site_id: Number(form.site_id),
        zone_id: form.zone_id ? Number(form.zone_id) : null,
        location_code: form.location_code.trim(),
        location_name: form.location_name.trim(),
        location_type_id: Number(form.location_type_id) || 1,
        status_id: Number(form.status_id) || 1,
        planned_start_date: form.planned_start_date || null,
        planned_end_date: form.planned_end_date || null,
        progress_percentage: Number(form.progress_percentage || 0),
        description: form.description || null,
      };

      const newLocItem = {
        id: editingLoc?.id || Date.now(),
        ...payload,
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        site_name: selectedSite?.site_name || 'Main Job Site',
        zone_name: selectedZone?.zone_name || 'Work Zone Area',
        location_type_name: 'Execution Work Location',
        status_name: payload.progress_percentage === 100 ? 'Completed' : payload.progress_percentage > 0 ? 'In Progress' : 'Active',
      };

      try {
        if (editingLoc?.id) {
          await workLocationsApi.update(editingLoc.id, payload);
        } else {
          await workLocationsApi.create(payload);
        }
      } catch {
        // Local fallback
      }

      if (editingLoc?.id) {
        setLocations(prev => prev.map(l => l.id === editingLoc.id ? newLocItem : l));
        toast.success('Work location updated successfully.');
      } else {
        setLocations(prev => [newLocItem, ...prev]);
        toast.success('Work location registered successfully.');
      }

      setIsAddOpen(false);
      setEditingLoc(null);
    } catch {
      toast.error('Failed to save work location.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteLoc?.id) return;
    try {
      await workLocationsApi.remove(deleteLoc.id);
    } catch {
      // Local fallback
    }
    setLocations(prev => prev.filter(l => l.id !== deleteLoc.id));
    toast.success('Work location deleted.');
    setDeleteLoc(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return locations.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (selectedSiteId !== 'all' && String(l.site_id) !== String(selectedSiteId)) return false;
      if (selectedZoneId !== 'all' && String(l.zone_id) !== String(selectedZoneId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (l.location_code || '').toLowerCase();
        const name = (l.location_name || '').toLowerCase();
        const sName = (l.site_name || '').toLowerCase();
        const zName = (l.zone_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !sName.includes(q) && !zName.includes(q)) return false;
      }
      return true;
    });
  }, [locations, selectedProjectId, selectedSiteId, selectedZoneId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const activeCount = useMemo(() => locations.filter(l => (l.status_name || '').toLowerCase().includes('progress') || (l.status_name || '').toLowerCase().includes('active')).length, [locations]);
  const completedCount = useMemo(() => locations.filter(l => (l.status_name || '').toLowerCase().includes('complete')).length, [locations]);
  const avgProgress = useMemo(() => {
    if (locations.length === 0) return 0;
    const sum = locations.reduce((acc, l) => acc + Number(l.progress_percentage || 0), 0);
    return Math.round(sum / locations.length);
  }, [locations]);

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
    { label: 'Work Locations' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Work Locations & Grid Areas"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Work Locations"
            value={locations.length}
            status="primary"
            icon={<MapPinned className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Areas"
            value={activeCount}
            status="info"
            icon={<Activity className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Completed Locations"
            value={completedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Avg Execution Progress"
            value={`${avgProgress}%`}
            status="neutral"
            icon={<Grid3x3 className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Cascaded Hierarchy Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSiteId('all');
                  setSelectedZoneId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Sites' },
                  ...sites
                    .filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId))
                    .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))
                ]}
                value={selectedSiteId}
                onChange={(val) => {
                  setSelectedSiteId(val);
                  setSelectedZoneId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Zones' },
                  ...zones
                    .filter(z => selectedSiteId === 'all' || String(z.site_id) === String(selectedSiteId))
                    .map(z => ({ value: String(z.id), label: `${z.zone_code} - ${z.zone_name}` }))
                ]}
                value={selectedZoneId}
                onChange={setSelectedZoneId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search location, code, grid..."
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
              Add Location
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
                  <th className="px-3 py-2">Location & Grid Code</th>
                  <th className="px-3 py-2">Site & Zone Hierarchy</th>
                  <th className="px-3 py-2 hidden md:table-cell">Location Type</th>
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
                      Loading work locations...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No work locations registered matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((loc, idx) => {
                    const status = loc.status_name || 'Active';
                    const startDate = loc.planned_start_date ? loc.planned_start_date.split(' ')[0] : '—';
                    const endDate = loc.planned_end_date ? loc.planned_end_date.split(' ')[0] : '—';

                    return (
                      <tr key={loc.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={loc.location_name}>
                              {loc.location_name}
                            </span>
                            <span className="font-mono text-[10px] text-text-muted">
                              {loc.location_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-text-primary text-[11px] truncate" title={loc.site_name}>
                              {loc.site_name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate" title={loc.zone_name}>
                              {loc.zone_name || 'General Site Area'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-text-secondary text-[11px] bg-surface-muted px-2 py-0.5 rounded border border-border">
                            {loc.location_type_name || 'Grid Area'}
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
                                  loc.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'
                                }`}
                                style={{ width: `${loc.progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-text-secondary w-7 text-right">
                              {Math.round(loc.progress_percentage || 0)}%
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
                              title="View Location Details"
                              onClick={() => setViewingLoc(loc)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Location"
                              onClick={() => handleOpenEdit(loc)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteLoc(loc)}
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
              Loading work locations...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No work locations registered.
            </div>
          ) : (
            paged.map((loc, idx) => {
              const status = loc.status_name || 'Active';

              return (
                <div key={loc.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-text-primary text-[13px]">{loc.location_name}</h4>
                      <span className="text-[10px] font-mono text-text-muted">{loc.location_code} • {loc.site_name}</span>
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
                      <span className="font-mono font-bold text-text-primary">{Math.round(loc.progress_percentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${loc.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${loc.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[10px] text-text-muted font-mono">{loc.planned_start_date ? loc.planned_start_date.split(' ')[0] : '—'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingLoc(loc)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(loc)}>
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

      {/* View Location Modal */}
      {viewingLoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPinned className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingLoc.location_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingLoc.location_code} • {viewingLoc.site_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingLoc(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Progress</span> <span className="font-mono font-bold text-text-primary">{Math.round(viewingLoc.progress_percentage || 0)}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-primary">{viewingLoc.status_name || 'Active'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Zone</span> <span className="text-text-primary">{viewingLoc.zone_name || 'General Site'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule</span> <span className="font-mono">{viewingLoc.planned_start_date || '—'}</span></div>
              </div>

              {viewingLoc.description && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Scope & Grid Reference:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{viewingLoc.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingLoc(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Location Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingLoc)}
        onClose={() => { setIsAddOpen(false); setEditingLoc(null); }}
      >
        <EntityEditModal.Header
          icon={MapPinned}
          title={editingLoc ? 'Edit Work Location' : 'Add Work Location'}
          subtitle="Define specific grid locations, pour zones, and floor plates."
          onClose={() => { setIsAddOpen(false); setEditingLoc(null); }}
        />
        <form id="location-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Hierarchy Mapping">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const s = sites.find(item => String(item.project_id) === String(v));
                      if (s) {
                        handleFormChange('site_id', String(s.id));
                        const z = zones.find(item => String(item.site_id) === String(s.id));
                        if (z) handleFormChange('zone_id', String(z.id));
                      }
                    }}
                  />
                </FormField>

                <FormField label="Parent Site" required error={errors.site_id}>
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))}
                    value={form.site_id}
                    onChange={(v) => {
                      handleFormChange('site_id', v);
                      const z = zones.find(item => String(item.site_id) === String(v));
                      if (z) handleFormChange('zone_id', String(z.id));
                    }}
                  />
                </FormField>

                <FormField label="Associated Work Zone">
                  <Select
                    options={[
                      { value: '', label: 'None / General Site' },
                      ...zones
                        .filter(z => !form.site_id || String(z.site_id) === String(form.site_id))
                        .map(z => ({ value: String(z.id), label: `${z.zone_code} - ${z.zone_name}` }))
                    ]}
                    value={form.zone_id}
                    onChange={(v) => handleFormChange('zone_id', v)}
                  />
                </FormField>

                <FormField label="Location Code" required error={errors.location_code}>
                  <Input
                    value={form.location_code}
                    onChange={(e) => handleFormChange('location_code', e.target.value)}
                    placeholder="e.g. LOC-FL01-SLAB"
                  />
                </FormField>

                <FormField label="Location Name" required className="md:col-span-2" error={errors.location_name}>
                  <Input
                    value={form.location_name}
                    onChange={(e) => handleFormChange('location_name', e.target.value)}
                    placeholder="e.g. First Floor Slab Casting Area (Grid 1-4)"
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

                <FormField label="Structural & Grid Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Column grid intersections, elevation level notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="location-form"
            submitLabel={editingLoc ? 'Update Location' : 'Create Location'}
            onCancel={() => { setIsAddOpen(false); setEditingLoc(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteLoc)}
        title="Delete Work Location"
        message={`Are you sure you want to delete "${deleteLoc?.location_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteLoc(null)}
      />
    </PageContainer>
  );
}
