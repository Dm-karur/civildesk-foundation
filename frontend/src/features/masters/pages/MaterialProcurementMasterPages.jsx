import { Package, Truck } from 'lucide-react';
import { MasterCrudPage } from '../../masters/components/MasterCrudPage';
import { materialsApi, expensesApi } from '../../../api/apiservice';

/* DB: material_categories → category_code, category_name, parent_id, storage_type_id, quality_check_required, description, display_order, is_active
   DB: material_suppliers → supplier_code, supplier_name, contact_person, phone, email, gstin, pan, address_line1, city, state_name, credit_limit, bank details
   DB: expense_categories → category_code, category_name, parent_id, expense_scope_id, default_taxable, requires_document, description */

export function MaterialCategoriesPage() {
  return (
    <MasterCrudPage
      title="Material Categories" icon={Package}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Material Categories' }]}
      api={materialsApi.categories}
      extractList={(res) => res?.data?.material_categories ?? res?.data?.categories ?? res?.data?.data ?? []}
      entityName="Category" permissionPrefix="materials" formId="mat-cat-form"
      columns={[
        { key: 'category_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'category_name', label: 'Name', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'description', label: 'Description', className: 'w-48' },
        { key: 'display_order', label: 'Order', className: 'w-16 text-right' },
        { key: 'is_active', label: 'Active', className: 'w-16 text-center', render: (r) => r.is_active ? '✓' : '✗' },
      ]}
      formFields={[
        { name: 'category_code', label: 'Code', required: true },
        { name: 'category_name', label: 'Category Name', required: true },
        { name: 'display_order', label: 'Display Order', type: 'number' },
        { name: 'is_active', label: 'Active (1/0)', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      ]}
      emptyForm={{ category_code: '', category_name: '', display_order: '', is_active: '1', description: '' }}
    />
  );
}

export function SuppliersPage() {
  return (
    <MasterCrudPage
      title="Suppliers / Vendors" icon={Truck}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Suppliers' }]}
      api={materialsApi.suppliers}
      extractList={(res) => res?.data?.material_suppliers ?? res?.data?.suppliers ?? res?.data?.data ?? []}
      entityName="Supplier" permissionPrefix="materials" formId="supplier-form"
      columns={[
        { key: 'supplier_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'supplier_name', label: 'Name', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'contact_person', label: 'Contact', className: 'w-28' },
        { key: 'phone', label: 'Phone', className: 'w-24' },
        { key: 'email', label: 'Email', className: 'w-32' },
        { key: 'gstin', label: 'GSTIN', className: 'w-28' },
        { key: 'city', label: 'City', className: 'w-20' },
        { key: 'credit_limit', label: 'Credit Limit', className: 'w-24 text-right', render: (r) => r.credit_limit ? `₹${Number(r.credit_limit).toLocaleString('en-IN')}` : '—' },
        { key: 'rating', label: 'Rating', className: 'w-16 text-center' },
      ]}
      formFields={[
        { name: 'supplier_code', label: 'Code', required: true },
        { name: 'supplier_name', label: 'Name', required: true },
        { name: 'contact_person', label: 'Contact Person' },
        { name: 'phone', label: 'Phone' },
        { name: 'alternate_phone', label: 'Alternate Phone' },
        { name: 'email', label: 'Email' },
        { name: 'gstin', label: 'GSTIN' },
        { name: 'pan', label: 'PAN' },
        { name: 'address_line1', label: 'Address Line 1', fullWidth: true },
        { name: 'address_line2', label: 'Address Line 2', fullWidth: true },
        { name: 'city', label: 'City' },
        { name: 'state_name', label: 'State' },
        { name: 'postal_code', label: 'Postal Code' },
        { name: 'payment_terms_days', label: 'Payment Terms (days)', type: 'number' },
        { name: 'credit_limit', label: 'Credit Limit (₹)', type: 'number' },
        { name: 'bank_name', label: 'Bank Name' },
        { name: 'bank_account_name', label: 'Account Holder' },
        { name: 'bank_account_no', label: 'Account No.' },
        { name: 'bank_ifsc', label: 'IFSC Code' },
        { name: 'rating', label: 'Rating (1-5)', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ]}
      emptyForm={{ supplier_code: '', supplier_name: '', contact_person: '', phone: '', alternate_phone: '', email: '', gstin: '', pan: '', address_line1: '', address_line2: '', city: '', state_name: '', postal_code: '', payment_terms_days: '', credit_limit: '', bank_name: '', bank_account_name: '', bank_account_no: '', bank_ifsc: '', rating: '', notes: '' }}
    />
  );
}

export function ExpenseCategoriesPage() {
  return (
    <MasterCrudPage
      title="Expense Categories" icon={Package}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Expense Categories' }]}
      api={expensesApi.categories}
      extractList={(res) => res?.data?.expense_categories ?? res?.data?.data ?? []}
      entityName="Expense Category" permissionPrefix="expenses" formId="expense-cat-form"
      columns={[
        { key: 'category_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'category_name', label: 'Name', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'expense_scope_name', label: 'Scope', className: 'w-28' },
        { key: 'description', label: 'Description', className: 'w-48' },
        { key: 'is_active', label: 'Active', className: 'w-16 text-center', render: (r) => r.is_active ? '✓' : '✗' },
      ]}
      formFields={[
        { name: 'category_code', label: 'Code', required: true },
        { name: 'category_name', label: 'Category Name', required: true },
        { name: 'display_order', label: 'Display Order', type: 'number' },
        { name: 'is_active', label: 'Active (1/0)', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      ]}
      emptyForm={{ category_code: '', category_name: '', display_order: '', is_active: '1', description: '' }}
    />
  );
}
