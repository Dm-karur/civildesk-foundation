import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, FileText, ArrowLeft, BarChart3,
  Layers, CheckCircle2, TrendingUp, AlertTriangle,
  RefreshCw, Filter, HardHat, PieChart
} from 'lucide-react';
import { boqApi, sitesApi } from '../../../api/apiservice';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { exportBoqToExcel, exportBoqToPdf } from '../utils/boqExportUtils';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

export function BoqReportsPage() {
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedBoqId, setSelectedBoqId] = useState('');

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);

  // Report Type: 'sections' | 'quantity' | 'cost' | 'variance'
  const [reportType, setReportType] = useState('sections');

  // Load Sites & BOQs
  useEffect(() => {
    let active = true;
    Promise.all([
      sitesApi.list().catch(() => ({ data: [] })),
      boqApi.list().catch(() => ({ data: [] })),
    ]).then(([sitesRes, boqsRes]) => {
      if (!active) return;
      const sList = sitesRes?.data?.sites || sitesRes?.sites || (Array.isArray(sitesRes?.data) ? sitesRes.data : []);
      const bList = boqsRes?.data?.project_boqs || boqsRes?.project_boqs || (Array.isArray(boqsRes?.data) ? boqsRes.data : []);
      setSites(sList);
      setBoqs(bList);

      if (sList.length > 0) {
        setSelectedSiteId(String(sList[0].id));
      }
      if (bList.length > 0) {
        setSelectedBoqId(String(bList[0].id));
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  // Filter available BOQs based on site
  const availableBoqs = boqs.filter((b) => {
    if (!selectedSiteId) return true;
    return String(b.site_id) === String(selectedSiteId);
  });

  // When selectedSiteId changes, auto-select first available BOQ
  useEffect(() => {
    if (availableBoqs.length > 0 && !availableBoqs.some((b) => String(b.id) === String(selectedBoqId))) {
      setSelectedBoqId(String(availableBoqs[0].id));
    }
  }, [selectedSiteId, availableBoqs, selectedBoqId]);

  // Load details for selected BOQ
  useEffect(() => {
    if (!selectedBoqId) {
      setSections([]);
      setItems([]);
      return;
    }

    setLoading(true);
    Promise.all([
      boqApi.sections.list(selectedBoqId).catch(() => ({ data: [] })),
      boqApi.items.list(selectedBoqId).catch(() => ({ data: [] })),
    ]).then(([secRes, itemRes]) => {
      const secList = secRes?.data?.sections || secRes?.sections || (Array.isArray(secRes?.data) ? secRes.data : []);
      const itmList = itemRes?.data?.items || itemRes?.items || (Array.isArray(itemRes?.data) ? itemRes.data : []);
      setSections(secList);
      setItems(itmList);
    }).finally(() => {
      setLoading(false);
    });
  }, [selectedBoqId]);

  const currentBoq = boqs.find((b) => String(b.id) === String(selectedBoqId));

  // Compute Section Summary
  const sectionSummary = useMemo(() => {
    return sections.map((sec) => {
      const secItems = items.filter((i) => String(i.section_id) === String(sec.id));
      const totalBudget = secItems.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.rate || 0)), 0);
      const executedBudget = secItems.reduce((acc, i) => acc + (Number(i.executed_quantity || 0) * Number(i.rate || 0)), 0);
      const balanceBudget = Math.max(0, totalBudget - executedBudget);
      const progress = totalBudget > 0 ? Math.min(100, Math.round((executedBudget / totalBudget) * 100)) : 0;

      return {
        id: sec.id,
        code: sec.section_code || 'SEC',
        name: sec.section_name,
        itemCount: secItems.length,
        totalBudget,
        executedBudget,
        balanceBudget,
        progress,
      };
    });
  }, [sections, items]);

  // Totals
  const overallTotals = useMemo(() => {
    let totalBudget = 0;
    let executedBudget = 0;
    items.forEach((i) => {
      const b = Number(i.quantity || 0) * Number(i.rate || 0);
      totalBudget += b;
      executedBudget += Number(i.executed_quantity || 0) * Number(i.rate || 0);
    });
    const balanceBudget = Math.max(0, totalBudget - executedBudget);
    const progress = totalBudget > 0 ? Math.min(100, Math.round((executedBudget / totalBudget) * 100)) : 0;
    return { totalBudget, executedBudget, balanceBudget, progress };
  }, [items]);

  // Export current report table to Excel
  const handleExportReportExcel = () => {
    if (!currentBoq || items.length === 0) {
      toast.error('No report data available to export.');
      return;
    }

    if (reportType === 'sections') {
      const rows = sectionSummary.map((s) => ({
        'Section Code': s.code,
        'Section Name': s.name,
        'Items Count': s.itemCount,
        'Budget (₹)': s.totalBudget,
        'Executed (₹)': s.executedBudget,
        'Balance (₹)': s.balanceBudget,
        'Progress %': `${s.progress}%`,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Section Summary');
      XLSX.writeFile(wb, `${currentBoq.boq_code}_Section_Summary_Report.xlsx`);
    } else {
      exportBoqToExcel(currentBoq, items, sections);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-[1500px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/boq')}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BOQ Register</span>
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              Bill of Quantities Reports & Analytics
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Comprehensive cost, execution progress, section breakdown, and variance reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportReportExcel}
            className="text-xs flex items-center gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportBoqToPdf(currentBoq, items, sections)}
            className="text-xs flex items-center gap-1 text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Target Site & BOQ Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
            Filter Site
          </label>
          <Select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            options={[
              { value: '', label: 'All Construction Sites' },
              ...sites.map((s) => ({ value: String(s.id), label: `${s.site_name} (${s.site_code})` })),
            ]}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
            Select Active BOQ
          </label>
          <Select
            value={selectedBoqId}
            onChange={(e) => setSelectedBoqId(e.target.value)}
            options={[
              { value: '', label: availableBoqs.length === 0 ? 'No BOQ found' : 'Choose BOQ...' },
              ...availableBoqs.map((b) => ({ value: String(b.id), label: `${b.boq_name} (${b.boq_code}) — Rev ${b.revision_number || 0}` })),
            ]}
          />
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Total BOQ Budget</span>
          <span className="text-base sm:text-lg font-bold font-mono text-primary">{formatCurrency(overallTotals.totalBudget)}</span>
          <span className="text-[11px] text-text-muted block mt-0.5">{items.length} Items</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Executed Valuation</span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-600">{formatCurrency(overallTotals.executedBudget)}</span>
          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">{overallTotals.progress}% Complete</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Balance Valuation</span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-600">{formatCurrency(overallTotals.balanceBudget)}</span>
          <span className="text-[11px] text-text-muted block mt-0.5">Remaining value to complete</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Overall Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-surface-muted rounded-full h-2 overflow-hidden border border-border">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallTotals.progress}%` }} />
            </div>
            <span className="text-xs font-bold font-mono text-text-primary">{overallTotals.progress}%</span>
          </div>
          <span className="text-[11px] text-text-muted block mt-1">Live sync with site DSR entries</span>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {[
          { id: 'sections', label: '1. BOQ Summary by Section', icon: Layers },
          { id: 'quantity', label: '2. Quantity Progress Report', icon: BarChart3 },
          { id: 'cost', label: '3. Cost & Valuation Report', icon: TrendingUp },
          { id: 'variance', label: '4. Variance Analysis', icon: AlertTriangle },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = reportType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── REPORT 1: SECTIONS SUMMARY ───────────────────────────────────── */}
      {reportType === 'sections' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-28">Section Code</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Section Name</th>
                  <th className="py-2.5 px-3 w-24 text-center">Items</th>
                  <th className="py-2.5 px-3 w-36 text-right">Budget (₹)</th>
                  <th className="py-2.5 px-3 w-36 text-right">Executed (₹)</th>
                  <th className="py-2.5 px-3 w-36 text-right">Balance (₹)</th>
                  <th className="py-2.5 px-3 w-28 text-center">Progress</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sectionSummary.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-text-muted">
                      No sections found for this BOQ.
                    </td>
                  </tr>
                ) : (
                  sectionSummary.map((sec, idx) => (
                    <tr key={sec.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="py-2 px-3 text-center font-mono text-text-muted">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-medium text-text-primary">{sec.code}</td>
                      <td className="py-2 px-3 font-semibold text-text-primary">{sec.name}</td>
                      <td className="py-2 px-3 text-center font-mono">{sec.itemCount}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">
                        {formatCurrency(sec.totalBudget)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(sec.executedBudget)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-amber-600">
                        {formatCurrency(sec.balanceBudget)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-14 bg-surface-muted rounded-full h-1.5 overflow-hidden border border-border">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sec.progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-text-secondary">{sec.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={sec.progress >= 100 ? 'success' : sec.progress > 0 ? 'warning' : 'default'} className="text-[10px]">
                          {sec.progress >= 100 ? 'Completed' : sec.progress > 0 ? 'In Progress' : 'Not Started'}
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

      {/* ─── REPORT 2: QUANTITY PROGRESS ─────────────────────────────────── */}
      {reportType === 'quantity' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-28">Item Code</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Description</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-3 w-28 text-right">BOQ Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Executed Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Balance Qty</th>
                  <th className="py-2.5 px-3 w-28 text-center">Progress %</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-text-muted">
                      No items available in this BOQ.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity || 0);
                    const exec = Number(item.executed_quantity || 0);
                    const balance = Math.max(0, qty - exec);
                    const progress = qty > 0 ? Math.min(100, Math.round((exec / qty) * 100)) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-text-muted">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-text-primary">{item.item_code}</td>
                        <td className="py-2 px-3 font-medium text-text-primary">{item.item_name || item.description}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.unit_code || 'Nos'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">{qty}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{exec}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">{balance}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="font-mono text-xs font-semibold">{progress}%</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={progress >= 100 ? 'success' : progress > 0 ? 'warning' : 'default'} className="text-[10px]">
                            {progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── REPORT 3: COST & VALUATION ──────────────────────────────────── */}
      {reportType === 'cost' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-28">Item Code</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                  <th className="py-2.5 px-3 w-24 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-32 text-right">BOQ Amount (₹)</th>
                  <th className="py-2.5 px-3 w-32 text-right">Executed (₹)</th>
                  <th className="py-2.5 px-3 w-32 text-right">Balance (₹)</th>
                  <th className="py-2.5 px-3 w-24 text-center">Cost %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      No items available in this BOQ.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity || 0);
                    const rate = Number(item.rate || 0);
                    const amount = qty * rate;
                    const exec = Number(item.executed_quantity || 0);
                    const execAmount = exec * rate;
                    const balanceAmount = Math.max(0, amount - execAmount);
                    const costProgress = amount > 0 ? Math.min(100, Math.round((execAmount / amount) * 100)) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-text-muted">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-text-primary">{item.item_code}</td>
                        <td className="py-2 px-3 font-medium text-text-primary">{item.item_name || item.description}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(rate)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">{formatCurrency(amount)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(execAmount)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">{formatCurrency(balanceAmount)}</td>
                        <td className="py-2 px-3 text-center font-mono font-semibold">{costProgress}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── REPORT 4: VARIANCE ANALYSIS ─────────────────────────────────── */}
      {reportType === 'variance' && (
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted">
            <h3 className="text-sm font-bold text-text-primary">Execution Variance & Overrun Tracking</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Identifies items with pending quantity balances or execution nearing 100%.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted/50 border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-28">Item Code</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                  <th className="py-2.5 px-3 w-24 text-right">Planned Qty</th>
                  <th className="py-2.5 px-3 w-24 text-right">Actual Qty</th>
                  <th className="py-2.5 px-3 w-24 text-right">Variance Qty</th>
                  <th className="py-2.5 px-3 w-32 text-right">Variance Amount (₹)</th>
                  <th className="py-2.5 px-3 w-28 text-center">Variance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted">
                      No items found.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity || 0);
                    const exec = Number(item.executed_quantity || 0);
                    const rate = Number(item.rate || 0);
                    const diffQty = exec - qty;
                    const diffAmount = diffQty * rate;

                    return (
                      <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-text-muted">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-text-primary">{item.item_code}</td>
                        <td className="py-2 px-3 font-medium text-text-primary">{item.item_name || item.description}</td>
                        <td className="py-2 px-3 text-right font-mono">{qty}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{exec}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {diffQty > 0 ? `+${diffQty}` : diffQty}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formatCurrency(diffAmount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {exec > qty ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Quantity Overrun
                            </span>
                          ) : exec === qty ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              100% Executed
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Within Budget
                            </span>
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
      )}
    </div>
  );
}
