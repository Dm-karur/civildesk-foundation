import { useState } from 'react';
import { Shield, Key, Edit, Trash2, CheckCircle2, XCircle, Settings2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';

export function RolesListTable({ roles, loading, onSelectRoleForPermissions, onEditRole, onDeleteRole }) {
  return (
    <DataTableContainer>
      <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed border-collapse">
        <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
          <tr>
            <th className="px-2 py-1.5 w-10 text-center">#</th>
            <th className="px-3 py-1.5 w-32">Role Code</th>
            <th className="px-3 py-1.5 w-48">Role Name</th>
            <th className="px-3 py-1.5 w-64">Description</th>
            <th className="px-2 py-1.5 text-center w-24">Status</th>
            <th className="px-2 py-1.5 text-center w-40">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-text-muted text-[12px]">
                Loading system roles from database...
              </td>
            </tr>
          ) : roles.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-text-muted text-[12px]">
                No roles found in database.
              </td>
            </tr>
          ) : (
            roles.map((role, index) => {
              const code = role.role_code || role.code || `ROLE-${role.id}`;
              const name = role.role_name || role.name || 'Role';
              const description = role.description || '—';
              const isActive = role.is_active === 1 || role.is_active === '1' || role.is_active === true || role.is_active === undefined;
              const isSuper = role.id === 1 || code === 'ADMIN';

              return (
                <tr key={role.id || index} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-2 py-1.5 text-center font-mono text-[11px] text-text-muted">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-text-primary text-[11px]">
                    {code}
                  </td>
                  <td className="px-3 py-1.5 font-medium text-text-primary text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-text-secondary text-[11px] truncate" title={description}>
                    {description}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Badge
                      variant={isActive ? 'success' : 'neutral'}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1 inline-flex items-center gap-0.5 leading-none"
                    >
                      {isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      <span>{isActive ? 'Active' : 'Inactive'}</span>
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectRoleForPermissions(role)}
                        className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
                        title="Configure Module Permissions"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Permissions</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRole(role)}
                        className="h-6 w-6 p-0 text-text-secondary hover:text-primary"
                        title="Edit Role"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {!isSuper && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteRole(role.id, name)}
                          className="h-6 w-6 p-0 text-text-secondary hover:text-error"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </DataTableContainer>
  );
}
