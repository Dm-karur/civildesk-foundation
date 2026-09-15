import { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { boqApi } from '../../../api/apiservice';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { useAuth } from '../../auth/context/AuthContext';

function SectionRow({ section, boqId, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const toggleExpand = () => {
    if (!expanded && items.length === 0) {
      setLoadingItems(true);
      boqApi.items.list(boqId, { section_id: section.id })
        .then((res) => setItems(res?.data?.items ?? res?.items ?? res?.data?.data ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoadingItems(false));
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <tr className="hover:bg-surface-muted/30 transition-colors cursor-pointer" onClick={toggleExpand}>
        <td className="px-3 py-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
        </td>
        <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">{section.section_code || '—'}</td>
        <td className="px-3 py-2 font-medium text-text-primary text-[12px]" colSpan="3">{section.section_name || section.name || '—'}</td>
        <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
          ₹{Number(section.total_amount || 0).toLocaleString('en-IN')}
        </td>
        <td className="px-3 py-2 text-center text-text-secondary text-[11px]">{section.item_count ?? '—'}</td>
      </tr>
      {expanded && (
        loadingItems ? (
          <tr><td colSpan="7" className="pl-12 py-3 text-text-muted text-[11px]">Loading items...</td></tr>
        ) : items.length === 0 ? (
          <tr><td colSpan="7" className="pl-12 py-3 text-text-muted text-[11px]">No items in this section.</td></tr>
        ) : (
          items.map((item, idx) => (
            <tr key={item.id || idx} className="bg-surface-subtle/50 hover:bg-surface-muted/20">
              <td className="px-3 py-1.5"></td>
              <td className="px-3 py-1.5 pl-8 font-mono text-text-secondary text-[10px]">{item.item_code || '—'}</td>
              <td className="px-3 py-1.5 text-text-primary text-[11px]">{item.item_name || item.description || '—'}</td>
              <td className="px-3 py-1.5 text-text-secondary text-[11px] text-right">{item.quantity ?? '—'} {item.unit_name || item.unit || ''}</td>
              <td className="px-3 py-1.5 text-text-secondary text-[11px] text-right">₹{Number(item.rate || 0).toLocaleString('en-IN')}</td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-text-primary text-[11px]">
                ₹{Number(item.amount || (item.quantity * item.rate) || 0).toLocaleString('en-IN')}
              </td>
              <td className="px-3 py-1.5"></td>
            </tr>
          ))
        )
      )}
    </>
  );
}

export function BoqDetailModal({ isOpen, boq, onClose }) {
  const { hasPermission } = useAuth();
  const [detail, setDetail] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isOpen || !boq?.id) return;
    setLoading(true);
    Promise.all([
      boqApi.get(boq.id),
      boqApi.sections.list(boq.id),
    ])
      .then(([detailRes, sectionsRes]) => {
        setDetail(detailRes?.data?.project_boq ?? detailRes?.data ?? detailRes);
        setSections(sectionsRes?.data?.sections ?? sectionsRes?.sections ?? sectionsRes?.data?.data ?? []);
      })
      .catch(() => { setDetail(boq); setSections([]); })
      .finally(() => setLoading(false));
  }, [isOpen, boq?.id, refreshKey]);

  if (!isOpen || !boq) return null;

  const d = detail || boq;
  const status = d.status_name || d.status || 'Draft';
  const getVariant = (s) => {
    const v = String(s).toLowerCase();
    if (v.includes('approved')) return 'success';
    if (v.includes('submitted')) return 'warning';
    if (v.includes('rejected')) return 'error';
    return 'neutral';
  };

  const handleAction = async (actionName) => {
    try {
      await boqApi[actionName](boq.id, {});
      toast.success(`BOQ ${actionName}ed.`);
      setRefreshKey((v) => v + 1);
    } catch (err) {
      toast.error(err?.message || `Failed to ${actionName}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-surface-muted/30 shrink-0">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">{d.boq_name || d.name || 'BOQ Detail'}</h2>
                <Badge variant={getVariant(status)} className="text-[8px] font-bold uppercase">{status}</Badge>
              </div>
              <p className="text-xs text-text-secondary mt-1">{d.boq_code || d.code} · {d.project_name || 'Project'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {String(status).toLowerCase().includes('draft') && hasPermission('boq.submit') && (
              <Button variant="primary" size="sm" className="h-8 text-[12px]" onClick={() => handleAction('submit')}>Submit</Button>
            )}
            {String(status).toLowerCase().includes('submitted') && hasPermission('boq.approve') && (
              <>
                <Button variant="primary" size="sm" className="h-8 text-[12px]" onClick={() => handleAction('approve')}>Approve</Button>
                <Button variant="outline" size="sm" className="h-8 text-[12px] text-error border-error/30" onClick={() => handleAction('reject')}>Reject</Button>
              </>
            )}
            <button type="button" onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-border bg-surface">
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Sections</div><div className="text-lg font-bold text-text-primary">{sections.length}</div></div>
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Total Items</div><div className="text-lg font-bold text-text-primary">{d.item_count ?? '—'}</div></div>
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Grand Total</div><div className="text-lg font-bold text-text-primary">₹{Number(d.total_amount || d.grand_total || 0).toLocaleString('en-IN')}</div></div>
          <div><div className="text-[10px] text-text-secondary uppercase font-semibold">Created</div><div className="text-lg font-bold text-text-primary">{d.created_at ? d.created_at.split(' ')[0] : '—'}</div></div>
        </div>

        {/* Sections & Items */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-text-muted text-[12px]">Loading BOQ details...</div>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider sticky top-0">
                <tr>
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2 w-24">Code</th>
                  <th className="px-3 py-2">Name / Description</th>
                  <th className="px-3 py-2 w-24 text-right">Qty</th>
                  <th className="px-3 py-2 w-24 text-right">Rate</th>
                  <th className="px-3 py-2 w-28 text-right">Amount</th>
                  <th className="px-3 py-2 w-16 text-center">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-6 text-text-muted">No sections in this BOQ.</td></tr>
                ) : (
                  sections.map((section) => (
                    <SectionRow key={section.id} section={section} boqId={boq.id} onRefresh={() => setRefreshKey((v) => v + 1)} />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
