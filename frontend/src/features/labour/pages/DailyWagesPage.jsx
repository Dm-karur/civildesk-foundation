import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2, Plus, Wallet, Search, CheckCircle2,
  MapPin, Clock, ArrowRight, ShieldCheck, UserCircle,
  FileText, Trash2, Tag, Calendar, ArrowLeft,
  Download, FileSpreadsheet, Layers, ChevronLeft,
  ChevronRight, Eye, Users, TrendingUp, RefreshCw, X, Printer
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { dailyWagesApi, subcontractsApi, subcontractorTypesApi } from '../../../api/apiservice';
import { exportWeeklyWagesToExcel, exportWeeklyWagesToPdf } from '../utils/wageExportUtils';
import { generateAndDownloadA5SlipFromItem, printA5SlipFromItem } from '../../subcontracts/utils/a5SlipExportUtils';

// Helper to get week start (Monday) and week end (Sunday)
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diffToMon));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const toIso = (dt) => dt.toISOString().split('T')[0];
  return {
    startDate: toIso(mon),
    endDate: toIso(sun),
  };
}

export function DailyWagesPage({ isSubWorkModule = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSubWork = isSubWorkModule || window.location.pathname.includes('/subcontracts');
  const [activeTab, setActiveTab] = useState('sites'); // 'sites' | 'registers' | 'weekly' | 'templates'
  const [loading, setLoading] = useState(false);

  // Setup data from Backend
  const [sites, setSites] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [subcontractorTypes, setSubcontractorTypes] = useState([]);
  const [defaultTemplates, setDefaultTemplates] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Daily Wage Entry Form State
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [wageDate, setWageDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wageEntries, setWageEntries] = useState({});
  const [wageRates, setWageRates] = useState({});
  const [wageRemarks, setWageRemarks] = useState({});
  const [globalRemarks, setGlobalRemarks] = useState('');
  const [customItems, setCustomItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemFilter, setItemFilter] = useState('All');
  const [submittingWages, setSubmittingWages] = useState(false);

  // Post-submit modal state
  const [loggedSuccessData, setLoggedSuccessData] = useState(null);

  // Registers History State
  const [dailyWagesList, setDailyWagesList] = useState([]);
  const [registersPage, setRegistersPage] = useState(1);
  const [selectedRegisterDetails, setSelectedRegisterDetails] = useState(null);

  // Weekly Report State
  const [weeklySiteId, setWeeklySiteId] = useState('');
  const [weeklySubcontractorId, setWeeklySubcontractorId] = useState('');
  const [weekRange, setWeekRange] = useState(() => getWeekRange());
  const [weeklyReportData, setWeeklyReportData] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  // Quick Action Modals
  const [isSubcontractorModalOpen, setIsSubcontractorModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // New Subcontractor Form
  const [newSubForm, setNewSubForm] = useState({
    contractor_name: '',
    contractor_code: '',
    contractor_type_id: '',
    phone: '',
    contact_person: '',
    notes: '',
  });
  const [savingSub, setSavingSub] = useState(false);

  // New Trade Template Form
  const [newTemplateForm, setNewTemplateForm] = useState({
    item_name: '',
    classification: 'Manpower',
    uom: 'shift',
    default_rate: '',
    subcontractor_type_id: '',
    subcontractor_id: '',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // 1. Fetch initial setup data from backend
  const loadSetup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyWagesApi.setup();
      const setup = res?.data?.setup || {};
      setSites(setup.sites || []);
      setSubcontractors(setup.subcontractors || []);
      setSubcontractorTypes(setup.subcontractor_types || []);
      const tmpls = setup.templates || setup.default_templates || [];
      const normalized = (tmpls || []).map((t, idx) => ({
        ...t,
        id: t.id || `tmpl-${idx}`,
        item_name: t.item_name || t.item_description || t.description || 'Trade Item',
        description: t.description || t.item_description || t.item_name || 'Trade Item',
        classification: t.classification ? (t.classification.charAt(0).toUpperCase() + t.classification.slice(1).toLowerCase()) : 'Manpower',
        uom: t.uom || t.unit || 'Nos',
        unit: t.unit || t.uom || 'Nos',
        default_rate: Number(t.default_rate !== undefined ? t.default_rate : (t.rate || 0)),
      }));
      setDefaultTemplates(normalized);
    } catch (err) {
      console.error('Failed to load setup:', err);
      toast.error('Failed to load sites and subcontractors.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch daily registers history
  const loadRegisters = useCallback(async () => {
    try {
      const res = await dailyWagesApi.list({ limit: 100 });
      setDailyWagesList(res?.data?.registers || []);
    } catch (err) {
      console.error('Failed to load wage registers:', err);
    }
  }, []);

  useEffect(() => {
    loadSetup();
    loadRegisters();
  }, [loadSetup, loadRegisters]);

  // Selected subcontractor details
  const selectedSub = useMemo(() => {
    return subcontractors.find(s => String(s.id) === String(selectedSubcontractorId));
  }, [subcontractors, selectedSubcontractorId]);

  // Load templates when subcontractor changes in Entry Form
  useEffect(() => {
    if (!selectedSubcontractorId) return;

    let isMounted = true;

    const fetchSubcontractorTemplates = async () => {
      try {
        let tmpls = [];
        const subTypeId = selectedSub?.contractor_type_id || selectedSub?.subcontractor_type_id;

        // 1. Try subcontractor trade type templates first (Template Items configured for this trade)
        if (subTypeId && subcontractorTypesApi?.templates) {
          try {
            const tRes = await subcontractorTypesApi.templates(subTypeId);
            const tItems = tRes?.data?.templates || tRes?.data || [];
            if (Array.isArray(tItems) && tItems.length > 0) {
              tmpls = tItems;
            }
          } catch (err) {
            console.warn('subcontractorTypesApi.templates error:', err);
          }
        }

        // 2. If empty, try contractor-specific templates
        if ((!tmpls || tmpls.length === 0) && subcontractsApi?.contractors?.templates) {
          try {
            const cRes = await subcontractsApi.contractors.templates(selectedSubcontractorId);
            const cItems = cRes?.data?.templates || cRes?.data || [];
            if (Array.isArray(cItems) && cItems.length > 0) {
              tmpls = cItems;
            }
          } catch (err) {
            console.warn('subcontractsApi.contractors.templates error:', err);
          }
        }

        // 3. If still empty, fetch from dailyWagesApi.setup
        if (!tmpls || tmpls.length === 0) {
          try {
            const res = await dailyWagesApi.setup({
              subcontractor_id: selectedSubcontractorId,
              site_id: selectedSite?.id,
            });
            const setup = res?.data?.setup || {};
            tmpls = setup.templates || setup.default_templates || [];
          } catch (err) {
            console.warn('dailyWagesApi.setup error:', err);
          }
        }

        if (!isMounted) return;

        if (Array.isArray(tmpls) && tmpls.length > 0) {
          const normalized = tmpls.map((t, idx) => ({
            ...t,
            id: t.id || `tmpl-${idx}`,
            item_name: t.item_name || t.item_description || t.description || 'Trade Item',
            description: t.description || t.item_description || t.item_name || 'Trade Item',
            classification: t.classification ? (t.classification.charAt(0).toUpperCase() + t.classification.slice(1).toLowerCase()) : 'Manpower',
            uom: t.uom || t.unit || 'Nos',
            unit: t.unit || t.uom || 'Nos',
            default_rate: Number(t.default_rate !== undefined ? t.default_rate : (t.rate || 0)),
            subcontractor_id: t.subcontractor_id ? String(t.subcontractor_id) : String(selectedSubcontractorId),
            subcontractor_type_id: t.subcontractor_type_id ? String(t.subcontractor_type_id) : (subTypeId ? String(subTypeId) : null),
          }));

          setDefaultTemplates(normalized);
          const initialRates = {};
          normalized.forEach(t => {
            initialRates[t.id] = Number(t.default_rate || 0);
          });
          setWageRates(prev => ({ ...prev, ...initialRates }));
        } else {
          setDefaultTemplates([]);
          setWageRates({});
        }
      } catch (err) {
        console.error('Failed to load subcontractor templates:', err);
      }
    };

    fetchSubcontractorTemplates();

    return () => {
      isMounted = false;
    };
  }, [selectedSubcontractorId, selectedSite, selectedSub]);

  // Handle open entry form
  const handleOpenWages = (site) => {
    setSelectedSite(site);
    setSelectedSubcontractorId('');
    setWageEntries({});
    setWageRates({});
    setWageRemarks({});
    setGlobalRemarks('');
    setCustomItems([]);
    setItemFilter('All');
    setItemSearch('');
    setWageDate(new Date().toISOString().split('T')[0]);
  };

  const handleCloseWages = () => {
    setSelectedSite(null);
  };

  // Auto-open site entry if site_id param is present
  useEffect(() => {
    const siteParam = searchParams.get('site_id');
    if (siteParam && sites.length > 0 && !selectedSite) {
      const match = sites.find(s => String(s.id) === String(siteParam));
      if (match) {
        handleOpenWages(match);
      }
    }
    const contractorParam = searchParams.get('contractor_id') || searchParams.get('subcontractor_id');
    if (contractorParam && !selectedSubcontractorId) {
      setSelectedSubcontractorId(String(contractorParam));
    }
  }, [searchParams, sites, selectedSite, selectedSubcontractorId]);

  // Available templates based on selected subcontractor
  const availableTemplates = useMemo(() => {
    if (!selectedSub) return defaultTemplates;
    const subTypeId = selectedSub.contractor_type_id || selectedSub.subcontractor_type_id;

    // Check if there are trade-specific or subcontractor-specific templates
    const tradeOrSubTemplates = defaultTemplates.filter(t => {
      if (t.subcontractor_id && String(t.subcontractor_id) === String(selectedSub.id)) return true;
      if (t.subcontractor_type_id && subTypeId && String(t.subcontractor_type_id) === String(subTypeId)) return true;
      return false;
    });

    if (tradeOrSubTemplates.length > 0) {
      return tradeOrSubTemplates;
    }

    // Only fallback to global templates if this subcontractor trade has no templates registered
    return defaultTemplates.filter(t => !t.subcontractor_id && !t.subcontractor_type_id);
  }, [selectedSub, defaultTemplates]);

  // Handle Custom Line Items
  const handleAddCustomItem = () => {
    const newId = `custom-${Date.now()}`;
    setCustomItems(prev => [...prev, {
      id: newId,
      item_name: '',
      classification: 'Manpower',
      uom: 'shift',
      default_rate: 0,
      isCustom: true,
    }]);
  };

  const handleCustomItemChange = (id, field, value) => {
    setCustomItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id, isCustom) => {
    if (isCustom) {
      setCustomItems(prev => prev.filter(item => item.id !== id));
    }
    setWageEntries(prev => { const next = { ...prev }; delete next[id]; return next; });
    setWageRemarks(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (!isCustom) {
      const template = availableTemplates.find(t => t.id === id);
      if (template) {
        setWageRates(prev => ({ ...prev, [id]: Number(template.default_rate || 0) }));
      }
    }
  };

  const allTemplates = useMemo(() => {
    return [...availableTemplates, ...customItems];
  }, [availableTemplates, customItems]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const name = (t.item_name || t.description || '').toLowerCase();
      const matchesSearch = name.includes(itemSearch.toLowerCase());
      const matchesFilter = itemFilter === 'All' ||
        (itemFilter === 'Expense' && (t.classification === 'Expense' || t.classification === 'Expenses')) ||
        t.classification === itemFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allTemplates, itemSearch, itemFilter]);

  const filledItemsCount = useMemo(() => {
    return allTemplates.filter(t => Number(wageEntries[t.id]) > 0).length;
  }, [allTemplates, wageEntries]);

  const totalShifts = useMemo(() => {
    return allTemplates.reduce((acc, t) => acc + Number(wageEntries[t.id] || 0), 0);
  }, [allTemplates, wageEntries]);

  const totalWages = useMemo(() => {
    return allTemplates.reduce((acc, t) => {
      const rate = wageRates[t.id] !== undefined && wageRates[t.id] !== ''
        ? Number(wageRates[t.id])
        : Number(t.default_rate || 0);
      const shift = Number(wageEntries[t.id] || 0);
      return acc + (rate * shift);
    }, 0);
  }, [allTemplates, wageRates, wageEntries]);

  // Submit Daily Wages Entry to Backend
  const handleSubmitWages = async (e) => {
    e.preventDefault();
    if (!selectedSite?.id) {
      toast.error('Site is missing.');
      return;
    }
    if (!selectedSubcontractorId) {
      toast.error('Please select a subcontractor.');
      return;
    }
    if (filledItemsCount === 0) {
      toast.error('Please enter shifts for at least one item.');
      return;
    }

    setSubmittingWages(true);
    try {
      const lines = allTemplates
        .filter(t => Number(wageEntries[t.id]) > 0)
        .map(t => ({
          template_id: t.isCustom ? null : (typeof t.id === 'number' ? t.id : null),
          item_name: t.item_name || t.description || t.item_description || 'General Trade',
          description: t.item_name || t.description || t.item_description || 'General Trade',
          classification: t.classification || 'Manpower',
          uom: t.uom || t.unit || 'shift',
          unit: t.unit || t.uom || 'shift',
          quantity: Number(wageEntries[t.id] || 0),
          shift_quantity: Number(wageEntries[t.id] || 0),
          rate: Number(wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || 0)),
          unit_rate: Number(wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || 0)),
          remarks: wageRemarks[t.id] || null,
        }));

      const payload = {
        site_id: selectedSite.id,
        subcontractor_id: selectedSubcontractorId,
        wage_date: wageDate,
        global_remarks: globalRemarks || null,
        remarks: globalRemarks || null,
        lines,
      };

      const createdRes = await dailyWagesApi.create(payload);
      const createdData = createdRes?.data?.daily_wage || createdRes?.data?.data?.daily_wage || createdRes?.data?.register || createdRes?.data || {};
      toast.success('Daily wages recorded successfully!');
      setLoggedSuccessData({
        register_id: createdData.id || createdData.voucher_no || `DWR-${Date.now().toString().slice(-4)}`,
        voucher_no: createdData.voucher_no || createdData.register_no || `DWR-${Date.now().toString().slice(-4)}`,
        site: selectedSite,
        subcontractor_id: selectedSubcontractorId,
        subcontractor_name: selectedSub?.contractor_name || 'Subcontractor',
        trade: selectedSub?.subcontractor_type_label || selectedSub?.contractor_type_name || 'Trade Gang',
        total_shifts: totalShifts,
        total_amount: totalWages,
        wage_date: wageDate,
      });
      loadRegisters();
    } catch (err) {
      console.error('Failed to submit daily wages:', err);
      toast.error(err?.message || 'Failed to submit daily wages.');
    } finally {
      setSubmittingWages(false);
    }
  };

  // Quick Create Subcontractor
  const handleCreateSubcontractor = async (e) => {
    e.preventDefault();
    if (!newSubForm.contractor_name) {
      toast.error('Contractor name is required.');
      return;
    }
    if (!newSubForm.contractor_type_id) {
      toast.error('Please select a trade / contractor type.');
      return;
    }

    setSavingSub(true);
    try {
      const code = newSubForm.contractor_code.trim() || `SC-${Date.now().toString().slice(-4)}`;
      const payload = {
        contractor_code: code,
        contractor_name: newSubForm.contractor_name,
        contractor_type_id: Number(newSubForm.contractor_type_id),
        status_id: 1, // Default Active
        phone: newSubForm.phone || null,
        contact_person: newSubForm.contact_person || null,
        notes: newSubForm.notes || null,
      };

      const res = await subcontractsApi.contractors.create(payload);
      const created = res?.data?.contractor;
      toast.success('Subcontractor created successfully!');
      setIsSubcontractorModalOpen(false);
      setNewSubForm({
        contractor_name: '',
        contractor_code: '',
        contractor_type_id: '',
        phone: '',
        contact_person: '',
        notes: '',
      });

      // Reload setup and auto-select if in wage entry form
      await loadSetup();
      if (created?.id && selectedSite) {
        setSelectedSubcontractorId(String(created.id));
      }
    } catch (err) {
      console.error('Failed to create subcontractor:', err);
      toast.error(err?.message || 'Failed to create subcontractor.');
    } finally {
      setSavingSub(false);
    }
  };

  // Quick Create Trade Rate Template
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateForm.item_name) {
      toast.error('Item / Trade description is required.');
      return;
    }
    if (!newTemplateForm.default_rate || Number(newTemplateForm.default_rate) < 0) {
      toast.error('Please enter a valid rate.');
      return;
    }

    setSavingTemplate(true);
    try {
      const payload = {
        item_name: newTemplateForm.item_name,
        description: newTemplateForm.item_name,
        classification: newTemplateForm.classification,
        uom: newTemplateForm.uom || 'Nos',
        unit: newTemplateForm.uom || 'Nos',
        default_rate: Number(newTemplateForm.default_rate),
        subcontractor_type_id: newTemplateForm.subcontractor_type_id ? Number(newTemplateForm.subcontractor_type_id) : null,
        subcontractor_id: newTemplateForm.subcontractor_id ? Number(newTemplateForm.subcontractor_id) : null,
      };

      await dailyWagesApi.createTemplate(payload);
      toast.success('Trade rate template created successfully!');
      setIsTemplateModalOpen(false);
      setNewTemplateForm({
        item_name: '',
        classification: 'Manpower',
        uom: 'shift',
        default_rate: '',
        subcontractor_type_id: '',
        subcontractor_id: '',
      });

      await loadSetup();
    } catch (err) {
      console.error('Failed to create template:', err);
      toast.error(err?.message || 'Failed to create template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Load Weekly Wages Report
  const loadWeeklyReport = useCallback(async () => {
    setLoadingWeekly(true);
    try {
      const params = {
        start_date: weekRange.startDate,
        end_date: weekRange.endDate,
      };
      if (weeklySiteId) params.site_id = weeklySiteId;
      if (weeklySubcontractorId) params.subcontractor_id = weeklySubcontractorId;

      const res = await dailyWagesApi.weeklyReport(params);
      setWeeklyReportData(res?.data?.report || null);
    } catch (err) {
      console.error('Failed to load weekly report:', err);
      toast.error('Failed to load weekly wage report.');
    } finally {
      setLoadingWeekly(false);
    }
  }, [weekRange, weeklySiteId, weeklySubcontractorId]);

  useEffect(() => {
    if (activeTab === 'weekly') {
      loadWeeklyReport();
    }
  }, [activeTab, loadWeeklyReport]);

  // Week navigation helpers
  const handleShiftWeek = (offsetWeeks) => {
    const start = new Date(weekRange.startDate);
    start.setDate(start.getDate() + offsetWeeks * 7);
    setWeekRange(getWeekRange(start));
  };

  const handleResetToCurrentWeek = () => {
    setWeekRange(getWeekRange(new Date()));
  };

  // Export handlers
  const handleExportExcel = () => {
    try {
      const siteObj = sites.find(s => String(s.id) === String(weeklySiteId));
      exportWeeklyWagesToExcel({
        reportData: weeklyReportData,
        siteName: siteObj ? siteObj.site_name : 'All Sites',
        startDate: weekRange.startDate,
        endDate: weekRange.endDate,
      });
      toast.success('Weekly report exported to Excel.');
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    }
  };

  const handleExportPdf = () => {
    try {
      const siteObj = sites.find(s => String(s.id) === String(weeklySiteId));
      exportWeeklyWagesToPdf({
        reportData: weeklyReportData,
        siteName: siteObj ? siteObj.site_name : 'All Sites',
        startDate: weekRange.startDate,
        endDate: weekRange.endDate,
      });
      toast.success('Generating Weekly Report PDF...');
    } catch (err) {
      toast.error(err.message || 'PDF export failed.');
    }
  };

  // Filtered Sites for List View
  const filteredSites = useMemo(() => {
    if (!searchQuery) return sites;
    const q = searchQuery.toLowerCase();
    return sites.filter(s =>
      (s.site_name && s.site_name.toLowerCase().includes(q)) ||
      (s.site_code && s.site_code.toLowerCase().includes(q)) ||
      (s.project_name && s.project_name.toLowerCase().includes(q))
    );
  }, [sites, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSites.length / perPage));
  const pagedSites = filteredSites.slice((page - 1) * perPage, page * perPage);

  const getSiteWageCount = (siteId) => {
    return dailyWagesList.filter(w => String(w.site_id) === String(siteId)).length;
  };

  // -------------------------------------------------------------
  // RENDER: Daily Wage Entry Screen (When Site is selected)
  // -------------------------------------------------------------
  if (selectedSite) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseWages}
              className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {isSubWork ? 'Record Daily Sub Work' : 'Record Daily Wages'}
              </h1>
              <p className="text-[13px] text-text-secondary">Site: <span className="font-semibold text-text-primary">{selectedSite.site_name}</span> ({selectedSite.site_code})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${selectedSite.id}&contractor_id=${selectedSubcontractorId || ''}`)}
              className="gap-1.5 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Weekly Slips
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubcontractorModalOpen(true)}
              className="gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Subcontractor
            </Button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm flex flex-col w-full mb-8">
          {/* Form Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-primary/5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary shadow-sm border border-border">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">New Daily Register</h2>
                <p className="text-[12px] text-text-secondary">Select subcontractor & date to automatically populate trade rates</p>
              </div>
            </div>
            {selectedSubcontractorId && (
              <div className="flex items-center gap-2">
                <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1.5 px-3 py-1.5 shadow-sm font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  {availableTemplates.length} Trade Items Loaded
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${selectedSite.id}&contractor_id=${selectedSubcontractorId}`)}
                  className="h-8 text-xs gap-1 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Go to Weekly Slip
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitWages} className="flex flex-col flex-1">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Select Subcontractor & Log Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="SUBCONTRACTOR" required>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        leftIcon={<Search className="w-4 h-4 text-text-muted" />}
                        options={[
                          { value: '', label: 'Select Subcontractor for this site...' },
                          ...subcontractors.map(sub => ({
                            value: String(sub.id),
                            label: `${sub.contractor_name} — [${sub.subcontractor_type_label || sub.contractor_type_name || 'General Trade'}]`
                          }))
                        ]}
                        value={selectedSubcontractorId}
                        onChange={(val) => setSelectedSubcontractorId(val)}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSubcontractorModalOpen(true)}
                      title="Add New Subcontractor"
                      className="px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </FormField>

                <FormField label="LOG DATE" required>
                  <div className="relative">
                    <Input
                      type="date"
                      value={wageDate}
                      onChange={(e) => setWageDate(e.target.value)}
                      className="w-full pl-10 h-11 border-2 focus:border-primary font-medium"
                    />
                    <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </FormField>
              </div>

              {selectedSubcontractorId && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-primary shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span className="font-bold">{selectedSub?.contractor_name}</span>
                    <span className="text-primary/70">•</span>
                    <span className="font-medium">Trade: {selectedSub?.subcontractor_type_label || selectedSub?.contractor_type_name || 'Standard'}</span>
                    <span className="text-primary/70">•</span>
                    <span>{availableTemplates.length} default rates auto-applied</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTemplateForm(prev => ({ ...prev, subcontractor_id: selectedSubcontractorId }));
                      setIsTemplateModalOpen(true);
                    }}
                    className="text-xs h-7 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Trade Template
                  </Button>
                </div>
              )}

              {/* Trade Items Table */}
              {selectedSubcontractorId && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-80">
                      <SearchField
                        placeholder="Search trade items (e.g. Mason, Barbender)..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary font-medium">Filter:</span>
                      {['All', 'Manpower', 'Equipment', 'Expense'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setItemFilter(cat)}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${itemFilter === cat ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-border rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-[12px] table-fixed">
                      <thead className="bg-surface-muted text-text-secondary text-[10px] uppercase font-bold border-b border-border tracking-wider">
                        <tr>
                          <th className="px-2 py-3 w-10 text-center">#</th>
                          <th className="px-3 py-3 w-[20%]">TRADE / ITEM</th>
                          <th className="px-2 py-3 w-[12%] text-center">TYPE</th>
                          <th className="px-2 py-3 w-[8%] text-center">UNIT</th>
                          <th className="px-2 py-3 w-[14%] text-center">SHIFTS / QTY</th>
                          <th className="px-2 py-3 w-[14%] text-center">RATE (₹)</th>
                          <th className="px-2 py-3 w-[14%] text-right pr-4">AMOUNT (₹)</th>
                          <th className="px-2 py-3 w-[14%]">REMARKS</th>
                          <th className="px-2 py-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface">
                        {filteredTemplates.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="px-4 py-8 text-center text-text-muted text-[13px]">
                              No trade items found. Click "+ Add Custom Item" or "+ Add Trade Template".
                            </td>
                          </tr>
                        ) : (
                          filteredTemplates.map((t, idx) => {
                            const qty = Number(wageEntries[t.id] || 0);
                            const rate = Number(wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || 0));
                            const amount = qty * rate;
                            const isExpense = t.classification === 'Expense' || t.classification === 'Expenses';
                            const isEquipment = t.classification === 'Equipment';
                            const badgeColors = isExpense ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              isEquipment ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-indigo-100 text-indigo-800 border-indigo-200';

                            return (
                              <tr key={t.id} className="hover:bg-surface-muted/30 transition-colors group">
                                <td className="px-2 py-2.5 text-center font-medium text-text-secondary">{idx + 1}</td>
                                <td className="px-3 py-2.5 font-bold text-text-primary text-[13px]">
                                  {t.isCustom ? (
                                    <Input
                                      value={t.item_name}
                                      onChange={(e) => handleCustomItemChange(t.id, 'item_name', e.target.value)}
                                      className="h-8 text-[12px] font-bold w-full"
                                      placeholder="Custom Item Name"
                                    />
                                  ) : (t.item_name || t.description || t.item_description)}
                                </td>
                                <td className="px-2 py-2.5 text-center align-middle">
                                  {t.isCustom ? (
                                    <Select
                                      value={t.classification}
                                      onChange={(val) => handleCustomItemChange(t.id, 'classification', val)}
                                      options={[
                                        { value: 'Manpower', label: 'Manpower' },
                                        { value: 'Equipment', label: 'Equipment' },
                                        { value: 'Expense', label: 'Expense' }
                                      ]}
                                      className="h-8 text-[11px] w-full"
                                    />
                                  ) : (
                                    <Badge className={`text-[9px] uppercase tracking-wider font-bold gap-1 py-0.5 px-2 ${badgeColors}`}>
                                      {isExpense ? <Wallet className="w-3 h-3" /> : (isEquipment ? <Building2 className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />)}
                                      {t.classification}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-center text-text-secondary font-medium">
                                  {t.isCustom ? (
                                    <Input
                                      value={t.uom}
                                      onChange={(e) => handleCustomItemChange(t.id, 'uom', e.target.value)}
                                      className="h-8 text-[12px] text-center w-full"
                                    />
                                  ) : (t.uom || t.unit || 'Nos')}
                                </td>
                                <td className="px-2 py-2.5">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                    className="h-8 text-center font-bold"
                                    value={wageEntries[t.id] || ''}
                                    onChange={(e) => setWageEntries(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-2.5">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="h-8 text-center font-medium"
                                    value={wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || '')}
                                    onChange={(e) => setWageRates(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-right pr-4 font-bold text-[13px] text-text-primary">
                                  ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-2 py-2.5">
                                  <Input
                                    className="h-8 text-[12px]"
                                    placeholder="Notes..."
                                    value={wageRemarks[t.id] || ''}
                                    onChange={(e) => setWageRemarks(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(t.id, t.isCustom)}
                                    className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Reset / Remove"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot className="bg-surface-muted border-t-2 border-border">
                        <tr>
                          <td colSpan="4" className="px-4 py-3.5 text-right font-extrabold text-[12px] text-text-primary tracking-wider">
                            TOTAL ({filledItemsCount} ITEMS LOGGED)
                          </td>
                          <td className="px-2 py-3.5 text-center font-black text-[14px] text-text-primary">
                            {totalShifts} Shifts
                          </td>
                          <td></td>
                          <td className="px-2 py-3.5 text-right pr-4 font-black text-[16px] text-emerald-600">
                            ₹{totalWages.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCustomItem} className="gap-2 font-semibold">
                      <Plus className="w-4 h-4" />
                      Add Custom Trade Item
                    </Button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Site Supervisor Notes / Remarks (Optional)
                    </label>
                    <textarea
                      className="w-full min-h-[70px] rounded-lg border border-border bg-surface p-3 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y shadow-sm"
                      placeholder="e.g. Completed 1st floor column casting, overtime approved by site engineer..."
                      value={globalRemarks}
                      onChange={(e) => setGlobalRemarks(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Form Footer */}
            <div className="mt-auto border-t border-border bg-surface-muted/40 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
              <div className="text-[13px] font-semibold text-text-secondary">
                <span className="text-text-primary font-bold">{filledItemsCount}</span> items active • <span className="text-emerald-700 font-bold">₹{totalWages.toLocaleString('en-IN')}</span> Total
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${selectedSite.id}&contractor_id=${selectedSubcontractorId || ''}&date=${wageDate}`)}
                  className="font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Weekly Slip
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseWages} className="font-semibold px-4">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 shadow-md"
                  disabled={!selectedSubcontractorId || filledItemsCount === 0 || submittingWages}
                >
                  {submittingWages ? 'Saving...' : 'Submit Daily Wages'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Post-submission Success Modal */}
        <Modal
          isOpen={!!loggedSuccessData}
          onClose={() => setLoggedSuccessData(null)}
          title="Daily Wages Logged Successfully"
        >
          {loggedSuccessData && (
            <div className="space-y-5 p-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-950">Daily Wages Recorded Successfully</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    The labour entries have been saved to the daily register and compiled into the weekly subcontract account.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-white/70 p-2.5 rounded-lg border border-emerald-100 font-medium">
                    <div>
                      <span className="text-text-muted text-[11px]">Subcontractor:</span>
                      <div className="font-bold text-text-primary">{loggedSuccessData.subcontractor_name}</div>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px]">Log Date:</span>
                      <div className="font-bold text-text-primary">{loggedSuccessData.wage_date}</div>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px]">Total Shifts / Mandays:</span>
                      <div className="font-bold text-text-primary">{loggedSuccessData.total_shifts}</div>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px]">Total Wages:</span>
                      <div className="font-bold text-emerald-700">₹{Number(loggedSuccessData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full gap-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    const siteId = loggedSuccessData.site?.id;
                    const subId = loggedSuccessData.subcontractor_id;
                    const date = loggedSuccessData.wage_date;
                    setLoggedSuccessData(null);
                    navigate(`/subcontracts/weekly-payments?site_id=${siteId}&contractor_id=${subId}&date=${date}`);
                  }}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Go to Weekly Slip
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full gap-2 font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
                  onClick={() => {
                    const siteId = loggedSuccessData.site?.id;
                    const subId = loggedSuccessData.subcontractor_id;
                    const date = loggedSuccessData.wage_date;
                    setLoggedSuccessData(null);
                    navigate(`/subcontracts/weekly-payments/new?site_id=${siteId}&contractor_id=${subId}&date=${date}`);
                  }}
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  Generate Weekly Payment Slip (Maistry Slip)
                </Button>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setLoggedSuccessData(null);
                      setWageEntries({});
                      setWageRemarks({});
                      setCustomItems([]);
                      setGlobalRemarks('');
                    }}
                  >
                    Log Another Subcontractor
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-text-muted hover:text-text-primary"
                    onClick={() => {
                      setLoggedSuccessData(null);
                      handleCloseWages();
                    }}
                  >
                    Back to Sites
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Hub with Tabs
  // -------------------------------------------------------------
  return (
    <PageContainer>
      <PageHeader
        title={isSubWork ? "Daily Sub Work Entry" : "Subcontractor Daily Wages & Weekly Reports"}
        subtitle={isSubWork ? "Record subcontractor gang daily work, manpower, equipment rentals, and piece-rate entries for weekly slips." : "Manage daily labour shifts, equipment rentals, and contractor wages across construction sites."}
        breadcrumbs={isSubWork ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subcontracts', href: '/subcontracts/subcontractors' },
          { label: 'Daily Sub Work Entry' }
        ] : [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Labour & Wages', href: '/labour' },
          { label: 'Daily Wages' }
        ]}
      />

      {/* Tabs Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-2.5 shadow-xs mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sites')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'sites' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            <Building2 className="w-4 h-4" />
            Sites & Daily Entry
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'weekly' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Weekly Wages Report
          </button>
          <button
            onClick={() => setActiveTab('registers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'registers' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            <FileText className="w-4 h-4" />
            Daily Registers ({dailyWagesList.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'templates' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            <Layers className="w-4 h-4" />
            Trade Rate Templates
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subcontracts/weekly-payments')}
            className="gap-1.5 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Weekly Payment Slips
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="gap-1.5 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Template
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubcontractorModalOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Users className="w-3.5 h-3.5" />
            Add Subcontractor
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: SITES & DAILY ENTRY                                  */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'sites' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-lg p-3 shadow-xs">
            <div className="w-full sm:w-80">
              <SearchField
                placeholder="Search by site name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-xs text-text-secondary font-medium">
              Showing {filteredSites.length} active construction sites
            </div>
          </div>

          <div className="hidden sm:block">
            <DataTableContainer
              pagination={
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filteredSites.length}
                  itemsPerPage={perPage}
                  onPageChange={setPage}
                />
              }
            >
              <table className="w-full text-left text-[12px] table-auto">
                <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center">#</th>
                    <th className="px-3 py-2.5">Site Name & Code</th>
                    <th className="px-3 py-2.5">Associated Project</th>
                    <th className="px-3 py-2.5">Site Status</th>
                    <th className="px-3 py-2.5 text-center">Logs Recorded</th>
                    <th className="px-3 py-2.5 text-center w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedSites.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-text-muted text-[12px]">
                        No sites found.
                      </td>
                    </tr>
                  ) : (
                    pagedSites.map((site, idx) => {
                      const wageCount = getSiteWageCount(site.id);
                      return (
                        <tr key={site.id} className="hover:bg-surface-muted/30 transition-colors group">
                          <td className="px-3 py-3 text-center font-medium text-text-secondary text-[11px]">
                            {(page - 1) * perPage + idx + 1}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-text-primary text-[13px] leading-tight truncate">
                                {site.site_name}
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">
                                {site.site_code}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-text-secondary text-[12px] truncate">
                              {site.project_name || 'Direct Site'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={site.status_label === 'Active' ? 'success' : 'neutral'} className="text-[10px] h-5">
                              {site.status_label || 'ACTIVE'}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-text-primary">
                            {wageCount > 0 ? (
                              <Badge variant="success" className="text-[10px] gap-1 px-2 py-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                {wageCount} Logs
                              </Badge>
                            ) : (
                              <span className="text-text-muted font-normal">0 Logs</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Button
                              variant="primary"
                              onClick={() => handleOpenWages(site)}
                              className="h-8 text-[12px] px-3 shadow-xs font-semibold gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Record Wages
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </DataTableContainer>
          </div>

          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-3">
            {pagedSites.map((site) => (
              <div key={site.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      {site.site_code}
                    </span>
                    <h4 className="font-bold text-text-primary text-[15px] mt-1">
                      {site.site_name}
                    </h4>
                  </div>
                  <Badge variant={site.status_label === 'Active' ? 'success' : 'neutral'}>
                    {site.status_label || 'ACTIVE'}
                  </Badge>
                </div>
                <Button
                  variant="primary"
                  className="w-full h-9 text-xs font-bold"
                  onClick={() => handleOpenWages(site)}
                >
                  Record Daily Wages
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: WEEKLY WAGES REPORT & EXPORTS                        */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Select Site
                  </label>
                  <Select
                    value={weeklySiteId}
                    onChange={(val) => setWeeklySiteId(val)}
                    options={[
                      { value: '', label: 'All Sites' },
                      ...sites.map(s => ({ value: String(s.id), label: `${s.site_name} (${s.site_code})` }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Select Subcontractor
                  </label>
                  <Select
                    value={weeklySubcontractorId}
                    onChange={(val) => setWeeklySubcontractorId(val)}
                    options={[
                      { value: '', label: 'All Subcontractors' },
                      ...subcontractors.map(s => ({ value: String(s.id), label: s.contractor_name }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                    Week Period
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShiftWeek(-1)}
                      className="p-2 border border-border rounded-lg hover:bg-surface-muted text-text-secondary"
                      title="Previous Week"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center py-1.5 px-2 bg-surface-muted rounded-lg text-xs font-bold text-text-primary">
                      {weekRange.startDate} → {weekRange.endDate}
                    </div>
                    <button
                      onClick={() => handleShiftWeek(1)}
                      className="p-2 border border-border rounded-lg hover:bg-surface-muted text-text-secondary"
                      title="Next Week"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleResetToCurrentWeek}
                      className="px-2.5 py-1.5 border border-border rounded-lg hover:bg-surface-muted text-[11px] font-semibold text-primary whitespace-nowrap"
                    >
                      This Week
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Excel & PDF */}
              <div className="flex items-center gap-2.5 self-end lg:self-center pt-2 lg:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={!weeklyReportData || weeklyReportData.matrix?.length === 0}
                  className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Export Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={!weeklyReportData || weeklyReportData.matrix?.length === 0}
                  className="gap-2 text-rose-700 border-rose-300 hover:bg-rose-50 font-bold shadow-xs"
                >
                  <Download className="w-4 h-4 text-rose-600" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadWeeklyReport}
                  className="p-2"
                  title="Refresh Report"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingWeekly ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Weekly Payout</div>
                <div className="text-xl font-black text-emerald-700 mt-0.5">
                  ₹{Number(weeklyReportData?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3">
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Total Shifts Logged</div>
                <div className="text-xl font-black text-blue-700 mt-0.5">
                  {Number(weeklyReportData?.total_shifts || 0)} Shifts
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200/60 rounded-xl p-3">
                <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Trades Logged</div>
                <div className="text-xl font-black text-indigo-700 mt-0.5">
                  {weeklyReportData?.matrix?.length || 0} Items
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Registers Filed</div>
                <div className="text-xl font-black text-amber-700 mt-0.5">
                  {weeklyReportData?.registers?.length || 0} Days
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Report Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-3.5 bg-surface-muted/60 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Weekly Breakdown Matrix ({weekRange.startDate} to {weekRange.endDate})
                </span>
              </div>
              <Badge variant="neutral" className="text-[10px]">
                {weeklyReportData?.matrix?.length || 0} Trade Entries
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead className="bg-surface-muted text-text-secondary text-[10px] uppercase font-bold border-b border-border tracking-wider">
                  <tr>
                    <th className="px-2.5 py-3 w-10 text-center">#</th>
                    <th className="px-3 py-3 min-w-[150px]">SUBCONTRACTOR</th>
                    <th className="px-3 py-3 min-w-[180px]">TRADE / ITEM</th>
                    <th className="px-2 py-3 text-center min-w-[80px]">TYPE</th>
                    <th className="px-2 py-3 text-center min-w-[60px]">UNIT</th>
                    {weeklyReportData?.date_range?.days?.map(d => (
                      <th key={d.date} className="px-2 py-3 text-center min-w-[65px] bg-surface-muted/80 border-l border-border">
                        <div>{d.day_name.slice(0, 3)}</div>
                        <div className="text-[9px] text-text-muted font-normal">{d.date.slice(5)}</div>
                      </th>
                    ))}
                    <th className="px-2.5 py-3 text-center min-w-[70px] bg-primary/5 border-l border-border font-extrabold text-primary">SHIFTS</th>
                    <th className="px-2.5 py-3 text-right min-w-[80px]">RATE (₹)</th>
                    <th className="px-3 py-3 text-right min-w-[110px] font-extrabold text-emerald-700">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingWeekly ? (
                    <tr>
                      <td colSpan="15" className="text-center py-12 text-text-muted">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Generating weekly wage matrix...
                      </td>
                    </tr>
                  ) : (!weeklyReportData?.matrix || weeklyReportData.matrix.length === 0) ? (
                    <tr>
                      <td colSpan="15" className="text-center py-12 text-text-muted text-[13px]">
                        No daily wages logged for this week period.
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => setActiveTab('sites')}>
                            Go to Sites & Log Wages
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    weeklyReportData.matrix.map((row, idx) => {
                      const isExpense = row.classification === 'Expense';
                      const isEquipment = row.classification === 'Equipment';
                      const badgeColors = isExpense ? 'bg-amber-100 text-amber-800' :
                        isEquipment ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800';

                      return (
                        <tr key={idx} className="hover:bg-surface-muted/30 transition-colors">
                          <td className="px-2.5 py-2.5 text-center font-medium text-text-secondary">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-bold text-text-primary text-[12px] truncate max-w-[150px]">
                            {row.contractor_name || '—'}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-text-primary text-[12px]">
                            {row.item_name}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`text-[9px] uppercase tracking-wider font-bold py-0.5 px-1.5 rounded ${badgeColors}`}>
                              {row.classification}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center text-text-muted font-medium text-[11px]">
                            {row.uom}
                          </td>
                          {weeklyReportData.date_range?.days?.map(d => {
                            const s = Number(row.shifts_by_date?.[d.date] || 0);
                            return (
                              <td
                                key={d.date}
                                className={`px-2 py-2.5 text-center font-semibold border-l border-border/50 text-[12px] ${s > 0 ? 'bg-emerald-50/50 text-emerald-900 font-bold' : 'text-text-muted/50'}`}
                              >
                                {s > 0 ? s : '—'}
                              </td>
                            );
                          })}
                          <td className="px-2.5 py-2.5 text-center font-bold text-[13px] bg-primary/5 border-l border-border text-primary">
                            {Number(row.total_shifts || 0)}
                          </td>
                          <td className="px-2.5 py-2.5 text-right font-medium text-text-secondary text-[12px]">
                            ₹{Number(row.rate || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-700 text-[13px]">
                            ₹{Number(row.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {weeklyReportData?.matrix && weeklyReportData.matrix.length > 0 && (
                  <tfoot className="bg-surface-muted/90 border-t-2 border-border font-bold">
                    <tr>
                      <td colSpan="5" className="px-3 py-3.5 text-right font-extrabold text-[12px] text-text-primary">
                        DAILY TOTALS
                      </td>
                      {weeklyReportData.date_range?.days?.map(d => {
                        const s = Number(weeklyReportData.daily_totals?.[d.date]?.shifts || 0);
                        return (
                          <td key={d.date} className="px-2 py-3.5 text-center font-black text-[12px] border-l border-border text-text-primary">
                            {s > 0 ? s : '0'}
                          </td>
                        );
                      })}
                      <td className="px-2.5 py-3.5 text-center font-black text-[14px] bg-primary/10 border-l border-border text-primary">
                        {Number(weeklyReportData.total_shifts || 0)}
                      </td>
                      <td></td>
                      <td className="px-3 py-3.5 text-right font-black text-[15px] text-emerald-700">
                        ₹{Number(weeklyReportData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: DAILY WAGE REGISTERS HISTORY                         */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'registers' && (
        <div className="space-y-4">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={registersPage}
                totalPages={Math.max(1, Math.ceil(dailyWagesList.length / perPage))}
                totalItems={dailyWagesList.length}
                itemsPerPage={perPage}
                onPageChange={setRegistersPage}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Site Details</th>
                  <th className="px-3 py-2.5">Subcontractor</th>
                  <th className="px-3 py-2.5 text-center">Trade Items</th>
                  <th className="px-3 py-2.5 text-center">Total Shifts</th>
                  <th className="px-3 py-2.5 text-right pr-4">Total Amount (₹)</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dailyWagesList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No daily wage registers found. Select a site to record daily wages.
                    </td>
                  </tr>
                ) : (
                  dailyWagesList.slice((registersPage - 1) * perPage, registersPage * perPage).map((reg, idx) => (
                    <tr key={reg.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-center font-medium text-text-secondary text-[11px]">
                        {(registersPage - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-text-primary">
                        {reg.wage_date}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-text-primary">{reg.site_name}</div>
                        <div className="text-[10px] text-text-muted">{reg.site_code}</div>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-text-primary">
                        {reg.contractor_name}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium">
                        {reg.total_workers_count || 0}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-text-primary">
                        {Number(reg.total_shifts_count || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right pr-4 font-bold text-emerald-700 text-[13px]">
                        ₹{Number(reg.total_wage_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={reg.status_code === 'APPROVED' ? 'success' : 'neutral'} className="text-[9px] uppercase font-bold">
                          {reg.status_code || 'SUBMITTED'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const subId = reg.subcontractor_id || reg.contractor_id;
                              navigate(`/subcontracts/weekly-payments?site_id=${reg.site_id}&contractor_id=${subId}&date=${reg.wage_date}`);
                            }}
                            className="h-7 text-xs px-2 gap-1 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            title="Go to Weekly Slip"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            Weekly Slip
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await dailyWagesApi.get(reg.id);
                                setSelectedRegisterDetails(res?.data?.register || reg);
                              } catch {
                                toast.error('Failed to load register details.');
                              }
                            }}
                            className="h-7 text-xs px-2 gap-1 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await dailyWagesApi.get(reg.id);
                                const details = res?.data?.register || reg;
                                await generateAndDownloadA5SlipFromItem({
                                  ...details,
                                  id: details.id || reg.id,
                                  voucher_no: details.register_no || reg.register_no || `DWR-${reg.id}`,
                                  contractor_name: details.contractor_name || reg.contractor_name,
                                  site_name: details.site_name || reg.site_name,
                                  payment_date: details.wage_date || reg.wage_date,
                                  total_cost: details.total_wage_amount || reg.total_wage_amount,
                                  trades: (details.lines || []).map((l, i) => ({
                                    order: i + 1,
                                    item: l.item_name,
                                    rate: l.unit_rate,
                                    qty: l.shift_quantity,
                                    amount: l.line_total_amount,
                                    classification: l.classification,
                                    unit: l.uom,
                                  })),
                                });
                                toast.success('Weekly Slip downloaded!');
                              } catch (err) {
                                toast.error('Failed to download slip.');
                              }
                            }}
                            className="h-7 text-xs px-2 gap-1 text-primary hover:bg-primary/10"
                            title="Download Weekly Slip (A5 PDF)"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Slip
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
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 4: TRADE RATE TEMPLATES                                 */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-xs">
            <div className="text-xs text-text-secondary">
              Standard default wage rates automatically populated when site engineers record daily logs.
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTemplateModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Trade Template
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5">Trade / Item Description</th>
                  <th className="px-3 py-2.5 text-center">Classification</th>
                  <th className="px-3 py-2.5 text-center">Unit of Measure</th>
                  <th className="px-3 py-2.5 text-right pr-6">Default Rate (₹)</th>
                  <th className="px-3 py-2.5">Applicable Contractor / Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {defaultTemplates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-text-muted text-[12px]">
                      No trade templates registered.
                    </td>
                  </tr>
                ) : (
                  defaultTemplates.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-center font-medium text-text-secondary text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-text-primary text-[13px]">
                        {t.item_name || t.description || t.item_description}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="neutral" className="text-[10px] font-bold">
                          {t.classification}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center text-text-muted font-medium">
                        {t.uom || t.unit || 'Nos'}
                      </td>
                      <td className="px-3 py-2.5 text-right pr-6 font-bold text-emerald-700 text-[13px]">
                        ₹{Number(t.default_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary text-[12px]">
                        {t.contractor_name ? (
                          <span className="font-semibold text-primary">{t.contractor_name} (Custom)</span>
                        ) : (
                          t.contractor_type_name ? `${t.contractor_type_name} Trade` : 'Global / Standard'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 1: Quick Register Subcontractor                       */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isSubcontractorModalOpen}
        onClose={() => setIsSubcontractorModalOpen(false)}
        title="Register New Subcontractor"
        subtitle="Add a subcontractor to assign for site works and daily wage tracking"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubcontractor} className="space-y-4">
          <FormField label="Contractor / Vendor Name" required>
            <Input
              value={newSubForm.contractor_name}
              onChange={(e) => setNewSubForm(prev => ({ ...prev, contractor_name: e.target.value }))}
              placeholder="e.g. Balaji Bar Bending Works"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Trade / Contractor Type" required>
              <Select
                value={newSubForm.contractor_type_id}
                onChange={(val) => setNewSubForm(prev => ({ ...prev, contractor_type_id: val }))}
                options={[
                  { value: '', label: 'Select Trade Type...' },
                  ...subcontractorTypes.map(t => ({
                    value: String(t.id),
                    label: `${t.contractor_type_name || t.contractor_type_code}`
                  }))
                ]}
                required
              />
            </FormField>

            <FormField label="Contractor Code (Optional)">
              <Input
                value={newSubForm.contractor_code}
                onChange={(e) => setNewSubForm(prev => ({ ...prev, contractor_code: e.target.value }))}
                placeholder="Auto-generated if empty"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Contact Number">
              <Input
                type="tel"
                value={newSubForm.phone}
                onChange={(e) => setNewSubForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
              />
            </FormField>

            <FormField label="Contact Person">
              <Input
                value={newSubForm.contact_person}
                onChange={(e) => setNewSubForm(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="e.g. Murugan / Incharge"
              />
            </FormField>
          </div>

          <FormField label="Remarks / Trade Scope">
            <Input
              value={newSubForm.notes}
              onChange={(e) => setNewSubForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Reinforcement steel tying, column shuttering..."
            />
          </FormField>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubcontractorModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingSub}
            >
              {savingSub ? 'Creating...' : 'Register Subcontractor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 2: Add Trade Rate Template                           */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Add Trade Rate Template"
        subtitle="Define standard shift rates for trades like Mason, Barbender, Mixer, etc."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <FormField label="Trade Item Description" required>
            <Input
              value={newTemplateForm.item_name}
              onChange={(e) => setNewTemplateForm(prev => ({ ...prev, item_name: e.target.value }))}
              placeholder="e.g. Senior Mason (8hr Shift), JCB Excavator..."
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Classification" required>
              <Select
                value={newTemplateForm.classification}
                onChange={(val) => setNewTemplateForm(prev => ({ ...prev, classification: val }))}
                options={[
                  { value: 'Manpower', label: 'Manpower (Labour)' },
                  { value: 'Equipment', label: 'Equipment / Machinery' },
                  { value: 'Expense', label: 'Expense / Site Allowance' }
                ]}
              />
            </FormField>

            <FormField label="Unit of Measure (UOM)" required>
              <Input
                value={newTemplateForm.uom}
                onChange={(e) => setNewTemplateForm(prev => ({ ...prev, uom: e.target.value }))}
                placeholder="shift / day / trip / hour"
                required
              />
            </FormField>
          </div>

          <FormField label="Default Rate per Unit (₹)" required>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={newTemplateForm.default_rate}
              onChange={(e) => setNewTemplateForm(prev => ({ ...prev, default_rate: e.target.value }))}
              placeholder="e.g. 950.00"
              required
            />
          </FormField>

          <FormField label="Applicable Trade Type (Optional)">
            <Select
              value={newTemplateForm.subcontractor_type_id}
              onChange={(val) => setNewTemplateForm(prev => ({ ...prev, subcontractor_type_id: val }))}
              options={[
                { value: '', label: 'Global (All Trades & Subcontractors)' },
                ...subcontractorTypes.map(t => ({
                  value: String(t.id),
                  label: `${t.contractor_type_name || t.contractor_type_code}`
                }))
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTemplateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingTemplate}
            >
              {savingTemplate ? 'Saving...' : 'Save Trade Template'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 3: View Register Line Items Details                   */}
      {/* ----------------------------------------------------------- */}
      <Modal
        isOpen={Boolean(selectedRegisterDetails)}
        onClose={() => setSelectedRegisterDetails(null)}
        title={`Wage Register #${selectedRegisterDetails?.id}`}
        subtitle={`Date: ${selectedRegisterDetails?.wage_date} | Site: ${selectedRegisterDetails?.site_name} | Contractor: ${selectedRegisterDetails?.contractor_name}`}
        maxWidth="max-w-2xl"
      >
        {selectedRegisterDetails && (
          <div className="space-y-4">
            <div className="border border-border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-surface-muted text-text-secondary text-[10px] uppercase font-bold border-b border-border">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-2 py-2.5 text-center">Type</th>
                    <th className="px-2 py-2.5 text-center">Unit</th>
                    <th className="px-2 py-2.5 text-center">Shifts</th>
                    <th className="px-3 py-2.5 text-right">Rate (₹)</th>
                    <th className="px-3 py-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selectedRegisterDetails.lines || []).map((line, idx) => (
                    <tr key={line.id || idx}>
                      <td className="px-3 py-2 text-text-secondary">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-text-primary">{line.item_name}</td>
                      <td className="px-2 py-2 text-center">
                        <span className="text-[10px] bg-surface-muted px-1.5 py-0.5 rounded font-medium">
                          {line.classification}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-text-muted">{line.uom}</td>
                      <td className="px-2 py-2 text-center font-bold">{line.shift_quantity}</td>
                      <td className="px-3 py-2 text-right">₹{Number(line.unit_rate || 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">₹{Number(line.line_total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-muted/90 border-t-2 border-border font-bold">
                  <tr>
                    <td colSpan="4" className="px-3 py-3 text-right">TOTAL</td>
                    <td className="px-2 py-3 text-center text-primary font-black">{selectedRegisterDetails.total_shifts_count}</td>
                    <td></td>
                    <td className="px-3 py-3 text-right text-emerald-700 font-black text-sm">
                      ₹{Number(selectedRegisterDetails.total_wage_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedRegisterDetails.remarks && (
              <div className="p-3 bg-surface-muted rounded-lg text-xs text-text-secondary">
                <span className="font-bold text-text-primary">Remarks: </span>
                {selectedRegisterDetails.remarks}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-border flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await generateAndDownloadA5SlipFromItem({
                      ...selectedRegisterDetails,
                      voucher_no: selectedRegisterDetails.register_no || `DWR-${selectedRegisterDetails.id}`,
                      payment_date: selectedRegisterDetails.wage_date,
                      total_cost: selectedRegisterDetails.total_wage_amount,
                      trades: (selectedRegisterDetails.lines || []).map((l, i) => ({
                        order: i + 1,
                        item: l.item_name,
                        rate: l.unit_rate,
                        qty: l.shift_quantity,
                        amount: l.line_total_amount,
                        classification: l.classification,
                        unit: l.uom,
                      })),
                    });
                    toast.success('Weekly Slip downloaded!');
                  }}
                  className="h-8 text-xs gap-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  Download Slip (A5 PDF)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    printA5SlipFromItem({
                      ...selectedRegisterDetails,
                      voucher_no: selectedRegisterDetails.register_no || `DWR-${selectedRegisterDetails.id}`,
                      payment_date: selectedRegisterDetails.wage_date,
                      total_cost: selectedRegisterDetails.total_wage_amount,
                      trades: (selectedRegisterDetails.lines || []).map((l, i) => ({
                        order: i + 1,
                        item: l.item_name,
                        rate: l.unit_rate,
                        qty: l.shift_quantity,
                        amount: l.line_total_amount,
                        classification: l.classification,
                        unit: l.uom,
                      })),
                    });
                  }}
                  className="h-8 text-xs gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedRegisterDetails(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
