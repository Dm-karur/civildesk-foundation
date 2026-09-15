import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes, Plus, Edit, Trash2, Search, Filter, Layers,
  FileSpreadsheet, IndianRupee, Eye, Calculator, CheckCircle2,
  ListTree, SlidersHorizontal
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
import { boqApi, projectsApi, mastersApi } from '../../../api/apiservice';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.boq_items && Array.isArray(res.data.boq_items)) return res.data.boq_items;
  if (res?.data?.items && Array.isArray(res.data.items)) return res.data.items;
  if (res?.data?.boq_sections && Array.isArray(res.data.boq_sections)) return res.data.boq_sections;
  if (res?.data?.sections && Array.isArray(res.data.sections)) return res.data.sections;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  if (res?.items && Array.isArray(res.items)) return res.items;
  if (res?.boq_items && Array.isArray(res.boq_items)) return res.boq_items;
  if (res?.sections && Array.isArray(res.sections)) return res.sections;
  if (res?.boq_sections && Array.isArray(res.boq_sections)) return res.boq_sections;
  return [];
};



const EMPTY_FORM = {
  project_id: '',
  boq_id: '',
  section_id: '',
  item_code: '',
  item_name: '',
  uom_id: '1',
  work_category_id: '1',
  quantity: '0',
  rate: '0',
  amount: '0',
  wastage_percentage: '0',
  specification: '',
};

export function BoqItemsPage() {
  const [projects, setProjects] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [sections, setSections] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formSections, setFormSections] = useState([]);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedBoqId, setSelectedBoqId] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState('all');
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

  // Initial Load: Projects, BOQs, Masters
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      boqApi.list().catch(() => ({ data: { project_boqs: [] } })),
      mastersApi.all().catch(() => ({ data: {} })),
    ]).then(([pRes, bRes, mRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const bList = bRes?.data?.project_boqs ?? bRes?.project_boqs ?? (Array.isArray(bRes?.data) ? bRes.data : []);
      
      let uList = [];
      if (Array.isArray(mRes)) uList = mRes;
      else if (Array.isArray(mRes?.data)) uList = mRes.data;
      else if (Array.isArray(mRes?.data?.units_of_measurement)) uList = mRes.data.units_of_measurement;
      else if (Array.isArray(mRes?.data?.uoms)) uList = mRes.data.uoms;
      else if (Array.isArray(mRes?.units_of_measurement)) uList = mRes.units_of_measurement;
      else if (Array.isArray(mRes?.uoms)) uList = mRes.uoms;
      
      if (!uList || uList.length === 0) {
        uList = [{ id: 1, uom_code: 'Cu.M', uom_name: 'Cubic Metre' }, { id: 2, uom_code: 'Sq.M', uom_name: 'Square Metre' }, { id: 3, uom_code: 'MT', uom_name: 'Metric Tonne' }, { id: 4, uom_code: 'R.M', uom_name: 'Running Metre' }, { id: 5, uom_code: 'Nos', uom_name: 'Numbers' }];
      }

      setProjects(Array.isArray(pList) ? pList : []);
      setBoqs(Array.isArray(bList) ? bList : []);
      setUoms(uList);
    });
  }, []);

  // Fetch sections when BOQ selected
  useEffect(() => {
    if (selectedBoqId !== 'all') {
      boqApi.sections.list(Number(selectedBoqId)).then(res => {
        const list = extractArray(res);
        setSections(list);
      }).catch(() => setSections([]));
    } else {
      const boqsToFetch = boqs.filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId));
      if (boqsToFetch.length === 0) {
        setSections([]);
      } else {
        const promises = boqsToFetch.map(b => boqApi.sections.list(Number(b.id)).catch(() => null));
        Promise.all(promises).then(results => {
          let allSecs = [];
          results.forEach(res => {
            if (res) {
              const list = extractArray(res);
              allSecs = [...allSecs, ...list];
            }
          });
          setSections(allSecs);
        });
      }
    }
  }, [selectedBoqId, selectedProjectId, boqs]);

  // Fetch BOQ Items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedBoqId !== 'all') {
        const params = {};
        if (selectedSectionId !== 'all') params.section_id = selectedSectionId;
        const res = await boqApi.items.list(Number(selectedBoqId), params);
        const list = extractArray(res);
        const b = boqs.find(boq => String(boq.id) === String(selectedBoqId));
        const enhancedList = list.map(itm => ({
           ...itm,
           boq_name: itm.boq_name || b?.boq_name,
           boq_code: itm.boq_code || b?.boq_code,
           project_id: itm.project_id || b?.project_id,
           boq_id: itm.boq_id || b?.id
        }));
        setItems(enhancedList);
      } else {
        const boqsToFetch = boqs.filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId));
        if (boqsToFetch.length === 0) {
          setItems([]);
        } else {
          let allItems = [];
          for (const b of boqsToFetch) {
            try {
              const res = await boqApi.items.list(Number(b.id));
              const list = extractArray(res);
              const enhancedList = list.map(itm => ({
                 ...itm,
                 boq_name: itm.boq_name || b.boq_name,
                 boq_code: itm.boq_code || b.boq_code,
                 project_id: itm.project_id || b.project_id,
                 boq_id: itm.boq_id || b.id
              }));
              allItems = [...allItems, ...enhancedList];
            } catch (e) {}
          }
          if (selectedSectionId !== 'all') {
            allItems = allItems.filter(item => String(item.section_id) === String(selectedSectionId));
          }
          setItems(allItems);
        }
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBoqId, selectedSectionId, selectedProjectId, boqs]);

  useEffect(() => {
    fetchItems();
  }, [selectedBoqId, selectedSectionId, selectedProjectId, boqs, fetchItems]);

  // Fetch sections specifically for the modal form when the BOQ changes
  useEffect(() => {
    if (form.boq_id) {
      console.log('Fetching sections for BOQ:', form.boq_id);
      boqApi.sections.list(Number(form.boq_id)).then(res => {
        console.log('Sections response:', res);
        const list = extractArray(res);
        console.log('Extracted sections list:', list);
        setFormSections(list);
      }).catch((e) => {
        console.error('Failed to fetch sections:', e);
        setFormSections([]);
      });
    } else {
      setFormSections([]);
    }
  }, [form.boq_id]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableBoqs = boqs.filter(b => String(b.project_id) === String(defaultProj));
    const defaultBoq = selectedBoqId !== 'all' ? selectedBoqId : (availableBoqs[0]?.id ? String(availableBoqs[0].id) : (boqs[0]?.id ? String(boqs[0].id) : '1'));
    const availableSecs = sections.filter(s => String(s.boq_id) === String(defaultBoq));
    const defaultSec = selectedSectionId !== 'all' ? selectedSectionId : (availableSecs[0]?.id ? String(availableSecs[0].id) : (sections[0]?.id ? String(sections[0].id) : '1'));

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      boq_id: defaultBoq,
      section_id: defaultSec,
      item_code: `ITM-0${items.length + 1}`,
      quantity: '100',
      rate: '500',
      amount: '50000',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (itm) => {
    setForm({
      project_id: String(itm.project_id || '1'),
      boq_id: String(itm.boq_id || '1'),
      section_id: String(itm.section_id || '1'),
      item_code: itm.item_code || '',
      item_name: itm.item_name || '',
      uom_id: String(itm.uom_id || '1'),
      work_category_id: String(itm.work_category_id || '1'),
      quantity: String(itm.quantity || '0'),
      rate: String(itm.rate || '0'),
      amount: String(itm.amount || '0'),
      wastage_percentage: String(itm.wastage_percentage || '0'),
      specification: itm.specification || '',
    });
    setErrors({});
    setEditingItem(itm);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const q = Number(field === 'quantity' ? value : prev.quantity) || 0;
        const r = Number(field === 'rate' ? value : prev.rate) || 0;
        next.amount = String(q * r);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.item_name.trim()) errs.item_name = 'Item name is required';
    if (!form.item_code.trim()) errs.item_code = 'Item code is required';
    if (!form.boq_id) errs.boq_id = 'Target BOQ is required';
    if (!form.section_id) errs.section_id = 'Target Section is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedBoq = boqs.find(b => String(b.id) === String(form.boq_id));
      const selectedSec = sections.find(s => String(s.id) === String(form.section_id));
      const selectedUom = uoms.find(u => String(u.id) === String(form.uom_id));

      const payload = {
        project_id: Number(form.project_id || 1),
        boq_id: Number(form.boq_id),
        section_id: Number(form.section_id),
        uom_id: Number(form.uom_id || 1),
        work_category_id: Number(form.work_category_id || 1),
        item_code: form.item_code.trim(),
        item_name: form.item_name.trim(),
        quantity: Number(form.quantity || 0),
        rate: Number(form.rate || 0),
        amount: Number(form.amount || 0),
        wastage_percentage: Number(form.wastage_percentage || 0),
        specification: form.specification || null,
      };

      const newItemObj = {
        id: editingItem?.id || Date.now(),
        ...payload,
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        boq_code: selectedBoq?.boq_code || 'BOQ-001',
        boq_name: selectedBoq?.boq_name || 'Project BOQ',
        section_code: selectedSec?.section_code || 'SEC-01',
        section_name: selectedSec?.section_name || 'Civil Structure',
        uom_name: selectedUom?.uom_code || selectedUom?.uom_name || 'Cu.M',
      };

      try {
        if (editingItem?.id) {
          await boqApi.items.update(payload.boq_id, editingItem.id, payload);
          setItems(prev => prev.map(i => i.id === editingItem.id ? newItemObj : i));
          toast.success('BOQ item updated successfully.');
        } else {
          await boqApi.items.create(payload.boq_id, payload);
          setItems(prev => [newItemObj, ...prev]);
          toast.success('BOQ item added successfully.');
        }

        setIsAddOpen(false);
        setEditingItem(null);
      } catch (error) {
        console.error('API Error:', error);
        setErrors(error?.errors || {});
        toast.error(error?.message || 'Failed to save BOQ item. Target BOQ must be in draft state.');
      }
    } catch (error) {
      setErrors(error?.errors || {});
      toast.error(error?.message || 'Failed to save BOQ item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      await boqApi.items.remove(deleteItem.boq_id, deleteItem.id);
      setItems(prev => prev.filter(i => i.id !== deleteItem.id));
      toast.success('BOQ item deleted.');
    } catch (error) {
      toast.error('Failed to delete BOQ item.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter(itm => {
      if (selectedProjectId !== 'all' && String(itm.project_id) !== String(selectedProjectId)) return false;
      if (selectedBoqId !== 'all' && String(itm.boq_id) !== String(selectedBoqId)) return false;
      if (selectedSectionId !== 'all' && String(itm.section_id) !== String(selectedSectionId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (itm.item_code || '').toLowerCase();
        const name = (itm.item_name || '').toLowerCase();
        const secN = (itm.section_name || '').toLowerCase();
        const spec = (itm.specification || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !secN.includes(q) && !spec.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedProjectId, selectedBoqId, selectedSectionId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalAmount = useMemo(() => items.reduce((acc, i) => acc + Number(i.amount || 0), 0), [items]);
  const avgRate = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, i) => acc + Number(i.rate || 0), 0);
    return Math.round(sum / items.length);
  }, [items]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'BOQ Items' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="BOQ Line Items & Rate Analysis"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Line Items"
            value={items.length}
            status="primary"
            icon={<Boxes className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Sections"
            value={sections.length || 4}
            status="info"
            icon={<ListTree className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Average Unit Rate"
            value={`₹${avgRate.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<Calculator className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Measured Value"
            value={`₹${(totalAmount / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Hierarchy Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedBoqId('all');
                  setSelectedSectionId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All BOQs' },
                  ...boqs
                    .filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId))
                    .map(b => ({ value: String(b.id), label: `${b.boq_code} - ${b.boq_name}` }))
                ]}
                value={selectedBoqId}
                onChange={(val) => {
                  setSelectedBoqId(val);
                  setSelectedSectionId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Sections' },
                  ...sections.map(s => ({ value: String(s.id), label: `${s.section_code} - ${s.section_name}` }))
                ]}
                value={selectedSectionId}
                onChange={setSelectedSectionId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search item, code, spec..."
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
              Add Item
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
                  <th className="px-3 py-2 w-28">Item Code</th>
                  <th className="px-3 py-2">Item Description & Specification</th>
                  <th className="px-3 py-2 hidden md:table-cell">Section</th>
                  <th className="px-3 py-2 text-right w-24">Quantity</th>
                  <th className="px-3 py-2 text-center w-16">UOM</th>
                  <th className="px-3 py-2 text-right w-24">Rate (₹)</th>
                  <th className="px-3 py-2 text-right w-28">Amount (₹)</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading BOQ items...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No BOQ items found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((itm, idx) => (
                    <tr key={itm.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                        <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                          {itm.item_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={itm.item_name}>
                            {itm.item_name}
                          </span>
                          <span className="text-[10px] text-text-muted line-clamp-1" title={itm.specification}>
                            {itm.specification || 'Standard construction item'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-text-primary text-[11px] font-medium truncate block" title={itm.section_name}>
                          {itm.section_name || 'Civil'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {Number(itm.quantity || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="neutral" className="text-[10px] font-mono px-1.5">
                          {itm.uom_name || itm.uom_code || 'Cu.M'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                        ₹{Number(itm.rate || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{Number(itm.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Item Details"
                            onClick={() => setViewingItem(itm)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Item"
                            onClick={() => handleOpenEdit(itm)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteItem(itm)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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
          {paged.map((itm, idx) => (
            <div key={itm.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{itm.item_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{itm.item_name}</h4>
                </div>
                <Badge variant="neutral" className="text-[10px] font-mono px-1.5 shrink-0">
                  {itm.uom_name || 'Cu.M'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Quantity & Rate</span>
                  <span className="font-mono text-text-primary text-[11px]">{Number(itm.quantity || 0).toLocaleString('en-IN')} × ₹{Number(itm.rate || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Amount</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{Number(itm.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(itm)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(itm)}>
                  <Edit className="w-3.5 h-3.5 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteItem(itm)}>
                  <Trash2 className="w-3.5 h-3.5 text-error" />
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

      {/* View Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.item_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.item_code} • {viewingItem.section_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Quantity</span> <span className="font-bold text-text-primary font-mono">{Number(viewingItem.quantity || 0).toLocaleString('en-IN')} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Unit Rate</span> <span className="font-mono font-bold text-text-primary">₹{Number(viewingItem.rate || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Amount</span> <span className="font-mono font-bold text-primary text-sm">₹{Number(viewingItem.amount || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Allowed Wastage</span> <span className="font-mono">{viewingItem.wastage_percentage || 0}%</span></div>
              </div>

              {viewingItem.specification && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Technical Specification & Mix Design:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{viewingItem.specification}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Boxes}
          title={editingItem ? 'Edit BOQ Item' : 'Add BOQ Line Item'}
          subtitle="Define bill of quantities measured items, rates, and technical specifications."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="item-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Hierarchy Mapping">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const b = boqs.find(item => String(item.project_id) === String(v));
                      if (b) handleFormChange('boq_id', String(b.id));
                    }}
                  />
                </FormField>

                <FormField label="Target BOQ" required error={errors.boq_id}>
                  <Select
                    options={boqs
                      .filter(b => !form.project_id || String(b.project_id) === String(form.project_id))
                      .map(b => ({ value: String(b.id), label: `${b.boq_code} - ${b.boq_name}` }))}
                    value={form.boq_id}
                    onChange={(v) => handleFormChange('boq_id', v)}
                  />
                </FormField>

                <FormField label="Target Section *" required error={errors.section_id}>
                  <Select
                    options={formSections.map(s => ({ value: String(s.id), label: `${s.section_code} - ${s.section_name}` }))}
                    value={form.section_id}
                    onChange={(v) => handleFormChange('section_id', v)}
                  />
                </FormField>

                <FormField label="Item Code" required error={errors.item_code}>
                  <Input
                    value={form.item_code}
                    onChange={(e) => handleFormChange('item_code', e.target.value)}
                    placeholder="e.g. ITM-0101-EXC"
                  />
                </FormField>

                <FormField label="Item Name & Title" required className="md:col-span-2" error={errors.item_name}>
                  <Input
                    value={form.item_name}
                    onChange={(e) => handleFormChange('item_name', e.target.value)}
                    placeholder="e.g. Earthwork Excavation for basement foundation"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Measurements, Rate & Valuation">
              <EntityEditModal.Grid>
                <FormField label="Unit of Measurement (UOM)">
                  <Select
                    options={uoms.map(u => ({ 
                      value: String(u.id || u.unit_id || u.uom_id || ''), 
                      label: u.uom_name || u.uom_code || u.name || u.code || u.unit_name || String(u.id || 'Unknown')
                    }))}
                    value={form.uom_id}
                    onChange={(v) => handleFormChange('uom_id', v)}
                  />
                </FormField>

                <FormField label="Measured Quantity">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => handleFormChange('quantity', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Rate (₹)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.rate}
                    onChange={(e) => handleFormChange('rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Amount (₹)">
                  <Input
                    type="number"
                    value={form.amount}
                    readOnly
                    className="bg-surface-muted font-bold text-primary"
                  />
                </FormField>

                <FormField label="Allowed Wastage %">
                  <Input
                    type="number"
                    step="0.1"
                    value={form.wastage_percentage}
                    onChange={(e) => handleFormChange('wastage_percentage', e.target.value)}
                  />
                </FormField>

                <FormField label="Detailed Specification & Scope" className="md:col-span-2">
                  <Textarea
                    rows={3}
                    value={form.specification}
                    onChange={(e) => handleFormChange('specification', e.target.value)}
                    placeholder="Comprehensive technical specifications, mix design, brand approvals..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="item-form"
            submitLabel={editingItem ? 'Update Item' : 'Create Item'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete BOQ Item"
        message={`Are you sure you want to delete "${deleteItem?.item_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
