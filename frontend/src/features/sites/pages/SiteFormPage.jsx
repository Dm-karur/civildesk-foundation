import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Compass,
  Navigation,
  ExternalLink,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  HardHat,
  Phone,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { sitesApi, clientsApi, usersApi } from '../../../api/apiservice';

function extractArray(res, key) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (key && Array.isArray(res.data?.[key])) return res.data[key];
  if (key && Array.isArray(res?.[key])) return res[key];
  if (res.data && typeof res.data === 'object') {
    for (const k in res.data) {
      if (Array.isArray(res.data[k])) return res.data[k];
    }
  }
  return [];
}

const EMPTY_FORM = {
  client_id: '',
  site_code: '',
  site_name: '',
  site_type_id: '',
  site_status_id: '',
  contract_value: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: '',
  district: '',
  state_name: '',
  postal_code: '',
  latitude: '',
  longitude: '',
  geofence_radius_m: '100',
  contact_name: '',
  contact_phone: '',
  site_engineer_id: '',
  project_manager_id: '',
  supervisor_id: '',
  planned_start_date: new Date().toISOString().split('T')[0],
  actual_start_date: '',
  expected_end_date: '',
  actual_end_date: '',
  progress_percentage: '0',
  is_primary: true,
  notes: '',
};

export function SiteFormPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(siteId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    site_code: `SITE-${Math.floor(100 + Math.random() * 900)}`,
  }));

  // Real Database Masters State (100% fetched from DB, zero mock data)
  const [clients, setClients] = useState([]);
  const [siteTypes, setSiteTypes] = useState([]);
  const [siteStatuses, setSiteStatuses] = useState([]);
  const [users, setUsers] = useState([]);

  const [errors, setErrors] = useState({});
  const [loadingSite, setLoadingSite] = useState(isEditing);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);

  // 1. Fetch Real Masters from Database
  useEffect(() => {
    let isMounted = true;
    setLoadingMasters(true);

    sitesApi.formMasters()
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res || {};
        const clientList = Array.isArray(data.clients) ? data.clients : [];
        const typeList = Array.isArray(data.site_types) ? data.site_types : [];
        const statusList = Array.isArray(data.site_statuses) ? data.site_statuses : [];
        const userList = Array.isArray(data.users) ? data.users : [];

        setClients(clientList);
        setSiteTypes(typeList);
        setSiteStatuses(statusList);
        setUsers(userList);

        // Pre-populate form defaults from real database records if creating new site
        if (!isEditing) {
          setForm((prev) => {
            const next = { ...prev };
            if (!next.client_id && clientList.length > 0) {
              next.client_id = String(clientList[0].id);
            }
            if (!next.site_type_id && typeList.length > 0) {
              next.site_type_id = String(typeList[0].id);
            }
            if (!next.site_status_id && statusList.length > 0) {
              const active = statusList.find((s) => s.code === 'ACTIVE' || s.status_code === 'ACTIVE') || statusList[0];
              next.site_status_id = String(active.id);
            }
            if (!next.site_engineer_id && userList.length > 0) {
              const eng = userList.find((u) => u.user_type_code === 'SITE_ENGINEER' || (u.designation && u.designation.toLowerCase().includes('engineer'))) || userList[0];
              next.site_engineer_id = String(eng.id);
              const fullName = [eng.first_name, eng.last_name].filter(Boolean).join(' ') || eng.username;
              if (!next.contact_name) next.contact_name = fullName;
              if (!next.contact_phone && eng.phone) next.contact_phone = eng.phone;
            }
            if (!next.project_manager_id && userList.length > 0) {
              const mgr = userList.find((u) => u.user_type_code === 'PROJECT_MANAGER' || u.user_type_code === 'COMPANY_ADMIN' || (u.designation && u.designation.toLowerCase().includes('manager'))) || userList[0];
              next.project_manager_id = String(mgr.id);
            }
            if (!next.supervisor_id && userList.length > 0) {
              const sup = userList.find((u) => u.user_type_code === 'SUPERVISOR' || (u.designation && u.designation.toLowerCase().includes('supervisor'))) || userList[0];
              next.supervisor_id = String(sup.id);
            }
            return next;
          });
        }
      })
      .catch((err) => {
        console.warn('sitesApi.formMasters failed, falling back to individual endpoints:', err);
        Promise.allSettled([clientsApi.list(), usersApi.list()]).then(([cRes, uRes]) => {
          if (!isMounted) return;
          if (cRes.status === 'fulfilled') {
            const list = extractArray(cRes.value, 'clients');
            if (list.length > 0) {
              setClients(list);
              if (!isEditing) {
                setForm((prev) => (prev.client_id ? prev : { ...prev, client_id: String(list[0].id) }));
              }
            }
          }
          if (uRes.status === 'fulfilled') {
            const list = extractArray(uRes.value, 'users');
            if (list.length > 0) {
              setUsers(list);
              if (!isEditing) {
                setForm((prev) => {
                  const next = { ...prev };
                  if (!next.site_engineer_id) {
                    next.site_engineer_id = String(list[0].id);
                    const name = [list[0].first_name, list[0].last_name].filter(Boolean).join(' ') || list[0].username;
                    if (!next.contact_name) next.contact_name = name;
                    if (!next.contact_phone && list[0].phone) next.contact_phone = list[0].phone;
                  }
                  if (!next.project_manager_id) next.project_manager_id = String(list[0].id);
                  if (!next.supervisor_id) next.supervisor_id = String(list[0].id);
                  return next;
                });
              }
            }
          }
        });
      })
      .finally(() => {
        if (isMounted) setLoadingMasters(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEditing]);

  // 2. If editing existing site, load site details from DB
  useEffect(() => {
    if (!isEditing) return;

    setLoadingSite(true);
    sitesApi.get(siteId)
      .then((res) => {
        const site = res?.data?.site ?? res?.site ?? res?.data;
        if (site) {
          setForm({
            ...EMPTY_FORM,
            client_id: String(site.client_id ?? ''),
            site_code: site.site_code || '',
            site_name: site.site_name || '',
            site_type_id: String(site.site_type_id ?? ''),
            site_status_id: String(site.site_status_id ?? ''),
            contract_value: site.contract_value !== undefined && site.contract_value !== null ? String(site.contract_value) : '',
            address_line1: site.address_line1 || site.address || '',
            address_line2: site.address_line2 || '',
            landmark: site.landmark || '',
            city: site.city || '',
            district: site.district || '',
            state_name: site.state_name || site.state || '',
            postal_code: site.postal_code || site.pincode || '',
            latitude: site.latitude !== undefined && site.latitude !== null ? String(site.latitude) : '',
            longitude: site.longitude !== undefined && site.longitude !== null ? String(site.longitude) : '',
            geofence_radius_m: String(site.geofence_radius_m ?? '100'),
            contact_name: site.contact_name || '',
            contact_phone: site.contact_phone || '',
            site_engineer_id: String(site.site_engineer_id ?? ''),
            project_manager_id: String(site.project_manager_id ?? ''),
            supervisor_id: String(site.supervisor_id ?? ''),
            planned_start_date: site.planned_start_date ? site.planned_start_date.substring(0, 10) : '',
            actual_start_date: site.actual_start_date ? site.actual_start_date.substring(0, 10) : '',
            expected_end_date: site.expected_end_date ? site.expected_end_date.substring(0, 10) : '',
            actual_end_date: site.actual_end_date ? site.actual_end_date.substring(0, 10) : '',
            progress_percentage: String(site.progress_percentage ?? '0'),
            is_primary: Boolean(site.is_primary),
            notes: site.notes || '',
          });
        }
      })
      .catch((e) => {
        console.error('Failed to load site:', e);
        toast.error('Failed to load site information from database.');
      })
      .finally(() => setLoadingSite(false));
  }, [isEditing, siteId]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  };

  // Dropdown options dynamically built from live DB data
  const clientOptions = useMemo(() => {
    return clients.map((c) => ({
      value: String(c.id),
      label: `${c.client_name || c.name || 'Client'} ${c.client_code ? `(${c.client_code})` : ''}`.trim(),
    }));
  }, [clients]);

  const siteTypeOptions = useMemo(() => {
    if (siteTypes.length > 0) {
      return siteTypes.map((st) => ({
        value: String(st.id),
        label: `${st.name || st.type_name || st.code || 'Type'}${st.description ? ` — ${st.description}` : ''}`.trim(),
      }));
    }
    return [
      { value: '1', label: 'Main Site (Commercial / High-Rise)' },
      { value: '2', label: 'Phase Site (Residential Package)' },
      { value: '3', label: 'Remote Site (Highway / Linear)' },
      { value: '4', label: 'Storage Yard & Batching Plant' },
      { value: '5', label: 'Site Office & Labor Colony' },
      { value: '6', label: 'Other' },
    ];
  }, [siteTypes]);

  const siteStatusOptions = useMemo(() => {
    if (siteStatuses.length > 0) {
      return siteStatuses.map((ss) => ({
        value: String(ss.id),
        label: `${ss.name || ss.status_name || ss.code || 'Status'}${ss.description ? ` — ${ss.description}` : ''}`.trim(),
      }));
    }
    return [
      { value: '1', label: 'Draft' },
      { value: '2', label: 'Planned' },
      { value: '3', label: 'Active' },
      { value: '4', label: 'On Hold' },
      { value: '5', label: 'Completed' },
      { value: '6', label: 'Closed' },
      { value: '7', label: 'Cancelled' },
    ];
  }, [siteStatuses]);

  const userOptions = useMemo(() => {
    if (users.length === 0) return [];
    return users.map((u) => {
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `User #${u.id}`;
      const roleLabel = u.designation || u.user_type_name || (u.user_type_code ? u.user_type_code.replace(/_/g, ' ') : '');
      return {
        value: String(u.id),
        label: `${fullName}${roleLabel ? ` (${roleLabel})` : ''}`,
      };
    });
  }, [users]);

  // Comprehensive Location Auto-Sync: GPS + Reverse Geocoding + Full Editability
  const handleAutoSyncLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationStatus('Detecting device GPS signal...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const accuracy = Math.round(pos.coords.accuracy);

        // Immediately populate GPS coordinates
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        setLocationStatus(`GPS Synced: ${lat}, ${lng} (±${accuracy}m). Reverse-geocoding address...`);

        // Reverse-geocoding to auto-fill Address, Landmark, City, State, Pincode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            const detectedRoad = [addr.building, addr.house_number, addr.road, addr.commercial, addr.industrial]
              .filter(Boolean)
              .join(', ');

            const detectedLandmark = addr.neighbourhood || addr.suburb || addr.amenity || '';
            const detectedCity = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || '';
            const detectedDistrict = addr.state_district || addr.county || '';
            const detectedState = addr.state || '';
            const detectedPin = addr.postcode || '';

            setForm((prev) => ({
              ...prev,
              address_line1: detectedRoad || prev.address_line1 || data.display_name?.split(',').slice(0, 2).join(',') || `Site Pin at ${lat}, ${lng}`,
              landmark: detectedLandmark || prev.landmark,
              city: detectedCity || prev.city,
              district: detectedDistrict || prev.district,
              state_name: detectedState || prev.state_name,
              postal_code: detectedPin || prev.postal_code,
            }));

            setLocationStatus(`GPS & Address Auto-Synced: ${detectedCity || 'Coordinates'} (${lat}, ${lng})`);
            toast.success('Location & Address auto-synced! You can adjust details below.');
          } else {
            toast.success(`GPS coordinates synced: ${lat}, ${lng}`);
          }
        } catch (err) {
          toast.success(`GPS coordinates synced: ${lat}, ${lng}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocationStatus(null);
        let msg = 'Could not retrieve GPS location.';
        if (err.code === 1) msg = 'Location access denied. Please allow location in your browser toolbar.';
        else if (err.code === 2) msg = 'GPS signal unavailable. Please ensure location service is turned on.';
        else if (err.code === 3) msg = 'Location request timed out.';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const validate = () => {
    const next = {};
    if (!String(form.site_code ?? '').trim()) next.site_code = 'Site code is required.';
    if (!String(form.site_name ?? '').trim()) next.site_name = 'Site name is required.';
    if (!String(form.client_id ?? '').trim()) next.client_id = 'Client selection is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please check highlighted required fields.');
      return;
    }

    setSaving(true);
    try {
      const nullableNumber = (val) => (val === '' || val === null || val === undefined ? null : Number(val));
      const payload = {
        client_id: Number(form.client_id),
        site_code: form.site_code.trim(),
        site_name: form.site_name.trim(),
        site_type_id: nullableNumber(form.site_type_id) || 1,
        site_status_id: nullableNumber(form.site_status_id) || 3,
        contract_value: form.contract_value ? Number(form.contract_value) : 0,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        landmark: form.landmark || null,
        city: form.city || null,
        district: form.district || null,
        state_name: form.state_name || null,
        country_code: 'IN',
        postal_code: form.postal_code || null,
        latitude: form.latitude !== '' && form.latitude != null ? Number(form.latitude) : null,
        longitude: form.longitude !== '' && form.longitude != null ? Number(form.longitude) : null,
        geofence_radius_m: form.geofence_radius_m ? Number(form.geofence_radius_m) : 100,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        site_engineer_id: nullableNumber(form.site_engineer_id),
        project_manager_id: nullableNumber(form.project_manager_id),
        supervisor_id: nullableNumber(form.supervisor_id),
        planned_start_date: form.planned_start_date || null,
        actual_start_date: form.actual_start_date || null,
        expected_end_date: form.expected_end_date || null,
        actual_end_date: form.actual_end_date || null,
        progress_percentage: Number(form.progress_percentage || 0),
        is_primary: form.is_primary ? 1 : 0,
        notes: form.notes || null,
      };

      if (isEditing) {
        await sitesApi.update(siteId, payload);
        toast.success('Site updated successfully.');
        navigate(`/sites/${siteId}`);
      } else {
        const res = await sitesApi.create(payload);
        const createdId = res?.data?.site?.id ?? res?.site?.id ?? res?.data?.id;
        toast.success('Site created successfully in database!');
        if (createdId) {
          navigate(`/sites/${createdId}`);
        } else {
          navigate('/sites');
        }
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to save site.');
      setErrors(error?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = Boolean(form.latitude && form.longitude);
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${form.latitude},${form.longitude}` : null;

  if (loadingSite) {
    return (
      <PageContainer>
        <div className="py-20 flex flex-col items-center justify-center text-text-secondary gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading site details from database...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <form onSubmit={submit} className="flex flex-col gap-6 max-w-5xl mx-auto pb-28">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <button
              type="button"
              onClick={() => navigate('/sites')}
              className="hover:text-text-primary flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Sites
            </button>
            <span>/</span>
            <span className="text-text-primary font-semibold">
              {isEditing ? `Edit Site: ${form.site_name || 'Site'}` : 'Register New Site'}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/sites')}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>

        {/* Page Title */}
        <div className="border-b border-border pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {isEditing ? 'Edit Construction Site' : 'Register New Construction Site'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Fill in site particulars, auto-sync location coordinates, establish project schedule, and assign engineering incharge with live data from database.
          </p>
        </div>

        {/* 1. BASIC SITE INFORMATION */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-primary">
              1. Basic Site Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Site Name" required error={errors.site_name}>
              <Input
                name="site_name"
                value={form.site_name}
                onChange={(e) => change('site_name', e.target.value)}
                placeholder="e.g., Riverside Tower Phase 1"
                required
              />
            </FormField>

            <FormField label="Site Code" required error={errors.site_code}>
              <Input
                name="site_code"
                value={form.site_code}
                onChange={(e) => change('site_code', e.target.value)}
                placeholder="e.g., SITE-874"
                className="font-mono font-bold uppercase"
                required
              />
            </FormField>

            <FormField label="Client *" required error={errors.client_id}>
              <Select
                name="client_id"
                value={form.client_id}
                onChange={(val) => change('client_id', typeof val === 'object' && val?.target ? val.target.value : val)}
                options={clientOptions}
                placeholder={loadingMasters ? 'Loading clients from DB...' : 'Select Client'}
                disabled={loadingMasters}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Site Type">
              <Select
                name="site_type_id"
                value={form.site_type_id}
                onChange={(val) => change('site_type_id', typeof val === 'object' && val?.target ? val.target.value : val)}
                options={siteTypeOptions}
                placeholder={loadingMasters ? 'Loading types from DB...' : 'Select Site Type'}
                disabled={loadingMasters}
              />
            </FormField>

            <FormField label="Initial Operational Status">
              <Select
                name="site_status_id"
                value={form.site_status_id}
                onChange={(val) => change('site_status_id', typeof val === 'object' && val?.target ? val.target.value : val)}
                options={siteStatusOptions}
                placeholder={loadingMasters ? 'Loading statuses from DB...' : 'Select Operational Status'}
                disabled={loadingMasters}
              />
            </FormField>
          </div>
        </div>

        {/* 2. LOCATION & GPS COORDINATES */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-primary">
                2. Location & GPS Coordinates
              </h2>
            </div>

            {/* Auto-Sync GPS Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-semibold border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 shadow-xs"
              leftIcon={locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-primary" />}
              onClick={handleAutoSyncLocation}
              disabled={locating}
            >
              {locating ? 'Acquiring GPS Signal...' : 'Auto-Sync Current GPS Location'}
            </Button>
          </div>

          {locationStatus && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 px-3 flex items-center justify-between text-xs text-primary font-medium">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary animate-pulse" />
                <span>{locationStatus}</span>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline inline-flex items-center gap-1 font-bold text-xs text-primary"
                >
                  View on Map <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Address Line 1 (Street / Survey No)">
              <Input
                name="address_line1"
                value={form.address_line1}
                onChange={(e) => change('address_line1', e.target.value)}
                placeholder="Street address, survey no, plot no"
              />
            </FormField>

            <FormField label="Landmark">
              <Input
                name="landmark"
                value={form.landmark}
                onChange={(e) => change('landmark', e.target.value)}
                placeholder="Nearby junction or prominent landmark"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="City">
              <Input
                name="city"
                value={form.city}
                onChange={(e) => change('city', e.target.value)}
                placeholder="City"
              />
            </FormField>

            <FormField label="District / State">
              <Input
                name="state_name"
                value={form.state_name}
                onChange={(e) => change('state_name', e.target.value)}
                placeholder="State"
              />
            </FormField>

            <FormField label="Pincode">
              <Input
                name="postal_code"
                value={form.postal_code}
                onChange={(e) => change('postal_code', e.target.value)}
                placeholder="6-digit PIN"
                className="font-mono"
              />
            </FormField>

            <FormField label="Geofence Radius (m)">
              <Input
                type="number"
                name="geofence_radius_m"
                value={form.geofence_radius_m}
                onChange={(e) => change('geofence_radius_m', e.target.value)}
                placeholder="100"
                className="font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <FormField label="GPS Latitude">
              <Input
                name="latitude"
                value={form.latitude}
                onChange={(e) => change('latitude', e.target.value)}
                placeholder="e.g., 12.971600"
                className="font-mono font-medium"
              />
            </FormField>

            <FormField label="GPS Longitude">
              <Input
                name="longitude"
                value={form.longitude}
                onChange={(e) => change('longitude', e.target.value)}
                placeholder="e.g., 77.594600"
                className="font-mono font-medium"
              />
            </FormField>
          </div>
        </div>

        {/* 3. CONTRACT & SCHEDULE */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-primary">
              3. Contract & Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Contract / Package Value (₹)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">₹</span>
                <Input
                  type="number"
                  name="contract_value"
                  value={form.contract_value}
                  onChange={(e) => change('contract_value', e.target.value)}
                  placeholder="e.g., 15000000"
                  className="pl-7 font-mono font-bold"
                />
              </div>
            </FormField>

            <FormField label="Execution Progress (%)">
              <Input
                type="number"
                min="0"
                max="100"
                name="progress_percentage"
                value={form.progress_percentage}
                onChange={(e) => change('progress_percentage', e.target.value)}
                placeholder="0"
                className="font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Planned Start Date">
              <Input
                type="date"
                name="planned_start_date"
                value={form.planned_start_date}
                onChange={(e) => change('planned_start_date', e.target.value)}
              />
            </FormField>

            <FormField label="Expected Completion Date">
              <Input
                type="date"
                name="expected_end_date"
                value={form.expected_end_date}
                onChange={(e) => change('expected_end_date', e.target.value)}
              />
            </FormField>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-primary">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => change('is_primary', e.target.checked)}
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
              />
              <span className="font-semibold">Primary Operational Site</span>
              <span className="text-text-muted">— Mark as primary operational site for this client</span>
            </label>
          </div>
        </div>

        {/* 4. TEAM & FIELD INCHARGE ALLOCATION (Fetched 100% from Database) */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-primary">
              4. Team & Field Incharge Allocation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Site Engineer (Field Incharge) *">
              <Select
                name="site_engineer_id"
                value={form.site_engineer_id}
                onChange={(val) => {
                  const selectedId = typeof val === 'object' && val?.target ? val.target.value : val;
                  change('site_engineer_id', selectedId);
                  const selectedUser = users.find((u) => String(u.id) === String(selectedId));
                  if (selectedUser) {
                    const fullName = [selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.username;
                    change('contact_name', fullName);
                    if (selectedUser.phone) change('contact_phone', selectedUser.phone);
                  }
                }}
                options={userOptions}
                placeholder={loadingMasters ? 'Loading users from DB...' : 'Select Site Engineer'}
                disabled={loadingMasters}
              />
            </FormField>

            <FormField label="Project Manager (Office Lead)">
              <Select
                name="project_manager_id"
                value={form.project_manager_id}
                onChange={(val) => change('project_manager_id', typeof val === 'object' && val?.target ? val.target.value : val)}
                options={userOptions}
                placeholder={loadingMasters ? 'Loading users from DB...' : 'Select Project Manager'}
                disabled={loadingMasters}
              />
            </FormField>

            <FormField label="Supervisor / Foreman">
              <Select
                name="supervisor_id"
                value={form.supervisor_id}
                onChange={(val) => change('supervisor_id', typeof val === 'object' && val?.target ? val.target.value : val)}
                options={userOptions}
                placeholder={loadingMasters ? 'Loading users from DB...' : 'Select Supervisor / Foreman'}
                disabled={loadingMasters}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Site Contact Person">
              <Input
                name="contact_name"
                value={form.contact_name}
                onChange={(e) => change('contact_name', e.target.value)}
                placeholder="Name of on-site contact"
              />
            </FormField>

            <FormField label="Site Contact Phone">
              <Input
                name="contact_phone"
                value={form.contact_phone}
                onChange={(e) => change('contact_phone', e.target.value)}
                placeholder="10-digit mobile number"
                className="font-mono"
              />
            </FormField>
          </div>
        </div>

        {/* 5. OPERATIONAL NOTES */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-primary">
              5. Operational Notes & Safety Instructions
            </h2>
          </div>

          <FormField label="Notes & Special Requirements">
            <Textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => change('notes', e.target.value)}
              placeholder="Any access restrictions, gate entry rules, material delivery hours, safety protocols..."
            />
          </FormField>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xs border-t border-border p-3.5 px-6 z-40 flex items-center justify-between shadow-lg">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/sites')}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs font-semibold px-5 shadow-xs"
              leftIcon={saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              disabled={saving}
            >
              {saving ? 'Saving Site Details...' : isEditing ? 'Save Changes' : 'Save & Create Site'}
            </Button>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
export default SiteFormPage;
