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
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { toast } from '../../../../components/composite/Toast';
import { subcontractsApi, subWorkApi } from '../../../../api/apiservice';
import { generateAndDownloadA5SlipFromItem, printA5SlipFromItem } from '../../../subcontracts/utils/a5SlipExportUtils';

const COMMON_UOMS = ['Sq.ft', 'Cu.m', 'Rft', 'Nos', 'Shifts', 'Brass', 'Days', 'Trips', 'Kg', 'Bags', 'Ton'];

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

const DEFAULT_CONTRACTORS = [
  { id: '1', contractor_name: 'Apex Concrete Gang', trade: 'Civil & RCC Works', contact_phone: '9988776655' },
  { id: '2', contractor_name: 'Shree Balaji Shuttering', trade: 'Formwork & Shuttering', contact_phone: '9988776656' },
  { id: '3', contractor_name: 'Sterling Electricals & MEP', trade: 'Electrical & Plumbing', contact_phone: '9988776657' },
  { id: '4', contractor_name: 'Premier Structural Steel', trade: 'Steel Fabrication & Erection', contact_phone: '9988776658' },
];

const createEmptyWorkRow = (order = 1) => ({
  id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  order,
  item: '', // User fully types description
  classification: 'Manpower',
  unit: 'Sq.ft',
  rate: '',
  qty: '',
  amount: 0,
  remarks: '',
});

export function SiteSubWorkTab({ site }) {
  const navigate = useNavigate();
  
  // Date & Contractor Selection
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contractors, setContractors] = useState(DEFAULT_CONTRACTORS);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Fully Typed Work Items (NO template loaded)
  const [workRows, setWorkRows] = useState([createEmptyWorkRow(1), createEmptyWorkRow(2)]);
  const [locationGrid, setLocationGrid] = useState('');
  const [foremanIncharge, setForemanIncharge] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Submitted Daily Subcontractor Logs
  const [subconDailyLogs, setSubconDailyLogs] = useState([]);
  const [searchLog, setSearchLog] = useState('');

  // Generated Slip Modal
  const [generatedSlip, setGeneratedSlip] = useState(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Load Subcontractors & Daily Logs
  useEffect(() => {
    if (!site?.id) return;
    loadContractorsAndLogs();
  }, [site?.id]);

  const loadContractorsAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch Contractors from Subcontractors Master
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

      if (loadedContractors.length === 0) {
        loadedContractors = DEFAULT_CONTRACTORS;
      }

      setContractors(loadedContractors);

      // 2. Load Persisted Daily Subcontractor Logs
      const storageKey = `site_${site.id}_subcon_daily_logs`;
      const rawStored = localStorage.getItem(storageKey);
      let logs = [];
      if (rawStored) {
        try { logs = JSON.parse(rawStored); } catch {}
      }

      // Also try fetching from API
      try {
        const apiRes = await subWorkApi.list({ site_id: site.id });
        const apiRegs = apiRes?.data?.registers || apiRes?.data?.daily_wages || [];
        if (Array.isArray(apiRegs) && apiRegs.length > 0) {
          const apiLogs = apiRegs.map(reg => ({
            id: `dwr-${reg.id}`,
            date: reg.wage_date,
            contractor_id: String(reg.subcontractor_id),
            contractor_name: reg.subcontractor_name || 'Subcontractor Gang',
            trade: reg.contractor_trade || 'General Works',
            location: reg.global_remarks || 'Site Work',
            foreman: 'Site Engineer',
            status: reg.status || 'SUBMITTED',
            trades: (reg.lines || []).map((l, idx) => ({
              order: idx + 1,
              item: l.description,
              classification: (l.classification || 'manpower').toLowerCase(),
              unit: l.uom || 'shift',
              qty: Number(l.quantity) || 0,
              rate: Number(l.rate) || 0,
              amount: Number(l.amount) || 0,
              remarks: l.remarks || ''
            })),
            total_workers: Number(reg.total_mandays) || 1,
            total_cost: Number(reg.total_amount) || 0,
            submitted_at: reg.created_at || new Date().toLocaleTimeString(),
          }));
          logs = [...apiLogs, ...logs.filter(l => !l.id.startsWith('dwr-'))];
        }
      } catch {}

      if (logs.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        logs = [
          {
            id: 'log-101',
            date: todayStr,
            contractor_id: '1',
            contractor_name: 'Apex Concrete Gang',
            trade: 'Civil & RCC Works',
            location: 'Tower A - 3rd Floor Slab',
            foreman: 'M. Selvam',
            status: 'SUBMITTED',
            trades: [
              { order: 1, item: 'Brickwork 9 inch in CM 1:5', classification: 'work', unit: 'Sq.ft', qty: 240, rate: 38, amount: 9120, remarks: 'Outer walls' },
              { order: 2, item: 'Plastering 12mm Internal', classification: 'work', unit: 'Sq.ft', qty: 180, rate: 22, amount: 3960, remarks: 'Flat 302' },
            ],
            total_workers: 8,
            total_cost: 13080,
            submitted_at: new Date().toLocaleTimeString(),
          },
        ];
        localStorage.setItem(storageKey, JSON.stringify(logs));
      }

      setSubconDailyLogs(logs);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load sub work data.');
    } finally {
      setLoading(false);
    }
  };

  // When Subcontractor is selected: DO NOT load templates! Fully typed mode!
  const handleSelectContractor = (contractorId) => {
    setSelectedContractorId(contractorId);
    // Reset to clean typed rows ready for user input
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

  const totalCost = useMemo(() => {
    return workRows.reduce((acc, row) => acc + (parseFloat(row.amount) || 0), 0);
  }, [workRows]);

  const handleSubmitAndGenerateSlip = async () => {
    if (!selectedContractorId) {
      toast.warning('Please select a subcontractor gang first.');
      return;
    }

    const filledRows = workRows.filter(r => r.item && r.item.trim() !== '' && (parseFloat(r.qty) || 0) > 0);
    if (filledRows.length === 0) {
      toast.warning('Please type a work description and enter quantity for at least one item.');
      return;
    }

    const con = contractors.find(c => String(c.id) === String(selectedContractorId));
    setSubmitting(true);

    try {
      // 1. Send to Backend Database API
      const payload = {
        site_id: parseInt(site.id, 10),
        subcontractor_id: parseInt(selectedContractorId, 10),
        wage_date: selectedDate,
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

      // 2. Persist locally for instant offline UI
      const slipRefNo = dbRecordId ? `SWP-${dbRecordId}` : `SWP-${Date.now().toString().slice(-6)}`;
      const newLog = {
        id: dbRecordId ? `dwr-${dbRecordId}` : `log-${Date.now()}`,
        ref_no: slipRefNo,
        voucher_no: slipRefNo,
        date: selectedDate,
        start_date: selectedDate,
        end_date: selectedDate,
        site_id: site.id,
        site_name: site.site_name,
        contractor_id: selectedContractorId,
        contractor_name: con?.contractor_name || 'Subcontractor',
        trade: con?.trade || 'Civil Works',
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
        total_cost: totalCost,
        submitted_at: new Date().toLocaleTimeString(),
        status: 'SUBMITTED',
      };

      const storageKey = `site_${site.id}_subcon_daily_logs`;
      const updatedLogs = [newLog, ...subconDailyLogs];
      setSubconDailyLogs(updatedLogs);
      localStorage.setItem(storageKey, JSON.stringify(updatedLogs));

      // 3. Mirror in Global logs for Weekly Payments / Slips
      const existingGlobal = JSON.parse(localStorage.getItem('global_subcon_daily_logs') || '[]');
      localStorage.setItem('global_subcon_daily_logs', JSON.stringify([newLog, ...existingGlobal]));

      // 4. Save in mock_maistry_slips so A5 slip print immediately finds it
      try {
        const existingSlips = JSON.parse(localStorage.getItem('mock_maistry_slips') || '[]');
        localStorage.setItem('mock_maistry_slips', JSON.stringify([newLog, ...existingSlips]));
      } catch {}

      toast.success(dbSuccess ? 'Sub Work submitted & slip generated!' : 'Sub Work saved locally & slip generated!');

      // 5. Open Slip Modal for Immediate Printing/Downloading
      setGeneratedSlip(newLog);
      setIsSlipModalOpen(true);

      // Reset form fields
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
    return subconDailyLogs.filter(log => {
      const q = searchLog.toLowerCase().trim();
      if (!q) return true;
      return (
        String(log.contractor_name || '').toLowerCase().includes(q) ||
        String(log.trade || '').toLowerCase().includes(q) ||
        String(log.location || '').toLowerCase().includes(q) ||
        String(log.date || '').includes(q)
      );
    });
  }, [subconDailyLogs, searchLog]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              Sub Work Entry
              <Badge variant="primary" className="text-[10px]">Fully-Typed Mode</Badge>
            </h2>
            <p className="text-xs text-text-secondary">
              Select subcontractor, type work items directly (no template preloaded), submit, and generate work slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/subcontracts/daily-wages')}
            className="text-xs gap-1.5 h-8 font-medium text-slate-700 hover:text-slate-900 border-slate-300"
            title="Use preloaded trade templates (Mason, Helper...)"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Template Mode (Daily Wages)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${site.id}`)}
            className="text-xs gap-1.5 h-8 font-medium text-emerald-700 hover:text-emerald-800 border-emerald-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Weekly Slips & Payouts
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

      {/* Main Entry Card */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-text-primary">1. Select Subcontractor & Work Information</h3>
            <p className="text-xs text-text-muted">Choose the subcontractor or gang working at {site.site_name}</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Site: {site.site_name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="WORK DATE" required>
            <div className="relative">
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full pl-9 h-10 text-xs font-medium"
              />
              <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </FormField>

          <FormField label="SUBCONTRACTOR GANG" required>
            <Select
              value={selectedContractorId}
              onChange={e => handleSelectContractor(e.target.value)}
              className="w-full h-10 text-xs font-semibold border-primary/40 focus:border-primary"
            >
              <option value="">-- Choose Subcontractor --</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.contractor_name} ({c.trade || 'General Works'})
                </option>
              ))}
            </Select>
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

          <FormField label="SUPERVISOR / FOREMAN">
            <Input
              type="text"
              placeholder="e.g. Selvam / Site Incharge"
              value={foremanIncharge}
              onChange={e => setForemanIncharge(e.target.value)}
              className="w-full h-10 text-xs"
            />
          </FormField>
        </div>

        {/* Selected Contractor Indicator */}
        {selectedContractorId && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-primary shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">
                {contractors.find(c => String(c.id) === String(selectedContractorId))?.contractor_name}
              </span>
              <span>•</span>
              <span>Trade: {contractors.find(c => String(c.id) === String(selectedContractorId))?.trade}</span>
              <span>•</span>
              <span className="bg-primary/10 px-2 py-0.5 rounded font-medium">Fully Typed Entry</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddWorkRow}
              className="text-xs h-7 gap-1 font-medium bg-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Work Row
            </Button>
          </div>
        )}

        {/* Work Items Table (Fully Typed) */}
        {selectedContractorId ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  2. Type Work Items & Quantities Executed
                </h4>
                <p className="text-[11px] text-text-muted">Type work description, choose unit, input rate & quantity.</p>
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
                    <th className="py-2.5 px-3 min-w-[240px]">Work Item Description (Type Here)</th>
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
                      Total Work Items: <span className="text-text-primary font-mono">{workRows.filter(r => r.item && (parseFloat(r.qty) || 0) > 0).length}</span>
                    </td>
                    <td className="py-3 px-3 text-right uppercase text-text-secondary">
                      Grand Total Amount:
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700 font-mono text-sm">
                      ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Global Remarks & Submit & Generate Slip */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="w-full sm:w-1/2">
                <Input
                  type="text"
                  placeholder="Additional global notes for this work slip..."
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
                  disabled={submitting || totalCost <= 0}
                  className="text-xs h-10 px-6 gap-2 font-bold shadow-sm bg-primary hover:bg-primary/90 text-white"
                >
                  <Printer className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit & Generate Slip'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-text-muted bg-surface-muted/30 rounded-lg border border-dashed border-border">
            <HardHat className="w-9 h-9 mx-auto mb-2 text-text-muted opacity-60" />
            <p className="text-xs font-semibold text-text-secondary">Select a subcontractor gang above to start typing work entries.</p>
            <p className="text-[11px] text-text-muted mt-0.5">In Sub Work, you type the items directly without loading any trade template.</p>
          </div>
        )}
      </div>

      {/* Recorded Sub Work Logs History */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              Recorded Sub Work Slips ({filteredLogs.length})
            </h3>
            <p className="text-xs text-text-muted">Work slips recorded for subcontractors at {site.site_name}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72">
            <Input
              type="text"
              placeholder="Search by contractor, date, work..."
              value={searchLog}
              onChange={e => setSearchLog(e.target.value)}
              className="h-8 text-xs w-full"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <p className="text-xs">No daily sub work slips found for this search.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-muted text-text-secondary border-b border-border uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher / Slip No</th>
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
                            site_name: site.site_name,
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
                            site_name: site.site_name,
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
                          onClick={() => navigate(`/subcontracts/weekly-payments?site_id=${site.id}&contractor_id=${log.contractor_id}`)}
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
                Work slip <strong>{generatedSlip.ref_no}</strong> for <strong>{generatedSlip.contractor_name}</strong> has been created and saved!
              </span>
            </div>

            <div className="bg-surface-muted/50 border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-secondary">Voucher No:</span>
                <span className="font-mono font-bold text-text-primary">{generatedSlip.ref_no}</span>
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
    </div>
  );
}

export default SiteSubWorkTab;
