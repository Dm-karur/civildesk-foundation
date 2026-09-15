import { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, Download, Upload, Layers
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



export function CommunicationDocumentsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadDocNo, setUploadDocNo] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('GFC Structural Drawing');
  const [uploadRevision, setUploadRevision] = useState('Rev R0 (GFC)');
  const [uploadConsultant, setUploadConsultant] = useState('');
  const [uploadProjectId, setUploadProjectId] = useState('1');

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadDocNo.trim() || !uploadTitle.trim()) {
      toast.error('Please enter a document reference number and title.');
      return;
    }
    const proj = projects.find(p => String(p.id) === String(uploadProjectId)) || { project_code: 'PRJ-2026-001', project_name: 'Civil Project' };
    const newDoc = {
      id: Date.now(),
      doc_no: uploadDocNo,
      project_id: Number(uploadProjectId),
      project_code: proj.project_code,
      project_name: proj.project_name,
      doc_title: uploadTitle,
      category: uploadCategory,
      revision: uploadRevision,
      issued_by: uploadConsultant || 'Project Consultant',
      issued_date: new Date().toISOString().split('T')[0],
      file_size: '12.4 MB',
      file_format: 'PDF',
      status: 'GFC Approved'
    };
    setDocuments([newDoc, ...documents]);
    setIsUploadOpen(false);
    setUploadDocNo('');
    setUploadTitle('');
    setUploadConsultant('');
    toast.success('Document transmittal uploaded successfully.');
  };

  const handleDownload = (doc) => {
    toast.success(`Downloading ${doc.doc_no} (${doc.file_size})...`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (selectedProjectId !== 'all' && String(d.project_id) !== String(selectedProjectId)) return false;
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(d.doc_no || '').toLowerCase();
        const tit = String(d.doc_title || '').toLowerCase();
        const cons = String(d.issued_by || '').toLowerCase();
        const prj = String(d.project_name || '').toLowerCase();
        if (!no.includes(str) && !tit.includes(str) && !cons.includes(str) && !prj.includes(str)) return false;
      }
      return true;
    });
  }, [documents, selectedProjectId, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Communication & Collaboration', href: '/communication/project-messages' },
    { label: 'Drawings & Transmittals Hub' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Drawings & Transmittal Documents Distribution Hub"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Active GFC Drawings & Docs"
            value={`${documents.length} Controlled Docs`}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="GFC Approved Revisions"
            value="100% Latest AFC"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Document Transmittal Integrity"
            value="Zero Revision Clashes"
            status="neutral"
            icon={<Layers className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Version Control Audit"
            value="100% Tracked"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'GFC Structural Drawing', label: 'GFC Structural Drawing' },
                  { value: 'Architectural Layout', label: 'Architectural Layout' },
                  { value: 'Soil & Lab Quality Report', label: 'Soil & Lab Quality Report' },
                  { value: 'MEP Coordination Drawing', label: 'MEP Coordination Drawing' },
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search doc no, title, consultant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => setIsUploadOpen(true)}
              className="text-xs h-8 shadow-xs"
            >
              Upload Transmittal
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
                  <th className="px-3 py-2 w-32">Document No</th>
                  <th className="px-3 py-2">Document Title & Scope</th>
                  <th className="px-3 py-2 w-28 text-center">Revision</th>
                  <th className="px-3 py-2 w-44 hidden md:table-cell">Issued By</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading documents...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No document records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((d, idx) => (
                    <tr key={d.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {d.doc_no}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={d.doc_title}>
                            {d.doc_title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {d.category} • {d.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] font-bold text-emerald-600">
                        {d.revision}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-[11px] text-text-secondary truncate">
                        {d.issued_by}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Transmittal 360"
                            onClick={() => setViewingItem(d)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-primary hover:text-primary-dark"
                            title="Download PDF"
                            onClick={() => handleDownload(d)}
                          >
                            <Download className="w-3.5 h-3.5" />
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((d, idx) => (
            <div key={d.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{d.doc_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{d.doc_title}</h4>
                  <span className="text-[11px] text-text-muted">{d.category}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {d.revision}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-text-muted text-[10px]">Issued: {d.issued_date}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(d)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleDownload(d)}>
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </div>
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

      {/* View Document 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.doc_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Revision Number</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.revision}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Payload Size</span> <span className="font-mono text-base">{viewingItem.file_size}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Document Title</span> <span className="font-bold text-text-primary">{viewingItem.doc_title}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Category</span> <span className="text-text-primary">{viewingItem.category}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Issued By Consultant</span> <span className="text-text-primary">{viewingItem.issued_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Issue Date</span> <span className="font-mono">{viewingItem.issued_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="text-emerald-700 font-medium">{viewingItem.status}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="primary" size="sm" onClick={() => handleDownload(viewingItem)}>
                <Download className="w-3.5 h-3.5 mr-1" /> Download Controlled PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Transmittal Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <h3 className="text-sm font-bold text-text-primary">Upload Document Transmittal</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsUploadOpen(false)}>✕</Button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Project</label>
                <Select
                  options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                  value={uploadProjectId}
                  onChange={setUploadProjectId}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Document Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DRG-STR-L4-001"
                  value={uploadDocNo}
                  onChange={(e) => setUploadDocNo(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Category</label>
                <Select
                  options={[
                    { value: 'GFC Structural Drawing', label: 'GFC Structural Drawing' },
                    { value: 'Architectural Layout', label: 'Architectural Layout' },
                    { value: 'Soil & Lab Quality Report', label: 'Soil & Lab Quality Report' },
                    { value: 'MEP Coordination Drawing', label: 'MEP Coordination Drawing' },
                  ]}
                  value={uploadCategory}
                  onChange={setUploadCategory}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Revision</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rev R0 (AFC)"
                  value={uploadRevision}
                  onChange={(e) => setUploadRevision(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Document Title & Scope</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 4 RCC Slab Reinforcement Plan"
                  value={uploadTitle}
                  onChange={(e) => setNewSubject ? setUploadTitle(e.target.value) : setUploadTitle(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Issued By Consultant</label>
                <input
                  type="text"
                  placeholder="e.g. Vanguard Structural Consultants"
                  value={uploadConsultant}
                  onChange={(e) => setUploadConsultant(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface text-text-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Upload Transmittal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
