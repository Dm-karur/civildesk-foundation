import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Search, ExternalLink, FileSpreadsheet, Package } from 'lucide-react';
import { boqApi } from '../../../../api/apiservice';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { SearchField } from '../../../../components/composite/SearchField';
import { BoqFormModal } from '../../../boq/components/BoqFormModal';

export function SiteBoqTab({ site }) {
  const navigate = useNavigate();
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoq, setSelectedBoq] = useState(null);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadSiteBoqs = () => {
    if (!site?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Fetch site BOQs using site_id
    boqApi.list({ site_id: site.id })
      .then((res) => {
        const list = res?.data?.project_boqs ?? res?.project_boqs ?? (Array.isArray(res?.data) ? res.data : []);
        setBoqs(list);
        if (list.length > 0) {
          setSelectedBoq(list[0]);
          loadBoqDetails(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSiteBoqs();
  }, [site?.id]);

  const loadBoqDetails = (boqId) => {
    Promise.all([
      boqApi.sections.list(boqId).catch(() => ({ data: [] })),
      boqApi.items.list(boqId).catch(() => ({ data: [] })),
    ]).then(([secRes, itemRes]) => {
      const secList = secRes?.data?.sections ?? secRes?.sections ?? (Array.isArray(secRes?.data) ? secRes.data : []);
      const itmList = itemRes?.data?.items ?? itemRes?.items ?? (Array.isArray(itemRes?.data) ? itemRes.data : []);
      setSections(secList);
      setItems(itmList);
    }).finally(() => setLoading(false));
  };

  const handleBoqChange = (boqId) => {
    const found = boqs.find((b) => String(b.id) === String(boqId));
    if (found) {
      setSelectedBoq(found);
      setLoading(true);
      loadBoqDetails(found.id);
    }
  };

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      const code = (item.item_code || '').toLowerCase();
      const desc = (item.item_name || item.item_description || item.description || '').toLowerCase();
      if (!code.includes(q) && !desc.includes(q)) return false;
    }
    if (selectedSection !== 'all' && String(item.section_id) !== String(selectedSection)) {
      return false;
    }
    return true;
  });

  const totalBudget = items.reduce((sum, i) => sum + Number(i.amount || (Number(i.quantity || 0) * Number(i.rate || 0))), 0);
  const totalCompleted = items.reduce((sum, i) => sum + (Number(i.executed_quantity || 0) * Number(i.rate || 0)), 0);
  const progressPct = totalBudget > 0 ? Math.round((totalCompleted / totalBudget) * 100) : 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(val) || 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top BOQ Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface border border-border rounded-xl p-3.5 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">BOQ Total Value</span>
          <span className="text-base sm:text-lg font-bold font-mono text-primary">{formatCurrency(totalBudget || site.contract_value || 0)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Completed Value</span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-600">{formatCurrency(totalCompleted)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Balance Value</span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-600">{formatCurrency(Math.max(0, (totalBudget || site.contract_value || 0) - totalCompleted))}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Total BOQ Items</span>
          <span className="text-base sm:text-lg font-bold font-mono text-text-primary">{items.length} Items</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {boqs.length > 1 && (
            <select
              value={selectedBoq?.id || ''}
              onChange={(e) => handleBoqChange(e.target.value)}
              className="h-8 px-2 text-xs font-semibold rounded border border-border bg-surface text-text-primary"
            >
              {boqs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.boq_name} ({b.boq_code})
                </option>
              ))}
            </select>
          )}

          <div className="w-full sm:w-56">
            <SearchField
              placeholder="Search item code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {sections.length > 0 && (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-8 px-2 text-xs rounded border border-border bg-surface text-text-primary"
            >
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.section_name || s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedBoq && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/boq/${selectedBoq.id}`)}
              className="text-xs flex items-center gap-1 text-primary border-primary/30 hover:bg-primary/5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Full BOQ
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create BOQ
          </Button>
        </div>
      </div>

      {/* BOQ Items Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-24">Item Code</th>
                <th className="px-3 py-2.5">Item Description</th>
                <th className="px-3 py-2.5 w-16 text-center">UOM</th>
                <th className="px-3 py-2.5 w-24 text-right">BOQ Qty</th>
                <th className="px-3 py-2.5 w-24 text-right">Rate (₹)</th>
                <th className="px-3 py-2.5 w-28 text-right">Budget Amount</th>
                <th className="px-3 py-2.5 w-24 text-right">Completed</th>
                <th className="px-3 py-2.5 w-24 text-right">Balance</th>
                <th className="px-3 py-2.5 w-24 text-center">Progress %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-8 text-text-muted">Loading Site BOQ schedule...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-text-muted">
                    <Package className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                    No BOQ line items recorded for this site yet.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const qty = Number(item.quantity || 0);
                  const rate = Number(item.rate || item.unit_rate || 0);
                  const amount = Number(item.amount || (qty * rate));
                  const compQty = Number(item.executed_quantity || 0);
                  const balQty = Math.max(0, qty - compQty);
                  const pPct = qty > 0 ? Math.min(100, Math.round((compQty / qty) * 100)) : 0;

                  return (
                    <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-3 py-2 text-center text-text-muted font-mono">{index + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-primary">{item.item_code || `ITM-${index + 1}`}</td>
                      <td className="px-3 py-2 font-medium text-text-primary">{item.item_name || item.item_description || item.description}</td>
                      <td className="px-3 py-2 text-center text-text-secondary font-mono">{item.unit_code || item.uom_name || 'Nos'}</td>
                      <td className="px-3 py-2 text-right font-mono text-text-primary">{qty.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-mono text-text-secondary">{rate.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary">{formatCurrency(amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600 font-medium">{compQty.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-600">{balQty.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${pPct}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-text-muted font-semibold">{pPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <BoqFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          setIsCreateOpen(false);
          loadSiteBoqs();
        }}
        preselectedSiteId={site?.id}
      />
    </div>
  );
}
