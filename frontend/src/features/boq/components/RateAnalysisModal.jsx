import { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { boqApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../components/composite/Toast';
import clsx from 'clsx';

const COMPONENT_TYPES = [
  { value: '1', label: 'Material' },
  { value: '2', label: 'Labour' },
  { value: '3', label: 'Machinery/Equipment' },
  { value: '4', label: 'Subcontract' },
  { value: '5', label: 'Overheads & Profit' }
];

export function RateAnalysisModal({ isOpen, item, onClose }) {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New component form state
  const [form, setForm] = useState({
    component_type_id: '1',
    component_name: '',
    quantity_factor: '1',
    component_rate: '0',
    remarks: ''
  });

  const fetchComponents = () => {
    if (!item?.boq_id || !item?.id) return;
    setLoading(true);
    boqApi.rateComponents.list(item.boq_id, item.id)
      .then(res => {
        const list = res?.data?.rate_components ?? [];
        setComponents(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error('Failed to load rate components'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && item) {
      fetchComponents();
      setForm({ component_type_id: '1', component_name: '', quantity_factor: '1', component_rate: '0', remarks: '' });
    }
  }, [isOpen, item]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.component_name.trim()) {
      toast.error('Component name is required');
      return;
    }
    
    setSaving(true);
    try {
      await boqApi.rateComponents.create(item.boq_id, item.id, {
        component_type_id: Number(form.component_type_id),
        component_name: form.component_name,
        quantity_factor: Number(form.quantity_factor || 1),
        component_rate: Number(form.component_rate || 0),
        remarks: form.remarks
      });
      toast.success('Rate component added.');
      setForm({ component_type_id: '1', component_name: '', quantity_factor: '1', component_rate: '0', remarks: '' });
      fetchComponents();
    } catch (err) {
      toast.error(err?.message || 'Failed to add component. Ensure BOQ is in Draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (comp) => {
    try {
      await boqApi.rateComponents.remove(item.boq_id, item.id, comp.id);
      toast.success('Component removed.');
      fetchComponents();
    } catch (err) {
      toast.error('Failed to remove component.');
    }
  };

  const totalRate = components.reduce((acc, c) => acc + (Number(c.quantity_factor || 1) * Number(c.component_rate || 0)), 0);

  if (!isOpen || !item) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose} size="lg">
      <EntityEditModal.Header 
        icon={Calculator} 
        title="Rate Analysis" 
        subtitle={`Item: ${item.item_code} - ${item.item_name}`} 
        onClose={onClose} 
      />
      
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Current Components">
            {loading ? (
              <div className="text-sm text-text-secondary">Loading...</div>
            ) : components.length === 0 ? (
              <div className="text-sm text-text-secondary italic">No rate components found. Add one below.</div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-text-secondary uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2 text-right">Factor (Qty)</th>
                      <th className="px-3 py-2 text-right">Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {components.map(c => {
                      const amount = Number(c.quantity_factor || 1) * Number(c.component_rate || 0);
                      const typeLabel = COMPONENT_TYPES.find(t => String(t.value) === String(c.component_type_id))?.label || 'Other';
                      return (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">{typeLabel}</td>
                          <td className="px-3 py-2 text-white font-medium">{c.component_name}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{c.quantity_factor}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{Number(c.component_rate).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-right font-medium text-emerald-400">{amount.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => handleDelete(c)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-surface-muted/50 font-bold border-t border-border">
                      <td colSpan={4} className="px-3 py-2 text-right text-white">Derived Unit Rate:</td>
                      <td className="px-3 py-2 text-right text-emerald-400">₹{totalRate.toLocaleString('en-IN')}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </EntityEditModal.Section>

          <EntityEditModal.Section title="Add New Component">
            <EntityEditModal.Grid>
              <FormField label="Type" required>
                <Select 
                  options={COMPONENT_TYPES} 
                  value={form.component_type_id}
                  onChange={(v) => setForm(p => ({ ...p, component_type_id: v }))} 
                />
              </FormField>
              <FormField label="Description/Name" required className="md:col-span-2">
                <Input 
                  value={form.component_name} 
                  onChange={(e) => setForm(p => ({ ...p, component_name: e.target.value }))}
                  placeholder="e.g. Skilled Labour, Cement OPC 43 Grade" 
                />
              </FormField>
              <FormField label="Qty Factor" required>
                <Input 
                  type="number" step="0.01" 
                  value={form.quantity_factor} 
                  onChange={(e) => setForm(p => ({ ...p, quantity_factor: e.target.value }))} 
                />
              </FormField>
              <FormField label="Unit Rate (₹)" required>
                <Input 
                  type="number" step="0.01" 
                  value={form.component_rate} 
                  onChange={(e) => setForm(p => ({ ...p, component_rate: e.target.value }))} 
                />
              </FormField>
            </EntityEditModal.Grid>
            <div className="mt-3 flex justify-end">
              <Button 
                variant="primary" 
                size="sm" 
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAdd}
                disabled={saving}
              >
                Add Component
              </Button>
            </div>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
      </div>
      
      <div className="p-4 border-t border-border bg-surface flex justify-end">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </EntityEditModal>
  );
}
