import { useState, useEffect, useMemo } from 'react';
import {
  Layers, CheckCircle2, Clock, 
  Search, Eye, Edit, Trash2, Plus, 
  Printer, Droplets
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi, dailyReportsApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && typeof res.data === 'object') {
    for (const key in res.data) {
      if (Array.isArray(res.data[key])) return res.data[key];
    }
  }
  if (res && typeof res === 'object') {
    for (const key in res) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
};

const EMPTY_FORM = {
  project_id: '',
  report_id: '',
  material_id: '',
  issued_qty: '0',
  consumed_qty: '0',
  wasted_qty: '0',
  remarks: '',
};

export function DailyMaterialsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const projRes = await projectsApi.list();
      const pList = extractArray(projRes);
      setProjects(pList);

      const matRes = await materialsApi.catalogue.list();
      const mList = extractArray(matRes);
      setMaterials(mList);

      if (dailyReportsApi?.list) {
        const dprRes = await dailyReportsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
        const rList = extractArray(dprRes);
        setReports(rList);

        let allMaterials = [];
        for (const r of rList.slice(0, 20)) {
          try {
            const matConsRes = await dailyReportsApi.materialConsumption.list(r.id);
            const matList = extractArray(matConsRes);
            const withMeta = matList.map(m => ({ 
              ...m, 
              report_id: r.id, 
              project_id: r.project_id, 
              date: r.report_date, 
              project_code: r.project_code,
              site_name: r.site_name || 'Site',
              material_name: mList.find(x => String(x.id) === String(m.material_id))?.item_name || 
                             mList.find(x => String(x.id) === String(m.material_id))?.material_name ||
                             mList.find(x => String(x.id) === String(m.material_id))?.name ||
                             `Material #${m.material_id}`
            }));
            allMaterials = [...allMaterials, ...withMeta];
          } catch (e) { /* ignore */ }
        }
        setLogs(allMaterials);
      }
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      report_id: '',
      material_id: materials[0]?.id ? String(materials[0].id) : '1',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      report_id: String(item.report_id || ''),
      material_id: String(item.material_id || '1'),
      issued_qty: String(item.issued_qty || '0'),
      consumed_qty: String(item.consumed_qty || '0'),
      wasted_qty: String(item.wasted_qty || '0'),
      remarks: item.remarks || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.report_id) errs.report_id = 'Daily Report is required';
    if (!form.material_id) errs.material_id = 'Material is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        material_id: Number(form.material_id),
        uom_id: 1, // Fallback dummy ID to pass validation if missing
        source_type_id: 1, // 1 = Supplied
        issued_qty: Number(form.issued_qty || 0),
        consumed_qty: Number(form.consumed_qty || 0),
        wasted_qty: Number(form.wasted_qty || 0),
        remarks: form.remarks,
      };

      if (editingItem?.id) {
        await dailyReportsApi.materialConsumption.update(form.report_id, editingItem.id, payload);
        toast.success('Material consumption updated.');
      } else {
        await dailyReportsApi.materialConsumption.create(form.report_id, payload);
        toast.success('Material consumption logged.');
      }

      loadData();
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
        toast.error(Object.values(err.errors).flat().join('\n') || 'Validation failed.');
      } else {
        toast.error(err?.message || 'Failed to save material log.');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id || !deleteItem?.report_id) return;
    try {
      await dailyReportsApi.materialConsumption.remove(deleteItem.report_id, deleteItem.id);
      toast.success('Material log removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to remove material log.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const mat = String(l.material_name || '').toLowerCase();
        if (!mat.includes(s)) return false;
      }
      return true;
    });
  }, [logs, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <PageContainer>
      <PageHeader
        title="Daily Material Consumption"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Daily Site Operations', href: '/daily-operations/reports' },
          { label: 'Material Usage' }
        ]}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Logs"
            value={`${logs.length}`}
            status="primary"
            icon={<Layers className="w-4 h-4" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Log Consumption
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
                onItemsPerPageChange={() => { }}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2">Site & Date</th>
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2 text-center w-20">Issued</th>
                  <th className="px-3 py-2 text-center w-20">Consumed</th>
                  <th className="px-3 py-2 text-center w-20">Wasted</th>
                  <th className="px-3 py-2 w-48">Remarks</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">Loading...</td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">No data found.</td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + idx + 1}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[11px] block">{l.site_name}</span>
                        <span className="text-[10px] text-text-muted">{l.date}</span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-text-primary text-[11px]">{l.material_name}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-[11px]">{l.issued_qty}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600">{l.consumed_qty}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-red-500">{l.wasted_qty}</td>
                      <td className="px-3 py-2 text-text-secondary truncate max-w-[200px]" title={l.remarks}>{l.remarks || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleOpenEdit(l)}>
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setDeleteItem(l); confirmDelete(); }}>
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-500" />
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
      </div>

      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Droplets}
          title={editingItem ? 'Edit Consumption Log' : 'Log Material Consumption'}
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Report & Material Details">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>
                <FormField label="Daily Site Report (Site Context)" required error={errors.report_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Daily Report...' },
                      ...reports.filter(r => String(r.project_id) === form.project_id).map(r => ({ value: String(r.id), label: `${r.report_date} - ${r.site_name || 'Report'}` }))
                    ]}
                    value={form.report_id}
                    onChange={(v) => handleFormChange('report_id', v)}
                    disabled={!form.project_id}
                  />
                </FormField>
                <FormField label="Material" required error={errors.material_id} className="md:col-span-2">
                  <Select
                    options={[
                      { value: '', label: 'Select Material...' },
                      ...materials.map(m => ({ value: String(m.id), label: m.item_name || m.material_name || m.name || `Material #${m.id}` }))
                    ]}
                    value={form.material_id}
                    onChange={(v) => handleFormChange('material_id', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Quantities">
              <EntityEditModal.Grid>
                <FormField label="Issued Qty">
                  <Input type="number" value={form.issued_qty} onChange={(e) => handleFormChange('issued_qty', e.target.value)} />
                </FormField>
                <FormField label="Consumed Qty">
                  <Input type="number" value={form.consumed_qty} onChange={(e) => handleFormChange('consumed_qty', e.target.value)} />
                </FormField>
                <FormField label="Wasted Qty">
                  <Input type="number" value={form.wasted_qty} onChange={(e) => handleFormChange('wasted_qty', e.target.value)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Additional Notes">
              <FormField label="Remarks">
                <Textarea value={form.remarks} onChange={(e) => handleFormChange('remarks', e.target.value)} rows={3} />
              </FormField>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button variant="outline" type="button" onClick={() => { setIsAddOpen(false); setEditingItem(null); }} disabled={saving}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {saving ? 'Saving...' : 'Save Log'}
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
