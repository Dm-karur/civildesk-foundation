import { useEffect, useState } from 'react';
import { X, MapPin, Users, Grid3x3, MapPinned, Plus, Trash2, Edit } from 'lucide-react';
import { sitesApi, siteZonesApi, workLocationsApi } from '../../../api/apiservice';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && (
        <span className="ml-1 bg-surface-muted text-text-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">{label}</span>
      <span className="text-[13px] text-text-primary">{value || '—'}</span>
    </div>
  );
}

function TeamMembersTab({ siteId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    sitesApi.teamMembers.list(siteId)
      .then((res) => setMembers(res?.data?.team_members ?? res?.data?.data ?? res?.team_members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-[12px]">Loading team members...</div>;
  if (members.length === 0) return <div className="py-8 text-center text-text-muted text-[12px]">No team members assigned to this site.</div>;

  return (
    <table className="w-full text-left text-[12px]">
      <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
        <tr>
          <th className="px-3 py-2 w-10">#</th>
          <th className="px-3 py-2">Name</th>
          <th className="px-3 py-2">Role</th>
          <th className="px-3 py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {members.map((m, i) => (
          <tr key={m.id || i} className="hover:bg-surface-muted/30">
            <td className="px-3 py-1.5 text-text-primary">{i + 1}</td>
            <td className="px-3 py-1.5 text-text-primary font-medium">{m.first_name || m.user_name || '—'} {m.last_name || ''}</td>
            <td className="px-3 py-1.5 text-text-secondary">{m.role_name || m.role || '—'}</td>
            <td className="px-3 py-1.5"><Badge variant={m.is_active ? 'success' : 'neutral'} className="text-[8px]">{m.is_active ? 'Active' : 'Inactive'}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function WorkZonesTab({ siteId }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    siteZonesApi.list({ site_id: siteId })
      .then((res) => setZones(res?.data?.zones ?? res?.data?.data ?? res?.zones ?? []))
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-[12px]">Loading work zones...</div>;
  if (zones.length === 0) return <div className="py-8 text-center text-text-muted text-[12px]">No work zones defined for this site.</div>;

  return (
    <table className="w-full text-left text-[12px]">
      <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
        <tr>
          <th className="px-3 py-2 w-10">#</th>
          <th className="px-3 py-2">Zone Code</th>
          <th className="px-3 py-2">Zone Name</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {zones.map((z, i) => (
          <tr key={z.id || i} className="hover:bg-surface-muted/30">
            <td className="px-3 py-1.5 text-text-primary">{i + 1}</td>
            <td className="px-3 py-1.5 font-mono font-semibold text-text-primary text-[11px]">{z.zone_code || '—'}</td>
            <td className="px-3 py-1.5 text-text-primary font-medium">{z.zone_name || z.name || '—'}</td>
            <td className="px-3 py-1.5 text-text-secondary">{z.zone_type || z.type_name || '—'}</td>
            <td className="px-3 py-1.5"><Badge variant={z.is_active ? 'success' : 'neutral'} className="text-[8px]">{z.status_name || (z.is_active ? 'Active' : 'Inactive')}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function WorkLocationsTab({ siteId }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    workLocationsApi.list({ site_id: siteId })
      .then((res) => setLocations(res?.data?.work_locations ?? res?.data?.data ?? res?.work_locations ?? []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-[12px]">Loading work locations...</div>;
  if (locations.length === 0) return <div className="py-8 text-center text-text-muted text-[12px]">No work locations defined for this site.</div>;

  return (
    <table className="w-full text-left text-[12px]">
      <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
        <tr>
          <th className="px-3 py-2 w-10">#</th>
          <th className="px-3 py-2">Location Code</th>
          <th className="px-3 py-2">Location Name</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {locations.map((loc, i) => (
          <tr key={loc.id || i} className="hover:bg-surface-muted/30">
            <td className="px-3 py-1.5 text-text-primary">{i + 1}</td>
            <td className="px-3 py-1.5 font-mono font-semibold text-text-primary text-[11px]">{loc.location_code || '—'}</td>
            <td className="px-3 py-1.5 text-text-primary font-medium">{loc.location_name || loc.name || '—'}</td>
            <td className="px-3 py-1.5 text-text-secondary">{loc.location_type || loc.type_name || '—'}</td>
            <td className="px-3 py-1.5"><Badge variant={loc.is_active ? 'success' : 'neutral'} className="text-[8px]">{loc.status_name || (loc.is_active ? 'Active' : 'Inactive')}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SiteDetailModal({ isOpen, site, onClose }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !site) return null;

  const status = site.status_name || site.status || 'Draft';
  const getStatusVariant = (s) => {
    const v = String(s).toLowerCase();
    if (v.includes('active') || v.includes('progress')) return 'success';
    if (v.includes('hold') || v.includes('pending')) return 'warning';
    if (v.includes('complete')) return 'info';
    return 'neutral';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-surface-muted/30 shrink-0">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary leading-none">{site.site_name || site.name}</h2>
                <Badge variant={getStatusVariant(status)} className="text-[8px] font-bold uppercase">{status}</Badge>
              </div>
              <p className="text-xs text-text-secondary leading-tight mt-1">{site.site_code || site.code} · {site.project_name || 'No project'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 overflow-x-auto">
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={MapPin} label="Details" />
          <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={Users} label="Team" />
          <TabButton active={activeTab === 'zones'} onClick={() => setActiveTab('zones')} icon={Grid3x3} label="Work Zones" />
          <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon={MapPinned} label="Locations" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <DetailRow label="Site Code" value={site.site_code || site.code} />
              <DetailRow label="Site Name" value={site.site_name || site.name} />
              <DetailRow label="Project" value={site.project_name || site.project} />
              <DetailRow label="Site Type" value={site.site_type || site.type_name} />
              <DetailRow label="Branch" value={site.branch_name} />
              <DetailRow label="Status" value={status} />
              <DetailRow label="Address" value={site.address} />
              <DetailRow label="City" value={site.city} />
              <DetailRow label="State" value={site.state} />
              <DetailRow label="Pincode" value={site.pincode} />
              <DetailRow label="Start Date" value={site.start_date ? site.start_date.split(' ')[0] : null} />
              <DetailRow label="Expected Completion" value={site.expected_completion_date ? site.expected_completion_date.split(' ')[0] : null} />
              {site.description && <div className="col-span-full"><DetailRow label="Description" value={site.description} /></div>}
            </div>
          )}
          {activeTab === 'team' && <TeamMembersTab siteId={site.id} />}
          {activeTab === 'zones' && <WorkZonesTab siteId={site.id} />}
          {activeTab === 'locations' && <WorkLocationsTab siteId={site.id} />}
        </div>
      </div>
    </div>
  );
}
