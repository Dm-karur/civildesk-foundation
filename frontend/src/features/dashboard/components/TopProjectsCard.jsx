import { Card } from '../../../components/ui/Card';
import { ProgressIndicator } from '../../../components/composite/ProgressIndicator';
import { StatusBadge } from '../../../components/composite/StatusBadge';

export function TopProjectsCard({ projects }) {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">Top Projects</h3>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>
      
      <div className="-mx-4 sm:-mx-6 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50">
              <th className="px-4 sm:px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Project</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider w-1/3">Progress</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Budget</th>
              <th className="px-4 sm:px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-surface-muted/30 transition-colors">
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">{project.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{project.id}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <ProgressIndicator 
                    percentage={project.progress} 
                    value={`${project.progress}%`}
                    status={project.status === 'completed' ? 'success' : project.status === 'at-risk' ? 'error' : 'primary'}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-text-secondary">
                  {project.budget}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <StatusBadge status={project.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
