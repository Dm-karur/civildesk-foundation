import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  UploadCloud, FileSpreadsheet, Download, CheckCircle2,
  AlertTriangle, XCircle, ArrowLeft, Layers, Sparkles, RefreshCw, Check
} from 'lucide-react';
import { boqApi, sitesApi } from '../../../api/apiservice';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { downloadBoqTemplate } from '../utils/boqExportUtils';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

export function BoqImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedBoqId = searchParams.get('boq_id');

  const fileInputRef = useRef(null);

  const [sites, setSites] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedBoqId, setSelectedBoqId] = useState(preSelectedBoqId || '');

  const [fileName, setFileName] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [validationStats, setValidationStats] = useState({ total: 0, valid: 0, errors: 0 });
  const [importing, setImporting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

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

      if (preSelectedBoqId) {
        const found = bList.find((b) => String(b.id) === String(preSelectedBoqId));
        if (found) {
          setSelectedBoqId(String(found.id));
          if (found.site_id) setSelectedSiteId(String(found.site_id));
        }
      } else if (sList.length > 0) {
        setSelectedSiteId(String(sList[0].id));
      }
    }).finally(() => {
      if (active) setLoadingInitial(false);
    });

    return () => { active = false; };
  }, [preSelectedBoqId]);

  // Filter BOQs by selected site
  const availableBoqs = boqs.filter((b) => {
    if (!selectedSiteId) return true;
    return String(b.site_id) === String(selectedSiteId);
  });

  // Handle file upload & parsing
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          toast.error('The uploaded file appears to be empty.');
          return;
        }

        // Standardize headers
        const parsed = rawJson.map((row, idx) => {
          // Normalize keys (lowercase, trim)
          const keys = Object.keys(row);
          const getVal = (pattern) => {
            const matchedKey = keys.find((k) => pattern.test(k.trim().toLowerCase()));
            return matchedKey ? row[matchedKey] : '';
          };

          const itemCode = String(getVal(/item\s*(no|code|#)/i) || `${idx + 1}.01`).trim();
          const section = String(getVal(/section|group|subhead/i) || 'General Works').trim();
          const description = String(getVal(/description|item\s*name|specification/i) || '').trim();
          const category = String(getVal(/category|trade/i) || 'Civil Works').trim();
          const unit = String(getVal(/unit|uom/i) || 'Nos').trim();
          const qty = Number(getVal(/qty|quantity|boq\s*qty/i)) || 0;
          const rate = Number(getVal(/rate|unit\s*rate|price/i)) || 0;
          const amount = qty * rate;

          let status = 'VALID';
          let errorMessage = '';

          if (!description) {
            status = 'ERROR';
            errorMessage = 'Missing description';
          } else if (qty <= 0) {
            status = 'WARNING';
            errorMessage = 'Zero or negative quantity';
          } else if (rate <= 0) {
            status = 'WARNING';
            errorMessage = 'Zero rate';
          }

          return {
            row_index: idx + 1,
            item_code: itemCode,
            section_name: section,
            item_name: description,
            work_category_name: category,
            unit_code: unit,
            quantity: qty,
            rate: rate,
            amount: amount,
            status,
            errorMessage,
          };
        });

        const validCount = parsed.filter((i) => i.status === 'VALID').length;
        const errorCount = parsed.filter((i) => i.status === 'ERROR').length;

        setParsedItems(parsed);
        setValidationStats({
          total: parsed.length,
          valid: validCount,
          errors: errorCount,
        });

        toast.success(`Parsed ${parsed.length} rows from ${file.name}`);
      } catch (err) {
        console.error('File parsing error:', err);
        toast.error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Submit Import
  const handleImportSubmit = async () => {
    if (!selectedBoqId) {
      toast.error('Please select a target BOQ to import into.');
      return;
    }
    if (parsedItems.length === 0) {
      toast.error('No items to import. Please upload a spreadsheet first.');
      return;
    }

    const validItemsToImport = parsedItems.filter((i) => i.status !== 'ERROR');
    if (validItemsToImport.length === 0) {
      toast.error('No valid items to import. Please resolve the errors in your spreadsheet.');
      return;
    }

    setImporting(true);
    try {
      await boqApi.importItems(selectedBoqId, {
        items: validItemsToImport.map((i) => ({
          item_code: i.item_code,
          item_name: i.item_name,
          section_name: i.section_name,
          unit_code: i.unit_code,
          quantity: i.quantity,
          rate: i.rate,
          amount: i.amount,
        })),
      });

      toast.success(`Successfully imported ${validItemsToImport.length} items into BOQ!`);
      navigate(`/boq/${selectedBoqId}`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error(err.message || 'Failed to import items into BOQ');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 max-w-[1400px] mx-auto w-full">
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
              Import Bill of Quantities (Excel / CSV)
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Upload an existing BOQ spreadsheet to bulk-create sections and items with one click.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={downloadBoqTemplate}
          className="text-xs flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" /> Download Sample Template
        </Button>
      </div>

      {/* Target Site & BOQ Selector Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
            1. Select Construction Site *
          </label>
          <Select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              setSelectedBoqId('');
            }}
            options={[
              { value: '', label: 'Choose a site...' },
              ...sites.map((s) => ({ value: String(s.id), label: `${s.site_name} (${s.site_code})` })),
            ]}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
            2. Select Target BOQ *
          </label>
          <Select
            value={selectedBoqId}
            onChange={(e) => setSelectedBoqId(e.target.value)}
            disabled={!selectedSiteId || availableBoqs.length === 0}
            options={[
              { value: '', label: availableBoqs.length === 0 ? 'No BOQs found for this site' : 'Choose target BOQ...' },
              ...availableBoqs.map((b) => ({ value: String(b.id), label: `${b.boq_name} (${b.boq_code}) — Rev ${b.revision_number || 0}` })),
            ]}
          />
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border hover:border-primary bg-surface hover:bg-surface-muted/30 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="mt-1">
          <span className="text-sm font-semibold text-text-primary block">
            {fileName ? fileName : 'Click or drag and drop your BOQ Excel / CSV file here'}
          </span>
          <span className="text-xs text-text-muted mt-0.5 block">
            Supports .xlsx, .xls, and .csv files. Columns: Item No, Section, Description, Category, Unit, Quantity, Rate
          </span>
        </div>
      </div>

      {/* Preview & Validation Table */}
      {parsedItems.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Validation Stats Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-primary">
                Preview ({validationStats.total} Rows)
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                {validationStats.valid} Ready
              </span>
              {validationStats.errors > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-rose-50 text-rose-700 border border-rose-200">
                  {validationStats.errors} Missing Info
                </span>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              disabled={importing || !selectedBoqId || validationStats.valid === 0}
              onClick={handleImportSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 self-end sm:self-auto"
            >
              <Check className="w-4 h-4" />
              {importing ? 'Importing...' : `Import ${validationStats.valid} Valid Items`}
            </Button>
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-surface-muted border-b border-border text-[11px] font-bold text-text-secondary uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Row</th>
                    <th className="py-2.5 px-3 w-28">Item Code</th>
                    <th className="py-2.5 px-3 w-36">Section</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
                    <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedItems.map((item) => (
                    <tr
                      key={item.row_index}
                      className={`hover:bg-surface-muted/30 transition-colors ${
                        item.status === 'ERROR' ? 'bg-rose-50/40' : item.status === 'WARNING' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-mono text-text-muted">{item.row_index}</td>
                      <td className="py-2 px-3 font-mono font-medium text-text-primary">{item.item_code}</td>
                      <td className="py-2 px-3 text-text-secondary truncate max-w-[140px]">{item.section_name}</td>
                      <td className="py-2 px-3 text-text-primary font-medium">{item.item_name || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 bg-surface-muted text-text-secondary rounded text-[10px]">
                          {item.unit_code}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.rate)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">{formatCurrency(item.amount)}</td>
                      <td className="py-2 px-3 text-center">
                        {item.status === 'VALID' ? (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Valid
                          </span>
                        ) : item.status === 'WARNING' ? (
                          <span className="text-[10px] text-amber-700 font-semibold flex items-center justify-center gap-1" title={item.errorMessage}>
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> {item.errorMessage}
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 font-semibold flex items-center justify-center gap-1" title={item.errorMessage}>
                            <XCircle className="w-3 h-3 text-rose-500" /> {item.errorMessage}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
