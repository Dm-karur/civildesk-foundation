import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  FileDown,
  FileText,
  Copy,
  GitBranch,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { boqApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';
import { exportBoqToExcel, exportBoqToPdf } from '../utils/boqExportUtils';

function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data?.project_boqs)) return response.data.project_boqs;
  if (Array.isArray(response.project_boqs)) return response.project_boqs;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

const getStatusVariant = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('approved')) return 'success';
  if (s.includes('review') || s.includes('submitted') || s.includes('pending')) return 'warning';
  if (s.includes('rejected')) return 'error';
  return 'neutral';
};

export function BoqTable({ searchQuery = '', refreshKey = 0, onEdit, filters, onAction, onOpenRevision }) {
  const navigate = useNavigate();
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters?.site_id && filters.site_id !== 'all') {
      params.site_id = filters.site_id;
    }
    boqApi.list(params)
      .then((res) => setBoqs(extractList(res)))
      .catch(() => setBoqs([]))
      .finally(() => setLoading(false));
  }, [refreshKey, filters?.site_id]);

  const filtered = useMemo(() => {
    return boqs.filter((boq) => {
      if (filters?.site_id && filters.site_id !== 'all') {
        if (String(boq.site_id) !== String(filters.site_id)) return false;
      }
      if (filters?.status && filters.status !== 'all') {
        const s = String(boq.status_name || boq.status || boq.status_code || '').toLowerCase();
        if (!s.includes(filters.status.toLowerCase())) return false;
      }
      if (filters?.progress && filters.progress !== 'all') {
        const total = Number(boq.total_amount || 0);
        const exec = Number(boq.executed_amount || 0);
        const pct = total > 0 ? (exec / total) * 100 : 0;
        if (filters.progress === '0-25' && (pct < 0 || pct > 25)) return false;
        if (filters.progress === '26-50' && (pct <= 25 || pct > 50)) return false;
        if (filters.progress === '51-75' && (pct <= 50 || pct > 75)) return false;
        if (filters.progress === '76-100' && (pct <= 75 || pct > 100)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (boq.boq_name || boq.name || '').toLowerCase();
        const code = (boq.boq_code || boq.code || '').toLowerCase();
        const site = (boq.site_name || '').toLowerCase();
        const siteCode = (boq.site_code || '').toLowerCase();
        const client = (boq.client_name || '').toLowerCase();
        if (
          !name.includes(q) &&
          !code.includes(q) &&
          !site.includes(q) &&
          !siteCode.includes(q) &&
          !client.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [boqs, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAction = async (id, actionName) => {
    try {
      if (typeof boqApi[actionName] === 'function') {
        await boqApi[actionName](id, {});
      } else {
        await boqApi.update(id, { action: actionName });
      }
      toast.success(`BOQ status updated to ${actionName}.`);
      onAction?.();
    } catch (error) {
      toast.error(error?.message || `Failed to update BOQ.`);
    }
  };

  const handleDuplicate = async (boq) => {
    try {
      const payload = {
        site_id: boq.site_id,
        boq_name: `${boq.boq_name || boq.name} (Copy)`,
        notes: boq.notes || '',
        boq_date: new Date().toISOString().substring(0, 10),
      };
      await boqApi.create(payload);
      toast.success('BOQ duplicated successfully.');
      onAction?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to duplicate BOQ.');
    }
  };

  const handleExportExcel = async (boq) => {
    try {
      toast.info('Preparing Excel download...');
      const [secRes, itemRes] = await Promise.all([
        boqApi.sections.list(boq.id).catch(() => ({ data: [] })),
        boqApi.items.list(boq.id).catch(() => ({ data: [] })),
      ]);
      const sections = secRes?.data?.boq_sections ?? secRes?.data ?? [];
      const items = itemRes?.data?.boq_items ?? itemRes?.data ?? [];
      exportBoqToExcel(boq, items, sections);
      toast.success('Excel downloaded.');
    } catch (e) {
      toast.error('Export failed.');
    }
  };

  const handleExportPdf = async (boq) => {
    try {
      toast.info('Generating PDF document...');
      const [secRes, itemRes] = await Promise.all([
        boqApi.sections.list(boq.id).catch(() => ({ data: [] })),
        boqApi.items.list(boq.id).catch(() => ({ data: [] })),
      ]);
      const sections = secRes?.data?.boq_sections ?? secRes?.data ?? [];
      const items = itemRes?.data?.boq_items ?? itemRes?.data ?? [];
      exportBoqToPdf(boq, items, sections);
    } catch (e) {
      toast.error('PDF export failed.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await boqApi.remove(deleteTarget.id);
      toast.success('BOQ removed successfully.');
      onAction?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete BOQ.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block">
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          }
        >
          <table className="w-full text-left text-[12px] table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 w-28">BOQ Code</th>
                <th className="px-3 py-2">BOQ Name</th>
                <th className="px-3 py-2">Site</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2 text-right w-28">Total Value</th>
                <th className="px-3 py-2 text-right w-28">Executed Value</th>
                <th className="px-3 py-2 text-center w-24">Progress</th>
                <th className="px-3 py-2 text-center w-24">Status</th>
                <th className="px-3 py-2 text-center w-24">Updated</th>
                <th className="px-3 py-2 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-text-muted text-[12px]">
                    Loading BOQ register...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-text-muted text-[12px]">
                    No BOQs found matching criteria.
                  </td>
                </tr>
              ) : (
                paged.map((boq, index) => {
                  const status = boq.status_name || boq.status || 'Draft';
                  const total = Number(boq.total_amount || 0);
                  const executed = Number(boq.executed_amount || 0);
                  const progressPct = total > 0 ? Math.min(100, Math.round((executed / total) * 100)) : 0;
                  const isDraft = String(status).toLowerCase().includes('draft');
                  const isApproved = String(status).toLowerCase().includes('approved');
                  const isSubmitted = String(status).toLowerCase().includes('submitted');

                  return (
                    <tr
                      key={boq.id || index}
                      className="hover:bg-surface-muted/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/boq/${boq.id}`)}
                    >
                      <td className="px-3 py-2 text-center font-medium text-text-secondary text-[11px]">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-primary text-[11px]">
                        {boq.boq_code || boq.code || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block max-w-xs" title={boq.boq_name || boq.name}>
                          {boq.boq_name || boq.name || '—'}
                        </span>
                        {boq.revision_no > 0 && (
                          <span className="text-[10px] text-text-muted font-mono">
                            Rev {boq.revision_no}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0 max-w-[160px]">
                          <span className="text-text-primary text-[11px] font-medium truncate" title={boq.site_name}>
                            {boq.site_name || 'Primary Site'}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {boq.site_code || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-text-secondary text-[11px] truncate block max-w-[140px]" title={boq.client_name}>
                          {boq.client_name || 'Standard Client'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600 font-semibold text-[11px]">
                        ₹{executed.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-text-secondary font-semibold">{progressPct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center text-text-muted text-[10px] font-mono">
                        {boq.updated_at ? boq.updated_at.substring(0, 10) : boq.boq_date?.substring(0, 10) || '—'}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          {/* View */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Open BOQ Details"
                            onClick={() => navigate(`/boq/${boq.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>

                          {/* Edit (Draft only) */}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Basic Details"
                              onClick={() => onEdit?.(boq)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}

                          {/* Submit for Approval */}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Submit for Approval"
                              onClick={() => handleAction(boq.id, 'submit')}
                            >
                              <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />
                            </Button>
                          )}

                          {/* Approve (Submitted only) */}
                          {isSubmitted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Approve BOQ"
                              onClick={() => handleAction(boq.id, 'approve')}
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-text-secondary hover:text-emerald-500" />
                            </Button>
                          )}

                          {/* Revision (Approved only) */}
                          {isApproved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Create New Revision"
                              onClick={() => onOpenRevision?.(boq)}
                            >
                              <GitBranch className="w-3.5 h-3.5 text-text-secondary hover:text-amber-500" />
                            </Button>
                          )}

                          {/* Export Excel */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Export Excel"
                            onClick={() => handleExportExcel(boq)}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-text-secondary hover:text-emerald-600" />
                          </Button>

                          {/* Export PDF */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Export PDF"
                            onClick={() => handleExportPdf(boq)}
                          >
                            <FileDown className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>

                          {/* Duplicate */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Duplicate BOQ"
                            onClick={() => handleDuplicate(boq)}
                          >
                            <Copy className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary" />
                          </Button>

                          {/* Delete (Draft only) */}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteTarget(boq)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* Mobile View - Card List for Phones (< sm) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading BOQ items...
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No BOQs found matching criteria.
          </div>
        ) : (
          paged.map((boq, index) => {
            const status = boq.status_name || boq.status || 'Draft';
            const total = Number(boq.total_amount || 0);
            const executed = Number(boq.executed_amount || 0);
            const balance = Math.max(0, total - executed);
            const progressPct = total > 0 ? Math.min(100, Math.round((executed / total) * 100)) : 0;

            return (
              <div
                key={boq.id || index}
                className="bg-surface border border-border rounded-lg p-3.5 shadow-2xs space-y-2.5 cursor-pointer"
                onClick={() => navigate(`/boq/${boq.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{boq.boq_code}</span>
                    <h3 className="font-semibold text-text-primary text-sm mt-0.5">{boq.boq_name}</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">{boq.site_name} · {boq.client_name}</p>
                  </div>
                  <Badge variant={getStatusVariant(status)} className="text-[8px] font-bold uppercase">
                    {status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-surface-subtle p-2 rounded-md text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-text-muted uppercase block">Total</span>
                    <span className="font-semibold text-text-primary">₹{(total / 100000).toFixed(1)} L</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted uppercase block">Executed</span>
                    <span className="font-semibold text-emerald-600">₹{(executed / 100000).toFixed(1)} L</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted uppercase block">Balance</span>
                    <span className="font-semibold text-amber-600">₹{(balance / 100000).toFixed(1)} L</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-text-secondary mb-1">
                    <span>Overall Progress</span>
                    <span className="font-mono font-bold text-primary">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate(`/boq/${boq.id}`)}
                  >
                    Open BOQ
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete BOQ"
        message={`Are you sure you want to delete ${deleteTarget?.boq_code} (${deleteTarget?.boq_name})? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
