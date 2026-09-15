import { useState, useEffect, useMemo } from 'react';
import { Building2, IndianRupee, FileText, Briefcase, Layers, Eye, Edit, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { projectsApi, clientsApi } from '../../../api/apiservice';
import { ProjectFormModal } from '../components/ProjectFormModal';

export function ProjectClientsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      clientsApi.list().catch(() => ({ data: { clients: [] } })),
    ]).then(([pRes, cRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const cList = cRes?.data?.clients ?? cRes?.clients ?? (Array.isArray(cRes?.data) ? cRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setClients(Array.isArray(cList) ? cList : []);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        const code = (p.project_code || '').toLowerCase();
        const name = (p.project_name || '').toLowerCase();
        const client = (p.client_name || p.client_code || '').toLowerCase();
        const wo = (p.work_order_no || p.client_reference_no || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !client.includes(q) && !wo.includes(q)) return false;
      }
      if (clientFilter !== 'all' && String(p.client_id) !== String(clientFilter)) return false;
      if (statusFilter !== 'all' && String(p.project_status_id) !== String(statusFilter)) return false;
      return true;
    });
  }, [projects, search, clientFilter, statusFilter]);

  const totalContractVal = useMemo(() => {
    return projects.reduce((acc, p) => acc + Number(p.contract_value || 0), 0);
  }, [projects]);

  const uniqueClientsCount = useMemo(() => {
    return new Set(projects.map(p => p.client_id).filter(Boolean)).size;
  }, [projects]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress') || s.includes('active') || s === '1' || s === '2') return 'success';
    if (s.includes('hold') || s.includes('pending') || s === '3') return 'warning';
    if (s.includes('complete')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Clients' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Clients"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Bar - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Linked Projects"
            value={projects.length}
            status="primary"
            icon={<Briefcase className="w-4 h-4" />}
          />
          <KpiCard
            label="Client Entities"
            value={uniqueClientsCount}
            status="info"
            icon={<Building2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Total Contract Value"
            value={`₹${totalContractVal.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Average / Project"
            value={projects.length ? `₹${Math.round(totalContractVal / projects.length).toLocaleString('en-IN')}` : '₹0'}
            status="neutral"
            icon={<Layers className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="w-full sm:max-w-xs">
            <SearchField
              placeholder="Search project, client, WO#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            <Select
              options={[{ value: 'all', label: 'All Clients' }, ...clients.map(c => ({ value: String(c.id), label: c.client_name || c.name }))]}
              value={clientFilter}
              onChange={setClientFilter}
              className="w-full sm:w-44 text-xs h-8"
            />

            {(search || clientFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-text-secondary"
                onClick={() => { setSearch(''); setClientFilter('all'); setStatusFilter('all'); }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
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
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Client Details</th>
                  <th className="px-3 py-2 hidden md:table-cell">Work Order / Ref</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Billing Terms</th>
                  <th className="px-3 py-2 text-right">Contract Value</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading project client records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No project client records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((project, index) => {
                    const clientCode = project.client_code || '';
                    const clientName = project.client_name || project.client || '—';
                    const woNo = project.work_order_no || project.client_reference_no || '—';
                    const billingMethod = project.billing_method_name || 'Progressive Milestone';
                    const status = project.project_status_name || project.status_name || 'Active';
                    const contractVal = Number(project.contract_value || 0);
                    const budgetVal = Number(project.approved_budget || 0);

                    return (
                      <tr key={project.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + index + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={project.project_name}>
                              {project.project_name}
                            </span>
                            <span className="font-mono text-[10px] text-text-secondary">
                              {project.project_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-text-primary text-[12px] truncate" title={clientName}>
                              {clientName}
                            </span>
                            {clientCode && (
                              <span className="text-[10px] font-mono text-text-muted">
                                {clientCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="font-mono text-[11px] text-text-secondary truncate block" title={woNo}>
                            {woNo}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <div className="flex flex-col text-[11px] text-text-secondary">
                            <span>{billingMethod}</span>
                            <span className="text-[10px] text-text-muted">
                              Ret: {project.retention_percentage || 0}% • GST: {project.tax_percentage || 18}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span className="font-bold text-text-primary text-[12px] block">
                            ₹{contractVal.toLocaleString('en-IN')}
                          </span>
                          {budgetVal > 0 && (
                            <span className="text-[10px] text-emerald-600 block">
                              Budget: ₹{budgetVal.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Client Commercial Details"
                              onClick={() => setSelectedProject(project)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Commercials"
                              onClick={() => setEditingProject(project)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading project client records...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No project client records found.
            </div>
          ) : (
            paged.map((project, idx) => {
              const clientName = project.client_name || project.client || '—';
              const contractVal = Number(project.contract_value || 0);
              const status = project.project_status_name || project.status_name || 'Active';

              return (
                <div key={project.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-text-primary text-[13px] leading-snug">
                        {project.project_name}
                      </h4>
                      <span className="text-[10px] font-mono text-text-secondary">
                        {project.project_code}
                      </span>
                    </div>
                    <Badge
                      variant={getStatusVariant(status)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                    >
                      {status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Client</span>
                      <span className="font-medium text-text-primary text-[11px] truncate block">{clientName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Contract Value</span>
                      <span className="font-mono font-bold text-text-primary text-[11px] block">₹{contractVal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[10px] text-text-secondary font-mono">
                      WO: {project.work_order_no || '—'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditingProject(project)}
                      >
                        <Edit className="w-3.5 h-3.5 text-text-secondary" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Project Client Commercial Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-text-primary truncate">
                    {selectedProject.project_name}
                  </h3>
                  <p className="text-[11px] text-text-secondary font-mono truncate">
                    {selectedProject.project_code} • Client: {selectedProject.client_name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>✕</Button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-surface-muted/40 p-2.5 sm:p-3 rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Contract Value</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-text-primary">
                    ₹{Number(selectedProject.contract_value || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-surface-muted/40 p-2.5 sm:p-3 rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Approved Budget</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600">
                    ₹{Number(selectedProject.approved_budget || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-surface-muted/40 p-2.5 sm:p-3 rounded-lg border border-border col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Estimated Margin</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-primary">
                    {selectedProject.contract_value > 0
                      ? `${(((selectedProject.contract_value - (selectedProject.approved_budget || 0)) / selectedProject.contract_value) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-text-primary text-xs sm:text-[13px] border-b border-border pb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Commercial & Billing Terms
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 pt-1 text-[11px] sm:text-[12px]">
                  <div><span className="text-text-muted">Client Code:</span> <span className="font-mono font-semibold">{selectedProject.client_code || '—'}</span></div>
                  <div><span className="text-text-muted">Work Order No:</span> <span className="font-mono font-semibold">{selectedProject.work_order_no || '—'}</span></div>
                  <div><span className="text-text-muted">Client Ref No:</span> <span className="font-mono">{selectedProject.client_reference_no || '—'}</span></div>
                  <div><span className="text-text-muted">Billing Method:</span> <span>{selectedProject.billing_method_name || 'Progressive Milestone'}</span></div>
                  <div><span className="text-text-muted">Retention %:</span> <span className="font-mono">{selectedProject.retention_percentage || 0}%</span></div>
                  <div><span className="text-text-muted">Tax / GST %:</span> <span className="font-mono">{selectedProject.tax_percentage || 18}%</span></div>
                  <div><span className="text-text-muted">Currency:</span> <span className="font-mono">{selectedProject.currency_code || 'INR'}</span></div>
                  <div><span className="text-text-muted">Branch:</span> <span>{selectedProject.branch_name || 'Headquarters'}</span></div>
                </div>
              </div>

              {selectedProject.description && (
                <div className="border border-border rounded-lg p-3 text-xs bg-surface-muted/20">
                  <span className="font-bold text-text-primary block mb-1">Scope / Deliverables:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{selectedProject.description}</p>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedProject(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectFormModal
          isOpen={Boolean(editingProject)}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaveSuccess={() => {
            setEditingProject(null);
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </PageContainer>
  );
}
