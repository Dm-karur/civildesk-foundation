import { useState, useEffect, useMemo } from 'react';
import {
  Truck, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Fuel
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  asset_name: '',
  ownership_type: 'Rental (Heavy Plant Lease)',
  vendor_name: '',
  operating_hours: '200',
  rental_cost: '500000',
  fuel_cost: '200000',
  maintenance_cost: '30000',
  total_operating_cost: '730000',
  notes: '',
};

export function EquipmentCostsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [equipmentCosts, setEquipmentCosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_finance_EquipmentCostsPage');
      if (saved) {
        setEquipmentCosts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_finance_EquipmentCostsPage');
    if (equipmentCosts.length > 0 || saved) {
       localStorage.setItem('mock_finance_EquipmentCostsPage', JSON.stringify(equipmentCosts));
    }
  }, [equipmentCosts]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      asset_name: item.asset_name || '',
      ownership_type: item.ownership_type || 'Rental (Heavy Plant Lease)',
      vendor_name: item.vendor_name || '',
      operating_hours: String(item.operating_hours || '200'),
      rental_cost: String(item.rental_cost || '500000'),
      fuel_cost: String(item.fuel_cost || '200000'),
      maintenance_cost: String(item.maintenance_cost || '30000'),
      total_operating_cost: String(item.total_operating_cost || '730000'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'rental_cost' || field === 'fuel_cost' || field === 'maintenance_cost') {
        const rnt = Number(field === 'rental_cost' ? value : prev.rental_cost) || 0;
        const fl = Number(field === 'fuel_cost' ? value : prev.fuel_cost) || 0;
        const mt = Number(field === 'maintenance_cost' ? value : prev.maintenance_cost) || 0;
        next.total_operating_cost = String(rnt + fl + mt);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.asset_name.trim()) errs.asset_name = 'Machinery asset name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const hrs = Number(form.operating_hours || 0);
      const rnt = Number(form.rental_cost || 0);
      const fl = Number(form.fuel_cost || 0);
      const mt = Number(form.maintenance_cost || 0);
      const tot = rnt + fl + mt;
      const cph = hrs > 0 ? Math.round(tot / hrs) : 0;

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        asset_name: form.asset_name,
        ownership_type: form.ownership_type,
        vendor_name: form.vendor_name || 'Internal Asset',
        operating_hours: hrs,
        rental_cost: rnt,
        fuel_cost: fl,
        maintenance_cost: mt,
        total_operating_cost: tot,
        cost_per_hour: cph,
        status: 'Active (Daily Logged)',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setEquipmentCosts(prev => prev.map(e => e.id === editingItem.id ? newItem : e));
        toast.success('Equipment cost record updated.');
      } else {
        setEquipmentCosts(prev => [newItem, ...prev]);
        toast.success('Machinery cost record registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save equipment cost item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setEquipmentCosts(prev => prev.filter(e => e.id !== deleteItem.id));
    toast.success('Equipment record removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return equipmentCosts.filter(e => {
      if (selectedProjectId !== 'all' && String(e.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const ast = String(e.asset_name || '').toLowerCase();
        const vnd = String(e.vendor_name || '').toLowerCase();
        const proj = String(e.project_name || '').toLowerCase();
        if (!ast.includes(str) && !vnd.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [equipmentCosts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalOperatingCost = useMemo(() => equipmentCosts.reduce((acc, e) => acc + Number(e.total_operating_cost || 0), 0), [equipmentCosts]);
  const totalRentalSpent = useMemo(() => equipmentCosts.reduce((acc, e) => acc + Number(e.rental_cost || 0), 0), [equipmentCosts]);
  const totalFuelSpent = useMemo(() => equipmentCosts.reduce((acc, e) => acc + Number(e.fuel_cost || 0), 0), [equipmentCosts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Equipment & Machinery Costs' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Heavy Machinery & Equipment Rental, Fuel & Maintenance Costs"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Machinery Operating Cost"
            value={`₹${(totalOperatingCost / 100000).toFixed(2)}L`}
            status="primary"
            icon={<Truck className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Machinery Lease & Rentals"
            value={`₹${(totalRentalSpent / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="High-Speed Diesel (HSD) Fuel"
            value={`₹${(totalFuelSpent / 100000).toFixed(2)}L`}
            status="warning"
            icon={<Fuel className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Fleet Logsheet Audit"
            value="100% Verified"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search machinery asset, vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Equipment Ledger"
            >
              Print Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Equipment Log
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
                onItemsPerPageChange={() => {}}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2">Machinery Asset & Ownership</th>
                  <th className="px-3 py-2 text-center w-24">Hours</th>
                  <th className="px-3 py-2 text-right w-28">Rental Cost</th>
                  <th className="px-3 py-2 text-right w-28">Fuel (Diesel)</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Maintenance</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-emerald-600">Total Cost</th>
                  <th className="px-3 py-2 text-right w-24 font-mono">Cost/Hour</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading equipment cost ledger...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No equipment cost records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={e.asset_name}>
                            {e.asset_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {e.ownership_type} • {e.vendor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-primary">
                        {e.operating_hours} hrs
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{(e.rental_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-amber-600">
                        ₹{(e.fuel_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-text-muted">
                        ₹{(e.maintenance_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(e.total_operating_cost / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{e.cost_per_hour}/hr
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Equipment 360"
                            onClick={() => setViewingItem(e)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(e)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((e, idx) => (
            <div key={e.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{e.asset_name}</h4>
                  <span className="text-[11px] text-text-muted">{e.ownership_type}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(e.total_operating_cost / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Operating Hours</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{e.operating_hours} hrs</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Cost Per Hour</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{e.cost_per_hour}/hr</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(e)}>
                  <Eye className="w-3 h-3 mr-1" /> View Machinery Cost
                </Button>
              </div>
            </div>
          ))}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View Equipment 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.asset_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.ownership_type}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Operating Cost</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.total_operating_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Hourly Running Rate</span> <span className="font-bold text-primary font-mono text-base">₹{viewingItem.cost_per_hour}/hr</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Lease / Rental Spent</span> <span className="font-mono">₹{(viewingItem.rental_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Diesel Fuel Consumed</span> <span className="font-mono text-amber-600">₹{(viewingItem.fuel_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Maintenance & Spares</span> <span className="font-mono">₹{(viewingItem.maintenance_cost / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Equipment Hours</span> <span className="font-mono font-medium">{viewingItem.operating_hours} Hours</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Rental Vendor / Owner</span> <span className="text-text-primary font-medium">{viewingItem.vendor_name}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Logsheet Verification Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Equipment Cost Docket
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Truck}
          title={editingItem ? 'Edit Equipment Cost Item' : 'Add Machinery Cost Log'}
          subtitle="Record machinery rental charges, diesel fuel consumption, and maintenance expenses."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="eq-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Equipment Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Ownership Model">
                  <Select
                    options={[
                      { value: 'Rental (Heavy Plant Lease)', label: 'Rental (Heavy Plant Lease)' },
                      { value: 'Rental (Per Pour Basis)', label: 'Rental (Per Pour Basis)' },
                      { value: 'Company Owned Plant', label: 'Company Owned Plant' },
                    ]}
                    value={form.ownership_type}
                    onChange={(v) => handleFormChange('ownership_type', v)}
                  />
                </FormField>

                <FormField label="Machinery Asset Name" required error={errors.asset_name} className="md:col-span-2">
                  <Input
                    value={form.asset_name}
                    onChange={(e) => handleFormChange('asset_name', e.target.value)}
                    placeholder="e.g. Potain Tower Crane (50m Jib)"
                  />
                </FormField>

                <FormField label="Vendor / Fleet Ref" className="md:col-span-2">
                  <Input
                    value={form.vendor_name}
                    onChange={(e) => handleFormChange('vendor_name', e.target.value)}
                    placeholder="e.g. Apex Heavy Crane Rentals"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Operational Costs & Fuel">
              <EntityEditModal.Grid>
                <FormField label="Operating Hours (Hrs)" required>
                  <Input
                    type="number"
                    value={form.operating_hours}
                    onChange={(e) => handleFormChange('operating_hours', e.target.value)}
                  />
                </FormField>

                <FormField label="Rental / Lease Charges (₹)">
                  <Input
                    type="number"
                    value={form.rental_cost}
                    onChange={(e) => handleFormChange('rental_cost', e.target.value)}
                  />
                </FormField>

                <FormField label="High-Speed Diesel (HSD) Fuel (₹)">
                  <Input
                    type="number"
                    value={form.fuel_cost}
                    onChange={(e) => handleFormChange('fuel_cost', e.target.value)}
                  />
                </FormField>

                <FormField label="Maintenance & Repairs (₹)">
                  <Input
                    type="number"
                    value={form.maintenance_cost}
                    onChange={(e) => handleFormChange('maintenance_cost', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Operating Cost (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.total_operating_cost || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="eq-form"
            submitLabel={editingItem ? 'Update Machinery' : 'Save Machinery Cost'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Equipment Record"
        message={`Are you sure you want to delete "${deleteItem?.asset_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
