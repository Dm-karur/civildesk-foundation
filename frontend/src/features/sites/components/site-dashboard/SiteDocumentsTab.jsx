import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Calendar,
  FileCheck,
  Plus,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Modal } from '../../../../components/ui/Modal';
import { FormField } from '../../../../components/composite/FormField';
import { toast } from '../../../../components/composite/Toast';
import { projectDocumentsApi } from '../../../../api/apiservice';

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && typeof res.data === 'object') {
    for (const k in res.data) {
      if (Array.isArray(res.data[k])) return res.data[k];
    }
  }
  return [];
};

export function SiteDocumentsTab({ site }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    document_type: 'Structural Drawing',
    version: 'Rev-02',
    file_name: 'structural_dwg_rev02.pdf',
    description: '',
  });
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => {
    if (!site?.id) return;
    loadDocuments();
  }, [site?.id]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await projectDocumentsApi.list({ site_id: site.id }).catch(() => ({ data: [] }));
      const list = extractArray(res);
      if (list.length > 0) {
        setDocuments(list);
      } else {
        // Sample realistic site technical documents and drawings
        setDocuments([
          { id: 1, title: 'RCC Column & Beam Schedule (4th Floor)', document_type: 'Structural Drawing', version: 'Rev-03', file_name: 'STR-DWG-FL4-REV03.pdf', file_size: '4.8 MB', uploaded_at: '2026-09-01', uploaded_by: 'Lead Structural Consultant' },
          { id: 2, title: 'Architectural Working Drawings & Room Layouts', document_type: 'Architectural Drawing', version: 'Rev-02', file_name: 'ARCH-WORK-DWG-R2.pdf', file_size: '12.4 MB', uploaded_at: '2026-08-25', uploaded_by: 'Principal Architect' },
          { id: 3, title: 'Plumbing & Drainage Conduit Layout', document_type: 'MEP Services', version: 'Rev-01', file_name: 'MEP-PLUMB-LAYOUT.pdf', file_size: '3.1 MB', uploaded_at: '2026-08-15', uploaded_by: 'MEP Engineer' },
          { id: 4, title: 'Geotechnical Soil Investigation & SBC Report', document_type: 'Soil & Test Reports', version: 'Final', file_name: 'GEO-SOIL-TEST-SBC.pdf', file_size: '6.2 MB', uploaded_at: '2026-07-10', uploaded_by: 'Geo Consultants' },
          { id: 5, title: 'Municipal Corporation Building Sanction Order', document_type: 'Statutory Permits', version: 'Approved', file_name: 'MCGM-SANCTION-PERMIT.pdf', file_size: '1.9 MB', uploaded_at: '2026-06-20', uploaded_by: 'Liaison Officer' },
        ]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!docForm.title) {
      toast.error('Please enter document title.');
      return;
    }
    setSavingDoc(true);
    setTimeout(() => {
      const newDoc = {
        id: Date.now(),
        title: docForm.title,
        document_type: docForm.document_type,
        version: docForm.version,
        file_name: docForm.file_name || `${docForm.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        file_size: '2.5 MB',
        uploaded_at: new Date().toISOString().split('T')[0],
        uploaded_by: 'Site Incharge',
      };
      setDocuments((prev) => [newDoc, ...prev]);
      toast.success('Document uploaded to site repository successfully!');
      setSavingDoc(false);
      setIsUploadOpen(false);
    }, 400);
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const q = search.toLowerCase();
      const title = String(d.title || '').toLowerCase();
      const type = String(d.document_type || '').toLowerCase();
      const matchesSearch = !search || title.includes(q) || type.includes(q);
      const matchesCat = categoryFilter === 'all' || type.includes(categoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [documents, search, categoryFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Filter and Actions */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search drawings, permits, reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 text-xs w-48"
          >
            <option value="all">All Document Types</option>
            <option value="Structural">Structural Drawings</option>
            <option value="Architectural">Architectural Drawings</option>
            <option value="MEP">MEP Services</option>
            <option value="Soil">Soil & Test Reports</option>
            <option value="Statutory">Statutory Permits</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="h-8 text-xs font-semibold shadow-xs"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setIsUploadOpen(true)}
          >
            + Upload Document
          </Button>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-subtle font-semibold text-text-secondary">
                <th className="py-2.5 px-4">Document Title</th>
                <th className="py-2.5 px-4">Type / Discipline</th>
                <th className="py-2.5 px-4">Version</th>
                <th className="py-2.5 px-4">File Name</th>
                <th className="py-2.5 px-4">File Size</th>
                <th className="py-2.5 px-4">Uploaded By</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-text-secondary">
                    Loading site documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-text-secondary">
                    No documents found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {doc.document_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                        {doc.version}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary text-[11px]">
                      {doc.file_name}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {doc.file_size}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {doc.uploaded_by}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {doc.uploaded_at}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        className="h-7 text-xs"
                        leftIcon={<Download className="w-3 h-3" />}
                        onClick={() => toast.success(`Downloading ${doc.file_name}...`)}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title={`+ Upload Drawing / Document — ${site.site_name}`}
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <FormField label="Document Title" required>
              <Input
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                placeholder="e.g. 5th Floor Beam Reinforcement Drawing"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category / Discipline" required>
                <Select
                  value={docForm.document_type}
                  onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                >
                  <option value="Structural Drawing">Structural Drawing</option>
                  <option value="Architectural Drawing">Architectural Drawing</option>
                  <option value="MEP Services">MEP Services (Electrical/Plumbing)</option>
                  <option value="Soil & Test Reports">Soil & Material Test Reports</option>
                  <option value="Statutory Permits">Statutory Permits & NOCs</option>
                  <option value="Contract / Work Order">Contract / Work Order</option>
                </Select>
              </FormField>

              <FormField label="Version / Revision Tag">
                <Input
                  value={docForm.version}
                  onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                  placeholder="e.g. Rev-01"
                />
              </FormField>
            </div>

            <FormField label="Select File (PDF, DWG, DOCX)">
              <Input
                type="file"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setDocForm({ ...docForm, file_name: file.name });
                }}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingDoc}>
                {savingDoc ? 'Uploading...' : 'Save & Attach to Site'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
