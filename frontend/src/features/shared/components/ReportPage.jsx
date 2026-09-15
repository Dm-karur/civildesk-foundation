import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Filter, RefreshCcw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../components/composite/Toast';

/**
 * Generic report page used for all Reports & Analytics screens.
 * Accepts an API function, columns, optional filters, and chart slot.
 */
export function ReportPage({
  title,
  icon: Icon = BarChart3,
  breadcrumbs,
  fetchData,
  extractList,
  columns,
  searchKeys = [],
  filters: filterConfig = [],
  exportFn,
  chartSlot,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState(() => {
    const init = {};
    filterConfig.forEach((f) => { init[f.key] = f.defaultValue ?? 'all'; });
    return init;
  });
  const [page, setPage] = useState(1);
  const perPage = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filterValues).forEach(([k, v]) => { if (v !== 'all') params[k] = v; });
    fetchData(params)
      .then((res) => setData(extractList ? extractList(res) : (Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [fetchData, extractList, filterValues]);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleExport = async () => {
    if (!exportFn) return;
    try {
      const blob = await exportFn(filterValues);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`; a.click(); URL.revokeObjectURL(url);
      toast.success('Report exported.');
    } catch { toast.error('Export failed.'); }
  };

  return (
    <PageContainer>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-1">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="w-full sm:w-[200px]">
              <SearchField placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {filterConfig.map((f) => (
              <Select key={f.key} className="w-full sm:w-[140px]" options={f.options} value={filterValues[f.key]} onChange={(v) => setFilterValues((c) => ({ ...c, [f.key]: v }))} />
            ))}
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <Button variant="outline" className="h-9 px-3 text-[13px]" leftIcon={<RefreshCcw className="w-3.5 h-3.5" />} onClick={load}>Refresh</Button>
            {exportFn && (
              <Button variant="primary" className="h-9 px-3 text-[13px]" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>Export</Button>
            )}
          </div>
        </div>

        {chartSlot && <div className="rounded-lg border border-border bg-surface p-4">{chartSlot}</div>}

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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-6 text-text-muted text-[12px]">Loading report data...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-6 text-text-muted text-[12px]">No data found.</td></tr>
              ) : (
                paged.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + index + 1}</td>
                    {columns.map((col) => (
                      <td key={col.key} className={`px-2 py-1 text-[11px] ${col.cellClass || 'text-text-primary'}`}>
                        {col.render ? col.render(row) : (
                          col.format === 'currency' ? `₹${Number(row[col.key] || 0).toLocaleString('en-IN')}` :
                          col.format === 'date' ? (row[col.key] ? String(row[col.key]).split(' ')[0] : '—') :
                          col.format === 'percent' ? `${Number(row[col.key] || 0).toFixed(1)}%` :
                          (row[col.key] ?? '—')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>
    </PageContainer>
  );
}
