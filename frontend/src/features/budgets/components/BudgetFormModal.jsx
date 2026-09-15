import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { budgetsApi, projectsApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

const EMPTY_FORM = { budget_code: '', budget_name: '', project_id: '', budget_date: new Date().toISOString().split('T')[0], notes: '' };

const options = (items, labelKeys) => (items ?? []).map((item) => ({
  value: String(item.id),
  label: labelKeys.map((key) => item[key]).find(Boolean) ?? `#${item.id}`,
}));

export function BudgetFormModal({ isOpen, budget = null, onClose, onSaveSuccess }) {
  const isEditing = Boolean(budget?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [projects, setProjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(budget ? { ...EMPTY_FORM, ...budget, project_id: String(budget.project_id ?? '') } : EMPTY_FORM);
    setErrors({});
    setLoadingMasters(true);
    projectsApi.list()
      .then((res) => setProjects(res?.data?.projects ?? res?.projects ?? []))
      .catch((err) => toast.error(err?.message || 'Unable to load projects.'))
      .finally(() => setLoadingMasters(false));
  }, [isOpen, budget]);

  const change = (name, value) => {
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => ({ ...c, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.budget_code.trim()) next.budget_code = 'Required.';
    if (!form.budget_name.trim()) next.budget_name = 'Required.';
    if (!form.project_id) next.project_id = 'Required.';
    if (!form.budget_date) next.budget_date = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, project_id: Number(form.project_id) };
      if (isEditing) await budgetsApi.update(budget.id, payload);
      else await budgetsApi.create(payload);
      toast.success(isEditing ? 'Budget updated.' : 'Budget created.');
      onSaveSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('API Error:', error);
      setErrors(error?.errors ?? {});
      toast.error(error?.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header icon={Wallet} title={isEditing ? 'Edit Budget' : 'Create Budget'} subtitle="Project budget allocation." onClose={onClose} />
      <form id="budget-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Budget Details">
            <EntityEditModal.Grid>
              <FormField label="Budget Code" required error={errors.budget_code}><Input value={form.budget_code} onChange={(e) => change('budget_code', e.target.value)} placeholder="BDG-001" /></FormField>
              <FormField label="Budget Name" required error={errors.budget_name}><Input value={form.budget_name} onChange={(e) => change('budget_name', e.target.value)} /></FormField>
              <FormField label="Project" required error={errors.project_id}><Select value={form.project_id} onChange={(v) => change('project_id', v)} options={options(projects, ['project_name', 'name'])} placeholder="Select project" /></FormField>
              <FormField label="Budget Date" required error={errors.budget_date}><Input type="date" value={form.budget_date} onChange={(e) => change('budget_date', e.target.value)} /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Notes" noBorder>
            <Textarea value={form.notes} onChange={(e) => change('notes', e.target.value)} rows={3} />
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer formId="budget-form" submitLabel={isEditing ? 'Update Budget' : 'Create Budget'} onCancel={onClose} isSubmitting={saving || loadingMasters} />
      </form>
    </EntityEditModal>
  );
}
