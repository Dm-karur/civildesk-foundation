import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Building2, Calendar, IndianRupee, FileText } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, clientsApi, branchesApi, mastersApi } from '../../../api/apiservice';

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
  contract_value: '',
  approved_budget: '',
  retention_percentage: '0',
  tax_percentage: '18',
  currency_code: 'INR',
  description: '',
  notes: '',
};

const toOpts = (arr = [], labelKey = 'name') =>
  arr.map((item) => ({
    value: String(item.id),
    label: item[labelKey] || item.status_name || item.type_name || item.client_name || item.name || `#${item.id}`,
  }));

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [masters, setMasters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientsApi.list().catch(() => ({ data: [] })),
      branchesApi.list().catch(() => ({ data: [] })),
      mastersApi.all().catch(() => ({ data: {} })),
    ]).then(([cRes, bRes, mRes]) => {
      setClients(cRes?.data?.clients ?? cRes?.data ?? []);
      setBranches(bRes?.data?.branches ?? bRes?.data ?? []);
      setMasters(mRes?.data ?? {});
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.project_code.trim()) newErrors.project_code = 'Project code is required';
    if (!form.project_name.trim()) newErrors.project_name = 'Project name is required';
    if (!form.client_id) newErrors.client_id = 'Client is required';
    if (!form.project_type_id) newErrors.project_type_id = 'Project type is required';
    if (!form.project_status_id) newErrors.project_status_id = 'Status is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        project_type_id: Number(form.project_type_id),
        project_status_id: Number(form.project_status_id),
        billing_method_id: form.billing_method_id ? Number(form.billing_method_id) : null,
        priority_id: form.priority_id ? Number(form.priority_id) : null,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        financial_year_id: form.financial_year_id ? Number(form.financial_year_id) : null,
        contract_value: form.contract_value ? Number(form.contract_value) : 0,
        approved_budget: form.approved_budget ? Number(form.approved_budget) : 0,
        retention_percentage: form.retention_percentage ? Number(form.retention_percentage) : 0,
        tax_percentage: form.tax_percentage ? Number(form.tax_percentage) : 0,
      };

      await projectsApi.create(payload);
      toast.success('Project created successfully!');
      navigate('/projects');
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Add New Project' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Add New Project"
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12">
        {/* Section 1: Basic Information */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Basic Project Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Project Code" required error={errors.project_code}>
              <Input
                value={form.project_code}
                onChange={(e) => handleChange('project_code', e.target.value)}
                placeholder="e.g. PRJ-2026-001"
              />
            </FormField>

            <FormField label="Project Name" required className="md:col-span-2" error={errors.project_name}>
              <Input
                value={form.project_name}
                onChange={(e) => handleChange('project_name', e.target.value)}
                placeholder="e.g. Metro Commercial Tower Block A"
              />
            </FormField>

            <FormField label="Primary Client" required error={errors.client_id}>
              <Select
                options={[{ value: '', label: 'Select Client' }, ...toOpts(clients, 'client_name')]}
                value={form.client_id}
                onChange={(v) => handleChange('client_id', v)}
              />
            </FormField>

            <FormField label="Project Type" required error={errors.project_type_id}>
              <Select
                options={[{ value: '', label: 'Select Type' }, ...toOpts(masters.project_types, 'type_name')]}
                value={form.project_type_id}
                onChange={(v) => handleChange('project_type_id', v)}
              />
            </FormField>

            <FormField label="Project Status" required error={errors.project_status_id}>
              <Select
                options={[{ value: '', label: 'Select Status' }, ...toOpts(masters.project_statuses, 'status_name')]}
                value={form.project_status_id}
                onChange={(v) => handleChange('project_status_id', v)}
              />
            </FormField>

            <FormField label="Branch" error={errors.branch_id}>
              <Select
                options={[{ value: '', label: 'Select Branch' }, ...toOpts(branches, 'branch_name')]}
                value={form.branch_id}
                onChange={(v) => handleChange('branch_id', v)}
              />
            </FormField>

            <FormField label="Financial Year" error={errors.financial_year_id}>
              <Select
                options={[{ value: '', label: 'Select FY' }, ...toOpts(masters.financial_years, 'fy_name')]}
                value={form.financial_year_id}
                onChange={(v) => handleChange('financial_year_id', v)}
              />
            </FormField>

            <FormField label="Priority" error={errors.priority_id}>
              <Select
                options={[{ value: '', label: 'Select Priority' }, ...toOpts(masters.priorities, 'priority_name')]}
                value={form.priority_id}
                onChange={(v) => handleChange('priority_id', v)}
              />
            </FormField>
          </div>
        </Card>

        {/* Section 2: Timeline & Schedule */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Timeline & Schedule</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Planned Start Date" error={errors.planned_start_date}>
              <Input
                type="date"
                value={form.planned_start_date}
                onChange={(e) => handleChange('planned_start_date', e.target.value)}
              />
            </FormField>

            <FormField label="Expected Completion Date" error={errors.expected_completion_date}>
              <Input
                type="date"
                value={form.expected_completion_date}
                onChange={(e) => handleChange('expected_completion_date', e.target.value)}
              />
            </FormField>
          </div>
        </Card>

        {/* Section 3: Financials & Commercials */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <IndianRupee className="w-4 h-4 text-primary" />
            <span>Commercial & Financial Terms</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Contract Value (₹)" error={errors.contract_value}>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.contract_value}
                onChange={(e) => handleChange('contract_value', e.target.value)}
              />
            </FormField>

            <FormField label="Approved Budget (₹)" error={errors.approved_budget}>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.approved_budget}
                onChange={(e) => handleChange('approved_budget', e.target.value)}
              />
            </FormField>

            <FormField label="Billing Method" error={errors.billing_method_id}>
              <Select
                options={[{ value: '', label: 'Select Method' }, ...toOpts(masters.billing_methods, 'name')]}
                value={form.billing_method_id}
                onChange={(v) => handleChange('billing_method_id', v)}
              />
            </FormField>

            <FormField label="Retention Percentage (%)" error={errors.retention_percentage}>
              <Input
                type="number"
                step="0.01"
                placeholder="5"
                value={form.retention_percentage}
                onChange={(e) => handleChange('retention_percentage', e.target.value)}
              />
            </FormField>

            <FormField label="Tax / GST Rate (%)" error={errors.tax_percentage}>
              <Input
                type="number"
                step="0.01"
                placeholder="18"
                value={form.tax_percentage}
                onChange={(e) => handleChange('tax_percentage', e.target.value)}
              />
            </FormField>

            <FormField label="Currency Code" error={errors.currency_code}>
              <Input
                value={form.currency_code}
                onChange={(e) => handleChange('currency_code', e.target.value)}
                placeholder="INR"
              />
            </FormField>
          </div>
        </Card>

        {/* Section 4: Description & Notes */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span>Scope Description & Notes</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Scope of Work / Description" error={errors.description}>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe project deliverables, site location context, and scope..."
              />
            </FormField>

            <FormField label="Internal Notes & Remarks" error={errors.notes}>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special handling instructions, client agreements, or conditions..."
              />
            </FormField>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/projects')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={saving}
          >
            Save Project
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
