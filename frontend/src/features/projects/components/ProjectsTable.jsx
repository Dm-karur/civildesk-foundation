import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, MoreVertical, PlayCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { projectsApi } from '../../../api/apiservice';

function extractProjectsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.projects)) return response.projects;
  if (Array.isArray(response.data?.projects)) return response.data.projects;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data && typeof response.data === 'object' && (response.data.id || response.data.project_name || response.data.name)) {
    return [response.data];
  }
  if (response && typeof response === 'object' && (response.id || response.project_name || response.name)) {
    return [response];
  }
  return [];
}

export function ProjectsTable({ searchQuery = '', refreshKey = 0, onEdit, filters }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.list();
      const list = extractProjectsList(response);
      setProjects(list);
    } catch (error) {
      console.error('[ProjectsTable] Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshKey]);

  const getStatusType = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress') || s.includes('active') || s === '1' || s === '2') return 'success';
    if (s.includes('hold') || s.includes('pending') || s === '3') return 'warning';
    if (s.includes('complete')) return 'info';
    return 'neutral';
  };

  const filteredProjects = projects.filter(project => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (project.project_name || project.name || '').toLowerCase();
      const code = (project.project_code || project.code || '').toLowerCase();
      const client = (project.client_name || project.client || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !client.includes(q)) return false;
    }
    if (filters?.client_id !== 'all' && String(project.client_id) !== String(filters.client_id)) return false;
    if (filters?.project_status_id !== 'all' && String(project.project_status_id) !== String(filters.project_status_id)) return false;
    if (filters?.project_type_id !== 'all' && String(project.project_type_id) !== String(filters.project_type_id)) return false;
    if (filters?.financial_year_id !== 'all' && String(project.financial_year_id) !== String(filters.financial_year_id)) return false;
    return true;
  });

  const renderPagination = () => (
    <Pagination 
      currentPage={1}
      totalPages={Math.max(1, Math.ceil(filteredProjects.length / 10))}
      totalItems={filteredProjects.length}
      itemsPerPage={10}
      onPageChange={() => {}}
      onItemsPerPageChange={() => {}}
    />
  );

  return (
    <DataTableContainer pagination={renderPagination()}>
      <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
        <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
          <tr>
            <th className="px-2 py-1.5 w-10 text-center">#</th>
            <th className="px-2 py-1.5 w-24">Project Code</th>
            <th className="px-2 py-1.5 w-48">Project Name</th>
            <th className="px-2 py-1.5 w-36">Client</th>
            <th className="px-2 py-1.5 w-32">Project Type</th>
            <th className="px-2 py-1.5 w-28 text-center">Status</th>
            <th className="px-2 py-1.5 w-28">Start Date</th>
            <th className="px-2 py-1.5 w-28">End Date</th>
            <th className="px-2 py-1.5 text-right w-28">Budget (₹)</th>
            <th className="px-2 py-1.5 text-center w-20">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan="10" className="text-center py-6 text-text-muted text-[12px]">
                Loading projects from database...
              </td>
            </tr>
          ) : filteredProjects.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center py-6 text-text-muted text-[12px]">
                No projects found in database.
              </td>
            </tr>
          ) : (
            filteredProjects.map((project, index) => {
              const code = project.project_code || project.code || '—';
              const name = project.project_name || project.name || '—';
              const clientName = project.client_name || project.client || '—';
              const clientsList = Array.isArray(project.clients) ? project.clients : (project.client_names ? project.client_names : []);
              const clientCount = clientsList.length > 0 ? clientsList.length : (project.client_count || 1);
              const clientDisplay = clientsList.length > 0 ? clientsList.map(c => c.name || c.client_name || c).join(', ') : clientName;
              const type = project.project_type_name || project.project_type || project.type || '—';
              const status = project.project_status_name || project.status_name || project.status || 'Active';
              const startDate = project.start_date || project.planned_start_date ? (project.start_date || project.planned_start_date).split(' ')[0] : '—';
              const endDate = project.end_date || project.expected_completion_date ? (project.end_date || project.expected_completion_date).split(' ')[0] : '—';
              const budget = project.contract_value || project.estimated_cost || project.budget;
              const formattedBudget = budget !== undefined && budget !== null ? Number(budget).toLocaleString('en-IN') : '0.00';

              return (
                <tr key={project.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                  <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{index + 1}</td>
                  <td className="px-2 py-1 font-mono font-semibold text-text-primary text-[11px]">{code}</td>
                  <td className="px-2 py-1 font-medium text-text-primary truncate" title={name}>{name}</td>
                  <td className="px-2 py-1 text-text-secondary truncate" title={clientDisplay}>
                    <span>{clientDisplay}</span>
                    {clientCount > 1 && (
                      <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1 rounded-full font-bold">+{clientCount - 1} clients</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-text-secondary truncate text-[11px]">{type}</td>
                  <td className="px-2 py-1 text-center">
                    <Badge 
                      variant={getStatusType(status)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center gap-0.5 leading-none"
                    >
                      {status === 'In Progress' && <PlayCircle className="w-2.5 h-2.5" />}
                      {status === 'On Hold' && <AlertCircle className="w-2.5 h-2.5" />}
                      {status === 'Not Started' && <Clock className="w-2.5 h-2.5" />}
                      <span>{status}</span>
                    </Badge>
                  </td>
                  <td className="px-2 py-1 text-text-secondary truncate text-[11px]">
                    {startDate}
                  </td>
                  <td className="px-2 py-1 text-text-secondary truncate text-[11px]">
                    {endDate}
                  </td>
                  <td className="px-2 py-1 text-right font-mono font-semibold text-text-primary text-[11px]">
                    ₹{formattedBudget}
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="View" onClick={() => navigate(`/projects/overview?id=${project.id}`)}>
                        <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit" onClick={() => onEdit?.(project)}>
                        <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="More">
                        <MoreVertical className="w-3.5 h-3.5 text-text-secondary" />
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
  );
}
