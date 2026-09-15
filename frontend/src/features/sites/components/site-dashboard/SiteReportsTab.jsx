import { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Users,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { toast } from '../../../../components/composite/Toast';

export function SiteReportsTab({ site }) {
  const [reportType, setReportType] = useState('dpr');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleExport = (format) => {
    toast.success(`Generating and downloading ${reportType.toUpperCase()} Site Report (${format.toUpperCase()})...`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Report Selection Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Report:</span>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-8 text-xs font-semibold w-56"
            >
              <option value="dpr">Daily Progress Summary (DPR Log)</option>
              <option value="manpower">Manpower & Attendance Ledger</option>
              <option value="materials">Material Consumption & Stock Balance</option>
              <option value="expenses">Site Expense & Petty Cash Statement</option>
              <option value="boq">BOQ Execution vs Remaining Balance</option>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <span>To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs font-medium"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs font-medium"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => handleExport('Excel')}
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-xs"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleExport('PDF')}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Document Sheet Preview */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col gap-6">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              KS Construction — Site Operational Report
            </span>
            <h2 className="text-lg font-bold text-text-primary mt-0.5">
              {reportType === 'dpr' && 'Consolidated Daily Progress Report (DPR)'}
              {reportType === 'manpower' && 'Site Manpower Deployment & Attendance Ledger'}
              {reportType === 'materials' && 'Material Inward & Consumption Balance Sheet'}
              {reportType === 'expenses' && 'Site Cash Book & Expense Voucher Statement'}
              {reportType === 'boq' && 'Bill of Quantities (BOQ) Progress & Financial Valuation'}
            </h2>
            <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
              <span>Site: <strong className="text-text-primary">{site?.site_name}</strong></span>
              <span>•</span>
              <span>Client: <strong className="text-text-primary">{site?.client_name || 'Direct'}</strong></span>
              <span>•</span>
              <span>Period: <strong>{startDate}</strong> to <strong>{endDate}</strong></span>
            </div>
          </div>

          <div className="text-right text-xs text-text-muted">
            <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="font-mono text-[11px]">SITE-CODE: {site?.site_code}</p>
          </div>
        </div>

        {/* Report Metric Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-subtle/60 p-3.5 rounded-lg border border-border">
          <div>
            <span className="text-[11px] text-text-muted font-medium">Site Engineer</span>
            <p className="font-semibold text-text-primary text-xs mt-0.5">
              {[site?.site_engineer_first_name, site?.site_engineer_last_name].filter(Boolean).join(' ') || 'Site Incharge'}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-medium">Site Status</span>
            <p className="font-semibold text-emerald-600 text-xs mt-0.5">
              {site?.site_status_name || 'Active Execution'}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-medium">Execution Progress</span>
            <p className="font-semibold text-text-primary text-xs mt-0.5">
              {site?.progress_percentage || '68.5'}%
            </p>
          </div>
          <div>
            <span className="text-[11px] text-text-muted font-medium">Contract Value</span>
            <p className="font-semibold text-text-primary text-xs mt-0.5">
              ₹{Number(site?.contract_value || 12500000).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Dynamic Report Content Preview */}
        {reportType === 'dpr' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">
              Chronological Daily Activity Log
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-border">
              <thead>
                <tr className="bg-surface-subtle font-semibold border-b border-border">
                  <th className="p-2 border-r border-border">Date</th>
                  <th className="p-2 border-r border-border">DPR No</th>
                  <th className="p-2 border-r border-border">Weather</th>
                  <th className="p-2 border-r border-border">Activities Executed</th>
                  <th className="p-2 border-r border-border text-center">Manpower</th>
                  <th className="p-2 border-r border-border">Material Consumed</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-2 border-r border-border font-medium">2026-09-07</td>
                  <td className="p-2 border-r border-border font-mono font-bold text-primary">DPR-2026-089</td>
                  <td className="p-2 border-r border-border">Sunny (32°C)</td>
                  <td className="p-2 border-r border-border">RCC casting of 4th floor columns & beam tying in Zone B.</td>
                  <td className="p-2 border-r border-border text-center font-bold">38</td>
                  <td className="p-2 border-r border-border text-text-secondary">28 m³ RMC, 2.8 MT Rebar</td>
                  <td className="p-2 text-center"><Badge variant="warning">Submitted</Badge></td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-border font-medium">2026-09-06</td>
                  <td className="p-2 border-r border-border font-mono font-bold text-primary">DPR-2026-088</td>
                  <td className="p-2 border-r border-border">Sunny (31°C)</td>
                  <td className="p-2 border-r border-border">Formwork shuttering completed for 4th floor slab.</td>
                  <td className="p-2 border-r border-border text-center font-bold">42</td>
                  <td className="p-2 border-r border-border text-text-secondary">150 ply sheets, 60kg wire</td>
                  <td className="p-2 text-center"><Badge variant="success">Approved</Badge></td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-border font-medium">2026-09-05</td>
                  <td className="p-2 border-r border-border font-mono font-bold text-primary">DPR-2026-087</td>
                  <td className="p-2 border-r border-border">Light Rain (27°C)</td>
                  <td className="p-2 border-r border-border">Blockwork masonry completed for 3rd floor outer perimeter.</td>
                  <td className="p-2 border-r border-border text-center font-bold">35</td>
                  <td className="p-2 border-r border-border text-text-secondary">1400 AAC blocks, 25 bags cement</td>
                  <td className="p-2 text-center"><Badge variant="success">Approved</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'manpower' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">
              Trade Deployment & Cumulative Man-Hours
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-border">
              <thead>
                <tr className="bg-surface-subtle font-semibold border-b border-border">
                  <th className="p-2 border-r border-border">Trade Discipline</th>
                  <th className="p-2 border-r border-border text-center">Avg Daily Deployed</th>
                  <th className="p-2 border-r border-border text-right">Regular Hours</th>
                  <th className="p-2 border-r border-border text-right">Overtime Hours</th>
                  <th className="p-2 border-r border-border text-right">Total Man-Hours</th>
                  <th className="p-2 text-right">Wage Liability (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                <tr>
                  <td className="p-2 border-r border-border font-sans font-semibold">RCC Masons</td>
                  <td className="p-2 border-r border-border text-center">8</td>
                  <td className="p-2 border-r border-border text-right">1,920 h</td>
                  <td className="p-2 border-r border-border text-right">180 h</td>
                  <td className="p-2 border-r border-border text-right font-bold">2,100 h</td>
                  <td className="p-2 text-right font-bold">₹2,04,000</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-border font-sans font-semibold">Bar Benders / Fitters</td>
                  <td className="p-2 border-r border-border text-center">10</td>
                  <td className="p-2 border-r border-border text-right">2,400 h</td>
                  <td className="p-2 border-r border-border text-right">240 h</td>
                  <td className="p-2 border-r border-border text-right font-bold">2,640 h</td>
                  <td className="p-2 text-right font-bold">₹2,40,000</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-border font-sans font-semibold">Carpenters (Shuttering)</td>
                  <td className="p-2 border-r border-border text-center">9</td>
                  <td className="p-2 border-r border-border text-right">2,160 h</td>
                  <td className="p-2 border-r border-border text-right">190 h</td>
                  <td className="p-2 border-r border-border text-right font-bold">2,350 h</td>
                  <td className="p-2 text-right font-bold">₹2,29,500</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-border font-sans font-semibold">Helpers (Unskilled)</td>
                  <td className="p-2 border-r border-border text-center">15</td>
                  <td className="p-2 border-r border-border text-right">3,600 h</td>
                  <td className="p-2 border-r border-border text-right">310 h</td>
                  <td className="p-2 border-r border-border text-right font-bold">3,910 h</td>
                  <td className="p-2 text-right font-bold">₹2,47,500</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {(reportType === 'materials' || reportType === 'expenses' || reportType === 'boq') && (
          <div className="p-8 text-center border border-dashed border-border rounded-lg text-xs text-text-secondary">
            <p className="font-semibold text-text-primary mb-1">
              Data ready for export.
            </p>
            <p>Click "Export PDF" or "Export Excel" above to generate the full multi-page formatted operational printout.</p>
          </div>
        )}

        {/* Signatures Footer */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border text-center text-xs text-text-muted mt-4">
          <div className="border-t border-dashed border-border pt-2">
            <p className="font-semibold text-text-primary">Site Engineer</p>
            <span className="text-[10px]">Prepared By</span>
          </div>
          <div className="border-t border-dashed border-border pt-2">
            <p className="font-semibold text-text-primary">Project Manager</p>
            <span className="text-[10px]">Checked & Verified</span>
          </div>
          <div className="border-t border-dashed border-border pt-2">
            <p className="font-semibold text-text-primary">Client Representative</p>
            <span className="text-[10px]">Acknowledged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
