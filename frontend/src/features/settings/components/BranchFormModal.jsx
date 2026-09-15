import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { EmailInput } from '../../../components/ui/fields/EmailInput';
import { PhoneInput } from '../../../components/ui/fields/PhoneInput';
import { companiesApi, branchesApi, mastersApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';
import { validators } from '../../../utils/validation';

export function BranchFormModal({ isOpen, onClose, branch, onSaveSuccess }) {
  const isEditing = Boolean(branch?.id);
  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    company_id: '',
    branch_type_id: '',
    is_head_office: false,
    gstin: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    state_name: '',
    state_code: '',
    postal_code: '',
    country_code: 'IN',
    latitude: '',
    longitude: '',
    is_active: 1
  });
  
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [branchTypes, setBranchTypes] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (branch) {
        setFormData({
          ...branch,
          company_id: String(branch.company_id ?? ''),
          branch_type_id: String(branch.branch_type_id ?? ''),
          is_active: branch.is_active == 1 || branch.is_active === true || branch.status === 'Active' ? 1 : 0,
          is_head_office: branch.is_head_office == 1 || branch.is_head_office === true
        });
      } else {
        setFormData({
          branch_code: '',
          branch_name: '',
          company_id: '',
          branch_type_id: '',
          is_head_office: false,
          gstin: '',
          email: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          district: '',
          state_name: '',
          state_code: '',
          postal_code: '',
          country_code: 'IN',
          latitude: '',
          longitude: '',
          is_active: 1
        });
      }
      setErrors({});
      fetchCompanies();
      fetchBranchTypes();
    }
  }, [isOpen, branch]);

  const fetchCompanies = async () => {
    try {
      const res = await companiesApi.list();
      const list = res?.data?.companies ?? res?.companies ?? [];
      const mapped = Array.isArray(list) ? list.map(c => ({
        value: String(c.id),
        label: c.company_name || c.name || `Company #${c.id}`
      })) : [];
      setCompanies(mapped);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchBranchTypes = async () => {
    try {
      const res = await mastersApi.all({ type: 'branch_types' });
      const types = res?.data?.branch_types ?? res?.branch_types ?? [];
      const mappedTypes = Array.isArray(types) ? types.map(t => ({
        value: String(t.id),
        label: t.type_name || t.name || t.branch_type || String(t.id)
      })) : [];
      setBranchTypes(mappedTypes);
    } catch (error) {
      console.error('Failed to fetch branch types:', error);
      setBranchTypes([]);
    }
  };

  const validate = () => {
    const newErrors = {};
    const companyError = validators.required(formData.company_id);
    if (companyError) newErrors.company_id = companyError;

    const nameError = validators.required(formData.branch_name);
    if (nameError) newErrors.branch_name = nameError;
    
    const codeError = validators.required(formData.branch_code);
    if (codeError) newErrors.branch_code = codeError;

    const typeError = validators.required(formData.branch_type_id);
    if (typeError) newErrors.branch_type_id = typeError;

    const countryError = validators.required(formData.country_code);
    if (countryError) newErrors.country_code = countryError;

    const emailError = validators.email(formData.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validators.phone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (formData.state_code && formData.state_code.length > 2) {
      newErrors.state_code = "Maximum 2 characters allowed.";
    }
    if (formData.postal_code && formData.postal_code.length > 12) {
      newErrors.postal_code = "Maximum 12 characters allowed.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? (checked ? 1 : 0) : value;

    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      const emailError = validators.email(value);
      if (emailError) setErrors(prev => ({ ...prev, email: emailError }));
    }
    if (name === 'phone') {
      const phoneError = validators.phone(value);
      if (phoneError) setErrors(prev => ({ ...prev, phone: phoneError }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        ...formData,
        company_id: Number(formData.company_id),
        branch_type_id: Number(formData.branch_type_id),
        is_active: formData.is_active ? 1 : 0,
        is_head_office: formData.is_head_office ? 1 : 0
      };

      if (isEditing) {
        await branchesApi.update(branch.id, payload);
        toast.success('Branch updated successfully');
      } else {
        await branchesApi.create(payload);
        toast.success('Branch created successfully');
      }
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('Save branch error:', error);
      setErrors(error?.errors ?? {});
      toast.error(error?.message || 'Failed to save branch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header 
        icon={Building2}
        title={isEditing ? 'Edit Branch' : 'Add New Branch'}
        subtitle={isEditing ? `Update details for ${branch.branch_name || 'Branch'}` : 'Create a new branch and configure its details.'}
        onClose={onClose}
      />
      
      <form id="branch-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="General Information" description="Basic identification details for the branch">
            <EntityEditModal.Grid>
              <FormField label="Company" error={errors.company_id} required>
                <Select
                  options={[
                    { value: '', label: 'Select Company' },
                    ...companies
                  ]}
                  value={String(formData.company_id || '')}
                  onChange={(val) => handleSelectChange('company_id', val)}
                  hasError={!!errors.company_id}
                />
              </FormField>

              <FormField label="Branch Code" error={errors.branch_code} required>
                <Input 
                  name="branch_code"
                  value={formData.branch_code || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. HO" 
                  hasError={!!errors.branch_code}
                  maxLength={30}
                />
              </FormField>

              <FormField label="Branch Name" error={errors.branch_name} required>
                <Input 
                  name="branch_name"
                  value={formData.branch_name || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Headquarters" 
                  hasError={!!errors.branch_name}
                  maxLength={150}
                />
              </FormField>

              <FormField label="Branch Type" error={errors.branch_type_id} required>
                <Select
                  options={[
                    { value: '', label: 'Select Branch Type' },
                    ...branchTypes
                  ]}
                  value={String(formData.branch_type_id || '')}
                  onChange={(val) => handleSelectChange('branch_type_id', val)}
                  hasError={!!errors.branch_type_id}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Tax & Contact" description="Communication and legal tax details">
            <EntityEditModal.Grid>
              <FormField label="GSTIN" error={errors.gstin}>
                <Input 
                  name="gstin"
                  value={formData.gstin || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. 29ABCDE1234F1Z5" 
                  hasError={!!errors.gstin}
                  maxLength={15}
                />
              </FormField>

              <FormField label="Email Address" error={errors.email}>
                <EmailInput 
                  name="email"
                  value={formData.email || ''} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.email}
                />
              </FormField>
              
              <FormField label="Phone Number" error={errors.phone}>
                <PhoneInput 
                  name="phone"
                  value={formData.phone || ''} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.phone}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Address" description="Physical location of the branch">
            <EntityEditModal.Grid>
              <FormField label="Address Line 1" error={errors.address_line1}>
                <Input 
                  name="address_line1"
                  value={formData.address_line1 || ''} 
                  onChange={handleChange} 
                  placeholder="Building/Street address" 
                  hasError={!!errors.address_line1}
                  maxLength={200}
                />
              </FormField>
              
              <FormField label="Address Line 2" error={errors.address_line2}>
                <Input 
                  name="address_line2"
                  value={formData.address_line2 || ''} 
                  onChange={handleChange} 
                  placeholder="Apartment, suite, unit, etc. (optional)" 
                  hasError={!!errors.address_line2}
                  maxLength={200}
                />
              </FormField>

              <FormField label="City" error={errors.city}>
                <Input 
                  name="city"
                  value={formData.city || ''} 
                  onChange={handleChange} 
                  placeholder="City" 
                  hasError={!!errors.city}
                  maxLength={100}
                />
              </FormField>
              
              <FormField label="District" error={errors.district}>
                <Input 
                  name="district"
                  value={formData.district || ''} 
                  onChange={handleChange} 
                  placeholder="District" 
                  hasError={!!errors.district}
                  maxLength={100}
                />
              </FormField>

              <FormField label="State" error={errors.state_name}>
                <Input 
                  name="state_name"
                  value={formData.state_name || ''} 
                  onChange={handleChange} 
                  placeholder="State" 
                  hasError={!!errors.state_name}
                  maxLength={100}
                />
              </FormField>

              <FormField label="State Code" error={errors.state_code}>
                <Input 
                  name="state_code"
                  value={formData.state_code || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. TN" 
                  hasError={!!errors.state_code}
                  maxLength={2}
                />
              </FormField>
              
              <FormField label="Country Code" error={errors.country_code} required>
                <Input 
                  name="country_code"
                  value={formData.country_code || 'IN'} 
                  onChange={handleChange} 
                  placeholder="e.g. IN" 
                  hasError={!!errors.country_code}
                  maxLength={2}
                />
              </FormField>

              <FormField label="Postal Code" error={errors.postal_code}>
                <Input 
                  name="postal_code"
                  value={formData.postal_code || ''} 
                  onChange={handleChange} 
                  placeholder="Postal Code" 
                  hasError={!!errors.postal_code}
                  maxLength={12}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Location & Settings" description="Coordinates and system configurations">
            <EntityEditModal.Grid>
              <FormField label="Latitude" error={errors.latitude}>
                <Input 
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. 11.0168" 
                  hasError={!!errors.latitude}
                />
              </FormField>

              <FormField label="Longitude" error={errors.longitude}>
                <Input 
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. 76.9558" 
                  hasError={!!errors.longitude}
                />
              </FormField>
              
              <div className="md:col-span-2 flex items-center gap-6 mt-2">
                <Checkbox 
                  id="is_head_office"
                  name="is_head_office"
                  checked={formData.is_head_office === 1 || formData.is_head_office === true}
                  onChange={handleChange}
                  label="This is the Head Office"
                />
                <Checkbox 
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active === 1 || formData.is_active === true}
                  onChange={handleChange}
                  label="Branch is Active"
                />
              </div>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
        </EntityEditModal.Body>

        <EntityEditModal.Footer 
          formId="branch-edit-form"
          onCancel={onClose}
          isSubmitting={loading}
          submitLabel={isEditing ? 'Update Branch' : 'Create Branch'}
        />
      </form>
    </EntityEditModal>
  );
}
