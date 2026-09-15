import { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { boqApi, sitesApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

const EMPTY_FORM = {
  site_id: '',
  boq_name: '',
  boq_code: '',
  notes: '',
};

export function BoqFormModal({ isOpen, boq = null, defaultSiteId = null, onClose, onSaveSuccess }) {
  const isEditing = Boolean(boq?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sites, setSites] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingSites(true);
    sitesApi.list()
      .then((res) => {
        const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : []);
        setSites(Array.isArray(list) ? list : []);
      })
      .catch((err) => toast.error(err?.message || 'Unable to load sites.'))
      .finally(() => setLoadingSites(false));

    if (boq) {
      setForm({
        site_id: String(boq.site_id ?? ''),
        boq_name: boq.boq_name || boq.name || '',
        boq_code: boq.boq_code || boq.code || '',
        notes: boq.notes || '',
      });
    } else {
      const initialSiteId = defaultSiteId ? String(defaultSiteId) : '';
      setForm({
        ...EMPTY_FORM,
        site_id: initialSiteId,
      });
    }
    setErrors({});
  }, [isOpen, boq, defaultSiteId]);

  const change = (name, value) => {
    setForm((c) => {
      const next = { ...c, [name]: value };
      // Auto-generate BOQ code when site is selected if code is empty
      if (name === 'site_id' && value && !c.boq_code && !isEditing) {
        const selectedSite = sites.find((s) => String(s.id) === String(value));
        const prefix = selectedSite?.site_code ? selectedSite.site_code.replace(/[^A-Za-z0-9]/g, '') : 'SITE';
        next.boq_code = `BOQ-${prefix}-001`;
      }
      return next;
    });
    setErrors((c) => ({ ...c, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.site_id) next.site_id = 'Site is required.';
    if (!form.boq_name.trim()) next.boq_name = 'BOQ Name is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        site_id: Number(form.site_id),
        boq_name: form.boq_name.trim(),
        boq_code: form.boq_code.trim(),
        notes: form.notes.trim() || null,
        boq_date: new Date().toISOString().substring(0, 10),
      };

      if (isEditing) {
        await boqApi.update(boq.id, payload);
        toast.success('BOQ updated successfully.');
      } else {
        await boqApi.create(payload);
        toast.success('BOQ created successfully.');
      }
      onSaveSuccess?.();
      onClose?.();
    } catch (error) {
      setErrors(error?.errors ?? {});
      toast.error(error?.message || 'Failed to save BOQ.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const siteOptions = sites.map((s) => ({
    value: String(s.id),
    label: `${s.site_name || s.name} (${s.site_code || `#${s.id}`})`,
  }));

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header
        icon={FileSpreadsheet}
        title={isEditing ? 'Edit BOQ' : 'Create BOQ'}
        subtitle="Schedule of quantities for this site."
        onClose={onClose}
      />
      <form id="boq-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="BOQ Information">
            <EntityEditModal.Grid>
              <FormField label="Site" required error={errors.site_id}>
                <Select
                  value={form.site_id}
                  onChange={(v) => change('site_id', v)}
                  options={siteOptions}
                  placeholder="Select site"
                  disabled={isEditing || Boolean(defaultSiteId)}
                />
              </FormField>

              <FormField label="BOQ Name" required error={errors.boq_name}>
                <Input
                  value={form.boq_name}
                  onChange={(e) => change('boq_name', e.target.value)}
                  placeholder="e.g. Substructure & Civil Works"
                />
              </FormField>

              <FormField label="BOQ Code" error={errors.boq_code}>
                <Input
                  value={form.boq_code}
                  onChange={(e) => change('boq_code', e.target.value)}
                  placeholder="Auto-generated (e.g. BOQ-SITE-001)"
                />
              </FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Description / Notes" noBorder>
            <Textarea
              value={form.notes}
              onChange={(e) => change('notes', e.target.value)}
              placeholder="Add scope details or contractor remarks..."
              rows={3}
            />
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer
          formId="boq-form"
          submitLabel={isEditing ? 'Update BOQ' : 'Create BOQ'}
          onCancel={onClose}
          isSubmitting={saving || loadingSites}
        />
      </form>
    </EntityEditModal>
  );
}
