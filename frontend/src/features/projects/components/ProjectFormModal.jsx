import { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { projectsApi, clientsApi, branchesApi, mastersApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

const EMPTY_FORM = {
  project_code: '',
  project_name: '',
  client_id: '',
  project_type_id: '',
  project_status_id: '',
  billing_method_id: '',
  priority_id: '',
  branch_id: '',
  financial_year_id: '',
  planned_start_date: '',
  expected_completion_date: '',
  contract_value: '0',
  approved_budget: '0',
  retention_percentage: '0',
  tax_percentage: '0',
  currency_code: 'INR',
  description: '',
  notes: '',
};

const options = (items, labelKeys) => (items ?? []).map((item) => ({
  value: String(item.id),
  label: labelKeys.map((key) => item[key]).find(Boolean) ?? `#${item.id}`,
}));

export function ProjectFormModal({ isOpen, project = null, onClose, onSaveSuccess }) {
  const isEditing = Boolean(project?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [masters, setMasters] = useState({});
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(project ? {
      ...EMPTY_FORM,
      ...project,
      client_id: String(project.client_id ?? ''),
      project_type_id: String(project.project_type_id ?? ''),
      project_status_id: String(project.project_status_id ?? ''),
      billing_method_id: String(project.billing_method_id ?? ''),
      priority_id: String(project.priority_id ?? ''),
      branch_id: String(project.branch_id ?? ''),
      financial_year_id: String(project.financial_year_id ?? ''),
    } : EMPTY_FORM);
    setErrors({});
    setLoadingMasters(true);
    Promise.all([mastersApi.all(), clientsApi.list(), branchesApi.list()])
      .then(([masterResponse, clientResponse, branchResponse]) => {
        const masterData = masterResponse?.data ?? masterResponse ?? {};
        const clientList = clientResponse?.data?.clients ?? clientResponse?.clients ?? [];
        const branchList = branchResponse?.data?.branches ?? branchResponse?.branches ?? [];
        setMasters(masterData);
        setClients(Array.isArray(clientList) ? clientList : []);
        setBranches(Array.isArray(branchList) ? branchList : []);
      })
      .catch((error) => toast.error(error?.message || 'Unable to load project master data.'))
      .finally(() => setLoadingMasters(false));
  }, [isOpen, project]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  };

  const validate = () => {
    const next = {};
    for (const field of ['project_code', 'project_name', 'client_id', 'project_type_id', 'project_status_id', 'billing_method_id', 'priority_id']) {
      if (!String(form[field] ?? '').trim()) next[field] = 'This field is required.';
    }
    if (form.expected_completion_date && form.planned_start_date && form.expected_completion_date < form.planned_start_date) {
      next.expected_completion_date = 'Completion date cannot be before the start date.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const nullableNumber = (value) => value === '' ? null : Number(value);
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        project_type_id: Number(form.project_type_id),
        project_status_id: Number(form.project_status_id),
        billing_method_id: Number(form.billing_method_id),
        priority_id: Number(form.priority_id),
        branch_id: nullableNumber(form.branch_id),
        financial_year_id: nullableNumber(form.financial_year_id),
        contract_value: Number(form.contract_value || 0).toFixed(2),
        approved_budget: Number(form.approved_budget || 0).toFixed(2),
        retention_percentage: Number(form.retention_percentage || 0).toFixed(2),
        tax_percentage: Number(form.tax_percentage || 0).toFixed(2),
        progress_percentage: Number(0).toFixed(2),
      };
      if (isEditing) {
        await projectsApi.update(project.id, payload);
        if (String(project.project_status_id) !== String(form.project_status_id)) {
          await projectsApi.changeStatus(project.id, {
            project_status_id: Number(form.project_status_id),
            change_reason: 'Status changed during project details edit.'
          });
        }
      } else {
        await projectsApi.create(payload);
      }
      toast.success(isEditing ? 'Project updated successfully.' : 'Project created successfully.');
      onSaveSuccess?.();
      onClose?.();
    } catch (error) {
      setErrors(error?.errors ?? {});
      toast.error(error?.message || 'Unable to create project.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header icon={Briefcase} title={isEditing ? 'Edit Project' : 'Add Project'} subtitle="Manage the project using live database masters." onClose={onClose} />
      <form id="project-create-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Project identity">
            <EntityEditModal.Grid>
              <FormField label="Project Code" required error={errors.project_code}><Input value={form.project_code} onChange={(e) => change('project_code', e.target.value)} placeholder="PRJ-2026-001" /></FormField>
              <FormField label="Project Name" required error={errors.project_name}><Input value={form.project_name} onChange={(e) => change('project_name', e.target.value)} /></FormField>
              <FormField label="Client" required error={errors.client_id}><Select value={form.client_id} onChange={(value) => change('client_id', value)} options={options(clients, ['client_name', 'name'])} placeholder="Select client" /></FormField>
              <FormField label="Branch" error={errors.branch_id}><Select value={form.branch_id} onChange={(value) => change('branch_id', value)} options={options(branches, ['branch_name', 'name'])} placeholder="Select branch" /></FormField>
              <FormField label="Project Type" required error={errors.project_type_id}><Select value={form.project_type_id} onChange={(value) => change('project_type_id', value)} options={options(masters.project_types, ['name', 'project_type_name'])} placeholder="Select project type" /></FormField>
              <FormField label="Status" required error={errors.project_status_id}><Select value={form.project_status_id} onChange={(value) => change('project_status_id', value)} options={options(masters.project_statuses, ['name', 'status_name'])} placeholder="Select status" /></FormField>
              <FormField label="Billing Method" required error={errors.billing_method_id}><Select value={form.billing_method_id} onChange={(value) => change('billing_method_id', value)} options={options(masters.billing_methods, ['name', 'method_name'])} placeholder="Select billing method" /></FormField>
              <FormField label="Priority" required error={errors.priority_id}><Select value={form.priority_id} onChange={(value) => change('priority_id', value)} options={options(masters.priorities, ['name', 'priority_name'])} placeholder="Select priority" /></FormField>
              <FormField label="Financial Year" error={errors.financial_year_id}><Select value={form.financial_year_id} onChange={(value) => change('financial_year_id', value)} options={options(masters.financial_years, ['name', 'year_name'])} placeholder="Optional" /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Schedule and value">
            <EntityEditModal.Grid>
              <FormField label="Planned Start" error={errors.planned_start_date}><Input type="date" value={form.planned_start_date} onChange={(e) => change('planned_start_date', e.target.value)} /></FormField>
              <FormField label="Expected Completion" error={errors.expected_completion_date}><Input type="date" value={form.expected_completion_date} onChange={(e) => change('expected_completion_date', e.target.value)} /></FormField>
              <FormField label="Contract Value" error={errors.contract_value}><Input type="number" min="0" step="0.01" value={form.contract_value} onChange={(e) => change('contract_value', e.target.value)} /></FormField>
              <FormField label="Approved Budget" error={errors.approved_budget}><Input type="number" min="0" step="0.01" value={form.approved_budget} onChange={(e) => change('approved_budget', e.target.value)} /></FormField>
              <FormField label="Retention %" error={errors.retention_percentage}><Input type="number" min="0" max="100" step="0.01" value={form.retention_percentage} onChange={(e) => change('retention_percentage', e.target.value)} /></FormField>
              <FormField label="Tax %" error={errors.tax_percentage}><Input type="number" min="0" max="100" step="0.01" value={form.tax_percentage} onChange={(e) => change('tax_percentage', e.target.value)} /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Description" noBorder>
            <FormField error={errors.description}>
              <Textarea value={form.description} onChange={(e) => change('description', e.target.value)} rows={3} />
            </FormField>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer formId="project-create-form" submitLabel={isEditing ? 'Update Project' : 'Create Project'} onCancel={onClose} isSubmitting={saving || loadingMasters} />
      </form>
    </EntityEditModal>
  );
}
