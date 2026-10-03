import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HardHat, Printer, Download, Save, List, Plus, Trash2,
  RotateCcw, Check, CheckSquare, Square, ChevronDown,
  ArrowLeft, FileText, Calendar, Building2, User, CheckCircle2
} from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, subcontractsApi, dailyWagesApi } from '../../../api/apiservice';
import { generateAndDownloadA5SlipFromItem, printA5SlipFromItem } from '../utils/a5SlipExportUtils';

const LOCAL_SLIPS_KEY = 'mock_maistry_slips';
const WEEKLY_PAYMENTS_KEY = 'mock_subcontractor_weekly_payments';

const INITIAL_SITES = [
  { id: 'SITE-01', name: 'BHARANI GARDEN', client: 'Sakthivel', code: 'BG-01' },
  { id: 'SITE-02', name: 'Greenfield Residency', client: 'K. Sundaramoorthy', code: 'GFR-01' },
  { id: 'SITE-03', name: 'Ajantha Theater Trichy Site', client: 'Trichy Cinemas', code: 'ATT-08' },
  { id: 'SITE-04', name: 'Karur Kulathupalayam Site', client: 'Karur Infra', code: 'KKP-02' }
];

const INITIAL_MAISTRIES = [
  { id: '1', name: 'Saravanan (Centering)', trade: 'Centering', site_id: 'SITE-01', phone: '98421 22345', log_count: 11 },
  { id: '2', name: 'Murugan (Masonry)', trade: 'Masonry', site_id: 'SITE-01', phone: '97890 54321', log_count: 8 },
  { id: '3', name: 'Apex Selvam (Steel Binding)', trade: 'Steel Binding', site_id: 'SITE-02', phone: '94432 99881', log_count: 14 },
  { id: '4', name: 'Kaveri Kumar (Carpentry)', trade: 'Formwork', site_id: 'SITE-01', phone: '98940 33445', log_count: 6 },
  { id: '5', name: 'Shiva (Plumbing Gang)', trade: 'Plumbing', site_id: 'SITE-03', phone: '96554 11223', log_count: 9 }
];

const DEFAULT_ROWS = [
  {
    category: 'LABOUR / MANPOWER',
    items: [
      { id: 'l-1', description: 'Head Mason', rate: 800, days: ['', '', '', '', '', '', ''] },
      { id: 'l-2', description: 'Male Helper', rate: 400, days: ['', '', '', '', '', '', ''] },
      { id: 'l-3', description: 'Female Helper', rate: 300, days: ['', '', '', '', '', '', ''] },
    ]
  },
  {
    category: 'EQUIPMENT / RENTALS',
    items: [
      { id: 'e-1', description: 'Mixer Machine Rent', rate: 1200, days: ['', '', '', '', '', '', ''] },
      { id: 'e-2', description: 'Vibrator & Equipment Rent', rate: 500, days: ['', '', '', '', '', '', ''] }
    ]
  },
  {
    category: 'EXPENSES & CHARGES',
    items: [
      { id: 'ex-1', description: 'Binding Wire & Nails', rate: 0, days: ['', '', '', '', '', '', ''] },
      { id: 'ex-2', description: 'Transport & Fuel', rate: 0, days: ['', '', '', '', '', '', ''] },
      { id: 'ex-3', description: 'Tea & Food Allowance', rate: 0, days: ['', '', '', '', '', '', ''] }
    ]
  }
];

const toYMD = (d) => {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMondayOfWeek = (dateStr) => {
  let d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return toYMD(monday);
};

const getSundayOfWeek = (mondayStr) => {
  if (!mondayStr) return '';
  const parts = mondayStr.split('-').map(Number);
  if (parts.length < 3) return '';
  const sunday = new Date(parts[0], parts[1] - 1, parts[2] + 6);
  return toYMD(sunday);
};

export function MaistrySlipPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const paramContractorId = searchParams.get('contractor_id');
  const paramSiteId = searchParams.get('site_id');
  const paramDate = searchParams.get('date');
  const slipPrintRef = useRef(null);

  // Compute initial Monday and Sunday
  const initialMonday = useMemo(() => getMondayOfWeek(paramDate), [paramDate]);
  const initialSunday = useMemo(() => getSundayOfWeek(initialMonday), [initialMonday]);

  // Top Selectors
  const [sites, setSites] = useState(INITIAL_SITES);
  const [maistries, setMaistries] = useState(INITIAL_MAISTRIES);
  const [selectedSiteId, setSelectedSiteId] = useState(paramSiteId || 'SITE-01');
  const [selectedMaistryId, setSelectedMaistryId] = useState(paramContractorId || '');

  // Dates (7-day week period)
  const [startDate, setStartDate] = useState(initialMonday);
  const [endDate, setEndDate] = useState(initialSunday);

  // Slip Style Theme: 'white' or 'yellow'
  const [slipTheme, setSlipTheme] = useState('white');

  // Options
  const [enableMaistryPct, setEnableMaistryPct] = useState(false);
  const [maistryPctValue, setMaistryPctValue] = useState(5);
  const [roundOff, setRoundOff] = useState(true);

  // Table Categories & Rows
  const [categories, setCategories] = useState(DEFAULT_ROWS);

  // Metadata
  const [refNo, setRefNo] = useState(`MST-${Date.now().toString().slice(-4)}`);
  const [savedSlips, setSavedSlips] = useState([]);
  const [syncNotice, setSyncNotice] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Declare loadSlipIntoForm BEFORE any useEffect to avoid ReferenceError
  const loadSlipIntoForm = (slip) => {
    if (!slip) return;
    if (slip.site_id) setSelectedSiteId(String(slip.site_id));
    if (slip.maistry_id || slip.contractor_id || slip.subcontractor_id) {
      setSelectedMaistryId(String(slip.maistry_id || slip.contractor_id || slip.subcontractor_id));
    }
    const slipStart = slip.start_date || slip.week_start || slip.wage_date;
    const slipEnd = slip.end_date || slip.week_end || slip.wage_date;
    if (slipStart) {
      const mon = getMondayOfWeek(slipStart);
      const sun = getSundayOfWeek(mon);
      setStartDate(mon);
      setEndDate(sun);
    } else if (slipEnd) {
      setEndDate(slipEnd);
    }
    if (slip.ref_no || slip.voucher_no || slip.register_no) {
      setRefNo(slip.ref_no || slip.voucher_no || slip.register_no);
    }

    if (slip.categories && Array.isArray(slip.categories)) {
      setCategories(slip.categories);
    } else if (slip.lines && Array.isArray(slip.lines) && slip.lines.length > 0) {
      const mon = getMondayOfWeek(slipStart || new Date());
      let dayIdx = 4;
      if (slipStart && mon) {
        const d1 = new Date(slipStart);
        const d0 = new Date(mon);
        const diff = Math.round((d1 - d0) / 86400000);
        if (diff >= 0 && diff < 7) dayIdx = diff;
      }

      const labour = [];
      const equip = [];
      const expense = [];

      slip.lines.forEach((l, idx) => {
        const days = ['', '', '', '', '', '', ''];
        days[dayIdx] = String(l.quantity || '');
        const itemObj = {
          id: `line-${l.id || idx}`,
          description: l.description,
          rate: Number(l.rate) || 0,
          days
        };
        const cls = String(l.classification || '').toLowerCase();
        if (cls === 'equipment') equip.push(itemObj);
        else if (cls === 'expense') expense.push(itemObj);
        else labour.push(itemObj);
      });

      setCategories([
        { category: 'LABOUR / MANPOWER', items: labour.length > 0 ? labour : DEFAULT_ROWS[0].items },
        { category: 'EQUIPMENT / RENTALS', items: equip.length > 0 ? equip : DEFAULT_ROWS[1].items },
        { category: 'EXPENSES & CHARGES', items: expense.length > 0 ? expense : DEFAULT_ROWS[2].items }
      ]);
    } else if (slip.trades && Array.isArray(slip.trades)) {
      const mon = getMondayOfWeek(slipStart || new Date());
      let dayIdx = 4;
      if (slipStart && mon) {
        const d1 = new Date(slipStart);
        const d0 = new Date(mon);
        const diff = Math.round((d1 - d0) / 86400000);
        if (diff >= 0 && diff < 7) dayIdx = diff;
      }

      const labour = slip.trades.map((t, idx) => {
        const days = ['', '', '', '', '', '', ''];
        days[dayIdx] = String(t.qty || '');
        return {
          id: `synced-${idx}`,
          description: t.item || 'Labour',
          rate: Number(t.rate) || 800,
          days
        };
      });
      setCategories([
        { category: 'LABOUR / MANPOWER', items: labour.length > 0 ? labour : DEFAULT_ROWS[0].items },
        { category: 'EQUIPMENT / RENTALS', items: DEFAULT_ROWS[1].items },
        { category: 'EXPENSES & CHARGES', items: DEFAULT_ROWS[2].items }
      ]);
    }

    if (slip.enable_maistry_pct !== undefined) setEnableMaistryPct(Boolean(slip.enable_maistry_pct));
    if (slip.maistry_pct_value !== undefined) setMaistryPctValue(slip.maistry_pct_value);
    if (slip.round_off !== undefined) setRoundOff(Boolean(slip.round_off));
  };

  // Load saved slips & existing edit id
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_SLIPS_KEY) || '[]');
      setSavedSlips(saved);

      if (editId) {
        let found = saved.find(s => s.id === editId || s.ref_no === editId);
        if (!found) {
          const weeklySaved = JSON.parse(localStorage.getItem(WEEKLY_PAYMENTS_KEY) || '[]');
          found = weeklySaved.find(w => w.id === editId || w.voucher_no === editId);
        }
        if (found) {
          loadSlipIntoForm(found);
        } else {
          const cleanId = String(editId).replace(/^dwr-/, '');
          if (/^\d+$/.test(cleanId)) {
            dailyWagesApi.get(cleanId).then(res => {
              const reg = res?.data?.daily_wage;
              if (reg) {
                loadSlipIntoForm({
                  ...reg,
                  id: `dwr-${reg.id}`,
                  voucher_no: reg.register_no || `DWR-${reg.id}`,
                  ref_no: reg.register_no || `DWR-${reg.id}`,
                  week_start: reg.wage_date,
                  week_end: reg.wage_date,
                  site_id: String(reg.site_id),
                  contractor_id: String(reg.subcontractor_id),
                  lines: reg.lines || []
                });
              }
            }).catch(() => {});
          }
        }
      } else if (paramContractorId && paramDate) {
        dailyWagesApi.list({ subcontractor_id: paramContractorId, date: paramDate }).then(res => {
          const regs = res?.data?.registers ?? res?.data?.daily_wages ?? (Array.isArray(res?.data) ? res.data : []);
          if (regs.length > 0) {
            const reg = regs[0];
            loadSlipIntoForm({
              ...reg,
              id: `dwr-${reg.id}`,
              voucher_no: reg.register_no || `DWR-${reg.id}`,
              ref_no: reg.register_no || `DWR-${reg.id}`,
              week_start: reg.wage_date,
              week_end: reg.wage_date,
              site_id: String(reg.site_id),
              contractor_id: String(reg.subcontractor_id),
              lines: reg.lines || []
            });
          }
        }).catch(() => {});
      }
    } catch {
      setSavedSlips([]);
    }
  }, [editId, paramContractorId, paramDate]);

  // Set initial query params if present
  useEffect(() => {
    if (paramContractorId) setSelectedMaistryId(String(paramContractorId));
    if (paramSiteId) setSelectedSiteId(String(paramSiteId));
    if (paramDate) {
      const mon = getMondayOfWeek(paramDate);
      const sun = getSundayOfWeek(mon);
      setStartDate(mon);
      setEndDate(sun);
    }
  }, [paramContractorId, paramSiteId, paramDate]);

  // Load project sites & live subcontractors
  useEffect(() => {
    projectsApi.list().then(res => {
      const pList = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(pList) && pList.length > 0) {
        const mapped = pList.map((p, i) => ({
          id: String(p.id),
          name: p.project_name || p.name,
          client: p.client_name || 'Project Client',
          code: p.project_code || `SITE-0${i + 1}`
        }));
        setSites(mapped);
      }
    }).catch(() => {});

    // Live Subcontractors from API
    subcontractsApi.contractors.list().then(res => {
      const list = res?.data?.subcontractors ?? res?.data?.data ?? (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map(s => ({
          id: String(s.id),
          name: s.contractor_name || s.name,
          trade: s.contractor_type_name || s.trade || 'Subcontractor Gang',
          site_id: 'SITE-01',
          phone: s.phone || '',
          log_count: 5,
        }));
        setMaistries(mapped);
        
        // Pick active contractor
        if (paramContractorId && mapped.some(m => m.id === String(paramContractorId))) {
          setSelectedMaistryId(String(paramContractorId));
        } else if (!selectedMaistryId && mapped.length > 0) {
          // Check if there is any recent log in global_subcon_daily_logs
          try {
            const globalLogs = JSON.parse(localStorage.getItem('global_subcon_daily_logs') || '[]');
            if (globalLogs.length > 0 && globalLogs[0].contractor_id) {
              const matched = mapped.find(m => m.id === String(globalLogs[0].contractor_id));
              if (matched) {
                setSelectedMaistryId(matched.id);
                return;
              }
            }
          } catch {}
          setSelectedMaistryId(mapped[0].id);
        }
      }
    }).catch(() => {
      try {
        const subs = JSON.parse(localStorage.getItem('mock_subcontractors_master') || '[]');
        if (subs.length > 0) {
          const mapped = subs.map((s, i) => ({
            id: String(s.id),
            name: `${s.contractor_name} (${s.trade || 'General'})`,
            trade: s.trade || 'General Civil',
            site_id: 'SITE-01',
            phone: s.phone || '',
            log_count: 5 + i
          }));
          setMaistries(mapped);
          if (!selectedMaistryId) setSelectedMaistryId(mapped[0].id);
        }
      } catch {}
    });
  }, [paramContractorId]);

  const selectedSite = useMemo(() => {
    return sites.find(s => s.id === selectedSiteId) || sites[0] || { name: 'BHARANI GARDEN', client: 'Sakthivel' };
  }, [sites, selectedSiteId]);

  const selectedMaistry = useMemo(() => {
    return maistries.find(m => m.id === selectedMaistryId) || maistries[0] || { name: 'Saravanan (Centering)', trade: 'Centering' };
  }, [maistries, selectedMaistryId]);

  // Compute 7 days list from startDate with timezone immunity
  const dateColumns = useMemo(() => {
    if (!startDate) return [];
    const dates = [];
    try {
      const parts = startDate.split('-').map(Number);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(parts[0], parts[1] - 1, parts[2] + i);
        const day = String(cur.getDate()).padStart(2, '0');
        const month = String(cur.getMonth() + 1).padStart(2, '0');
        const fullDate = `${cur.getFullYear()}-${month}-${day}`;
        dates.push({
          label: `${day}/${month}`,
          fullDate,
          dayName: cur.toLocaleDateString('en-US', { weekday: 'short' }),
        });
      }
    } catch {
      return [
        { label: '25/08', fullDate: '2026-08-25' },
        { label: '26/08', fullDate: '2026-08-26' },
        { label: '27/08', fullDate: '2026-08-27' },
        { label: '28/08', fullDate: '2026-08-28' },
        { label: '29/08', fullDate: '2026-08-29' },
        { label: '30/08', fullDate: '2026-08-30' },
        { label: '31/08', fullDate: '2026-08-31' },
      ];
    }
    return dates;
  }, [startDate]);

  // Quick Date Ranges
  const handleQuickLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setStartDate(toYMD(start));
    setEndDate(toYMD(end));
  };

  const handleQuickThisWeek = () => {
    const mon = getMondayOfWeek(new Date());
    const sun = getSundayOfWeek(mon);
    setStartDate(mon);
    setEndDate(sun);
  };

  // Add Rows
  const handleAddRow = (targetCategory) => {
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.category === targetCategory) {
          return {
            ...cat,
            items: [
              ...cat.items,
              {
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                description: '',
                rate: 0,
                days: ['', '', '', '', '', '', '']
              }
            ]
          };
        }
        return cat;
      });
    });
  };

  const handleAddCustomCategory = () => {
    const newCatName = prompt('Enter custom category name:', 'OTHERS / CUSTOM');
    if (!newCatName) return;
    setCategories(prev => [
      ...prev,
      {
        category: newCatName.toUpperCase(),
        items: [
          {
            id: `item-${Date.now()}`,
            description: 'Custom Item',
            rate: 0,
            days: ['', '', '', '', '', '', '']
          }
        ]
      }
    ]);
  };

  // Modify Row
  const handleUpdateItem = (catIndex, itemIndex, field, value) => {
    setCategories(prev => {
      const next = [...prev];
      const targetCat = { ...next[catIndex] };
      const items = [...targetCat.items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      targetCat.items = items;
      next[catIndex] = targetCat;
      return next;
    });
  };

  const handleUpdateDay = (catIndex, itemIndex, dayIndex, value) => {
    setCategories(prev => {
      const next = [...prev];
      const targetCat = { ...next[catIndex] };
      const items = [...targetCat.items];
      const days = [...items[itemIndex].days];
      days[dayIndex] = value;
      items[itemIndex] = { ...items[itemIndex], days };
      targetCat.items = items;
      next[catIndex] = targetCat;
      return next;
    });
  };

  const handleDeleteItem = (catIndex, itemIndex) => {
    setCategories(prev => {
      const next = [...prev];
      const targetCat = { ...next[catIndex] };
      targetCat.items = targetCat.items.filter((_, idx) => idx !== itemIndex);
      next[catIndex] = targetCat;
      return next;
    });
  };

  // Calculate totals
  const { subTotal, grandTotal, maistryCommission } = useMemo(() => {
    let total = 0;
    categories.forEach(cat => {
      cat.items.forEach(item => {
        const rate = Number(item.rate) || 0;
        const qty = Math.round(item.days.reduce((acc, d) => acc + (Number(d) || 0), 0) * 100) / 100;
        total += Math.round(qty * rate * 100) / 100;
      });
    });

    let commission = 0;
    if (enableMaistryPct) {
      commission = Math.round(total * (Number(maistryPctValue) / 100));
    }

    let finalTotal = total + commission;
    if (roundOff) {
      finalTotal = Math.round(finalTotal / 10) * 10;
    } else {
      finalTotal = Math.round(finalTotal * 100) / 100;
    }

    return {
      subTotal: Math.round(total * 100) / 100,
      maistryCommission: commission,
      grandTotal: finalTotal
    };
  }, [categories, enableMaistryPct, maistryPctValue, roundOff]);

  // Reload Logs from DB and Site Labour Store
  const handleReloadLogs = async (targetConId = null, targetStart = null) => {
    const conId = targetConId || selectedMaistryId;
    if (!conId) return;

    try {
      let candidateLogs = [];

      // Query real database daily wage registers
      try {
        const dbRes = await dailyWagesApi.list({ subcontractor_id: conId }).catch(() => null);
        const dbRegs = dbRes?.data?.registers ?? dbRes?.data?.daily_wages ?? (Array.isArray(dbRes?.data) ? dbRes.data : []);
        if (Array.isArray(dbRegs) && dbRegs.length > 0) {
          dbRegs.forEach(reg => {
            candidateLogs.push({
              id: `db-dwr-${reg.id}`,
              date: reg.wage_date,
              contractor_id: String(reg.subcontractor_id),
              contractor_name: reg.subcontractor_name || reg.contractor_name,
              total_workers: Number(reg.total_mandays) || 1,
              total_cost: Number(reg.total_amount) || 0,
              trades: (reg.lines || []).map(l => ({
                item: l.description,
                rate: Number(l.rate),
                qty: Number(l.quantity),
                amount: Number(l.amount),
                classification: l.classification
              }))
            });
          });
        }
      } catch {}

      // Global store
      const globalLogs = JSON.parse(localStorage.getItem('global_subcon_daily_logs') || '[]');
      if (Array.isArray(globalLogs)) {
        candidateLogs.push(...globalLogs);
      }

      // Site-specific stores
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('site_') && key.endsWith('_subcon_daily_logs')) {
          try {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(arr)) {
              candidateLogs.push(...arr);
            }
          } catch {}
        }
      }

      // Resolve contractor object
      const targetConObj = maistries.find(m => String(m.id) === String(conId));
      const targetName = (targetConObj?.name || '').toLowerCase().trim();

      // Filter by contractor ID or Name
      const conLogs = candidateLogs.filter(l => {
        if (String(l.contractor_id) === String(conId)) return true;
        const lName = (l.contractor_name || '').toLowerCase().trim();
        if (targetName && lName && (targetName.includes(lName) || lName.includes(targetName))) return true;
        return false;
      });

      // Deduplicate candidate logs by unique id
      const uniqueMap = new Map();
      conLogs.forEach(l => uniqueMap.set(l.id || `${l.date}_${l.contractor_id}`, l));
      const deduplicatedLogs = Array.from(uniqueMap.values());

      if (deduplicatedLogs.length === 0) {
        setSyncNotice({
          type: 'empty',
          message: `No site logs found for ${targetConObj?.name || 'this contractor'}. Template ready for manual entry.`
        });
        return;
      }

      // Determine active date range
      let effectiveStart = targetStart || startDate;
      let effectiveEnd = endDate;

      // Check if any logs fall in current [effectiveStart, effectiveEnd]
      let logsInRange = deduplicatedLogs.filter(l => l.date >= effectiveStart && l.date <= effectiveEnd);

      // If no logs in current range, find the latest log date and auto-align the 7-day week!
      if (logsInRange.length === 0 && deduplicatedLogs.length > 0) {
        const sortedLogs = [...deduplicatedLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const latestDate = sortedLogs[0].date;
        if (latestDate) {
          effectiveStart = getMondayOfWeek(latestDate);
          effectiveEnd = getSundayOfWeek(effectiveStart);
          setStartDate(effectiveStart);
          setEndDate(effectiveEnd);
          logsInRange = deduplicatedLogs.filter(l => l.date >= effectiveStart && l.date <= effectiveEnd);
        }
      }

      // Map 7 dates using effectiveStart
      const dateMap = {};
      const parts = effectiveStart.split('-').map(Number);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(parts[0], parts[1] - 1, parts[2] + i);
        const day = String(cur.getDate()).padStart(2, '0');
        const month = String(cur.getMonth() + 1).padStart(2, '0');
        const fullDate = `${cur.getFullYear()}-${month}-${day}`;
        dateMap[fullDate] = i;
      }

      // Aggregate quantities by trade item
      const itemAgg = {};
      let totalFound = 0;
      let totalCostFound = 0;

      // Ensure configured template items (Head Mason, Male Helper, Female Helper) are always present
      DEFAULT_ROWS[0].items.forEach(def => {
        itemAgg[def.description] = {
          rate: def.rate,
          days: ['', '', '', '', '', '', ''],
          classification: 'manpower',
        };
      });

      logsInRange.forEach(log => {
        const colIdx = dateMap[log.date];
        if (colIdx !== undefined && Array.isArray(log.trades)) {
          log.trades.forEach(tr => {
            const itemName = tr.item || 'Labour';
            if (!itemAgg[itemName]) {
              itemAgg[itemName] = {
                rate: Number(tr.rate) || 800,
                days: ['', '', '', '', '', '', ''],
                classification: tr.classification || 'manpower',
              };
            }
            const currentVal = Number(itemAgg[itemName].days[colIdx]) || 0;
            const added = Number(tr.qty) || 0;
            if (added > 0) {
              itemAgg[itemName].days[colIdx] = String(currentVal + added);
              totalFound += added;
              totalCostFound += added * (Number(tr.rate) || itemAgg[itemName].rate);
            }
          });
        }
      });

      if (totalFound > 0) {
        const labourItems = [];
        const equipItems = [];
        const expenseItems = [];

        Object.entries(itemAgg).forEach(([name, data], idx) => {
          const rowObj = {
            id: `synced-${idx}`,
            description: name,
            rate: data.rate,
            days: data.days,
          };
          if (data.classification === 'equipment') {
            equipItems.push(rowObj);
          } else if (data.classification === 'expense') {
            expenseItems.push(rowObj);
          } else {
            labourItems.push(rowObj);
          }
        });

        setCategories([
          {
            category: 'LABOUR / MANPOWER',
            items: labourItems.length > 0 ? labourItems : DEFAULT_ROWS[0].items,
          },
          {
            category: 'EQUIPMENT / RENTALS',
            items: equipItems.length > 0 ? equipItems : DEFAULT_ROWS[1].items,
          },
          {
            category: 'EXPENSES & CHARGES',
            items: expenseItems.length > 0 ? expenseItems : DEFAULT_ROWS[2].items,
          },
        ]);

        setSyncNotice({
          type: 'success',
          message: `Loaded ${totalFound} worker mandays (₹${totalCostFound.toLocaleString('en-IN')}) from Site Labour for ${targetConObj?.name || 'Contractor'}.`
        });
        toast.success(`Loaded ${totalFound} worker days from Site Labour into slip!`);
        return;
      }

      setSyncNotice({
        type: 'info',
        message: `Found ${deduplicatedLogs.length} logs for other dates, but none between ${effectiveStart} and ${effectiveEnd}.`
      });
      toast.info(`Found logs for other dates, but none between ${effectiveStart} and ${effectiveEnd}. Adjust dates to view.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load daily logs.');
    }
  };

  // Auto-reload logs when contractor changes
  useEffect(() => {
    if (selectedMaistryId) {
      handleReloadLogs(selectedMaistryId);
    }
  }, [selectedMaistryId]);

  // Save Slip
  const handleSaveSlip = () => {
    const slipId = editId || `slip-${Date.now()}`;
    const newSlip = {
      id: slipId,
      ref_no: refNo,
      site_id: selectedSiteId,
      site_name: selectedSite.name,
      client_name: selectedSite.client,
      maistry_id: selectedMaistryId,
      maistry_name: selectedMaistry.name,
      trade: selectedMaistry.trade,
      start_date: startDate,
      end_date: endDate,
      categories,
      grand_total: grandTotal,
      enable_maistry_pct: enableMaistryPct,
      maistry_pct_value: maistryPctValue,
      round_off: roundOff,
      saved_at: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem(LOCAL_SLIPS_KEY) || '[]');
    const filtered = existing.filter(s => s.id !== slipId);
    const updated = [newSlip, ...filtered];
    localStorage.setItem(LOCAL_SLIPS_KEY, JSON.stringify(updated));
    setSavedSlips(updated);

    // Calculate total mandays from LABOUR category
    const labourCat = categories.find(c => c.category === 'LABOUR / MANPOWER');
    let totalMandays = 0;
    if (labourCat && Array.isArray(labourCat.items)) {
      labourCat.items.forEach(it => {
        if (Array.isArray(it.days)) {
          it.days.forEach(d => { totalMandays += (Number(d) || 0); });
        }
      });
    }

    // 1. Sync to Weekly Payments List
    try {
      const weeklyPayments = JSON.parse(localStorage.getItem(WEEKLY_PAYMENTS_KEY) || '[]');
      const paymentRecord = {
        id: slipId,
        voucher_no: refNo,
        week_number: `${startDate} to ${endDate}`,
        week_start: startDate,
        week_end: endDate,
        project_id: selectedSiteId,
        project_name: selectedSite.name,
        site_id: selectedSiteId,
        site_name: selectedSite.name,
        contractor_id: selectedMaistryId,
        contractor_name: selectedMaistry.name,
        trade_category: selectedMaistry.trade,
        work_order_no: `WO-${refNo}`,
        total_mandays: totalMandays || 1,
        avg_rate_per_day: totalMandays > 0 ? Math.round(grandTotal / totalMandays) : 800,
        gross_amount: grandTotal,
        advance_deduction: 0,
        other_deductions: 0,
        net_payable: grandTotal,
        payment_mode: 'RTGS / Bank Transfer',
        status: 'Pending Approval', // 'Pending Approval' | 'Approved' | 'Paid'
        prepared_by: 'Site Supervisor / Engineer',
        notes: `Weekly Wage Settlement Voucher for ${selectedMaistry.name} (${startDate} to ${endDate})`,
      };
      const payFiltered = weeklyPayments.filter(p => p.id !== slipId && p.voucher_no !== refNo);
      localStorage.setItem(WEEKLY_PAYMENTS_KEY, JSON.stringify([paymentRecord, ...payFiltered]));
    } catch {}

    // 2. Sync to Subcontract Payments Register (mock_subcontract_payments)
    try {
      const PAYMENTS_KEY = 'mock_subcontract_payments';
      const existingPayments = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
      const paymentId = `pay-${slipId}`;
      const paymentRecord = {
        id: paymentId,
        voucher_no: refNo,
        payment_no: `PAY-${refNo}`,
        week_number: `${startDate} to ${endDate}`,
        payment_date: endDate || new Date().toISOString().split('T')[0],
        project_id: selectedSiteId,
        project_name: selectedSite.name,
        contractor_id: selectedMaistryId,
        contractor_name: selectedMaistry.name,
        payment_type: 'Weekly Slip',
        amount: grandTotal,
        payment_mode: 'RTGS / Bank Transfer',
        status_name: 'Pending Approval',
        status: 'Pending Approval', // 'Pending Approval' | 'Approved' | 'Paid' | 'Rejected'
        notes: `Weekly settlement slip ${refNo} for ${selectedMaistry.name} (Total Amount: ₹${grandTotal.toLocaleString('en-IN')})`,
        created_at: new Date().toISOString(),
      };
      const filteredPayments = existingPayments.filter(p => p.id !== paymentId && p.voucher_no !== refNo);
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([paymentRecord, ...filteredPayments]));
    } catch {}

    toast.success(`Weekly slip ${refNo} saved! Total Amount: ₹${grandTotal.toLocaleString('en-IN')} forwarded to Subcontractor Payments (Pending Approval).`);
  };

  const getSlipData = () => ({
    id: editId || `slip-${Date.now()}`,
    voucher_no: refNo,
    client_name: selectedSite.client,
    site_name: selectedSite.name,
    contractor_name: selectedMaistry.name,
    trade_category: selectedMaistry.trade,
    week_start: startDate,
    week_end: endDate,
    payment_date: endDate,
    categories,
    grand_total: grandTotal,
    enable_maistry_pct: enableMaistryPct,
    maistry_pct_value: maistryPctValue,
  });

  const handlePrint = () => {
    try {
      printA5SlipFromItem(getSlipData());
    } catch (err) {
      console.error(err);
      toast.error('Please allow popups in your browser to print the slip.');
    }
  };

  const handleDownloadA5Pdf = async () => {
    setDownloadingPdf(true);
    toast.info('Generating A5 Landscape PDF Slip...');
    try {
      await generateAndDownloadA5SlipFromItem(getSlipData());
      toast.success('Downloaded A5 Slip PDF successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Could not generate A5 PDF slip.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    let csv = `CLIENT,${selectedSite.client},DATE,${endDate}\n`;
    csv += `SITE,${selectedSite.name},TYPE,${selectedMaistry.trade}\n`;
    csv += `MAISTRY,${selectedMaistry.name},REF NO,${refNo}\n\n`;
    csv += `#,Particulars,Rate,${dateColumns.map(d => d.label).join(',')},Qty,Amount\n`;

    let rowNum = 1;
    categories.forEach(cat => {
      csv += `${cat.category},,,,,,,,,\n`;
      cat.items.forEach(item => {
        const qty = item.days.reduce((acc, d) => acc + (Number(d) || 0), 0);
        const amt = qty * (Number(item.rate) || 0);
        csv += `${rowNum},"${item.description}",${item.rate},${item.days.map(d => d || '-').join(',')},${qty},${amt}\n`;
        rowNum++;
      });
    });
    csv += `,,,,,,,,,TOTAL AMOUNT,${grandTotal}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedSite.name}_${selectedMaistry.name}_WeeklySlip.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded slip CSV.');
  };

  let globalRowCounter = 1;

  return (
    <PageContainer>
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/subcontracts/weekly-payments')}
              className="p-1.5 -ml-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors mr-1"
              title="Back to Weekly Payments list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary border border-border">
              <HardHat className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Maistry Slip</h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Weekly work wages statement and 148 × 210 mm printable slip for site maistries.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Slips Dropdown */}
          <div className="relative">
            <Select
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                const found = savedSlips.find(s => s.id === e.target.value);
                if (found) {
                  loadSlipIntoForm(found);
                  toast.success(`Loaded saved slip ${found.ref_no}`);
                }
              }}
              className="text-xs h-9 py-1 px-2.5 bg-surface border-border font-medium"
            >
              <option value="">Saved Maistry Slips ({savedSlips.length})</option>
              {savedSlips.map(s => (
                <option key={s.id} value={s.id}>
                  {s.ref_no} - {s.maistry_name} (₹{Number(s.grand_total).toLocaleString('en-IN')})
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subcontracts/weekly-payments')}
            className="text-xs gap-1.5"
          >
            <List className="w-3.5 h-3.5" />
            Saved Slip List
          </Button>

          {/* White / Yellow Slip Toggle */}
          <div className="flex rounded-md border border-border bg-surface-muted p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSlipTheme('white')}
              className={`px-3 py-1 rounded transition-colors ${slipTheme === 'white' ? 'bg-white text-text-primary shadow-xs font-bold' : 'text-text-secondary hover:text-text-primary'}`}
            >
              White Slip
            </button>
            <button
              type="button"
              onClick={() => setSlipTheme('yellow')}
              className={`px-3 py-1 rounded transition-colors ${slipTheme === 'yellow' ? 'bg-[#fef9c3] text-amber-900 border border-amber-300 shadow-xs font-bold' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Yellow Slip
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSlip}
            className="text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Slip
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadA5Pdf}
            disabled={downloadingPdf}
            className="text-xs gap-1.5 cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300 font-bold shadow-2xs"
            title="Download formatted A5 Landscape PDF Slip"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            {downloadingPdf ? 'Downloading A5 PDF...' : 'Download A5 Slip'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800 border-slate-900 cursor-pointer font-bold shadow-2xs"
            title="Print weekly slip"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Slip
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            className="text-xs gap-1 cursor-pointer text-text-secondary hover:text-text-primary border-border"
            title="Download slip as CSV spreadsheet"
          >
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            CSV
          </Button>
        </div>
      </div>

      {/* Control / Selector Card */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6 shadow-sm">
        {/* Row 1: Site, Maistry, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              1. SELECT SITE
            </label>
            <Select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full text-xs font-medium uppercase"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              2. SELECT MAISTRY ({maistries.length} ON SITE)
            </label>
            <Select
              value={selectedMaistryId}
              onChange={(e) => {
                setSelectedMaistryId(e.target.value);
                handleReloadLogs(e.target.value);
              }}
              className="w-full text-xs font-medium"
            >
              {maistries.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.log_count || 10} Logs
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              3. START DATE
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleReloadLogs(null, e.target.value);
              }}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              4. END DATE
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Quick Ranges */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border mb-3">
          <span className="text-xs text-text-muted font-medium mr-1">Quick Ranges:</span>
          <button
            type="button"
            onClick={handleQuickThisWeek}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-surface-muted hover:bg-border text-text-primary border border-border transition-colors cursor-pointer"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={handleQuickLast7Days}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-surface-muted hover:bg-border text-text-primary border border-border transition-colors cursor-pointer"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handleReloadLogs()}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
            title="Auto-detect and align to week with recorded logs"
          >
            <RotateCcw className="w-3 h-3" /> Auto-Align Logged Week
          </button>
        </div>

        {/* Add Line & Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted font-medium mr-1">Add Line:</span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleAddRow('LABOUR / MANPOWER')}
              className="text-xs gap-1 text-text-primary"
            >
              <Plus className="w-3 h-3" /> Labour Row
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleAddRow('EQUIPMENT / RENTALS')}
              className="text-xs gap-1 text-text-primary"
            >
              <Plus className="w-3 h-3" /> Equipment / Rent
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleAddRow('EXPENSES & CHARGES')}
              className="text-xs gap-1 text-text-primary"
            >
              <Plus className="w-3 h-3" /> Expense Row
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleAddCustomCategory}
              className="text-xs gap-1 text-text-primary"
            >
              <Plus className="w-3 h-3" /> Others / Custom Item
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableMaistryPct}
                onChange={(e) => setEnableMaistryPct(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>{selectedMaistry.name} (%)</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={roundOff}
                onChange={(e) => setRoundOff(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>Round Off (10s)</span>
            </label>

            <Button
              variant="outline"
              size="xs"
              onClick={() => handleReloadLogs()}
              className="text-xs gap-1 text-text-primary font-semibold"
            >
              <RotateCcw className="w-3 h-3 text-primary" />
              Reload Logs from Site Labour
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Sync Notice Banner */}
      {syncNotice && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 mb-6 shadow-2xs ${
          syncNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          syncNotice.type === 'empty' ? 'bg-amber-50 border-amber-200 text-amber-900' :
          'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${syncNotice.type === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="font-semibold">{syncNotice.message}</span>
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleReloadLogs()}
            className="text-[11px] h-7 bg-white shrink-0 font-medium"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Re-sync Site Logs
          </Button>
        </div>
      )}

      {/* Printable Slip Container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #maistry-printable-slip, #maistry-printable-slip * {
            visibility: visible;
          }
          #maistry-printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8px;
            border: 2px solid #000;
          }
          @page {
            size: a5 landscape;
            margin: 4mm;
          }
        }
      `}</style>
      <div className="flex justify-center mb-12">
        <div
          id="maistry-printable-slip"
          className={`w-full max-w-[850px] border-2 border-black p-6 transition-colors shadow-sm ${
            slipTheme === 'yellow' ? 'bg-[#fffde7] text-black' : 'bg-white text-black'
          }`}
          style={{ minHeight: '600px', fontFamily: 'monospace, sans-serif' }}
        >
          {/* Slip Header Box */}
          <div className="border border-black mb-4">
            <div className="grid grid-cols-2 text-xs border-b border-black">
              <div className="p-2 border-r border-black font-bold uppercase flex items-center gap-2">
                <span className="w-20 inline-block text-black/70">CLIENT :</span>
                <span>{selectedSite.client}</span>
              </div>
              <div className="p-2 font-bold uppercase flex items-center gap-2">
                <span className="w-20 inline-block text-black/70">DATE :</span>
                <span>{endDate.split('-').reverse().join('-')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs border-b border-black">
              <div className="p-2 border-r border-black font-bold uppercase flex items-center gap-2">
                <span className="w-20 inline-block text-black/70">SITE :</span>
                <span>{selectedSite.name}</span>
              </div>
              <div className="p-2 font-bold uppercase flex items-center gap-2">
                <span className="w-20 inline-block text-black/70">TYPE :</span>
                <span>{selectedMaistry.trade}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs">
              <div className="p-2 border-r border-black font-bold uppercase flex items-center gap-2">
                <span className="w-20 inline-block text-black/70">MAISTRY :</span>
                <span>{selectedMaistry.name}</span>
              </div>
              <div className="p-2 font-bold uppercase flex items-center gap-2">
                <span className="w-20 inline-block text-black/70">REF NO :</span>
                <span>{refNo}</span>
              </div>
            </div>
          </div>

          {/* Slip Table */}
          <div className="border border-black overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-black bg-black/5 font-bold uppercase text-[11px]">
                  <th className="p-1.5 border-r border-black w-8 text-center">#</th>
                  <th className="p-1.5 border-r border-black min-w-[180px]">Particulars / Description</th>
                  <th className="p-1.5 border-r border-black w-16 text-right">Rate (₹)</th>
                  {dateColumns.map((col, idx) => (
                    <th key={idx} className="p-1.5 border-r border-black w-12 text-center text-[10px]">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-1.5 border-r border-black w-12 text-center">Qty</th>
                  <th className="p-1.5 w-20 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, catIdx) => (
                  <React.Fragment key={cat.category}>
                    {/* Category Header Row */}
                    <tr className="bg-black/5 border-b border-black font-bold text-[10px] tracking-wider uppercase">
                      <td colSpan={12} className="p-1.5 pl-3">
                        {cat.category}
                      </td>
                    </tr>

                    {/* Category Items */}
                    {cat.items.map((item, itemIdx) => {
                      const currentRowNum = globalRowCounter++;
                      const qty = Math.round(item.days.reduce((acc, d) => acc + (Number(d) || 0), 0) * 100) / 100;
                      const amount = Math.round(qty * (Number(item.rate) || 0) * 100) / 100;

                      return (
                        <tr key={item.id} className="border-b border-black/80 hover:bg-black/5 group">
                          <td className="p-1.5 border-r border-black text-center font-bold">
                            {currentRowNum}
                          </td>
                          <td className="p-1 border-r border-black font-semibold">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(catIdx, itemIdx, 'description', e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-xs font-semibold"
                                placeholder="Description..."
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(catIdx, itemIdx)}
                                className="opacity-0 group-hover:opacity-100 text-black/40 hover:text-black p-0.5 print:hidden"
                                title="Remove row"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-1 border-r border-black text-right">
                            <input
                              type="number"
                              value={item.rate === 0 ? '0' : item.rate}
                              onChange={(e) => handleUpdateItem(catIdx, itemIdx, 'rate', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-right focus:outline-none focus:ring-0 text-xs font-mono font-medium"
                            />
                          </td>
                          {item.days.map((dayVal, dayIdx) => (
                            <td key={dayIdx} className="p-0.5 border-r border-black text-center">
                              <input
                                type="text"
                                value={dayVal === '' ? '' : dayVal}
                                onChange={(e) => handleUpdateDay(catIdx, itemIdx, dayIdx, e.target.value)}
                                placeholder="-"
                                className="w-full bg-transparent border-none p-0 text-center focus:outline-none focus:ring-0 text-xs font-mono placeholder:text-black/30"
                              />
                            </td>
                          ))}
                          <td className="p-1.5 border-r border-black text-center font-mono font-bold">
                            {qty > 0 ? (qty % 1 === 0 ? qty : qty.toFixed(2)) : 0}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold">
                            {amount > 0 ? (amount % 1 === 0 ? amount.toLocaleString('en-IN') : amount.toFixed(2)) : 0}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Total Row */}
                <tr className="border-t-2 border-black font-bold text-xs bg-black/5">
                  <td colSpan={11} className="p-2 text-right uppercase tracking-wider font-extrabold border-r border-black">
                    TOTAL AMOUNT :
                  </td>
                  <td className="p-2 text-right font-mono text-sm font-black">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </td>
                </tr>

                {enableMaistryPct && (
                  <tr className="border-t border-black font-bold text-xs">
                    <td colSpan={11} className="p-1.5 text-right uppercase tracking-wider border-r border-black text-[11px]">
                      {selectedMaistry.name} ({maistryPctValue}%) :
                    </td>
                    <td className="p-1.5 text-right font-mono text-xs">
                      ₹{maistryCommission.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures Area */}
          <div className="grid grid-cols-3 gap-8 pt-16 text-center text-xs font-bold uppercase tracking-wider mt-8">
            <div>
              <div className="border-t-2 border-black pt-1.5">
                Engineer
              </div>
            </div>
            <div>
              <div className="border-t-2 border-black pt-1.5">
                Supervisor
              </div>
            </div>
            <div>
              <div className="border-t-2 border-black pt-1.5">
                Receiver
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
