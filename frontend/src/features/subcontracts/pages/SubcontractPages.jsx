import { HardHat, Users, FileText, Send } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { subcontractsApi } from '../../../api/apiservice';

/* Backend response keys from SubcontractMastersController & SubcontractDocumentsController:
   contractors → 'contractors'
   work-orders → 'work_orders'
   measurements → 'measurements'
   ra-bills → 'ra_bills'
   payments → 'payments'
*/

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

export function SubcontractorsPage() {
  return (
    <DocumentListPage
      title="Subcontractors"
      icon={Users}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subcontract Management' }, { label: 'Subcontractors' }]}
      api={subcontractsApi.contractors}
      extractList={(res) => res?.data?.contractors ?? res?.data?.data ?? []}
      columns={[
        { key: 'contractor_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'contractor_name', label: 'Name', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'contractor_type_name', label: 'Type', className: 'w-28' },
        { key: 'contact_person', label: 'Contact', className: 'w-28' },
        { key: 'phone', label: 'Phone', className: 'w-24' },
        { key: 'gstin', label: 'GSTIN', className: 'w-28' },
        { key: 'city', label: 'City', className: 'w-20' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['contractor_code', 'contractor_name', 'contact_person', 'gstin']}
      entityName="Subcontractor"
      permissionPrefix="subcontractors"
    />
  );
}

export function WorkOrdersPage() {
  return (
    <DocumentListPage
      title="Work Orders"
      icon={FileText}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subcontract Management' }, { label: 'Work Orders' }]}
      api={subcontractsApi.workOrders}
      extractList={(res) => res?.data?.work_orders ?? res?.data?.data ?? []}
      columns={[
        { key: 'work_order_no', label: 'WO No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'work_order_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'contractor_name', label: 'Contractor', className: 'w-32' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'start_date', label: 'Start', className: 'w-24', format: 'date' },
        { key: 'completion_date', label: 'End', className: 'w-24', format: 'date' },
        { key: 'total_order_value', label: 'WO Value', className: 'w-28 text-right', format: 'currency' },
        { key: 'certified_amount', label: 'Certified', className: 'w-24 text-right', format: 'currency' },
        { key: 'paid_amount', label: 'Paid', className: 'w-24 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['work_order_no', 'contractor_name', 'project_name']}
      statusOptions={STATUS}
      entityName="Work Order"
      permissionPrefix="work_orders"
      actions={[
        { name: 'submit', label: 'Submit', icon: <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />, condition: (i) => String(i.status_name || '').toLowerCase().includes('draft') },
      ]}
    />
  );
}

export function SubcontractMeasurementsPage() {
  return (
    <DocumentListPage
      title="Work Measurements"
      icon={HardHat}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subcontract Management' }, { label: 'Work Measurements' }]}
      api={subcontractsApi.measurements}
      extractList={(res) => res?.data?.measurements ?? res?.data?.data ?? []}
      columns={[
        { key: 'measurement_no', label: 'MB No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'measurement_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'period_from', label: 'From', className: 'w-24', format: 'date' },
        { key: 'period_to', label: 'To', className: 'w-24', format: 'date' },
        { key: 'contractor_name', label: 'Contractor', className: 'w-32' },
        { key: 'total_measured_amount', label: 'Amount', className: 'w-28 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['measurement_no', 'contractor_name']}
      statusOptions={STATUS}
      entityName="Measurement"
      permissionPrefix="measurements"
    />
  );
}

export function RABillsPage() {
  return (
    <DocumentListPage
      title="RA Bills"
      icon={FileText}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subcontract Management' }, { label: 'RA Bills' }]}
      api={subcontractsApi.raBills}
      extractList={(res) => res?.data?.ra_bills ?? res?.data?.data ?? []}
      columns={[
        { key: 'ra_bill_no', label: 'Bill No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'bill_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'contractor_name', label: 'Contractor', className: 'w-32' },
        { key: 'contractor_bill_no', label: 'Vendor Bill#', className: 'w-24' },
        { key: 'gross_work_value', label: 'Gross Work', className: 'w-24 text-right', format: 'currency' },
        { key: 'retention_amount', label: 'Retention', className: 'w-24 text-right', format: 'currency' },
        { key: 'gross_bill_amount', label: 'Bill Amt', className: 'w-24 text-right', format: 'currency' },
        { key: 'tds_amount', label: 'TDS', className: 'w-20 text-right', format: 'currency' },
        { key: 'net_certified_amount', label: 'Net Certified', className: 'w-28 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['ra_bill_no', 'contractor_name', 'contractor_bill_no']}
      statusOptions={STATUS}
      entityName="RA Bill"
      permissionPrefix="ra_bills"
    />
  );
}

export function SubcontractPaymentsPage() {
  return (
    <DocumentListPage
      title="Subcontractor Payments"
      icon={FileText}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Subcontract Management' }, { label: 'Payments' }]}
      api={subcontractsApi.payments}
      extractList={(res) => res?.data?.payments ?? res?.data?.data ?? []}
      columns={[
        { key: 'payment_no', label: 'Payment No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'payment_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'contractor_name', label: 'Contractor', className: 'w-36' },
        { key: 'ra_bill_no', label: 'RA Bill', className: 'w-24' },
        { key: 'amount', label: 'Amount', className: 'w-28 text-right', format: 'currency' },
        { key: 'reference_no', label: 'Reference', className: 'w-28' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['payment_no', 'contractor_name', 'reference_no']}
      entityName="Payment"
      permissionPrefix="payments"
    />
  );
}
