import { useState, useEffect } from 'react';
import { Briefcase, Activity, CheckCircle, Clock, Building } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { ProjectsFilterBar } from '../components/ProjectsFilterBar';
import { ProjectsTable } from '../components/ProjectsTable';
import { projectsApi, clientsApi, mastersApi } from '../../../api/apiservice';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { useAuth } from '../../auth/context/AuthContext';

export function ProjectsListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [clients, setClients] = useState([]);
  const [masters, setMasters] = useState({});
  const [filters, setFilters] = useState({ client_id: 'all', project_status_id: 'all', project_type_id: 'all', financial_year_id: 'all' });
  const [projectsCount, setProjectsCount] = useState({
    total: 0,
    inProgress: 0,
    onHold: 0,
    notStarted: 0,
    totalBudget: 0
  });

  useEffect(() => {
    Promise.all([clientsApi.list(), mastersApi.all()]).then(([clientResponse, masterResponse]) => {
      setClients(clientResponse?.data?.clients ?? []);
      setMasters(masterResponse?.data ?? {});
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    projectsApi.list()
      .then(res => {
        const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let budgetSum = 0;
          let inProg = 0;
          let hold = 0;
          let notStart = 0;

          list.forEach(p => {
            const b = Number(p.contract_value || p.estimated_cost || p.budget || 0);
            if (!isNaN(b)) budgetSum += b;

            const st = String(p.project_status_name || p.status_name || p.status || '').toLowerCase();
            if (st.includes('progress') || st.includes('active') || st === '1' || st === '2') inProg++;
            else if (st.includes('hold') || st.includes('pending') || st === '3') hold++;
            else notStart++;
          });

          setProjectsCount({
            total: list.length,
            inProgress: inProg,
            onHold: hold,
            notStarted: notStart,
            totalBudget: budgetSum
          });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Masters' },
    { label: 'Projects' }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Projects" 
        breadcrumbs={breadcrumbs}
      />
      
      <div className="flex flex-col gap-4">
        <ProjectsFilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddProject={() => setIsAddOpen(true)}
          canCreate={hasPermission('project.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          clients={clients}
          masters={masters}
        />
        
        <ProjectsTable 
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingProject}
          filters={filters}
        />
        
        {/* KPI Grid computed directly from live database */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-2">
          <KpiCard
            label="Total Projects"
            value={projectsCount.total}
            description="All projects in database"
            status="neutral"
            icon={<Briefcase className="w-5 h-5" />}
          />
          <KpiCard
            label="Total Budget"
            value={`₹${projectsCount.totalBudget.toLocaleString('en-IN')}`}
            description="Combined contract values"
            status="success"
            icon={<Building className="w-5 h-5" />}
          />
          <KpiCard
            label="In Progress"
            value={projectsCount.inProgress}
            description="Active construction sites"
            status="success"
            icon={<Activity className="w-5 h-5" />}
          />
          <KpiCard
            label="On Hold"
            value={projectsCount.onHold}
            description="Temporarily suspended"
            status="warning"
            icon={<Clock className="w-5 h-5" />}
          />
          <KpiCard
            label="Not Started / Other"
            value={projectsCount.notStarted}
            description="Pending kickoff"
            status="neutral"
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
      </div>
      <ProjectFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaveSuccess={() => setRefreshKey((value) => value + 1)}
      />
      <ProjectFormModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSaveSuccess={() => setRefreshKey((value) => value + 1)}
      />
    </PageContainer>
  );
}
