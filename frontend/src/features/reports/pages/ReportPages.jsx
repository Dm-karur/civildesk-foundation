import { BarChart3 } from 'lucide-react';
import { ReportPage } from '../../shared/components/ReportPage';
import { reportsApi } from '../../../api/apiservice';

const bc = (label) => [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports & Analytics' }, { label }];

export function ProjectProgressReportPage() {
  return (
    <ReportPage title="Project Progress Report" breadcrumbs={bc('Project Progress')}
      fetchData={reportsApi.dailyProgress}
      columns={[
        { key: 'project_name', label: 'Project', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'planned_progress', label: 'Planned %', className: 'w-20 text-right', format: 'percent' },
        { key: 'actual_progress', label: 'Actual %', className: 'w-20 text-right', format: 'percent' },
        { key: 'deviation', label: 'Deviation', className: 'w-20 text-right', format: 'percent' },
        { key: 'start_date', label: 'Start', className: 'w-24', format: 'date' },
        { key: 'end_date', label: 'End', className: 'w-24', format: 'date' },
        { key: 'status', label: 'Status', className: 'w-24' },
      ]}
      searchKeys={['project_name']}
    />
  );
}

export function BudgetVsActualReportPage() {
  return (
    <ReportPage title="Budget vs Actual Report" breadcrumbs={bc('Budget vs Actual')}
      fetchData={reportsApi.projectCost}
      columns={[
        { key: 'project_name', label: 'Project', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'cost_head', label: 'Cost Head', className: 'w-28' },
        { key: 'budget_amount', label: 'Budget', className: 'w-28 text-right', format: 'currency' },
        { key: 'actual_amount', label: 'Actual', className: 'w-28 text-right', format: 'currency' },
        { key: 'variance', label: 'Variance', className: 'w-24 text-right', format: 'currency' },
        { key: 'utilization_pct', label: 'Util %', className: 'w-16 text-right', format: 'percent' },
      ]}
      searchKeys={['project_name', 'cost_head']}
    />
  );
}

export function LabourReportPage() {
  return (
    <ReportPage title="Labour Report" breadcrumbs={bc('Labour Report')}
      fetchData={reportsApi.labour}
      columns={[
        { key: 'project_name', label: 'Project', className: 'w-36', cellClass: 'font-medium text-text-primary' },
        { key: 'site_name', label: 'Site', className: 'w-32' },
        { key: 'total_workers', label: 'Workers', className: 'w-20 text-right' },
        { key: 'total_mandays', label: 'Man-Days', className: 'w-20 text-right' },
        { key: 'total_wages', label: 'Wages', className: 'w-28 text-right', format: 'currency' },
        { key: 'avg_daily_cost', label: 'Avg/Day', className: 'w-24 text-right', format: 'currency' },
      ]}
      searchKeys={['project_name', 'site_name']}
    />
  );
}

export function MaterialReportPage() {
  return (
    <ReportPage title="Material Consumption Report" breadcrumbs={bc('Material Consumption')}
      fetchData={reportsApi.materials}
      columns={[
        { key: 'material_name', label: 'Material', className: 'w-40', cellClass: 'font-medium text-text-primary' },
        { key: 'category_name', label: 'Category', className: 'w-28' },
        { key: 'unit_name', label: 'Unit', className: 'w-16' },
        { key: 'consumed_qty', label: 'Consumed', className: 'w-20 text-right' },
        { key: 'issued_qty', label: 'Issued', className: 'w-20 text-right' },
        { key: 'total_cost', label: 'Cost', className: 'w-28 text-right', format: 'currency' },
      ]}
      searchKeys={['material_name', 'category_name']}
    />
  );
}

export function SubcontractReportPage() {
  return (
    <ReportPage title="Subcontractor Report" breadcrumbs={bc('Subcontractor Report')}
      fetchData={reportsApi.subcontracts}
      columns={[
        { key: 'contractor_name', label: 'Contractor', className: 'w-36', cellClass: 'font-medium text-text-primary' },
        { key: 'wo_count', label: 'Work Orders', className: 'w-24 text-right' },
        { key: 'total_wo_value', label: 'WO Value', className: 'w-28 text-right', format: 'currency' },
        { key: 'billed_amount', label: 'Billed', className: 'w-28 text-right', format: 'currency' },
        { key: 'paid_amount', label: 'Paid', className: 'w-28 text-right', format: 'currency' },
        { key: 'balance_amount', label: 'Balance', className: 'w-28 text-right', format: 'currency' },
      ]}
      searchKeys={['contractor_name']}
    />
  );
}

export function ExpenseReportPage() {
  return (
    <ReportPage title="Expense Report" breadcrumbs={bc('Expense Report')}
      fetchData={reportsApi.expenses}
      columns={[
        { key: 'project_name', label: 'Project', className: 'w-36', cellClass: 'font-medium text-text-primary' },
        { key: 'category_name', label: 'Category', className: 'w-28' },
        { key: 'budget_amount', label: 'Budget', className: 'w-28 text-right', format: 'currency' },
        { key: 'actual_amount', label: 'Actual', className: 'w-28 text-right', format: 'currency' },
        { key: 'variance', label: 'Variance', className: 'w-24 text-right', format: 'currency' },
        { key: 'vendor_payable', label: 'Payable', className: 'w-24 text-right', format: 'currency' },
      ]}
      searchKeys={['project_name', 'category_name']}
    />
  );
}
