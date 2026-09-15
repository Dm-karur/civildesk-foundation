import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldCheck, Info, Search, HelpCircle, Eye, Activity } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { mastersApi } from '../../../api/apiservice';

export function ProjectStatusesPage() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // View modal state
  const [viewingItem, setViewingItem] = useState(null);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mastersApi.all();
      const list = res?.data?.project_statuses ?? res?.project_statuses ?? [];
      setStatuses(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load project status master list.');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const filtered = useMemo(() => {
    return statuses.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.code || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q)
      );
    });
  }, [statuses, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // KPIs
  const totalCount = statuses.length;
  const finalCount = statuses.filter(s => s.is_final).length;
  const standardCount = totalCount - finalCount;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: 'Project Statuses' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Project Status Catalogue" breadcrumbs={breadcrumbs} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KpiCard label="Total Registered Statuses" value={totalCount} icon={<Activity />} status="primary" />
        <KpiCard label="Final Stages (Closed/Archived)" value={finalCount} icon={<ShieldCheck />} status="success" />
        <KpiCard label="Active Workflow States" value={standardCount} icon={<Info />} status="info" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              placeholder="Search by code, name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
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
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-12 text-center">#</th>
                <th className="px-3 py-2 w-32">Status Code</th>
                <th className="px-3 py-2 w-48">Status Name</th>
                <th className="px-3 py-2 hidden md:table-cell">Description</th>
                <th className="px-3 py-2 w-28 text-center">Workflow End</th>
                <th className="px-3 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-muted text-[12px]">
                    Loading statuses from backend...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-muted text-[12px]">
                    No project statuses found.
                  </td>
                </tr>
              ) : (
                paged.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                      {item.code || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary text-[11px] truncate">
                      {item.name || '—'}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate">
                      {item.description || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.is_final ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {item.is_final ? 'Yes (Final)' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Details"
                          onClick={() => setViewingItem(item)}
                        >
                          <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* View Details Modal */}
      <EntityEditModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
      >
        <EntityEditModal.Header
          icon={Activity}
          title="Project Status Specifications"
          subtitle="System configuration details for project state transitions."
          onClose={() => setViewingItem(null)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Status Properties">
              <EntityEditModal.Grid>
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Status Name</div>
                  <div className="text-[13px] font-medium text-text-primary mt-1">{viewingItem?.name || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Status Code</div>
                  <div className="text-[13px] font-mono font-semibold text-text-primary mt-1">{viewingItem?.code || '—'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Workflow End State</div>
                  <div className="mt-1">
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        viewingItem?.is_final ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'
                      }`}
                    >
                      {viewingItem?.is_final ? 'Yes (Final State)' : 'No (Intermediate state)'}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Description</div>
                  <div className="text-[12px] text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                    {viewingItem?.description || 'No description provided.'}
                  </div>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <div className="flex items-center justify-end border-t border-border px-4 py-3 bg-surface-subtle">
            <Button variant="ghost" className="h-9 px-4 text-[13px]" onClick={() => setViewingItem(null)}>
              Close
            </Button>
          </div>
        </div>
      </EntityEditModal>
    </PageContainer>
  );
}
