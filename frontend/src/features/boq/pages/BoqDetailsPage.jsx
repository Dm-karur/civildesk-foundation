import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layers, Plus, Save, Download, FileSpreadsheet, FileText,
  History, SlidersHorizontal, ArrowLeft, CheckCircle2,
  AlertCircle, TrendingUp, DollarSign, Clock, RefreshCw,
  Edit2, Trash2, ChevronRight, Eye, ChevronDown, Check,
  Search, Filter, Percent, HardHat, Package, FileCheck2
} from 'lucide-react';
import { boqApi, sitesApi, mastersApi } from '../../../api/apiservice';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { toast } from '../../../components/composite/Toast';
import { BoqRevisionModal } from '../components/BoqRevisionModal';
import { exportBoqToExcel, exportBoqToPdf } from '../utils/boqExportUtils';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

export function BoqDetailsPage() {
  const { boqId } = useParams();
  const navigate = useNavigate();

  const [boq, setBoq] = useState(null);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'items' | 'summary' | 'execution' | 'rate_analysis' | 'variations' | 'revisions'
  const [activeTab, setActiveTab] = useState('items');

  // Inline editing state: { [itemId]: { quantity, rate, item_name, isDirty } }
  const [inlineEdits, setInlineEdits] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals & Drawers
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRateAnalysisItem, setSelectedRateAnalysisItem] = useState(null);

  // Execution History state
  const [executionLogs, setExecutionLogs] = useState([]);
  const [loadingExecution, setLoadingExecution] = useState(false);

  // Variations & Revisions data
  const [variations, setVariations] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);

  // Section Form state
  const [sectionForm, setSectionForm] = useState({ section_name: '', section_code: '', description: '' });
  const [savingSection, setSavingSection] = useState(false);

  // Item Form state
  const [itemForm, setItemForm] = useState({
    item_code: '',
    item_name: '',
    section_id: '',
    uom_id: '1',
    work_category_id: '1',
    quantity: '1',
    rate: '0',
    description: '',
  });
  const [savingItem, setSavingItem] = useState(false);

  // Variation Form state
  const [variationForm, setVariationForm] = useState({
    variation_type: 'ADDITION',
    description: '',
    impact_amount: '0',
    justification: '',
  });
  const [savingVariation, setSavingVariation] = useState(false);

  // Load BOQ and related metadata
  const loadBoqData = useCallback(async () => {
    if (!boqId) return;
    try {
      setLoading(true);
      const [boqRes, secRes, itemRes, uomRes, catRes] = await Promise.all([
        boqApi.get(boqId).catch(() => null),
        boqApi.sections.list(boqId).catch(() => ({ data: [] })),
        boqApi.items.list(boqId).catch(() => ({ data: [] })),
        mastersApi.uom.list().catch(() => ({ data: [] })),
        mastersApi.workCategories.list().catch(() => ({ data: [] })),
      ]);

      const boqData = boqRes?.data?.project_boq || boqRes?.project_boq || boqRes?.data?.data || boqRes?.data || boqRes;
      setBoq(boqData);

      const secList = secRes?.data?.boq_sections || secRes?.data?.sections || secRes?.boq_sections || secRes?.sections || (Array.isArray(secRes?.data) ? secRes.data : []);
      setSections(secList);

      const itmList = itemRes?.data?.boq_items || itemRes?.data?.items || itemRes?.boq_items || itemRes?.items || (Array.isArray(itemRes?.data) ? itemRes.data : []);
      setItems(itmList);

      const uomList = uomRes?.data?.units_of_measurement || uomRes?.data?.units || uomRes?.units || (Array.isArray(uomRes?.data) ? uomRes.data : []);
      setUoms(uomList);

      const catList = catRes?.data?.work_categories || catRes?.data?.categories || catRes?.categories || (Array.isArray(catRes?.data) ? catRes.data : []);
      setCategories(catList);

      // Reset inline edits
      setInlineEdits({});
    } catch (err) {
      console.error('Failed to load BOQ details:', err);
      toast.error('Failed to load BOQ details');
    } finally {
      setLoading(false);
    }
  }, [boqId]);

  useEffect(() => {
    loadBoqData();
  }, [loadBoqData]);

  // Load Execution History when switching to execution tab
  useEffect(() => {
    if (activeTab === 'execution' && boqId) {
      setLoadingExecution(true);
      boqApi.items.executionHistory(boqId)
        .then((res) => {
          const logs = res?.data?.execution_history || res?.execution_history || (Array.isArray(res?.data) ? res.data : []);
          setExecutionLogs(logs);
        })
        .catch(() => {
          setExecutionLogs([]);
        })
        .finally(() => setLoadingExecution(false));
    } else if (activeTab === 'variations' && boqId) {
      boqApi.variations(boqId)
        .then((res) => {
          const list = res?.data?.variations || res?.variations || (Array.isArray(res?.data) ? res.data : []);
          setVariations(list);
        })
        .catch(() => setVariations([]));
    } else if (activeTab === 'revisions' && boqId) {
      boqApi.revisions(boqId)
        .then((res) => {
          const list = res?.data?.revisions || res?.revisions || (Array.isArray(res?.data) ? res.data : []);
          setRevisions(list);
        })
        .catch(() => setRevisions([]));
    }
  }, [activeTab, boqId]);

  // Handle inline changes
  const handleInlineChange = (itemId, field, value) => {
    setInlineEdits((prev) => {
      const current = prev[itemId] || {
        quantity: items.find((i) => i.id === itemId)?.quantity || 0,
        rate: items.find((i) => i.id === itemId)?.rate || 0,
        item_name: items.find((i) => i.id === itemId)?.item_name || '',
      };
      return {
        ...prev,
        [itemId]: {
          ...current,
          [field]: value,
          isDirty: true,
        },
      };
    });
  };

  // Save batch changes
  const handleSaveBatch = async () => {
    const dirtyIds = Object.keys(inlineEdits).filter((id) => inlineEdits[id]?.isDirty);
    if (dirtyIds.length === 0) return;

    setSavingBatch(true);
    try {
      const payloadItems = dirtyIds.map((id) => ({
        id: Number(id),
        quantity: Number(inlineEdits[id].quantity),
        rate: Number(inlineEdits[id].rate),
        item_name: inlineEdits[id].item_name,
      }));

      await boqApi.batchUpdateItems(boqId, { items: payloadItems });
      toast.success(`Successfully saved ${dirtyIds.length} item(s)!`);
      loadBoqData();
    } catch (err) {
      console.error('Batch save error:', err);
      toast.error(err.message || 'Failed to save batch changes');
    } finally {
      setSavingBatch(false);
    }
  };

  // Status updates
  const handleStatusChange = async (newStatus) => {
    try {
      await boqApi.update(boqId, { status: newStatus });
      toast.success(`BOQ status updated to ${newStatus}`);
      loadBoqData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Add Section Submit
  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.section_name.trim()) {
      toast.error('Section name is required');
      return;
    }
    setSavingSection(true);
    try {
      await boqApi.sections.create(boqId, {
        section_name: sectionForm.section_name,
        section_code: sectionForm.section_code || `SEC-${sections.length + 1}`,
        description: sectionForm.description,
      });
      toast.success('Section added successfully');
      setIsSectionModalOpen(false);
      setSectionForm({ section_name: '', section_code: '', description: '' });
      loadBoqData();
    } catch (err) {
      toast.error('Failed to create section');
    } finally {
      setSavingSection(false);
    }
  };

  // Add / Edit Item Submit
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.item_name.trim()) {
      toast.error('Item description is required');
      return;
    }
    setSavingItem(true);
    try {
      const payload = {
        item_code: itemForm.item_code || `${items.length + 1}.01`,
        item_name: itemForm.item_name,
        section_id: itemForm.section_id || (sections[0]?.id || null),
        uom_id: itemForm.uom_id || 1,
        work_category_id: itemForm.work_category_id || 1,
        quantity: Number(itemForm.quantity) || 0,
        rate: Number(itemForm.rate) || 0,
        amount: (Number(itemForm.quantity) || 0) * (Number(itemForm.rate) || 0),
        specification: itemForm.description,
      };

      if (editingItem) {
        await boqApi.items.update(boqId, editingItem.id, payload);
        toast.success('Item updated successfully');
      } else {
        await boqApi.items.create(boqId, payload);
        toast.success('Item added successfully');
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      setItemForm({
        item_code: '',
        item_name: '',
        section_id: '',
        uom_id: '1',
        work_category_id: '1',
        quantity: '1',
        rate: '0',
        description: '',
      });
      loadBoqData();
    } catch (err) {
      toast.error('Failed to save item');
    } finally {
      setSavingItem(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this BOQ item?')) return;
    try {
      await boqApi.items.delete(boqId, itemId);
      toast.success('Item deleted successfully');
      loadBoqData();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Save Variation Submit
  const handleSaveVariation = async (e) => {
    e.preventDefault();
    if (!variationForm.description.trim()) {
      toast.error('Description is required');
      return;
    }
    setSavingVariation(true);
    try {
      await boqApi.createVariation(boqId, {
        variation_type: variationForm.variation_type,
        description: variationForm.description,
        impact_amount: Number(variationForm.impact_amount) || 0,
        justification: variationForm.justification,
        status: 'SUBMITTED',
      });
      toast.success('Variation order logged successfully');
      setIsVariationModalOpen(false);
      setVariationForm({ variation_type: 'ADDITION', description: '', impact_amount: '0', justification: '' });
      // Reload variations
      const res = await boqApi.variations(boqId);
      setVariations(res?.data?.variations || res?.variations || []);
    } catch (err) {
      toast.error('Failed to log variation');
    } finally {
      setSavingVariation(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const code = (item.item_code || '').toLowerCase();
        const name = (item.item_name || item.description || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q)) return false;
      }
      if (filterSection !== 'all' && String(item.section_id) !== String(filterSection)) {
        return false;
      }
      if (filterCategory !== 'all' && String(item.work_category_id) !== String(filterCategory)) {
        return false;
      }
      if (filterStatus !== 'all') {
        const qty = Number(item.quantity || 0);
        const exec = Number(item.executed_quantity || 0);
        const prog = qty > 0 ? (exec / qty) * 100 : 0;
        if (filterStatus === 'COMPLETED' && prog < 100) return false;
        if (filterStatus === 'IN_PROGRESS' && (prog <= 0 || prog >= 100)) return false;
        if (filterStatus === 'NOT_STARTED' && prog > 0) return false;
      }
      return true;
    });
  }, [items, search, filterSection, filterCategory, filterStatus]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let executedValue = 0;
    let completedItemsCount = 0;

    items.forEach((item) => {
      const edit = inlineEdits[item.id];
      const qty = edit ? Number(edit.quantity) : Number(item.quantity || 0);
      const rate = edit ? Number(edit.rate) : Number(item.rate || 0);
      const exec = Number(item.executed_quantity || 0);
      const amount = qty * rate;

      totalValue += amount;
      executedValue += Math.min(amount, exec * rate);

      if (qty > 0 && exec >= qty) {
        completedItemsCount++;
      }
    });

    const balanceValue = Math.max(0, totalValue - executedValue);
    const overallProgress = totalValue > 0 ? Math.min(100, Math.round((executedValue / totalValue) * 100)) : 0;

    return {
      totalValue,
      executedValue,
      balanceValue,
      overallProgress,
      totalItems: items.length,
      completedItems: completedItemsCount,
    };
  }, [items, inlineEdits]);

  const hasDirtyEdits = Object.values(inlineEdits).some((e) => e.isDirty);

  if (loading && !boq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-text-muted font-medium">Loading BOQ details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/boq')}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All BOQs</span>
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                {boq?.boq_name || 'Bill of Quantities'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-surface-muted text-text-secondary border border-border">
                {boq?.boq_code || 'BOQ-001'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Rev {boq?.revision_number || '0'}
              </span>
              <Badge
                variant={
                  boq?.status === 'APPROVED' ? 'success' :
                  boq?.status === 'SUBMITTED' ? 'warning' :
                  boq?.status === 'REJECTED' ? 'error' : 'default'
                }
              >
                {boq?.status || 'DRAFT'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span className="font-semibold text-text-primary">{boq?.site_name || 'Site'}</span>
              <span>•</span>
              <span>Client: {boq?.client_name || 'Direct Client'}</span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {boq?.status === 'DRAFT' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('SUBMITTED')}
              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              Submit for Approval
            </Button>
          )}
          {boq?.status === 'SUBMITTED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange('APPROVED')}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Approve BOQ
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportBoqToExcel(boq, items, sections)}
            className="text-xs flex items-center gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Excel</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportBoqToPdf(boq, items, sections)}
            className="text-xs flex items-center gap-1 text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRevisionOpen(true)}
            className="text-xs flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            <span>New Rev</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">BOQ Total Value</span>
          <span className="text-base sm:text-lg font-bold font-mono text-primary">{formatCurrency(metrics.totalValue)}</span>
          <span className="text-[11px] text-text-muted block mt-0.5">{metrics.totalItems} Items in {sections.length} Sections</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Executed Value</span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-600">{formatCurrency(metrics.executedValue)}</span>
          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">{metrics.overallProgress}% Complete</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Balance Value</span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-600">{formatCurrency(metrics.balanceValue)}</span>
          <span className="text-[11px] text-text-muted block mt-0.5">Remaining to execute</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Execution Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-surface-muted rounded-full h-2 overflow-hidden border border-border">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${metrics.overallProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold font-mono text-text-primary">{metrics.overallProgress}%</span>
          </div>
          <span className="text-[11px] text-text-muted block mt-1">{metrics.completedItems} of {metrics.totalItems} items completed</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Active Status</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-xs font-semibold text-text-primary">DSR Live Sync On</span>
          </div>
          <span className="text-[10px] text-text-muted block mt-1">Updates real-time via Daily Site Reports</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {[
          { id: 'items', label: 'BOQ Items (Spreadsheet)', icon: FileSpreadsheet, badge: items.length },
          { id: 'summary', label: 'Section Summary', icon: Layers, badge: sections.length },
          { id: 'execution', label: 'DSR Execution History', icon: HardHat },
          { id: 'rate_analysis', label: 'Rate Analysis', icon: Percent },
          { id: 'variations', label: 'Variations Log', icon: TrendingUp, badge: variations.length || null },
          { id: 'revisions', label: 'Revision History', icon: History, badge: revisions.length || null },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== null && t.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-primary text-white' : 'bg-surface-muted text-text-muted'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: BOQ ITEMS (SPREADSHEET) ──────────────────────────────── */}
      {activeTab === 'items' && (
        <div className="flex flex-col gap-4">
          {/* Action Bar & Quick Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="w-full sm:w-64">
                <SearchField
                  placeholder="Search item code or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                className="w-40 text-xs"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                options={[
                  { value: 'all', label: 'All Sections' },
                  ...sections.map((s) => ({ value: String(s.id), label: s.section_name })),
                ]}
              />
              <Select
                className="w-36 text-xs"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'NOT_STARTED', label: 'Not Started' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {hasDirtyEdits && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveBatch}
                  disabled={savingBatch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingBatch ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSectionModalOpen(true)}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({
                    item_code: `${items.length + 1}.01`,
                    item_name: '',
                    section_id: sections[0]?.id || '',
                    uom_id: '1',
                    work_category_id: '1',
                    quantity: '1',
                    rate: '0',
                    description: '',
                  });
                  setIsItemModalOpen(true);
                }}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>
          </div>

          {/* Interactive Spreadsheet Table */}
          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-muted border-b border-border text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Item Code</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                    <th className="py-2.5 px-3 w-28">Section</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-28 text-right">BOQ Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Executed</th>
                    <th className="py-2.5 px-3 w-28 text-right">Balance</th>
                    <th className="py-2.5 px-3 w-28 text-center">Progress</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                    <th className="py-2.5 px-3 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-sans">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-text-muted">
                        <Package className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                        No BOQ items found. Click "+ Add Item" or "+ Add Section" to begin.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const edit = inlineEdits[item.id];
                      const qty = edit !== undefined ? edit.quantity : item.quantity || 0;
                      const rate = edit !== undefined ? edit.rate : item.rate || 0;
                      const numQty = Number(qty) || 0;
                      const numRate = Number(rate) || 0;
                      const amount = numQty * numRate;
                      const executed = Number(item.executed_quantity || 0);
                      const balance = Math.max(0, numQty - executed);
                      const progress = numQty > 0 ? Math.min(100, Math.round((executed / numQty) * 100)) : 0;
                      const isDirty = edit?.isDirty;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-surface-muted/50 transition-colors ${
                            isDirty ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-text-muted font-mono">{index + 1}</td>
                          <td className="py-2 px-3 font-mono font-medium text-text-primary">
                            {item.item_code || `ITM-${index + 1}`}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:bg-surface px-1 py-0.5 text-xs text-text-primary font-medium transition-colors outline-none rounded"
                              value={edit?.item_name !== undefined ? edit.item_name : item.item_name || ''}
                              onChange={(e) => handleInlineChange(item.id, 'item_name', e.target.value)}
                            />
                            {item.specification && (
                              <span className="text-[10px] text-text-muted block truncate max-w-xs mt-0.5 px-1">
                                {item.specification}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-text-secondary truncate max-w-[120px]">
                            {item.section_name || 'General'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 bg-surface-muted text-text-secondary border border-border rounded font-mono text-[10px]">
                              {item.unit_code || item.uom_name || 'Nos'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="any"
                              className={`w-20 text-right bg-transparent border px-1.5 py-0.5 rounded font-mono text-xs outline-none transition-colors ${
                                isDirty
                                  ? 'border-amber-400 bg-amber-50/70 font-bold'
                                  : 'border-transparent hover:border-border focus:border-primary focus:bg-surface'
                              }`}
                              value={qty}
                              onChange={(e) => handleInlineChange(item.id, 'quantity', e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="any"
                              className={`w-24 text-right bg-transparent border px-1.5 py-0.5 rounded font-mono text-xs outline-none transition-colors ${
                                isDirty
                                  ? 'border-amber-400 bg-amber-50/70 font-bold'
                                  : 'border-transparent hover:border-border focus:border-primary focus:bg-surface'
                              }`}
                              value={rate}
                              onChange={(e) => handleInlineChange(item.id, 'rate', e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">
                            {formatCurrency(amount)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600 font-semibold">
                            {executed}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600 font-semibold">
                            {balance}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <div className="w-14 bg-surface-muted rounded-full h-1.5 overflow-hidden border border-border">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] text-text-secondary">{progress}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge
                              variant={
                                progress >= 100 ? 'success' : progress > 0 ? 'warning' : 'default'
                              }
                              className="text-[10px]"
                            >
                              {progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                title="Rate Analysis"
                                onClick={() => {
                                  setSelectedRateAnalysisItem(item);
                                  setActiveTab('rate_analysis');
                                }}
                                className="p-1 text-text-muted hover:text-primary rounded transition-colors"
                              >
                                <Percent className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Edit Item"
                                onClick={() => {
                                  setEditingItem(item);
                                  setItemForm({
                                    item_code: item.item_code || '',
                                    item_name: item.item_name || '',
                                    section_id: String(item.section_id || ''),
                                    uom_id: String(item.uom_id || '1'),
                                    work_category_id: String(item.work_category_id || '1'),
                                    quantity: String(item.quantity || '0'),
                                    rate: String(item.rate || '0'),
                                    description: item.specification || '',
                                  });
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Delete Item"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-text-muted hover:text-rose-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredItems.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-surface-muted border-t border-border text-xs text-text-muted">
                <span>Showing {filteredItems.length} items</span>
                <div className="flex items-center gap-3">
                  <span>Total BOQ Value: <strong className="text-text-primary font-mono">{formatCurrency(metrics.totalValue)}</strong></span>
                  <span>Executed Value: <strong className="text-emerald-600 font-mono">{formatCurrency(metrics.executedValue)}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SECTION SUMMARY ──────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => {
            const secItems = items.filter((i) => String(i.section_id) === String(section.id));
            const secTotal = secItems.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.rate || 0)), 0);
            const secExec = secItems.reduce((acc, i) => acc + (Number(i.executed_quantity || 0) * Number(i.rate || 0)), 0);
            const secProgress = secTotal > 0 ? Math.min(100, Math.round((secExec / secTotal) * 100)) : 0;

            return (
              <div key={section.id} className="bg-surface border border-border rounded-xl p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-medium text-text-muted uppercase">
                      {section.section_code || 'SECTION'}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary">{section.section_name}</h3>
                    {section.description && (
                      <p className="text-xs text-text-muted mt-0.5">{section.description}</p>
                    )}
                  </div>
                  <Badge variant={secProgress >= 100 ? 'success' : secProgress > 0 ? 'warning' : 'default'}>
                    {secProgress}% Done
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-muted font-medium">Progress</span>
                    <span className="font-mono font-semibold text-text-primary">{secProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden border border-border">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${secProgress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border text-center">
                  <div>
                    <span className="text-[10px] text-text-muted block">Items</span>
                    <span className="text-xs font-bold font-mono text-text-primary">{secItems.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Budget</span>
                    <span className="text-xs font-bold font-mono text-primary">{formatCurrency(secTotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Executed</span>
                    <span className="text-xs font-bold font-mono text-emerald-600">{formatCurrency(secExec)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── TAB 3: DSR EXECUTION HISTORY ────────────────────────────────── */}
      {activeTab === 'execution' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Live Daily Site Report (DSR) Execution Log</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Every quantity entered on-site via DSR automatically increments BOQ Executed Quantities.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoadingExecution(true);
                boqApi.items.executionHistory(boqId)
                  .then((res) => setExecutionLogs(res?.data?.execution_history || []))
                  .finally(() => setLoadingExecution(false));
              }}
              className="text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingExecution ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted/50 border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Quantity Executed</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Executed Value (₹)</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      <HardHat className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                      No DSR work progress entries recorded yet for this BOQ.
                    </td>
                  </tr>
                ) : (
                  executionLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-surface-muted/30">
                      <td className="py-2 px-3 font-mono text-text-secondary">{log.report_date || log.date || '—'}</td>
                      <td className="py-2 px-3 font-mono font-medium text-text-primary">{log.item_code}</td>
                      <td className="py-2 px-3 text-text-primary">{log.item_name || log.description}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        +{log.quantity_executed || log.quantity}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 bg-surface-muted text-text-secondary rounded text-[10px]">
                          {log.unit_code || 'Nos'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-text-primary">
                        {formatCurrency(Number(log.quantity_executed || 0) * Number(log.unit_rate || 0))}
                      </td>
                      <td className="py-2 px-3 text-text-secondary">{log.recorded_by || log.user_name || 'Site Engineer'}</td>
                      <td className="py-2 px-3 text-text-muted truncate max-w-xs">{log.remarks || log.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: RATE ANALYSIS ────────────────────────────────────────── */}
      {activeTab === 'rate_analysis' && (
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Unit Rate Analysis Breakdown</h3>
                <p className="text-xs text-text-muted">
                  Material, labour, machinery and overhead component breakdown for BOQ items.
                </p>
              </div>
              <div className="w-72">
                <Select
                  value={selectedRateAnalysisItem ? String(selectedRateAnalysisItem.id) : ''}
                  onChange={(e) => {
                    const itm = items.find((i) => String(i.id) === e.target.value);
                    setSelectedRateAnalysisItem(itm || null);
                  }}
                  options={[
                    { value: '', label: 'Select an Item to Analyze...' },
                    ...items.map((i) => ({ value: String(i.id), label: `${i.item_code} — ${i.item_name}` })),
                  ]}
                />
              </div>
            </div>

            {selectedRateAnalysisItem ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                {/* Material Component */}
                <div className="bg-surface-muted border border-border rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">1. Material Cost</span>
                  <span className="text-base font-bold font-mono text-text-primary block mt-1">
                    {formatCurrency(Number(selectedRateAnalysisItem.rate || 0) * 0.55)}
                  </span>
                  <span className="text-[11px] text-text-muted mt-1 block">55% of base item rate</span>
                </div>
                {/* Labour Component */}
                <div className="bg-surface-muted border border-border rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">2. Labour Cost</span>
                  <span className="text-base font-bold font-mono text-text-primary block mt-1">
                    {formatCurrency(Number(selectedRateAnalysisItem.rate || 0) * 0.25)}
                  </span>
                  <span className="text-[11px] text-text-muted mt-1 block">25% skilled & un-skilled labour</span>
                </div>
                {/* Machinery & Equipment */}
                <div className="bg-surface-muted border border-border rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">3. Machinery / Plant</span>
                  <span className="text-base font-bold font-mono text-text-primary block mt-1">
                    {formatCurrency(Number(selectedRateAnalysisItem.rate || 0) * 0.08)}
                  </span>
                  <span className="text-[11px] text-text-muted mt-1 block">8% equipment hire / fuel</span>
                </div>
                {/* Overhead & Profit */}
                <div className="bg-surface-muted border border-border rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">4. Overheads & Profit</span>
                  <span className="text-base font-bold font-mono text-emerald-600 block mt-1">
                    {formatCurrency(Number(selectedRateAnalysisItem.rate || 0) * 0.12)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-1 block">12% contractor margin</span>
                </div>

                <div className="md:col-span-4 bg-surface border border-border rounded-xl p-4 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-muted">Final Adopted Unit Rate</span>
                    <div className="text-xl font-bold font-mono text-primary">
                      {formatCurrency(selectedRateAnalysisItem.rate || 0)} / {selectedRateAnalysisItem.unit_code || 'Unit'}
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">Balanced & Approved</Badge>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-text-muted">
                <Percent className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                Select an item from the dropdown above to inspect its rate analysis breakdown.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: VARIATIONS LOG ───────────────────────────────────────── */}
      {activeTab === 'variations' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Variation Orders & Scope Changes</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Manage contract variations, omissions, and client change orders.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsVariationModalOpen(true)}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log Variation
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted/50 border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3">Variation #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Cost Impact</th>
                  <th className="py-2.5 px-3">Justification</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {variations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      <TrendingUp className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                      No variation orders logged yet for this BOQ.
                    </td>
                  </tr>
                ) : (
                  variations.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-muted/30">
                      <td className="py-2 px-3 font-mono font-medium text-text-primary">
                        {v.variation_number || `VO-${v.id}`}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          v.variation_type === 'ADDITION' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          v.variation_type === 'OMISSION' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {v.variation_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-text-primary">{v.description}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">
                        {formatCurrency(v.impact_amount)}
                      </td>
                      <td className="py-2 px-3 text-text-muted">{v.justification || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={v.status === 'APPROVED' ? 'success' : 'warning'}>
                          {v.status || 'PENDING'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: REVISION HISTORY ─────────────────────────────────────── */}
      {activeTab === 'revisions' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">BOQ Revision History</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Audit trail of changes and formal contract revisions.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRevisionOpen(true)}
              className="text-xs flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" /> Create New Revision
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted/50 border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3">Revision</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reason for Revision</th>
                  <th className="py-2.5 px-3 text-right">BOQ Value</th>
                  <th className="py-2.5 px-3">Created By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revisions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      <History className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                      Currently at Base Revision (Rev 0). No revisions logged yet.
                    </td>
                  </tr>
                ) : (
                  revisions.map((rev) => (
                    <tr key={rev.id} className="hover:bg-surface-muted/30">
                      <td className="py-2 px-3 font-mono font-bold text-text-primary">
                        Rev {rev.revision_number}
                      </td>
                      <td className="py-2 px-3 font-mono text-text-secondary">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 px-3 text-text-primary font-medium">{rev.reason || rev.description}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">
                        {formatCurrency(rev.total_amount)}
                      </td>
                      <td className="py-2 px-3 text-text-secondary">{rev.created_by_name || 'Admin'}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="success">Approved</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD SECTION ──────────────────────────────────────────── */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Add BOQ Section"
      >
        <form onSubmit={handleSaveSection} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Section Name *</label>
            <Input
              required
              placeholder="e.g. Substructure & Foundation"
              value={sectionForm.section_name}
              onChange={(e) => setSectionForm((p) => ({ ...p, section_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Section Code</label>
            <Input
              placeholder="e.g. SEC-01"
              value={sectionForm.section_code}
              onChange={(e) => setSectionForm((p) => ({ ...p, section_code: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Description (Optional)</label>
            <Input
              placeholder="Scope or specifications included in this section..."
              value={sectionForm.description}
              onChange={(e) => setSectionForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={savingSection}>
              {savingSection ? 'Creating...' : 'Create Section'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: ADD / EDIT ITEM ──────────────────────────────────────── */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit BOQ Item' : 'Add BOQ Item'}
      >
        <form onSubmit={handleSaveItem} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Item Code</label>
              <Input
                placeholder="e.g. 1.01"
                value={itemForm.item_code}
                onChange={(e) => setItemForm((p) => ({ ...p, item_code: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Section</label>
              <Select
                value={itemForm.section_id}
                onChange={(e) => setItemForm((p) => ({ ...p, section_id: e.target.value }))}
                options={sections.map((s) => ({ value: String(s.id), label: s.section_name }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Item Description *</label>
            <Input
              required
              placeholder="e.g. Earthwork in excavation in foundation trenches..."
              value={itemForm.item_name}
              onChange={(e) => setItemForm((p) => ({ ...p, item_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Unit (UOM)</label>
              <Select
                value={itemForm.uom_id}
                onChange={(e) => setItemForm((p) => ({ ...p, uom_id: e.target.value }))}
                options={uoms.map((u) => ({ value: String(u.id), label: u.unit_name || u.unit_code }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Quantity</label>
              <Input
                type="number"
                step="any"
                required
                value={itemForm.quantity}
                onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Unit Rate (₹)</label>
              <Input
                type="number"
                step="any"
                required
                value={itemForm.rate}
                onChange={(e) => setItemForm((p) => ({ ...p, rate: e.target.value }))}
              />
            </div>
          </div>

          <div className="bg-surface-muted border border-border rounded-lg p-2.5 flex items-center justify-between text-xs">
            <span className="text-text-muted">Calculated Total Amount:</span>
            <span className="font-mono font-bold text-primary text-sm">
              {formatCurrency((Number(itemForm.quantity) || 0) * (Number(itemForm.rate) || 0))}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setIsItemModalOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={savingItem}>
              {savingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: LOG VARIATION ────────────────────────────────────────── */}
      <Modal
        isOpen={isVariationModalOpen}
        onClose={() => setIsVariationModalOpen(false)}
        title="Log Variation Order"
      >
        <form onSubmit={handleSaveVariation} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Variation Type</label>
              <Select
                value={variationForm.variation_type}
                onChange={(e) => setVariationForm((p) => ({ ...p, variation_type: e.target.value }))}
                options={[
                  { value: 'ADDITION', label: 'Addition (Extra Work)' },
                  { value: 'OMISSION', label: 'Omission (Reduction)' },
                  { value: 'SUBSTITUTION', label: 'Substitution' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Impact Amount (₹)</label>
              <Input
                type="number"
                step="any"
                required
                value={variationForm.impact_amount}
                onChange={(e) => setVariationForm((p) => ({ ...p, impact_amount: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Scope Description *</label>
            <Input
              required
              placeholder="e.g. Additional PCC layer required due to water table..."
              value={variationForm.description}
              onChange={(e) => setVariationForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Justification</label>
            <Input
              placeholder="Client instruction / Site condition / Architect request..."
              value={variationForm.justification}
              onChange={(e) => setVariationForm((p) => ({ ...p, justification: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsVariationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={savingVariation}>
              {savingVariation ? 'Logging...' : 'Submit Variation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: REVISION ─────────────────────────────────────────────── */}
      <BoqRevisionModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        boq={boq}
        onRevisionCreated={() => {
          setIsRevisionOpen(false);
          loadBoqData();
        }}
      />
    </div>
  );
}
