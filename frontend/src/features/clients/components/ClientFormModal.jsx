import { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import { clientsApi, clientStatusesApi, clientSourcesApi, mastersApi, branchesApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { EmailInput } from '../../../components/ui/fields/EmailInput';
import { PhoneInput } from '../../../components/ui/fields/PhoneInput';
import { IntegerInput } from '../../../components/ui/fields/IntegerInput';
import { DecimalInput } from '../../../components/ui/fields/DecimalInput';
import { UrlInput } from '../../../components/ui/fields/UrlInput';
import { Textarea } from '../../../components/ui/Textarea';
import { Checkbox } from '../../../components/ui/Checkbox';
import { validators } from '../../../utils/validation';

export function ClientFormModal({ client, isOpen, onClose, onSaveSuccess }) {
  const isEditing = Boolean(client?.id);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);
  const [gstTypes, setGstTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    client_code: '',
    client_name: '',
    legal_name: '',
    client_type_id: '',
    industry_type: '',
    gst_registration_type_id: '',
    gstin: '',
    pan: '',
    tan: '',
    email: '',
    phone: '',
    website: '',
    billing_currency: 'INR',
    payment_terms_days: 30,
    credit_limit: 0,
    tax_deduction_applicable: 0,
    client_source_id: '',
    client_status_id: '',
    notes: '',
    branch_id: ''
  });

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [statusRes, sourceRes, masterRes, branchRes] = await Promise.all([
          clientStatusesApi.list(),
          clientSourcesApi.list(),
          mastersApi.all(),
          branchesApi.list(),
        ]);
        setStatuses(Array.isArray(statusRes) ? statusRes : []);
        setSources(Array.isArray(sourceRes) ? sourceRes : []);
        setClientTypes(masterRes?.data?.company_types ?? []);
        setGstTypes(masterRes?.data?.gst_registration_types ?? []);
        setBranches(branchRes?.data?.branches ?? []);
      } catch (err) {
        console.error('Failed to load client masters:', err);
      }
    };
    if (isOpen) {
      fetchMasters();
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (client) {
      setFormData({
        client_code: client.client_code || client.code || '',
        client_name: client.client_name || client.name || '',
        legal_name: client.legal_name || '',
        client_type_id: String(client.client_type_id ?? ''),
        industry_type: client.industry_type || client.industry || '',
        gst_registration_type_id: String(client.gst_registration_type_id ?? ''),
        gstin: client.gstin || client.gst || '',
        pan: client.pan || '',
        tan: client.tan || '',
        email: client.email || '',
        phone: client.phone || client.contact || '',
        website: client.website || '',
        billing_currency: client.billing_currency || 'INR',
        payment_terms_days: client.payment_terms_days || 30,
        credit_limit: client.credit_limit || 0,
        tax_deduction_applicable: client.tax_deduction_applicable ? 1 : 0,
        client_source_id: String(client.client_source_id ?? ''),
        client_status_id: String(client.client_status_id ?? ''),
        notes: client.notes || '',
        branch_id: String(client.branch_id ?? '')
      });
    } else {
      setFormData({
        client_code: '',
        client_name: '',
        legal_name: '',
        client_type_id: '',
        industry_type: '',
        gst_registration_type_id: '',
        gstin: '',
        pan: '',
        tan: '',
        email: '',
        phone: '',
        website: '',
        billing_currency: 'INR',
        payment_terms_days: 30,
        credit_limit: 0,
        tax_deduction_applicable: 0,
        client_source_id: '',
        client_status_id: '',
        notes: '',
        branch_id: ''
      });
    }
  }, [client, isOpen]);

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case 'client_name':
        error = validators.required(value);
        break;
      case 'phone':
        if (value && String(value).trim() !== '') {
          error = validators.phone(value);
        }
        break;
      case 'email':
        if (value && String(value).trim() !== '') {
          error = validators.email(value);
        }
        break;
      case 'website':
        if (value && String(value).trim() !== '') {
          error = validators.url(value);
        }
        break;
      case 'payment_terms_days':
        if (value !== '' && value !== null && value !== undefined) {
          error = validators.integer(value, { min: 0 });
        }
        break;
      case 'credit_limit':
        if (value !== '' && value !== null && value !== undefined) {
          error = validators.decimal(value, { min: 0 });
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
    const finalValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error on change
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
    newErrors.client_name = validateField('client_name', formData.client_name);
    if (formData.phone && String(formData.phone).trim() !== '') {
      newErrors.phone = validateField('phone', formData.phone);
    }
    if (formData.email) newErrors.email = validateField('email', formData.email);
    if (formData.website) newErrors.website = validateField('website', formData.website);
    if (formData.payment_terms_days !== '' && formData.payment_terms_days !== null && formData.payment_terms_days !== undefined) {
      newErrors.payment_terms_days = validateField('payment_terms_days', formData.payment_terms_days);
    }
    if (formData.credit_limit !== '' && formData.credit_limit !== null && formData.credit_limit !== undefined) {
      newErrors.credit_limit = validateField('credit_limit', formData.credit_limit);
    }

    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(err => err !== null && err !== undefined);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in the mandatory field (Client Name).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_name: formData.client_name?.trim() || '',
        phone: formData.phone?.trim() || null,
        client_code: formData.client_code?.trim() || null,
        legal_name: formData.legal_name?.trim() || null,
        industry_type: formData.industry_type?.trim() || null,
        gstin: formData.gstin?.trim() || null,
        pan: formData.pan?.trim() || null,
        tan: formData.tan?.trim() || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        notes: formData.notes?.trim() || null,
        billing_currency: formData.billing_currency || 'INR',
        tax_deduction_applicable: formData.tax_deduction_applicable ? 1 : 0,
        branch_id: formData.branch_id ? Number(formData.branch_id) : null,
        client_type_id: formData.client_type_id ? Number(formData.client_type_id) : null,
        gst_registration_type_id: formData.gst_registration_type_id ? Number(formData.gst_registration_type_id) : null,
        client_source_id: formData.client_source_id ? Number(formData.client_source_id) : null,
        client_status_id: formData.client_status_id ? Number(formData.client_status_id) : null,
        payment_terms_days: formData.payment_terms_days !== '' ? Number(formData.payment_terms_days) : 0,
        credit_limit: formData.credit_limit !== '' ? Number(formData.credit_limit) : 0,
      };
      if (isEditing) {
        await clientsApi.update(client.id, payload);
        toast.success('Client updated successfully');
      } else {
        await clientsApi.create(payload);
        toast.success('Client created successfully');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save client:', err);
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Failed to save client. Please check fields.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header 
        icon={Building}
        title={isEditing ? `Edit Client: ${client.client_name || client.name}` : 'Add New Client'}
        subtitle="Only Client Name is mandatory. All other fields including Phone Number are optional."
        onClose={onClose}
      />

      <form id="client-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
        <EntityEditModal.Body>
          {/* Primary Section */}
          <EntityEditModal.Section title="Primary Details">
            <EntityEditModal.Grid>
              <FormField label="Client Name" required error={errors.client_name}>
                <Input 
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Greenfield Properties"
                  autoFocus
                />
              </FormField>
              <FormField label="Phone Number (Optional)" error={errors.phone}>
                <PhoneInput 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. +91 9876543210 (Optional)"
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          {/* Business & Branch (Optional) */}
          <EntityEditModal.Section title="Business & Branch Details (Optional)">
            <EntityEditModal.Grid>
              <FormField label="Client Code (Optional)" error={errors.client_code}>
                <Input 
                  name="client_code"
                  value={formData.client_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Auto-generated if blank (e.g. CLI-2026-001)"
                />
              </FormField>
              <FormField label="Legal Name (Optional)">
                <Input 
                  name="legal_name"
                  value={formData.legal_name}
                  onChange={handleChange}
                  placeholder="e.g. Greenfield Properties Pvt. Ltd."
                />
              </FormField>
              <FormField label="Client Type (Optional)" error={errors.client_type_id}>
                <Select 
                  value={formData.client_type_id} 
                  onChange={(value) => handleSelectChange('client_type_id', value)} 
                  options={[{ value: '', label: 'Select client type (optional)' }, ...clientTypes.map((item) => ({ value: String(item.id), label: item.name }))]} 
                  placeholder="Select client type" 
                />
              </FormField>
              <FormField label="Industry Type (Optional)">
                <Input 
                  name="industry_type"
                  value={formData.industry_type}
                  onChange={handleChange}
                  placeholder="e.g. Real Estate Development"
                />
              </FormField>
              <FormField label="Branch (Optional)" error={errors.branch_id}>
                <Select 
                  value={formData.branch_id} 
                  onChange={(value) => handleSelectChange('branch_id', value)} 
                  options={[{ value: '', label: 'Company level (All branches)' }, ...branches.map((item) => ({ value: String(item.id), label: item.branch_name }))]} 
                  placeholder="Select branch" 
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          {/* Additional Contact (Optional) */}
          <EntityEditModal.Section title="Additional Contact & Web (Optional)">
            <EntityEditModal.Grid>
              <FormField label="Email Address (Optional)" error={errors.email}>
                <EmailInput 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. contact@greenfield.com"
                />
              </FormField>
              <FormField label="Website (Optional)" error={errors.website}>
                <UrlInput 
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. https://greenfield.com"
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          {/* Tax & Statutory Compliance (Optional) */}
          <EntityEditModal.Section title="Tax & Statutory Compliance (Optional)">
            <EntityEditModal.Grid>
              <FormField label="GSTIN (Optional)">
                <Input 
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="27AABCU9603R1ZM"
                />
              </FormField>
              <FormField label="GST Registration Type (Optional)" error={errors.gst_registration_type_id}>
                <Select 
                  value={formData.gst_registration_type_id} 
                  onChange={(value) => handleSelectChange('gst_registration_type_id', value)} 
                  options={[{ value: '', label: 'Select GST type (optional)' }, ...gstTypes.map((item) => ({ value: String(item.id), label: item.name }))]} 
                  placeholder="Select GST registration type" 
                />
              </FormField>
              <FormField label="PAN Number (Optional)">
                <Input 
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="AABCU9603R"
                />
              </FormField>
              <FormField label="TAN Number (Optional)">
                <Input 
                  name="tan"
                  value={formData.tan}
                  onChange={handleChange}
                  placeholder="MUMA12345B"
                />
              </FormField>
              <div className="flex items-center mt-7">
                <Checkbox 
                  id="tax_deduction_applicable"
                  name="tax_deduction_applicable"
                  checked={formData.tax_deduction_applicable === 1}
                  onChange={handleChange}
                  label="TDS Applicable"
                />
              </div>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          {/* Financial & Billing Settings (Optional) */}
          <EntityEditModal.Section title="Financial & Billing Settings (Optional)">
            <EntityEditModal.Grid>
              <FormField label="Billing Currency (Optional)">
                <Select
                  options={[
                    { value: 'INR', label: 'INR (₹)' },
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'AED', label: 'AED' },
                    { value: 'EUR', label: 'EUR (€)' }
                  ]}
                  value={formData.billing_currency}
                  onChange={(val) => handleSelectChange('billing_currency', val)}
                />
              </FormField>
              <FormField label="Payment Terms (Days) (Optional)" error={errors.payment_terms_days}>
                <IntegerInput 
                  name="payment_terms_days"
                  value={formData.payment_terms_days}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </FormField>
              <FormField label="Credit Limit (₹) (Optional)" error={errors.credit_limit}>
                <DecimalInput 
                  name="credit_limit"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          {/* Status & Lead Sourcing (Optional) */}
          <EntityEditModal.Section title="Status & Lead Sourcing (Optional)">
            <EntityEditModal.Grid>
              <FormField label="Client Status (Optional)" error={errors.client_status_id}>
                <Select
                  options={[{ value: '', label: 'Default (Active)' }, ...statuses.map(s => ({ value: String(s.id), label: s.status_name || s.name }))]}
                  value={formData.client_status_id}
                  onChange={(val) => handleSelectChange('client_status_id', val)}
                  placeholder="Select client status"
                />
              </FormField>
              <FormField label="Client Source (Optional)" error={errors.client_source_id}>
                <Select
                  options={[{ value: '', label: 'Default (Direct)' }, ...sources.map(s => ({ value: String(s.id), label: s.source_name || s.name }))]}
                  value={formData.client_source_id}
                  onChange={(val) => handleSelectChange('client_source_id', val)}
                  placeholder="Select client source"
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Notes / Instructions (Optional)">
                  <Textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any internal client notes..."
                  />
                </FormField>
              </div>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
      </form>

      <EntityEditModal.Footer 
        onCancel={onClose} 
        submitLabel={isEditing ? 'Update Client' : 'Create Client'}
        formId="client-edit-form" 
        isSubmitting={saving} 
      />
    </EntityEditModal>
  );
}
