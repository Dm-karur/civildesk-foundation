import { dashboardApi } from '../../../api/apiservice';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const dashboardService = {
  getSummary: async (params = {}) => {
    const [overviewResponse, performanceResponse] = await Promise.all([
      dashboardApi.overview(params),
      dashboardApi.projectPerformance(params),
    ]);
    const overview = overviewResponse?.data?.dashboard ?? {};
    const projects = performanceResponse?.data?.projects ?? [];
    const averageProgress = projects.length
      ? projects.reduce((sum, project) => sum + Number(project.actual_progress_percentage || 0), 0) / projects.length
      : 0;

    return {
      kpis: {
        totalProjects: { value: overview.project_count ?? 0, trend: '', trendDirection: 'neutral', description: 'Company projects', status: 'primary' },
        activeProjects: { value: projects.length, trend: '', trendDirection: 'neutral', description: 'Projects with performance data', status: 'success' },
        completedProjects: { value: projects.filter((project) => Number(project.actual_progress_percentage) >= 100).length, trend: '', trendDirection: 'neutral', description: '100% completed', status: 'info' },
        totalBudget: { value: money(overview.approved_budget), trend: '', trendDirection: 'neutral', description: 'Approved project budgets', status: 'primary' },
        totalWorkforce: { value: overview.daily_report_count ?? 0, trend: '', trendDirection: 'neutral', description: 'Daily reports recorded', status: 'primary' },
        overallProgress: { value: `${averageProgress.toFixed(1)}%`, trend: '', trendDirection: 'neutral', description: 'Average actual progress', status: 'success' },
      },
      projectProgress: projects.map((project) => ({ name: project.project_name, value: Number(project.actual_progress_percentage || 0) })),
      costOverview: [
        { name: 'Expenses', value: Number(overview.expense_actual || 0), fill: '#2563eb' },
        { name: 'Subcontracts', value: Number(overview.subcontract_actual || 0), fill: '#7c3aed' },
        { name: 'Labour', value: Number(overview.labour_actual || 0), fill: '#059669' },
      ],
      recentActivity: [],
      topProjects: projects.slice(0, 5).map((project) => ({
        id: project.id,
        name: project.project_name,
        progress: Number(project.actual_progress_percentage || 0),
        status: Number(project.actual_progress_percentage || 0) >= 100 ? 'completed' : 'active',
      })),
    };
  },
};
