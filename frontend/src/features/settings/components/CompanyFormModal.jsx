import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { EmailInput } from '../../../components/ui/fields/EmailInput';
import { PhoneInput } from '../../../components/ui/fields/PhoneInput';
import { UrlInput } from '../../../components/ui/fields/UrlInput';
import { mastersApi, companiesApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';
import { validators } from '../../../utils/validation';

export function CompanyFormModal({ isOpen, onClose, company, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    company_code: '',
    company_name: '',
    legal_name: '',
    company_type_id: '',
    gstin: '',
    pan: '',
    cin: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    state_name: '',
    state_code: '',
    country_code: 'IN',
    postal_code: '',
    date_format: 'd-m-Y',
    currency_code: 'INR',
    timezone: 'Asia/Kolkata',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [companyTypes, setCompanyTypes] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (company) {
        setFormData({
          ...company,
          company_type_id: String(company.company_type_id ?? ''),
          is_active: company.is_active == 1 || company.is_active === true || company.status === 'Active'
        });
      } else {
        setFormData({
          company_code: '',
          company_name: '',
          legal_name: '',
          company_type_id: '',
          gstin: '',
          pan: '',
          cin: '',
          email: '',
          phone: '',
          website: '',
          address_line1: '',
          address_line2: '',
          city: '',
          district: '',
          state_name: '',
          state_code: '',
          country_code: 'IN',
          postal_code: '',
          date_format: 'd-m-Y',
          currency_code: 'INR',
          timezone: 'Asia/Kolkata',
          is_active: true
        });
      }
      setErrors({});
      fetchCompanyTypes();
    }
  }, [isOpen, company]);

  const fetchCompanyTypes = async () => {
    try {
      const res = await mastersApi.all({ type: 'company_types' });
      const types = res?.data?.company_types ?? res?.company_types ?? [];
      const mappedTypes = Array.isArray(types) ? types.map(t => ({
        value: String(t.id),
        label: t.type_name || t.name || String(t.id)
      })) : [];
      setCompanyTypes(mappedTypes);
    } catch (err) {
      console.error("Failed to fetch company types", err);
      setCompanyTypes([]);
    }
  };

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case 'company_code':
      case 'company_name':
        error = validators.required(value);
        break;
      case 'email':
        error = validators.email(value);
        break;
      case 'phone':
        error = validators.phone(value);
        break;
      case 'website':
        error = validators.url(value);
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
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
    newErrors.company_code = validateField('company_code', formData.company_code);
    newErrors.company_name = validateField('company_name', formData.company_name);
    if (!formData.company_type_id) newErrors.company_type_id = 'Company type is required.';
    newErrors.email = validateField('email', formData.email);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.website = validateField('website', formData.website);

    const hasErrors = Object.values(newErrors).some(err => err !== null);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        company_type_id: Number(formData.company_type_id),
        is_active: formData.is_active ? 1 : 0
      };

      if (company && company.id) {
        await companiesApi.update(company.id, payload);
        toast.success('Company updated successfully');
        onSaveSuccess();
        onClose();
      } else {
        toast.error('Cannot create new companies from this interface');
      }
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Failed to save company details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header 
        icon={Building2}
        title="Edit Company Configuration"
        subtitle="Update company details and localization settings"
        onClose={onClose}
      />
      
      <form id="company-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Basic Details" description="Core identity information of the company.">
            <EntityEditModal.Grid>
              <FormField label="Company Code" required error={errors.company_code}>
                <Input 
                  name="company_code" 
                  value={formData.company_code} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  placeholder="e.g. CMP001" 
                  maxLength={30}
                />
              </FormField>
              <FormField label="Company Name" required error={errors.company_name}>
                <Input 
                  name="company_name" 
                  value={formData.company_name} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  placeholder="e.g. Acme Corp" 
                  maxLength={150}
                />
              </FormField>
              <FormField label="Legal Name">
                <Input 
                  name="legal_name" 
                  value={formData.legal_name || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Acme Corporation Pvt. Ltd." 
                  maxLength={200}
                />
              </FormField>
              <FormField label="Company Type" required error={errors.company_type_id}>
                <Select
                  options={companyTypes}
                  value={String(formData.company_type_id)}
                  onChange={(val) => handleSelectChange('company_type_id', val)}
                  placeholder="Select Type"
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Identity & Contact" description="Tax identifiers and primary contact details.">
            <EntityEditModal.Grid>
              <FormField label="GSTIN">
                <Input 
                  name="gstin" 
                  value={formData.gstin || ''} 
                  onChange={handleChange} 
                  placeholder="15-digit GST number" 
                  maxLength={15}
                />
              </FormField>
              <FormField label="PAN">
                <Input 
                  name="pan" 
                  value={formData.pan || ''} 
                  onChange={handleChange} 
                  placeholder="10-character PAN" 
                  maxLength={10}
                />
              </FormField>
              <FormField label="CIN">
                <Input 
                  name="cin" 
                  value={formData.cin || ''} 
                  onChange={handleChange} 
                  placeholder="Corporate Identity Number" 
                  maxLength={21}
                />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <EmailInput 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  maxLength={150}
                />
              </FormField>
              <FormField label="Phone" error={errors.phone}>
                <PhoneInput 
                  name="phone" 
                  value={formData.phone || ''} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  maxLength={25}
                />
              </FormField>
              <FormField label="Website" error={errors.website}>
                <UrlInput 
                  name="website" 
                  value={formData.website || ''} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  maxLength={200}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Location" description="Registered address of the company.">
            <EntityEditModal.Grid>
              <div className="md:col-span-2">
                <FormField label="Address Line 1">
                  <Input 
                    name="address_line1" 
                    value={formData.address_line1 || ''} 
                    onChange={handleChange} 
                    placeholder="Flat, House no., Building, Company, Apartment" 
                    maxLength={200}
                  />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label="Address Line 2">
                  <Input 
                    name="address_line2" 
                    value={formData.address_line2 || ''} 
                    onChange={handleChange} 
                    placeholder="Area, Street, Sector, Village" 
                    maxLength={200}
                  />
                </FormField>
              </div>
              <FormField label="City">
                <Input name="city" value={formData.city || ''} onChange={handleChange} placeholder="City" maxLength={100} />
              </FormField>
              <FormField label="District">
                <Input name="district" value={formData.district || ''} onChange={handleChange} placeholder="District" maxLength={100} />
              </FormField>
              <FormField label="Postal Code">
                <Input name="postal_code" value={formData.postal_code || ''} onChange={handleChange} placeholder="PIN" maxLength={12} />
              </FormField>
              <FormField label="State">
                <Input name="state_name" value={formData.state_name || ''} onChange={handleChange} placeholder="State Name" maxLength={100} />
              </FormField>
              <FormField label="State Code">
                <Input name="state_code" value={formData.state_code || ''} onChange={handleChange} placeholder="Code (e.g. MH)" maxLength={2} />
              </FormField>
              <FormField label="Country Code">
                <Input name="country_code" value={formData.country_code || ''} onChange={handleChange} placeholder="IN" maxLength={2} />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="System Settings" description="Localization and status configurations.">
            <EntityEditModal.Grid>
              <FormField label="Currency">
                <Input name="currency_code" value={formData.currency_code || ''} onChange={handleChange} placeholder="INR" maxLength={3} />
              </FormField>
              <FormField label="Timezone">
                <Input name="timezone" value={formData.timezone || ''} onChange={handleChange} placeholder="Asia/Kolkata" maxLength={60} />
              </FormField>
              <FormField label="Date Format">
                <Input name="date_format" value={formData.date_format || ''} onChange={handleChange} placeholder="d-m-Y" maxLength={20} />
              </FormField>
              <div className="flex items-center gap-2 mt-7">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  name="is_active" 
                  checked={formData.is_active} 
                  onChange={handleChange}
                  className="rounded-sm border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-text-primary cursor-pointer">
                  Mark as Active
                </label>
              </div>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
      </form>

      <EntityEditModal.Footer 
        onCancel={onClose} 
        submitLabel="Update Company" 
        formId="company-edit-form" 
        isSubmitting={loading} 
      />
    </EntityEditModal>
  );
}
