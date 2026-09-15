import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, materialManagementApi, sitesApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export const parseSpecification = (specStr) => {
  if (!specStr || typeof specStr !== 'string') return { brand: '', size: '', variant: '' };
  let brand = '';
  let size = '';
  let variant = '';

  const parts = specStr.split('|').map(s => s.trim());
  let hasLabel = false;
  parts.forEach(p => {
    if (/^brand:\s*/i.test(p)) {
      brand = p.replace(/^brand:\s*/i, '').trim();
      hasLabel = true;
    } else if (/^size:\s*/i.test(p)) {
      size = p.replace(/^size:\s*/i, '').trim();
      hasLabel = true;
    } else if (/^vari[ae]nt:\s*/i.test(p)) {
      variant = p.replace(/^vari[ae]nt:\s*/i, '').trim();
      hasLabel = true;
    }
  });

  if (!hasLabel) {
    variant = specStr.trim();
  }

  return { brand, size, variant };
};

export const formatSpecification = (brand, size, variant) => {
  const parts = [];
  if (brand && String(brand).trim()) parts.push(`Brand: ${String(brand).trim()}`);
  if (size && String(size).trim()) parts.push(`Size: ${String(size).trim()}`);
  if (variant && String(variant).trim()) parts.push(`Variant: ${String(variant).trim()}`);
  return parts.length > 0 ? parts.join(' | ') : '';
};

const EMPTY_ITEM = {
  material_id: '',
  brand: '',
  size: '',
  variant: '',
  supplier_id: '',
  requested_qty: '',
  uom_id: '',
  estimated_rate: '0'
};

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  request_date: new Date().toISOString().split('T')[0],
  required_by_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  priority_id: '',
  purpose: '',
  remarks: '',
  is_boq_required: false,
  items: [{ ...EMPTY_ITEM }]
};

export function MaterialRequestFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [requests, setRequests] = useState([]);

  // Load Projects & API Data
  useEffect(() => {
    setInitialLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.suppliers.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.requests.list().catch(() => ({ data: [] }))
    ]).then(([projRes, sitesRes, catRes, suppRes, mastersMatRes, reqRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const vList = suppRes?.data?.material_suppliers ?? suppRes?.material_suppliers ?? (Array.isArray(suppRes?.data) ? suppRes.data : Array.isArray(suppRes) ? suppRes : []);
      setVendors(Array.isArray(vList) ? vList : []);

      const mastersData = mastersMatRes?.data?.masters ?? mastersMatRes?.masters ?? {};
      const uList = mastersData?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const prioList = mastersData?.request_priorities ?? [];
      setPriorities(Array.isArray(prioList) ? prioList : []);

      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? [];
      setRequests(Array.isArray(rList) ? rList : []);

      if (id) {
        // Edit mode
        materialManagementApi.requests.get(id).then(res => {
          const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
          const reqItems = fullReq.items || [];
          let purposeVal = fullReq.purpose || '';
          let remarksVal = fullReq.remarks || '';
          if (!remarksVal && purposeVal.includes(' | Remarks: ')) {
            const parts = purposeVal.split(' | Remarks: ');
            purposeVal = parts[0];
            remarksVal = parts.slice(1).join(' | Remarks: ');
          }

          setForm({
            project_id: String(fullReq.project_id || ''),
            site_id: String(fullReq.site_id || ''),
            request_date: fullReq.request_date || new Date().toISOString().split('T')[0],
            required_by_date: fullReq.required_by_date || '',
            priority_id: String(fullReq.priority_id || ''),
            purpose: purposeVal,
            remarks: remarksVal,
            items: reqItems.length > 0 ? reqItems.map(i => {
              const parsed = parseSpecification(i.specification || i.specification_note || i.item_specification || '');
              return {
                id: i.id,
                material_id: String(i.material_id || ''),
                brand: i.brand || parsed.brand || '',
                size: i.size || parsed.size || '',
                variant: i.variant || parsed.variant || '',
                supplier_id: String(i.supplier_id || i.vendor_id || i.material_supplier_id || ''),
                requested_qty: String(i.requested_qty ?? ''),
                uom_id: String(i.uom_id || ''),
                estimated_rate: String(i.estimated_rate || '0')
              };
            }) : [{ ...EMPTY_ITEM }]
          });
        }).catch(() => {
          toast.error('Failed to load request details.');
        }).finally(() => {
            setInitialLoading(false);
        });
      } else {
        // Add mode: set defaults
        const defaultProj = parsedProjects[0]?.id ? String(parsedProjects[0].id) : '';
        const defaultSite = sList.find(s => String(s.project_id) === String(defaultProj))?.id ? String(sList.find(s => String(s.project_id) === String(defaultProj)).id) : (sList[0]?.id ? String(sList[0].id) : '');
        const defaultPriority = prioList[0]?.id ? String(prioList[0].id) : '1';
        
        setForm(prev => ({
          ...prev,
          project_id: defaultProj,
          site_id: defaultSite,
          priority_id: defaultPriority,
        }));
        setInitialLoading(false);
      }
    });
  }, [id]);

  const generateRefNumber = (dateStr) => {
    const datePart = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const existingCount = requests.filter(r => (r.request_no || '').includes(`MR-${datePart}`)).length;
    const seqPart = String(existingCount + 1).padStart(3, '0');
    return `MR-${datePart}-${seqPart}`;
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.project_id) errs.project_id = 'Project is required';
    if (!form.site_id) errs.site_id = 'Site location is required';
    if (!form.priority_id) errs.priority_id = 'Priority is required';
    
    const itemErrors = [];
    form.items.forEach((item, index) => {
      const itemErr = {};
      if (!item.material_id) itemErr.material_id = 'Material is required';
      if (!item.requested_qty || Number(item.requested_qty) <= 0) itemErr.requested_qty = 'Quantity must be > 0';
      if (Object.keys(itemErr).length > 0) {
        itemErrors[index] = itemErr;
      }
    });
    if (itemErrors.length > 0) {
      errs.items = itemErrors;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const preparedItems = form.items.map(item => {
        const mat = materials.find(m => String(m.id) === String(item.material_id));
        const composedSpec = formatSpecification(item.brand, item.size, item.variant) || null;
        const suppId = item.supplier_id ? Number(item.supplier_id) : null;
        return {
          material_id: Number(item.material_id),
          uom_id: Number(item.uom_id || mat?.uom_id || mat?.unit_id || mat?.base_uom_id || 1),
          requested_qty: Number(item.requested_qty),
          estimated_rate: Number(item.estimated_rate || 0),
          specification: composedSpec,
          specification_note: composedSpec,
          item_specification: composedSpec,
          brand: item.brand?.trim() || null,
          size: item.size?.trim() || null,
          variant: item.variant?.trim() || null,
          remarks: null,
          supplier_id: suppId,
          vendor_id: suppId,
          material_supplier_id: suppId,
          preferred_supplier_id: suppId
        };
      });

      const combinedPurpose = form.remarks 
        ? (form.purpose ? `${form.purpose} | Remarks: ${form.remarks}` : form.remarks)
        : (form.purpose || 'Site Material Requirement');

      if (id) {
        // Edit
        await materialManagementApi.requests.update(id, {
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_date: form.request_date || new Date().toISOString().split('T')[0],
          required_by_date: form.required_by_date || new Date().toISOString().split('T')[0],
          priority_id: Number(form.priority_id),
          purpose: combinedPurpose,
          remarks: form.remarks || ''
        });

        // Sync items
        const res = await materialManagementApi.requests.get(id);
        const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
        const origItems = fullReq.items || [];
        const origItemIds = origItems.map(i => i.id);
        const newItemIds = form.items.filter(i => i.id).map(i => i.id);

        const deletedIds = origItemIds.filter(itemId => !newItemIds.includes(itemId));
        for (const itemId of deletedIds) {
          await materialManagementApi.requests.removeItem(id, itemId);
        }

        for (const itemPayload of preparedItems) {
          const matchingOrig = form.items.find(i => i.material_id === String(itemPayload.material_id) && i.id);
          if (matchingOrig?.id) {
            await materialManagementApi.requests.updateItem(id, matchingOrig.id, itemPayload);
          } else {
            await materialManagementApi.requests.addItem(id, itemPayload);
          }
        }
        toast.success('Material request updated.');
      } else {
        // Add
        const autoRef = generateRefNumber(form.request_date);
        const headerRes = await materialManagementApi.requests.create({
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_no: autoRef,
          request_date: form.request_date || new Date().toISOString().split('T')[0],
          required_by_date: form.required_by_date || new Date().toISOString().split('T')[0],
          priority_id: Number(form.priority_id),
          purpose: combinedPurpose,
          remarks: form.remarks || '',
          items: preparedItems
        });

        const requestId = headerRes?.data?.material_request?.id ?? headerRes?.material_request?.id ?? headerRes?.id;
        
        if (requestId) {
          const createdItems = headerRes?.data?.material_request?.items ?? headerRes?.material_request?.items ?? [];
          if (!createdItems || createdItems.length === 0) {
            for (const itemPayload of preparedItems) {
              try {
                await materialManagementApi.requests.addItem(requestId, itemPayload);
              } catch (itemErr) {
                console.warn('Item addition notice:', itemErr);
              }
            }
          }
          try {
            await materialManagementApi.requests.action(requestId, 'submit');
          } catch (subErr) {
            console.warn('Auto-submit action notice:', subErr);
          }
        }
        toast.success('Material request submitted successfully.');
      }
      navigate('/materials/requests');
    } catch (err) {
      console.error('Material request submit error:', err);
      toast.error(err?.message || err?.data?.message || 'Failed to save material request. Check required fields.');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Requests', href: '/materials/requests' },
    { label: id ? 'Edit Request' : 'New Request' }
  ];

  if (initialLoading) {
    return (
      <PageContainer>
        <PageHeader title={id ? "Edit Material Request" : "New Material Request"} breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={id ? "Edit Material Request" : "New Material Request"} breadcrumbs={breadcrumbs} />
      <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
        <form id="mrn-form" onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Project & Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Parent Project" required error={errors.project_id}>
                    <Select
                        options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                        value={form.project_id}
                        onChange={(v) => handleFormChange('project_id', v)}
                    />
                    </FormField>

                    <FormField label="Site Location" required error={errors.site_id}>
                    <Select
                        options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                        value={form.site_id}
                        onChange={(v) => handleFormChange('site_id', v)}
                        placeholder="Select Site Location"
                    />
                    </FormField>
                </div>
            </div>

            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Urgency & Scope</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Priority Level" required error={errors.priority_id}>
                    <Select
                        options={priorities.map(p => ({ value: String(p.id), label: p.priority_name }))}
                        value={form.priority_id}
                        onChange={(v) => handleFormChange('priority_id', v)}
                        placeholder="Select Priority"
                    />
                    </FormField>

                    <FormField label="Expected Date">
                    <Input
                        type="date"
                        value={form.required_by_date}
                        onChange={(e) => handleFormChange('required_by_date', e.target.value)}
                    />
                    </FormField>

                    <FormField label="Purpose & Activity Scope" className="md:col-span-3">
                    <Textarea
                        rows={2}
                        value={form.purpose}
                        onChange={(e) => handleFormChange('purpose', e.target.value)}
                        placeholder="Describe specific work activity requiring these materials..."
                    />
                    </FormField>
                </div>
            </div>

            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Material Items List</h3>
              <div className="space-y-3">
                {form.items && form.items.map((item, idx) => {
                  const itemErr = errors.items?.[idx] || {};
                  return (
                    <div key={idx} className="bg-surface-muted/30 p-4 rounded-lg border border-border/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-12 gap-3 items-end">
                        {/* 1. Material Dropdown */}
                        <div className="sm:col-span-2 md:col-span-4 xl:col-span-4">
                          <FormField label={idx === 0 ? "Material" : ""} required error={itemErr.material_id}>
                            <Select
                              options={materials.map(m => ({ value: String(m.id), label: `${m.material_code} - ${m.material_name}` }))}
                              value={item.material_id}
                              onChange={(v) => {
                                const nextItems = [...form.items];
                                const mat = materials.find(m => String(m.id) === String(v));
                                nextItems[idx] = {
                                  ...nextItems[idx],
                                  material_id: v,
                                  uom_id: mat ? String(mat.base_uom_id || mat.unit_id || '') : '',
                                  estimated_rate: mat?.standard_rate ? String(mat.standard_rate) : '0'
                                };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="Select Material..."
                            />
                          </FormField>
                        </div>

                        {/* 2. Brand */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-2">
                          <FormField label={idx === 0 ? "Brand" : ""}>
                            <Input
                              value={item.brand || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], brand: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. Tata"
                            />
                          </FormField>
                        </div>

                        {/* 3. Size */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
                          <FormField label={idx === 0 ? "Size" : ""}>
                            <Input
                              value={item.size || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], size: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. 12mm"
                            />
                          </FormField>
                        </div>

                        {/* 4. Varient */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
                          <FormField label={idx === 0 ? "Varient" : ""}>
                            <Input
                              value={item.variant || ''}
                              onChange={(e) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], variant: e.target.value };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="e.g. Fe500D"
                            />
                          </FormField>
                        </div>

                        {/* 5. Vendor */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-2">
                          <FormField label={idx === 0 ? "Vendor" : ""}>
                            <Select
                              options={[
                                { value: '', label: 'Select Vendor...' },
                                ...vendors.map(v => ({ value: String(v.id), label: v.supplier_name || v.name || v.company_name || `Vendor #${v.id}` }))
                              ]}
                              value={item.supplier_id || ''}
                              onChange={(v) => {
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], supplier_id: v };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="Select Vendor..."
                            />
                          </FormField>
                        </div>

                        {/* 6. Required Quantity */}
                        <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
                          <FormField label={idx === 0 ? "Required Quantity" : ""} required error={itemErr.requested_qty}>
                            <Input
                              type="number"
                              step="any"
                              min="0.01"
                              value={item.requested_qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (Number(val) < 0) return;
                                const nextItems = [...form.items];
                                nextItems[idx] = { ...nextItems[idx], requested_qty: val };
                                handleFormChange('items', nextItems);
                              }}
                              placeholder="0.00"
                            />
                          </FormField>
                        </div>

                        {/* Action / Delete Button */}
                        <div className={`sm:col-span-1 md:col-span-2 xl:col-span-1 flex items-center justify-center ${idx === 0 ? 'sm:pb-0.5' : 'sm:pb-0'}`}>
                          {form.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                              onClick={() => {
                                const nextItems = form.items.filter((_, i) => i !== idx);
                                handleFormChange('items', nextItems);
                              }}
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const nextItems = [
                      ...form.items,
                      { ...EMPTY_ITEM }
                    ];
                    handleFormChange('items', nextItems);
                  }}
                  className="mt-3 text-xs"
                >
                  Add Another Item
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">General Remarks</h3>
                <FormField>
                    <Textarea
                        rows={3}
                        value={form.remarks || ''}
                        onChange={(e) => handleFormChange('remarks', e.target.value)}
                        placeholder="Enter any additional instructions or general remarks for this material request..."
                    />
                </FormField>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border bg-surface-muted/20 flex items-center justify-end gap-3">
             <Button type="button" variant="outline" onClick={() => navigate('/materials/requests')}>Cancel</Button>
             <Button type="submit" variant="primary" leftIcon={<Send className="w-4 h-4" />} isSubmitting={saving}>
               {id ? 'Update Material Request' : 'Submit Material Request'}
             </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
