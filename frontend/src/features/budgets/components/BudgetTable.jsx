import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Trash2, Send, Wallet } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { budgetsApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';

function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data?.project_budgets)) return response.data.project_budgets;
  if (Array.isArray(response.project_budgets)) return response.project_budgets;
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

export function BudgetTable({ searchQuery = '', refreshKey = 0, onEdit, onView, filters, onAction }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    budgetsApi.list()
      .then((res) => setBudgets(extractList(res)))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return budgets.filter((budget) => {
      if (filters?.project_id && filters.project_id !== 'all') {
        if (String(budget.project_id) !== String(filters.project_id)) return false;
      }
      if (filters?.status && filters.status !== 'all') {
        const s = String(budget.status_name || budget.status || budget.status_code || '').toLowerCase();
        if (!s.includes(filters.status.toLowerCase())) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (budget.budget_name || budget.name || '').toLowerCase();
        const code = (budget.budget_code || budget.code || '').toLowerCase();
        const project = (budget.project_name || '').toLowerCase();
        const pCode = (budget.project_code || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !project.includes(q) && !pCode.includes(q)) return false;
      }
      return true;
    });
  }, [budgets, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAction = async (id, actionName) => {
    try {
      if (typeof budgetsApi[actionName] === 'function') {
        await budgetsApi[actionName](id, {});
      } else {
        await budgetsApi.update(id, { action: actionName });
      }
      toast.success(`Budget status updated to ${actionName}.`);
      onAction?.();
    } catch (error) {
      toast.error(error?.message || `Failed to update budget.`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await budgetsApi.remove(deleteTarget.id);
      toast.success('Budget removed successfully.');
      onAction?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete budget.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
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
                <th className="px-3 py-2 w-28">Budget Code</th>
                <th className="px-3 py-2">Budget Name</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-center w-20 hidden md:table-cell">Lines</th>
                <th className="px-3 py-2 text-right w-28">Total (₹)</th>
                <th className="px-3 py-2 text-center w-20 hidden md:table-cell">Revisions</th>
                <th className="px-3 py-2 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                    Loading project budgets...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                    No project budgets found matching criteria.
                  </td>
                </tr>
              ) : (
                paged.map((budget, index) => {
                  const status = budget.status_name || budget.status || 'Draft';
                  const total = budget.total_amount || budget.grand_total || 0;
                  const isDraft = String(status).toLowerCase().includes('draft');

                  return (
                    <tr key={budget.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                        {budget.budget_code || budget.code || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-text-primary text-[12px] truncate block" title={budget.budget_name || budget.name}>
                          {budget.budget_name || budget.name || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-text-primary text-[11px] font-medium truncate" title={budget.project_name}>
                            {budget.project_name || '—'}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {budget.project_code || ''}
                          </span>
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
                      <td className="px-3 py-2 text-center text-text-secondary text-[11px] hidden md:table-cell">
                        {budget.line_count ?? budget.lines_count ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
                        ₹{Number(total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center text-text-secondary text-[11px] hidden md:table-cell font-mono">
                        {budget.revision_count ?? '0'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Budget Details"
                            onClick={() => onView?.(budget)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Budget"
                              onClick={() => onEdit?.(budget)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Submit for Approval"
                              onClick={() => handleAction(budget.id, 'submit')}
                            >
                              <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteTarget(budget)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                          </Button>
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

      {/* Mobile View - Cards List for Phones (< sm) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading project budgets...
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No project budgets found matching criteria.
          </div>
        ) : (
          paged.map((budget, index) => {
            const status = budget.status_name || budget.status || 'Draft';
            const total = budget.total_amount || budget.grand_total || 0;
            const isDraft = String(status).toLowerCase().includes('draft');

            return (
              <div key={budget.id || index} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-text-muted block">{budget.budget_code || budget.code || '—'}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{budget.budget_name || budget.name}</h4>
                  </div>
                  <Badge
                    variant={getStatusVariant(status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                  >
                    {status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Project</span>
                    <span className="font-medium text-text-primary text-[11px] truncate block">{budget.project_name || '—'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Estimated Total</span>
                    <span className="font-mono font-bold text-text-primary text-[11px]">₹{Number(total).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => onView?.(budget)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {isDraft && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => onEdit?.(budget)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteTarget(budget)}>
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={() => {}}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Budget"
        message={`Are you sure you want to delete "${deleteTarget?.budget_name || deleteTarget?.budget_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
