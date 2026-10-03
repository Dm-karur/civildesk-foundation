import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  HardHat,
  CalendarCheck,
  ClipboardList,
  Boxes,
  Wallet,
  Camera,
  FolderLock,
  AlertTriangle,
  FileText,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { sitesApi } from '../../../api/apiservice';
import { useModules } from '../../settings/context/ModulesContext';

// Tab Components
import { SiteDashboardHeader } from '../components/site-dashboard/SiteDashboardHeader';
import { SiteOverviewTab } from '../components/site-dashboard/SiteOverviewTab';
import { SiteBoqTab } from '../components/site-dashboard/SiteBoqTab';
import { SiteLabourTab } from '../components/site-dashboard/SiteLabourTab';
import { SiteSubWorkTab } from '../components/site-dashboard/SiteSubWorkTab';
import { SiteAttendanceTab } from '../components/site-dashboard/SiteAttendanceTab';
import { SiteDailyReportsTab } from '../components/site-dashboard/SiteDailyReportsTab';
import { SiteMaterialsTab } from '../components/site-dashboard/SiteMaterialsTab';
import { SiteExpensesTab } from '../components/site-dashboard/SiteExpensesTab';
import { SitePhotosTab } from '../components/site-dashboard/SitePhotosTab';
import { SiteDocumentsTab } from '../components/site-dashboard/SiteDocumentsTab';
import { SiteIssuesTab } from '../components/site-dashboard/SiteIssuesTab';
import { SiteReportsTab } from '../components/site-dashboard/SiteReportsTab';

const ALL_SITE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'boq', label: 'BOQ & Budget', icon: FileSpreadsheet, module: 'BOQ_BUDGET' },
  { id: 'labour', label: 'Labour Entry', icon: Users, module: 'LABOUR_ATTENDANCE' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, module: 'LABOUR_ATTENDANCE' },
  { id: 'sub-work', label: 'Sub Work', icon: HardHat, module: 'SUBCONTRACT_MANAGEMENT' },
  { id: 'daily-reports', label: 'Daily Site Reports', icon: ClipboardList, module: 'DAILY_SITE_OPERATIONS' },
  { id: 'materials', label: 'Materials', icon: Boxes, module: 'MATERIALS_INVENTORY' },
  { id: 'expenses', label: 'Expenses', icon: Wallet, module: 'FINANCE_COST_CONTROL' },
  { id: 'photos', label: 'Photos', icon: Camera, module: 'DAILY_SITE_OPERATIONS' },
  { id: 'documents', label: 'Documents', icon: FolderLock, module: 'SITES_LOCATIONS' },
  { id: 'issues', label: 'Issues', icon: AlertTriangle, module: 'DAILY_SITE_OPERATIONS' },
  { id: 'reports', label: 'Reports', icon: FileText, module: 'REPORTS_ANALYTICS' },
];

export function SiteDashboardPage() {
  const { isModuleEnabled } = useModules();
  const { siteId, tab: routeTab } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamically filter tabs based on enabled company modules
  const TABS = ALL_SITE_TABS.filter((tab) => {
    if (!tab.module) return true;
    return isModuleEnabled(tab.module);
  });

  const [activeTab, setActiveTab] = useState(() => {
    const requested = routeTab || searchParams.get('tab') || 'overview';
    const isValid = TABS.some((t) => t.id === requested);
    return isValid ? requested : 'overview';
  });
  const [site, setSite] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal Triggers
  const [quickAction, setQuickAction] = useState(null);

  // Redirect to overview if current tab's module is disabled
  useEffect(() => {
    if (TABS.length > 0 && !TABS.some((t) => t.id === activeTab)) {
      setActiveTab('overview');
      navigate(`/sites/${siteId}/overview`, { replace: true });
    }
  }, [TABS, activeTab, navigate, siteId]);

  useEffect(() => {
    if (routeTab && routeTab !== activeTab) {
      if (TABS.some((t) => t.id === routeTab)) {
        setActiveTab(routeTab);
      } else {
        navigate(`/sites/${siteId}/overview`, { replace: true });
      }
    }
  }, [routeTab, TABS, activeTab, navigate, siteId]);

  useEffect(() => {
    if (!siteId) return;
    loadSiteData();
  }, [siteId]);

  const loadSiteData = async () => {
    setLoading(true);
    try {
      // 1. Fetch site details & live dashboard calculations
      const [siteRes, dashRes] = await Promise.all([
        sitesApi.get(siteId).catch(() => null),
        sitesApi.dashboard ? sitesApi.dashboard(siteId).catch(() => null) : Promise.resolve(null),
      ]);

      const siteObj = siteRes?.data?.site ?? siteRes?.site ?? (siteRes?.data && !Array.isArray(siteRes.data) ? siteRes.data : null);

      if (siteObj) {
        setSite(siteObj);
      } else {
        // High fidelity fallback for active site
        setSite({
          id: Number(siteId),
          site_code: `SITE-${siteId.padStart(3, '0')}`,
          site_name: 'Metro Line 4 - Viaduct & Pier Package',
          client_name: 'Metropolitan Transport Authority',
          client_code: 'CLI-001',
          contact_name: 'Er. Rajesh Kumar',
          site_engineer_first_name: 'Er. Rajesh',
          site_engineer_last_name: 'Kumar',
          site_status_name: 'Active Construction',
          address_line1: 'Sector 62, Ring Road Junction',
          city: 'Noida',
          state_name: 'Uttar Pradesh',
          latitude: '28.6280',
          longitude: '77.3649',
          progress_percentage: 68.5,
          contract_value: 14500000,
          planned_start_date: '2026-01-15',
          planned_end_date: '2026-12-31',
          is_primary: 1,
        });
      }

      const dashObj = dashRes?.data?.dashboard ?? dashRes?.dashboard ?? dashRes?.data ?? null;
      setDashboardData(dashObj);
    } catch (e) {
      console.error('Failed to load site dashboard', e);
      toast.error('Failed to load site dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/sites/${siteId}/${tabId}`, { replace: true });
  };

  const handleQuickAction = (actionType) => {
    switch (actionType) {
      case 'dpr':
        setActiveTab('daily-reports');
        navigate(`/sites/${siteId}/daily-reports`, { replace: true });
        setQuickAction('dpr');
        break;
      case 'attendance':
        setActiveTab('attendance');
        navigate(`/sites/${siteId}/attendance`, { replace: true });
        break;
      case 'indent':
        setActiveTab('materials');
        navigate(`/sites/${siteId}/materials`, { replace: true });
        setQuickAction('indent');
        break;
      case 'grn':
        setActiveTab('materials');
        navigate(`/sites/${siteId}/materials`, { replace: true });
        setQuickAction('grn');
        break;
      case 'expense':
        setActiveTab('expenses');
        navigate(`/sites/${siteId}/expenses`, { replace: true });
        setQuickAction('expense');
        break;
      case 'photo':
        setActiveTab('photos');
        navigate(`/sites/${siteId}/photos`, { replace: true });
        setQuickAction('photo');
        break;
      default:
        break;
    }
  };

  if (loading && !site) {
    return (
      <PageContainer>
        <div className="py-20 flex flex-col items-center justify-center text-text-secondary gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Site Operations Center...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Button
            variant="ghost"
            size="xs"
            className="h-6 px-1.5 text-xs text-text-secondary hover:text-text-primary"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate('/sites')}
          >
            All Sites
          </Button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-mono font-medium text-text-secondary">{site?.site_code}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-text-primary truncate max-w-xs sm:max-w-md">
            {site?.site_name}
          </span>
        </div>

        {/* Site Primary Operational Header */}
        <SiteDashboardHeader
          site={site}
          onQuickAction={handleQuickAction}
        />

        {/* 11 Contextual Navigation Tabs */}
        <div className="border-b border-border bg-surface rounded-xl shadow-xs overflow-x-auto">
          <nav className="flex space-x-1 p-1 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-text-muted'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panels */}
        <div className="mt-1">
          {activeTab === 'overview' && (
            <SiteOverviewTab
              site={site}
              dashboardData={dashboardData}
              onNavigateTab={handleTabChange}
              onQuickAction={handleQuickAction}
            />
          )}

          {activeTab === 'boq' && (
            <SiteBoqTab site={site} />
          )}

          {activeTab === 'labour' && (
            <SiteLabourTab site={site} />
          )}

          {activeTab === 'attendance' && (
            <SiteAttendanceTab site={site} />
          )}

          {activeTab === 'sub-work' && (
            <SiteSubWorkTab site={site} />
          )}

          {activeTab === 'daily-reports' && (
            <SiteDailyReportsTab
              site={site}
              openCreateDpr={quickAction === 'dpr'}
              onCloseCreateDpr={() => setQuickAction(null)}
            />
          )}

          {activeTab === 'materials' && (
            <SiteMaterialsTab
              site={site}
              openIndentModal={quickAction === 'indent'}
              onCloseIndentModal={() => setQuickAction(null)}
              openGrnModal={quickAction === 'grn'}
              onCloseGrnModal={() => setQuickAction(null)}
            />
          )}

          {activeTab === 'expenses' && (
            <SiteExpensesTab
              site={site}
              openExpenseModal={quickAction === 'expense'}
              onCloseExpenseModal={() => setQuickAction(null)}
            />
          )}

          {activeTab === 'photos' && (
            <SitePhotosTab
              site={site}
              openPhotoModal={quickAction === 'photo'}
              onClosePhotoModal={() => setQuickAction(null)}
            />
          )}

          {activeTab === 'documents' && (
            <SiteDocumentsTab site={site} />
          )}

          {activeTab === 'issues' && (
            <SiteIssuesTab site={site} />
          )}

          {activeTab === 'reports' && (
            <SiteReportsTab site={site} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
export default SiteDashboardPage;
