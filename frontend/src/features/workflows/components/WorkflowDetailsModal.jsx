import { EntityDetailsModal } from '../../../components/composite/EntityDetailsModal';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle2, XCircle, ArrowDown } from 'lucide-react';

export function WorkflowDetailsModal({ workflow, onClose }) {
  if (!workflow) return null;

  const isActive = workflow.status === 'Active';

  return (
    <EntityDetailsModal onClose={onClose}>
      <EntityDetailsModal.Header 
        title="Workflow Details" 
        subtitle={workflow.name}
        badge={
          <Badge 
            variant={isActive ? 'success' : 'neutral'}
            className="text-[10px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center gap-1"
          >
            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        }
        onClose={onClose}
      />

      <EntityDetailsModal.Content>
        <EntityDetailsModal.Section title="GENERAL INFORMATION">
          <EntityDetailsModal.Field label="Workflow Name" value={workflow.name} />
          <EntityDetailsModal.Field label="Workflow Code" value={workflow.code} />
          <EntityDetailsModal.Field label="System Module" value={workflow.module} />
          <EntityDetailsModal.Field label="Transaction" value={workflow.transaction} />
          <EntityDetailsModal.Field label="Scope" value={workflow.scope} />
          <EntityDetailsModal.Field label="Description" value={workflow.description} fullWidth />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="APPROVAL RULES">
          <EntityDetailsModal.Field label="Approval Type" value="Sequential" />
          <EntityDetailsModal.Field label="Required Approvals" value="All levels" />
          <EntityDetailsModal.Field label="Actions Allowed" value="Approve / Reject" />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="APPROVAL FLOW" fullWidth>
          <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
            {workflow.flow.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-full flex items-center gap-3 p-3 bg-surface border border-border rounded-md shadow-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-surface-muted border border-border text-text-primary font-bold text-[12px]">
                    {String(step.step).padStart(2, '0')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary font-bold uppercase">Approver Role</span>
                    <span className="text-[13px] font-semibold text-text-primary">{step.role}</span>
                  </div>
                </div>
                
                {index < workflow.flow.length - 1 && (
                  <div className="py-2">
                    <ArrowDown className="w-4 h-4 text-text-muted" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </EntityDetailsModal.Section>
      </EntityDetailsModal.Content>

      <EntityDetailsModal.Footer onClose={onClose} />
    </EntityDetailsModal>
  );
}
