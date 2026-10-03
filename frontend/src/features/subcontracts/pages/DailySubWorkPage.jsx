import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat,
  Search,
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
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Building2,
  ArrowLeft,
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
import { subcontractsApi, subWorkApi, sitesApi } from '../../../api/apiservice';
import { generateAndDownloadA5SlipFromItem, printA5SlipFromItem } from '../utils/a5SlipExportUtils';

const COMMON_UOMS = ['Sq.ft', 'Cu.m', 'Rft', 'Nos', 'Shifts', 'Brass', 'Days', 'Trips', 'Kg', 'Bags', 'Ton'];

const createEmptyWorkRow = (order = 1) => ({
  id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  order,
  item: '', // User fully types description
  unit: 'Sq.ft',
  rate: '',
  qty: '',
  amount: 0,
  remarks: '',
});

export function DailySubWorkPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'registers'
  const [loading, setLoading] = useState(false);

  // Sites & Subcontractors
  const [sites, setSites] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [locationGrid, setLocationGrid] = useState('');
  const [foremanIncharge, setForemanIncharge] = useState('');
  const [logNotes, setLogNotes] = useState('');

  // Fully Typed Work Items
  const [workRows, setWorkRows] = useState([createEmptyWorkRow(1), createEmptyWorkRow(2)]);
  const [submitting, setSubmitting] = useState(false);

  // Slips List
  const [subWorkSlips, setSubWorkSlips] = useState([]);
  const [searchLog, setSearchLog] = useState('');

  // Generated Slip Modal
  const [generatedSlip, setGeneratedSlip] = useState(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sRes, scRes, wRes] = await Promise.all([
        sitesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
        subcontractsApi.contractors.list({ limit: 100 }).catch(() => ({ data: [] })),
        subWorkApi.list({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const siteList = sRes?.data?.sites || sRes?.data || [];
      const subList = scRes?.data?.subcontractors || scRes?.data?.contractors || scRes?.data || [];
      const regsList = wRes?.data?.registers || wRes?.data?.daily_wages || [];

      setSites(Array.isArray(siteList) ? siteList : []);
      if (Array.isArray(siteList) && siteList.length > 0) {
        setSelectedSiteId(String(siteList[0].id));
      }

      setSubcontractors(Array.isArray(subList) ? subList : []);

      // Load saved logs
      let combinedLogs = [];
      if (Array.isArray(regsList) && regsList.length > 0) {
        combinedLogs = regsList.map(r => ({
          id: `dwr-${r.id}`,
          ref_no: r.register_no || `SWP-${r.id}`,
          voucher_no: r.register_no || `SWP-${r.id}`,
          date: r.wage_date,
          site_id: r.site_id,
          site_name: r.site_name || 'Construction Site',
          contractor_id: String(r.subcontractor_id),
          contractor_name: r.subcontractor_name || 'Subcontractor Gang',
          trade: r.contractor_trade || 'Sub Work',
          location: r.global_remarks || '',
          total_cost: Number(r.total_amount) || 0,
          status: r.status || 'SUBMITTED',
          trades: (r.lines || []).map((l, i) => ({
            order: i + 1,
            item: l.description,
            unit: l.uom || 'Sq.ft',
            qty: Number(l.quantity) || 0,
            rate: Number(l.rate) || 0,
            amount: Number(l.amount) || 0,
            remarks: l.remarks || ''
          }))
        }));
      }

      const localLogs = JSON.parse(localStorage.getItem('global_subcon_daily_logs') || '[]');
      if (Array.isArray(localLogs) && localLogs.length > 0) {
        combinedLogs = [...localLogs.filter(l => !combinedLogs.some(c => c.id === l.id)), ...combinedLogs];
      }

      setSubWorkSlips(combinedLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubcontractor = (conId) => {
    setSelectedSubcontractorId(conId);
    // Reset to clean typed rows ready for user input (NO template preloading)
    setWorkRows([
      createEmptyWorkRow(1),
      createEmptyWorkRow(2),
    ]);
  };

  const handleRowChange = (index, field, value) => {
    setWorkRows(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'qty' || field === 'rate') {
        const q = parseFloat(target.qty) || 0;
        const r = parseFloat(target.rate) || 0;
        target.amount = Math.round(q * r * 100) / 100;
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleAddWorkRow = () => {
    setWorkRows(prev => [
      ...prev,
      createEmptyWorkRow(prev.length + 1),
    ]);
  };

  const handleRemoveWorkRow = (index) => {
    if (workRows.length <= 1) {
      setWorkRows([createEmptyWorkRow(1)]);
      return;
    }
    setWorkRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const totalAmount = useMemo(() => {
    return workRows.reduce((acc, row) => acc + (parseFloat(row.amount) || 0), 0);
  }, [workRows]);

  const handleSubmitAndGenerateSlip = async () => {
    if (!selectedSiteId) {
      toast.warning('Please select a construction site.');
      return;
    }
    if (!selectedSubcontractorId) {
      toast.warning('Please select a subcontractor gang.');
      return;
    }

    const filledRows = workRows.filter(r => r.item && r.item.trim() !== '' && (parseFloat(r.qty) || 0) > 0);
    if (filledRows.length === 0) {
      toast.warning('Please type a work item description and enter quantity for at least one item.');
      return;
    }

    const con = subcontractors.find(c => String(c.id) === String(selectedSubcontractorId));
    const siteObj = sites.find(s => String(s.id) === String(selectedSiteId));
    setSubmitting(true);

    try {
      // 1. Submit to Backend API
      const payload = {
        site_id: parseInt(selectedSiteId, 10),
        subcontractor_id: parseInt(selectedSubcontractorId, 10),
        wage_date: workDate,
        global_remarks: locationGrid ? `Location: ${locationGrid}. ${logNotes}` : logNotes,
        lines: filledRows.map((r, idx) => ({
          description: r.item.trim(),
          classification: 'Manpower',
          uom: r.unit || 'Sq.ft',
          quantity: parseFloat(r.qty) || 0,
          rate: parseFloat(r.rate) || 0,
          amount: parseFloat(r.amount) || 0,
          remarks: r.remarks || '',
          display_order: idx + 1,
        })),
      };

      let dbSuccess = false;
      let dbRecordId = null;
      try {
        const apiRes = await subWorkApi.create(payload);
        dbRecordId = apiRes?.data?.daily_wage?.id || apiRes?.data?.id;
        dbSuccess = true;
      } catch (err) {
        console.warn('Backend DB insert skipped, saving locally:', err);
      }

      // 2. Persist locally
      const slipRefNo = dbRecordId ? `SWP-${dbRecordId}` : `SWP-${Date.now().toString().slice(-6)}`;
      const newSlip = {
        id: dbRecordId ? `dwr-${dbRecordId}` : `log-${Date.now()}`,
        ref_no: slipRefNo,
        voucher_no: slipRefNo,
        date: workDate,
        start_date: workDate,
        end_date: workDate,
        site_id: selectedSiteId,
        site_name: siteObj?.site_name || 'Site',
        contractor_id: selectedSubcontractorId,
        contractor_name: con?.contractor_name || con?.name || 'Subcontractor',
        trade: con?.contractor_type_name || con?.trade || 'Civil Works',
        location: locationGrid || 'Main Building',
        foreman: foremanIncharge || 'Site Supervisor',
        trades: filledRows.map((r, idx) => ({
          order: idx + 1,
          item: r.item.trim(),
          rate: parseFloat(r.rate) || 0,
          qty: parseFloat(r.qty) || 0,
          amount: parseFloat(r.amount) || 0,
          unit: r.unit || 'Sq.ft',
          remarks: r.remarks || '',
        })),
        total_workers: filledRows.length,
        total_cost: totalAmount,
        submitted_at: new Date().toLocaleTimeString(),
        status: 'SUBMITTED',
      };

      const updatedLogs = [newSlip, ...subWorkSlips];
      setSubWorkSlips(updatedLogs);

      const localLogs = JSON.parse(localStorage.getItem('global_subcon_daily_logs') || '[]');
      localStorage.setItem('global_subcon_daily_logs', JSON.stringify([newSlip, ...localLogs]));

      try {
        const existingSlips = JSON.parse(localStorage.getItem('mock_maistry_slips') || '[]');
        localStorage.setItem('mock_maistry_slips', JSON.stringify([newSlip, ...existingSlips]));
      } catch {}

      toast.success(dbSuccess ? 'Sub Work submitted & slip generated!' : 'Sub Work saved locally & slip generated!');

      // 3. Open Slip Modal
      setGeneratedSlip(newSlip);
      setIsSlipModalOpen(true);

      // Reset form
      setLocationGrid('');
      setForemanIncharge('');
      setLogNotes('');
      setWorkRows([createEmptyWorkRow(1), createEmptyWorkRow(2)]);
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit sub work entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return subWorkSlips.filter(log => {
      const q = searchLog.toLowerCase().trim();
      if (!q) return true;
      return (
        String(log.contractor_name || '').toLowerCase().includes(q) ||
        String(log.site_name || '').toLowerCase().includes(q) ||
        String(log.trade || '').toLowerCase().includes(q) ||
        String(log.ref_no || '').toLowerCase().includes(q) ||
        String(log.date || '').includes(q)
      );
    });
  }, [subWorkSlips, searchLog]);

  return (
    <PageContainer>
      <PageHeader
        title="Daily Sub Work Entry"
        subtitle="Type executed subcontractor work items directly, record quantities and rates, and generate instant work slips."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Subcontracts', href: '/subcontracts/subcontractors' },
          { label: 'Daily Sub Work Entry' }
        ]}
      />

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-2.5 shadow-xs mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('entry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'entry' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-muted'
            }`}
          >
            <HardHat className="w-4 h-4" />
            New Sub Work Entry (Fully Typed)
          </button>
          <button
            onClick={() => setActiveTab('registers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'registers' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-muted'
            }`}
          >
            <FileText className="w-4 h-4" />
            Recorded Sub Work Slips ({subWorkSlips.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subcontracts/daily-wages')}
            className="text-xs gap-1.5 h-8 font-medium text-slate-700 hover:text-slate-900 border-slate-300"
            title="Switch to trade templates mode"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Template Mode (Daily Wages)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subcontracts/weekly-payments')}
            className="text-xs gap-1.5 h-8 font-medium text-emerald-700 hover:text-emerald-800 border-emerald-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Weekly Payouts
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/subcontracts/subcontractors')}
            className="text-xs gap-1.5 h-8 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Subcontractors
          </Button>
        </div>
      </div>

      {/* TAB 1: NEW SUB WORK ENTRY */}
      {activeTab === 'entry' && (
        <div className="bg-surface rounded-xl border border-border p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-primary">1. Select Site & Subcontractor</h3>
              <p className="text-xs text-text-muted">Choose where the work took place and which gang performed it</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              No Template Required • Free Form Typing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="CONSTRUCTION SITE" required>
              <Select
                value={selectedSiteId}
                onChange={e => setSelectedSiteId(e.target.value)}
                className="w-full h-10 text-xs font-semibold"
              >
                <option value="">-- Choose Site --</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.site_name} ({s.site_code})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="SUBCONTRACTOR GANG" required>
              <Select
                value={selectedSubcontractorId}
                onChange={e => handleSelectSubcontractor(e.target.value)}
                className="w-full h-10 text-xs font-semibold border-primary/40 focus:border-primary"
              >
                <option value="">-- Choose Subcontractor --</option>
                {subcontractors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contractor_name || c.name} ({c.contractor_type_name || c.trade || 'General Works'})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="WORK DATE" required>
              <div className="relative">
                <Input
                  type="date"
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  className="w-full pl-9 h-10 text-xs font-medium"
                />
                <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </FormField>

            <FormField label="WORK LOCATION / GRID">
              <Input
                type="text"
                placeholder="e.g. Tower B, 2nd Floor, Room 204"
                value={locationGrid}
                onChange={e => setLocationGrid(e.target.value)}
                className="w-full h-10 text-xs"
              />
            </FormField>
          </div>

          {/* Work Items Table */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  2. Type Executed Work Items & Rates
                </h4>
                <p className="text-[11px] text-text-muted">Type the work done directly (e.g. Brickwork, Plastering, Steel tying), unit, rate & quantity.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWorkRow}
                className="text-xs h-7 px-3 gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-muted text-text-secondary border-b border-border uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[260px]">Work Item Description (Type Here)</th>
                    <th className="py-2.5 px-3 w-28 text-center">Unit / UOM</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-center">Quantity</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Remarks / Work Location</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {workRows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-primary/5 transition-colors">
                      <td className="py-2.5 px-3 text-center text-text-muted font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <Input
                          type="text"
                          value={row.item}
                          onChange={e => handleRowChange(idx, 'item', e.target.value)}
                          placeholder="e.g. Brickwork 9 inch, Plastering, Column casting..."
                          className="h-9 text-xs font-semibold w-full border-primary/30 focus:border-primary"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="relative">
                          <Input
                            type="text"
                            list={`uom-options-${idx}`}
                            value={row.unit}
                            onChange={e => handleRowChange(idx, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="h-9 text-xs text-center w-full font-medium"
                          />
                          <datalist id={`uom-options-${idx}`}>
                            {COMMON_UOMS.map(u => (
                              <option key={u} value={u} />
                            ))}
                          </datalist>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={row.rate}
                          onChange={e => handleRowChange(idx, 'rate', e.target.value)}
                          className="h-9 text-xs text-right w-full font-mono font-medium"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={row.qty}
                          onChange={e => handleRowChange(idx, 'qty', e.target.value)}
                          className="h-9 text-xs text-center font-bold border-2 border-primary/40 focus:border-primary w-full bg-primary/5 font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-text-primary font-mono text-xs">
                        ₹{(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <Input
                          type="text"
                          value={row.remarks}
                          onChange={e => handleRowChange(idx, 'remarks', e.target.value)}
                          placeholder="Optional notes or area..."
                          className="h-9 text-xs w-full text-text-secondary"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-muted/60 border-t-2 border-border font-bold text-xs">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right text-text-secondary uppercase">
                      Valid Work Items: <span className="text-text-primary font-mono">{workRows.filter(r => r.item && (parseFloat(r.qty) || 0) > 0).length}</span>
                    </td>
                    <td className="py-3 px-3 text-right uppercase text-text-secondary">
                      Grand Total Amount:
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700 font-mono text-sm">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Global Remarks & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="w-full sm:w-1/2">
                <Input
                  type="text"
                  placeholder="Additional global remarks for this sub work slip..."
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  className="w-full h-10 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddWorkRow}
                  className="text-xs h-10 gap-1.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Work Item
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmitAndGenerateSlip}
                  disabled={submitting || totalAmount <= 0}
                  className="text-xs h-10 px-6 gap-2 font-bold shadow-sm bg-primary hover:bg-primary/90 text-white"
                >
                  <Printer className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit & Generate Slip'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECORDED REGISTERS */}
      {activeTab === 'registers' && (
        <div className="bg-surface rounded-xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                Recorded Sub Work Slips ({filteredLogs.length})
              </h3>
              <p className="text-xs text-text-muted">All historical daily work slips for subcontractors</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-72">
              <Input
                type="text"
                placeholder="Search by slip no, contractor, site..."
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
                className="h-8 text-xs w-full"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <p className="text-xs">No daily sub work slips found.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-muted text-text-secondary border-b border-border uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Slip / Voucher No</th>
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Subcontractor Gang</th>
                    <th className="py-2.5 px-3">Work Summary</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-text-primary font-mono whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-primary font-semibold">
                        {log.ref_no || log.voucher_no || log.id}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {log.site_name || 'Site'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-text-primary">
                        {log.contractor_name}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary truncate max-w-[200px]">
                        {Array.isArray(log.trades) && log.trades.length > 0
                          ? log.trades.map(t => t.item).join(', ')
                          : (log.trade || 'Sub Work')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-text-primary font-mono">
                        ₹{(log.total_cost || log.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant={log.status === 'PAID' ? 'success' : log.status === 'APPROVED' ? 'primary' : 'warning'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {log.status || 'SUBMITTED'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printA5SlipFromItem({
                              site_name: log.site_name || 'Construction Site',
                              contractor_name: log.contractor_name,
                              trade: log.trade,
                              start_date: log.date,
                              end_date: log.date,
                              voucher_no: log.voucher_no || log.ref_no || log.id,
                              ref_no: log.ref_no || log.voucher_no || log.id,
                              trades: log.trades || [],
                              total_cost: log.total_cost || log.total_amount
                            })}
                            className="h-7 px-2 text-[11px] gap-1 font-semibold text-primary border-primary/30"
                            title="Print A5 Slip"
                          >
                            <Printer className="w-3 h-3" />
                            Print Slip
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateAndDownloadA5SlipFromItem({
                              site_name: log.site_name || 'Construction Site',
                              contractor_name: log.contractor_name,
                              trade: log.trade,
                              start_date: log.date,
                              end_date: log.date,
                              voucher_no: log.voucher_no || log.ref_no || log.id,
                              ref_no: log.ref_no || log.voucher_no || log.id,
                              trades: log.trades || [],
                              total_cost: log.total_cost || log.total_amount
                            })}
                            className="h-7 px-2 text-[11px] gap-1"
                            title="Download PDF Slip"
                          >
                            <Download className="w-3 h-3 text-text-secondary" />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${log.site_id}&contractor_id=${log.contractor_id}`)}
                            className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                          >
                            Weekly Payout
                            <ArrowRight className="w-3 h-3" />
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
      )}

      {/* Generated Slip Modal */}
      {generatedSlip && (
        <Modal
          isOpen={isSlipModalOpen}
          onClose={() => setIsSlipModalOpen(false)}
          title="Sub Work Slip Generated Successfully!"
        >
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Work slip <strong>{generatedSlip.ref_no}</strong> for <strong>{generatedSlip.contractor_name}</strong> has been created!
              </span>
            </div>

            <div className="bg-surface-muted/50 border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Voucher No:</span>
                <span className="font-mono font-bold text-text-primary">{generatedSlip.ref_no}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Site:</span>
                <span className="font-medium text-text-primary">{generatedSlip.site_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Subcontractor:</span>
                <span className="font-semibold text-text-primary">{generatedSlip.contractor_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Work Date:</span>
                <span className="font-mono text-text-primary">{generatedSlip.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Items Executed:</span>
                <span className="font-semibold text-text-primary">{generatedSlip.trades?.length || 0} items</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold">
                <span className="text-text-primary">Total Payable:</span>
                <span className="font-mono text-emerald-700">₹{(generatedSlip.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  generateAndDownloadA5SlipFromItem(generatedSlip);
                }}
                className="w-full sm:w-auto text-xs gap-1.5 h-9"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  printA5SlipFromItem(generatedSlip);
                }}
                className="w-full sm:w-auto text-xs gap-1.5 h-9 font-bold bg-primary hover:bg-primary/90 text-white"
              >
                <Printer className="w-4 h-4" />
                Print A5 Slip Now
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsSlipModalOpen(false)}
                className="w-full sm:w-auto text-xs h-9"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

export default DailySubWorkPage;
