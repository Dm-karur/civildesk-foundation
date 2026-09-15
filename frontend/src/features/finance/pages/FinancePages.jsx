import { Landmark, Receipt, CreditCard } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { ReportPage } from '../../shared/components/ReportPage';
import { expensesApi, projectCostingApi } from '../../../api/apiservice';

/* Backend response keys:
   ExpenseRequestsController → 'expense_requests'
   ExpenseBillsController → 'expense_bills'
   ExpensePaymentsController → 'expense_payments'
*/

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

export function ExpenseRequestsPage() {
  return (
    <DocumentListPage
      title="Expense Requests"
      icon={Receipt}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Finance & Cost Control' }, { label: 'Expense Requests' }]}
      api={expensesApi.requests}
      extractList={(res) => res?.data?.expense_requests ?? res?.data?.data ?? []}
      columns={[
        { key: 'request_no', label: 'Request No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'request_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'required_date', label: 'Required', className: 'w-24', format: 'date' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'site_name', label: 'Site', className: 'w-28' },
        { key: 'purpose', label: 'Purpose', className: 'w-36' },
        { key: 'estimated_amount', label: 'Amount', className: 'w-28 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['request_no', 'project_name', 'purpose']}
      statusOptions={STATUS}
      entityName="Expense Request"
      permissionPrefix="expenses"
    />
  );
}

export function ExpenseBillsPage() {
  return (
    <DocumentListPage
      title="Expense Bills"
      icon={Receipt}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Finance & Cost Control' }, { label: 'Expense Bills' }]}
      api={expensesApi.bills}
      extractList={(res) => res?.data?.expense_bills ?? res?.data?.data ?? []}
      columns={[
        { key: 'bill_no', label: 'Bill No.', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'internal_voucher_no', label: 'Voucher', className: 'w-24' },
        { key: 'bill_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'due_date', label: 'Due', className: 'w-24', format: 'date' },
        { key: 'payee_name', label: 'Payee', className: 'w-32' },
        { key: 'project_name', label: 'Project', className: 'w-28' },
        { key: 'taxable_amount', label: 'Taxable', className: 'w-24 text-right', format: 'currency' },
        { key: 'grand_total', label: 'Total', className: 'w-24 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-20 text-center' },
        { key: 'payment_status_name', label: 'Payment', className: 'w-20 text-center' },
      ]}
      searchKeys={['bill_no', 'internal_voucher_no', 'payee_name', 'project_name']}
      statusOptions={STATUS}
      entityName="Expense Bill"
      permissionPrefix="expenses"
    />
  );
}

export function ExpensePaymentsPage() {
  return (
    <DocumentListPage
      title="Expense Payments"
      icon={CreditCard}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Finance & Cost Control' }, { label: 'Payments' }]}
      api={expensesApi.payments}
      extractList={(res) => res?.data?.expense_payments ?? res?.data?.data ?? []}
      columns={[
        { key: 'payment_no', label: 'Payment No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'payment_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'bill_no', label: 'Bill No.', className: 'w-24' },
        { key: 'payee_name', label: 'Payee', className: 'w-32' },
        { key: 'amount', label: 'Amount', className: 'w-28 text-right', format: 'currency' },
        { key: 'tds_deducted', label: 'TDS', className: 'w-20 text-right', format: 'currency' },
        { key: 'reference_no', label: 'Reference', className: 'w-28' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['payment_no', 'bill_no', 'payee_name', 'reference_no']}
      statusOptions={STATUS}
      entityName="Payment"
      permissionPrefix="expense_payments"
    />
  );
}

export function ProjectCostSummaryPage() {
  return (
    <ReportPage
      title="Project Cost Summary"
      icon={Landmark}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Finance & Cost Control' }, { label: 'Project Cost Summary' }]}
      fetchData={(params) => projectCostingApi.snapshots(params)}
      columns={[
        { key: 'project_name', label: 'Project', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'budget_amount', label: 'Budget', className: 'w-28 text-right', format: 'currency' },
        { key: 'actual_cost', label: 'Actual Cost', className: 'w-28 text-right', format: 'currency' },
        { key: 'variance', label: 'Variance', className: 'w-24 text-right', format: 'currency' },
        { key: 'material_cost', label: 'Material', className: 'w-24 text-right', format: 'currency' },
        { key: 'labour_cost', label: 'Labour', className: 'w-24 text-right', format: 'currency' },
        { key: 'subcontract_cost', label: 'Subcontract', className: 'w-24 text-right', format: 'currency' },
      ]}
      searchKeys={['project_name']}
    />
  );
}
