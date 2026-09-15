import { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  CreditCard,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { toast } from '../../../../components/composite/Toast';
import { labourApi, subcontractsApi, subcontractorTypesApi } from '../../../../api/apiservice';
import { getSubcontractorTypes } from '../../../masters/utils/subcontractorTypes';

const CLASSIFICATION_OPTIONS = [
  { value: 'manpower', label: 'Manpower' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'expense', label: 'Expense' },
  { value: 'others', label: 'Others' },
];

const getClassificationBadge = (classification) => {
  const norm = (classification || 'manpower').toLowerCase();
  switch (norm) {
    case 'manpower':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Manpower
        </span>
      );
    case 'equipment':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Equipment
        </span>
      );
    case 'expense':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Expense
        </span>
      );
    case 'others':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Others
        </span>
      );
  }
};

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

// Default Subcontractors List for Site
const DEFAULT_CONTRACTORS = [
  { id: '1', contractor_name: 'Apex Concrete Gang', trade: 'Civil & RCC Works', contact_phone: '9988776655' },
  { id: '2', contractor_name: 'Shree Balaji Shuttering', trade: 'Formwork & Shuttering', contact_phone: '9988776656' },
  { id: '3', contractor_name: 'Sterling Electricals & MEP', trade: 'Electrical & Plumbing', contact_phone: '9988776657' },
  { id: '4', contractor_name: 'Premier Structural Steel', trade: 'Steel Fabrication & Erection', contact_phone: '9988776658' },
];

// Configured Maistry Template Items matching Subcontractor Types Master
const DEFAULT_MAISTRY_TEMPLATE_ITEMS = [
  { sort_order: 1, item_description: 'Head Mason', classification: 'manpower', unit: 'Nos', default_rate: 800, maistry_scope: 1, remarks: 'Brickwork & Concrete' },
  { sort_order: 2, item_description: 'Male Helper', classification: 'manpower', unit: 'Nos', default_rate: 400, maistry_scope: 1, remarks: 'Material Transport' },
  { sort_order: 3, item_description: 'Female Helper', classification: 'manpower', unit: 'Nos', default_rate: 300, maistry_scope: 1, remarks: 'Curing & Assisting' },
];


export function SiteLabourTab({ site }) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('daily_subcontractor'); // 'daily_subcontractor' | 'workforce_register'
  
  // Date & Contractor Selection
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractors, setContractors] = useState(DEFAULT_CONTRACTORS);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  
  // Active Entry Form Template Rows (Schema: order, item, classification, unit, rate, maistry_scope, qty, amount, remarks)
  const [templateRows, setTemplateRows] = useState([]);
  const [locationGrid, setLocationGrid] = useState('');
  const [foremanIncharge, setForemanIncharge] = useState('');
  const [logNotes, setLogNotes] = useState('');
  
  // Submitted Daily Subcontractor Logs
  const [subconDailyLogs, setSubconDailyLogs] = useState([]);

  // Register & Deployment Data
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Deploy Modal
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [allWorkers, setAllWorkers] = useState([]);
  const [deployForm, setDeployForm] = useState({
    worker_id: '',
    contractor_id: '',
    trade_name: 'Mason',
    daily_wage: '850',
    deployment_date: new Date().toISOString().split('T')[0],
  });
  const [deploying, setDeploying] = useState(false);

  // Load Initial Subcontractors & Daily Logs
  useEffect(() => {
    if (!site?.id) return;
    loadContractorsAndLogs();
  }, [site?.id]);

  const loadContractorsAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch available Subcontractor Types
      let typesList = [];
      try {
        const tRes = await subcontractorTypesApi.list();
        const tData = tRes?.data?.types || tRes?.data || [];
        if (Array.isArray(tData) && tData.length > 0) {
          typesList = tData;
          setAvailableTypes(tData);
        }
      } catch {
        typesList = getSubcontractorTypes();
        setAvailableTypes(typesList);
      }

      // 2. Fetch Contractors from Subcontractors Master or Site Labour API
      let loadedContractors = [];
      try {
        const scRes = await subcontractsApi.contractors.list();
        const scList = extractArray(scRes);
        if (Array.isArray(scList) && scList.length > 0) {
          loadedContractors = scList.map(c => ({
            id: String(c.id),
            contractor_code: c.contractor_code || '',
            contractor_name: c.contractor_name || c.name,
            subcontractor_type_id: c.contractor_type_id || c.subcontractor_type_id || null,
            trade: c.contractor_type_name || c.trade || 'Subcontractor Gang',
            contact_phone: c.phone || c.contact_phone || '',
          }));
        }
      } catch (err) {
        console.warn('Could not fetch contractors from master API, checking local storage:', err);
      }

      // If master API returned nothing, check localStorage mock_subcontractors_master
      if (loadedContractors.length === 0) {
        try {
          const localSc = JSON.parse(localStorage.getItem('mock_subcontractors_master') || '[]');
          if (Array.isArray(localSc) && localSc.length > 0) {
            loadedContractors = localSc.map(c => ({
              id: String(c.id),
              contractor_code: c.contractor_code || '',
              contractor_name: c.contractor_name || c.name,
              subcontractor_type_id: c.subcontractor_type_id || c.contractor_type_id || null,
              trade: c.subcontractor_type_label || c.trade || 'Subcontractor Gang',
              contact_phone: c.phone || c.contact_phone || '',
            }));
          }
        } catch {}
      }

      // If still nothing, check labourApi.contractors.list({ site_id: site.id }) or DEFAULT_CONTRACTORS
      if (loadedContractors.length === 0) {
        const cRes = await labourApi.contractors.list({ site_id: site.id }).catch(() => ({ data: [] }));
        const cList = extractArray(cRes);
        if (cList.length > 0) {
          loadedContractors = cList.map(c => ({
            id: String(c.id),
            contractor_code: c.contractor_code || '',
            contractor_name: c.contractor_name || c.name,
            subcontractor_type_id: c.contractor_type_id || c.subcontractor_type_id || null,
            trade: c.trade || c.contractor_type_name || 'Subcontractor Gang',
            contact_phone: c.contact_phone || c.phone || '',
          }));
        } else {
          loadedContractors = DEFAULT_CONTRACTORS;
        }
      }

      setContractors(loadedContractors);

      // 3. Load Local / Persisted Daily Subcontractor Logs
      const storageKey = `site_${site.id}_subcon_daily_logs`;
      const rawStored = localStorage.getItem(storageKey);
      if (rawStored) {
        setSubconDailyLogs(JSON.parse(rawStored));
      } else {
        // Initial Sample Logs for Site Demonstration
        const todayStr = new Date().toISOString().split('T')[0];
        const sampleLogs = [
          {
            id: 'log-101',
            date: todayStr,
            contractor_id: '1',
            contractor_name: 'Apex Concrete Gang',
            trade: 'Civil & RCC Works',
            location: 'Tower A - 3rd Floor Slab',
            foreman: 'M. Selvam',
            trades: [
              { order: 1, item: 'Mason (Grade 1)', classification: 'manpower', unit: 'Day', qty: 5, rate: 850, amount: 4250, maistry_scope: 1, remarks: 'Brickwork' },
              { order: 2, item: 'Bar Bender & Steel Fixer', classification: 'manpower', unit: 'Day', qty: 3, rate: 800, amount: 2400, maistry_scope: 1, remarks: 'Rebar Tying' },
              { order: 3, item: 'Concrete Mixer', classification: 'equipment', unit: 'Day', qty: 1, rate: 1200, amount: 1200, maistry_scope: 0, remarks: 'Mixer Machine' },
              { order: 4, item: 'Concrete Helper', classification: 'manpower', unit: 'Day', qty: 6, rate: 550, amount: 3300, maistry_scope: 1, remarks: 'Concrete Pouring' },
            ],
            total_workers: 14,
            total_cost: 11150,
            submitted_at: new Date().toLocaleTimeString(),
          },
        ];
        setSubconDailyLogs(sampleLogs);
        localStorage.setItem(storageKey, JSON.stringify(sampleLogs));
      }

      // 4. Load Workforce Data
      const [wRes, aRes] = await Promise.all([
        labourApi.workers.list({ site_id: site.id }).catch(() => ({ data: [] })),
        labourApi.assignments.list({ site_id: site.id }).catch(() => ({ data: [] })),
      ]);

      const wList = extractArray(wRes);
      const aList = extractArray(aRes);

      if (aList.length > 0) {
        setWorkers(aList);
      } else if (wList.length > 0) {
        setWorkers(wList);
      } else {
        setWorkers([
          { id: 101, worker_code: 'WRK-001', first_name: 'Ramesh', last_name: 'Kumar', trade_name: 'Mason', skill_level: 'Skilled', employment_type: 'Direct Labour', daily_wage: 850, phone: '9876543210', status: 'Active' },
          { id: 102, worker_code: 'WRK-002', first_name: 'Suresh', last_name: 'Yadav', trade_name: 'Bar Bender', skill_level: 'Skilled', employment_type: 'Direct Labour', daily_wage: 800, phone: '9876543211', status: 'Active' },
          { id: 103, worker_code: 'WRK-003', first_name: 'Anil', last_name: 'Sharma', trade_name: 'Carpenter', skill_level: 'Skilled', employment_type: 'Contractor Labour', contractor_name: 'Apex Concrete Gang', daily_wage: 850, phone: '9876543212', status: 'Active' },
          { id: 104, worker_code: 'WRK-004', first_name: 'Prakash', last_name: 'Paswan', trade_name: 'Helper', skill_level: 'Unskilled', employment_type: 'Contractor Labour', contractor_name: 'Apex Concrete Gang', daily_wage: 550, phone: '9876543213', status: 'Active' },
          { id: 105, worker_code: 'WRK-005', first_name: 'Manoj', last_name: 'Verma', trade_name: 'Electrician', skill_level: 'Skilled', employment_type: 'Direct Labour', daily_wage: 900, phone: '9876543214', status: 'Active' },
          { id: 106, worker_code: 'WRK-006', first_name: 'Gopal', last_name: 'Das', trade_name: 'Helper', skill_level: 'Unskilled', employment_type: 'Direct Labour', daily_wage: 550, phone: '9876543215', status: 'Active' },
        ]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load site labour data.');
    } finally {
      setLoading(false);
    }
  };

  // When Subcontractor Selection Changes -> Load Saved Template as per Subcontractor Type!
  const handleSelectContractor = async (contractorId) => {
    setSelectedContractorId(contractorId);
    if (!contractorId) {
      setTemplateRows([]);
      return;
    }

    const selectedCon = contractors.find(c => String(c.id) === String(contractorId));
    if (!selectedCon) {
      setTemplateRows([]);
      return;
    }

    setLoadingTemplate(true);
    try {
      // 1. Resolve subcontractor_type_id for the selected contractor
      let typeId = selectedCon.subcontractor_type_id;
      if (!typeId && availableTypes.length > 0) {
        const conTrade = (selectedCon.trade || '').toLowerCase();
        const matched = availableTypes.find(t => 
          (t.type_name && conTrade.includes(t.type_name.toLowerCase())) ||
          (t.type_code && conTrade.includes(t.type_code.toLowerCase()))
        );
        if (matched) typeId = matched.id;
      }

      // Default to 1 (Maistry) or first available type if not resolved
      if (!typeId && availableTypes.length > 0) {
        typeId = availableTypes[0].id;
      }

      // 2. Try contractor specific templates endpoint first
      let templateList = [];
      try {
        if (subcontractsApi.contractors?.templates) {
          const cRes = await subcontractsApi.contractors.templates(contractorId);
          const cItems = cRes?.data?.templates || cRes?.data || [];
          if (Array.isArray(cItems) && cItems.length > 0) {
            templateList = cItems;
          }
        }
      } catch (err) {
        console.warn('Could not fetch contractor templates directly:', err);
      }

      // 3. Try fetching from Subcontractor Types API
      if (templateList.length === 0 && typeId) {
        try {
          const res = await subcontractorTypesApi.templates(typeId);
          const items = res?.data?.templates || res?.data || [];
          if (Array.isArray(items) && items.length > 0) {
            templateList = items;
          }
        } catch (err) {
          console.warn('Could not fetch template items from API for type:', typeId, err);
        }
      }

      // 4. Check localStorage templates for this type if API returned empty
      if (templateList.length === 0 && typeId) {
        try {
          const localT = JSON.parse(localStorage.getItem(`sc_templates_${typeId}`) || '[]');
          if (Array.isArray(localT) && localT.length > 0) templateList = localT;
        } catch {}
      }

      // 5. Default fallback to configured Maistry Template Items (Head Mason ₹800, Male Helper ₹400, Female Helper ₹300)
      if (templateList.length === 0) {
        templateList = DEFAULT_MAISTRY_TEMPLATE_ITEMS;
      }

      // 5. Map into standard template items schema:
      // Order | Item Description | Classification | Unit | Rate (₹) | Maistry Scope | Qty | Amount | Remarks
      const initialRows = templateList
        .filter(t => t.status !== 0) // only active template items
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
        .map((t, idx) => ({
          id: `row-${t.id || idx + 1}`,
          template_id: t.id || null,
          order: t.sort_order !== undefined && t.sort_order !== null ? Number(t.sort_order) : idx + 1,
          item: t.item_description || t.item || t.trade_name || 'Trade Item',
          classification: (t.classification || 'manpower').toLowerCase(),
          unit: t.unit || t.uom || 'Nos',
          rate: parseFloat(t.default_rate || t.rate || t.daily_rate || 0),
          qty: '', // Quantity starts blank for user entry as requested
          amount: 0,
          maistry_scope: Number(t.maistry_scope) === 1 ? 1 : 0,
          remarks: t.remarks || '',
          isCustom: false,
        }));

      setTemplateRows(initialRows);
    } catch (err) {
      console.error('Failed to load subcontractor template items:', err);
      toast.error('Failed to load subcontractor template.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Add Custom Item Row to Active Template
  const handleAddCustomTradeRow = () => {
    const nextOrder = templateRows.length > 0 
      ? Math.max(...templateRows.map(r => Number(r.order) || 0)) + 1 
      : 1;

    const newRow = {
      id: `custom-${Date.now()}`,
      order: nextOrder,
      item: '',
      classification: 'manpower',
      unit: 'Nos',
      qty: '',
      rate: 800,
      amount: 0,
      maistry_scope: 0,
      remarks: '',
      isCustom: true,
    };
    setTemplateRows(prev => [...prev, newRow]);
  };

  // Update Template Row Input Fields
  const handleRowChange = (id, field, value) => {
    setTemplateRows(prev => prev.map(row => {
      if (row.id === id) {
        const next = { ...row, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const q = Number(field === 'qty' ? value : row.qty) || 0;
          const r = Number(field === 'rate' ? value : row.rate) || 0;
          next.amount = q * r;
        }
        return next;
      }
      return row;
    }));
  };

  // Remove Row from Form
  const handleRemoveRow = (id) => {
    setTemplateRows(prev => prev.filter(r => r.id !== id));
  };

  // Submit Daily Subcontractor Manpower Log for Selected Date
  const handleSubmitSubcontractorLog = (e) => {
    e.preventDefault();
    if (!selectedContractorId) {
      toast.error('Please select a Subcontractor first.');
      return;
    }

    const selectedCon = contractors.find(c => String(c.id) === String(selectedContractorId));
    if (!selectedCon) {
      toast.error('Invalid subcontractor selected.');
      return;
    }

    // Filter rows where quantity > 0 and item description is not empty
    const validRows = templateRows.filter(r => Number(r.qty) > 0 && r.item.trim() !== '');

    if (validRows.length === 0) {
      toast.error('Please enter worker quantity (QTY > 0) for at least one item.');
      return;
    }

    let totalWorkers = 0;
    let totalCost = 0;

    const formattedTrades = validRows.map(r => {
      const q = Number(r.qty) || 0;
      const rate = Number(r.rate) || 0;
      const lineCost = q * rate;

      totalWorkers += q;
      totalCost += lineCost;

      return {
        order: r.order,
        item: r.item,
        classification: r.classification,
        unit: r.unit,
        qty: q,
        rate: rate,
        amount: lineCost,
        maistry_scope: r.maistry_scope,
        remarks: r.remarks,
      };
    });

    const newLog = {
      id: `log-${Date.now()}`,
      date: selectedDate,
      contractor_id: selectedContractorId,
      contractor_name: selectedCon.contractor_name,
      trade: selectedCon.trade || 'Subcontractor Work',
      site_id: site?.id || 'SITE-01',
      site_name: site?.name || 'Current Site',
      location: locationGrid || 'Main Site Grid',
      foreman: foremanIncharge || 'Site Supervisor',
      notes: logNotes,
      trades: formattedTrades,
      total_workers: totalWorkers,
      total_cost: totalCost,
      submitted_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedLogs = [newLog, ...subconDailyLogs];
    setSubconDailyLogs(updatedLogs);

    // 1. Save to Site Daily Logs
    const storageKey = `site_${site.id}_subcon_daily_logs`;
    localStorage.setItem(storageKey, JSON.stringify(updatedLogs));

    // 2. Sync to Global Subcontractor Daily Logs Store (accessible by Weekly Payments & Maistry Slip)
    try {
      const globalKey = 'global_subcon_daily_logs';
      const existingGlobal = JSON.parse(localStorage.getItem(globalKey) || '[]');
      const filteredGlobal = existingGlobal.filter(g => g.id !== newLog.id);
      localStorage.setItem(globalKey, JSON.stringify([newLog, ...filteredGlobal]));
    } catch {}

    // 3. Automatically Sync / Update Subcontractor Weekly Payments and Subcontract Payments Record
    try {
      const WEEKLY_PAYMENTS_KEY = 'mock_subcontractor_weekly_payments';
      const existingWeekly = JSON.parse(localStorage.getItem(WEEKLY_PAYMENTS_KEY) || '[]');
      
      const voucherNo = `SWP-${selectedCon.contractor_code || 'CON'}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;
      const weeklyId = `swp-${selectedContractorId}-${selectedDate}`;

      const weeklyRecord = {
        id: weeklyId,
        voucher_no: voucherNo,
        week_number: `Day of ${selectedDate}`,
        week_start: selectedDate,
        week_end: selectedDate,
        project_id: String(site?.project_id || site?.id || '1'),
        project_name: site?.name || 'Site Project',
        site_id: String(site?.id || 'SITE-01'),
        site_name: site?.name || 'Site Name',
        contractor_id: String(selectedContractorId),
        contractor_name: selectedCon.contractor_name,
        trade_category: selectedCon.trade || 'Subcontractor Gang',
        work_order_no: `WO-${selectedCon.contractor_code || selectedContractorId}`,
        total_mandays: totalWorkers,
        avg_rate_per_day: totalWorkers > 0 ? Math.round(totalCost / totalWorkers) : 0,
        gross_amount: totalCost,
        advance_deduction: 0,
        other_deductions: 0,
        net_payable: totalCost,
        payment_mode: 'RTGS / Bank Transfer',
        status: 'Pending Approval', // Workflow: Pending Approval -> Approved -> Paid
        prepared_by: foremanIncharge || 'Site Supervisor',
        notes: `Daily manpower logged on ${selectedDate} at ${site?.name || 'Site'}: ${formattedTrades.map(t => `${t.item}: ${t.qty} ${t.unit}`).join(', ')}`,
        trades: formattedTrades,
      };

      const filteredWeekly = existingWeekly.filter(w => w.id !== weeklyId);
      localStorage.setItem(WEEKLY_PAYMENTS_KEY, JSON.stringify([weeklyRecord, ...filteredWeekly]));

      // 4. Sync into Subcontract Payments Register Store
      const PAYMENTS_KEY = 'mock_subcontract_payments';
      const existingPayments = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
      const paymentRecord = {
        id: `pay-${weeklyId}`,
        project_id: String(site?.project_id || site?.id || '1'),
        project_name: site?.name || 'Site Project',
        payment_no: `PAY-${voucherNo}`,
        voucher_no: voucherNo,
        payment_date: selectedDate,
        contractor_id: String(selectedContractorId),
        contractor_name: selectedCon.contractor_name,
        payment_type: 'Weekly Slip',
        amount: totalCost,
        payment_mode: 'RTGS / Bank Transfer',
        status_name: 'Pending Approval',
        status: 'Pending Approval', // 'Pending Approval' | 'Approved' | 'Paid' | 'Rejected'
        notes: `Weekly settlement slip for ${selectedCon.contractor_name} (${totalWorkers} workers, ₹${totalCost})`,
        created_at: new Date().toISOString(),
      };
      const filteredPayments = existingPayments.filter(p => p.id !== paymentRecord.id);
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([paymentRecord, ...filteredPayments]));

      // 5. Sync into Maistry Slips Store (mock_maistry_slips) so slip is immediately ready
      const SLIPS_KEY = 'mock_maistry_slips';
      const existingSlips = JSON.parse(localStorage.getItem(SLIPS_KEY) || '[]');
      const slipRecord = {
        id: weeklyId,
        ref_no: voucherNo,
        site_id: String(site?.id || 'SITE-01'),
        site_name: site?.name || 'Site',
        client_name: site?.client || site?.client_name || 'Client',
        maistry_id: String(selectedContractorId),
        maistry_name: selectedCon.contractor_name,
        trade: selectedCon.trade || 'Subcontractor Gang',
        start_date: selectedDate,
        end_date: selectedDate,
        grand_total: totalCost,
        enable_maistry_pct: false,
        maistry_pct_value: 0,
        round_off: true,
        saved_at: new Date().toISOString(),
        categories: [
          {
            category: 'LABOUR / MANPOWER',
            items: formattedTrades.map((t, idx) => ({
              id: `synced-${idx}`,
              description: t.item,
              rate: t.rate,
              days: ['', '', '', '', String(t.qty), '', '']
            }))
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
              { id: 'ex-2', description: 'Transport & Fuel', rate: 0, days: ['', '', '', '', '', '', ''] }
            ]
          }
        ]
      };
      const filteredSlips = existingSlips.filter(s => s.id !== weeklyId && s.ref_no !== voucherNo);
      localStorage.setItem(SLIPS_KEY, JSON.stringify([slipRecord, ...filteredSlips]));
    } catch (e) {
      console.warn('Could not sync weekly payment record:', e);
    }

    toast.success(`Daily manpower for ${selectedCon.contractor_name} logged (₹${totalCost.toLocaleString('en-IN')})! Reflected in Weekly Slip & Payments.`);

    // Reset Form
    setSelectedContractorId('');
    setTemplateRows([]);
    setLocationGrid('');
    setForemanIncharge('');
    setLogNotes('');
  };

  // Remove Log for a Date
  const handleDeleteLog = (logId) => {
    const updated = subconDailyLogs.filter(l => l.id !== logId);
    setSubconDailyLogs(updated);
    const storageKey = `site_${site.id}_subcon_daily_logs`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success('Subcontractor daily log removed.');
  };

  // Filter Subcontractor Logs for the Selected Date
  const dateLogs = useMemo(() => {
    return subconDailyLogs.filter(l => l.date === selectedDate);
  }, [subconDailyLogs, selectedDate]);

  // Aggregate Metrics for Selected Date
  const dateSummary = useMemo(() => {
    const totalSubcontractors = dateLogs.length;
    const totalHeadcount = dateLogs.reduce((acc, l) => acc + (l.total_workers || 0), 0);
    const totalCost = dateLogs.reduce((acc, l) => acc + (l.total_cost || 0), 0);
    return { totalSubcontractors, totalHeadcount, totalCost };
  }, [dateLogs]);

  // General Worker List Filters
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const fullName = `${w.first_name || ''} ${w.last_name || ''} ${w.worker_name || ''}`.toLowerCase();
      const code = String(w.worker_code || '').toLowerCase();
      const trade = String(w.trade_name || w.trade || '').toLowerCase();
      const contractor = String(w.contractor_name || '').toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch = !search || fullName.includes(q) || code.includes(q) || trade.includes(q) || contractor.includes(q);
      const matchesTrade = tradeFilter === 'all' || trade.includes(tradeFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || (w.employment_type || '').toLowerCase().includes(typeFilter.toLowerCase());

      return matchesSearch && matchesTrade && matchesType;
    });
  }, [workers, search, tradeFilter, typeFilter]);

  const handleOpenDeploy = async () => {
    setIsDeployOpen(true);
    try {
      const res = await labourApi.workers.list();
      setAllWorkers(extractArray(res));
    } catch (e) {}
  };

  const handleDeploySubmit = async (e) => {
    e.preventDefault();
    setDeploying(true);
    try {
      if (labourApi.assignments?.create) {
        await labourApi.assignments.create({
          site_id: site.id,
          project_id: site.project_id,
          ...deployForm,
        });
      }
      toast.success('Labour deployed to site successfully.');
      setIsDeployOpen(false);
      loadContractorsAndLogs();
    } catch (err) {
      const found = allWorkers.find(w => String(w.id) === String(deployForm.worker_id));
      const newWorker = {
        id: Date.now(),
        worker_code: found?.worker_code || `WRK-${Math.floor(100 + Math.random() * 900)}`,
        first_name: found?.first_name || 'Deployed',
        last_name: found?.last_name || 'Worker',
        trade_name: deployForm.trade_name,
        skill_level: deployForm.trade_name === 'Helper' ? 'Unskilled' : 'Skilled',
        employment_type: deployForm.contractor_id ? 'Contractor Labour' : 'Direct Labour',
        daily_wage: Number(deployForm.daily_wage || 750),
        phone: found?.phone || '9876500000',
        status: 'Active',
      };
      setWorkers(prev => [newWorker, ...prev]);
      toast.success('Labour deployed to site successfully.');
      setIsDeployOpen(false);
    } finally {
      setDeploying(false);
    }
  };

  // Active Contractor Object
  const activeContractor = contractors.find(c => String(c.id) === String(selectedContractorId));

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Header Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-surface-muted/60 p-1 rounded-xl border border-border/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('daily_subcontractor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'daily_subcontractor'
                ? 'bg-surface text-primary shadow-xs border border-border/60'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span>Daily Subcontractor Entry & Templates</span>
            <Badge variant="primary" className="text-[10px] ml-1 px-1.5 py-0">
              {dateSummary.totalSubcontractors} Logged Today
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('workforce_register')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'workforce_register'
                ? 'bg-surface text-primary shadow-xs border border-border/60'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workforce Register & Deployed Labour</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-xs"
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={handleOpenDeploy}
          >
            + Deploy Worker to Site
          </Button>
        </div>
      </div>

      {/* VIEW 1: DAILY SUBCONTRACTOR ENTRY & TEMPLATES */}
      {activeSubTab === 'daily_subcontractor' && (
        <div className="flex flex-col gap-6">
          {/* Top Date & KPI Toolbar */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Select Daily Report Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 px-3 text-xs font-semibold rounded-lg border border-border bg-surface text-text-primary focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>
            </div>

            {/* Date Summary Stats Ribbon */}
            <div className="grid grid-cols-3 gap-3 bg-surface-subtle/50 p-2.5 rounded-xl border border-border/60">
              <div className="px-3 border-r border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Subcontractors</span>
                <span className="text-base font-extrabold text-text-primary">{dateSummary.totalSubcontractors} Gangs</span>
              </div>
              <div className="px-3 border-r border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Total Headcount</span>
                <span className="text-base font-extrabold text-primary font-mono">{dateSummary.totalHeadcount} Workers</span>
              </div>
              <div className="px-3">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Est. Daily Cost</span>
                <span className="text-base font-extrabold text-emerald-600 font-mono">₹{dateSummary.totalCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Subcontractor Selector & Dynamic Template Loader Form */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3.5">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-500" />
                  Select Subcontractor to Log Manpower
                </h3>
                <p className="text-xs text-text-secondary">
                  Selecting a subcontractor automatically loads their template (ITEM, TYPE, UNIT, QTY, RATE, AMOUNT, REMARKS). Enter quantities and custom items as needed.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitSubcontractorLog} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Subcontractor / Contractor Gang *" required>
                  <Select
                    value={selectedContractorId}
                    onChange={(e) => handleSelectContractor(e.target.value)}
                    className="h-9 text-xs font-semibold"
                  >
                    <option value="">-- Choose Subcontractor --</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contractor_name} {c.contractor_code ? `(${c.contractor_code})` : ''} — {c.trade}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Work Location / Grid Zone">
                  <Input
                    type="text"
                    placeholder="e.g. Tower B - 4th Floor Deck Grid C3-C7"
                    value={locationGrid}
                    onChange={(e) => setLocationGrid(e.target.value)}
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Foreman / Supervisor Incharge">
                  <Input
                    type="text"
                    placeholder="e.g. M. Selvam (Contractor Supervisor)"
                    value={foremanIncharge}
                    onChange={(e) => setForemanIncharge(e.target.value)}
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>

              {/* TEMPLATE TABLE WITH EXACT SUBCONTRACTOR TYPE SCHEMA */}
              {loadingTemplate ? (
                <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2 border border-border rounded-xl bg-surface-subtle/30">
                  <span className="inline-block animate-spin text-primary text-base">⟳</span>
                  <span className="font-medium">Loading Subcontractor Type template items from database...</span>
                </div>
              ) : selectedContractorId ? (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-primary block">
                          Loaded Template: {activeContractor?.contractor_name} — {activeContractor?.trade} ({templateRows.length} items)
                        </span>
                        <span className="text-[11px] text-text-muted">
                          Template items loaded as per Subcontractor Type. Enter QTY (worker count/units) for today.
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddCustomTradeRow}
                      className="text-xs h-8 bg-surface"
                    >
                      + Add Custom Item
                    </Button>
                  </div>

                  <div className="border border-border rounded-xl overflow-x-auto shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                      <thead>
                        <tr className="bg-surface-subtle font-semibold text-text-secondary border-b border-border text-[11px] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-16 text-center">ORDER</th>
                          <th className="py-2.5 px-3 min-w-[180px]">ITEM DESCRIPTION</th>
                          <th className="py-2.5 px-3 w-28">CLASSIFICATION</th>
                          <th className="py-2.5 px-3 w-20 text-center">UNIT</th>
                          <th className="py-2.5 px-3 w-28 text-right">DEFAULT RATE (₹)</th>
                          <th className="py-2.5 px-3 w-24 text-center">MAISTRY SCOPE</th>
                          <th className="py-2.5 px-3 w-24 text-center">
                            QTY <span className="text-red-500">*</span>
                          </th>
                          <th className="py-2.5 px-3 w-28 text-right font-bold">AMOUNT (₹)</th>
                          <th className="py-2.5 px-3">REMARKS</th>
                          <th className="py-2.5 px-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {templateRows.map((row) => {
                          const q = Number(row.qty) || 0;
                          const rate = Number(row.rate) || 0;
                          const lineAmount = q * rate;

                          return (
                            <tr
                              key={row.id}
                              className={`transition-colors ${q > 0 ? 'bg-primary/5' : 'hover:bg-surface-subtle/50'}`}
                            >
                              {/* 1. ORDER */}
                              <td className="py-2 px-3 text-center">
                                <span className="font-mono text-[11px] font-bold text-text-muted bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                                  #{row.order}
                                </span>
                              </td>

                              {/* 2. ITEM DESCRIPTION */}
                              <td className="py-2 px-3 font-semibold text-text-primary">
                                {row.isCustom ? (
                                  <Input
                                    type="text"
                                    placeholder="Enter Custom Item Description"
                                    value={row.item}
                                    onChange={(e) => handleRowChange(row.id, 'item', e.target.value)}
                                    className="h-8 text-xs font-semibold"
                                  />
                                ) : (
                                  <span className="text-[12px]">{row.item}</span>
                                )}
                              </td>

                              {/* 3. CLASSIFICATION */}
                              <td className="py-2 px-3">
                                {row.isCustom ? (
                                  <Select
                                    value={row.classification}
                                    onChange={(val) => handleRowChange(row.id, 'classification', val)}
                                    className="h-7 text-xs"
                                    options={CLASSIFICATION_OPTIONS}
                                  />
                                ) : (
                                  getClassificationBadge(row.classification)
                                )}
                              </td>

                              {/* 4. UNIT */}
                              <td className="py-2 px-3 text-center font-mono text-text-secondary text-[11px]">
                                {row.isCustom ? (
                                  <Input
                                    type="text"
                                    value={row.unit}
                                    onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                                    className="h-7 text-xs w-16 text-center"
                                  />
                                ) : (
                                  <span className="bg-surface-muted px-2 py-0.5 rounded border border-border">
                                    {row.unit}
                                  </span>
                                )}
                              </td>

                              {/* 5. DEFAULT RATE (₹) */}
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-text-muted text-[11px]">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={row.rate}
                                    onChange={(e) => handleRowChange(row.id, 'rate', e.target.value)}
                                    className="w-20 h-7 text-right text-xs font-mono font-medium rounded border border-border bg-surface px-1.5 focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              </td>

                              {/* 6. MAISTRY SCOPE */}
                              <td className="py-2 px-3 text-center">
                                {Number(row.maistry_scope) === 1 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" /> Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                    <X className="w-2.5 h-2.5 text-slate-400" /> No
                                  </span>
                                )}
                              </td>

                              {/* 7. QTY */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  step="any"
                                  value={row.qty}
                                  onChange={(e) => handleRowChange(row.id, 'qty', e.target.value)}
                                  className={`w-20 h-8 text-center text-xs font-mono font-bold rounded border px-2 shadow-2xs focus:ring-2 focus:ring-primary focus:outline-none ${
                                    q > 0
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-surface text-text-primary'
                                  }`}
                                />
                              </td>

                              {/* 8. AMOUNT (₹) */}
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                                {q > 0 ? `₹${lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                              </td>

                              {/* 9. REMARKS */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  placeholder="Remarks / Spec"
                                  value={row.remarks}
                                  onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)}
                                  className="w-full h-7 text-xs rounded border border-border bg-surface px-2 focus:ring-1 focus:ring-primary"
                                />
                              </td>

                              {/* 10. REMOVE ACTION */}
                              <td className="py-2 px-3 text-center">
                                {row.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(row.id)}
                                    className="text-text-muted hover:text-red-500 transition-colors p-1"
                                    title="Remove row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddCustomTradeRow}
                      className="text-xs"
                    >
                      + Add Custom Item
                    </Button>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedContractorId('');
                          setTemplateRows([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                        className="font-bold px-4"
                      >
                        Submit Daily Subcontractor Log ({selectedDate})
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-border rounded-xl bg-surface-subtle/30 text-text-secondary flex flex-col items-center justify-center gap-2">
                  <Briefcase className="w-8 h-8 text-text-muted" />
                  <p className="text-xs font-semibold">Please select a Subcontractor from the dropdown above to load their template.</p>
                </div>
              )}
            </form>
          </div>

          {/* SUBMITTED SUBCONTRACTOR LOGS FOR SELECTED DATE */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Submitted Subcontractor Daily Manpower Logs for [{selectedDate}]
                </h3>
                <p className="text-xs text-text-secondary">
                  Multiple subcontractors logged on this site for {selectedDate}.
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-bold">
                {dateLogs.length} Subcontractor(s) Submitted
              </Badge>
            </div>

            {dateLogs.length === 0 ? (
              <div className="p-8 text-center border border-border rounded-xl bg-surface-subtle/20 text-text-secondary">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                <p className="text-xs font-medium">No subcontractor manpower logged yet for date {selectedDate}.</p>
                <p className="text-[11px] text-text-muted mt-1">Select a subcontractor above to record their daily manpower gang.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {dateLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border rounded-xl overflow-hidden bg-surface shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <div className="bg-surface-subtle/60 px-4 py-3 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          <HardHat className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text-primary">{log.contractor_name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                              {log.trade}
                            </span>
                          </div>
                          <span className="text-[11px] text-text-muted">
                            📍 {log.location} • Foreman: {log.foreman} • Submitted at {log.submitted_at}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary font-mono block">
                            {log.total_workers} Workers
                          </span>
                          <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                            ₹{Number(log.total_cost || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Direct Link to Generate / View Weekly Payment Slip */}
                        <button
                          type="button"
                          onClick={() => navigate(`/subcontracts/weekly-payments/new?contractor_id=${log.contractor_id}&date=${log.date}&site_id=${site?.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                          title="Generate or View Subcontractor Weekly Payment Slip"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Weekly Slip</span>
                          <ArrowRight className="w-3 h-3 text-emerald-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                        <thead>
                          <tr className="text-text-muted font-semibold text-[11px] border-b border-border/60">
                            <th className="py-1.5 px-3 w-16 text-center">ORDER</th>
                            <th className="py-1.5 px-3">ITEM DESCRIPTION</th>
                            <th className="py-1.5 px-3 w-28">CLASSIFICATION</th>
                            <th className="py-1.5 px-3 w-20 text-center">UNIT</th>
                            <th className="py-1.5 px-3 text-center">MAISTRY SCOPE</th>
                            <th className="py-1.5 px-3 text-center">QTY</th>
                            <th className="py-1.5 px-3 text-right">RATE (₹)</th>
                            <th className="py-1.5 px-3 text-right">AMOUNT (₹)</th>
                            <th className="py-1.5 px-3">REMARKS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {log.trades.map((tr, i) => (
                            <tr key={i} className="hover:bg-surface-subtle/30">
                              <td className="py-2 px-3 text-center font-mono text-text-muted text-[11px]">#{tr.order || i + 1}</td>
                              <td className="py-2 px-3 font-semibold text-text-primary">{tr.item}</td>
                              <td className="py-2 px-3">{getClassificationBadge(tr.classification || tr.type)}</td>
                              <td className="py-2 px-3 text-center font-mono text-text-secondary">{tr.unit}</td>
                              <td className="py-2 px-3 text-center">
                                {Number(tr.maistry_scope) === 1 ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-2.5 h-2.5" /> Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                    <X className="w-2.5 h-2.5" /> No
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-primary">{tr.qty}</td>
                              <td className="py-2 px-3 text-right font-mono text-text-secondary">₹{Number(tr.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600">₹{Number(tr.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2 px-3 text-text-muted text-[11px]">{tr.remarks || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: WORKFORCE REGISTER & DEPLOYED LABOUR */}
      {activeSubTab === 'workforce_register' && (
        <div className="flex flex-col gap-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary text-xs">
                <span>Deployed Workforce</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {workers.length} <span className="text-xs font-normal text-text-muted">persons</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-1">100% active on site</span>
            </div>

            <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary text-xs">
                <span>Skilled Tradesmen</span>
                <HardHat className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {workers.filter((w) => (w.skill_level || '').toLowerCase().includes('skilled') && !(w.skill_level || '').toLowerCase().includes('unskilled')).length} <span className="text-xs font-normal text-text-muted">workers</span>
              </div>
              <span className="text-[11px] text-text-muted mt-1">Masons, Carpenters, Fitters</span>
            </div>

            <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary text-xs">
                <span>Helpers & Unskilled</span>
                <UserCheck className="w-4 h-4 text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {workers.filter((w) => (w.trade_name || '').toLowerCase().includes('helper') || (w.skill_level || '').toLowerCase().includes('unskilled')).length} <span className="text-xs font-normal text-text-muted">helpers</span>
              </div>
              <span className="text-[11px] text-text-muted mt-1">General site assistance</span>
            </div>

            <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary text-xs">
                <span>Daily Wage Liability</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                ₹{workers.reduce((acc, w) => acc + Number(w.daily_wage || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-text-muted mt-1">Estimated daily burn</span>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  placeholder="Search by name, trade, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="h-8 text-xs w-36"
              >
                <option value="all">All Trades</option>
                <option value="Mason">Masons</option>
                <option value="Bar Bender">Bar Benders</option>
                <option value="Carpenter">Carpenters</option>
                <option value="Electrician">Electricians</option>
                <option value="Helper">Helpers</option>
              </Select>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 text-xs w-36"
              >
                <option value="all">All Types</option>
                <option value="Direct">Direct Labour</option>
                <option value="Contractor">Contractor Gang</option>
              </Select>
            </div>
          </div>

          {/* Labour Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle font-semibold text-text-secondary">
                    <th className="py-2.5 px-4">Worker Code</th>
                    <th className="py-2.5 px-4">Worker Name</th>
                    <th className="py-2.5 px-4">Trade & Skill</th>
                    <th className="py-2.5 px-4">Engagement Type</th>
                    <th className="py-2.5 px-4">Contractor / Gang</th>
                    <th className="py-2.5 px-4 text-right">Daily Wage</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-text-secondary">
                        Loading site workforce...
                      </td>
                    </tr>
                  ) : filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-text-secondary">
                        No labour records match the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((w) => (
                      <tr key={w.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-text-muted">
                          {w.worker_code || `WRK-${w.id}`}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-text-primary">
                          {w.first_name || ''} {w.last_name || ''} {w.worker_name || ''}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-text-primary">{w.trade_name || w.trade || 'General'}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-muted text-text-secondary border border-border">
                              {w.skill_level || 'Skilled'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-text-secondary">
                          {w.employment_type || 'Direct Labour'}
                        </td>
                        <td className="py-2.5 px-4 text-text-secondary">
                          {w.contractor_name || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-text-primary">
                          ₹{Number(w.daily_wage || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-text-secondary font-mono">
                          {w.phone || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge variant="success" className="text-[10px] uppercase font-semibold">
                            {w.status || 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Modal */}
      {isDeployOpen && (
        <Modal
          isOpen={isDeployOpen}
          onClose={() => setIsDeployOpen(false)}
          title={`Deploy Labour to ${site.site_name}`}
        >
          <form onSubmit={handleDeploySubmit} className="space-y-4">
            <FormField label="Trade / Skill Type" required>
              <Select
                value={deployForm.trade_name}
                onChange={(e) => setDeployForm({ ...deployForm, trade_name: e.target.value })}
              >
                <option value="Mason">Mason</option>
                <option value="Bar Bender">Bar Bender</option>
                <option value="Carpenter">Carpenter / Shuttering</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Painter">Painter</option>
                <option value="Helper">Helper (Unskilled)</option>
              </Select>
            </FormField>

            <FormField label="Daily Wage Rate (₹)" required>
              <Input
                type="number"
                value={deployForm.daily_wage}
                onChange={(e) => setDeployForm({ ...deployForm, daily_wage: e.target.value })}
                placeholder="e.g. 850"
              />
            </FormField>

            <FormField label="Contractor (Optional)">
              <Select
                value={deployForm.contractor_id}
                onChange={(e) => setDeployForm({ ...deployForm, contractor_id: e.target.value })}
              >
                <option value="">Direct Deployment (Company Labour)</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractor_name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Deployment Date" required>
              <Input
                type="date"
                value={deployForm.deployment_date}
                onChange={(e) => setDeployForm({ ...deployForm, deployment_date: e.target.value })}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsDeployOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={deploying}>
                {deploying ? 'Deploying...' : 'Deploy to Site'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
