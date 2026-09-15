import { UnderConstructionPage } from '../../masters/pages/UnderConstructionPage';

export function ApprovalWorkflowsPage() {
  return (
    <UnderConstructionPage
      title="Approval Workflows"
      moduleName="Approval Flow Configurations"
      description="The application backend does not support dynamic database-driven approval workflows or authorization schemes. Document approvals (BOQ, Budget, Purchase Orders, Daily Reports, RA Bills) are hardcoded system transitions checked in ApprovalsController.php."
    />
  );
}
export default ApprovalWorkflowsPage;
