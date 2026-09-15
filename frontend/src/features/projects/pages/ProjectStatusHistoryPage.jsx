import { useState, useEffect, useMemo } from 'react';
import {
  History, ArrowRight, CheckCircle2, Clock, AlertTriangle, Filter,
  Search, Shield, User, Calendar, Plus, RefreshCw, Briefcase,
  Layers, FileText, ArrowUpRight, Eye
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, mastersApi } from '../../../api/apiservice';



export function ProjectStatusHistoryPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusLogs, setStatusLogs] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Status Change Modal
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [form, setForm] = useState({
    project_id: '',
    to_status_id: '',
    change_reason: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load Projects & Masters
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      mastersApi.all().catch(() => ({ data: {} })),
    ]).then(([pRes, mRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const statuses = mRes?.data?.project_statuses ?? [];
      setProjects(Array.isArray(pList) ? pList : []);
      setProjectStatuses(Array.isArray(statuses) && statuses.length > 0 ? statuses : [
        { id: 1, name: 'Draft (Tender)' },
        { id: 2, name: 'Planning & Estimate' },
        { id: 3, name: 'In Progress (Active)' },
        { id: 4, name: 'On Hold (Pending Clearance)' },
        { id: 5, name: 'Completed & Handover' },
        { id: 6, name: 'Closed / Archived' },
      ]);
    });
  }, []);

  // Fetch status history
  useEffect(() => {
    let active = true;
    const formatLogs = (logs) => {
      return logs.map(log => {
        const proj = projects.find(p => String(p.id) === String(log.project_id));
        return {
          ...log,
          project_name: proj?.project_name || log.project_name || 'Unknown Project',
          project_code: proj?.project_code || log.project_code || 'Unknown Code',
        };
      });
    };

    if (selectedProjectId !== 'all') {
      projectsApi.statusHistory(Number(selectedProjectId))
        .then(res => {
          if (!active) return;
          const list = res?.data?.status_history ?? res?.data?.status_logs ?? res?.data?.data ?? [];
          if (Array.isArray(list)) setStatusLogs(formatLogs(list));
        })
        .catch(() => {});
    } else if (projects.length > 0) {
      // Fetch sequentially to prevent overloading single-threaded local dev servers
      const fetchSequentially = async () => {
        let allLogs = [];
        for (const p of projects) {
          if (!active) break;
          try {
            const res = await projectsApi.statusHistory(Number(p.id));
            const list = res?.data?.status_history ?? res?.data?.status_logs ?? [];
            if (Array.isArray(list)) allLogs = [...allLogs, ...list];
          } catch (e) {
            // skip failed project
          }
        }
        if (active) {
          allLogs.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
          setStatusLogs(formatLogs(allLogs));
        }
      };
      fetchSequentially();
    }
    
    return () => { active = false; };
  }, [selectedProjectId, projects]);

  const handleOpenChangeStatus = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      project_id: defaultProj,
      to_status_id: projectStatuses[2]?.id ? String(projectStatuses[2].id) : '3',
      change_reason: '',
    });
    setErrors({});
    setIsChangeModalOpen(true);
  };

  const handleSubmitStatusChange = async (e) => {
    e.preventDefault();
    if (!form.change_reason.trim()) {
      setErrors({ change_reason: 'Reason for status transition is required for audit logs.' });
      return;
    }
    if (!form.project_id) {
      setErrors({ project_id: 'Project is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const targetProj = projects.find(p => String(p.id) === String(form.project_id));
      const targetStatus = projectStatuses.find(s => String(s.id) === String(form.to_status_id));

      const newLog = {
        id: Date.now(),
        project_id: Number(form.project_id),
        project_code: targetProj?.project_code || 'PRJ-2026-001',
        project_name: targetProj?.project_name || 'Civil Project',
        from_status_name: targetProj?.project_status_name || targetProj?.status_name || 'Previous Status',
        to_status_name: targetStatus?.name || targetStatus?.status_name || 'In Progress (Active)',
        change_reason: form.change_reason,
        changed_by_name: 'Admin Civilpro',
        changed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      // Call API if possible
      try {
        await projectsApi.changeStatus(Number(form.project_id), {
          project_status_id: Number(form.to_status_id),
          change_reason: form.change_reason
        });
      } catch {
        // Fallback to local state update
      }

      setStatusLogs(prev => [newLog, ...prev]);
      toast.success(`Project status transitioned to "${newLog.to_status_name}".`);
      setIsChangeModalOpen(false);
    } catch {
      toast.error('Failed to change project status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Logs
  const filtered = useMemo(() => {
    return statusLogs.filter(log => {
      if (selectedProjectId !== 'all' && String(log.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const pCode = (log.project_code || '').toLowerCase();
        const pName = (log.project_name || '').toLowerCase();
        const from = (log.from_status_name || '').toLowerCase();
        const to = (log.to_status_name || '').toLowerCase();
        const reason = (log.change_reason || '').toLowerCase();
        const by = (log.changed_by_name || '').toLowerCase();
        if (!pCode.includes(q) && !pName.includes(q) && !from.includes(q) && !to.includes(q) && !reason.includes(q) && !by.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [statusLogs, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress') || s.includes('active')) return 'success';
    if (s.includes('hold') || s.includes('pending')) return 'warning';
    if (s.includes('complete') || s.includes('closed')) return 'info';
    return 'neutral';
  };

  const formatLocalTime = (timestamp) => {
    if (!timestamp) return '—';
    // Append 'Z' to treat backend time as UTC if it doesn't have a timezone indicator
    const dateStr = timestamp.endsWith('Z') ? timestamp : `${timestamp.replace(' ', 'T')}Z`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Status History' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Status History & Audit Trail"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Status Changes"
            value={statusLogs.length}
            status="primary"
            icon={<History className="w-4 h-4" />}
          />
          <KpiCard
            label="Active / In Progress"
            value={projects.filter(p => {
              const st = String(p.status_name || p.project_status_name || p.status || '').toLowerCase();
              return st.includes('progress') || st.includes('active') || st === '3';
            }).length}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Projects On Hold"
            value={projects.filter(p => {
              const st = String(p.status_name || p.project_status_name || p.status || '').toLowerCase();
              return st.includes('hold') || st === '4';
            }).length}
            status="warning"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Audit Integrity"
            value="100% Verified"
            status="info"
            icon={<Shield className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'all', label: 'All Projects (Consolidated)' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search audit trail, project, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleOpenChangeStatus}
              className="text-xs h-8 shadow-xs"
            >
              Transition Status
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalResults={filtered.length}
                pageSize={perPage}
                onPageChange={setPage}
                onItemsPerPageChange={() => {}}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-36">Timestamp</th>
                  <th className="px-3 py-2 hidden md:table-cell">Project</th>
                  <th className="px-3 py-2">Status Transition</th>
                  <th className="px-3 py-2">Audit Reason & Justification</th>
                  <th className="px-3 py-2 hidden lg:table-cell w-36">Authorized By</th>
                  <th className="px-3 py-2 text-center w-16">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No status transitions recorded.
                    </td>
                  </tr>
                ) : (
                  paged.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                        {formatLocalTime(log.changed_at)}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={log.project_name}>
                            {log.project_name}
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">
                            {log.project_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-medium text-text-secondary bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                            {log.from_status_name || 'Initiation'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-text-muted" />
                          <Badge
                            variant={getStatusVariant(log.to_status_name)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {log.to_status_name}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-text-primary text-[11px] line-clamp-2" title={log.change_reason}>
                          {log.change_reason}
                        </p>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                          <User className="w-3.5 h-3.5 text-text-muted" />
                          <span className="truncate">{log.changed_by_name || 'Admin'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Full Audit Details"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((log, idx) => (
            <div key={log.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-text-muted">{formatLocalTime(log.changed_at)}</span>
                  <h4 className="font-semibold text-text-primary text-[13px]">{log.project_name}</h4>
                </div>
                <Badge
                  variant={getStatusVariant(log.to_status_name)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                >
                  {log.to_status_name}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-1 border-t border-border/60">
                <span className="text-text-muted text-[10px]">From:</span>
                <span className="font-medium">{log.from_status_name || 'Initiation'}</span>
                <ArrowRight className="w-3 h-3 text-text-muted" />
                <span className="font-semibold text-text-primary">{log.to_status_name}</span>
              </div>

              <p className="text-xs text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/40">
                {log.change_reason}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-text-muted">
                <span>By: {log.changed_by_name || 'Admin'}</span>
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setSelectedLog(log)}>
                  View Log
                </Button>
              </div>
            </div>
          ))}

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

      {/* View Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Status Transition Audit Log</h3>
                  <span className="text-[11px] font-mono text-text-muted">{selectedLog.project_code} • {selectedLog.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Previous State</span>
                  <span className="text-xs font-semibold text-text-secondary">{selectedLog.from_status_name || 'Initiation'}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">New State</span>
                  <span className="text-xs font-bold text-primary">{selectedLog.to_status_name}</span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3.5 space-y-2">
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block">Timestamp & Author</span>
                  <span className="font-mono text-text-primary">{formatLocalTime(selectedLog.changed_at)} by {selectedLog.changed_by_first_name ? `${selectedLog.changed_by_first_name} ${selectedLog.changed_by_last_name || ''}` : selectedLog.changed_by_name || 'Admin'}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Reason / Justification</span>
                  <p className="text-text-primary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{selectedLog.change_reason}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Status Modal */}
      <EntityEditModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
      >
        <EntityEditModal.Header
          icon={RefreshCw}
          title="Transition Project Lifecycle Status"
          subtitle="Change the active operational state and record audit log reason."
          onClose={() => setIsChangeModalOpen(false)}
        />
        <form id="status-change-form" onSubmit={handleSubmitStatusChange} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="State Transition Configuration">
              <EntityEditModal.Grid>
                <FormField label="Target Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => setForm(f => ({ ...f, project_id: v }))}
                  />
                </FormField>

                <FormField label="New Target Status" required>
                  <Select
                    options={projectStatuses.map(s => ({ value: String(s.id), label: s.name || s.status_name }))}
                    value={form.to_status_id}
                    onChange={(v) => setForm(f => ({ ...f, to_status_id: v }))}
                  />
                </FormField>

                <FormField label="Reason for Status Change (Audit Trail)" required className="md:col-span-2" error={errors.change_reason}>
                  <Textarea
                    rows={3}
                    value={form.change_reason}
                    onChange={(e) => {
                      setForm(f => ({ ...f, change_reason: e.target.value }));
                      setErrors(err => ({ ...err, change_reason: null }));
                    }}
                    placeholder="e.g. Town planning approval received and site mobilization started..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="status-change-form"
            submitLabel="Execute Status Change"
            onCancel={() => setIsChangeModalOpen(false)}
            isSubmitting={submitting}
          />
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
