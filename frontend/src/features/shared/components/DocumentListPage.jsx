import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Send, CheckCircle, XCircle, Plus, Filter } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { toast } from '../../../components/composite/Toast';
import { useAuth } from '../../auth/context/AuthContext';

const getStatusVariant = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('approved') || v.includes('completed') || v.includes('paid') || v.includes('posted') || v.includes('active')) return 'success';
  if (v.includes('submitted') || v.includes('pending') || v.includes('review') || v.includes('in_progress') || v.includes('processing')) return 'warning';
  if (v.includes('rejected') || v.includes('cancelled') || v.includes('overdue')) return 'error';
  return 'neutral';
};

/**
 * Generic document list page for transaction/workflow screens.
 * Configurable via props for any module — Labour, Materials, Subcontracts, Daily Ops, Finance, etc.
 */
export function DocumentListPage({
  title,
  icon: Icon,
  breadcrumbs,
  api,
  extractList,
  columns,
  searchKeys = [],
  statusField = 'status_name',
  statusOptions = [],
  entityName = 'Record',
  permissionPrefix = '',
  kpis,
  onView,
  onEdit,
  actions = [],
  addLabel,
  onAdd,
}) {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchItems = useCallback(() => {
    setLoading(true);
    api.list()
      .then((res) => setItems(extractList(res)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [api, extractList, refreshKey]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const refresh = () => setRefreshKey((v) => v + 1);

  const filtered = items.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = searchKeys.some((key) => String(item[key] || '').toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'all') {
      const s = String(item[statusField] || item.status || '').toLowerCase();
      if (!s.includes(statusFilter)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const computedKpis = kpis ? kpis(items) : null;

  const handleAction = async (item, actionName) => {
    try {
      if (api[actionName]) await api[actionName](item.id, {});
      else if (api.action) await api.action(item.id, actionName, {});
      toast.success(`${entityName} ${actionName} successful.`);
      refresh();
    } catch (error) {
      toast.error(error?.message || `Failed to ${actionName}.`);
    }
  };

  const canCreate = !permissionPrefix || hasPermission(`${permissionPrefix}.create`);

  return (
    <PageContainer>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-1">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="w-full sm:w-[200px]">
              <SearchField placeholder={`Search ${title.toLowerCase()}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {statusOptions.length > 0 && (
              <Select className="w-full sm:w-[130px]" options={[{ value: 'all', label: 'All Status' }, ...statusOptions]} value={statusFilter} onChange={setStatusFilter} />
            )}
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            {onAdd && canCreate && (
              <Button variant="primary" className="h-9 px-3 text-[13px]" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onAdd}>
                {addLabel || `Add ${entityName}`}
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <DataTableContainer
          pagination={<Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />}
        >
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-2 py-1.5 w-10 text-center">#</th>
                {columns.map((col) => (
                  <th key={col.key} className={`px-2 py-1.5 ${col.className || ''}`}>{col.label}</th>
                ))}
                <th className="px-2 py-1.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={columns.length + 2} className="text-center py-6 text-text-muted text-[12px]">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length + 2} className="text-center py-6 text-text-muted text-[12px]">No {title.toLowerCase()} found.</td></tr>
              ) : (
                paged.map((item, index) => {
                  const status = item[statusField] || item.status || '';
                  const isDraft = String(status).toLowerCase().includes('draft');

                  return (
                    <tr key={item.id || index} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + index + 1}</td>
                      {columns.map((col) => (
                        <td key={col.key} className={`px-2 py-1 text-[11px] ${col.cellClass || 'text-text-primary'}`}>
                          {col.key === statusField || col.key === 'status' ? (
                            <Badge variant={getStatusVariant(item[col.key])} className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none">{item[col.key] || '—'}</Badge>
                          ) : col.render ? col.render(item) : (
                            col.format === 'currency' ? `₹${Number(item[col.key] || 0).toLocaleString('en-IN')}` :
                            col.format === 'date' ? (item[col.key] ? String(item[col.key]).split(' ')[0] : '—') :
                            (item[col.key] || '—')
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-center gap-0.5">
                          {onView && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="View" onClick={() => onView(item)}>
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {onEdit && isDraft && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit" onClick={() => onEdit(item)}>
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {actions.filter((a) => !a.condition || a.condition(item)).map((a) => (
                            <Button key={a.name} variant="ghost" size="sm" className="h-6 w-6 p-0" title={a.label} onClick={() => handleAction(item, a.name)}>
                              {a.icon}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTableContainer>

        {/* KPIs */}
        {computedKpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {computedKpis.map((kpi, i) => (
              <KpiCard key={i} label={kpi.label} value={kpi.value} description={kpi.description} status={kpi.status} icon={kpi.icon} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
