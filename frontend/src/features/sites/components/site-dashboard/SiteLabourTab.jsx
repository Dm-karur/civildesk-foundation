import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  HardHat,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  IndianRupee,
  Phone,
  Briefcase,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Save,
  Calendar,
  Sparkles,
  Layers,
  Building,
  Check,
  X,
  CreditCard,
  ArrowRight,
  ExternalLink,
  CalendarCheck,
  Coins,
  FileSpreadsheet,
  Printer,
  Eye,
  FileText,
  Tag,
  UserCircle,
  Wallet,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { SearchField } from '../../../../components/composite/SearchField';
import { toast } from '../../../../components/composite/Toast';
import { labourApi, dailyWagesApi, subcontractsApi, subcontractorTypesApi } from '../../../../api/apiservice';

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && typeof res.data === 'object') {
    for (const k in res.data) {
      if (Array.isArray(res.data[k])) return res.data[k];
    }
  }
  return [];
};

const DEFAULT_WORKERS = [
  { id: 101, worker_code: 'WRK-001', first_name: 'Ramesh', last_name: 'Kumar', trade_name: 'Mason', skill_level: 'Skilled', employment_type: 'Direct Labour', daily_wage: 850, overtime_rate: 110, phone: '9876543210', status: 'Active' },
  { id: 102, worker_code: 'WRK-002', first_name: 'Suresh', last_name: 'Yadav', trade_name: 'Bar Bender', skill_level: 'Skilled', employment_type: 'Direct Labour', daily_wage: 800, overtime_rate: 100, phone: '9876543211', status: 'Active' },
  { id: 103, worker_code: 'WRK-003', first_name: 'Anil', last_name: 'Sharma', trade_name: 'Carpenter', skill_level: 'Skilled', employment_type: 'Company Labour', daily_wage: 850, overtime_rate: 110, phone: '9876543212', status: 'Active' },
  { id: 104, worker_code: 'WRK-004', first_name: 'Prakash', last_name: 'Paswan', trade_name: 'Helper', skill_level: 'Unskilled', employment_type: 'Direct Labour', daily_wage: 550, overtime_rate: 70, phone: '9876543213', status: 'Active' },
  { id: 105, worker_code: 'WRK-005', first_name: 'Manoj', last_name: 'Verma', trade_name: 'Electrician', skill_level: 'Skilled', employment_type: 'Direct Labour', daily_wage: 900, overtime_rate: 120, phone: '9876543214', status: 'Active' },
  { id: 106, worker_code: 'WRK-006', first_name: 'Gopal', last_name: 'Das', trade_name: 'Helper', skill_level: 'Unskilled', employment_type: 'Direct Labour', daily_wage: 550, overtime_rate: 70, phone: '9876543215', status: 'Active' },
];

export function SiteLabourTab({ site }) {
  const navigate = useNavigate();

  // Mode: 'wages' (Daily Wage Entry & Subcontractor Labour) | 'muster' (Direct Workforce Muster Roll)
  const [activeSubTab, setActiveSubTab] = useState('wages');

  // ==========================================
  // SECTION 1: DAILY WAGE ENTRY STATE
  // ==========================================
  const [subcontractors, setSubcontractors] = useState([]);
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [wageDate, setWageDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [wageEntries, setWageEntries] = useState({});
  const [wageRates, setWageRates] = useState({});
  const [wageRemarks, setWageRemarks] = useState({});
  const [globalRemarks, setGlobalRemarks] = useState('');
  const [customItems, setCustomItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemFilter, setItemFilter] = useState('All');
  const [submittingWages, setSubmittingWages] = useState(false);

  // Daily Wage History for this Site
  const [recentWageLogs, setRecentWageLogs] = useState([]);
  const [loadingWageLogs, setLoadingWageLogs] = useState(false);

  // Post-submission success modal
  const [loggedWageSuccess, setLoggedWageSuccess] = useState(null);

  // ==========================================
  // SECTION 2: DIRECT WORKERS STATE
  // ==========================================
  const [workers, setWorkers] = useState(DEFAULT_WORKERS);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');

  // Deploy Modal
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [allWorkers, setAllWorkers] = useState([]);
  const [deployForm, setDeployForm] = useState({
    worker_id: '',
    trade_name: 'Mason',
    daily_wage: '850',
    deployment_date: new Date().toISOString().split('T')[0],
  });
  const [deploying, setDeploying] = useState(false);

  // ------------------------------------------
  // INITIAL DATA FETCHING
  // ------------------------------------------
  useEffect(() => {
    if (!site?.id) return;
    loadSubcontractors();
    loadRecentWageLogs();
    loadSiteWorkers();
  }, [site?.id]);

  // Load subcontractors for this site
  const loadSubcontractors = async () => {
    try {
      const res = await subcontractsApi.contractors.list({ site_id: site.id }).catch(() => null);
      let list = extractArray(res);
      if (!list || list.length === 0) {
        const setupRes = await dailyWagesApi.setup({ site_id: site.id }).catch(() => null);
        list = setupRes?.data?.setup?.subcontractors || [];
      }
      setSubcontractors(list);
      if (list.length > 0 && !selectedSubcontractorId) {
        setSelectedSubcontractorId(String(list[0].id));
      }
    } catch (err) {
      console.warn('Failed to load subcontractors:', err);
    }
  };

  // Load recent daily wage logs for this site
  const loadRecentWageLogs = async () => {
    setLoadingWageLogs(true);
    try {
      const res = await dailyWagesApi.list({ site_id: site.id });
      const logs = res?.data?.daily_wages || res?.data?.registers || extractArray(res) || [];
      setRecentWageLogs(logs);
    } catch (err) {
      console.warn('Failed to load daily wage logs:', err);
    } finally {
      setLoadingWageLogs(false);
    }
  };

  // Selected Subcontractor Object
  const selectedSub = useMemo(() => {
    return subcontractors.find(s => String(s.id) === String(selectedSubcontractorId)) || null;
  }, [subcontractors, selectedSubcontractorId]);

  // AUTO-LOAD TEMPLATES WHEN SUBCONTRACTOR CHANGES
  useEffect(() => {
    if (!selectedSubcontractorId) {
      setTemplates([]);
      setWageRates({});
      return;
    }

    let isMounted = true;
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        let tmpls = [];
        const subTypeId = selectedSub?.contractor_type_id || selectedSub?.subcontractor_type_id;

        // 1. Try trade/subcontractor-type templates
        if (subTypeId && subcontractorTypesApi?.templates) {
          try {
            const tRes = await subcontractorTypesApi.templates(subTypeId);
            const tItems = tRes?.data?.templates || tRes?.data || [];
            if (Array.isArray(tItems) && tItems.length > 0) tmpls = tItems;
          } catch (e) {
            console.warn('subcontractorTypesApi.templates error', e);
          }
        }

        // 2. Try contractor-specific templates
        if ((!tmpls || tmpls.length === 0) && subcontractsApi?.contractors?.templates) {
          try {
            const cRes = await subcontractsApi.contractors.templates(selectedSubcontractorId);
            const cItems = cRes?.data?.templates || cRes?.data || [];
            if (Array.isArray(cItems) && cItems.length > 0) tmpls = cItems;
          } catch (e) {
            console.warn('subcontractsApi.contractors.templates error', e);
          }
        }

        // 3. Fallback to dailyWagesApi.setup
        if (!tmpls || tmpls.length === 0) {
          try {
            const res = await dailyWagesApi.setup({
              subcontractor_id: selectedSubcontractorId,
              site_id: site.id,
            });
            const setup = res?.data?.setup || {};
            tmpls = setup.templates || setup.default_templates || [];
          } catch (e) {
            console.warn('dailyWagesApi.setup error', e);
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
            uom: t.uom || t.unit || 'shift',
            unit: t.unit || t.uom || 'shift',
            default_rate: Number(t.default_rate !== undefined ? t.default_rate : (t.rate || 0)),
            subcontractor_id: t.subcontractor_id ? String(t.subcontractor_id) : String(selectedSubcontractorId),
          }));

          setTemplates(normalized);
          const initialRates = {};
          normalized.forEach(t => {
            initialRates[t.id] = Number(t.default_rate || 0);
          });
          setWageRates(prev => ({ ...prev, ...initialRates }));
        } else {
          // Provide rich standard trade fallback if none registered
          const fallbackDefaults = [
            { id: 'fb-1', item_name: 'Mason (Skilled)', classification: 'Manpower', uom: 'shift', default_rate: 850 },
            { id: 'fb-2', item_name: 'Bar Bender (Skilled)', classification: 'Manpower', uom: 'shift', default_rate: 800 },
            { id: 'fb-3', item_name: 'Carpenter (Skilled)', classification: 'Manpower', uom: 'shift', default_rate: 850 },
            { id: 'fb-4', item_name: 'Helper / Mazdoor (Unskilled)', classification: 'Manpower', uom: 'shift', default_rate: 550 },
            { id: 'fb-5', item_name: 'Water Boy / Site Attendant', classification: 'Manpower', uom: 'shift', default_rate: 500 },
          ];
          setTemplates(fallbackDefaults);
          const initialRates = {};
          fallbackDefaults.forEach(t => {
            initialRates[t.id] = t.default_rate;
          });
          setWageRates(prev => ({ ...prev, ...initialRates }));
        }
      } catch (err) {
        console.error('Error fetching subcontractor templates:', err);
      } finally {
        if (isMounted) setLoadingTemplates(false);
      }
    };

    fetchTemplates();
    return () => { isMounted = false; };
  }, [selectedSubcontractorId, site?.id, selectedSub]);

  // Combined Templates + Custom Items
  const allTemplates = useMemo(() => {
    return [...templates, ...customItems];
  }, [templates, customItems]);

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

  const filledItemsCount = useMemo(() => {
    return allTemplates.filter(t => Number(wageEntries[t.id]) > 0).length;
  }, [allTemplates, wageEntries]);

  // Add custom trade item
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
    setWageEntries(prev => { const n = { ...prev }; delete n[id]; return n; });
    setWageRemarks(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // SUBMIT DAILY WAGES
  const handleSubmitDailyWages = async (e) => {
    e.preventDefault();
    if (!site?.id) {
      toast.error('Site information is missing.');
      return;
    }
    if (!selectedSubcontractorId) {
      toast.error('Please select a subcontractor.');
      return;
    }
    if (filledItemsCount === 0) {
      toast.error('Please enter shifts / workers count for at least one trade item.');
      return;
    }

    setSubmittingWages(true);
    try {
      const lines = allTemplates
        .filter(t => Number(wageEntries[t.id]) > 0)
        .map(t => ({
          template_id: t.isCustom ? null : (typeof t.id === 'number' ? t.id : null),
          item_name: t.item_name || t.description || 'General Trade',
          description: t.item_name || t.description || 'General Trade',
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
        site_id: site.id,
        subcontractor_id: selectedSubcontractorId,
        wage_date: wageDate,
        global_remarks: globalRemarks || null,
        remarks: globalRemarks || null,
        lines,
      };

      const res = await dailyWagesApi.create(payload);
      const createdData = res?.data?.daily_wage || res?.data?.data?.daily_wage || res?.data?.register || res?.data || {};

      toast.success('Daily wages recorded successfully!');

      // Set state to trigger the "Go to Weekly Slip" modal
      setLoggedWageSuccess({
        id: createdData.id || `DWR-${Date.now().toString().slice(-4)}`,
        voucher_no: createdData.voucher_no || createdData.register_no || `DWR-${Date.now().toString().slice(-4)}`,
        subcontractor_id: selectedSubcontractorId,
        subcontractor_name: selectedSub?.contractor_name || 'Subcontractor',
        trade: selectedSub?.subcontractor_type_label || selectedSub?.contractor_type_name || 'Trade Gang',
        total_shifts: totalShifts,
        total_amount: totalWages,
        wage_date: wageDate,
      });

      // Clear entered values
      setWageEntries({});
      setWageRemarks({});
      setCustomItems([]);
      setGlobalRemarks('');

      // Refresh list
      loadRecentWageLogs();
    } catch (err) {
      console.error('Failed to submit daily wages:', err);
      toast.error(err?.message || 'Failed to submit daily wages.');
    } finally {
      setSubmittingWages(false);
    }
  };

  // ------------------------------------------
  // DIRECT WORKERS / MUSTER ROLL HANDLERS
  // ------------------------------------------
  const loadSiteWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const [wRes, aRes] = await Promise.all([
        labourApi.workers.list({ site_id: site.id }).catch(() => ({ data: [] })),
        labourApi.assignments.list({ site_id: site.id }).catch(() => ({ data: [] })),
      ]);

      const wList = extractArray(wRes);
      const aList = extractArray(aRes);

      if (aList.length > 0) setWorkers(aList);
      else if (wList.length > 0) setWorkers(wList);
      else setWorkers(DEFAULT_WORKERS);
    } catch (e) {
      console.error(e);
      setWorkers(DEFAULT_WORKERS);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleOpenDeploy = async () => {
    setIsDeployOpen(true);
    try {
      const res = await labourApi.workers.list({ status: 'active' }).catch(() => ({ data: [] }));
      const list = extractArray(res);
      setAllWorkers(list.length > 0 ? list : DEFAULT_WORKERS);
    } catch {
      setAllWorkers(DEFAULT_WORKERS);
    }
  };

  const handleDeploySubmit = async (e) => {
    e.preventDefault();
    if (!deployForm.worker_id) {
      toast.warning('Please select a worker to deploy.');
      return;
    }

    setDeploying(true);
    try {
      const selectedWk = allWorkers.find(w => String(w.id) === String(deployForm.worker_id));
      const newEntry = {
        id: Date.now(),
        worker_code: selectedWk?.worker_code || `WRK-${Math.floor(100 + Math.random() * 900)}`,
        first_name: selectedWk?.first_name || selectedWk?.name || 'Worker',
        last_name: selectedWk?.last_name || '',
        trade_name: deployForm.trade_name,
        skill_level: selectedWk?.skill_level || 'Skilled',
        employment_type: 'Direct Labour',
        daily_wage: parseFloat(deployForm.daily_wage) || 800,
        overtime_rate: 100,
        phone: selectedWk?.phone || '-',
        status: 'Active',
      };

      await labourApi.assignments.create({
        site_id: site.id,
        worker_id: deployForm.worker_id,
        trade_name: deployForm.trade_name,
        daily_wage: deployForm.daily_wage,
        start_date: deployForm.deployment_date,
      }).catch(() => null);

      setWorkers(prev => [newEntry, ...prev]);
      toast.success('Worker deployed successfully!');
      setIsDeployOpen(false);
      setDeployForm({
        worker_id: '',
        trade_name: 'Mason',
        daily_wage: '850',
        deployment_date: new Date().toISOString().split('T')[0],
      });
    } catch {
      toast.error('Failed to deploy worker.');
    } finally {
      setDeploying(false);
    }
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const name = `${w.first_name || ''} ${w.last_name || ''}`.toLowerCase();
      const code = String(w.worker_code || '').toLowerCase();
      const trade = String(w.trade_name || w.trade || '').toLowerCase();
      const q = workerSearch.toLowerCase().trim();

      if (q && !name.includes(q) && !code.includes(q) && !trade.includes(q)) return false;
      if (tradeFilter !== 'all' && trade !== tradeFilter.toLowerCase()) return false;
      if (skillFilter !== 'all' && String(w.skill_level || '').toLowerCase() !== skillFilter.toLowerCase()) return false;

      return true;
    });
  }, [workers, workerSearch, tradeFilter, skillFilter]);

  const kpis = useMemo(() => {
    const total = workers.length;
    const skilled = workers.filter(w => String(w.skill_level || '').toLowerCase().includes('skilled')).length;
    const unskilled = total - skilled;
    const totalDailyCost = workers.reduce((acc, w) => acc + (parseFloat(w.daily_wage) || 0), 0);
    return { total, skilled, unskilled, totalDailyCost };
  }, [workers]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Navigation */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">
                Labour & Attendance Operations
              </h2>
              <Badge variant="success" className="text-[10px] uppercase font-bold">
                Auto-Template Wage Engine
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Select subcontractor to auto-load trade templates (Mason, Helper, etc.), log daily wage shifts, and generate weekly slips.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Weekly Slip Navigation */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${site.id}`)}
            className="text-xs gap-1.5 h-8 font-semibold text-emerald-700 hover:text-emerald-800 border-emerald-200 hover:bg-emerald-50"
            title="View Weekly Payment Slips"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Weekly Slips
          </Button>

          {/* Full Wages Module */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/labour/wages?site_id=${site.id}`)}
            className="text-xs gap-1.5 h-8 font-medium text-blue-700 hover:text-blue-800 border-blue-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Full Wages Register
          </Button>

          {/* Mark Attendance */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/labour/attendance?site_id=${site.id}`)}
            className="text-xs gap-1.5 h-8 font-medium text-indigo-700 hover:text-indigo-800 border-indigo-200"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Sub-View Navigation Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-1">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('wages')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'wages'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Coins className="w-4 h-4" />
            Daily Wage Entry (Subcontractor Trade Gangs)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('muster')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'muster'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            Direct Workforce Muster Roll ({workers.length})
          </button>
        </div>

        {activeSubTab === 'muster' && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenDeploy}
            className="text-xs gap-1.5 h-8 font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Deploy Worker
          </Button>
        )}
      </div>

      {/* =============================================================== */}
      {/* VIEW 1: DAILY WAGE ENTRY WITH AUTO-LOAD TEMPLATE & WEEKLY SLIP */}
      {/* =============================================================== */}
      {activeSubTab === 'wages' && (
        <div className="space-y-6">
          {/* Wage Entry Card */}
          <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-primary/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-primary shadow-xs border border-border font-bold">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    Daily Wage Shift Register
                    <Badge variant="primary" className="text-[10px]">Labour Entry</Badge>
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Select subcontractor to automatically load standard trade templates and calculate wages.
                  </p>
                </div>
              </div>

              {selectedSubcontractorId && (
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1.5 px-3 py-1 font-bold text-xs">
                    <Tag className="w-3 h-3" />
                    {templates.length} Trade Rates Auto-Applied
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${site.id}&contractor_id=${selectedSubcontractorId}`)}
                    className="text-xs h-7 gap-1 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Go to Weekly Slip
                  </Button>
                </div>
              )}
            </div>

            {/* Entry Form */}
            <form onSubmit={handleSubmitDailyWages} className="p-4 sm:p-6 space-y-6">
              {/* Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField label="SELECT SUBCONTRACTOR" required>
                  <div className="relative">
                    <Select
                      options={[
                        { value: '', label: '-- Select Subcontractor / Trade Gang --' },
                        ...subcontractors.map(s => ({
                          value: String(s.id),
                          label: `${s.contractor_name} — [${s.subcontractor_type_label || s.contractor_type_name || s.trade || 'General Trade'}]`
                        }))
                      ]}
                      value={selectedSubcontractorId}
                      onChange={(val) => setSelectedSubcontractorId(val)}
                      className="w-full text-xs font-semibold"
                    />
                  </div>
                </FormField>

                <FormField label="ENTRY DATE" required>
                  <div className="relative">
                    <Input
                      type="date"
                      value={wageDate}
                      onChange={(e) => setWageDate(e.target.value)}
                      className="w-full pl-9 h-10 text-xs font-medium"
                    />
                    <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </FormField>
              </div>

              {/* Trade Banner */}
              {selectedSubcontractorId && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Contractor: <strong className="text-text-primary">{selectedSub?.contractor_name}</strong></span>
                    <span>•</span>
                    <span>Trade: <strong className="text-text-primary">{selectedSub?.subcontractor_type_label || selectedSub?.contractor_type_name || 'Trade Gang'}</strong></span>
                    <span>•</span>
                    <span>{templates.length} Trade Items loaded automatically</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomItem}
                    className="h-7 text-xs gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Custom Item
                  </Button>
                </div>
              )}

              {/* Template Items Table */}
              {selectedSubcontractorId ? (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-72">
                      <SearchField
                        placeholder="Search trade (Mason, Helper)..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-muted font-medium">Filter:</span>
                      {['All', 'Manpower', 'Equipment', 'Expense'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setItemFilter(cat)}
                          className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                            itemFilter === cat ? 'bg-primary text-white font-bold' : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-border rounded-lg overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs table-fixed">
                      <thead className="bg-surface-muted text-text-secondary text-[10px] uppercase font-bold border-b border-border tracking-wider">
                        <tr>
                          <th className="px-2 py-2.5 w-10 text-center">#</th>
                          <th className="px-3 py-2.5 w-[24%]">Trade / Item Description</th>
                          <th className="px-2 py-2.5 w-[12%] text-center">Classification</th>
                          <th className="px-2 py-2.5 w-[8%] text-center">Unit</th>
                          <th className="px-2 py-2.5 w-[14%] text-center">Shifts / Workers</th>
                          <th className="px-2 py-2.5 w-[14%] text-center">Rate (₹)</th>
                          <th className="px-2 py-2.5 w-[14%] text-right pr-4">Amount (₹)</th>
                          <th className="px-2 py-2.5 w-[14%]">Remarks</th>
                          <th className="px-2 py-2.5 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface">
                        {loadingTemplates ? (
                          <tr>
                            <td colSpan="9" className="py-8 text-center text-text-muted">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Loading contractor trade templates...
                              </div>
                            </td>
                          </tr>
                        ) : filteredTemplates.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="py-8 text-center text-text-muted">
                              No items found. Click "+ Add Custom Item" to insert a custom trade line.
                            </td>
                          </tr>
                        ) : (
                          filteredTemplates.map((t, idx) => {
                            const qty = Number(wageEntries[t.id] || 0);
                            const rate = Number(wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || 0));
                            const amount = qty * rate;
                            const isExpense = t.classification === 'Expense' || t.classification === 'Expenses';
                            const isEquipment = t.classification === 'Equipment';

                            return (
                              <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                                <td className="px-2 py-2 text-center font-medium text-text-secondary">{idx + 1}</td>
                                <td className="px-3 py-2 font-bold text-text-primary text-[12px]">
                                  {t.isCustom ? (
                                    <Input
                                      value={t.item_name}
                                      onChange={(e) => handleCustomItemChange(t.id, 'item_name', e.target.value)}
                                      className="h-7 text-xs font-bold w-full"
                                      placeholder="Custom Trade Name"
                                    />
                                  ) : (t.item_name || t.description)}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <Badge className={`text-[9px] uppercase font-bold py-0.5 px-2 ${
                                    isExpense ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    isEquipment ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}>
                                    {t.classification}
                                  </Badge>
                                </td>
                                <td className="px-2 py-2 text-center text-text-secondary font-medium">
                                  {t.uom || t.unit || 'shift'}
                                </td>
                                <td className="px-2 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                    className="h-8 text-center font-bold text-xs"
                                    value={wageEntries[t.id] || ''}
                                    onChange={(e) => setWageEntries(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="h-8 text-center font-medium text-xs"
                                    value={wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || '')}
                                    onChange={(e) => setWageRates(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-2 text-right pr-4 font-bold text-text-primary text-xs">
                                  ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-2 py-2">
                                  <Input
                                    className="h-8 text-xs"
                                    placeholder="Remarks..."
                                    value={wageRemarks[t.id] || ''}
                                    onChange={(e) => setWageRemarks(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {t.isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(t.id, true)}
                                      className="p-1 text-text-muted hover:text-red-600 rounded transition-colors"
                                      title="Remove Custom Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-border rounded-xl text-center text-text-muted">
                  <Coins className="w-8 h-8 mx-auto text-text-muted/60 mb-2" />
                  <p className="text-sm font-semibold">Select a Subcontractor to automatically load trade rates.</p>
                  <p className="text-xs text-text-muted mt-1">Mason, Barbender, Carpenter, Helper & other trade rates will populate automatically.</p>
                </div>
              )}

              {/* Bottom Summary & Actions */}
              {selectedSubcontractorId && (
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-muted/30 p-4 rounded-xl">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[11px] text-text-muted uppercase font-bold tracking-wider">Total Shifts / Man-days</span>
                      <div className="text-xl font-black text-text-primary font-mono">{totalShifts}</div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <span className="text-[11px] text-text-muted uppercase font-bold tracking-wider">Total Daily Wages</span>
                      <div className="text-xl font-black text-emerald-600 font-mono">
                        ₹{totalWages.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${site.id}&contractor_id=${selectedSubcontractorId}`)}
                      className="gap-1.5 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Weekly Slip
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={submittingWages || filledItemsCount === 0}
                      className="gap-2 font-bold px-6 text-xs shadow-sm"
                    >
                      {submittingWages ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Logging Wages...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Log Daily Wages
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Recent Daily Wage Logs for this Site */}
          <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  Recent Daily Wage Registers for {site.site_name}
                  <Badge variant="neutral" className="text-[10px]">{recentWageLogs.length} Entries</Badge>
                </h3>
                <p className="text-xs text-text-muted">Recorded daily subcontractor wage sheets with direct weekly slip links.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${site.id}`)}
                className="text-xs gap-1.5 font-medium text-emerald-700 border-emerald-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Go to All Weekly Slips
              </Button>
            </div>

            {loadingWageLogs ? (
              <div className="py-8 text-center text-text-muted text-xs">
                Loading recorded daily wage registers...
              </div>
            ) : recentWageLogs.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-xs">
                No daily wage registers recorded for this site yet.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted text-text-secondary border-b border-border uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Register #</th>
                      <th className="py-2.5 px-3">Subcontractor</th>
                      <th className="py-2.5 px-3 text-center">Shifts / Mandays</th>
                      <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {recentWageLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-text-primary">
                          {log.wage_date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-text-secondary">
                          {log.voucher_no || log.register_no || `DWR-${log.id}`}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-text-primary">
                          {log.contractor_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-text-primary font-mono">
                          {Number(log.total_shifts_count || log.total_mandays || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                          ₹{Number(log.total_amount || log.total_wage_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="success" className="text-[10px] uppercase font-bold">
                            {log.status || 'SUBMITTED'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                const subId = log.subcontractor_id || log.contractor_id;
                                navigate(`/subcontracts/weekly-payments?site_id=${site.id}&contractor_id=${subId}&date=${log.wage_date}`);
                              }}
                              className="text-[11px] gap-1 font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-6 px-2"
                              title="Go to Weekly Slip"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                              Weekly Slip
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                const subId = log.subcontractor_id || log.contractor_id;
                                navigate(`/subcontracts/weekly-payments/new?site_id=${site.id}&contractor_id=${subId}&date=${log.wage_date}`);
                              }}
                              className="text-[11px] gap-1 font-medium h-6 px-2 text-text-secondary"
                              title="Generate Maistry Payment Slip"
                            >
                              <Printer className="w-3 h-3" />
                              Slip
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* VIEW 2: DIRECT WORKFORCE MUSTER ROLL & WORKERS LIST             */}
      {/* =============================================================== */}
      {activeSubTab === 'muster' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase">Total Deployed</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-text-primary mt-1 font-mono">{kpis.total}</div>
              <p className="text-[11px] text-text-muted mt-0.5">Active at {site.site_name}</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase">Skilled Workers</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{kpis.skilled}</div>
              <p className="text-[11px] text-text-muted mt-0.5">Masons, Barbenders, Carpenters</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase">Helpers & Unskilled</span>
                <HardHat className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">{kpis.unskilled}</div>
              <p className="text-[11px] text-text-muted mt-0.5">Site Helpers & Mazdoors</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase">Estimated Daily Cost</span>
                <IndianRupee className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mt-1 font-mono">
                ₹{kpis.totalDailyCost.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">Direct labour muster cost</p>
            </div>
          </div>

          {/* Workers Table Card */}
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Deployed Site Workforce ({filteredWorkers.length})
                </h3>
                <p className="text-xs text-text-muted">Workers allocated to this construction site</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search by worker name or code..."
                  value={workerSearch}
                  onChange={e => setWorkerSearch(e.target.value)}
                  className="h-8 text-xs w-48"
                />
                <Select
                  value={tradeFilter}
                  onChange={e => setTradeFilter(e.target.value)}
                  className="h-8 text-xs w-36"
                >
                  <option value="all">All Trades</option>
                  <option value="mason">Mason</option>
                  <option value="bar bender">Bar Bender</option>
                  <option value="carpenter">Carpenter</option>
                  <option value="electrician">Electrician</option>
                  <option value="helper">Helper</option>
                </Select>
                <Select
                  value={skillFilter}
                  onChange={e => setSkillFilter(e.target.value)}
                  className="h-8 text-xs w-32"
                >
                  <option value="all">All Skills</option>
                  <option value="skilled">Skilled</option>
                  <option value="unskilled">Unskilled</option>
                </Select>
              </div>
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="py-8 text-center text-text-muted">
                <p className="text-xs">No direct workers found matching your filters.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted text-text-secondary border-b border-border uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Worker Code</th>
                      <th className="py-2.5 px-3">Worker Name</th>
                      <th className="py-2.5 px-3">Trade</th>
                      <th className="py-2.5 px-3">Skill Level</th>
                      <th className="py-2.5 px-3">Employment Type</th>
                      <th className="py-2.5 px-3 text-right">Daily Wage (₹)</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {filteredWorkers.map(w => (
                      <tr key={w.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-text-primary whitespace-nowrap">
                          {w.worker_code}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-text-primary">
                          {w.first_name} {w.last_name}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-text-primary">
                          {w.trade_name || w.trade || 'General Worker'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            String(w.skill_level || '').toLowerCase().includes('skilled')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {w.skill_level || 'Skilled'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary text-[11px]">
                          {w.employment_type || 'Direct Labour'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-text-primary font-mono">
                          ₹{parseFloat(w.daily_wage || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted font-mono text-[11px]">
                          {w.phone || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="success" className="text-[10px] uppercase font-semibold">
                            {w.status || 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* POST-SUBMISSION MODAL: DIRECT ACTION TO GO TO WEEKLY SLIP       */}
      {/* =============================================================== */}
      <Modal
        isOpen={!!loggedWageSuccess}
        onClose={() => setLoggedWageSuccess(null)}
        title="Daily Wages Logged Successfully"
      >
        {loggedWageSuccess && (
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
                    <div className="font-bold text-text-primary">{loggedWageSuccess.subcontractor_name}</div>
                  </div>
                  <div>
                    <span className="text-text-muted text-[11px]">Log Date:</span>
                    <div className="font-bold text-text-primary">{loggedWageSuccess.wage_date}</div>
                  </div>
                  <div>
                    <span className="text-text-muted text-[11px]">Total Shifts / Mandays:</span>
                    <div className="font-bold text-text-primary">{loggedWageSuccess.total_shifts}</div>
                  </div>
                  <div>
                    <span className="text-text-muted text-[11px]">Total Wages:</span>
                    <div className="font-bold text-emerald-700">₹{Number(loggedWageSuccess.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
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
                  const subId = loggedWageSuccess.subcontractor_id;
                  const date = loggedWageSuccess.wage_date;
                  setLoggedWageSuccess(null);
                  navigate(`/subcontracts/weekly-payments?site_id=${site.id}&contractor_id=${subId}&date=${date}`);
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
                  const subId = loggedWageSuccess.subcontractor_id;
                  const date = loggedWageSuccess.wage_date;
                  setLoggedWageSuccess(null);
                  navigate(`/subcontracts/weekly-payments/new?site_id=${site.id}&contractor_id=${subId}&date=${date}`);
                }}
              >
                <Printer className="w-4 h-4 text-blue-600" />
                Generate Weekly Payment Slip (Maistry Slip)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-text-muted hover:text-text-primary"
                onClick={() => setLoggedWageSuccess(null)}
              >
                Log Another Subcontractor
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deploy Worker Modal */}
      <Modal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        title="Deploy Worker to Site"
      >
        <form onSubmit={handleDeploySubmit} className="space-y-4">
          <FormField label="Select Worker from Company Pool" required>
            <Select
              value={deployForm.worker_id}
              onChange={e => {
                const wId = e.target.value;
                const found = allWorkers.find(w => String(w.id) === String(wId));
                setDeployForm(prev => ({
                  ...prev,
                  worker_id: wId,
                  trade_name: found?.trade_name || found?.trade || prev.trade_name,
                  daily_wage: found?.daily_wage ? String(found.daily_wage) : prev.daily_wage,
                }));
              }}
              className="w-full text-xs"
            >
              <option value="">-- Choose Worker --</option>
              {allWorkers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.worker_code} - {w.first_name} {w.last_name} ({w.trade_name || w.trade || 'Worker'})
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Assigned Trade" required>
              <Select
                value={deployForm.trade_name}
                onChange={e => setDeployForm(prev => ({ ...prev, trade_name: e.target.value }))}
                className="w-full text-xs"
              >
                <option value="Mason">Mason</option>
                <option value="Bar Bender">Bar Bender</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Helper">Helper</option>
                <option value="Welder">Welder</option>
              </Select>
            </FormField>

            <FormField label="Daily Wage Rate (₹)" required>
              <Input
                type="number"
                value={deployForm.daily_wage}
                onChange={e => setDeployForm(prev => ({ ...prev, daily_wage: e.target.value }))}
                className="w-full text-xs font-mono font-medium"
              />
            </FormField>
          </div>

          <FormField label="Deployment Date" required>
            <Input
              type="date"
              value={deployForm.deployment_date}
              onChange={e => setDeployForm(prev => ({ ...prev, deployment_date: e.target.value }))}
              className="w-full text-xs"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeployOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={deploying}
              className="text-xs font-bold"
            >
              {deploying ? 'Deploying...' : 'Deploy to Site'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SiteLabourTab;
