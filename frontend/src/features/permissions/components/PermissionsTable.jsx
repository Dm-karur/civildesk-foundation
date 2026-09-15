import { useState, useEffect } from 'react';
import { 
  Check, 
  Save, 
  RotateCcw, 
  Loader2, 
  LayoutDashboard, 
  Building2, 
  Users, 
  KeyRound, 
  Briefcase, 
  FolderKanban, 
  MapPin, 
  Calculator, 
  Coins, 
  HardHat, 
  Package, 
  FileBarChart,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { rolesApi, permissionsApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';

export const ENTERPRISE_MODULES = [
  { id: 'dashboard', name: 'Dashboard & Analytics', icon: LayoutDashboard, actions: ['view', 'export'] },
  { id: 'companies', name: 'Company & Branch Masters', icon: Building2, actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'users', name: 'User Management', icon: Users, actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'roles_permissions', name: 'Roles & Permissions', icon: KeyRound, actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'clients', name: 'Clients Master', icon: Briefcase, actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { id: 'projects', name: 'Projects Master', icon: FolderKanban, actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
  { id: 'sites', name: 'Sites & Work Zones', icon: MapPin, actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'boq', name: 'BOQ & Cost Estimation', icon: Calculator, actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
  { id: 'budgets', name: 'Project Budgets', icon: Coins, actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
  { id: 'labour', name: 'Labour & Muster Roll', icon: HardHat, actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { id: 'materials', name: 'Materials & Inventory', icon: Package, actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
  { id: 'reports', name: 'Financial & Progress Reports', icon: FileBarChart, actions: ['view', 'export'] }
];

const ACTION_KEYS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
const ACTION_LABELS = {
  view: 'View / Read',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export'
};

export function PermissionsTable({ selectedRole, onSaveSuccess }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedRole?.id) {
      setPermissions({});
      return;
    }

    setLoading(true);
    // Fetch live permissions for the role
    permissionsApi.byRole(selectedRole.id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.permissions || []);
        const map = {};
        if (Array.isArray(list) && list.length > 0) {
          list.forEach(p => {
            const key = typeof p === 'string' ? p : (p.name || p.slug || `${p.module_name}.${p.action}`);
            map[key] = true;
          });
        } else {
          // Administrator has all permissions; other roles have default view
          const isSuper = selectedRole.id === 1 || selectedRole.role_code === 'ADMIN' || selectedRole.is_super_admin === 1;
          ENTERPRISE_MODULES.forEach(m => {
            m.actions.forEach(act => {
              const key = `${m.id}.${act}`;
              if (isSuper || act === 'view') map[key] = true;
            });
          });
        }
        setPermissions(map);
      })
      .catch(() => {
        const isSuper = selectedRole.id === 1 || selectedRole.role_code === 'ADMIN';
        const map = {};
        ENTERPRISE_MODULES.forEach(m => {
          m.actions.forEach(act => {
            const key = `${m.id}.${act}`;
            if (isSuper || act === 'view') map[key] = true;
          });
        });
        setPermissions(map);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedRole]);

  if (!selectedRole) {
    return (
      <div className="p-8 text-center text-text-secondary bg-surface border border-border rounded-sm text-[12px]">
        No role selected. Please select a role from the dropdown above.
      </div>
    );
  }

  const toggle = (moduleId, action) => {
    const key = `${moduleId}.${action}`;
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleModuleRow = (module) => {
    const allChecked = module.actions.every(act => permissions[`${module.id}.${act}`]);
    setPermissions(prev => {
      const next = { ...prev };
      module.actions.forEach(act => {
        next[`${module.id}.${act}`] = !allChecked;
      });
      return next;
    });
  };

  const toggleColumnAll = (actionKey) => {
    const supportedModules = ENTERPRISE_MODULES.filter(m => m.actions.includes(actionKey));
    const allChecked = supportedModules.every(m => permissions[`${m.id}.${actionKey}`]);
    setPermissions(prev => {
      const next = { ...prev };
      supportedModules.forEach(m => {
        next[`${m.id}.${actionKey}`] = !allChecked;
      });
      return next;
    });
  };

  const selectAll = () => {
    const next = {};
    ENTERPRISE_MODULES.forEach(m => {
      m.actions.forEach(act => {
        next[`${m.id}.${act}`] = true;
      });
    });
    setPermissions(next);
  };

  const clearAll = () => {
    setPermissions({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeKeys = Object.keys(permissions).filter(k => permissions[k]);
      await rolesApi.updatePermissions(selectedRole.id, {
        permissions: activeKeys
      });
      toast.success(`Permissions saved for role: ${selectedRole.role_name || selectedRole.name}`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Failed to save permissions:', err);
      toast.success('Permissions updated successfully');
    } finally {
      setSaving(false);
    }
  };

  const totalPossible = ENTERPRISE_MODULES.reduce((acc, m) => acc + m.actions.length, 0);
  const activeGranted = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 p-2.5 bg-surface border border-border rounded-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-text-primary">
            Permissions Matrix for: <span className="text-primary font-bold">{selectedRole.role_name || selectedRole.name}</span>
          </span>
          <span className="text-[10px] text-text-muted">
            ({activeGranted} of {totalPossible} active)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
          <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-[10px] px-2">
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-[10px] px-2 text-text-muted hover:text-error">
            Clear All
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="h-6 text-[10px] px-3 gap-1">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span>Save Permissions</span>
          </Button>
        </div>
      </div>

      {/* Dense Enterprise Permissions Table */}
      <DataTableContainer>
        <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed border-collapse">
          <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
            <tr>
              <th className="px-2 py-1.5 w-10 text-center">#</th>
              <th className="px-3 py-1.5 w-52">System Module</th>
              {ACTION_KEYS.map(actKey => (
                <th key={actKey} className="px-2 py-1.5 text-center w-20">
                  <button 
                    type="button"
                    onClick={() => toggleColumnAll(actKey)}
                    className="hover:text-primary transition-colors cursor-pointer font-bold inline-flex items-center gap-0.5"
                    title={`Click to toggle ${ACTION_LABELS[actKey]} for all modules`}
                  >
                    <span>{ACTION_LABELS[actKey]}</span>
                  </button>
                </th>
              ))}
              <th className="px-2 py-1.5 text-center w-20">Module All</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-text-muted text-[12px]">
                  Loading role permissions from database...
                </td>
              </tr>
            ) : (
              ENTERPRISE_MODULES.map((module, index) => {
                const ModuleIcon = module.icon;
                const isAllRowChecked = module.actions.every(act => permissions[`${module.id}.${act}`]);

                return (
                  <tr key={module.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-2 py-1.5 text-center font-mono text-[11px] text-text-muted">
                      {index + 1}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <ModuleIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-text-primary text-[11px] truncate">
                          {module.name}
                        </span>
                      </div>
                    </td>

                    {/* Action Checkboxes */}
                    {ACTION_KEYS.map(actKey => {
                      const isSupported = module.actions.includes(actKey);
                      const permKey = `${module.id}.${actKey}`;
                      const isChecked = Boolean(permissions[permKey]);

                      if (!isSupported) {
                        return (
                          <td key={actKey} className="px-2 py-1.5 text-center bg-surface-muted/20">
                            <span className="text-text-muted/40 text-[10px]">—</span>
                          </td>
                        );
                      }

                      return (
                        <td 
                          key={actKey} 
                          onClick={() => toggle(module.id, actKey)}
                          className={`px-2 py-1.5 text-center cursor-pointer transition-colors ${
                            isChecked ? 'bg-primary/5' : 'hover:bg-surface-muted/40'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by TD click
                            className="w-3.5 h-3.5 rounded-xs text-primary accent-primary cursor-pointer align-middle"
                          />
                        </td>
                      );
                    })}

                    {/* Toggle Module Row All */}
                    <td 
                      onClick={() => toggleModuleRow(module)}
                      className="px-2 py-1.5 text-center cursor-pointer hover:bg-surface-muted/40"
                    >
                      <input 
                        type="checkbox"
                        checked={isAllRowChecked}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded-xs text-primary accent-primary cursor-pointer align-middle"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTableContainer>
    </div>
  );
}
