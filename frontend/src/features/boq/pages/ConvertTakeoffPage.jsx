import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft, CheckCircle2, Clock, Sparkles, IndianRupee,
  Search, Filter, Eye, ArrowRight, Layers, FileSpreadsheet,
  Boxes, Check, AlertCircle, RefreshCw
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
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, boqApi, request } from '../../../api/apiservice';

export function ConvertTakeoffPage() {
  const [projects, setProjects] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [sections, setSections] = useState([]);
  const [allTakeoffs, setAllTakeoffs] = useState([]);

  const items = useMemo(() => {
    return allTakeoffs
      .filter(r => r.status === 'Verified')
      .map(r => ({
         ...r,
         conversion_status: r.conversion_status || 'Ready to Convert',
         projected_rate: r.projected_rate || 500,
         projected_amount: (r.verified_quantity ?? r.measured_quantity ?? r.calculated_quantity ?? 0) * (r.projected_rate || 500),
      }));
  }, [allTakeoffs]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedBoqId, setSelectedBoqId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Convert Wizard Modal
  const [convertingItem, setConvertingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [form, setForm] = useState({
    project_id: '',
    boq_id: '',
    section_id: '',
    item_code: '',
    item_name: '',
    uom_name: '',
    quantity: '0',
    rate: '0',
    amount: '0',
    wastage_percentage: '2.0',
    specification: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchTakeoffs = async () => {
    setLoading(true);
    try {
      const res = await request.get('/boq-takeoffs');
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setAllTakeoffs(data.filter(t => t.status === 'approved' && !t.is_converted));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Load Projects and BOQs
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects || res?.projects || [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {});
    
    fetchTakeoffs();
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter(itm => {
      if (selectedProjectId !== 'all' && String(itm.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && itm.conversion_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (itm.takeoff_code || '').toLowerCase();
        const title = (itm.title || '').toLowerCase();
        const dwg = (itm.drawing_ref_no || '').toLowerCase();
        const spec = (itm.specification || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !dwg.includes(q) && !spec.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const readyCount = useMemo(() => items.filter(i => i.conversion_status === 'Ready to Convert').length, [items]);
  const convertedCount = useMemo(() => items.filter(i => i.conversion_status === 'Converted to BOQ').length, [items]);
  const totalValuation = useMemo(() => items.reduce((acc, i) => acc + Number(i.projected_amount || 0), 0), [items]);

  const handleOpenConvert = (itm) => {
    const defaultBoq = boqs.find(b => String(b.project_id) === String(itm.project_id)) || boqs[0];

    setForm({
      project_id: String(itm.project_id || '1'),
      boq_id: defaultBoq?.id ? String(defaultBoq.id) : '1',
      section_id: '1',
      item_code: `ITM-${itm.takeoff_code.replace('QTO-', '')}`,
      item_name: itm.title,
      uom_name: itm.uom_name,
      quantity: String(itm.verified_quantity),
      rate: String(itm.estimated_rate || 5000),
      amount: String(itm.projected_amount || itm.verified_quantity * 5000),
      wastage_percentage: '2.0',
      specification: itm.specification || itm.title,
    });
    setConvertingItem(itm);
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
  };

  const handleConfirmConvert = async () => {
    if (!convertingItem) return;
    setSaving(true);
    try {
      const payload = {
        takeoff_ids: [convertingItem.id],
        boq_section_name: form.section_name,
        boq_sub_section: form.sub_section
      };
      
      await request.post('/boq-takeoffs/convert', payload);
      
      toast.success(`Successfully converted ${convertingItem.takeoff_code} to BOQ line item.`);
      fetchTakeoffs();
      setConvertingItem(null);
    } catch {
      toast.error('Failed to convert takeoff to BOQ.');
    } finally {
      setSaving(false);
    }
  };

  const handleBatchConvert = () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one takeoff sheet to convert.');
      return;
    }

    setAllTakeoffs(prev => prev.map(i => {
      if (selectedIds.includes(i.id)) {
        return {
          ...i,
          conversion_status: 'Converted to BOQ',
          mapped_boq: 'Auto-Mapped BOQ',
        };
      }
      return i;
    }));

    toast.success(`Converted ${selectedIds.length} takeoff sheets to BOQ.`);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paged.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paged.map(i => i.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getStatusVariant = (status) => {
    if (status === 'Converted to BOQ') return 'success';
    if (status === 'Ready to Convert') return 'primary';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'Convert Takeoff to BOQ' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Convert Takeoff to BOQ Line Items"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Takeoff Sheets"
            value={items.length}
            status="primary"
            icon={<ArrowRightLeft className="w-4 h-4" />}
          />
          <KpiCard
            label="Ready for BOQ Conversion"
            value={readyCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Converted to BOQ"
            value={convertedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Projected Conversion Value"
            value={`₹${(totalValuation / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Target BOQ Selector Bar */}
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

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Ready to Convert', label: 'Ready to Convert' },
                  { value: 'Converted to BOQ', label: 'Converted to BOQ' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search takeoff, DWG#, spec..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {selectedIds.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleBatchConvert}
                className="text-xs h-8 shadow-xs"
              >
                Convert Selected ({selectedIds.length})
              </Button>
            )}
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
                  <th className="px-3 py-2 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === paged.length}
                      onChange={toggleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                  </th>
                  <th className="px-3 py-2 w-28">Takeoff Code</th>
                  <th className="px-3 py-2">Item Title & Drawing Ref</th>
                  <th className="px-3 py-2 text-right">Verified Quantity</th>
                  <th className="px-3 py-2 text-right w-24">Est. Rate (₹)</th>
                  <th className="px-3 py-2 text-right w-28">Total Amount (₹)</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading takeoff items...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No takeoff conversion records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((itm) => {
                    const isConverted = itm.conversion_status === 'Converted to BOQ';
                    const isSelected = selectedIds.includes(itm.id);

                    return (
                      <tr key={itm.id} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isConverted}
                            onChange={() => toggleSelect(itm.id)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {itm.takeoff_code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={itm.title}>
                              {itm.title}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate">
                              {itm.drawing_ref_no} • {itm.project_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[12px]">
                          {Number(itm.verified_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {itm.uom_name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                          ₹{Number(itm.estimated_rate || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                          ₹{Number(itm.projected_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(itm.conversion_status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {itm.conversion_status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Details"
                              onClick={() => setViewingItem(itm)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            {!isConverted ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] px-2 font-medium"
                                title="Convert to BOQ Item"
                                onClick={() => handleOpenConvert(itm)}
                              >
                                <Sparkles className="w-3 h-3 mr-1 text-primary" /> Convert
                              </Button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                                ✓ In BOQ
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((itm) => (
            <div key={itm.id} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{itm.takeoff_code} • {itm.drawing_ref_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{itm.title}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(itm.conversion_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {itm.conversion_status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Verified Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{Number(itm.verified_quantity || 0).toLocaleString('en-IN')} {itm.uom_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Projected Amount</span>
                  <span className="font-mono font-bold text-primary text-[11px]">₹{Number(itm.projected_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{itm.discipline}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(itm)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {itm.conversion_status !== 'Converted to BOQ' && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenConvert(itm)}>
                      <Sparkles className="w-3 h-3 mr-1" /> Convert
                    </Button>
                  )}
                </div>
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
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.takeoff_code} • {viewingItem.drawing_ref_no}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Verified Quantity</span> <span className="font-bold text-text-primary font-mono text-sm">{Number(viewingItem.verified_quantity || 0).toLocaleString('en-IN')} {viewingItem.uom_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Estimated Rate</span> <span className="font-mono font-bold text-text-primary">₹{Number(viewingItem.estimated_rate || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Projected Valuation</span> <span className="font-mono font-bold text-primary text-sm">₹{Number(viewingItem.projected_amount || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Discipline</span> <span className="font-semibold">{viewingItem.discipline}</span></div>
              </div>

              {viewingItem.specification && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Technical Specification & Scope:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{viewingItem.specification}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to BOQ Modal */}
      {convertingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Convert Takeoff to BOQ Line Item</h3>
                  <span className="text-[11px] font-mono text-text-muted">{convertingItem.takeoff_code} ➔ BOQ Item</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setConvertingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Target Project">
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Target BOQ Register">
                  <Select
                    options={boqs
                      .filter(b => !form.project_id || String(b.project_id) === String(form.project_id))
                      .map(b => ({ value: String(b.id), label: `${b.boq_code} - ${b.boq_name}` }))}
                    value={form.boq_id}
                    onChange={(v) => handleFormChange('boq_id', v)}
                  />
                </FormField>

                <FormField label="New BOQ Item Code">
                  <Input
                    value={form.item_code}
                    onChange={(e) => handleFormChange('item_code', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit of Measurement (UOM)">
                  <Input
                    value={form.uom_name}
                    readOnly
                    className="bg-surface-muted font-bold"
                  />
                </FormField>

                <FormField label="Measured Quantity" className="col-span-1">
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => handleFormChange('quantity', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Rate (₹)" className="col-span-1">
                  <Input
                    type="number"
                    value={form.rate}
                    onChange={(e) => handleFormChange('rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Item Valuation (₹)" className="col-span-2">
                  <Input
                    type="number"
                    value={form.amount}
                    readOnly
                    className="bg-surface-muted font-bold text-primary text-base"
                  />
                </FormField>

                <FormField label="Item Description & Specification" className="col-span-2">
                  <Textarea
                    rows={2}
                    value={form.specification}
                    onChange={(e) => handleFormChange('specification', e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConvertingItem(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={handleConfirmConvert}
                disabled={saving}
              >
                {saving ? 'Converting...' : 'Commit to BOQ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
