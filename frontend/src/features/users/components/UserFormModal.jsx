import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { EmailInput } from '../../../components/ui/fields/EmailInput';
import { PhoneInput } from '../../../components/ui/fields/PhoneInput';
import { PasswordInput } from '../../../components/ui/fields/PasswordInput';
import { 
  usersApi, 
  branchesApi, 
  rolesApi,
  userTypeMastersApi, 
  accessLevelMastersApi, 
  userStatusesApi 
} from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';
import { validators } from '../../../utils/validation';

function extractBranchList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.branches)) return response.branches;
  if (Array.isArray(response.data?.branches)) return response.data.branches;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data && typeof response.data === 'object') {
    for (const key in response.data) {
      if (Array.isArray(response.data[key])) return response.data[key];
    }
  }
  if (response && typeof response === 'object') {
    for (const key in response) {
      if (Array.isArray(response[key])) return response[key];
    }
  }
  return [];
}

export function UserFormModal({ user, isOpen, onClose, onSaveSuccess }) {
  const isEditing = Boolean(user?.id);
  const [saving, setSaving] = useState(false);

  // Master lists fetched from database tables
  const [branches, setBranches] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    employee_code: '',
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    designation: '',
    user_type_id: '',
    access_level_id: '',
    role_id: '',
    user_status_id: '',
    default_branch_id: '',
    is_super_admin: 0,
    is_active: 1,
    must_change_password: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (branchesApi?.list) {
      branchesApi.list()
        .then(res => {
          const list = extractBranchList(res);
          if (Array.isArray(list) && list.length > 0) setBranches(list);
        })
        .catch(() => {});
    }

    if (rolesApi?.list) {
      rolesApi.list()
        .then(res => {
          const list = res?.data?.roles ?? res?.roles ?? [];
          if (Array.isArray(list) && list.length > 0) setRoles(list);
        })
        .catch(() => {});
    }

    if (userTypeMastersApi?.list) {
      userTypeMastersApi.list()
        .then(list => {
          if (Array.isArray(list) && list.length > 0) setUserTypes(list);
        })
        .catch(() => {});
    }

    if (accessLevelMastersApi?.list) {
      accessLevelMastersApi.list()
        .then(list => {
          if (Array.isArray(list) && list.length > 0) setAccessLevels(list);
        })
        .catch(() => {});
    }

    if (userStatusesApi?.list) {
      userStatusesApi.list()
        .then(list => {
          if (Array.isArray(list) && list.length > 0) setStatuses(list);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        employee_code: user.employee_code || '',
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        designation: user.designation || '',
        user_type_id: String(user.user_type_id ?? ''),
        access_level_id: String(user.access_level_id ?? user.branch_access?.[0]?.access_level_id ?? ''),
        role_id: String(user.role_id ?? user.roles?.[0]?.id ?? user.role_ids?.[0] ?? ''),
        user_status_id: String(user.user_status_id ?? ''),
        default_branch_id: String(user.default_branch_id ?? ''),
        is_super_admin: user.is_super_admin ? 1 : 0,
        is_active: user.is_active !== undefined ? Number(user.is_active) : 1,
        must_change_password: user.must_change_password ? 1 : 0,
      });
      setErrors({});
    } else if (isOpen) {
      setFormData({
        employee_code: '',
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        designation: '',
        user_type_id: '',
        access_level_id: '',
        role_id: '',
        user_status_id: '',
        default_branch_id: '',
        is_super_admin: 0,
        is_active: 1,
        must_change_password: 0,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case 'username':
      case 'first_name':
        error = validators.required(value);
        break;
      case 'email':
        error = validators.email(value);
        break;
      case 'phone':
        error = validators.phone(value);
        break;
      case 'password':
        if (!isEditing && !value) {
          error = "Password is required for new users.";
        } else if (value) {
          error = validators.password(value);
        }
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'is_super_admin') {
      const isSuper = checked ? 1 : 0;
      setFormData(prev => ({
        ...prev,
        is_super_admin: isSuper,
      }));
      return;
    }

    const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.username = validateField('username', formData.username);
    newErrors.first_name = validateField('first_name', formData.first_name);
    newErrors.email = validateField('email', formData.email);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.password = validateField('password', formData.password);
    for (const field of ['user_type_id', 'access_level_id', 'role_id', 'default_branch_id']) {
      if (!formData[field]) newErrors[field] = 'This selection is required.';
    }

    const hasErrors = Object.values(newErrors).some(err => err !== null);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);

    try {
      const selectedRoleId = Number(formData.role_id);
      const selectedAccessLevel = Number(formData.access_level_id);
      const selectedUserType = Number(formData.user_type_id);
      const selectedUserStatus = formData.user_status_id ? Number(formData.user_status_id) : undefined;

      // Build valid branch IDs list
      let branchIds = [];
      if (Array.isArray(formData.branch_ids) && formData.branch_ids.length > 0) {
        branchIds = formData.branch_ids.map(Number);
      } else if (formData.default_branch_id) {
        branchIds = [Number(formData.default_branch_id)];
      }

      const activeDefaultBranch = formData.default_branch_id ? Number(formData.default_branch_id) : branchIds[0];

      // Build complete payload matching all MySQL tables & validation rules
      const payload = {
        ...formData,
        role_id: selectedRoleId,
        role_ids: [selectedRoleId],
        roles: [selectedRoleId],
        access_level_id: selectedAccessLevel,
        user_type_id: selectedUserType,
        user_status_id: selectedUserStatus,
        default_branch_id: activeDefaultBranch,
        branch_id: activeDefaultBranch,
        branch_ids: branchIds,
        branches: branchIds,
        is_super_admin: formData.is_super_admin ? 1 : 0,
        is_active: Number(formData.is_active),
        active: Number(formData.is_active),
        must_change_password: Number(formData.must_change_password)
      };
      if (selectedUserStatus === undefined) delete payload.user_status_id;

      // Don't send empty password when editing existing user
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      if (isEditing) {
        await usersApi.update(user.id, payload);
        toast.success('User updated successfully');
      } else {
        await usersApi.create(payload);
        toast.success('User created successfully');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save user:', err);
      setErrors(err?.errors ?? {});
      const errorMsg = err?.message || 'Failed to save user. Check required fields.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header 
        icon={User}
        title={isEditing ? `Edit User: ${user.first_name || user.username}` : 'Add New User'}
        subtitle="Manage user profile, access level, and role assignments."
        onClose={onClose}
      />

      {formData.is_active === 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
          <span>⚠️ <strong>Account Inactive:</strong> This user cannot log in or make updates while inactive.</span>
          <button 
            type="button" 
            onClick={() => setFormData(prev => ({ ...prev, is_active: 1, user_status_id: '1' }))}
            className="text-[10px] font-bold underline hover:no-underline ml-2"
          >
            Reactivate Now
          </button>
        </div>
      )}

      <form id="user-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="User Account & Identity">
            <EntityEditModal.Grid>
              <FormField label="Employee Code">
                <Input 
                  name="employee_code"
                  value={formData.employee_code}
                  onChange={handleChange}
                  placeholder="e.g. EMP-001"
                />
              </FormField>
              <FormField label="Username" required error={errors.username}>
                <Input 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. john.doe"
                />
              </FormField>
              <FormField label="First Name" required error={errors.first_name}>
                <Input 
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. John"
                />
              </FormField>
              <FormField label="Last Name">
                <Input 
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Contact & Classification">
            <EntityEditModal.Grid>
              <FormField label="Email Address" required error={errors.email}>
                <EmailInput 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </FormField>
              <FormField label="Phone Number" error={errors.phone}>
                <PhoneInput 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </FormField>
              <FormField label="Designation">
                <Input 
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Site Engineer"
                />
              </FormField>
              <FormField label="User Type">
                <Select
                  options={userTypes.map(ut => ({
                    value: String(ut.id),
                    label: ut.name || ut.type_name || ut.user_type_name || `Type #${ut.id}`
                  }))}
                  value={String(formData.user_type_id)}
                  onChange={(val) => handleSelectChange('user_type_id', val)}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Branch & Access Level">
            <EntityEditModal.Grid>
              <FormField label="Default Branch" required error={errors.default_branch_id}>
                <Select
                  options={[
                    { value: '', label: 'Select branch' },
                    ...branches.map(br => ({
                      value: String(br.id),
                      label: `${br.branch_name || br.name} (${br.branch_code || br.code})`
                    }))
                  ]}
                  value={String(formData.default_branch_id)}
                  onChange={(val) => handleSelectChange('default_branch_id', val)}
                />
              </FormField>
              <FormField label="Access Level" required error={errors.access_level_id}>
                <Select
                  options={accessLevels.map(al => ({
                    value: String(al.id),
                    label: al.name || al.level_name || `Access Level #${al.id}`
                  }))}
                  value={String(formData.access_level_id)}
                  onChange={(val) => handleSelectChange('access_level_id', val)}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Role & Status">
            <EntityEditModal.Grid>
              <FormField label="Assigned User Role" required error={errors.role_id}>
                <Select
                  options={roles.map(r => ({
                    value: String(r.id),
                    label: r.role_name || r.name
                  }))}
                  value={String(formData.role_id)}
                  onChange={(val) => handleSelectChange('role_id', val)}
                />
              </FormField>
              <FormField label="User Status" error={errors.user_status_id}>
                <Select
                  options={statuses.map(st => ({
                    value: String(st.id),
                    label: st.name || st.status_name || `Status #${st.id}`
                  }))}
                  value={String(formData.user_status_id)}
                  onChange={(val) => handleSelectChange('user_status_id', val)}
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={isEditing ? "New Password (optional)" : "Password"} required={!isEditing} error={errors.password}>
                  <PasswordInput 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={isEditing ? "Leave blank to keep existing password" : "Enter secure password..."}
                  />
                </FormField>
              </div>
              <div className="md:col-span-2 flex items-center gap-6 mt-2">
                <Checkbox 
                  id="is_super_admin"
                  name="is_super_admin"
                  checked={formData.is_super_admin === 1}
                  onChange={handleChange}
                  label="Super Administrator Access"
                />
                <Checkbox 
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active === 1}
                  onChange={handleChange}
                  label="Account Active"
                />
              </div>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
      </form>

      <EntityEditModal.Footer 
        onCancel={onClose} 
        submitLabel={isEditing ? 'Update User' : 'Create User'}
        formId="user-edit-form" 
        isSubmitting={saving} 
      />
    </EntityEditModal>
  );
}
