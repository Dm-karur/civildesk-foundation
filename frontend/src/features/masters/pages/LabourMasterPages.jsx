import { Users } from 'lucide-react';
import { MasterCrudPage } from '../../masters/components/MasterCrudPage';
import { labourApi } from '../../../api/apiservice';

/* Backend: LabourMastersController
   categories → ok('...','labour_categories', [...])
   contractors → ok('...','labour_contractors', [...])
   DB: labour_categories → category_code, category_name, skill_level_id, wage_basis_id, default_wage_rate, overtime_multiplier, description, display_order, is_active
   DB: labour_contractors → contractor_code, contractor_name, contact_person, phone, alternate_phone, email, gstin, pan, address_line1, city, state_name, bank fields
*/

export function LabourCategoriesPage() {
  return (
    <MasterCrudPage
      title="Labour Categories" icon={Users}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Labour Categories' }]}
      api={labourApi.categories}
      extractList={(res) => res?.data?.labour_categories ?? res?.data?.data ?? []}
      entityName="Labour Category" permissionPrefix="labour" formId="labour-category-form"
      columns={[
        { key: 'category_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'category_name', label: 'Category Name', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'default_wage_rate', label: 'Wage Rate', className: 'w-24 text-right', render: (r) => r.default_wage_rate ? `₹${Number(r.default_wage_rate).toLocaleString('en-IN')}` : '—' },
        { key: 'overtime_multiplier', label: 'OT Mult.', className: 'w-20 text-right' },
        { key: 'description', label: 'Description', className: 'w-48' },
        { key: 'is_active', label: 'Active', className: 'w-16 text-center', render: (r) => r.is_active ? '✓' : '✗' },
      ]}
      formFields={[
        { name: 'category_code', label: 'Code', required: true, placeholder: 'LC-001' },
        { name: 'category_name', label: 'Category Name', required: true },
        { name: 'default_wage_rate', label: 'Default Wage Rate (₹)', type: 'number', step: '0.01' },
        { name: 'overtime_multiplier', label: 'Overtime Multiplier', type: 'number', step: '0.1', placeholder: '1.5' },
        { name: 'display_order', label: 'Display Order', type: 'number' },
        { name: 'is_active', label: 'Is Active', type: 'number', placeholder: '1 or 0' },
        { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      ]}
      emptyForm={{ category_code: '', category_name: '', default_wage_rate: '', overtime_multiplier: '', display_order: '', is_active: '1', description: '' }}
    />
  );
}

export function LabourContractorsPage() {
  return (
    <MasterCrudPage
      title="Labour Contractors" icon={Users}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Labour Contractors' }]}
      api={labourApi.contractors}
      extractList={(res) => res?.data?.labour_contractors ?? res?.data?.data ?? []}
      entityName="Contractor" permissionPrefix="labour" formId="labour-contractor-form"
      columns={[
        { key: 'contractor_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'contractor_name', label: 'Name', className: 'w-36', cellClass: 'font-medium text-text-primary' },
        { key: 'contact_person', label: 'Contact', className: 'w-28' },
        { key: 'phone', label: 'Phone', className: 'w-24' },
        { key: 'email', label: 'Email', className: 'w-32' },
        { key: 'gstin', label: 'GSTIN', className: 'w-28' },
        { key: 'city', label: 'City', className: 'w-20' },
        { key: 'state_name', label: 'State', className: 'w-20' },
      ]}
      formFields={[
        { name: 'contractor_code', label: 'Code', required: true },
        { name: 'contractor_name', label: 'Name', required: true },
        { name: 'contact_person', label: 'Contact Person' },
        { name: 'phone', label: 'Phone' },
        { name: 'alternate_phone', label: 'Alternate Phone' },
        { name: 'email', label: 'Email' },
        { name: 'gstin', label: 'GSTIN' },
        { name: 'pan', label: 'PAN' },
        { name: 'address_line1', label: 'Address Line 1', fullWidth: true },
        { name: 'address_line2', label: 'Address Line 2', fullWidth: true },
        { name: 'city', label: 'City' },
        { name: 'district', label: 'District' },
        { name: 'state_name', label: 'State' },
        { name: 'postal_code', label: 'Postal Code' },
        { name: 'bank_name', label: 'Bank Name' },
        { name: 'bank_account_name', label: 'Account Holder' },
        { name: 'bank_account_no', label: 'Account No.' },
        { name: 'bank_ifsc', label: 'IFSC Code' },
        { name: 'payment_terms_days', label: 'Payment Terms (days)', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ]}
      emptyForm={{ contractor_code: '', contractor_name: '', contact_person: '', phone: '', alternate_phone: '', email: '', gstin: '', pan: '', address_line1: '', address_line2: '', city: '', district: '', state_name: '', postal_code: '', bank_name: '', bank_account_name: '', bank_account_no: '', bank_ifsc: '', payment_terms_days: '', notes: '' }}
    />
  );
}
