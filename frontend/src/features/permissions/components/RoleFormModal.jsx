import { useState, useEffect } from 'react';
import { Shield, Save, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { rolesApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';

export function RoleFormModal({ role, isOpen, onClose, onSaveSuccess }) {
  const isEditing = Boolean(role?.id);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    role_name: '',
    role_code: '',
    description: '',
    is_active: 1
  });

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name || role.name || '',
        role_code: role.role_code || role.code || '',
        description: role.description || '',
        is_active: role.is_active !== undefined ? Number(role.is_active) : 1
      });
    } else {
      setFormData({
        role_name: '',
        role_code: '',
        description: '',
        is_active: 1
      });
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await rolesApi.update(role.id, formData);
        toast.success('Role updated successfully');
      } else {
        await rolesApi.create(formData);
        toast.success('Role created successfully');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save role:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-sm shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-muted/60">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-[13px] font-bold text-text-primary">
              {isEditing ? `Edit Role: ${role.role_name || role.name}` : 'Create New Role'}
            </h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 text-[11px] space-y-3">
          <div>
            <label className="block text-[9px] uppercase font-bold text-text-secondary mb-1">Role Name *</label>
            <input 
              type="text"
              name="role_name"
              value={formData.role_name}
              onChange={handleChange}
              placeholder="e.g. Quantity Surveyor"
              className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-text-secondary mb-1">Role Code *</label>
            <input 
              type="text"
              name="role_code"
              value={formData.role_code}
              onChange={handleChange}
              placeholder="e.g. QS_BILLING"
              className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] font-mono uppercase focus:outline-none focus:border-focus"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-text-secondary mb-1">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Describe access responsibilities..."
              className="w-full p-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus resize-none"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox"
                name="is_active"
                checked={formData.is_active === 1}
                onChange={handleChange}
                className="rounded-xs text-primary"
              />
              <span className="text-[10px] font-medium text-text-primary">Role Active</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-7 text-[11px]">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="h-7 text-[11px] gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>{isEditing ? 'Update Role' : 'Create Role'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
