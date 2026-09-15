import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { permissionsApi, rolesApi } from '../../../api/apiservice';
import { PageContainer, PageHeader } from '../../../components/layout';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { toast } from '../../../components/composite/Toast';
import { useAuth } from '../../auth/context/AuthContext';

const extractRoles = (response) => response?.data?.roles ?? [];
const extractPermissions = (response) => response?.data?.permissions ?? [];

export function PermissionsPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([rolesApi.list(), permissionsApi.list()])
      .then(([roleResponse, permissionResponse]) => {
        if (!active) return;
        const roleList = extractRoles(roleResponse);
        setRoles(roleList);
        setCatalogue(extractPermissions(permissionResponse));
        setRoleId(roleList[0] ? String(roleList[0].id) : '');
      })
      .catch((requestError) => active && setError(requestError.message || 'Unable to load permissions.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const loadRole = useCallback(async (id) => {
    if (!id) {
      setSelectedIds(new Set());
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await rolesApi.get(id);
      const assigned = response?.data?.role?.permissions ?? [];
      setSelectedIds(new Set(assigned.map((permission) => Number(permission.id))));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load the selected role.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRole(roleId);
  }, [loadRole, roleId]);

  const grouped = useMemo(() => catalogue.reduce((result, permission) => {
    const moduleCode = permission.module_code;
    if (!result[moduleCode]) result[moduleCode] = [];
    result[moduleCode].push(permission);
    return result;
  }, {}), [catalogue]);

  const togglePermission = (permissionId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await permissionsApi.updateRolePermissions(roleId, [...selectedIds].sort((a, b) => a - b));
      toast.success('Role permissions updated successfully.');
      await loadRole(roleId);
    } catch (requestError) {
      toast.error(requestError.message || 'Role permissions could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Roles & Permissions" description="Database-controlled access permissions." />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-sm border border-border bg-surface p-4">
          <div className="w-full max-w-sm">
            <label className="mb-1 block text-xs font-semibold text-text-secondary" htmlFor="role-select">Role</label>
            <Select
              id="role-select"
              value={roleId}
              onChange={setRoleId}
              options={roles.map((role) => ({ value: String(role.id), label: role.role_name }))}
              placeholder="Select a role"
            />
          </div>
          {hasPermission('role.manage_permissions') && (
            <Button onClick={save} disabled={!roleId || loading || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Permissions
            </Button>
          )}
        </div>

        {error && <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-text-muted"><Loader2 className="h-5 w-5 animate-spin" /> Loading permissions…</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(grouped).map(([moduleCode, permissions]) => (
              <section key={moduleCode} className="overflow-hidden rounded-sm border border-border bg-surface">
                <header className="flex items-center gap-2 border-b border-border bg-surface-muted px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-text-primary">{moduleCode.replaceAll('_', ' ')}</h2>
                </header>
                <div className="divide-y divide-border">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-surface-muted/40">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        disabled={!hasPermission('role.manage_permissions')}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-medium text-text-primary">{permission.permission_name}</span>
                        <span className="block text-xs text-text-muted">{permission.permission_code}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
