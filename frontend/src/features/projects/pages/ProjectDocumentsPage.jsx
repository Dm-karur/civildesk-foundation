import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Upload, Download, Eye, Edit, Trash2, Search, Filter,
  FileCode, FileSpreadsheet, Image, File, CheckCircle2, Clock,
  AlertTriangle, ShieldCheck, Plus, Briefcase, Calendar, Layers, Tag
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
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, projectDocumentsApi, sitesApi, mastersApi, request } from '../../../api/apiservice';

const DOCUMENT_CATEGORIES = [
  { id: 'all', name: 'All Documents' },
  { id: 'drawings', name: 'Architectural & Structural Drawings' },
  { id: 'contracts', name: 'Contracts & Agreements' },
  { id: 'approvals', name: 'Permits & Municipal Approvals' },
  { id: 'qc', name: 'QA/QC & Test Reports' },
  { id: 'safety', name: 'HSE & Safety Clearances' },
];



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  document_title: '',
  document_number: '',
  document_type_id: '1',
  category_id: 'drawings',
  revision_number: 'R0',
  document_date: '',
  expiry_date: '',
  original_file_name: '',
  status_name: 'Approved',
  remarks: '',
  file: null,
};

export function ProjectDocumentsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(DOCUMENT_CATEGORIES);

  // Load Projects and Masters
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      mastersApi.all().catch(() => ({ data: {} }))
    ]).then(([pRes, mRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      
      const cats = mRes?.data?.document_types ?? mRes?.data?.project_document_types ?? mRes?.data?.project_document_categories ?? mRes?.data?.document_categories ?? mRes?.document_types ?? mRes?.project_document_categories ?? [];
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories([
          { id: 'all', name: 'All Documents' },
          ...cats.map(c => ({ id: String(c.id), name: c.name || c.category_name || c.code }))
        ]);
      }
    });
  }, []);

  // Fetch Documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = selectedProjectId !== 'all' ? { project_id: selectedProjectId, per_page: 1000, all: true } : { per_page: 1000, all: true };
      const res = await projectDocumentsApi.list(params);
      const list = res?.data?.project_documents ?? res?.data?.documents ?? res?.project_documents ?? res?.documents ?? res?.data?.data ?? res?.data ?? res ?? [];
      setDocuments(Array.isArray(list) ? list : []);
    } catch (error) {
      setDocuments([]);
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedProjectId]);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({
      ...EMPTY_FORM,
      project_id: selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1'),
      category_id: categories.length > 1 ? categories[1].id : 'drawings',
      document_type_id: categories.length > 1 ? categories[1].id : '1',
      document_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc) => {
    const docCatId = doc.category_id || doc.project_document_category_id || doc.document_type_id;
    setForm({
      project_id: String(doc.project_id || '1'),
      site_id: String(doc.site_id || ''),
      document_title: doc.document_title || '',
      document_number: doc.document_number || '',
      document_type_id: String(doc.document_type_id || '1'),
      category_id: docCatId ? String(docCatId) : 'drawings',
      revision_number: doc.revision_number || 'R0',
      document_date: doc.document_date ? doc.document_date.split(' ')[0] : '',
      expiry_date: doc.expiry_date ? doc.expiry_date.split(' ')[0] : '',
      original_file_name: doc.original_file_name || '',
      file_extension: doc.file_extension || 'pdf',
      status_name: doc.status_name || 'Approved',
      remarks: doc.remarks || '',
    });
    setErrors({});
    setEditingDoc(doc);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.document_title.trim()) errs.document_title = 'Title is required';
    if (!form.document_number.trim()) errs.document_number = 'Document number is required';
    if (!form.project_id) errs.project_id = 'Project is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      // Safely map string fallback categories to integers to satisfy backend validation
      const CATEGORY_MAP = { 'drawings': 1, 'contracts': 2, 'approvals': 3, 'qc': 4, 'safety': 5 };
      
      let docTypeId = 1;
      let projCatId = 1;
      
      if (CATEGORY_MAP[form.category_id]) {
        projCatId = CATEGORY_MAP[form.category_id];
      } else {
        docTypeId = Number(form.category_id) || 1;
        projCatId = 1; // Fallback to 1 to satisfy CodeIgniter's strict category validation
      }

      let payload;
      if (form.file) {
        payload = new FormData();
        payload.append('project_id', form.project_id);
        if (form.site_id) payload.append('site_id', form.site_id);
        payload.append('document_type_id', docTypeId);
        payload.append('project_document_category_id', projCatId);
        payload.append('document_title', form.document_title);
        payload.append('document_number', form.document_number);
        payload.append('revision_number', form.revision_number || 'R0');
        if (form.document_date) payload.append('document_date', form.document_date);
        if (form.expiry_date) payload.append('expiry_date', form.expiry_date);
        payload.append('original_file_name', form.original_file_name || `${form.document_number}.${form.file_extension}`);
        payload.append('file_extension', form.file_extension || 'pdf');
        payload.append('status_name', form.status_name || 'Approved');
        payload.append('client_document_status_id', form.status_name === 'Approved' ? 2 : 1);
        payload.append('project_document_status_id', form.status_name === 'Approved' ? 2 : 1);
        payload.append('status_id', form.status_name === 'Approved' ? 2 : 1);
        payload.append('remarks', form.remarks || '');
        payload.append('file', form.file);
        payload.append('document_file', form.file);
      } else {
        payload = {
          project_id: form.project_id,
          site_id: form.site_id || null,
          document_type_id: docTypeId,
          project_document_category_id: projCatId,
          document_title: form.document_title,
          document_number: form.document_number,
          revision_number: form.revision_number || 'R0',
          document_date: form.document_date || null,
          expiry_date: form.expiry_date || null,
          original_file_name: form.original_file_name || `${form.document_number}.${form.file_extension}`,
          file_extension: form.file_extension || 'pdf',
          status_name: form.status_name || 'Approved',
          client_document_status_id: form.status_name === 'Approved' ? 2 : 1,
          project_document_status_id: form.status_name === 'Approved' ? 2 : 1,
          status_id: form.status_name === 'Approved' ? 2 : 1,
          remarks: form.remarks || '',
        };
      }

      if (editingDoc?.id) {
        if (form.file) {
          // Laravel requires POST with _method=PATCH to correctly parse multipart/form-data
          payload.append('_method', 'PATCH');
          const res = await request.post(`/project-documents/${encodeURIComponent(editingDoc.id)}`, payload);
          const updated = res?.data?.document ?? res?.data?.data ?? res?.data ?? res ?? Object.fromEntries(payload.entries());
          setDocuments(prev => prev.map(d => String(d.id) === String(editingDoc.id) ? { ...d, ...updated } : d));
        } else {
          const res = await projectDocumentsApi.update(editingDoc.id, payload);
          const updated = res?.data?.document ?? res?.data?.data ?? res?.data ?? res ?? payload;
          setDocuments(prev => prev.map(d => String(d.id) === String(editingDoc.id) ? { ...d, ...updated } : d));
        }
        toast.success('Document updated successfully.');
      } else {
        const res = await projectDocumentsApi.create(payload);
        const created = res?.data?.data ?? res?.data ?? res ?? (form.file ? Object.fromEntries(payload.entries()) : payload);
        setDocuments(prev => [created, ...prev]);
        toast.success('Document uploaded successfully.');
      }

      setIsAddOpen(false);
      setEditingDoc(null);
      await fetchDocuments();
    } catch (error) {
      console.error('Upload Error:', error);
      let errMsg = error?.message || 'Failed to save document.';
      const validationErrors = error?.errors || error?.response?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        const firstError = Array.isArray(Object.values(validationErrors)[0]) 
          ? Object.values(validationErrors)[0][0] 
          : Object.values(validationErrors)[0];
        errMsg = `${errMsg}: ${firstError}`;
      }
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDoc?.id) return;
    try {
      await projectDocumentsApi.remove(deleteDoc.id);
      setDocuments(prev => prev.filter(d => String(d.id) !== String(deleteDoc.id)));
      toast.success('Document deleted.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete document.');
    } finally {
      setDeleteDoc(null);
    }
  };

  const handleDownload = async (doc) => {
    if (!doc?.id) return;
    toast.info(`Downloading ${doc.original_file_name || 'document'}...`);
    try {
      const blob = await projectDocumentsApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_file_name || `document-${doc.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.message || 'Failed to download document.');
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return documents.filter(doc => {
      // Exclude documents that have a site_id (those belong to Site Documents)
      if (doc.site_id) return false;

      if (selectedProjectId !== 'all' && String(doc.project_id) !== String(selectedProjectId)) return false;
      
      if (activeCategory !== 'all') {
        const CATEGORY_MAP = { 'drawings': '1', 'contracts': '2', 'approvals': '3', 'qc': '4', 'safety': '5' };
        const expectedId = CATEGORY_MAP[activeCategory] || activeCategory;
        const docCatId = String(doc.category_id || doc.document_type_id || doc.project_document_category_id);
        if (docCatId !== expectedId && docCatId !== activeCategory) return false;
      }
      
      if (search) {
        const q = search.toLowerCase();
        const title = (doc.document_title || '').toLowerCase();
        const number = (doc.document_number || '').toLowerCase();
        const code = (doc.project_code || '').toLowerCase();
        const pName = (doc.project_name || '').toLowerCase();
        const file = (doc.original_file_name || '').toLowerCase();
        if (!title.includes(q) && !number.includes(q) && !code.includes(q) && !pName.includes(q) && !file.includes(q)) return false;
      }
      return true;
    });
  }, [documents, selectedProjectId, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const drawingsCount = useMemo(() => documents.filter(d => d.category_id === 'drawings' || (d.file_extension || '').includes('dwg')).length, [documents]);
  const approvedCount = useMemo(() => documents.filter(d => (d.status_name || '').toLowerCase().includes('approved')).length, [documents]);
  const complianceCount = useMemo(() => documents.filter(d => d.category_id === 'approvals' || d.category_id === 'safety').length, [documents]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  const getFileIcon = (ext) => {
    const e = String(ext || '').toLowerCase();
    if (e.includes('dwg') || e.includes('cad') || e.includes('dxf')) return <FileCode className="w-4 h-4 text-sky-500" />;
    if (e.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (e.includes('xls') || e.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (e.includes('png') || e.includes('jpg') || e.includes('jpeg')) return <Image className="w-4 h-4 text-amber-500" />;
    return <File className="w-4 h-4 text-text-secondary" />;
  };

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved') || s.includes('active')) return 'success';
    if (s.includes('review') || s.includes('pending')) return 'warning';
    if (s.includes('reject')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Documents' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Documents & Drawings"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Documents Tracked"
            value={documents.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Drawings & CAD Models"
            value={drawingsCount}
            status="info"
            icon={<FileCode className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Approved & Executable"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Statutory Clearances"
            value={complianceCount}
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-amber-500" />}
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search title, drawing#, rev..."
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
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Upload Document
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
                  <th className="px-3 py-2">Document Title & Drawing No.</th>
                  <th className="px-3 py-2 hidden md:table-cell">Project</th>
                  <th className="px-3 py-2 text-center w-20">Revision</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Date & Validity</th>
                  <th className="px-3 py-2 text-right w-24">File Size</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading project documents...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No documents found in this category.
                    </td>
                  </tr>
                ) : (
                  paged.map((doc, idx) => {
                    const status = doc.status_name || 'Approved';
                    const docDate = doc.document_date ? doc.document_date.split(' ')[0] : '—';
                    const expiry = doc.expiry_date ? doc.expiry_date.split(' ')[0] : null;

                    return (
                      <tr key={doc.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                              {getFileIcon(doc.file_extension)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-text-primary text-[12px] truncate" title={doc.document_title}>
                                {doc.document_title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                <span className="font-mono font-semibold text-text-secondary">{doc.document_number}</span>
                                <span>•</span>
                                <span className="font-mono uppercase">{doc.file_extension}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex flex-col min-w-0">
                            <span className="text-text-primary text-[11px] font-medium truncate" title={doc.project_name}>
                              {doc.project_name}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              {doc.project_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-mono text-[11px] font-bold text-text-primary bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                            {doc.revision_number || 'R0'}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <div className="flex flex-col text-[11px] text-text-secondary font-mono">
                            <span>{docDate}</span>
                            {expiry && (
                              <span className="text-[10px] text-amber-600">Exp: {expiry}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                          {formatFileSize(doc.file_size_bytes)}
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
                              title="View Document Details"
                              onClick={() => setViewingDoc(doc)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Download File"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="w-3.5 h-3.5 text-text-secondary hover:text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Details"
                              onClick={() => handleOpenEdit(doc)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete Document"
                              onClick={() => setDeleteDoc(doc)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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
              Loading project documents...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No documents found.
            </div>
          ) : (
            paged.map((doc, idx) => {
              const status = doc.status_name || 'Approved';

              return (
                <div key={doc.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                        {getFileIcon(doc.file_extension)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{doc.document_title}</h4>
                        <span className="text-[11px] font-mono font-semibold text-text-secondary">{doc.document_number}</span>
                      </div>
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
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Revision</span>
                      <span className="font-mono font-semibold text-text-primary text-[11px]">{doc.revision_number || 'R0'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">File Size</span>
                      <span className="font-mono text-text-secondary text-[11px]">{formatFileSize(doc.file_size_bytes)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[10px] text-text-muted font-mono">{doc.document_date ? doc.document_date.split(' ')[0] : '—'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpenEdit(doc)}
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

      {/* View Document Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                  {getFileIcon(viewingDoc.file_extension)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-primary truncate">{viewingDoc.document_title}</h3>
                  <p className="text-[11px] text-text-secondary font-mono truncate">{viewingDoc.document_number}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Revision</span> <span className="font-mono font-bold text-text-primary">{viewingDoc.revision_number}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingDoc.status_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Name</span> <span className="font-mono text-text-primary break-all">{viewingDoc.original_file_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Size</span> <span className="font-mono">{formatFileSize(viewingDoc.file_size_bytes)}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                  <div><span className="text-text-muted">Project:</span> <span className="font-medium text-text-primary">{viewingDoc.project_name}</span></div>
                  <div><span className="text-text-muted">Category:</span> <span>{viewingDoc.document_type_name}</span></div>
                  <div><span className="text-text-muted">Date:</span> <span className="font-mono">{viewingDoc.document_date || '—'}</span></div>
                  <div><span className="text-text-muted">Expiry:</span> <span className="font-mono">{viewingDoc.expiry_date || 'None'}</span></div>
                </div>
                {viewingDoc.remarks && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-text-muted block mb-0.5">Remarks / Specifications:</span>
                    <p className="text-text-secondary">{viewingDoc.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => toast.success(`Downloading ${viewingDoc.original_file_name}...`)}
              >
                Download File
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Edit Document Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingDoc)}
        onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingDoc ? 'Edit Document Metadata' : 'Upload Project Document'}
          subtitle="Archive architectural drawings, contracts, approvals, and test reports."
          onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
        />
        <form id="project-doc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Document Identification">
              <EntityEditModal.Grid>
                <FormField label="Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Document Category" required>
                  <Select
                    options={categories.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id}
                    onChange={(v) => handleFormChange('category_id', v)}
                  />
                </FormField>

                <FormField label="Document / Drawing Number" required error={errors.document_number}>
                  <Input
                    value={form.document_number}
                    onChange={(e) => handleFormChange('document_number', e.target.value)}
                    placeholder="e.g. STR-FND-GFC-001"
                  />
                </FormField>

                <FormField label="Revision Number">
                  <Input
                    value={form.revision_number}
                    onChange={(e) => handleFormChange('revision_number', e.target.value)}
                    placeholder="e.g. R0, R1, Rev 2"
                  />
                </FormField>

                <FormField label="Document Title" required className="md:col-span-2" error={errors.document_title}>
                  <Input
                    value={form.document_title}
                    onChange={(e) => handleFormChange('document_title', e.target.value)}
                    placeholder="e.g. Structural GFC Drawing - Foundation Layout"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Dates & File Specifications">
              <EntityEditModal.Grid>
                <FormField label="Document Date">
                  <Input
                    type="date"
                    value={form.document_date}
                    onChange={(e) => handleFormChange('document_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Expiry Date (if applicable)">
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => handleFormChange('expiry_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Upload Document" required={!editingDoc} error={errors.file}>
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFormChange('file', file);
                        handleFormChange('original_file_name', file.name);
                        handleFormChange('file_extension', file.name.split('.').pop().toLowerCase());
                      }
                    }}
                  />
                  {editingDoc && <div className="text-xs text-text-muted mt-1">Leave empty to keep existing file.</div>}
                </FormField>

                <FormField label="Approval Status">
                  <Select
                    options={[
                      { value: 'Approved', label: 'Approved (GFC / Execution)' },
                      { value: 'Under Review', label: 'Under Review / Pending' },
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Superseded', label: 'Superseded / Archived' },
                    ]}
                    value={form.status_name}
                    onChange={(v) => handleFormChange('status_name', v)}
                  />
                </FormField>

                <FormField label="Remarks & Consultant Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                    placeholder="e.g. Approved for Good For Construction (GFC) by Lead Consultant."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="project-doc-form"
            submitLabel={editingDoc ? 'Update Metadata' : 'Upload Document'}
            onCancel={() => { setIsAddOpen(false); setEditingDoc(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteDoc)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDoc?.document_title}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDoc(null)}
      />
    </PageContainer>
  );
}
