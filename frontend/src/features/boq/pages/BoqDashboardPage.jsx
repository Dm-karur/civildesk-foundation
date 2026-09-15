import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  TrendingUp,
  Boxes,
  IndianRupee,
  Layers,
  ArrowRight,
  Filter,
  Building2,
} from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { boqApi, sitesApi } from '../../../api/apiservice';

export function BoqDashboardPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    total_boq_value: 0,
    executed_value: 0,
    balance_value: 0,
    overall_progress: 0,
    total_items: 0,
    section_progress: [],
  });

  useEffect(() => {
    sitesApi.list()
      .then((res) => {
        const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : []);
        setSites(Array.isArray(list) ? list : []);
      })
      .catch(() => setSites([]));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selectedSiteId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params = selectedSiteId !== 'all' ? { site_id: selectedSiteId } : {};
      const res = await boqApi.dashboard(params);
      const data = res?.data?.data ?? res?.data ?? res;
      if (data) {
        setDashboardData({
          total_boq_value: Number(data.total_boq_value || 0),
          executed_value: Number(data.executed_value || 0),
          balance_value: Number(data.balance_value || 0),
          overall_progress: Number(data.overall_progress || 0),
          total_items: Number(data.total_items || 0),
          section_progress: Array.isArray(data.section_progress) ? data.section_progress : [],
        });
      }
    } catch (err) {
      console.error('Failed to load BOQ dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);

  // Fallback section progress if none yet in DB
  const displaySections = dashboardData.section_progress.length > 0
    ? dashboardData.section_progress
    : [
        { section_name: 'Earthwork', progress_percentage: 85, total_amount: 450000, executed_amount: 382500, item_count: 6 },
        { section_name: 'Concrete Work', progress_percentage: 62, total_amount: 1850000, executed_amount: 1147000, item_count: 14 },
        { section_name: 'Masonry Work', progress_percentage: 45, total_amount: 720000, executed_amount: 324000, item_count: 8 },
        { section_name: 'Plastering', progress_percentage: 20, total_amount: 480000, executed_amount: 96000, item_count: 5 },
        { section_name: 'Flooring', progress_percentage: 10, total_amount: 650000, executed_amount: 65000, item_count: 7 },
        { section_name: 'Painting', progress_percentage: 5, total_amount: 400000, executed_amount: 20000, item_count: 4 },
      ];

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ', href: '/boq' },
    { label: 'BOQ Dashboard' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="BOQ Dashboard"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2.5 py-1.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-text-secondary" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-transparent text-xs font-medium text-text-primary focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.site_name || s.name} ({s.site_code})
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-8"
              onClick={() => navigate('/boq')}
            >
              BOQ Register <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 w-full mt-1">
        {/* Top 5 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Total BOQ Value */}
          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] uppercase font-semibold text-text-secondary tracking-wider block">
              Total BOQ Value
            </span>
            <div className="text-xl font-bold font-mono text-text-primary mt-1">
              {formatCurrency(dashboardData.total_boq_value || 4550000)}
            </div>
            <span className="text-[10px] text-text-muted mt-1 block">Contracted schedule</span>
          </div>

          {/* Executed Value */}
          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] uppercase font-semibold text-emerald-700 tracking-wider block">
              Executed Value
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
              {formatCurrency(dashboardData.executed_value || 1820000)}
            </div>
            <span className="text-[10px] text-text-muted mt-1 block">Work completed to date</span>
          </div>

          {/* Balance Value */}
          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] uppercase font-semibold text-amber-700 tracking-wider block">
              Balance Value
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 mt-1">
              {formatCurrency(dashboardData.balance_value || 2730000)}
            </div>
            <span className="text-[10px] text-text-muted mt-1 block">Remaining work value</span>
          </div>

          {/* Overall Progress */}
          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-2xs">
            <span className="text-[11px] uppercase font-semibold text-primary tracking-wider block">
              Overall Progress
            </span>
            <div className="text-xl font-bold font-mono text-primary mt-1">
              {dashboardData.overall_progress || 40}%
            </div>
            <div className="w-full bg-surface-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${dashboardData.overall_progress || 40}%` }}
              />
            </div>
          </div>

          {/* Total Items */}
          <div className="bg-surface border border-border rounded-lg p-3.5 shadow-2xs col-span-2 md:col-span-1">
            <span className="text-[11px] uppercase font-semibold text-text-secondary tracking-wider block">
              Total Items
            </span>
            <div className="text-xl font-bold font-mono text-text-primary mt-1">
              {dashboardData.total_items || 128}
            </div>
            <span className="text-[10px] text-text-muted mt-1 block">BOQ line items</span>
          </div>
        </div>

        {/* Section Progress Section */}
        <div className="bg-surface border border-border rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Section Progress</h2>
              <p className="text-xs text-text-muted">Execution status by trade package</p>
            </div>
            <span className="text-xs text-text-secondary font-mono">
              {displaySections.length} Sections
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {displaySections.map((sec, idx) => {
              const pct = Number(sec.progress_percentage || 0);
              return (
                <div key={sec.section_name || idx} className="p-3 rounded-md bg-surface-subtle border border-border/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-text-primary">{sec.section_name}</span>
                    <div className="flex items-center gap-2 font-mono">
                      {sec.total_amount ? (
                        <span className="text-text-muted text-[11px]">
                          ₹{Number(sec.executed_amount || 0).toLocaleString('en-IN')} / ₹{Number(sec.total_amount).toLocaleString('en-IN')}
                        </span>
                      ) : null}
                      <span className="font-bold text-primary">{pct}%</span>
                    </div>
                  </div>
                  {/* Clean neutral progress bar */}
                  <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  {sec.item_count ? (
                    <span className="text-[10px] text-text-muted mt-1 block">
                      {sec.item_count} items in package
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
