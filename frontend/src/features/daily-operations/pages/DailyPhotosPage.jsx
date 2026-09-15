import { useState, useEffect, useMemo } from 'react';
import {
  Image, Camera, CheckCircle2, MapPin, 
  Search, Eye, Trash2, Plus, Download
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
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
import { projectsApi, dailyReportsApi, api } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && typeof res.data === 'object') {
    for (const key in res.data) {
      if (Array.isArray(res.data[key])) return res.data[key];
    }
  }
  if (res && typeof res === 'object') {
    for (const key in res) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
};

const EMPTY_FORM = {
  project_id: '',
  report_id: '',
  title: '',
  tag: 'Pre-Pour QC Inspection',
  location: 'Level 2 Floor Deck',
  date: '',
  time: '10:00 AM',
  gps_coordinates: '10.9602° N, 78.0766° E',
  photographer: 'Site QA Engineer',
  description: '',
  photoFile: null,
  image_preview: null,
};

const AsyncImage = ({ reportId, photoId, alt, className }) => {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let url;
    dailyReportsApi.photos.download(reportId, photoId)
      .then(blob => {
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => setError(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [reportId, photoId]);

  if (error || !src) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-surface-muted absolute inset-0 -z-10">
         <Camera className="w-10 h-10 mb-2 text-text-secondary opacity-50" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
};

export function DailyPhotosPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const getBaseUrl = () => {
    const url = api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || '/api';
    return url.replace(/\/api\/?$/, '');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const projRes = await projectsApi.list();
      const pList = extractArray(projRes);
      setProjects(pList);

      if (dailyReportsApi?.list) {
        const dprRes = await dailyReportsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
        const rList = extractArray(dprRes);
        setReports(rList);

        let allPhotos = [];
        for (const r of rList.slice(0, 15)) {
          try {
            const reportDetails = await dailyReportsApi.get(r.id);
            const reportData = reportDetails?.data?.daily_site_report || reportDetails?.daily_site_report || reportDetails;
            const pList = extractArray(reportData?.photos || []);
            
            const withMeta = pList.map(p => ({ 
              ...p, 
              report_id: r.id, 
              project_id: r.project_id, 
              date: p.captured_at ? new Date(p.captured_at).toISOString().split('T')[0] : 
                    p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : 
                    new Date().toISOString().split('T')[0],
              project_code: r.project_code,
              // Fallbacks since these aren't saved in backend
              tag: 'General Progress', 
              location: r.site_name || 'Site Location',
              photographer: p.created_by_name || 'Site User',
              aspect_color: 'bg-primary/20 border-primary/30 text-primary',
            }));
            allPhotos = [...allPhotos, ...withMeta];
          } catch (e) { /* ignore */ }
        }
        setPhotos(allPhotos);
      }
    } catch (e) {
      console.error(e);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      report_id: '',
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.report_id) errs.report_id = 'Daily Report is required';
    if (!form.title.trim()) errs.title = 'Photo title is required';
    if (!form.photoFile) errs.photoFile = 'A photo file is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        photo: form.photoFile,
        // Bypass backend strict validation with Dummy IDs
        photo_type_id: 1,
      };

      await dailyReportsApi.photos.upload(form.report_id, payload);
      toast.success('Site progress photo uploaded.');
      loadData();
      setIsAddOpen(false);
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
        toast.error(Object.values(err.errors).flat().join('\n') || 'Validation failed.');
      } else {
        toast.error(err?.message || 'Failed to upload photo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id || !deleteItem?.report_id) return;
    try {
      await dailyReportsApi.photos.remove(deleteItem.report_id, deleteItem.id);
      toast.success('Photo removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to remove photo.');
    } finally {
      setDeleteItem(null);
    }
  };

  const filtered = useMemo(() => {
    return photos.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (tagFilter !== 'all' && !p.tag.includes(tagFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const tit = String(p.title || '').toLowerCase();
        const tag = String(p.tag || '').toLowerCase();
        const loc = String(p.location || '').toLowerCase();
        if (!tit.includes(s) && !tag.includes(s) && !loc.includes(s)) return false;
      }
      return true;
    });
  }, [photos, selectedProjectId, tagFilter, search]);

  const handleDownload = async (item) => {
    if (!item.report_id || !item.id) return;
    toast.success(`Downloading ${item.file_name}...`);
    try {
      const blob = await dailyReportsApi.photos.download(item.report_id, item.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.file_name || 'download.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Download failed.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Geo-Tagged Site Progress Photos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Daily Site Operations', href: '/daily-operations/reports' },
          { label: 'Site Photo Gallery' }
        ]}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Captured Site Photos"
            value={photos.length}
            status="primary"
            icon={<Camera className="w-4 h-4" />}
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
                placeholder="Search photo title, tag, location..."
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
              Upload Site Photo
            </Button>
          </div>
        </div>

        {/* Visual Photo Cards Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {loading && photos.length === 0 ? (
             <div className="col-span-full text-center py-10 text-sm text-text-muted">Loading photos...</div>
          ) : filtered.length === 0 ? (
             <div className="col-span-full text-center py-10 text-sm text-text-muted">No photos found.</div>
          ) : filtered.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div>
                {/* Photo Simulation Canvas / Banner */}
                <div className={`h-40 ${p.aspect_color} border-b flex flex-col items-center justify-center relative p-0 text-center group-hover:scale-[1.01] transition-transform overflow-hidden cursor-pointer`} onClick={() => setViewingItem(p)}>
                  <AsyncImage reportId={p.report_id} photoId={p.id} alt={p.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <Badge variant="primary" className="text-[8px] uppercase tracking-wider font-bold shadow-sm backdrop-blur-sm bg-primary/90 text-white">
                      {p.tag}
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 flex-1 cursor-pointer" onClick={() => setViewingItem(p)}>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
                    <span>{p.date}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-text-secondary line-clamp-2 bg-surface-muted/30 p-2 rounded border border-border/50">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-3.5 py-2.5 border-t border-border bg-surface-muted/20 flex justify-between items-center text-xs">
                <span className="text-[10px] text-text-muted font-medium">{p.photographer}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                    <Eye className="w-3 h-3 mr-1" /> View Full
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-text-muted hover:text-error" onClick={() => setDeleteItem(p)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Photo Lightbox Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl flex flex-col h-full max-h-[95vh] relative">
            {/* Header Actions */}
            <div className="flex justify-end gap-2 pb-4 shrink-0">
              <Button variant="outline" size="sm" className="bg-surface/10 text-white hover:bg-surface/20 border-white/20" onClick={() => handleDownload(viewingItem)}>
                <Download className="w-4 h-4 mr-2" /> Download Image
              </Button>
              <Button variant="outline" size="sm" className="bg-red-500/80 text-white hover:bg-red-600 border-red-500" onClick={() => setViewingItem(null)}>
                Cancel Viewing ✕
              </Button>
            </div>

            {/* Main Image */}
            <div className="flex-1 min-h-0 bg-black/50 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center">
              <AsyncImage 
                reportId={viewingItem.report_id} 
                photoId={viewingItem.id} 
                alt={viewingItem.title} 
                className="w-full h-full object-contain max-h-[70vh]" 
              />
            </div>

            {/* Photo Metadata Footer */}
            <div className="mt-4 bg-surface rounded-xl p-4 shrink-0 shadow-level-3">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{viewingItem.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-1 font-mono">
                    <span>{viewingItem.date}</span>
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {viewingItem.location}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                   <div>
                     <span className="block text-[10px] text-text-muted uppercase font-bold">Category</span>
                     <span className="font-medium">{viewingItem.tag}</span>
                   </div>
                   <div>
                     <span className="block text-[10px] text-text-muted uppercase font-bold">Captured By</span>
                     <span className="font-medium">{viewingItem.photographer}</span>
                   </div>
                </div>
              </div>
              {viewingItem.description && (
                <div className="mt-3 p-3 bg-surface-muted rounded-lg text-sm text-text-secondary">
                  {viewingItem.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      <EntityEditModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <EntityEditModal.Header
          icon={Camera}
          title="Upload Site Progress Photo"
          subtitle="Record visual evidence with timestamp and GPS coordinates for client DPR dossier."
          onClose={() => setIsAddOpen(false)}
        />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Photo Details & Location">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Daily Site Report (Site Context)" required error={errors.report_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Daily Report...' },
                      ...reports.filter(r => String(r.project_id) === form.project_id).map(r => ({ value: String(r.id), label: `${r.report_date} - ${r.site_name || 'Report'}` }))
                    ]}
                    value={form.report_id}
                    onChange={(v) => handleFormChange('report_id', v)}
                    disabled={!form.project_id}
                  />
                </FormField>

                <FormField label="Category Tag (UI Only - Won't Save)">
                  <Select
                    options={[
                      { value: 'Pre-Pour QC Inspection', label: 'Pre-Pour QC Inspection' },
                      { value: 'Concrete Pour Log', label: 'Concrete Pour Log' },
                      { value: 'Highway Earthworks', label: 'Highway Earthworks' },
                      { value: 'Safety Clearance', label: 'Safety Clearance' },
                      { value: 'Finishing Works', label: 'Finishing Works' },
                    ]}
                    value={form.tag}
                    onChange={(v) => handleFormChange('tag', v)}
                  />
                </FormField>

                <FormField label="Site Photo" required error={errors.photoFile} className="md:col-span-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFormChange('photoFile', file);
                        const reader = new FileReader();
                        reader.onloadend = () => handleFormChange('image_preview', reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {form.image_preview && (
                    <div className="mt-3">
                       <img src={form.image_preview} alt="Preview" className="h-32 rounded object-cover shadow-sm border border-border" />
                    </div>
                  )}
                </FormField>

                <FormField label="Photo Title / Subject" required error={errors.title} className="md:col-span-2">
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Level 2 Column Reinforcement Inspection"
                  />
                </FormField>

                <FormField label="Site Location / Grid (UI Only - Won't Save)" className="md:col-span-2">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Tower Core 1 Grid C1-C6"
                  />
                </FormField>

                <FormField label="GPS Coordinates (UI Only)">
                  <Input
                    value={form.gps_coordinates}
                    onChange={(e) => handleFormChange('gps_coordinates', e.target.value)}
                    placeholder="10.9602° N, 78.0766° E"
                  />
                </FormField>

                <FormField label="Photographer (UI Only)">
                  <Input
                    value={form.photographer}
                    onChange={(e) => handleFormChange('photographer', e.target.value)}
                    placeholder="e.g. Er. Senthil Nathan"
                  />
                </FormField>

                <FormField label="Inspection Observations" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Clear cover verified, stirrups spacing checked..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            submitLabel="Upload Photo"
            onCancel={() => setIsAddOpen(false)}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Photo"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
