import { useState, useEffect, useMemo } from 'react';
import { UnderDevelopment } from '../../masters/pages/UnderDevelopment';
import {
  FileText, Upload, Download, Eye, Edit, Trash2, Search, Filter,
  FileCode, FileSpreadsheet, Image, File, CheckCircle2, Clock,
  ShieldCheck, Plus, Briefcase, Calendar, MapPin, Camera, Truck
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
import { sitesApi, projectsApi, projectDocumentsApi, request } from '../../../api/apiservice';

const SITE_DOC_CATEGORIES = [
  { id: 'all', name: 'All Field Documents' },
  { id: 'photos', name: 'Site Progress Photos & Inspection Snaps' },
  { id: 'dsr', name: 'Daily Site Reports (DSR) & Logs' },
  { id: 'testing', name: 'Cube Test & Material Lab Reports' },
  { id: 'challans', name: 'Gate Passes & Delivery Challans' },
  { id: 'safety', name: 'HSE Tool-box Talk & Safety Audits' },
  { id: 'possession', name: 'Site Handover & Clearances' },
];



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  location_name: '',
  document_title: '',
  document_number: '',
  category_id: 'photos',
  document_date: '',
  original_file_name: '',
  file_extension: 'pdf',
  status_name: 'Verified',
  remarks: '',
  file: null,
};

export function SiteDocumentsPage() {
  return (
    <UnderDevelopment 
      title="Site Documents" 
      featureName="Site Documents" 
    />
  );
}

// Keeping the original code for future development as requested
function SiteDocumentsPage_OLD() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
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

  // Load Projects & Sites
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      sitesApi.list().catch(() => ({ data: { sites: [] } })),
    ]).then(([pRes, sRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const sList = sRes?.data?.sites ?? sRes?.sites ?? (Array.isArray(sRes?.data) ? sRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setSites(Array.isArray(sList) ? sList : []);
    });
  }, []);

  // Fetch Documents from API
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = { per_page: 1000, all: true };
      if (selectedSiteId !== 'all') params.site_id = selectedSiteId;
      if (selectedProjectId !== 'all') params.project_id = selectedProjectId;
      const res = await projectDocumentsApi.list(params);
      const list = res?.data?.project_documents ?? res?.data?.documents ?? res?.data?.data ?? res?.data ?? (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setDocuments(list);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to fetch site documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedProjectId, selectedSiteId]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = selectedSiteId !== 'all' ? selectedSiteId : (availableSites[0]?.id ? String(availableSites[0].id) : (sites[0]?.id ? String(sites[0].id) : '1'));

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      site_id: defaultSite,
      document_number: `DOC-SITE-00${documents.length + 1}`,
      document_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setForm({
      project_id: String(doc.project_id || '1'),
      site_id: String(doc.site_id || '1'),
      location_name: doc.location_name || '',
      document_title: doc.document_title || '',
      document_number: doc.document_number || '',
      category_id: doc.category_id || 'photos',
      document_date: doc.document_date ? doc.document_date.split(' ')[0] : '',
      original_file_name: doc.original_file_name || '',
      file_extension: doc.file_extension || 'pdf',
      status_name: doc.status_name || 'Verified',
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
    if (!form.document_title.trim()) errs.document_title = 'Document title is required';
    if (!form.document_number.trim()) errs.document_number = 'Document number is required';
    if (!form.site_id) errs.site_id = 'Site is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedSite = sites.find(s => String(s.id) === String(form.site_id));
      const catObj = SITE_DOC_CATEGORIES.find(c => c.id === form.category_id);
      const docTypeId = 2; // Site Documents

      let payload;
      
      const catIdMap = { 'photos': 1, 'dsr': 2, 'testing': 3, 'challans': 4, 'safety': 5, 'possession': 6 };
      let catId = Number(form.category_id);
      if (isNaN(catId)) catId = catIdMap[form.category_id] || 1;

      if (form.file) {
        payload = new FormData();
        Object.entries(form).forEach(([key, val]) => {
          if (key !== 'file' && val !== null && val !== undefined && key !== 'category_id') {
            payload.append(key, val);
          }
        });
        payload.append('document_type_id', 2);
        payload.append('category_id', catId);
        payload.append('project_document_category_id', catId);
        payload.append('client_document_status_id', form.status_name === 'Verified' ? 2 : 1);
        payload.append('project_document_status_id', form.status_name === 'Verified' ? 2 : 1);
        payload.append('status_id', form.status_name === 'Verified' ? 2 : 1);
        payload.append('document_file', form.file);
      } else {
        payload = {
          project_id: form.project_id,
          site_id: form.site_id || null,
          document_type_id: 2,
          category_id: catId,
          project_document_category_id: catId,
          location_name: form.location_name || '',
          document_title: form.document_title,
          document_number: form.document_number,
          revision_number: 'R0',
          document_date: form.document_date || null,
          original_file_name: form.original_file_name || `${form.document_number}.${form.file_extension}`,
          file_extension: form.file_extension || 'pdf',
          status_name: form.status_name || 'Verified',
          client_document_status_id: form.status_name === 'Verified' ? 2 : 1,
          project_document_status_id: form.status_name === 'Verified' ? 2 : 1,
          status_id: form.status_name === 'Verified' ? 2 : 1,
          remarks: form.remarks || '',
        };
      }

      if (editingDoc?.id) {
        if (form.file) {
          payload.append('_method', 'PATCH');
          const res = await request.post(`/project-documents/${encodeURIComponent(editingDoc.id)}`, payload);
          const updated = res?.data?.document ?? res?.data?.data ?? res?.data ?? res ?? Object.fromEntries(payload.entries());
          setDocuments(prev => prev.map(d => String(d.id) === String(editingDoc.id) ? { ...d, ...updated } : d));
        } else {
          const res = await projectDocumentsApi.update(editingDoc.id, payload);
          const updated = res?.data?.document ?? res?.data?.data ?? res?.data ?? res ?? payload;
          setDocuments(prev => prev.map(d => String(d.id) === String(editingDoc.id) ? { ...d, ...updated } : d));
        }
        toast.success('Site document updated.');
      } else {
        const res = await projectDocumentsApi.create(payload);
        const created = res?.data?.data ?? res?.data ?? res ?? (form.file ? Object.fromEntries(payload.entries()) : payload);
        setDocuments(prev => [created, ...prev]);
        toast.success('Site document archived successfully.');
      }

      setIsAddOpen(false);
      setEditingDoc(null);
      await fetchDocuments();
    } catch (error) {
      console.error('Upload Error:', error);
      let errMsg = error?.message || 'Failed to save document.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteDoc?.id) return;
    setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
    toast.success('Site document deleted.');
    setDeleteDoc(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return documents.filter(doc => {
      // Exclude documents that do NOT have a site_id (those belong to Project Documents)
      if (!doc.site_id) return false;

      if (selectedProjectId !== 'all' && String(doc.project_id) !== String(selectedProjectId)) return false;
      if (selectedSiteId !== 'all' && String(doc.site_id) !== String(selectedSiteId)) return false;
      if (activeCategory !== 'all' && doc.category_id !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        const title = (doc.document_title || '').toLowerCase();
        const number = (doc.document_number || '').toLowerCase();
        const sName = (doc.site_name || '').toLowerCase();
        const file = (doc.original_file_name || '').toLowerCase();
        if (!title.includes(q) && !number.includes(q) && !sName.includes(q) && !file.includes(q)) return false;
      }
      return true;
    });
  }, [documents, selectedProjectId, selectedSiteId, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const photosCount = useMemo(() => documents.filter(d => d.category_id === 'photos' || (d.file_extension || '').includes('jpg') || (d.file_extension || '').includes('png')).length, [documents]);
  const reportsCount = useMemo(() => documents.filter(d => d.category_id === 'dsr' || d.category_id === 'testing').length, [documents]);
  const challansCount = useMemo(() => documents.filter(d => d.category_id === 'challans').length, [documents]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  const getFileIcon = (ext) => {
    const e = String(ext || '').toLowerCase();
    if (e.includes('jpg') || e.includes('jpeg') || e.includes('png')) return <Camera className="w-4 h-4 text-amber-500" />;
    if (e.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (e.includes('xls') || e.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    return <File className="w-4 h-4 text-text-secondary" />;
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites & Locations', href: '/sites' },
    { label: 'Site Documents' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Documents & Field Records"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Field Documents"
            value={documents.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Inspection Photos & Snaps"
            value={photosCount}
            status="info"
            icon={<Camera className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="DSR & Test Reports"
            value={reportsCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Gate Challans Logged"
            value={challansCount}
            status="neutral"
            icon={<Truck className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Site Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSiteId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Sites (Consolidated)' },
                  ...sites
                    .filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId))
                    .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))
                ]}
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search title, doc#, challan..."
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
          {SITE_DOC_CATEGORIES.map(cat => (
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
                  <th className="px-3 py-2">Document Title & Ref No.</th>
                  <th className="px-3 py-2 hidden md:table-cell">Site Location</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Document Category</th>
                  <th className="px-3 py-2 hidden md:table-cell">Date</th>
                  <th className="px-3 py-2 text-right w-24">File Size</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site field documents...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No site documents found in this category.
                    </td>
                  </tr>
                ) : (
                  paged.map((doc, idx) => (
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
                          <span className="text-text-primary text-[11px] font-medium truncate" title={doc.site_name}>
                            {doc.site_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {doc.location_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="text-text-secondary text-[11px] bg-surface-muted px-2 py-0.5 rounded border border-border truncate block" title={doc.category_name}>
                          {doc.category_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {doc.document_date || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {formatFileSize(doc.file_size_bytes)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {doc.status_name}
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
                            onClick={() => toast.success(`Downloading ${doc.original_file_name}...`)}
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
                            title="Delete"
                            onClick={() => setDeleteDoc(doc)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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
          {paged.map((doc, idx) => (
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
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {doc.status_name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Site Location</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{doc.site_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">File Size</span>
                  <span className="font-mono text-text-secondary text-[11px]">{formatFileSize(doc.file_size_bytes)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{doc.document_date || '—'}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingDoc(doc)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast.success(`Downloading ${doc.original_file_name}...`)}>
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
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
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Site</span> <span className="font-semibold text-text-primary">{viewingDoc.site_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Category</span> <span className="font-medium text-primary">{viewingDoc.category_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Name</span> <span className="font-mono text-text-primary break-all">{viewingDoc.original_file_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Size</span> <span className="font-mono">{formatFileSize(viewingDoc.file_size_bytes)}</span></div>
              </div>

              {viewingDoc.remarks && (
                <div className="border border-border rounded-lg p-3">
                  <span className="text-text-muted block mb-0.5 font-bold">Remarks & Inspection Findings:</span>
                  <p className="text-text-secondary">{viewingDoc.remarks}</p>
                </div>
              )}
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
          title={editingDoc ? 'Edit Site Field Record' : 'Upload Site Document / Photo'}
          subtitle="Archive daily progress photos, DSR reports, lab test cubes, and gate challans."
          onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
        />
        <form id="site-doc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Record Routing">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const s = sites.find(item => String(item.project_id) === String(v));
                      if (s) handleFormChange('site_id', String(s.id));
                    }}
                  />
                </FormField>

                <FormField label="Parent Site" required error={errors.site_id}>
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                  />
                </FormField>

                <FormField label="Document Category" required>
                  <Select
                    options={SITE_DOC_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id}
                    onChange={(v) => handleFormChange('category_id', v)}
                  />
                </FormField>

                <FormField label="Record / Challan Number" required error={errors.document_number}>
                  <Input
                    value={form.document_number}
                    onChange={(e) => handleFormChange('document_number', e.target.value)}
                    placeholder="e.g. DSR-SITE-014 or DC-STEEL-88"
                  />
                </FormField>

                <FormField label="Document Title" required className="md:col-span-2" error={errors.document_title}>
                  <Input
                    value={form.document_title}
                    onChange={(e) => handleFormChange('document_title', e.target.value)}
                    placeholder="e.g. Raft Concrete Pouring Progress Photo"
                  />
                </FormField>

                <FormField label="Specific Location / Grid Area">
                  <Input
                    value={form.location_name}
                    onChange={(e) => handleFormChange('location_name', e.target.value)}
                    placeholder="e.g. Basement 1 Grid B3-D5"
                  />
                </FormField>

                <FormField label="Date Recorded">
                  <Input
                    type="date"
                    value={form.document_date}
                    onChange={(e) => handleFormChange('document_date', e.target.value)}
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
                        handleFormChange('file_extension', file.name.split('.').pop());
                      }
                    }}
                  />
                  {editingDoc && <div className="text-xs text-text-muted mt-1">Leave empty to keep existing file.</div>}
                </FormField>

                <FormField label="Field Remarks & Findings" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                    placeholder="Field observations, quantity unloaded, temperature readings..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="site-doc-form"
            submitLabel={editingDoc ? 'Update Record' : 'Upload to Site'}
            onCancel={() => { setIsAddOpen(false); setEditingDoc(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteDoc)}
        title="Delete Site Document"
        message={`Are you sure you want to delete "${deleteDoc?.document_title}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDoc(null)}
      />
    </PageContainer>
  );
}
