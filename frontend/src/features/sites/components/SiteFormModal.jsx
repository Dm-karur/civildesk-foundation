import { useEffect, useState } from 'react';
import { MapPin, Building2, User, Calendar, CheckSquare, FileText, DollarSign, Compass } from 'lucide-react';
import { sitesApi, clientsApi, mastersApi, usersApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

function extractList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.clients)) return res.data.clients;
  if (Array.isArray(res.data?.users)) return res.data.users;
  if (Array.isArray(res.clients)) return res.clients;
  if (Array.isArray(res.users)) return res.users;
  return [];
}

const EMPTY_FORM = {
  client_id: '',
  site_code: '',
  site_name: '',
  site_type_id: '1',
  site_status_id: '1',
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
  planned_start_date: '',
  actual_start_date: '',
  expected_end_date: '',
  actual_end_date: '',
  progress_percentage: '0',
  is_primary: false,
  notes: '',
};

export function SiteFormModal({ isOpen, site = null, onClose, onSaveSuccess }) {
  const isEditing = Boolean(site?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [masters, setMasters] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (site) {
      setForm({
        ...EMPTY_FORM,
        client_id: String(site.client_id ?? ''),
        site_code: site.site_code || '',
        site_name: site.site_name || '',
        site_type_id: String(site.site_type_id ?? '1'),
        site_status_id: String(site.site_status_id ?? '1'),
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
        geofence_radius_m: site.geofence_radius_m ? String(site.geofence_radius_m) : '100',
        contact_name: site.contact_name || '',
        contact_phone: site.contact_phone || '',
        site_engineer_id: String(site.site_engineer_id ?? ''),
        project_manager_id: String(site.project_manager_id ?? ''),
        supervisor_id: String(site.supervisor_id ?? ''),
        planned_start_date: (site.planned_start_date || site.start_date || '').split(' ')[0],
        actual_start_date: (site.actual_start_date || '').split(' ')[0],
        expected_end_date: (site.expected_end_date || site.expected_completion_date || '').split(' ')[0],
        actual_end_date: (site.actual_end_date || '').split(' ')[0],
        progress_percentage: String(site.progress_percentage ?? 0),
        is_primary: Boolean(site.is_primary),
        notes: site.notes || site.description || '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        site_code: `SITE-${Math.floor(Math.random() * 900 + 100)}`,
        planned_start_date: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});

    Promise.all([
      mastersApi.all().catch(() => ({ data: {} })),
      clientsApi.list().catch(() => ({ data: [] })),
      usersApi.list().catch(() => ({ data: [] })),
    ]).then(([masterRes, clientRes, userRes]) => {
      setMasters(masterRes?.data ?? masterRes ?? {});
      const cList = extractList(clientRes);
      const uList = extractList(userRes);
      setClients(cList);
      setUsers(uList);

      if (!site && cList.length > 0) {
        setForm((f) => ({
          ...f,
          client_id: String(cList[0].id),
        }));
      }
    });
  }, [isOpen, site]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!String(form.site_code ?? '').trim()) next.site_code = 'Site code is required.';
    if (!String(form.site_name ?? '').trim()) next.site_name = 'Site name is required.';
    if (!String(form.client_id ?? '').trim()) next.client_id = 'Client selection is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const nullableNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value));
      const payload = {
        client_id: Number(form.client_id),
        site_code: form.site_code.trim(),
        site_name: form.site_name.trim(),
        site_type_id: nullableNumber(form.site_type_id) || 1,
        site_status_id: nullableNumber(form.site_status_id) || 1,
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
        await sitesApi.update(site.id, payload);
        if (String(site.site_status_id) !== String(payload.site_status_id)) {
          await sitesApi.changeStatus(site.id, {
            site_status_id: payload.site_status_id,
            change_reason: 'Status updated via Site Register form',
          });
        }
        toast.success('Site updated successfully.');
      } else {
        await sitesApi.create(payload);
        toast.success('Site created successfully.');
      }

      onSaveSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Failed to save site.');
      setErrors(error?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const userOptions = [
    { value: '', label: 'Select Assigned Staff...' },
    ...users.map((u) => ({
      value: String(u.id),
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.employee_code || `User #${u.id}`,
    })),
  ];

  const clientOptions = [
    { value: '', label: 'Select Client...' },
    ...clients.map((c) => ({
      value: String(c.id),
      label: c.client_name || c.name || `Client #${c.id}`,
    })),
  ];

  return (
    <EntityEditModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Construction Site' : 'Create Construction Site'}
      isSubmitting={saving}
      onSubmit={submit}
      submitLabel={isEditing ? 'Update Site' : 'Create Site'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 py-1">
        {/* Section 1: Basic Information */}
        <div className="bg-surface-subtle/50 border border-border/80 rounded-lg p-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-text-primary">
            <Building2 className="w-4 h-4 text-primary" />
            <span>1. Basic Site Information</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Site Name *" error={errors.site_name}>
              <Input
                value={form.site_name}
                onChange={(e) => change('site_name', e.target.value)}
                placeholder="e.g., Riverside Tower Phase 1"
                className="text-xs"
              />
            </FormField>
            <FormField label="Site Code *" error={errors.site_code}>
              <Input
                value={form.site_code}
                onChange={(e) => change('site_code', e.target.value.toUpperCase())}
                placeholder="e.g., SITE-001"
                className="text-xs font-mono"
              />
            </FormField>
            <FormField label="Client *" error={errors.client_id}>
              <Select
                options={clientOptions}
                value={form.client_id}
                onChange={(val) => change('client_id', val)}
                className="text-xs"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Site Type">
              <Select
                options={(masters.site_types ?? []).map((t) => ({
                  value: String(t.id),
                  label: t.type_name || t.name,
                }))}
                value={form.site_type_id}
                onChange={(val) => change('site_type_id', val)}
                className="text-xs"
              />
            </FormField>
            <FormField label="Initial Status">
              <Select
                options={(masters.site_statuses ?? []).map((s) => ({
                  value: String(s.id),
                  label: s.status_name || s.name,
                }))}
                value={form.site_status_id}
                onChange={(val) => change('site_status_id', val)}
                className="text-xs"
              />
            </FormField>
          </div>
        </div>

        {/* Section 2: Location & GPS */}
        <div className="bg-surface-subtle/50 border border-border/80 rounded-lg p-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-text-primary">
            <MapPin className="w-4 h-4 text-primary" />
            <span>2. Location & GPS Coordinates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Address Line 1">
              <Input
                value={form.address_line1}
                onChange={(e) => change('address_line1', e.target.value)}
                placeholder="Street address, survey no, plot no"
                className="text-xs"
              />
            </FormField>
            <FormField label="Landmark">
              <Input
                value={form.landmark}
                onChange={(e) => change('landmark', e.target.value)}
                placeholder="Nearby landmark"
                className="text-xs"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FormField label="City">
              <Input
                value={form.city}
                onChange={(e) => change('city', e.target.value)}
                placeholder="City"
                className="text-xs"
              />
            </FormField>
            <FormField label="District / State">
              <Input
                value={form.state_name}
                onChange={(e) => change('state_name', e.target.value)}
                placeholder="State"
                className="text-xs"
              />
            </FormField>
            <FormField label="Pincode">
              <Input
                value={form.postal_code}
                onChange={(e) => change('postal_code', e.target.value)}
                placeholder="6-digit PIN"
                className="text-xs"
              />
            </FormField>
            <FormField label="Geofence Radius (m)">
              <Input
                type="number"
                value={form.geofence_radius_m}
                onChange={(e) => change('geofence_radius_m', e.target.value)}
                placeholder="100"
                className="text-xs"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="GPS Latitude">
              <Input
                value={form.latitude}
                onChange={(e) => change('latitude', e.target.value)}
                placeholder="e.g., 12.9716"
                className="text-xs font-mono"
              />
            </FormField>
            <FormField label="GPS Longitude">
              <Input
                value={form.longitude}
                onChange={(e) => change('longitude', e.target.value)}
                placeholder="e.g., 77.5946"
                className="text-xs font-mono"
              />
            </FormField>
          </div>
        </div>

        {/* Section 3: Contract & Schedule */}
        <div className="bg-surface-subtle/50 border border-border/80 rounded-lg p-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-text-primary">
            <Calendar className="w-4 h-4 text-primary" />
            <span>3. Contract & Schedule</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Contract Value (₹)">
              <Input
                type="number"
                value={form.contract_value}
                onChange={(e) => change('contract_value', e.target.value)}
                placeholder="e.g., 5000000"
                className="text-xs font-mono"
              />
            </FormField>
            <FormField label="Planned Start Date">
              <Input
                type="date"
                value={form.planned_start_date}
                onChange={(e) => change('planned_start_date', e.target.value)}
                className="text-xs"
              />
            </FormField>
            <FormField label="Expected Completion Date">
              <Input
                type="date"
                value={form.expected_end_date}
                onChange={(e) => change('expected_end_date', e.target.value)}
                className="text-xs"
              />
            </FormField>
          </div>
        </div>

        {/* Section 4: Team Allocation */}
        <div className="bg-surface-subtle/50 border border-border/80 rounded-lg p-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-text-primary">
            <User className="w-4 h-4 text-primary" />
            <span>4. Site Management Team</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Site Engineer / Incharge">
              <Select
                options={userOptions}
                value={form.site_engineer_id}
                onChange={(val) => change('site_engineer_id', val)}
                className="text-xs"
              />
            </FormField>
            <FormField label="Project Manager / Director">
              <Select
                options={userOptions}
                value={form.project_manager_id}
                onChange={(val) => change('project_manager_id', val)}
                className="text-xs"
              />
            </FormField>
            <FormField label="Site Supervisor">
              <Select
                options={userOptions}
                value={form.supervisor_id}
                onChange={(val) => change('supervisor_id', val)}
                className="text-xs"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Site Contact Person">
              <Input
                value={form.contact_name}
                onChange={(e) => change('contact_name', e.target.value)}
                placeholder="Field lead or contact name"
                className="text-xs"
              />
            </FormField>
            <FormField label="Contact Phone">
              <Input
                value={form.contact_phone}
                onChange={(e) => change('contact_phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="text-xs"
              />
            </FormField>
          </div>
        </div>

        {/* Section 5: Notes */}
        <div className="bg-surface-subtle/50 border border-border/80 rounded-lg p-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-text-primary">
            <FileText className="w-4 h-4 text-primary" />
            <span>5. Operational Notes</span>
          </div>
          <FormField label="Site Description / Work Scope Notes">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => change('notes', e.target.value)}
              placeholder="Scope of work, key deliverables, special site conditions..."
              className="text-xs"
            />
          </FormField>
        </div>
      </form>
    </EntityEditModal>
  );
}
