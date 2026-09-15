import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, UserCheck, Shield, Plus, Edit, Trash2, Search, Briefcase,
  MapPin, Star, UserPlus, Calendar, Activity, Layers, CheckCircle2
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
import { sitesApi, projectsApi, usersApi, mastersApi } from '../../../api/apiservice';

const EMPTY_MEMBER_FORM = {
  project_id: '',
  site_id: '',
  user_id: '',
  team_role_id: '',
  responsibility: '',
  assignment_start: '',
  assignment_end: '',
  is_primary: false,
  can_approve: false,
  is_active: true,
};

const DEFAULT_SITE_TEAM_ROLES = [
  { id: 1, name: 'Project Manager', code: 'PROJECT_MANAGER' },
  { id: 2, name: 'Site Engineer', code: 'SITE_ENGINEER' },
  { id: 3, name: 'Supervisor', code: 'SUPERVISOR' },
  { id: 4, name: 'Planning Engineer', code: 'PLANNING_ENGINEER' },
  { id: 5, name: 'Quantity Surveyor', code: 'QUANTITY_SURVEYOR' },
  { id: 6, name: 'Safety Officer', code: 'SAFETY_OFFICER' },
  { id: 7, name: 'Store Keeper', code: 'STORE_KEEPER' },
  { id: 8, name: 'Accounts', code: 'ACCOUNTS' },
  { id: 9, name: 'Viewer', code: 'VIEWER' },
  { id: 10, name: 'Other', code: 'OTHER' },
];

export function SiteTeamPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [teamMembers, setTeamMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamRoles, setTeamRoles] = useState(DEFAULT_SITE_TEAM_ROLES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteMember, setDeleteMember] = useState(null);
  const [form, setForm] = useState(EMPTY_MEMBER_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initial Load
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      sitesApi.list().catch(() => ({ data: { sites: [] } })),
      usersApi.list().catch(() => ({ data: { users: [] } })),
      mastersApi.all().catch(() => ({ data: {} })),
    ]).then(([pRes, sRes, uRes, mRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const sList = sRes?.data?.sites ?? sRes?.sites ?? (Array.isArray(sRes?.data) ? sRes.data : []);
      const uList = uRes?.data?.users ?? uRes?.users ?? (Array.isArray(uRes?.data) ? uRes.data : []);
      const rolesList = mRes?.data?.project_team_roles ?? mRes?.data?.team_roles ?? mRes?.project_team_roles ?? [];

      setProjects(Array.isArray(pList) ? pList : []);
      setSites(Array.isArray(sList) ? sList : []);
      setUsers(Array.isArray(uList) ? uList : []);
      if (Array.isArray(rolesList) && rolesList.length > 0) {
        setTeamRoles(rolesList.map(r => ({
          ...r,
          name: r.name || r.role_name || r.code || `Role #${r.id}`,
          role_name: r.role_name || r.name || r.code,
        })));
      }
    });
  }, []);

  // Fetch Team Members
  const fetchSiteTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedSiteId !== 'all') {
        const res = await sitesApi.teamMembers.list(Number(selectedSiteId));
        const list = res?.data?.team_members ?? res?.data?.data ?? [];
        setTeamMembers(Array.isArray(list) ? list : []);
      } else {
        const targetSites = sites.filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId));
        const promises = targetSites.map(s =>
          sitesApi.teamMembers.list(s.id).then(r => (r?.data?.team_members ?? []).map(m => ({ ...m, site_name: s.site_name, project_code: s.project_code }))).catch(() => [])
        );
        const results = await Promise.all(promises);
        setTeamMembers(results.flat());
      }
    } catch {
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedSiteId, sites]);

  useEffect(() => {
    if (sites.length > 0) {
      fetchSiteTeamMembers();
    } else {
      setLoading(false);
    }
  }, [selectedProjectId, selectedSiteId, sites, fetchSiteTeamMembers]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = selectedSiteId !== 'all' ? selectedSiteId : (availableSites[0]?.id ? String(availableSites[0].id) : (sites[0]?.id ? String(sites[0].id) : '1'));

    setForm({
      ...EMPTY_MEMBER_FORM,
      project_id: defaultProj,
      site_id: defaultSite,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (member) => {
    setForm({
      project_id: String(member.project_id || ''),
      site_id: String(member.site_id || ''),
      user_id: String(member.user_id || ''),
      team_role_id: String(member.team_role_id || ''),
      responsibility: member.responsibility || '',
      assignment_start: member.assignment_start ? member.assignment_start.split(' ')[0] : '',
      assignment_end: member.assignment_end ? member.assignment_end.split(' ')[0] : '',
      is_primary: Boolean(member.is_primary),
      can_approve: Boolean(member.can_approve),
      is_active: member.is_active !== undefined ? Boolean(member.is_active) : true,
    });
    setErrors({});
    setEditingMember(member);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.site_id) errs.site_id = 'Site is required';
    if (!form.user_id) errs.user_id = 'User is required';
    if (!form.team_role_id) errs.team_role_id = 'Role is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_id: Number(form.project_id || 1),
        site_id: Number(form.site_id),
        user_id: Number(form.user_id),
        team_role_id: Number(form.team_role_id),
        responsibility: form.responsibility || null,
        assignment_start: form.assignment_start || null,
        assignment_end: form.assignment_end || null,
        is_primary: form.is_primary ? 1 : 0,
        can_approve: form.can_approve ? 1 : 0,
        is_active: form.is_active ? 1 : 0,
      };

      if (editingMember?.id) {
        await sitesApi.teamMembers.update(payload.site_id, editingMember.id, payload);
        toast.success('Site team assignment updated.');
      } else {
        await sitesApi.teamMembers.create(payload.site_id, payload);
        toast.success('Site team member assigned successfully.');
      }

      setIsAddOpen(false);
      setEditingMember(null);
      fetchSiteTeamMembers();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Failed to save site team member.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMember?.id) return;
    try {
      await sitesApi.teamMembers.remove(deleteMember.site_id, deleteMember.id);
      toast.success('Member removed from site.');
      setDeleteMember(null);
      fetchSiteTeamMembers();
    } catch (err) {
      toast.error(err?.message || 'Failed to remove site member.');
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return teamMembers.filter(m => {
      if (search) {
        const q = search.toLowerCase();
        const name = `${m.first_name || ''} ${m.last_name || ''} ${m.name || ''}`.toLowerCase();
        const role = (m.role_name || m.team_role_name || '').toLowerCase();
        const sName = (m.site_name || '').toLowerCase();
        const resp = (m.responsibility || '').toLowerCase();
        if (!name.includes(q) && !role.includes(q) && !sName.includes(q) && !resp.includes(q)) return false;
      }
      if (roleFilter !== 'all' && String(m.team_role_id) !== String(roleFilter)) return false;
      return true;
    });
  }, [teamMembers, search, roleFilter]);

  // Metrics
  const primaryLeads = useMemo(() => teamMembers.filter(m => m.is_primary).length, [teamMembers]);
  const approversCount = useMemo(() => teamMembers.filter(m => m.can_approve).length, [teamMembers]);
  const uniquePersonnel = useMemo(() => new Set(teamMembers.map(m => m.user_id)).size, [teamMembers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites & Locations', href: '/sites' },
    { label: 'Site Team Assignment' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Team Assignment"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Site Assignments"
            value={teamMembers.length}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Unique Site Staff"
            value={uniquePersonnel}
            status="info"
            icon={<UserCheck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Primary Site Incharges"
            value={primaryLeads}
            status="success"
            icon={<Star className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Site Approvers"
            value={approversCount}
            status="neutral"
            icon={<Shield className="w-4 h-4 text-emerald-500" />}
          />
        </div>

        {/* Filter and Site Selector Bar */}
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
                  { value: 'all', label: 'All Sites (Consolidated)' },
                  ...sites
                    .filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId))
                    .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))
                ]}
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <SearchField
                placeholder="Search staff, role, site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Roles' },
                  ...teamRoles.map(r => ({ value: String(r.id), label: r.name || r.role_name }))
                ]}
                value={roleFilter}
                onChange={setRoleFilter}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Assign Staff
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
                  <th className="px-3 py-2">Site Staff</th>
                  <th className="px-3 py-2">Site Role & Authority</th>
                  <th className="px-3 py-2 hidden md:table-cell">Assigned Site</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Responsibility</th>
                  <th className="px-3 py-2 hidden md:table-cell">Assignment Period</th>
                  <th className="px-3 py-2 text-center w-20">Status</th>
                  <th className="px-3 py-2 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site staff assignments...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No staff assigned to this site selection.
                    </td>
                  </tr>
                ) : (
                  paged.map((member, idx) => {
                    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Staff Member';
                    const roleName = member.role_name || member.team_role_name || 'Site Staff';
                    const siteName = member.site_name || sites.find(s => s.id === member.site_id)?.site_name || '—';
                    const startDate = member.assignment_start ? member.assignment_start.split(' ')[0] : '—';
                    const endDate = member.assignment_end ? member.assignment_end.split(' ')[0] : 'Ongoing';

                    return (
                      <tr key={member.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
                              {memberName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-text-primary text-[12px] truncate">
                                {memberName}
                              </span>
                              <span className="text-[10px] text-text-muted truncate">
                                {member.email || member.phone || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-semibold text-text-primary text-[11px]">
                              {roleName}
                            </span>
                            <div className="flex items-center gap-1">
                              {member.is_primary === 1 && (
                                <Badge variant="warning" className="text-[8px] h-3.5 px-1 font-bold inline-flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Incharge
                                </Badge>
                              )}
                              {member.can_approve === 1 && (
                                <Badge variant="info" className="text-[8px] h-3.5 px-1 font-bold inline-flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> Approver
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-text-primary text-[11px] font-medium truncate block" title={siteName}>
                            {siteName}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <span className="text-text-secondary text-[11px] line-clamp-1" title={member.responsibility}>
                            {member.responsibility || 'General site supervision & execution'}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary">
                          {startDate} → {endDate}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={member.is_active ? 'success' : 'neutral'}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Site Assignment"
                              onClick={() => handleOpenEdit(member)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Remove Staff"
                              onClick={() => setDeleteMember(member)}
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
              Loading site staff assignments...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No staff assigned.
            </div>
          ) : (
            paged.map((member, idx) => {
              const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Staff Member';
              const roleName = member.role_name || member.team_role_name || 'Site Staff';
              const siteName = member.site_name || sites.find(s => s.id === member.site_id)?.site_name || '—';

              return (
                <div key={member.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {memberName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary text-[13px]">{memberName}</h4>
                        <span className="text-[11px] text-text-secondary font-medium">{roleName}</span>
                      </div>
                    </div>
                    <Badge
                      variant={member.is_active ? 'success' : 'neutral'}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="text-xs pt-1 border-t border-border/60">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Site</span>
                    <span className="font-medium text-text-primary text-[11px] truncate block">{siteName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[10px] text-text-muted font-mono">{member.assignment_start ? member.assignment_start.split(' ')[0] : '—'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(member)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteMember(member)}>
                        <Trash2 className="w-3.5 h-3.5 text-error" />
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

      {/* Add / Edit Site Member Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingMember)}
        onClose={() => { setIsAddOpen(false); setEditingMember(null); }}
      >
        <EntityEditModal.Header
          icon={Users}
          title={editingMember ? 'Edit Site Staff Assignment' : 'Assign Site Staff'}
          subtitle="Configure engineer, supervisor, and site inspection authorities."
          onClose={() => { setIsAddOpen(false); setEditingMember(null); }}
        />
        <form id="site-team-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Assignment Mapping">
              <EntityEditModal.Grid>
                <FormField label="Target Project" required error={errors.project_id}>
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

                <FormField label="Target Site" required error={errors.site_id}>
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                  />
                </FormField>

                <FormField label="Staff Member (User)" required error={errors.user_id}>
                  <Select
                    options={users.map(u => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''} (${u.email || u.username})` }))}
                    value={form.user_id}
                    onChange={(v) => handleFormChange('user_id', v)}
                  />
                </FormField>

                <FormField label="Site Role" required error={errors.team_role_id}>
                  <Select
                    options={teamRoles.map(r => ({ value: String(r.id), label: r.name || r.role_name }))}
                    value={form.team_role_id}
                    onChange={(v) => handleFormChange('team_role_id', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Timeline & Responsibility">
              <EntityEditModal.Grid>
                <FormField label="Assignment Start Date">
                  <Input
                    type="date"
                    value={form.assignment_start}
                    onChange={(e) => handleFormChange('assignment_start', e.target.value)}
                  />
                </FormField>

                <FormField label="Assignment End Date">
                  <Input
                    type="date"
                    value={form.assignment_end}
                    onChange={(e) => handleFormChange('assignment_end', e.target.value)}
                  />
                </FormField>

                <FormField label="Specific Site Responsibility" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.responsibility}
                    onChange={(e) => handleFormChange('responsibility', e.target.value)}
                    placeholder="e.g. Lead site engineer in-charge of Raft concrete pouring and daily labour attendance..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Authority Flags">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={form.is_primary}
                    onChange={(e) => handleFormChange('is_primary', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Primary Site Incharge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={form.can_approve}
                    onChange={(e) => handleFormChange('can_approve', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Site Approval Authority</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-primary">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Active Assignment</span>
                </label>
              </div>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="site-team-form"
            submitLabel={editingMember ? 'Update Assignment' : 'Assign to Site'}
            onCancel={() => { setIsAddOpen(false); setEditingMember(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteMember)}
        title="Remove Staff Assignment"
        message="Are you sure you want to remove this staff assignment from the site?"
        variant="danger"
        confirmLabel="Remove Assignment"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteMember(null)}
      />
    </PageContainer>
  );
}
