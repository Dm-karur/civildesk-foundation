import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { MapPin, Activity, CheckCircle2, Clock, Construction, Plus, Building2, List, Map as MapIcon } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { SitesFilterBar } from '../components/SitesFilterBar';
import { SitesTable } from '../components/SitesTable';
import { SiteFormModal } from '../components/SiteFormModal';
import { SiteMapView } from '../components/SiteMapView';
import { sitesApi, mastersApi, clientsApi, usersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

function extractList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.clients)) return res.data.clients;
  if (Array.isArray(res.data?.users)) return res.data.users;
  if (Array.isArray(res.clients)) return res.clients;
  if (Array.isArray(res.users)) return res.users;
  return [];
}

export function SitesListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();

  // Active View Toggle: 'list' or 'map'
  const isMapRoute = location.pathname.endsWith('/map') || searchParams.get('view') === 'map';
  const [viewMode, setViewMode] = useState(isMapRoute ? 'map' : 'list');

  // Keep viewMode synced if URL or location changes
  useEffect(() => {
    if (location.pathname.endsWith('/map') || searchParams.get('view') === 'map') {
      setViewMode('map');
    } else {
      setViewMode('list');
    }
  }, [location.pathname, searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [masters, setMasters] = useState({});
  const [clients, setClients] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [filters, setFilters] = useState({
    client_id: 'all',
    status_id: 'all',
    site_engineer_id: 'all',
    date_from: '',
    date_to: '',
  });
  const [kpis, setKpis] = useState({ total: 0, active: 0, underConstruction: 0, primary: 0 });

  // Map Data
  const [mapLocations, setMapLocations] = useState([]);
  const [isMapLoading, setIsMapLoading] = useState(false);

  // Sync viewMode with URL query parameter or route
  const handleViewChange = (mode) => {
    setViewMode(mode);
    if (mode === 'map') {
      if (location.pathname.endsWith('/map')) {
        // already on /sites/map
      } else {
        navigate('/sites/map');
      }
    } else {
      if (location.pathname.endsWith('/map')) {
        navigate('/sites');
      } else {
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.delete('view');
          return params;
        });
      }
    }
  };

  useEffect(() => {
    Promise.all([
      mastersApi.all().catch(() => ({ data: {} })),
      clientsApi.list().catch(() => ({ data: [] })),
      usersApi.list().catch(() => ({ data: [] })),
    ]).then(([mRes, cRes, uRes]) => {
      setMasters(mRes?.data ?? mRes ?? {});
      setClients(extractList(cRes));
      setEngineers(extractList(uRes));
    });
  }, []);

  // Fetch KPI data & Map locations
  useEffect(() => {
    setIsMapLoading(true);
    // Fetch Map Locations (Sites + Branches + Main Branch)
    sitesApi.mapLocations()
      .then((res) => {
        const list = res?.data?.locations ?? res?.locations ?? [];
        setMapLocations(list);
      })
      .catch((err) => {
        console.error('Failed to load map locations:', err);
      })
      .finally(() => {
        setIsMapLoading(false);
      });

    // Fetch site list for KPIs
    sitesApi.list()
      .then((res) => {
        const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let active = 0, underConstruction = 0, primary = 0;
          list.forEach((s) => {
            const st = String(s.site_status_name || s.status_name || s.status || '').toLowerCase();
            if (st.includes('active')) active++;
            else if (st.includes('progress') || st.includes('construction') || st.includes('draft') || st.includes('plan')) underConstruction++;
            if (s.is_primary) primary++;
          });
          setKpis({ total: list.length, active: active || list.length, underConstruction, primary });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={viewMode === 'map' ? 'Site Map View' : 'Site Directory'}
        action={
          <div className="flex items-center gap-3">
            {/* Professional List View / Map View Switcher */}
            <div className="inline-flex items-center p-0.5 bg-surface-subtle border border-border rounded-lg">
              <button
                type="button"
                onClick={() => handleViewChange('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-surface text-primary shadow-xs border border-border/80'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange('map')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-surface text-primary shadow-xs border border-border/80'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>

            {hasPermission('site.create') && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Site</span>
              </button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* CONDITIONALLY RENDER: LIST VIEW OR MAP VIEW */}
        {viewMode === 'map' ? (
          <SiteMapView
            locations={mapLocations}
            isLoading={isMapLoading}
            onRefresh={() => setRefreshKey((v) => v + 1)}
          />
        ) : (
          <>
            {/* Filter Bar with Client, Status, Engineer & Date Range and List/Map Switcher */}
            <SitesFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => navigate('/sites/new')}
              canCreate={hasPermission('site.create')}
              filters={filters}
              onFilterChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
              masters={masters}
              clients={clients}
              engineers={engineers}
              viewMode={viewMode}
              onViewModeChange={handleViewChange}
            />

            {/* Professional Site Table */}
            <SitesTable
              searchQuery={searchQuery}
              refreshKey={refreshKey}
              onEdit={(site) => navigate(`/sites/${site.id}/edit`)}
              filters={filters}
              onRefresh={() => setRefreshKey((v) => v + 1)}
            />
          </>
        )}
      </div>

      {/* Add / Edit Site Modal */}
      <SiteFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaveSuccess={() => setRefreshKey((v) => v + 1)}
      />
      <SiteFormModal
        isOpen={Boolean(editingSite)}
        site={editingSite}
        onClose={() => setEditingSite(null)}
        onSaveSuccess={() => setRefreshKey((v) => v + 1)}
      />
    </PageContainer>
  );
}
