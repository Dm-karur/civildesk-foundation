import { useEffect, useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { rolesApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';

const MODULE_OPTIONS = ['BOQ & Project Budget', 'Materials & Inventory', 'Procurement', 'Daily Site Operations', 'Finance & Cost Control', 'Subcontract Management']
  .map((label) => ({ value: label, label }));

const blank = () => ({ name: '', code: '', module: '', transaction: '', description: '', scope: 'Project', approval_mode: 'Sequential', flow: [{ id: crypto.randomUUID(), role_id: '', required: true }] });

export function WorkflowFormModal({ isOpen, workflow, onClose, onSaveSuccess }) {
  const isEditing = Boolean(workflow?.id);
  const [form, setForm] = useState(blank);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(workflow ? {
      ...blank(), ...workflow,
      flow: (workflow.flow ?? []).map((step) => ({ ...step, id: crypto.randomUUID(), role_id: String(step.role_id ?? step.role?.id ?? '') })),
    } : blank());
    rolesApi.list()
      .then((response) => setRoles(response?.data?.roles ?? response?.roles ?? []))
      .catch((error) => toast.error(error?.message || 'Unable to load workflow roles.'));
  }, [isOpen, workflow]);

  const roleOptions = roles.map((role) => ({ value: role.id, label: role.role_name ?? role.name }));
  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const changeStep = (id, name, value) => setForm((current) => ({ ...current, flow: current.flow.map((step) => step.id === id ? { ...step, [name]: value } : step) }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name || !form.code || !form.module || !form.transaction || form.flow.some((step) => !step.role_id)) {
      toast.error('Complete all required workflow fields and approval roles.');
      return;
    }
    setSaving(true);
    const result = {
      ...form,
      id: workflow?.id ?? Date.now(),
      levels: form.flow.length,
      status: workflow?.status ?? 'Active',
      flow: form.flow.map((step, index) => ({ step: index + 1, role_id: Number(step.role_id), role: roles.find((role) => String(role.id) === String(step.role_id))?.role_name, required: step.required })),
    };
    onSaveSuccess?.(result, isEditing);
    setSaving(false);
    onClose?.();
  };

  if (!isOpen) return null;
  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header icon={GitBranch} title={isEditing ? 'Edit Approval Workflow' : 'Create Approval Workflow'} subtitle="Configure approval scope and database roles." onClose={onClose} />
      <form id="workflow-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Workflow information">
            <EntityEditModal.Grid>
              <FormField label="Workflow Name" required><Input value={form.name} onChange={(event) => change('name', event.target.value)} /></FormField>
              <FormField label="Workflow Code" required><Input value={form.code} onChange={(event) => change('code', event.target.value)} /></FormField>
              <FormField label="Module" required><Select value={form.module} onChange={(value) => change('module', value)} options={MODULE_OPTIONS} placeholder="Select module" /></FormField>
              <FormField label="Transaction" required><Input value={form.transaction} onChange={(event) => change('transaction', event.target.value)} /></FormField>
              <FormField label="Scope" required><Select value={form.scope} onChange={(value) => change('scope', value)} options={['Company', 'Branch', 'Project'].map((label) => ({ value: label, label }))} /></FormField>
              <FormField label="Approval Mode" required><Select value={form.approval_mode} onChange={(value) => change('approval_mode', value)} options={['Sequential', 'Parallel'].map((label) => ({ value: label, label }))} /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Approval steps" noBorder>
            <div className="space-y-3">
              {form.flow.map((step, index) => (
                <div key={step.id} className="grid grid-cols-[1fr_auto_auto] items-end gap-3 rounded-md border border-border p-3">
                  <FormField label={`Level ${index + 1} Role`} required><Select value={step.role_id} onChange={(value) => changeStep(step.id, 'role_id', value)} options={roleOptions} placeholder="Select database role" /></FormField>
                  <Checkbox checked={step.required} onChange={(event) => changeStep(step.id, 'required', event.target.checked)} label="Required" />
                  <Button type="button" variant="ghost" disabled={form.flow.length === 1} onClick={() => change('flow', form.flow.filter((item) => item.id !== step.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => change('flow', [...form.flow, { id: crypto.randomUUID(), role_id: '', required: true }])} leftIcon={<Plus className="h-4 w-4" />}>Add Approval Step</Button>
            </div>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer formId="workflow-form" onCancel={onClose} submitLabel={isEditing ? 'Update Workflow' : 'Create Workflow'} isSubmitting={saving} />
      </form>
    </EntityEditModal>
  );
}
