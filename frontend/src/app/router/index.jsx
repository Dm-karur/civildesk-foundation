import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { ProjectsListPage } from '../../features/projects/pages/ProjectsListPage';
import { ProjectCreatePage } from '../../features/projects/pages/ProjectCreatePage';
import { ProjectClientsPage } from '../../features/projects/pages/ProjectClientsPage';
import { ProjectTeamPage } from '../../features/projects/pages/ProjectTeamPage';
import { ProjectOverviewPage } from '../../features/projects/pages/ProjectOverviewPage';
import { ProjectDocumentsPage } from '../../features/projects/pages/ProjectDocumentsPage';
import { ProjectMilestonesPage } from '../../features/projects/pages/ProjectMilestonesPage';
import { ProjectStatusHistoryPage } from '../../features/projects/pages/ProjectStatusHistoryPage';
import { ClientsListPage } from '../../features/clients/pages/ClientsListPage';
import { CompanyListPage } from '../../features/settings/pages/CompanyListPage';
import { BranchListPage } from '../../features/settings/pages/BranchListPage';
import { UsersListPage } from '../../features/users/pages/UsersListPage';
import { PermissionsPage } from '../../features/permissions/pages/PermissionsPage';
import { ApprovalWorkflowsPage } from '../../features/workflows/pages/ApprovalWorkflowsPage';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { RequirePermission } from '../../components/layout/RequirePermission';
import { ErrorBoundary } from '../../components/layout/ErrorBoundary';
import { UnderDevelopment } from '../../features/masters/pages/UnderDevelopment';
import { SubcontractorTypesPage } from '../../features/masters/pages/SubcontractorTypesPage';
import { SubcontractorsMasterPage } from '../../features/masters/pages/SubcontractorsMasterPage';
// Phase 1 — Sites, Masters, BOQ, Budgets
import { SitesListPage } from '../../features/sites/pages/SitesListPage';
import { SiteDashboardPage } from '../../features/sites/pages/SiteDashboardPage';
import { SiteFormPage } from '../../features/sites/pages/SiteFormPage';
import { SiteZonesPage } from '../../features/sites/pages/SiteZonesPage';
import { WorkLocationsPage } from '../../features/sites/pages/WorkLocationsPage';
import { SiteTeamPage } from '../../features/sites/pages/SiteTeamPage';
import { SiteInstructionsPage } from '../../features/sites/pages/SiteInstructionsPage';
import { SiteDocumentsPage } from '../../features/sites/pages/SiteDocumentsPage';
import { ProjectTypesPage } from '../../features/masters/pages/ProjectTypesPage';
import { ProjectStatusesPage } from '../../features/masters/pages/ProjectStatusesPage';
import { FinancialYearsPage } from '../../features/masters/pages/FinancialYearsPage';
import { UnitsOfMeasurementPage } from '../../features/masters/pages/UnitsOfMeasurementPage';
import { WorkCategoriesPage } from '../../features/masters/pages/WorkCategoriesPage';
import { WorkStagesPage } from '../../features/masters/pages/WorkStagesPage';
import { ProgressMethodsPage } from '../../features/masters/pages/ProgressMethodsPage';
import { BoqDashboardPage } from '../../features/boq/pages/BoqDashboardPage';
import { BoqListPage } from '../../features/boq/pages/BoqListPage';
import { BoqDetailsPage } from '../../features/boq/pages/BoqDetailsPage';
import { BoqImportPage } from '../../features/boq/pages/BoqImportPage';
import { BoqReportsPage } from '../../features/boq/pages/BoqReportsPage';
import { BoqSectionsPage } from '../../features/boq/pages/BoqSectionsPage';
import { BoqItemsPage } from '../../features/boq/pages/BoqItemsPage';
import { PlannedQuantitiesPage } from '../../features/boq/pages/PlannedQuantitiesPage';
import { PlannedRatesPage } from '../../features/boq/pages/PlannedRatesPage';
import { DrawingTakeoffPage } from '../../features/boq/pages/DrawingTakeoffPage';
import { TakeoffReviewPage } from '../../features/boq/pages/TakeoffReviewPage';
import { ConvertTakeoffPage } from '../../features/boq/pages/ConvertTakeoffPage';
import { BudgetListPage } from '../../features/budgets/pages/BudgetListPage';
import { BudgetRevisionsPage } from '../../features/budgets/pages/BudgetRevisionsPage';
import { BudgetVariationsPage } from '../../features/budgets/pages/BudgetVariationsPage';
import { BudgetApprovalsPage } from '../../features/budgets/pages/BudgetApprovalsPage';
import { PlanningActivitiesPage } from '../../features/planning/pages/PlanningActivitiesPage';
import { WorkProgrammePage } from '../../features/planning/pages/WorkProgrammePage';
import { PlanningBoqMappingPage } from '../../features/planning/pages/PlanningBoqMappingPage';
import { PlannedVsCompletedPage } from '../../features/planning/pages/PlannedVsCompletedPage';
import { LookAheadSchedulePage } from '../../features/planning/pages/LookAheadSchedulePage';
import { MaterialRequirementsPlanningPage } from '../../features/planning/pages/MaterialRequirementsPlanningPage';
import { MaterialForecastPage } from '../../features/planning/pages/MaterialForecastPage';
import { MaterialShortagesPage } from '../../features/planning/pages/MaterialShortagesPage';
import { PlanningAlertsPage } from '../../features/planning/pages/PlanningAlertsPage';
// Phase 2 — Labour & Attendance
import { LabourRegisterPage } from '../../features/labour/pages/LabourRegisterPage';
import { LabourDeploymentPage } from '../../features/labour/pages/LabourDeploymentPage';
import { DailyAttendancePage } from '../../features/labour/pages/DailyAttendancePage';
import { AttendanceExceptionsPage } from '../../features/labour/pages/AttendanceExceptionsPage';
import { LabourTimesheetsPage } from '../../features/labour/pages/LabourTimesheetsPage';
import { LabourOvertimePage } from '../../features/labour/pages/LabourOvertimePage';
import { LabourLeavePage } from '../../features/labour/pages/LabourLeavePage';
import { DailyWagesPage } from '../../features/labour/pages/DailyWagesPage';
import { ManpowerCostPage } from '../../features/labour/pages/ManpowerCostPage';
import { LabourWageApprovalPage } from '../../features/labour/pages/LabourWageApprovalPage';
// Phase 2 — Materials & Inventory
import { MaterialCataloguePage } from '../../features/materials/pages/MaterialCataloguePage';
import { StockOverviewPage } from '../../features/materials/pages/StockOverviewPage';
import { ProjectStockPage } from '../../features/materials/pages/ProjectStockPage';
import { MaterialRequestsPage } from '../../features/materials/pages/MaterialRequestsPage';
import { MaterialRequestFormPage } from '../../features/materials/pages/MaterialRequestFormPage';
import { StockReceiptsPage } from '../../features/materials/pages/StockReceiptsPage';
import { StockIssuesPage } from '../../features/materials/pages/StockIssuesPage';
import { StockTransfersPage } from '../../features/materials/pages/StockTransfersPage';
import { MaterialReturnsPage } from '../../features/materials/pages/MaterialReturnsPage';
import { StockAdjustmentsPage } from '../../features/materials/pages/StockAdjustmentsPage';
import { DeliveryChallansPage } from '../../features/materials/pages/DeliveryChallansPage';
import { MaterialConsumptionPage } from '../../features/materials/pages/MaterialConsumptionPage';
import { StockLedgerPage } from '../../features/materials/pages/StockLedgerPage';
// Phase 2 — Procurement
import { PurchaseRequisitionsPage } from '../../features/procurement/pages/PurchaseRequisitionsPage';
import { MaterialRequestApprovalPage } from '../../features/procurement/pages/MaterialRequestApprovalPage';
import { RequisitionApprovalPage } from '../../features/procurement/pages/RequisitionApprovalPage';
import { RfqPage } from '../../features/procurement/pages/RfqPage';
import { VendorQuotationsPage } from '../../features/procurement/pages/VendorQuotationsPage';
import { QuotationComparisonPage } from '../../features/procurement/pages/QuotationComparisonPage';
import { PurchaseOrdersPage } from '../../features/procurement/pages/PurchaseOrdersPage';
import { PurchaseOrderApprovalPage } from '../../features/procurement/pages/PurchaseOrderApprovalPage';
import { ProcurementGoodsReceiptPage } from '../../features/procurement/pages/ProcurementGoodsReceiptPage';
import { ReceivePoDeliveryPage } from '../../features/procurement/pages/ReceivePoDeliveryPage';
import { VendorInvoicesPage } from '../../features/procurement/pages/VendorInvoicesPage';
import { ProcurementReturnsPage } from '../../features/procurement/pages/ProcurementReturnsPage';
import { ProcurementTrackingPage } from '../../features/procurement/pages/ProcurementTrackingPage';
// Phase 2 — Daily Site Operations
import { DailyProgressReportsPage } from '../../features/daily-operations/pages/DailyProgressReportsPage';
import { WorkCompletionPage } from '../../features/daily-operations/pages/WorkCompletionPage';
import { SiteMeasurementsPage } from '../../features/daily-operations/pages/SiteMeasurementsPage';
import { DailyManpowerPage } from '../../features/daily-operations/pages/DailyManpowerPage';
import { DailyEquipmentPage } from '../../features/daily-operations/pages/DailyEquipmentPage';
import { DailyMaterialsPage } from '../../features/daily-operations/pages/DailyMaterialsPage';
import { DailyIssuesPage } from '../../features/daily-operations/pages/DailyIssuesPage';
import { DailyPhotosPage } from '../../features/daily-operations/pages/DailyPhotosPage';
import { DailyApprovalsPage } from '../../features/daily-operations/pages/DailyApprovalsPage';
import { DailyHistoryPage } from '../../features/daily-operations/pages/DailyHistoryPage';
// Phase 2 — Subcontract Management
import { SubcontractorsPage } from '../../features/subcontracts/pages/SubcontractorsPage';
import { WorkOrdersPage } from '../../features/subcontracts/pages/WorkOrdersPage';
import { WorkOrderApprovalPage } from '../../features/subcontracts/pages/WorkOrderApprovalPage';
import { SubcontractMeasurementsPage } from '../../features/subcontracts/pages/SubcontractMeasurementsPage';
import { PaymentCertificatesPage } from '../../features/subcontracts/pages/PaymentCertificatesPage';
import { SubcontractRABillsPage } from '../../features/subcontracts/pages/SubcontractRABillsPage';
import { RABillApprovalPage } from '../../features/subcontracts/pages/RABillApprovalPage';
import { SubcontractPaymentsPage } from '../../features/subcontracts/pages/SubcontractPaymentsPage';
import { SubcontractorWeeklyPaymentsPage } from '../../features/subcontracts/pages/SubcontractorWeeklyPaymentsPage';
import { DailySubWorkPage } from '../../features/subcontracts/pages/DailySubWorkPage';
import { MaistrySlipPage } from '../../features/subcontracts/pages/MaistrySlipPage';
import { PackageCompletionPage } from '../../features/subcontracts/pages/PackageCompletionPage';
import { RetentionLedgerPage } from '../../features/subcontracts/pages/RetentionLedgerPage';
// Phase 3 — Client Billing & Receivables
import { ClientContractsPage } from '../../features/receivables/pages/ClientContractsPage';
import { ContractValuesPage } from '../../features/receivables/pages/ContractValuesPage';
import { ClientAdvancesPage } from '../../features/receivables/pages/ClientAdvancesPage';
import { AdvanceApprovalPage } from '../../features/receivables/pages/AdvanceApprovalPage';
import { ClientInvoicesPage } from '../../features/receivables/pages/ClientInvoicesPage';
import { ProgressBillingPage } from '../../features/receivables/pages/ProgressBillingPage';
import { ClientReceiptsPage } from '../../features/receivables/pages/ClientReceiptsPage';
import { ReceiptAllocationsPage } from '../../features/receivables/pages/ReceiptAllocationsPage';
import { OutstandingReceivablesPage } from '../../features/receivables/pages/OutstandingReceivablesPage';
import { ClientRetentionPage } from '../../features/receivables/pages/ClientRetentionPage';
import { ClientStatementsPage } from '../../features/receivables/pages/ClientStatementsPage';
// Phase 3 — Finance & Cost Control
import { ProjectCostPage } from '../../features/finance/pages/ProjectCostPage';
import { BudgetVsActualPage } from '../../features/finance/pages/BudgetVsActualPage';
import { MaterialCostsPage } from '../../features/finance/pages/MaterialCostsPage';
import { LabourCostsPage } from '../../features/finance/pages/LabourCostsPage';
import { SubcontractCostsPage } from '../../features/finance/pages/SubcontractCostsPage';
import { EquipmentCostsPage } from '../../features/finance/pages/EquipmentCostsPage';
import { OtherExpensesPage } from '../../features/finance/pages/OtherExpensesPage';
import { ProjectIncomePage } from '../../features/finance/pages/ProjectIncomePage';
import { MasterExpensesPage } from '../../features/finance/pages/MasterExpensesPage';
import { VendorPayablesPage } from '../../features/finance/pages/VendorPayablesPage';
import { FinancePaymentsPage } from '../../features/finance/pages/FinancePaymentsPage';
import { ProjectProfitabilityPage } from '../../features/finance/pages/ProjectProfitabilityPage';
import { CashFlowPage } from '../../features/finance/pages/CashFlowPage';
import { ExpenseRequestsPage } from '../../features/finance/pages/FinancePages';
// Phase 3 — Reports & Analytics
import { ProjectProgressReportPage } from '../../features/reports/pages/ProjectProgressReportPage';
import { BoqProgressReportPage } from '../../features/reports/pages/BoqProgressReportPage';
import { BudgetVsActualReportPage } from '../../features/reports/pages/BudgetVsActualReportPage';
import { MaterialConsumptionReportPage } from '../../features/reports/pages/MaterialConsumptionReportPage';
import { MaterialShortageReportPage } from '../../features/reports/pages/MaterialShortageReportPage';
import { LabourDeploymentReportPage } from '../../features/reports/pages/LabourDeploymentReportPage';
import { LabourCostReportPage } from '../../features/reports/pages/LabourCostReportPage';
import { SubcontractReportPage } from '../../features/reports/pages/SubcontractReportPage';
import { ClientReceivablesReportPage } from '../../features/reports/pages/ClientReceivablesReportPage';
import { VendorPayablesReportPage } from '../../features/reports/pages/VendorPayablesReportPage';
import { ProjectProfitabilityReportPage } from '../../features/reports/pages/ProjectProfitabilityReportPage';
import { DailySiteReportPage } from '../../features/reports/pages/DailySiteReportPage';
import { ManagementSummaryReportPage } from '../../features/reports/pages/ManagementSummaryReportPage';
import { ExpenseReportPage } from '../../features/reports/pages/ReportPages';
// Phase 3 — Communication & Collaboration
import { ProjectMessagesPage } from '../../features/communication/pages/ProjectMessagesPage';
import { ClientUpdatesPage } from '../../features/communication/pages/ClientUpdatesPage';
import { CommunicationDocumentsPage } from '../../features/communication/pages/CommunicationDocumentsPage';
import { CommunicationApprovalsPage } from '../../features/communication/pages/CommunicationApprovalsPage';
import { WhatsAppLogsPage } from '../../features/communication/pages/WhatsAppLogsPage';
import { EmailLogsPage } from '../../features/communication/pages/EmailLogsPage';
// Phase 2/3 — Additional Masters
import { LabourCategoriesPage } from '../../features/masters/pages/LabourCategoriesPage';
import { LabourTypesPage } from '../../features/masters/pages/LabourTypesPage';
import { TradesPage } from '../../features/masters/pages/TradesPage';
import { WageRatesPage } from '../../features/masters/pages/WageRatesPage';
import { CrewsPage } from '../../features/masters/pages/CrewsPage';
import { LabourContractorsPage } from '../../features/masters/pages/LabourMasterPages';
import { MaterialCategoriesPage } from '../../features/masters/pages/MaterialCategoriesPage';
import { BrandsPage } from '../../features/masters/pages/BrandsPage';
import { WarehousesPage } from '../../features/masters/pages/WarehousesPage';
import { VendorsPage } from '../../features/masters/pages/VendorsPage';
import { PaymentTermsPage } from '../../features/masters/pages/PaymentTermsPage';
import { TaxRatesPage } from '../../features/masters/pages/TaxRatesPage';
import { ExpenseCategoriesPage } from '../../features/masters/pages/ExpenseCategoriesPage';
import { IncomeCategoriesPage } from '../../features/masters/pages/IncomeCategoriesPage';
import { BanksPage } from '../../features/masters/pages/BanksPage';
import { AccountsPage } from '../../features/masters/pages/AccountsPage';
import { CostHeadsPage } from '../../features/masters/pages/CostHeadsPage';
import { NumberingPage } from '../../features/masters/pages/NumberingPage';
import { NotificationLogsPage } from '../../features/masters/pages/NotificationLogsPage';
import { EmailPage } from '../../features/masters/pages/EmailPage';
import { WhatsAppPage } from '../../features/masters/pages/WhatsAppPage';
import { SystemSettingsPage } from '../../features/masters/pages/SystemSettingsPage';
// Phase 3 — Admin
import { AuditLogsPage } from '../../features/settings/pages/AuditLogsPage';
// Phase 4 — Employee HRM & Attendance
import { EmployeeCheckInPage } from '../../features/hrm/pages/EmployeeCheckInPage';
import { EmployeeAttendanceRegisterPage } from '../../features/hrm/pages/EmployeeAttendanceRegisterPage';
import { AttendanceCorrectionsPage } from '../../features/hrm/pages/AttendanceCorrectionsPage';
import { LeaveManagementPage } from '../../features/hrm/pages/LeaveManagementPage';
import { ShiftHolidaySettingsPage } from '../../features/hrm/pages/ShiftHolidaySettingsPage';
import { SalaryStructuresPage } from '../../features/hrm/pages/SalaryStructuresPage';
import { PayrollProcessingPage } from '../../features/hrm/pages/PayrollProcessingPage';
import { PayslipsPage } from '../../features/hrm/pages/PayslipsPage';
import { HrmReportsPage } from '../../features/hrm/pages/HrmReportsPage';
import { ModuleSettingsPage } from '../../features/settings/pages/ModuleSettingsPage';
import { RequireModule } from '../../components/layout/RequireModule';

const R = (permission, Component) => <RequirePermission permission={permission}><Component /></RequirePermission>;
const RM = (module, permission, Component) => (
  <RequireModule module={module}>
    <RequirePermission permission={permission}>
      <Component />
    </RequirePermission>
  </RequireModule>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          // ─── Dashboard ───────────────────────────────────
          { path: 'dashboard', element: R('dashboard.view', DashboardPage) },
          { path: 'dashboards/projects', element: R('dashboard.view', DashboardPage) },
          { path: 'dashboards/sites', element: R('dashboard.view', DashboardPage) },
          { path: 'dashboards/finance', element: R('dashboard.view', DashboardPage) },
          { path: 'alerts', element: R('dashboard.view', DashboardPage) },

          { path: 'sites', element: R('site.view', SitesListPage) },
          { path: 'sites/map', element: R('site.view', SitesListPage) },
          { path: 'sites/new', element: R('site.create', SiteFormPage) },
          { path: 'sites/:siteId', element: R('site.view', SiteDashboardPage) },
          { path: 'sites/:siteId/edit', element: R('site.create', SiteFormPage) },
          { path: 'sites/:siteId/:tab', element: R('site.view', SiteDashboardPage) },
          { path: 'sites/zones', element: R('site.view', SiteZonesPage) },
          { path: 'sites/work-locations', element: R('site.view', WorkLocationsPage) },
          { path: 'sites/team', element: R('site.view', SiteTeamPage) },
          { path: 'sites/instructions', element: R('site.view', SiteInstructionsPage) },
          { path: 'sites/documents', element: R('site.view', SiteDocumentsPage) },
          { path: 'project-masters/sites', element: R('site.view', SitesListPage) },

          // ─── 2. Clients (Top Level) ──────────────────────
          { path: 'clients', element: R('client.view', ClientsListPage) },
          { path: 'project-masters/clients', element: R('client.view', ClientsListPage) },

          // ─── 3. Legacy Project Compatibility Redirects ───
          { path: 'projects', element: <Navigate to="/sites" replace /> },
          { path: 'projects/new', element: <Navigate to="/sites" replace /> },
          { path: 'projects/clients', element: <Navigate to="/clients" replace /> },
          { path: 'projects/team', element: <Navigate to="/sites" replace /> },
          { path: 'projects/overview', element: <Navigate to="/sites" replace /> },
          { path: 'projects/documents', element: <Navigate to="/sites" replace /> },
          { path: 'projects/milestones', element: <Navigate to="/sites" replace /> },
          { path: 'projects/status-history', element: <Navigate to="/sites" replace /> },
          { path: 'project-masters/project-types', element: R('master.view', ProjectTypesPage) },
          { path: 'project-masters/project-statuses', element: R('master.view', ProjectStatusesPage) },
          { path: 'project-masters/financial-years', element: R('master.view', FinancialYearsPage) },
          { path: 'project-masters/units', element: R('master.view', UnitsOfMeasurementPage) },
          { path: 'project-masters/work-categories', element: R('master.view', WorkCategoriesPage) },
          { path: 'project-masters/work-stages', element: R('master.view', WorkStagesPage) },
          { path: 'project-masters/progress-methods', element: R('master.view', ProgressMethodsPage) },

          // ─── 3. BOQ & Project Budget ─────────────────────
          { path: 'boq/dashboard', element: RM('BOQ_BUDGET', 'boq.view', BoqDashboardPage) },
          { path: 'boq', element: RM('BOQ_BUDGET', 'boq.view', BoqListPage) },
          { path: 'boq/import', element: RM('BOQ_BUDGET', 'boq.view', BoqImportPage) },
          { path: 'boq/reports', element: RM('BOQ_BUDGET', 'boq.view', BoqReportsPage) },
          { path: 'boq/:boqId', element: RM('BOQ_BUDGET', 'boq.view', BoqDetailsPage) },
          { path: 'project-boqs', element: <Navigate to="/boq" replace /> },
          { path: 'boq/sections', element: RM('BOQ_BUDGET', 'boq.view', BoqSectionsPage) },
          { path: 'boq/items', element: RM('BOQ_BUDGET', 'boq.view', BoqItemsPage) },
          { path: 'boq/items/planned-quantities', element: RM('BOQ_BUDGET', 'boq.view', PlannedQuantitiesPage) },
          { path: 'boq/items/planned-rates', element: RM('BOQ_BUDGET', 'boq.view', PlannedRatesPage) },
          { path: 'boq/planned-quantities', element: RM('BOQ_BUDGET', 'boq.view', PlannedQuantitiesPage) },
          { path: 'boq/planned-rates', element: RM('BOQ_BUDGET', 'boq.view', PlannedRatesPage) },
          { path: 'project-budgets', element: RM('BOQ_BUDGET', 'budget.view', BudgetListPage) },
          { path: 'budgets', element: RM('BOQ_BUDGET', 'budget.view', BudgetListPage) },
          { path: 'budgets/revisions', element: RM('BOQ_BUDGET', 'budget.view', BudgetRevisionsPage) },
          { path: 'budgets/variations', element: RM('BOQ_BUDGET', 'budget.view', BudgetVariationsPage) },
          { path: 'budgets/approvals', element: RM('BOQ_BUDGET', 'budget.approve', BudgetApprovalsPage) },
          { path: 'takeoff', element: RM('BOQ_BUDGET', 'boq.view', DrawingTakeoffPage) },
          { path: 'takeoff/review', element: RM('BOQ_BUDGET', 'boq.view', TakeoffReviewPage) },
          { path: 'takeoff/convert', element: RM('BOQ_BUDGET', 'boq.create', ConvertTakeoffPage) },

          // ─── 4. Project Planning ─────────────────────────
          { path: 'planning/activities', element: RM('PROJECT_PLANNING', 'planning.view', PlanningActivitiesPage) },
          { path: 'planning/work-programme', element: RM('PROJECT_PLANNING', 'planning.view', WorkProgrammePage) },
          { path: 'planning/boq-mapping', element: RM('PROJECT_PLANNING', 'planning.view', PlanningBoqMappingPage) },
          { path: 'planning/planned-vs-completed', element: RM('PROJECT_PLANNING', 'planning.view', PlannedVsCompletedPage) },
          { path: 'planning/look-ahead', element: RM('PROJECT_PLANNING', 'planning.view', LookAheadSchedulePage) },
          { path: 'planning/material-requirements', element: RM('PROJECT_PLANNING', 'planning.view', MaterialRequirementsPlanningPage) },
          { path: 'planning/material-forecast', element: RM('PROJECT_PLANNING', 'planning.view', MaterialForecastPage) },
          { path: 'planning/shortages', element: RM('PROJECT_PLANNING', 'planning.view', MaterialShortagesPage) },
          { path: 'planning/alerts', element: RM('PROJECT_PLANNING', 'planning.view', PlanningAlertsPage) },

          // ─── 5. Labour & Attendance ───────────────────────
          { path: 'labour', element: RM('LABOUR_ATTENDANCE', 'labour.view', LabourRegisterPage) },
          { path: 'labour/deployment', element: RM('LABOUR_ATTENDANCE', 'labour.view', LabourDeploymentPage) },
          { path: 'labour/attendance', element: RM('LABOUR_ATTENDANCE', 'attendance.view', DailyAttendancePage) },
          { path: 'labour/attendance-exceptions', element: RM('LABOUR_ATTENDANCE', 'attendance.view', AttendanceExceptionsPage) },
          { path: 'labour/timesheets', element: RM('LABOUR_ATTENDANCE', 'attendance.view', LabourTimesheetsPage) },
          { path: 'labour/overtime', element: RM('LABOUR_ATTENDANCE', 'attendance.view', LabourOvertimePage) },
          { path: 'labour/leave', element: RM('LABOUR_ATTENDANCE', 'attendance.view', LabourLeavePage) },
          { path: 'labour/wages', element: RM('LABOUR_ATTENDANCE', 'wages.view', DailyWagesPage) },
          { path: 'labour/manpower-cost', element: RM('LABOUR_ATTENDANCE', 'wages.view', ManpowerCostPage) },
          { path: 'labour/wage-approval', element: RM('LABOUR_ATTENDANCE', 'wages.approve', LabourWageApprovalPage) },

          // ─── 5B. Employee HRM, GPS Attendance & Payroll ──
          { path: 'hrm/check-in', element: <RequireModule module="PRIMARY_HRM"><EmployeeCheckInPage /></RequireModule> },
          { path: 'hrm/attendance', element: RM('PRIMARY_HRM', 'attendance.view', EmployeeAttendanceRegisterPage) },
          { path: 'hrm/corrections', element: <RequireModule module="PRIMARY_HRM"><AttendanceCorrectionsPage /></RequireModule> },
          { path: 'hrm/leaves', element: <RequireModule module="PRIMARY_HRM"><LeaveManagementPage /></RequireModule> },
          { path: 'hrm/shifts-holidays', element: RM('PRIMARY_HRM', 'settings.view', ShiftHolidaySettingsPage) },
          { path: 'hrm/salary-structures', element: RM('PRIMARY_HRM', 'wages.view', SalaryStructuresPage) },
          { path: 'hrm/payroll', element: RM('PRIMARY_HRM', 'wages.view', PayrollProcessingPage) },
          { path: 'hrm/payslips', element: <RequireModule module="PRIMARY_HRM"><PayslipsPage /></RequireModule> },
          { path: 'hrm/reports', element: RM('PRIMARY_HRM', 'attendance.view', HrmReportsPage) },

          // ─── 6. Materials & Inventory ─────────────────────
          { path: 'materials/catalogue', element: RM('MATERIALS_INVENTORY', 'materials.view', MaterialCataloguePage) },
          { path: 'materials/stock', element: RM('MATERIALS_INVENTORY', 'material_stock.view', StockOverviewPage) },
          { path: 'materials/project-stock', element: RM('MATERIALS_INVENTORY', 'material_stock.view', ProjectStockPage) },
          { path: 'materials/requests', element: RM('MATERIALS_INVENTORY', 'materials.view', MaterialRequestsPage) },
          { path: 'materials/requests/new', element: RM('MATERIALS_INVENTORY', 'materials.view', MaterialRequestFormPage) },
          { path: 'materials/requests/:id/edit', element: RM('MATERIALS_INVENTORY', 'materials.view', MaterialRequestFormPage) },
          { path: 'materials/receipts', element: RM('MATERIALS_INVENTORY', 'material_receipts.view', StockReceiptsPage) },
          { path: 'materials/issues', element: RM('MATERIALS_INVENTORY', 'material_stock.view', StockIssuesPage) },
          { path: 'materials/transfers', element: RM('MATERIALS_INVENTORY', 'material_stock.view', StockTransfersPage) },
          { path: 'materials/returns', element: RM('MATERIALS_INVENTORY', 'material_stock.view', MaterialReturnsPage) },
          { path: 'materials/adjustments', element: RM('MATERIALS_INVENTORY', 'material_stock.view', StockAdjustmentsPage) },
          { path: 'materials/delivery-challans', element: RM('MATERIALS_INVENTORY', 'material_stock.view', DeliveryChallansPage) },
          { path: 'materials/consumption', element: RM('MATERIALS_INVENTORY', 'materials.view', MaterialConsumptionPage) },
          { path: 'materials/ledger', element: RM('MATERIALS_INVENTORY', 'material_stock.view', StockLedgerPage) },

          // ─── 7. Procurement ───────────────────────────────
          { path: 'procurement/requisitions', element: RM('PROCUREMENT', 'purchase_orders.view', PurchaseRequisitionsPage) },
          { path: 'procurement/material-request-approval', element: RM('PROCUREMENT', 'purchase_orders.approve', MaterialRequestApprovalPage) },
          { path: 'procurement/requisition-approval', element: RM('PROCUREMENT', 'purchase_orders.approve', RequisitionApprovalPage) },
          { path: 'procurement/rfq', element: RM('PROCUREMENT', 'purchase_orders.view', RfqPage) },
          { path: 'procurement/quotations', element: RM('PROCUREMENT', 'purchase_orders.view', VendorQuotationsPage) },
          { path: 'procurement/comparison', element: RM('PROCUREMENT', 'purchase_orders.view', QuotationComparisonPage) },
          { path: 'procurement/purchase-orders', element: RM('PROCUREMENT', 'purchase_orders.view', PurchaseOrdersPage) },
          { path: 'procurement/purchase-order-approval', element: RM('PROCUREMENT', 'purchase_orders.approve', PurchaseOrderApprovalPage) },
          { path: 'procurement/goods-receipt', element: RM('PROCUREMENT', 'material_receipts.view', ProcurementGoodsReceiptPage) },
          { path: 'procurement/goods-receipt/new', element: RM('PROCUREMENT', 'material_receipts.view', ReceivePoDeliveryPage) },
          { path: 'procurement/goods-receipt/:id/edit', element: RM('PROCUREMENT', 'material_receipts.view', ReceivePoDeliveryPage) },
          { path: 'procurement/vendor-invoices', element: RM('PROCUREMENT', 'purchase_orders.view', VendorInvoicesPage) },
          { path: 'procurement/returns', element: RM('PROCUREMENT', 'purchase_orders.view', ProcurementReturnsPage) },
          { path: 'procurement/tracking', element: RM('PROCUREMENT', 'purchase_orders.view', ProcurementTrackingPage) },

          // ─── 8. Daily Site Operations ─────────────────────
          { path: 'daily-operations/reports', element: RM('DAILY_SITE_OPERATIONS', 'daily_reports.view', DailyProgressReportsPage) },
          { path: 'daily-operations/completion', element: RM('DAILY_SITE_OPERATIONS', 'work_progress.record', WorkCompletionPage) },
          { path: 'daily-operations/measurements', element: RM('DAILY_SITE_OPERATIONS', 'measurements.view', SiteMeasurementsPage) },
          { path: 'daily-operations/manpower', element: RM('DAILY_SITE_OPERATIONS', 'daily_reports.view', DailyManpowerPage) },
          { path: 'daily-operations/equipment', element: RM('DAILY_SITE_OPERATIONS', 'daily_reports.view', DailyEquipmentPage) },
          { path: 'daily-operations/materials', element: RM('DAILY_SITE_OPERATIONS', 'daily_reports.view', DailyMaterialsPage) },
          { path: 'daily-operations/issues', element: RM('DAILY_SITE_OPERATIONS', 'site_issues.view', DailyIssuesPage) },
          { path: 'daily-operations/photos', element: RM('DAILY_SITE_OPERATIONS', 'site_photos.manage', DailyPhotosPage) },
          { path: 'daily-operations/approvals', element: RM('DAILY_SITE_OPERATIONS', 'daily_reports.approve', DailyApprovalsPage) },
          { path: 'daily-operations/history', element: RM('DAILY_SITE_OPERATIONS', 'daily_reports.view', DailyHistoryPage) },

          // ─── 9. Subcontract Management ────────────────────
          { path: 'subcontracts/subcontractors', element: RM('SUBCONTRACT_MANAGEMENT', 'subcontractors.view', SubcontractorsPage) },
          { path: 'subcontracts/work-orders', element: RM('SUBCONTRACT_MANAGEMENT', 'work_orders.view', WorkOrdersPage) },
          { path: 'subcontracts/work-order-approval', element: RM('SUBCONTRACT_MANAGEMENT', 'work_orders.approve', WorkOrderApprovalPage) },
          { path: 'subcontracts/measurements', element: RM('SUBCONTRACT_MANAGEMENT', 'measurements.view', SubcontractMeasurementsPage) },
          { path: 'subcontracts/certificates', element: RM('SUBCONTRACT_MANAGEMENT', 'measurements.view', PaymentCertificatesPage) },
          { path: 'subcontracts/ra-bills', element: RM('SUBCONTRACT_MANAGEMENT', 'ra_bills.view', SubcontractRABillsPage) },
          { path: 'subcontracts/bill-approval', element: RM('SUBCONTRACT_MANAGEMENT', 'ra_bills.certify', RABillApprovalPage) },
          { path: 'subcontracts/payments', element: RM('SUBCONTRACT_MANAGEMENT', 'payments.view', SubcontractPaymentsPage) },
          { path: 'subcontracts/daily-work', element: RM('SUBCONTRACT_MANAGEMENT', 'wages.view', DailySubWorkPage) },
          { path: 'subcontracts/daily-wages', element: RM('SUBCONTRACT_MANAGEMENT', 'wages.view', DailySubWorkPage) },
          { path: 'subcontracts/weekly-payments', element: RM('SUBCONTRACT_MANAGEMENT', 'payments.view', SubcontractorWeeklyPaymentsPage) },
          { path: 'subcontracts/weekly-payments/new', element: RM('SUBCONTRACT_MANAGEMENT', 'payments.view', MaistrySlipPage) },
          { path: 'subcontracts/completion', element: RM('SUBCONTRACT_MANAGEMENT', 'work_progress.view', PackageCompletionPage) },
          { path: 'subcontracts/retention', element: RM('SUBCONTRACT_MANAGEMENT', 'ra_bills.view', RetentionLedgerPage) },
          { path: 'subcontracts/reports', element: RM('SUBCONTRACT_MANAGEMENT', 'report.view', SubcontractReportPage) },
          { path: 'reports/subcontracts', element: RM('SUBCONTRACT_MANAGEMENT', 'report.view', SubcontractReportPage) },
          { path: 'reports/subcontractors', element: RM('SUBCONTRACT_MANAGEMENT', 'report.view', SubcontractReportPage) },

          // ─── 10. Client Billing & Receivables ─────────────
          { path: 'receivables/contracts', element: RM('CLIENT_BILLING', 'client.view', ClientContractsPage) },
          { path: 'receivables/contract-values', element: RM('CLIENT_BILLING', 'client.view', ContractValuesPage) },
          { path: 'receivables/advances', element: RM('CLIENT_BILLING', 'payments.view', ClientAdvancesPage) },
          { path: 'receivables/advance-approval', element: RM('CLIENT_BILLING', 'payments.approve', AdvanceApprovalPage) },
          { path: 'receivables/invoices', element: RM('CLIENT_BILLING', 'payments.view', ClientInvoicesPage) },
          { path: 'receivables/progress-billing', element: RM('CLIENT_BILLING', 'payments.view', ProgressBillingPage) },
          { path: 'receivables/receipts', element: RM('CLIENT_BILLING', 'payments.view', ClientReceiptsPage) },
          { path: 'receivables/allocations', element: RM('CLIENT_BILLING', 'payments.view', ReceiptAllocationsPage) },
          { path: 'receivables/outstanding', element: RM('CLIENT_BILLING', 'cashflow.view', OutstandingReceivablesPage) },
          { path: 'receivables/retention', element: RM('CLIENT_BILLING', 'cashflow.view', ClientRetentionPage) },
          { path: 'receivables/statements', element: RM('CLIENT_BILLING', 'report.view', ClientStatementsPage) },

          // ─── 11. Finance & Cost Control ───────────────────
          { path: 'finance/project-cost', element: RM('FINANCE_COST_CONTROL', 'project_cost.view', ProjectCostPage) },
          { path: 'finance/budget-vs-actual', element: RM('FINANCE_COST_CONTROL', 'budget.view', BudgetVsActualPage) },
          { path: 'finance/material-costs', element: RM('FINANCE_COST_CONTROL', 'project_cost.view', MaterialCostsPage) },
          { path: 'finance/labour-costs', element: RM('FINANCE_COST_CONTROL', 'wages.view', LabourCostsPage) },
          { path: 'finance/subcontract-costs', element: RM('FINANCE_COST_CONTROL', 'project_cost.view', SubcontractCostsPage) },
          { path: 'finance/equipment-costs', element: RM('FINANCE_COST_CONTROL', 'project_cost.view', EquipmentCostsPage) },
          { path: 'finance/other-expenses', element: RM('FINANCE_COST_CONTROL', 'expenses.view', OtherExpensesPage) },
          { path: 'finance/income', element: RM('FINANCE_COST_CONTROL', 'cashflow.view', ProjectIncomePage) },
          { path: 'finance/expenses', element: RM('FINANCE_COST_CONTROL', 'expenses.view', MasterExpensesPage) },
          { path: 'finance/vendor-payables', element: RM('FINANCE_COST_CONTROL', 'expense_payments.view', VendorPayablesPage) },
          { path: 'finance/payments', element: RM('FINANCE_COST_CONTROL', 'expense_payments.view', FinancePaymentsPage) },
          { path: 'finance/profitability', element: RM('FINANCE_COST_CONTROL', 'project_cost.view', ProjectProfitabilityPage) },
          { path: 'finance/cash-flow', element: RM('FINANCE_COST_CONTROL', 'cashflow.view', CashFlowPage) },

          // ─── 12. Reports & Analytics ─────────────────────
          { path: 'reports/project-progress', element: RM('REPORTS_ANALYTICS', 'report.view', ProjectProgressReportPage) },
          { path: 'reports/boq-progress', element: RM('REPORTS_ANALYTICS', 'report.view', BoqProgressReportPage) },
          { path: 'reports/budget-vs-actual', element: RM('REPORTS_ANALYTICS', 'report.view', BudgetVsActualReportPage) },
          { path: 'reports/material-consumption', element: RM('REPORTS_ANALYTICS', 'report.view', MaterialConsumptionReportPage) },
          { path: 'reports/material-shortage', element: RM('REPORTS_ANALYTICS', 'report.view', MaterialShortageReportPage) },
          { path: 'reports/labour-deployment', element: RM('REPORTS_ANALYTICS', 'report.view', LabourDeploymentReportPage) },
          { path: 'reports/labour-cost', element: RM('REPORTS_ANALYTICS', 'report.view', LabourCostReportPage) },
          { path: 'reports/labour', element: RM('REPORTS_ANALYTICS', 'report.view', LabourDeploymentReportPage) },
          { path: 'reports/client-receivables', element: RM('REPORTS_ANALYTICS', 'report.view', ClientReceivablesReportPage) },
          { path: 'reports/vendor-payables', element: RM('REPORTS_ANALYTICS', 'report.view', VendorPayablesReportPage) },
          { path: 'reports/project-profitability', element: RM('REPORTS_ANALYTICS', 'report.view', ProjectProfitabilityReportPage) },
          { path: 'reports/daily-site', element: RM('REPORTS_ANALYTICS', 'report.view', DailySiteReportPage) },
          { path: 'reports/management-summary', element: RM('REPORTS_ANALYTICS', 'management_review.view', ManagementSummaryReportPage) },

          // ─── Communication ───────────────────────────────
          { path: 'communication/project-messages', element: RM('COMMUNICATION', 'project.view', ProjectMessagesPage) },
          { path: 'communication/client-updates', element: RM('COMMUNICATION', 'client.view', ClientUpdatesPage) },
          { path: 'communication/documents', element: RM('COMMUNICATION', 'project.manage_documents', CommunicationDocumentsPage) },
          { path: 'communication/approvals', element: RM('COMMUNICATION', 'project.view', CommunicationApprovalsPage) },
          { path: 'communication/whatsapp', element: RM('COMMUNICATION', 'activity_log.view', WhatsAppLogsPage) },
          { path: 'communication/email', element: RM('COMMUNICATION', 'activity_log.view', EmailLogsPage) },

          // ─── Client Portal ───────────────────────────────
          { path: 'client-portal/users', element: RM('CLIENT_PORTAL', 'user.view', UsersListPage) },
          { path: 'client-portal/access', element: RM('CLIENT_PORTAL', 'user.view', UsersListPage) },
          { path: 'client-portal/projects', element: RM('CLIENT_PORTAL', 'project.view', ProjectsListPage) },
          { path: 'client-portal/documents', element: RM('CLIENT_PORTAL', 'project.view', ProjectsListPage) },
          { path: 'client-portal/approvals', element: <RequireModule module="CLIENT_PORTAL"><ApprovalWorkflowsPage /></RequireModule> },
          { path: 'client-portal/communications', element: RM('CLIENT_PORTAL', 'client.view', ClientsListPage) },

          // ─── Masters — Project ───────────────────────────
          { path: 'project-masters/clients', element: R('client.view', ClientsListPage) },
          { path: 'masters/project-types', element: R('project.view', ProjectTypesPage) },
          { path: 'masters/project-statuses', element: R('master.view', ProjectStatusesPage) },
          { path: 'masters/financial-years', element: R('financial_year.view', FinancialYearsPage) },
          { path: 'masters/units', element: R('master.view', UnitsOfMeasurementPage) },
          { path: 'masters/work-categories', element: R('master.view', WorkCategoriesPage) },

          // ─── Masters — Labour ────────────────────────────
          { path: 'masters/labour-types', element: R('labour.view', LabourTypesPage) },
          { path: 'masters/labour-categories', element: R('labour.view', LabourCategoriesPage) },
          { path: 'masters/trades', element: R('labour.view', TradesPage) },
          { path: 'masters/wage-rates', element: R('wages.view', WageRatesPage) },
          { path: 'masters/crews', element: R('labour.view', CrewsPage) },

          // ─── Masters — Subcontractor ─────────────────────
          { path: 'masters/subcontractor-types', element: <SubcontractorTypesPage /> },
          { path: 'masters/subcontractors', element: <SubcontractorsMasterPage /> },

          // ─── Masters — Materials & Procurement ───────────
          { path: 'masters/material-categories', element: R('materials.view', MaterialCategoriesPage) },
          { path: 'masters/materials', element: R('materials.view', MaterialCataloguePage) },
          { path: 'masters/brands', element: R('materials.view', BrandsPage) },
          { path: 'masters/material-units', element: R('materials.view', UnitsOfMeasurementPage) },
          { path: 'masters/warehouses', element: R('material_stock.view', WarehousesPage) },
          { path: 'masters/vendors', element: R('purchase_orders.view', VendorsPage) },
          { path: 'masters/payment-terms', element: R('master.view', PaymentTermsPage) },
          { path: 'masters/tax-rates', element: R('master.view', TaxRatesPage) },

          // ─── Masters — Finance ───────────────────────────
          { path: 'masters/expense-categories', element: R('expenses.view', ExpenseCategoriesPage) },
          { path: 'masters/income-categories', element: R('master.view', IncomeCategoriesPage) },
          { path: 'masters/banks', element: R('master.view', BanksPage) },
          { path: 'masters/accounts', element: R('master.view', AccountsPage) },
          { path: 'masters/cost-heads', element: R('master.view', CostHeadsPage) },

          // ─── Administration ──────────────────────────────
          { path: 'administration/companies', element: R('company.view', CompanyListPage) },
          { path: 'administration/branches', element: R('branch.view', BranchListPage) },
          { path: 'administration/users', element: R('user.view', UsersListPage) },
          { path: 'administration/roles-permissions', element: R('role.view', PermissionsPage) },
          { path: 'administration/approval-workflows', element: R('approvals.view', ApprovalWorkflowsPage) },
          { path: 'administration/modules', element: R('setting.view', ModuleSettingsPage) },
          { path: 'administration/numbering', element: R('settings.view', NumberingPage) },
          { path: 'administration/notifications', element: R('system_admin.view', NotificationLogsPage) },
          { path: 'administration/email', element: R('settings.view', EmailPage) },
          { path: 'administration/whatsapp', element: R('settings.view', WhatsAppPage) },
          { path: 'administration/audit-logs', element: R('activity_log.view', AuditLogsPage) },
          { path: 'administration/system-settings', element: R('settings.view', SystemSettingsPage) },

          // ─── Utility ─────────────────────────────────────
          { path: 'forbidden', element: <div className="p-8 text-center text-text-secondary">You do not have permission to access this page.</div> },
          // Legacy redirects
          { path: 'settings/company-branch', element: <Navigate to="/administration/companies" replace /> },
          { path: 'settings/users', element: <Navigate to="/administration/users" replace /> },
          { path: 'users', element: <Navigate to="/administration/users" replace /> },
          { path: 'settings/permissions', element: <Navigate to="/administration/roles-permissions" replace /> },
          { path: 'permissions', element: <Navigate to="/administration/roles-permissions" replace /> },
          { path: 'settings/company', element: <Navigate to="/administration/companies" replace /> },
          { path: 'settings/branch', element: <Navigate to="/administration/branches" replace /> },
          // Catch-all
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
