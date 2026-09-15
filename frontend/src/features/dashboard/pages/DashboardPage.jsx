import { useState, useEffect } from 'react';
import { Briefcase, Activity, CheckCircle, IndianRupee, TrendingUp, RefreshCw, Users } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { DateRangeSelector } from '../../../components/composite/DateRangeSelector';
import { ErrorState } from '../../../components/composite/ErrorState';
import { EmptyState } from '../../../components/composite/EmptyState';
import { SkeletonCard, SkeletonList, SkeletonTable } from '../../../components/composite/LoadingState';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../components/composite/Toast';

import { ProjectProgressCard } from '../components/ProjectProgressCard';
import { CostOverviewCard } from '../components/CostOverviewCard';
import { RecentActivityCard } from '../components/RecentActivityCard';
import { TopProjectsCard } from '../components/TopProjectsCard';
import { dashboardService } from '../services/dashboard.service';
import { projectsApi } from '../../../api/apiservice';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('this_month');

  const fetchDashboardData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      const [result, projectsRes] = await Promise.all([
        dashboardService.getSummary(),
        projectsApi.list()
      ]);

      const projectsList = projectsRes?.data?.projects ?? projectsRes?.data ?? projectsRes ?? [];
      const totalProjectBudget = Array.isArray(projectsList)
        ? projectsList.reduce((sum, p) => sum + Number(p.approved_budget || p.contract_value || 0), 0)
        : 0;

      if (result?.kpis?.totalBudget) {
        result.kpis.totalBudget.value = `₹${totalProjectBudget.toLocaleString('en-IN')}`;
      }

      setData(result);
      if (showToast) {
        toast.success("Dashboard refreshed successfully.");
      }
    } catch (err) {
      setError(err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const renderHeaderActions = () => (
    <>
      <DateRangeSelector value={dateRange} onChange={(e) => setDateRange(e.target.value)} />
      <Button variant="outline" onClick={handleRefresh} disabled={loading} leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </>
  );

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Overview of your projects and key performance." actions={renderHeaderActions()} />
        <ErrorState
          title="Unable to load dashboard"
          description="We couldn't retrieve the latest project information."
          action={<Button onClick={handleRefresh}>Try Again</Button>}
        />
      </PageContainer>
    );
  }

  // Dashboard Skeleton State
  if (loading && !data) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Overview of your projects and key performance." actions={renderHeaderActions()} />
        <div className="flex flex-col gap-6">
          {/* KPI Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* Primary Analytics Skeleton Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-6">
            <SkeletonCard className="h-[300px]" />
            <SkeletonCard className="h-[300px]" />
          </div>
          {/* Secondary Analytics Skeleton Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-surface border border-border rounded-lg p-6">
              <SkeletonList items={4} />
            </div>
            <div className="bg-surface border border-border rounded-lg p-6">
              <SkeletonTable rows={4} />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!data?.kpis) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Overview of your projects and key performance." actions={renderHeaderActions()} />
        <EmptyState
          title="No Projects Yet"
          description="Create your first project to start tracking construction operations and performance."
          action={<Button variant="primary">Create Project</Button>}
        />
      </PageContainer>
    );
  }

  const { kpis, projectProgress, costOverview, recentActivity, topProjects } = data;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your projects and key performance."
        actions={renderHeaderActions()}
      />

      <div className="flex flex-col gap-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6">
          <KpiCard
            label="Total Projects"
            value={kpis.totalProjects.value}
            trend={kpis.totalProjects.trend}
            trendDirection={kpis.totalProjects.trendDirection}
            description={kpis.totalProjects.description}
            status={kpis.totalProjects.status}
            icon={<Briefcase className="w-5 h-5" />}
          />
          <KpiCard
            label="Active Projects"
            value={kpis.activeProjects.value}
            trend={kpis.activeProjects.trend}
            trendDirection={kpis.activeProjects.trendDirection}
            description={kpis.activeProjects.description}
            status={kpis.activeProjects.status}
            icon={<Activity className="w-5 h-5" />}
          />
          <KpiCard
            label="Completed Projects"
            value={kpis.completedProjects.value}
            trend={kpis.completedProjects.trend}
            trendDirection={kpis.completedProjects.trendDirection}
            description={kpis.completedProjects.description}
            status={kpis.completedProjects.status}
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <KpiCard
            label="Total Budget"
            value={kpis.totalBudget.value}
            trend={kpis.totalBudget.trend}
            trendDirection={kpis.totalBudget.trendDirection}
            description={kpis.totalBudget.description}
            status={kpis.totalBudget.status}
            icon={<IndianRupee className="w-5 h-5" />}
          />
          <KpiCard
            label="Total Workforce"
            value={kpis.totalWorkforce?.value || "0"}
            trend={kpis.totalWorkforce?.trend || ""}
            trendDirection={kpis.totalWorkforce?.trendDirection || "neutral"}
            description={kpis.totalWorkforce?.description || ""}
            status={kpis.totalWorkforce?.status || "primary"}
            icon={<Users className="w-5 h-5" />}
          />
          <KpiCard
            label="Overall Progress"
            value={kpis.overallProgress.value}
            trend={kpis.overallProgress.trend}
            trendDirection={kpis.overallProgress.trendDirection}
            description={kpis.overallProgress.description}
            status={kpis.overallProgress.status}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Primary Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-6">
          <ProjectProgressCard data={projectProgress} />
          <CostOverviewCard data={costOverview} totalBudget={kpis.totalBudget.value} />
        </div>

        {/* Secondary Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RecentActivityCard activities={recentActivity} />
          <TopProjectsCard projects={topProjects} />
        </div>
      </div>
    </PageContainer>
  );
}
