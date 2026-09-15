import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, MapPin, Building2, User, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { sitesApi } from '../../../api/apiservice';

function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.sites)) return response.sites;
  if (Array.isArray(response.data?.sites)) return response.data.sites;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
}

const getStatusVariant = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('active') || s.includes('progress') || s.includes('construction')) return 'success';
  if (s.includes('hold') || s.includes('pending') || s.includes('planning') || s.includes('draft')) return 'warning';
  if (s.includes('complete')) return 'info';
  if (s.includes('closed') || s.includes('cancel')) return 'error';
  return 'neutral';
};

export function SitesTable({ searchQuery = '', refreshKey = 0, onEdit, filters, onRefresh }) {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [deleteSite, setDeleteSite] = useState(null);

  useEffect(() => {
    setLoading(true);
    sitesApi.list()
      .then((response) => setSites(extractList(response)))
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = sites.filter((site) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (site.site_name || site.name || '').toLowerCase();
      const code = (site.site_code || site.code || '').toLowerCase();
      const client = (site.client_name || '').toLowerCase();
      const city = (site.city || site.district || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !client.includes(q) && !city.includes(q)) return false;
    }
    if (filters?.client_id && filters.client_id !== 'all') {
      if (String(site.client_id) !== String(filters.client_id)) return false;
    }
    if (filters?.status_id && filters.status_id !== 'all') {
      if (String(site.site_status_id || site.status_id) !== String(filters.status_id)) return false;
    }
    if (filters?.site_engineer_id && filters.site_engineer_id !== 'all') {
      if (String(site.site_engineer_id) !== String(filters.site_engineer_id)) return false;
    }
    if (filters?.date_from) {
      const sDate = site.planned_start_date || site.actual_start_date;
      if (sDate && sDate.split(' ')[0] < filters.date_from) return false;
    }
    if (filters?.date_to) {
      const eDate = site.expected_end_date || site.actual_end_date;
      if (eDate && eDate.split(' ')[0] > filters.date_to) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const confirmDelete = async () => {
    if (!deleteSite?.id) return;
    try {
      await sitesApi.remove(deleteSite.id);
      toast.success('Site deleted successfully.');
      setDeleteSite(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete site.');
    }
  };

  const openSiteDashboard = (siteId) => {
    navigate(`/sites/${siteId}`);
  };

  return (
    <>
      {/* Desktop & Tablet Table View */}
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
                <th className="px-3 py-2">Site Code</th>
                <th className="px-3 py-2">Site Name</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Site Engineer</th>
                <th className="px-3 py-2">Start Date</th>
                <th className="px-3 py-2">Expected Completion</th>
                <th className="px-3 py-2 w-28 text-center">Progress %</th>
                <th className="px-3 py-2 text-center w-24">Status</th>
                <th className="px-3 py-2 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-8 text-text-muted text-[12px]">Loading registered sites...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-8 text-text-muted text-[12px]">No sites registered matching your criteria.</td></tr>
              ) : (
                paged.map((site, index) => {
                  const code = site.site_code || site.code || '—';
                  const name = site.site_name || site.name || '—';
                  const clientName = site.client_name || 'Standard Client';
                  const engineer = [site.site_engineer_first_name, site.site_engineer_last_name].filter(Boolean).join(' ') || site.contact_name || 'Assigned Lead';
                  const startDate = (site.planned_start_date || site.actual_start_date || '—').split(' ')[0];
                  const endDate = (site.expected_end_date || site.actual_end_date || '—').split(' ')[0];
                  const progress = Number(site.progress_percentage || 0);
                  const status = site.site_status_name || site.status_name || site.status || 'Active';

                  return (
                    <tr
                      key={site.id || index}
                      onClick={() => openSiteDashboard(site.id)}
                      className="hover:bg-primary/5 transition-colors group cursor-pointer"
                    >
                      <td className="px-3 py-2 text-center font-medium text-text-muted text-[11px]">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-primary font-semibold text-[11px]">
                        {code}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-text-primary text-[12px] group-hover:text-primary transition-colors">
                            {name}
                          </span>
                          {site.is_primary === 1 && (
                            <span className="text-[8px] font-bold bg-amber-500/10 text-amber-600 px-1 rounded">Primary</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-text-secondary font-medium text-[12px]">
                        {clientName}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-[11px]">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-text-muted" />
                          <span>{engineer}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-text-muted text-[11px] whitespace-nowrap">
                        {startDate}
                      </td>
                      <td className="px-3 py-2 text-text-muted text-[11px] whitespace-nowrap">
                        {endDate}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-text-secondary font-semibold w-7 text-right">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(status)}
                          className="text-[9px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                            title="Open Site Dashboard"
                            onClick={() => openSiteDashboard(site.id)}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-text-secondary hover:text-primary"
                            title="Edit Site Details"
                            onClick={() => onEdit?.(site)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-text-secondary hover:text-error"
                            title="Delete Site"
                            onClick={() => setDeleteSite(site)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Mobile Card List View */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {loading ? (
          <div className="p-8 text-center text-text-muted text-xs">Loading registered sites...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-xs">No sites found matching criteria.</div>
        ) : (
          filtered.map((site) => {
            const code = site.site_code || site.code || '—';
            const name = site.site_name || site.name || '—';
            const clientName = site.client_name || 'Standard Client';
            const progress = Number(site.progress_percentage || 0);
            const status = site.site_status_name || site.status_name || 'Active';

            return (
              <div
                key={site.id}
                onClick={() => openSiteDashboard(site.id)}
                className="bg-surface border border-border rounded-lg p-3 shadow-xs hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-mono text-[10px] text-primary font-bold tracking-tight">{code}</span>
                    <h4 className="font-semibold text-[13px] text-text-primary leading-snug">{name}</h4>
                  </div>
                  <Badge variant={getStatusVariant(status)} className="text-[9px] uppercase px-1.5 py-0.5">
                    {status}
                  </Badge>
                </div>
                <div className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-text-muted" />
                  <span>Client: {clientName}</span>
                </div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-text-secondary">{progress}%</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
                  <span className="text-text-muted text-[10px]">Tap to open Dashboard</span>
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <span>Enter Site</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteSite)}
        title="Delete Site"
        message={`Are you sure you want to delete "${deleteSite?.site_name || deleteSite?.site_code}"? This action cannot be undone.`}
        confirmLabel="Delete Site"
        confirmVariant="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteSite(null)}
      />
    </>
  );
}
