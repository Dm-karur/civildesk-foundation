import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock, Building2,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, FileText,
  Calendar, Users, DollarSign, ArrowUpRight, CheckSquare,
  ChevronDown, ExternalLink, X, RefreshCw, Download
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
import { projectsApi, subcontractsApi, dailyWagesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';
import { generateAndDownloadA5SlipFromItem, printA5SlipFromItem } from '../utils/a5SlipExportUtils';

const LOCAL_STORAGE_KEY = 'mock_subcontractor_weekly_payments';

const INITIAL_SEED_DATA = [
  {
    id: 'swp-001',
    voucher_no: 'SWP-2026-W36-001',
    week_number: 'Week 36 (01 Sep - 07 Sep 2026)',
    week_start: '2026-09-01',
    week_end: '2026-09-07',
    project_id: '1',
    project_name: 'Greenfield Residency - Phase 1',
    site_id: 'SITE-01',
    site_name: 'Main Residential Tower A',
    contractor_id: '1',
    contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
    trade_category: 'Brick Masonry & Plastering',
    work_order_no: 'WO-2026-012',
    total_mandays: 64,
    avg_rate_per_day: 850,
    gross_amount: 54400,
    advance_deduction: 5000,
    other_deductions: 1400,
    net_payable: 48000,
    payment_mode: 'RTGS / Bank Transfer',
    bank_account: 'HDFC Bank - Current A/C (*4910)',
    reference_no: 'UTR-HDFC-982103482',
    payment_date: '2026-09-05',
    status: 'Paid',
    prepared_by: 'Site Supervisor (Ram)',
    approved_by: 'Project Manager (K. Sundar)',
    notes: 'Weekly settlement for Block B 3rd floor masonry work gang.'
  },
  {
    id: 'swp-002',
    voucher_no: 'SWP-2026-W36-002',
    week_number: 'Week 36 (01 Sep - 07 Sep 2026)',
    week_start: '2026-09-01',
    week_end: '2026-09-07',
    project_id: '1',
    project_name: 'Greenfield Residency - Phase 1',
    site_id: 'SITE-01',
    site_name: 'Basement Parking 2',
    contractor_id: '2',
    contractor_name: 'Apex Rebar & Steel Fabricators',
    trade_category: 'Rebar Cutting & Tying',
    work_order_no: 'WO-2026-018',
    total_mandays: 48,
    avg_rate_per_day: 950,
    gross_amount: 45600,
    advance_deduction: 3000,
    other_deductions: 600,
    net_payable: 42000,
    payment_mode: 'NEFT Transfer',
    bank_account: 'ICICI Bank - Escrow A/C (*2201)',
    reference_no: 'UTR-ICIC-749102834',
    payment_date: '2026-09-05',
    status: 'Paid',
    prepared_by: 'Steel Incharge',
    approved_by: 'Project Manager (K. Sundar)',
    notes: 'Weekly wages for raft foundation rebar binding crew.'
  },
  {
    id: 'swp-003',
    voucher_no: 'SWP-2026-W36-003',
    week_number: 'Week 36 (01 Sep - 07 Sep 2026)',
    week_start: '2026-09-01',
    week_end: '2026-09-07',
    project_id: '2',
    project_name: 'Karur Commercial Plaza',
    site_id: 'SITE-081',
    site_name: 'Ajantha Theater Trichy Site',
    contractor_id: '3',
    contractor_name: 'Royal Plastering & Tiles Gang',
    trade_category: 'Tile Laying & Flooring',
    work_order_no: 'WO-2026-022',
    total_mandays: 36,
    avg_rate_per_day: 900,
    gross_amount: 32400,
    advance_deduction: 2000,
    other_deductions: 400,
    net_payable: 30000,
    payment_mode: 'RTGS / Bank Transfer',
    bank_account: 'Axis Bank - Project A/C (*7721)',
    reference_no: '',
    payment_date: '',
    status: 'Approved',
    prepared_by: 'Site Supervisor',
    approved_by: 'Commercial Head',
    notes: 'Floor tiling 1st floor corridor completed and verified.'
  },
  {
    id: 'swp-004',
    voucher_no: 'SWP-2026-W36-004',
    week_number: 'Week 36 (01 Sep - 07 Sep 2026)',
    week_start: '2026-09-01',
    week_end: '2026-09-07',
    project_id: '2',
    project_name: 'Karur Commercial Plaza',
    site_id: 'SITE-020',
    site_name: 'Commercial Complex Wing B',
    contractor_id: '4',
    contractor_name: 'Shiva Plumbing & Sanitary Works',
    trade_category: 'Plumbing & Drainage',
    work_order_no: 'WO-2026-031',
    total_mandays: 28,
    avg_rate_per_day: 850,
    gross_amount: 23800,
    advance_deduction: 0,
    other_deductions: 800,
    net_payable: 23000,
    payment_mode: 'UPI / IMPS',
    bank_account: 'HDFC Bank - Current A/C (*4910)',
    reference_no: '',
    payment_date: '',
    status: 'Pending Approval',
    prepared_by: 'Junior Engineer',
    approved_by: '',
    notes: 'Vertical drainage pipe installation 1st to 4th floor.'
  },
  {
    id: 'swp-005',
    voucher_no: 'SWP-2026-W36-005',
    week_number: 'Week 36 (01 Sep - 07 Sep 2026)',
    week_start: '2026-09-01',
    week_end: '2026-09-07',
    project_id: '1',
    project_name: 'Greenfield Residency - Phase 1',
    site_id: 'SITE-01',
    site_name: 'Main Residential Tower A',
    contractor_id: '5',
    contractor_name: 'Kaveri Shuttering & Formwork',
    trade_category: 'Formwork & Shuttering',
    work_order_no: 'WO-2026-015',
    total_mandays: 52,
    avg_rate_per_day: 920,
    gross_amount: 47840,
    advance_deduction: 5000,
    other_deductions: 1840,
    net_payable: 41000,
    payment_mode: 'Cheque',
    bank_account: 'SBI Project Escrow (*0918)',
    reference_no: '',
    payment_date: '',
    status: 'Draft',
    prepared_by: 'Site Supervisor',
    approved_by: '',
    notes: 'Formwork de-shuttering and staging for 4th floor slab.'
  }
];

const EMPTY_FORM = {
  project_id: '',
  project_name: '',
  site_name: '',
  contractor_id: '',
  contractor_name: '',
  trade_category: '',
  work_order_no: '',
  week_start: '',
  week_end: '',
  total_mandays: '0',
  avg_rate_per_day: '850',
  gross_amount: '0',
  advance_deduction: '0',
  other_deductions: '0',
  net_payable: '0',
  payment_mode: 'RTGS / Bank Transfer',
  bank_account: 'HDFC Bank - Current A/C (*4910)',
  reference_no: '',
  payment_date: '',
  status: 'Pending Approval',
  notes: ''
};

export function SubcontractorWeeklyPaymentsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [disburseItem, setDisburseItem] = useState(null);
  const [disburseForm, setDisburseForm] = useState({
    payment_mode: 'RTGS / Bank Transfer',
    reference_no: '',
    payment_date: new Date().toISOString().split('T')[0],
    bank_account: 'HDFC Bank - Current A/C (*4910)'
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [downloadingSlipId, setDownloadingSlipId] = useState(null);

  // Load from LocalStorage & API
  const loadData = async () => {
    setLoading(true);
    try {
      const [wagesRes, projRes, contrRes] = await Promise.all([
        dailyWagesApi.list({ limit: 300 }).catch(() => ({ data: [] })),
        projectsApi.list().catch(() => ({ data: [] })),
        subcontractsApi.contractors.list().catch(() => ({ data: [] }))
      ]);

      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      if (Array.isArray(pList) && pList.length > 0) {
        setProjects(pList);
      } else {
        setProjects([
          { id: '1', project_name: 'Greenfield Residency - Phase 1', project_code: 'PRJ-2026-001' },
          { id: '2', project_name: 'Karur Commercial Plaza', project_code: 'PRJ-2026-002' }
        ]);
      }

      const cList = contrRes?.data?.subcontractors ?? contrRes?.data?.data ?? [];
      let masterSubs = [];
      try {
        masterSubs = JSON.parse(localStorage.getItem('mock_subcontractors_master') || '[]');
      } catch {
        masterSubs = [];
      }

      const mergedSubs = [...masterSubs];
      if (Array.isArray(cList)) {
        cList.forEach(c => {
          if (!mergedSubs.some(m => String(m.id) === String(c.id))) {
            mergedSubs.push(c);
          }
        });
      }

      if (mergedSubs.length > 0) {
        setSubcontractors(mergedSubs);
      } else {
        setSubcontractors([
          { id: '1', contractor_name: 'Sri Murugan Civil Infra Pvt Ltd', trade: 'Masonry', phone: '+91 98421 22345' },
          { id: '2', contractor_name: 'Apex Rebar & Steel Fabricators', trade: 'Steel Binding', phone: '+91 97890 54321' },
          { id: '3', contractor_name: 'Royal Plastering & Tiles Gang', trade: 'Tiles & Flooring', phone: '+91 94432 99881' },
          { id: '4', contractor_name: 'Shiva Plumbing & Sanitary Works', trade: 'Plumbing', phone: '+91 96554 11223' },
          { id: '5', contractor_name: 'Kaveri Shuttering & Formwork', trade: 'Carpentry / Formwork', phone: '+91 98940 33445' },
        ]);
      }

      // Convert backend daily wage registers into weekly payment rows
      const rawRegisters = wagesRes?.data?.registers ?? wagesRes?.data?.daily_wages ?? (Array.isArray(wagesRes?.data) ? wagesRes.data : []);
      
      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      } catch {}

      const realWeeklyPayments = [];
      if (Array.isArray(rawRegisters) && rawRegisters.length > 0) {
        rawRegisters.forEach((reg) => {
          const regId = String(reg.id);
          const localMatch = localSaved.find(s => String(s.daily_wage_register_id) === regId || String(s.id) === regId || String(s.id) === `dwr-${regId}` || s.voucher_no === reg.register_no);

          const statusStr = String(reg.status || '').toUpperCase();
          let finalStatus = 'Pending Approval';
          if (statusStr === 'PAID') finalStatus = 'Paid';
          else if (statusStr === 'APPROVED') finalStatus = 'Approved';
          else if (statusStr === 'CANCELLED') finalStatus = 'Cancelled';
          else if (localMatch?.status) finalStatus = localMatch.status;

          const totalMandays = Number(reg.total_mandays) || (reg.lines?.reduce((acc, l) => {
            const cls = (l.classification || '').toLowerCase();
            return (cls === 'manpower' || !cls) ? acc + (Number(l.quantity) || 0) : acc;
          }, 0) || 0);

          const grossAmount = Number(reg.total_amount ?? reg.gross_amount) || 0;
          const advDeduction = Number(localMatch?.advance_deduction) || 0;
          const otherDeduction = Number(localMatch?.other_deductions) || 0;
          const netPayable = Math.max(0, grossAmount - advDeduction - otherDeduction);
          const avgRate = totalMandays > 0 ? Math.round(grossAmount / totalMandays) : (grossAmount > 0 ? grossAmount : 800);

          const lines = Array.isArray(reg.lines) ? reg.lines : [];
          const trades = lines.map(l => ({
            item: l.description,
            classification: l.classification || 'Manpower',
            rate: Number(l.rate) || 0,
            qty: Number(l.quantity) || 0,
            amount: Number(l.amount) || 0,
            uom: l.uom || 'Nos'
          }));

          realWeeklyPayments.push({
            id: `dwr-${reg.id}`,
            daily_wage_register_id: reg.id,
            is_real_db: true,
            voucher_no: reg.register_no || reg.voucher_no || `DWR-${String(reg.id).padStart(5, '0')}`,
            week_number: reg.wage_date ? `Day of ${reg.wage_date}` : 'Weekly Register',
            week_start: reg.wage_date || reg.week_start || '',
            week_end: reg.wage_date || reg.week_end || '',
            project_id: String(reg.project_id || (pList[0]?.id || '1')),
            project_name: reg.project_name || pList.find(p => String(p.id) === String(reg.project_id))?.project_name || 'Site Project',
            site_id: String(reg.site_id || 'SITE-01'),
            site_name: reg.site_name || 'Site Name',
            contractor_id: String(reg.subcontractor_id || reg.contractor_id || ''),
            contractor_name: reg.subcontractor_name || reg.contractor_name || 'Subcontractor',
            trade_category: reg.contractor_type_name || reg.trade_category || 'Labour Gang',
            work_order_no: reg.contractor_code ? `WO-${reg.contractor_code}` : `WO-${reg.subcontractor_id || reg.id}`,
            total_mandays: totalMandays,
            avg_rate_per_day: avgRate,
            gross_amount: grossAmount,
            advance_deduction: advDeduction,
            other_deductions: otherDeduction,
            net_payable: netPayable,
            payment_mode: localMatch?.payment_mode || 'RTGS / Bank Transfer',
            bank_account: localMatch?.bank_account || 'HDFC Bank - Current A/C (*4910)',
            reference_no: localMatch?.reference_no || '',
            payment_date: localMatch?.payment_date || (statusStr === 'PAID' ? reg.wage_date : ''),
            status: finalStatus,
            prepared_by: reg.created_by_name || 'Site Accounts',
            approved_by: statusStr === 'APPROVED' || statusStr === 'PAID' ? 'Project Manager' : (localMatch?.approved_by || ''),
            notes: reg.global_remarks || reg.notes || `Daily wage register for ${reg.wage_date}`,
            lines: lines,
            trades: trades
          });
        });
      }

      // Also merge any offline site daily logs from localStorage if any
      try {
        const globalLogs = JSON.parse(localStorage.getItem('global_subcon_daily_logs') || '[]');
        if (Array.isArray(globalLogs) && globalLogs.length > 0) {
          globalLogs.forEach(gLog => {
            const weeklyId = `swp-${gLog.contractor_id}-${gLog.date}`;
            if (!realWeeklyPayments.some(p => p.id === weeklyId || String(p.daily_wage_register_id) === String(gLog.id))) {
              realWeeklyPayments.push({
                id: weeklyId,
                voucher_no: `SWP-CON-${(gLog.date || '').replace(/-/g, '').slice(2)}`,
                week_number: `Day of ${gLog.date}`,
                week_start: gLog.date,
                week_end: gLog.date,
                project_id: String(gLog.site_id || '1'),
                project_name: gLog.site_name || 'Site Project',
                site_id: String(gLog.site_id || 'SITE-01'),
                site_name: gLog.site_name || 'Site Name',
                contractor_id: String(gLog.contractor_id),
                contractor_name: gLog.contractor_name,
                trade_category: gLog.trade || 'Subcontractor Gang',
                work_order_no: `WO-${gLog.contractor_id}`,
                total_mandays: gLog.total_workers || 1,
                avg_rate_per_day: gLog.total_workers > 0 ? Math.round(gLog.total_cost / gLog.total_workers) : 800,
                gross_amount: gLog.total_cost || 0,
                advance_deduction: 0,
                other_deductions: 0,
                net_payable: gLog.total_cost || 0,
                payment_mode: 'RTGS / Bank Transfer',
                status: 'Pending Approval',
                prepared_by: gLog.foreman || 'Site Supervisor',
                notes: gLog.notes || `Daily manpower on ${gLog.date}`,
                trades: gLog.trades || [],
              });
            }
          });
        }
      } catch {}

      // Keep user-created custom manual payments that are not from db registers
      const customLocalPayments = localSaved.filter(p => !p.daily_wage_register_id && !p.is_real_db && !realWeeklyPayments.some(r => r.id === p.id || r.voucher_no === p.voucher_no));

      let finalCombined = [...realWeeklyPayments, ...customLocalPayments];

      // If user had no real logs and no custom payments at all, fallback to initial seed
      if (finalCombined.length === 0) {
        finalCombined = [...INITIAL_SEED_DATA];
      }

      setPayments(finalCombined);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalCombined));
    } catch (err) {
      console.error('Error loading weekly payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const savePaymentsList = (newList) => {
    setPayments(newList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalPayout = payments.reduce((acc, p) => acc + (Number(p.net_payable) || 0), 0);
    const pendingApprovalItems = payments.filter(p => p.status === 'Pending Approval');
    const pendingApprovalAmt = pendingApprovalItems.reduce((acc, p) => acc + (Number(p.net_payable) || 0), 0);
    const approvedItems = payments.filter(p => p.status === 'Approved');
    const approvedAmt = approvedItems.reduce((acc, p) => acc + (Number(p.net_payable) || 0), 0);
    const paidItems = payments.filter(p => p.status === 'Paid');
    const paidAmt = paidItems.reduce((acc, p) => acc + (Number(p.net_payable) || 0), 0);

    return {
      totalPayout,
      pendingCount: pendingApprovalItems.length,
      pendingApprovalAmt,
      approvedCount: approvedItems.length,
      approvedAmt,
      paidCount: paidItems.length,
      paidAmt
    };
  }, [payments]);

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter(item => {
      if (selectedProjectId !== 'all' && String(item.project_id) !== String(selectedProjectId)) {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchVoucher = item.voucher_no?.toLowerCase().includes(q);
        const matchSub = item.contractor_name?.toLowerCase().includes(q);
        const matchTrade = item.trade_category?.toLowerCase().includes(q);
        const matchSite = item.site_name?.toLowerCase().includes(q);
        const matchProj = item.project_name?.toLowerCase().includes(q);
        const matchRef = item.reference_no?.toLowerCase().includes(q);
        if (!matchVoucher && !matchSub && !matchTrade && !matchSite && !matchProj && !matchRef) {
          return false;
        }
      }
      return true;
    });
  }, [payments, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / perPage));
  const pagedList = filteredPayments.slice((page - 1) * perPage, page * perPage);

  // Helpers for Dates
  const getCurrentWeekDefaults = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(now.setDate(diffToMonday + 6));
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  // Form Handlers
  const handleOpenAdd = () => {
    const { start, end } = getCurrentWeekDefaults();
    const nextSeq = payments.length + 1;
    const voucher_no = `SWP-2026-W36-${String(nextSeq).padStart(3, '0')}`;
    const defaultProj = projects[0] ? String(projects[0].id) : '1';
    const defaultProjName = projects[0]?.project_name || 'Greenfield Residency - Phase 1';

    setForm({
      ...EMPTY_FORM,
      voucher_no,
      project_id: defaultProj,
      project_name: defaultProjName,
      site_name: 'Main Site Tower A',
      week_start: start,
      week_end: end,
      work_order_no: `WO-2026-0${nextSeq + 10}`,
      status: 'Pending Approval'
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      project_name: item.project_name || '',
      site_name: item.site_name || '',
      contractor_id: String(item.contractor_id || ''),
      contractor_name: item.contractor_name || '',
      trade_category: item.trade_category || '',
      work_order_no: item.work_order_no || '',
      week_start: item.week_start || '',
      week_end: item.week_end || '',
      total_mandays: String(item.total_mandays || '0'),
      avg_rate_per_day: String(item.avg_rate_per_day || '850'),
      gross_amount: String(item.gross_amount || '0'),
      advance_deduction: String(item.advance_deduction || '0'),
      other_deductions: String(item.other_deductions || '0'),
      net_payable: String(item.net_payable || '0'),
      payment_mode: item.payment_mode || 'RTGS / Bank Transfer',
      bank_account: item.bank_account || '',
      reference_no: item.reference_no || '',
      payment_date: item.payment_date || '',
      status: item.status || 'Draft',
      notes: item.notes || ''
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto compute Gross Amount if mandays or rate changed
      if (field === 'total_mandays' || field === 'avg_rate_per_day') {
        const days = Number(next.total_mandays) || 0;
        const rate = Number(next.avg_rate_per_day) || 0;
        next.gross_amount = String(days * rate);
      }

      // Auto compute Net Payable
      if (field === 'total_mandays' || field === 'avg_rate_per_day' || field === 'gross_amount' || field === 'advance_deduction' || field === 'other_deductions') {
        const gross = Number(next.gross_amount) || 0;
        const adv = Number(next.advance_deduction) || 0;
        const oth = Number(next.other_deductions) || 0;
        next.net_payable = String(Math.max(0, gross - adv - oth));
      }

      if (field === 'project_id') {
        const proj = projects.find(p => String(p.id) === String(value));
        if (proj) next.project_name = proj.project_name || proj.name;
      }

      if (field === 'contractor_id') {
        const sub = subcontractors.find(s => String(s.id) === String(value));
        if (sub) {
          next.contractor_name = sub.contractor_name || sub.name;
          if (sub.trade || sub.category_name) {
            next.trade_category = sub.trade || sub.category_name;
          }
        }
      }

      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Auto-fill from Logged Daily Wages
  const handleAutoFillFromDailyWages = async () => {
    if (!form.contractor_id) {
      toast.error('Please select a subcontractor first.');
      return;
    }

    try {
      const res = await dailyWagesApi.list({ subcontractor_id: form.contractor_id }).catch(() => null);
      const dbWages = res?.data?.registers ?? res?.data?.daily_wages ?? (Array.isArray(res?.data) ? res.data : []);

      let matched = [];
      if (Array.isArray(dbWages) && dbWages.length > 0) {
        matched = dbWages;
      } else {
        const dailyWages = JSON.parse(localStorage.getItem('mock_daily_wages') || '[]');
        matched = dailyWages.filter(w => String(w.subcontractor_id) === String(form.contractor_id));
      }

      if (matched.length === 0) {
        toast.info('No daily wages logged for this subcontractor yet. You can manually enter shifts and rate.');
        return;
      }

      let totalDays = 0;
      let totalWageAmount = 0;

      matched.forEach(w => {
        if (w.lines && Array.isArray(w.lines) && w.lines.length > 0) {
          w.lines.forEach(l => {
            const shift = Number(l.quantity) || 0;
            const rate = Number(l.rate) || 0;
            const cls = (l.classification || '').toLowerCase();
            if (cls === 'manpower' || !cls) {
              totalDays += shift;
            }
            totalWageAmount += Number(l.amount) || (shift * rate);
          });
        } else if (w.total_mandays !== undefined || w.total_amount !== undefined) {
          totalDays += Number(w.total_mandays) || 0;
          totalWageAmount += Number(w.total_amount) || 0;
        } else if (w.entries) {
          Object.keys(w.entries).forEach(id => {
            const shift = Number(w.entries[id]) || 0;
            const rate = Number(w.rates?.[id]) || 850;
            totalDays += shift;
            totalWageAmount += (shift * rate);
          });
        }
      });

      if (totalDays > 0 || totalWageAmount > 0) {
        const avgRate = totalDays > 0 ? Math.round(totalWageAmount / totalDays) : 850;
        setForm(prev => {
          const gross = totalWageAmount;
          const adv = Number(prev.advance_deduction) || 0;
          const oth = Number(prev.other_deductions) || 0;
          return {
            ...prev,
            total_mandays: String(totalDays),
            avg_rate_per_day: String(avgRate),
            gross_amount: String(gross),
            net_payable: String(Math.max(0, gross - adv - oth)),
            notes: (prev.notes ? prev.notes + ' ' : '') + `(Auto-synced ${matched.length} daily wage logs)`
          };
        });
        toast.success(`Synced ${totalDays} shifts (₹${totalWageAmount.toLocaleString('en-IN')}) from ${matched.length} daily wage logs.`);
      } else {
        toast.info('Found daily wage entries, but shifts were 0.');
      }
    } catch {
      toast.error('Could not read daily wage logs.');
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.contractor_id && !form.contractor_name) newErrors.contractor_id = 'Subcontractor is required';
    if (!form.project_id && !form.project_name) newErrors.project_id = 'Project is required';
    if (!form.week_start) newErrors.week_start = 'Week start date required';
    if (!form.week_end) newErrors.week_end = 'Week end date required';
    if (Number(form.net_payable) <= 0 && Number(form.gross_amount) <= 0) {
      newErrors.net_payable = 'Net payable amount must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please resolve validation errors.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const week_number = `${form.week_start} to ${form.week_end}`;
      if (editingItem) {
        const updated = payments.map(p => {
          if (p.id === editingItem.id) {
            return {
              ...p,
              ...form,
              total_mandays: Number(form.total_mandays) || 0,
              avg_rate_per_day: Number(form.avg_rate_per_day) || 0,
              gross_amount: Number(form.gross_amount) || 0,
              advance_deduction: Number(form.advance_deduction) || 0,
              other_deductions: Number(form.other_deductions) || 0,
              net_payable: Number(form.net_payable) || 0,
              week_number
            };
          }
          return p;
        });
        savePaymentsList(updated);
        toast.success('Weekly payment record updated successfully.');
        setEditingItem(null);
      } else {
        const newRecord = {
          id: `swp-${Date.now()}`,
          voucher_no: form.voucher_no || `SWP-2026-${Date.now().toString().slice(-4)}`,
          ...form,
          total_mandays: Number(form.total_mandays) || 0,
          avg_rate_per_day: Number(form.avg_rate_per_day) || 0,
          gross_amount: Number(form.gross_amount) || 0,
          advance_deduction: Number(form.advance_deduction) || 0,
          other_deductions: Number(form.other_deductions) || 0,
          net_payable: Number(form.net_payable) || 0,
          week_number,
          prepared_by: 'Site Accounts'
        };
        savePaymentsList([newRecord, ...payments]);
        toast.success('New weekly payment batch created.');
        setIsAddOpen(false);
      }
      setSaving(false);
    }, 300);
  };

  const handleApprove = async (item) => {
    try {
      if (item.daily_wage_register_id) {
        await dailyWagesApi.approve(item.daily_wage_register_id).catch(() => {});
      }
    } catch {}

    const updated = payments.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'Approved',
          approved_by: 'Project Manager (Current User)'
        };
      }
      return p;
    });
    savePaymentsList(updated);

    // Sync to mock_subcontract_payments
    try {
      const PAYMENTS_KEY = 'mock_subcontract_payments';
      const existingPayments = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
      const updatedPay = existingPayments.map(p => {
        if (p.voucher_no === item.voucher_no || p.id === `pay-${item.id}` || p.id === item.id) {
          return { ...p, status: 'Approved', status_name: 'Approved' };
        }
        return p;
      });
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(updatedPay));
    } catch {}

    toast.success(`Voucher ${item.voucher_no} approved for payout.`);
  };

  const handleOpenDisburse = (item) => {
    setDisburseItem(item);
    setDisburseForm({
      payment_mode: item.payment_mode || 'RTGS / Bank Transfer',
      reference_no: item.reference_no || `UTR-${Math.floor(100000000 + Math.random() * 900000000)}`,
      payment_date: new Date().toISOString().split('T')[0],
      bank_account: item.bank_account || 'HDFC Bank - Current A/C (*4910)'
    });
  };

  const handleConfirmDisburse = async () => {
    if (!disburseForm.reference_no) {
      toast.error('Payment reference / UTR number is required.');
      return;
    }

    try {
      if (disburseItem.daily_wage_register_id) {
        await dailyWagesApi.pay(disburseItem.daily_wage_register_id, {
          payment_mode: disburseForm.payment_mode,
          reference_no: disburseForm.reference_no,
          payment_date: disburseForm.payment_date,
          bank_account: disburseForm.bank_account
        }).catch(() => {});
      }
    } catch {}

    const updated = payments.map(p => {
      if (p.id === disburseItem.id) {
        return {
          ...p,
          status: 'Paid',
          payment_mode: disburseForm.payment_mode,
          reference_no: disburseForm.reference_no,
          payment_date: disburseForm.payment_date,
          bank_account: disburseForm.bank_account
        };
      }
      return p;
    });

    savePaymentsList(updated);

    // Sync to mock_subcontract_payments
    try {
      const PAYMENTS_KEY = 'mock_subcontract_payments';
      const existingPayments = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
      const updatedPay = existingPayments.map(p => {
        if (p.voucher_no === disburseItem.voucher_no || p.id === `pay-${disburseItem.id}` || p.id === disburseItem.id) {
          return {
            ...p,
            status: 'Paid',
            status_name: 'Paid',
            payment_mode: disburseForm.payment_mode,
            reference_no: disburseForm.reference_no,
            payment_date: disburseForm.payment_date,
            bank_account: disburseForm.bank_account,
          };
        }
        return p;
      });
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(updatedPay));
    } catch {}

    toast.success(`Payment disbursed & recorded for ${disburseItem.contractor_name}.`);
    setDisburseItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.daily_wage_register_id) {
        await dailyWagesApi.cancel(deleteItem.daily_wage_register_id).catch(() => {});
      }
    } catch {}
    const updated = payments.filter(p => p.id !== deleteItem.id);
    savePaymentsList(updated);
    toast.success('Weekly payment record removed.');
    setDeleteItem(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>;
      case 'Approved':
        return <Badge variant="info" className="bg-sky-50 text-sky-700 border-sky-200">Approved</Badge>;
      case 'Pending Approval':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Pending Approval</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">{status || 'Draft'}</Badge>;
    }
  };

  // Instant Slip Download (A5 Landscape PDF)
  const handleDownloadSlip = async (item) => {
    setDownloadingSlipId(item.id);
    toast.info(`Generating A5 Landscape Slip for ${item.contractor_name}...`);
    try {
      await generateAndDownloadA5SlipFromItem(item);
      toast.success(`A5 Slip PDF for ${item.contractor_name} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate A5 PDF slip.');
    } finally {
      setDownloadingSlipId(null);
    }
  };

  // Instant Slip Print (A5 Landscape)
  const handlePrintSlip = (item) => {
    try {
      printA5SlipFromItem(item);
    } catch {
      toast.error('Please allow popups in your browser to print the slip.');
    }
  };

  // Export Full Summary (CSV)
  const handleExportSummary = () => {
    if (payments.length === 0) {
      toast.info('No weekly payments available to export.');
      return;
    }

    let csv = `VOUCHER NO,WEEK PERIOD,SUBCONTRACTOR,TRADE,PROJECT,SITE,TOTAL MANDAYS,GROSS (INR),DEDUCTIONS (INR),NET PAYABLE (INR),STATUS,PAYMENT MODE,UTR / REF NO,PAYMENT DATE\n`;
    payments.forEach(p => {
      const ded = (Number(p.advance_deduction) || 0) + (Number(p.other_deductions) || 0);
      csv += `"${p.voucher_no || p.id}","${p.week_start || ''} to ${p.week_end || ''}","${p.contractor_name}","${p.trade_category || ''}","${p.project_name || ''}","${p.site_name || ''}",${p.total_mandays || 0},${p.gross_amount || 0},${ded},${p.net_payable || 0},"${p.status}","${p.payment_mode || ''}","${p.reference_no || ''}","${p.payment_date || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Subcontractor_Weekly_Payments_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded weekly payments summary CSV instantly!');
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractor Weekly Payments"
        description="Manage weekly labor gang wages, piece-rate payments, advance recoveries, and disbursement vouchers."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subcontract Management', href: '/subcontracts/subcontractors' },
          { label: 'Weekly Payments' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSummary}
              className="gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Download Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSummary}
              className="gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Summary
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/subcontracts/weekly-payments/new')}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Weekly Payment
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Weekly Payout"
          value={`₹${kpis.totalPayout.toLocaleString('en-IN')}`}
          description={`${payments.length} total payment batches`}
          icon={<IndianRupee className="w-4 h-4" />}
          status="primary"
        />
        <KpiCard
          label="Pending Approval"
          value={`₹${kpis.pendingApprovalAmt.toLocaleString('en-IN')}`}
          description={`${kpis.pendingCount} batches awaiting review`}
          icon={<Clock className="w-4 h-4" />}
          status="warning"
        />
        <KpiCard
          label="Approved for Payment"
          value={`₹${kpis.approvedAmt.toLocaleString('en-IN')}`}
          description={`${kpis.approvedCount} ready for bank transfer`}
          icon={<ShieldCheck className="w-4 h-4" />}
          status="info"
        />
        <KpiCard
          label="Paid This Cycle"
          value={`₹${kpis.paidAmt.toLocaleString('en-IN')}`}
          description={`${kpis.paidCount} successfully disbursed`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          status="success"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search by Subcontractor, Voucher #, Trade, Site..."
            />
          </div>
          <div>
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTableContainer>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-[11px] uppercase font-bold text-text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3.5">Voucher / Week</th>
                <th className="px-4 py-3.5">Subcontractor & Trade</th>
                <th className="px-4 py-3.5">Project / Site</th>
                <th className="px-4 py-3.5 text-center">Mandays</th>
                <th className="px-4 py-3.5 text-right">Gross (₹)</th>
                <th className="px-4 py-3.5 text-right">Deductions (₹)</th>
                <th className="px-4 py-3.5 text-right font-bold text-text-primary">Net Payable (₹)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading weekly payments...
                  </td>
                </tr>
              ) : pagedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-text-muted/40" />
                    No subcontractor weekly payments found matching your criteria.
                  </td>
                </tr>
              ) : (
                pagedList.map((item) => {
                  const totalDeductions = (Number(item.advance_deduction) || 0) + (Number(item.other_deductions) || 0);
                  return (
                    <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-primary text-[13px]">
                          {item.voucher_no}
                        </div>
                        <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {item.week_start} to {item.week_end}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-text-primary">
                          {item.contractor_name}
                        </div>
                        <div className="text-[12px] text-text-muted">
                          {item.trade_category || 'General Civil Works'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-text-primary text-[13px] truncate max-w-[180px]" title={item.project_name}>
                          {item.project_name}
                        </div>
                        <div className="text-[11px] text-text-muted truncate max-w-[180px]">
                          {item.site_name}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {item.total_mandays || 0} shifts
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[13px]">
                        ₹{Number(item.gross_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[13px] text-red-600">
                        -₹{totalDeductions.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[14px] text-primary">
                        ₹{Number(item.net_payable || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'Pending Approval' && (
                            <button
                              onClick={() => handleApprove(item)}
                              title="Approve Payment Batch"
                              className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'Approved' && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleOpenDisburse(item)}
                              className="text-[11px] px-2 py-1 text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100"
                            >
                              Pay Now
                            </Button>
                          )}
                          <button
                            onClick={() => navigate(`/subcontracts/weekly-payments/new?id=${item.id}&contractor_id=${item.contractor_id}&date=${item.week_start}`)}
                            title="Open Maistry Slip"
                            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/subcontracts/weekly-payments/new?id=${item.id}&contractor_id=${item.contractor_id}&date=${item.week_start}`)}
                            title="Edit Maistry Slip"
                            className="p-1.5 rounded text-text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Instant Download A5 Landscape Slip */}
                          <button
                            type="button"
                            onClick={() => handleDownloadSlip(item)}
                            disabled={downloadingSlipId === item.id}
                            title="Instant Download Weekly Slip (A5 PDF)"
                            className="p-1.5 rounded text-text-secondary hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Download className={`w-4 h-4 ${downloadingSlipId === item.id ? 'animate-bounce text-emerald-600' : ''}`} />
                          </button>

                          {/* Instant Print A5 Slip */}
                          <button
                            type="button"
                            onClick={() => handlePrintSlip(item)}
                            title="Instant Print Weekly Slip (A5 Landscape)"
                            className="p-1.5 rounded text-text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteItem(item)}
                            title="Delete"
                            className="p-1.5 rounded text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-text-muted">
            Showing {Math.min(filteredPayments.length, (page - 1) * perPage + 1)} to {Math.min(filteredPayments.length, page * perPage)} of {filteredPayments.length} entries
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </DataTableContainer>

      {/* Create / Edit Modal */}
      {(isAddOpen || editingItem) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? `Edit Weekly Payment (${editingItem.voucher_no})` : 'New Subcontractor Weekly Payment'}
          size="lg"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Project" required error={errors.project_id}>
                <Select
                  value={form.project_id}
                  onChange={(e) => handleFormChange('project_id', e.target.value)}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Site / Location" required>
                <Input
                  value={form.site_name}
                  onChange={(e) => handleFormChange('site_name', e.target.value)}
                  placeholder="e.g. Tower A Floor 4"
                />
              </FormField>

              <FormField label="Subcontractor Partner" required error={errors.contractor_id}>
                <Select
                  value={form.contractor_id}
                  onChange={(e) => handleFormChange('contractor_id', e.target.value)}
                >
                  <option value="">Select Subcontractor</option>
                  {subcontractors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.contractor_name || s.name} {s.trade ? `(${s.trade})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Trade / Work Category">
                <Input
                  value={form.trade_category}
                  onChange={(e) => handleFormChange('trade_category', e.target.value)}
                  placeholder="e.g. Masonry, Barbending, Tiles"
                />
              </FormField>

              <FormField label="Week Start Date" required error={errors.week_start}>
                <Input
                  type="date"
                  value={form.week_start}
                  onChange={(e) => handleFormChange('week_start', e.target.value)}
                />
              </FormField>

              <FormField label="Week End Date" required error={errors.week_end}>
                <Input
                  type="date"
                  value={form.week_end}
                  onChange={(e) => handleFormChange('week_end', e.target.value)}
                />
              </FormField>
            </div>

            {/* Quick Auto-Calculate Feature */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Calculate from Logged Daily Site Wages
                </div>
                <p className="text-[11px] text-text-muted">
                  Reads shifts and trade rates logged in Daily Site Operations for this subcontractor.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleAutoFillFromDailyWages}
                className="gap-1 shrink-0 bg-white shadow-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Auto-Calculate
              </Button>
            </div>

            {/* Calculations Section */}
            <div className="bg-surface-muted/50 p-4 rounded-xl border border-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Wage & Manpower Calculation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Total Mandays / Shifts" required>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.total_mandays}
                    onChange={(e) => handleFormChange('total_mandays', e.target.value)}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Avg Rate per Shift (₹)">
                  <Input
                    type="number"
                    value={form.avg_rate_per_day}
                    onChange={(e) => handleFormChange('avg_rate_per_day', e.target.value)}
                    placeholder="850"
                  />
                </FormField>

                <FormField label="Gross Amount (₹)" required>
                  <Input
                    type="number"
                    value={form.gross_amount}
                    onChange={(e) => handleFormChange('gross_amount', e.target.value)}
                    placeholder="0"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                <FormField label="Advance Recovered (₹)">
                  <Input
                    type="number"
                    value={form.advance_deduction}
                    onChange={(e) => handleFormChange('advance_deduction', e.target.value)}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Other Deductions (Mess/Tools) (₹)">
                  <Input
                    type="number"
                    value={form.other_deductions}
                    onChange={(e) => handleFormChange('other_deductions', e.target.value)}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Net Payable Amount (₹)" required error={errors.net_payable}>
                  <div className="relative">
                    <Input
                      type="number"
                      className="font-bold text-primary text-base font-mono bg-primary/5"
                      value={form.net_payable}
                      onChange={(e) => handleFormChange('net_payable', e.target.value)}
                    />
                  </div>
                </FormField>
              </div>
            </div>

            {/* Payment & Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Payment Method">
                <Select
                  value={form.payment_mode}
                  onChange={(e) => handleFormChange('payment_mode', e.target.value)}
                >
                  <option value="RTGS / Bank Transfer">RTGS / Bank Transfer</option>
                  <option value="NEFT Transfer">NEFT Transfer</option>
                  <option value="UPI / IMPS">UPI / IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </Select>
              </FormField>

              <FormField label="Payment Account / Bank">
                <Input
                  value={form.bank_account}
                  onChange={(e) => handleFormChange('bank_account', e.target.value)}
                  placeholder="e.g. HDFC Current A/C"
                />
              </FormField>

              <FormField label="Approval Status">
                <Select
                  value={form.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Supervisor Remarks / Settlement Notes">
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Details of work executed, quality notes, gang details..."
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editingItem ? 'Save Changes' : 'Create Weekly Payment'}
              </Button>
            </div>
          </form>
        </EntityEditModal>
      )}

      {/* Disburse / Pay Modal */}
      {disburseItem && (
        <EntityEditModal
          isOpen={true}
          onClose={() => setDisburseItem(null)}
          title={`Disburse Payment: ${disburseItem.voucher_no}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Subcontractor Partner</div>
              <div className="text-base font-bold text-emerald-950">{disburseItem.contractor_name}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-emerald-900 border-t border-emerald-200 pt-2">
                <span>Net Payable Amount:</span>
                <span className="text-lg font-bold font-mono">₹{Number(disburseItem.net_payable).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <FormField label="Payment Date" required>
              <Input
                type="date"
                value={disburseForm.payment_date}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, payment_date: e.target.value }))}
              />
            </FormField>

            <FormField label="Payment Mode" required>
              <Select
                value={disburseForm.payment_mode}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, payment_mode: e.target.value }))}
              >
                <option value="RTGS / Bank Transfer">RTGS / Bank Transfer</option>
                <option value="NEFT Transfer">NEFT Transfer</option>
                <option value="UPI / IMPS">UPI / IMPS</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </Select>
            </FormField>

            <FormField label="Transaction Ref # / UTR / Cheque #" required>
              <Input
                value={disburseForm.reference_no}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, reference_no: e.target.value }))}
                placeholder="e.g. UTR-HDFC-9912048"
              />
            </FormField>

            <FormField label="Disbursing Bank Account">
              <Input
                value={disburseForm.bank_account}
                onChange={(e) => setDisburseForm(prev => ({ ...prev, bank_account: e.target.value }))}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDisburseItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmDisburse} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Record Payout
              </Button>
            </div>
          </div>
        </EntityEditModal>
      )}

      {/* Voucher Detail & Print Modal */}
      {viewingItem && (
        <EntityEditModal
          isOpen={true}
          onClose={() => setViewingItem(null)}
          title={`Subcontractor Weekly Payment Voucher: ${viewingItem.voucher_no}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Printable Voucher Format */}
            <div id="printable-voucher" className="border border-border rounded-xl p-6 bg-white shadow-xs space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <div className="text-lg font-black tracking-tight text-primary">KS CONSTRUCTION</div>
                  <div className="text-xs text-text-muted">Subcontractor Weekly Wage Settlement Voucher</div>
                  <div className="text-xs text-text-muted mt-1">Project: <span className="font-semibold text-text-primary">{viewingItem.project_name}</span></div>
                  <div className="text-xs text-text-muted">Site: <span className="font-semibold text-text-primary">{viewingItem.site_name}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted uppercase font-bold">Voucher No</div>
                  <div className="text-base font-mono font-bold text-primary">{viewingItem.voucher_no}</div>
                  <div className="mt-1">{getStatusBadge(viewingItem.status)}</div>
                </div>
              </div>

              {/* Subcontractor & Week details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-surface-muted/50 p-3 rounded-lg">
                <div>
                  <span className="text-text-muted uppercase font-bold block text-[10px]">Subcontractor Gang</span>
                  <span className="font-bold text-text-primary text-sm">{viewingItem.contractor_name}</span>
                  <div className="text-text-muted mt-0.5">Trade: {viewingItem.trade_category || 'Civil Contractor'}</div>
                  <div className="text-text-muted">Work Order: {viewingItem.work_order_no || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <span className="text-text-muted uppercase font-bold block text-[10px]">Settlement Period</span>
                  <span className="font-semibold text-text-primary">{viewingItem.week_start} to {viewingItem.week_end}</span>
                  <div className="text-text-muted mt-0.5">Total Shifts: <span className="font-bold text-text-primary">{viewingItem.total_mandays} Mandays</span></div>
                  <div className="text-text-muted">Rate/Day: ₹{Number(viewingItem.avg_rate_per_day).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-muted font-bold text-text-muted border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-2 font-medium">Gross Wage Calculation ({viewingItem.total_mandays} Shifts @ ₹{viewingItem.avg_rate_per_day})</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">₹{Number(viewingItem.gross_amount).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-red-600">Less: Mid-week Advance Recovery</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600">-₹{Number(viewingItem.advance_deduction || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-red-600">Less: Mess / Tool / Material Deductions</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600">-₹{Number(viewingItem.other_deductions || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-primary/5 font-bold">
                      <td className="px-3 py-2.5 text-primary text-sm">Net Payable Amount</td>
                      <td className="px-3 py-2.5 text-right font-mono text-primary text-base font-bold">
                        ₹{Number(viewingItem.net_payable).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-semibold">{viewingItem.payment_mode || 'Bank Transfer'}</span>
                  {viewingItem.bank_account && (
                    <div className="text-text-muted">{viewingItem.bank_account}</div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-text-muted block text-[10px] uppercase font-bold">UTR / Reference No</span>
                  <span className="font-mono font-semibold">{viewingItem.reference_no || 'Pending disbursement'}</span>
                  {viewingItem.payment_date && (
                    <div className="text-text-muted">Paid Date: {viewingItem.payment_date}</div>
                  )}
                </div>
              </div>

              {viewingItem.notes && (
                <div className="text-xs bg-surface-muted p-2.5 rounded text-text-secondary">
                  <span className="font-semibold text-text-primary">Remarks: </span>
                  {viewingItem.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs text-text-muted border-t border-dashed border-border mt-6">
                <div>
                  <div className="h-10 border-b border-text-muted/40 mb-1"></div>
                  <span>Prepared By: {viewingItem.prepared_by || 'Supervisor'}</span>
                </div>
                <div>
                  <div className="h-10 border-b border-text-muted/40 mb-1"></div>
                  <span>Verified By: Site Incharge</span>
                </div>
                <div>
                  <div className="h-10 border-b border-text-muted/40 mb-1"></div>
                  <span>Subcontractor Signature / Thumb</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Voucher
              </Button>
              <Button variant="primary" onClick={() => setViewingItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </EntityEditModal>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Weekly Payment Batch?"
          message={`Are you sure you want to remove weekly voucher ${deleteItem.voucher_no} for ${deleteItem.contractor_name}? This action cannot be undone.`}
          confirmLabel="Delete Voucher"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </PageContainer>
  );
}
