import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Wrench,
  PackageX,
  CloudRain,
  Flame,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { toast } from '../../../../components/composite/Toast';

export function SiteIssuesTab({ site }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Report Issue Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    category: 'Material Shortage',
    priority: 'High',
    location: '4th Floor Slab Zone B',
    assigned_to: 'Procurement Head',
    target_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    description: '',
  });
  const [savingIssue, setSavingIssue] = useState(false);

  useEffect(() => {
    if (!site?.id) return;
    loadIssues();
  }, [site?.id]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      // Sample site blocker issues
      setIssues([
        {
          id: 1,
          issue_no: 'ISS-SITE-014',
          title: 'Fe500D 16mm Rebar Shortage for Beam C4',
          category: 'Material Shortage',
          priority: 'Critical',
          location: '4th Floor Slab Zone B',
          reported_date: new Date().toISOString().split('T')[0],
          reported_by: 'Site Engineer',
          assigned_to: 'Procurement Head',
          status: 'Open',
          description: 'Casting scheduled for tomorrow requires 2.5 MT 16mm steel. Stock exhausted on site.',
        },
        {
          id: 2,
          issue_no: 'ISS-SITE-013',
          title: 'Scaffolding Safety Railing Missing at Perimeter',
          category: 'Safety Hazard',
          priority: 'High',
          location: 'Level 3 Edge Façade',
          reported_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          reported_by: 'Safety Officer',
          assigned_to: 'Formwork Contractor',
          status: 'In Progress',
          description: 'Perimeter toe-boards and safety harness tie-off rope required before exterior plastering starts.',
        },
        {
          id: 3,
          issue_no: 'ISS-SITE-012',
          title: 'Honeycomb Honeycombing Detected in Column B2',
          category: 'Quality / QC Snag',
          priority: 'Medium',
          location: 'Column B2 Basement 1',
          reported_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
          reported_by: 'QA/QC Engineer',
          assigned_to: 'Civil Contractor',
          status: 'Resolved',
          description: 'Minor honeycombing after shutter stripping. Pressure grouting and polymer mortar repair executed.',
        },
        {
          id: 4,
          issue_no: 'ISS-SITE-011',
          title: 'Tower Crane Boom Motor Intermittent Trip',
          category: 'Machinery Breakdown',
          priority: 'High',
          location: 'Tower Crane #1',
          reported_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
          reported_by: 'Plant & Machinery Incharge',
          assigned_to: 'OEM Service Engineer',
          status: 'Resolved',
          description: 'Overload sensor calibrated and contactor replaced. Load test certified.',
        },
      ]);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load site issues.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = (id) => {
    setIssues((prev) =>
      prev.map((iss) => (iss.id === id ? { ...iss, status: 'Resolved' } : iss))
    );
    toast.success('Issue marked as resolved!');
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!issueForm.title) {
      toast.error('Please enter issue title.');
      return;
    }
    setSavingIssue(true);
    setTimeout(() => {
      const newIss = {
        id: Date.now(),
        issue_no: `ISS-SITE-${Math.floor(100 + Math.random() * 900)}`,
        title: issueForm.title,
        category: issueForm.category,
        priority: issueForm.priority,
        location: issueForm.location,
        reported_date: new Date().toISOString().split('T')[0],
        reported_by: 'Site Engineer',
        assigned_to: issueForm.assigned_to,
        status: 'Open',
        description: issueForm.description,
      };
      setIssues((prev) => [newIss, ...prev]);
      toast.success('Site blocker / issue reported successfully!');
      setSavingIssue(false);
      setIsReportOpen(false);
    }, 300);
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      const q = search.toLowerCase();
      const title = String(iss.title || '').toLowerCase();
      const no = String(iss.issue_no || '').toLowerCase();
      const matchesSearch = !search || title.includes(q) || no.includes(q);
      const matchesPriority = priorityFilter === 'all' || iss.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || iss.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [issues, search, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = issues.length;
    const critical = issues.filter((i) => i.priority === 'Critical' && i.status !== 'Resolved').length;
    const open = issues.filter((i) => i.status === 'Open' || i.status === 'In Progress').length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    return { total, critical, open, resolved };
  }, [issues]);

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-text-secondary">Total Site Issues</span>
          <span className="text-2xl font-bold text-text-primary mt-1">{stats.total}</span>
          <span className="text-[11px] text-text-muted">Lifetime logged</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-text-secondary">Critical Blockers</span>
          <span className={`text-2xl font-bold mt-1 ${stats.critical > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {stats.critical}
          </span>
          <span className="text-[11px] text-text-muted">Impacts concrete / milestones</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-text-secondary">Active Pending Resolution</span>
          <span className="text-2xl font-bold text-amber-600 mt-1">{stats.open}</span>
          <span className="text-[11px] text-text-muted">In progress</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-text-secondary">Resolved / Closed</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolved}</span>
          <span className="text-[11px] text-text-muted">Signed off</span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search issues, snags, tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 text-xs w-36"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs w-36"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsReportOpen(true)}
          >
            + Report Site Issue
          </Button>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-subtle font-semibold text-text-secondary">
                <th className="py-2.5 px-4">Issue No</th>
                <th className="py-2.5 px-4">Title & Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">Priority</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Assigned To</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredIssues.map((iss) => (
                <tr key={iss.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {iss.issue_no}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <p className="font-semibold text-text-primary">{iss.title}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5 truncate">{iss.description}</p>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {iss.category}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={iss.priority === 'Critical' ? 'error' : iss.priority === 'High' ? 'warning' : 'neutral'}>
                      {iss.priority}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {iss.location}
                  </td>
                  <td className="py-3 px-4 text-text-primary font-medium">
                    {iss.assigned_to}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={iss.status === 'Resolved' ? 'success' : iss.status === 'In Progress' ? 'warning' : 'error'}>
                      {iss.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {iss.status !== 'Resolved' ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        className="h-7 text-xs border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                        leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        onClick={() => handleResolveIssue(iss.id)}
                      >
                        Resolve
                      </Button>
                    ) : (
                      <span className="text-[11px] text-text-muted font-medium">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Issue Modal */}
      {isReportOpen && (
        <Modal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          title={`+ Report Site Blocker / Issue — ${site.site_name}`}
        >
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <FormField label="Issue Title / Summary" required>
              <Input
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                placeholder="e.g. 16mm rebar shortage on 4th floor"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category" required>
                <Select
                  value={issueForm.category}
                  onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                >
                  <option value="Material Shortage">Material Shortage</option>
                  <option value="Safety Hazard">Safety Hazard</option>
                  <option value="Quality / QC Snag">Quality / QC Snag</option>
                  <option value="Machinery Breakdown">Machinery Breakdown</option>
                  <option value="Labour Delay">Labour / Gang Shortage</option>
                  <option value="Drawing Clarification (RFI)">Drawing Clarification (RFI)</option>
                  <option value="Weather Delay">Weather Stoppage</option>
                </Select>
              </FormField>

              <FormField label="Priority" required>
                <Select
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                >
                  <option value="Critical">Critical (Work Stopped)</option>
                  <option value="High">High (Immediate Action Required)</option>
                  <option value="Medium">Medium (Attention within 24h)</option>
                  <option value="Low">Low (Snag list)</option>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Specific Location on Site" required>
                <Input
                  value={issueForm.location}
                  onChange={(e) => setIssueForm({ ...issueForm, location: e.target.value })}
                  placeholder="e.g. Zone B 4th Floor"
                />
              </FormField>

              <FormField label="Assign To (Role / Person)" required>
                <Input
                  value={issueForm.assigned_to}
                  onChange={(e) => setIssueForm({ ...issueForm, assigned_to: e.target.value })}
                  placeholder="e.g. Procurement Incharge"
                />
              </FormField>
            </div>

            <FormField label="Detailed Description / Impact" required>
              <Textarea
                rows={3}
                value={issueForm.description}
                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                placeholder="Explain the problem and immediate field action required..."
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingIssue}>
                {savingIssue ? 'Logging...' : 'Log Site Issue'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
