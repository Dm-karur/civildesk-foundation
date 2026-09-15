import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculator, ListTree, IndianRupee, Boxes, LineChart } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { boqApi, projectsApi } from '../../../api/apiservice';
import { RateAnalysisModal } from '../components/RateAnalysisModal';

export function PlannedRatesPage() {
  const [projects, setProjects] = useState([]);
  const [boqs, setBoqs] = useState([]);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedBoqId, setSelectedBoqId] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [rateModalItem, setRateModalItem] = useState(null);

  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      boqApi.list().catch(() => ({ data: { project_boqs: [] } })),
    ]).then(([pRes, bRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const bList = bRes?.data?.project_boqs ?? bRes?.project_boqs ?? (Array.isArray(bRes?.data) ? bRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setBoqs(Array.isArray(bList) ? bList : []);
    });
  }, []);

  useEffect(() => {
    if (selectedBoqId !== 'all') {
      boqApi.sections.list(Number(selectedBoqId)).then(res => {
        const list = res?.data?.boq_sections ?? res?.data?.sections ?? res?.data?.data ?? res?.sections ?? [];
        setSections(Array.isArray(list) ? list : []);
      }).catch(() => setSections([]));
    } else {
      setSections([]);
    }
  }, [selectedBoqId]);

  const fetchItems = useCallback(async () => {
    if (selectedBoqId === 'all') {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (selectedSectionId !== 'all') params.section_id = selectedSectionId;
      const res = await boqApi.items.list(Number(selectedBoqId), params);
      const list = res?.data?.boq_items ?? res?.data?.items ?? res?.data?.data ?? res?.items ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBoqId, selectedSectionId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    return items.filter(itm => {
      if (search) {
        const q = search.toLowerCase();
        const code = (itm.item_code || '').toLowerCase();
        const name = (itm.item_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q)) return false;
      }
      return true;
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'Planned Rates' }
  ];

  return (
    <PageContainer>
      <PageHeader title="Planned Rates (Rate Analysis)" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard label="Items Loaded" value={items.length} status="primary" icon={<Boxes className="w-4 h-4" />} />
          <KpiCard label="Sections" value={sections.length} status="info" icon={<ListTree className="w-4 h-4 text-sky-500" />} />
          <KpiCard label="Rate Analysis" value="Active" status="success" icon={<LineChart className="w-4 h-4 text-emerald-500" />} />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
              <Select
                options={[{ value: 'all', label: 'Select Project' }, ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedBoqId('all');
                  setSelectedSectionId('all');
                }}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={[{ value: 'all', label: 'Select Target BOQ' }, ...boqs.filter(b => selectedProjectId === 'all' || String(b.project_id) === String(selectedProjectId)).map(b => ({ value: String(b.id), label: `${b.boq_code} - ${b.boq_name}` }))]}
                value={selectedBoqId}
                onChange={(val) => {
                  setSelectedBoqId(val);
                  setSelectedSectionId('all');
                }}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={[{ value: 'all', label: 'All Sections' }, ...sections.map(s => ({ value: String(s.id), label: `${s.section_code} - ${s.section_name}` }))]}
                value={selectedSectionId}
                onChange={setSelectedSectionId}
              />
            </div>
            <div className="w-full sm:w-48">
              <SearchField placeholder="Search item..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {selectedBoqId === 'all' ? (
          <div className="p-8 text-center text-text-secondary border border-border rounded-lg bg-surface">
            Please select a Project and BOQ to begin rate analysis.
          </div>
        ) : (
          <DataTableContainer
            pagination={
              <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-28">Item Code</th>
                  <th className="px-3 py-2">Item Description</th>
                  <th className="px-3 py-2 w-20 text-center">UOM</th>
                  <th className="px-3 py-2 w-24 text-right">Quantity</th>
                  <th className="px-3 py-2 w-32 text-right">Current Rate (₹)</th>
                  <th className="px-3 py-2 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-center text-text-secondary italic">No items found matching the current filters.</td></tr>
                ) : paged.map((itm, index) => (
                  <tr key={itm.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 text-center text-text-secondary">{(page - 1) * perPage + index + 1}</td>
                    <td className="px-3 py-2 font-medium text-white">{itm.item_code}</td>
                    <td className="px-3 py-2 text-text-secondary truncate max-w-[200px]" title={itm.item_name}>{itm.item_name}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-sm bg-white/5 border border-border/50 text-[10px] text-text-secondary">{itm.uom_name || 'Units'}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400 font-medium">{Number(itm.quantity || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right text-amber-400 font-medium">{Number(itm.rate || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="secondary" size="xs" onClick={() => setRateModalItem(itm)} leftIcon={<Calculator className="w-3.5 h-3.5" />}>
                        Manage Rates
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableContainer>
        )}
      </div>

      <RateAnalysisModal isOpen={Boolean(rateModalItem)} item={rateModalItem} onClose={() => setRateModalItem(null)} />
    </PageContainer>
  );
}
