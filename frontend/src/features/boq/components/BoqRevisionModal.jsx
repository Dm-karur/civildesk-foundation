import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { boqApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

export function BoqRevisionModal({ isOpen, boq, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !boq) return null;

  const currentRev = Number(boq.revision_no || 0);
  const nextRev = currentRev + 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for creating a new revision.');
      return;
    }
    setSaving(true);
    try {
      await boqApi.revisions.create(boq.id, {
        reason: reason.trim(),
        changes_summary: changesSummary.trim() || `Initiated Revision ${nextRev}`,
      });
      toast.success(`Revision ${nextRev} created. BOQ is now editable as Draft.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to create revision.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header
        icon={GitBranch}
        title={`Create Revision ${nextRev}`}
        subtitle={`Current: ${boq.boq_code} (Rev ${currentRev}) · ₹${Number(boq.total_amount || 0).toLocaleString('en-IN')}`}
        onClose={onClose}
      />
      <form id="boq-rev-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Revision Details">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-3 rounded-md text-xs mb-3">
              Creating a revision will increment the BOQ to <strong>Rev {nextRev}</strong> and return its status to <strong>Draft</strong> so changes can be made and re-submitted for approval.
            </div>

            <FormField label="Reason for Revision *" required error={error}>
              <Input
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Client requested design modification in foundation depth"
              />
            </FormField>

            <div className="mt-3">
              <FormField label="Summary of Planned Changes">
                <Textarea
                  value={changesSummary}
                  onChange={(e) => setChangesSummary(e.target.value)}
                  placeholder="e.g. Updating excavation quantities by +25m³ and adding PCC rate component"
                  rows={3}
                />
              </FormField>
            </div>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer
          formId="boq-rev-form"
          submitLabel={`Create Revision ${nextRev}`}
          onCancel={onClose}
          isSubmitting={saving}
        />
      </form>
    </EntityEditModal>
  );
}
