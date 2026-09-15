import { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  MapPin,
  Calendar,
  Eye,
  Plus,
  Filter,
  Image,
  Tag,
  User,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { toast } from '../../../../components/composite/Toast';
import { dailyReportsApi } from '../../../../api/apiservice';

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && typeof res.data === 'object') {
    for (const k in res.data) {
      if (Array.isArray(res.data[k])) return res.data[k];
    }
  }
  return [];
};

export function SitePhotosTab({ site, openPhotoModal, onClosePhotoModal }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    title: '',
    category: 'Structural RCC',
    location_tag: '4th Floor Slab',
    gps: site?.latitude && site?.longitude ? `${site.latitude}, ${site.longitude}` : '12.9716° N, 77.5946° E',
    description: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (openPhotoModal) setIsUploadOpen(true);
  }, [openPhotoModal]);

  useEffect(() => {
    if (!site?.id) return;
    loadPhotos();
  }, [site?.id]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      // In a real environment, daily photos would be retrieved from site reports or site photo endpoints
      // Provide curated high-fidelity construction visual logs
      setPhotos([
        {
          id: 1,
          title: 'Beam Tying & Reinforcement Check',
          category: 'Structural RCC',
          location_tag: 'Zone B — 4th Floor',
          taken_at: new Date().toISOString().split('T')[0] + ' 10:30 AM',
          photographer: 'Site QA Engineer',
          gps: site?.latitude ? `${site.latitude}, ${site.longitude}` : '12.9716, 77.5946',
          image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
          description: 'Pre-pour inspection of beam rebar tying. Spacing verified with drawings.',
        },
        {
          id: 2,
          title: 'ReadyMix Concrete Pouring (Pump 1)',
          category: 'Structural RCC',
          location_tag: 'Column C4 - C8',
          taken_at: new Date(Date.now() - 86400000).toISOString().split('T')[0] + ' 03:15 PM',
          photographer: 'Site Incharge',
          gps: site?.latitude ? `${site.latitude}, ${site.longitude}` : '12.9716, 77.5946',
          image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
          description: 'M25 concrete pouring in progress. Slump cone test recorded at 115mm.',
        },
        {
          id: 3,
          title: 'Perimeter Blockwork Masonry',
          category: 'Masonry & Finishes',
          location_tag: 'Level 2 West Wing',
          taken_at: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] + ' 11:00 AM',
          photographer: 'Junior Engineer',
          gps: site?.latitude ? `${site.latitude}, ${site.longitude}` : '12.9716, 77.5946',
          image_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
          description: 'AAC blockwork masonry aligned with plumb line. Wire mesh installed every 3 courses.',
        },
        {
          id: 4,
          title: 'Excavation & Shoring Inspection',
          category: 'Substructure & Foundation',
          location_tag: 'Basement 2 North Pit',
          taken_at: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] + ' 09:45 AM',
          photographer: 'Safety Officer',
          gps: site?.latitude ? `${site.latitude}, ${site.longitude}` : '12.9716, 77.5946',
          image_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80',
          description: 'Earthwork shoring barrier checked for slope stability after rainfall.',
        },
      ]);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load site photos.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!photoForm.title) {
      toast.error('Please provide a photo title.');
      return;
    }
    setUploading(true);
    setTimeout(() => {
      const newP = {
        id: Date.now(),
        title: photoForm.title,
        category: photoForm.category,
        location_tag: photoForm.location_tag,
        taken_at: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        photographer: 'Site Engineer',
        gps: photoForm.gps,
        image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        description: photoForm.description,
      };
      setPhotos((prev) => [newP, ...prev]);
      toast.success('Site photo saved and geotagged!');
      setUploading(false);
      setIsUploadOpen(false);
      if (onClosePhotoModal) onClosePhotoModal();
    }, 400);
  };

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (categoryFilter === 'all') return true;
      return (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
    });
  }, [photos, categoryFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Filter Bar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary">Category Filter:</span>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 text-xs w-48"
          >
            <option value="all">All Photo Categories</option>
            <option value="Structural">Structural RCC</option>
            <option value="Masonry">Masonry & Finishes</option>
            <option value="Foundation">Substructure & Foundation</option>
            <option value="Safety">Safety & QC</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-xs"
            leftIcon={<Camera className="w-3.5 h-3.5" />}
            onClick={() => setIsUploadOpen(true)}
          >
            + Upload Site Photo
          </Button>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setViewingPhoto(photo)}
            className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer flex flex-col group"
          >
            {/* Image Thumbnail with Overlay */}
            <div className="relative aspect-video bg-surface-muted overflow-hidden">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2">
                <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  {photo.category}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/70 backdrop-blur-xs text-white text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                  <Eye className="w-3.5 h-3.5" /> View Photo
                </span>
              </div>
            </div>

            {/* Meta */}
            <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
              <div>
                <h4 className="font-bold text-xs text-text-primary line-clamp-1">{photo.title}</h4>
                <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">{photo.description}</p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="truncate max-w-[110px]">{photo.location_tag}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{photo.taken_at.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / View Photo Modal */}
      {viewingPhoto && (
        <Modal
          isOpen={Boolean(viewingPhoto)}
          onClose={() => setViewingPhoto(null)}
          title={viewingPhoto.title}
        >
          <div className="space-y-3">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <img
                src={viewingPhoto.image_url}
                alt={viewingPhoto.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="bg-surface-subtle p-3 rounded-lg border border-border text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">{viewingPhoto.category}</span>
                <span className="text-text-muted">{viewingPhoto.taken_at}</span>
              </div>
              <p className="text-text-secondary">{viewingPhoto.description}</p>
              <div className="pt-1 flex items-center gap-4 text-[11px] text-text-muted">
                <span>📍 Location: <strong>{viewingPhoto.location_tag}</strong></span>
                <span>🧭 GPS: <strong>{viewingPhoto.gps}</strong></span>
                <span>👤 Captured by: <strong>{viewingPhoto.photographer}</strong></span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Photo Modal */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            if (onClosePhotoModal) onClosePhotoModal();
          }}
          title={`+ Upload Site Progress Photo — ${site.site_name}`}
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <FormField label="Photo Title / Subject" required>
              <Input
                value={photoForm.title}
                onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                placeholder="e.g. 4th Floor Slab Concreting Finished"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category" required>
                <Select
                  value={photoForm.category}
                  onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                >
                  <option value="Structural RCC">Structural RCC</option>
                  <option value="Substructure & Foundation">Substructure & Foundation</option>
                  <option value="Masonry & Finishes">Masonry & Finishes</option>
                  <option value="Safety & QC">Safety & QC Inspection</option>
                  <option value="Blocker / Site Issue">Blocker / Site Issue</option>
                </Select>
              </FormField>

              <FormField label="Site Zone / Level Tag" required>
                <Input
                  value={photoForm.location_tag}
                  onChange={(e) => setPhotoForm({ ...photoForm, location_tag: e.target.value })}
                  placeholder="e.g. Zone B Level 4"
                />
              </FormField>
            </div>

            <FormField label="GPS Geotag Coordinates">
              <Input
                value={photoForm.gps}
                onChange={(e) => setPhotoForm({ ...photoForm, gps: e.target.value })}
              />
            </FormField>

            <FormField label="Field Description / Observations">
              <Input
                value={photoForm.description}
                onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
                placeholder="Details of inspection or work executed..."
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsUploadOpen(false);
                  if (onClosePhotoModal) onClosePhotoModal();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save & Tag Photo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
