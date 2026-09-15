import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, 
  Search, Eye, Edit, Trash2, Plus, 
  Printer
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, dailyReportsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data && typeof res.data === 'object') {
    for (const key in res.data) {
      if (Array.isArray(res.data[key])) return res.data[key];
    }
  }
  if (res && typeof res === 'object') {
    for (const key in res) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
};

const EMPTY_FORM = {
  project_id: '',
  report_id: '',
  issue_no: '',
  title: '',
  description: '',
};

export function DailyIssuesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const projRes = await projectsApi.list();
      const pList = extractArray(projRes);
      setProjects(pList);

      if (dailyReportsApi?.list) {
        const dprRes = await dailyReportsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
        const rList = extractArray(dprRes);
        setReports(rList);

        let allIssues = [];
        for (const r of rList.slice(0, 20)) {
          try {
            const issuesRes = await dailyReportsApi.issues.list(r.id);
            const issList = extractArray(issuesRes);
            const withMeta = issList.map(i => ({ 
              ...i, 
              report_id: r.id, 
              project_id: r.project_id, 
              date: r.report_date, 
              project_code: r.project_code,
              site_name: r.site_name || 'Site'
            }));
            allIssues = [...allIssues, ...withMeta];
          } catch (e) { /* ignore */ }
        }
        setIssues(allIssues);
      }
    } catch (e) {
      console.error(e);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      report_id: '',
      issue_no: `ISS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      report_id: String(item.report_id || ''),
      issue_no: item.issue_no || '',
      title: item.title || '',
      description: item.description || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.report_id) errs.report_id = 'Daily Report is required';
    if (!form.issue_no.trim()) errs.issue_no = 'Issue No is required';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        issue_no: form.issue_no,
        title: form.title,
        description: form.description,
        // Fallbacks for strictly validated DB fields
        issue_type_id: 1,
        priority_id: 1,
        work_impact_id: 1,
        status_id: 1,
        reported_by: user?.id || 1,
        assigned_to: user?.id || 1,
      };

      if (editingItem?.id) {
        await dailyReportsApi.issues.update(form.report_id, editingItem.id, payload);
        toast.success('Site issue updated.');
      } else {
        await dailyReportsApi.issues.create(form.report_id, payload);
        toast.success('Site issue logged.');
      }

      loadData();
      setIsAddOpen(false);
      setEditingItem(null);
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
        toast.error(Object.values(err.errors).flat().join('\n') || 'Validation failed.');
      } else {
        toast.error(err?.message || 'Failed to save issue.');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id || !deleteItem?.report_id) return;
    try {
      await dailyReportsApi.issues.remove(deleteItem.report_id, deleteItem.id);
      toast.success('Issue removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to remove issue.');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return issues.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(i.issue_no || '').toLowerCase();
        const tit = String(i.title || '').toLowerCase();
        if (!no.includes(s) && !tit.includes(s)) return false;
      }
      return true;
    });
  }, [issues, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <PageContainer>
      <PageHeader
        title="Site Obstacles, Delays & Issues"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Daily Site Operations', href: '/daily-operations/reports' },
          { label: 'Site Obstacles & Issues' }
        ]}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Logged Issues"
            value={issues.length}
            status="primary"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search issue no, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Log Site Obstacle
            </Button>
          </div>
        </div>

        {/* Table */}
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
                  <th className="px-3 py-2 w-28">Issue Ref</th>
                  <th className="px-3 py-2">Site & Date</th>
                  <th className="px-3 py-2">Issue Title & Description</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-text-muted text-[12px]">Loading site obstacles...</td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-text-muted text-[12px]">No site issues found matching criteria.</td>
                  </tr>
                ) : (
                  paged.map((i, idx) => (
                    <tr key={i.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + idx + 1}</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {i.issue_no}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[11px] block">{i.site_name}</span>
                        <span className="text-[10px] text-text-muted">{i.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.title}>{i.title}</span>
                          <span className="text-[11px] text-text-muted truncate max-w-[300px]" title={i.description}>{i.description}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleOpenEdit(i)}>
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setDeleteItem(i); confirmDelete(); }}>
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>
      </div>

      {/* Add / Edit Issue Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={AlertTriangle}
          title={editingItem ? 'Edit Site Issue' : 'Log Site Obstacle / Incident'}
          subtitle="Record site delays and safety hazards."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Context">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>
                <FormField label="Daily Site Report (Site Context)" required error={errors.report_id}>
                  <Select
                    options={[
                      { value: '', label: 'Select Daily Report...' },
                      ...reports.filter(r => String(r.project_id) === form.project_id).map(r => ({ value: String(r.id), label: `${r.report_date} - ${r.site_name || 'Report'}` }))
                    ]}
                    value={form.report_id}
                    onChange={(v) => handleFormChange('report_id', v)}
                    disabled={!form.project_id}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Issue Details">
              <EntityEditModal.Grid>
                <FormField label="Issue Reference Number" required error={errors.issue_no} className="md:col-span-2">
                  <Input value={form.issue_no} onChange={(e) => handleFormChange('issue_no', e.target.value)} />
                </FormField>
                <FormField label="Title / Short Summary" required error={errors.title} className="md:col-span-2">
                  <Input value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} />
                </FormField>
                <FormField label="Description / Resolution" required error={errors.description} className="md:col-span-2">
                  <Textarea value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} rows={4} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button variant="outline" type="button" onClick={() => { setIsAddOpen(false); setEditingItem(null); }} disabled={saving}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              {saving ? 'Saving...' : 'Save Issue'}
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
