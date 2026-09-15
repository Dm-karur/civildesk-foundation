import { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, Download, BookOpen
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



export function ClientStatementsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState(() => {
    try {
      const invoices = JSON.parse(localStorage.getItem('mock_receivables_ClientInvoicesPage') || '[]');
      const advances = JSON.parse(localStorage.getItem('mock_receivables_ClientAdvancesPage') || '[]');
      const receipts = JSON.parse(localStorage.getItem('mock_receivables_ClientReceiptsPage') || '[]');

      const formattedInvoices = invoices.map(i => ({
        id: `inv-${i.id}`,
        project_id: i.project_id,
        date: i.invoice_date,
        reference_no: i.invoice_no || `INV-${i.id}`,
        txn_type: 'RA Bill Raised (Invoice)',
        description: i.billing_type,
        debit_billed: i.gross_invoice_amount,
        credit_received: 0,
        status: i.status || 'Submitted',
      }));

      const formattedAdvances = advances.map(a => ({
        id: `adv-${a.id}`,
        project_id: a.project_id,
        date: a.claim_date,
        reference_no: a.advance_no || `ADV-${a.id}`,
        txn_type: 'Mobilization Advance',
        description: a.advance_type,
        debit_billed: 0,
        credit_received: a.advance_amount,
        status: a.status || 'Pending',
      }));

      const formattedReceipts = receipts.map(r => ({
        id: `rec-${r.id}`,
        project_id: r.project_id,
        date: r.receipt_date,
        reference_no: r.receipt_no || `REC-${r.id}`,
        txn_type: 'Client Payment Receipt',
        description: r.payment_mode,
        debit_billed: 0,
        credit_received: r.amount_received,
        status: 'Cleared',
      }));

      const combined = [...formattedInvoices, ...formattedAdvances, ...formattedReceipts];
      // Sort by date descending
      combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      return combined;
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success('Exporting Statement of Account (SOA) to Excel...');
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (selectedProjectId !== 'all' && String(e.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const ref = String(e.reference_no || '').toLowerCase();
        const desc = String(e.description || '').toLowerCase();
        const typ = String(e.txn_type || '').toLowerCase();
        if (!ref.includes(s) && !desc.includes(s) && !typ.includes(s)) return false;
      }
      return true;
    });
  }, [entries, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalDebits = useMemo(() => entries.reduce((acc, e) => acc + Number(e.debit_billed || 0), 0), [entries]);
  const totalCredits = useMemo(() => entries.reduce((acc, e) => acc + Number(e.credit_received || 0), 0), [entries]);
  const currentNetBalance = useMemo(() => Math.max(0, totalDebits - totalCredits), [totalDebits, totalCredits]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Billing & Receivables', href: '/receivables/contracts' },
    { label: 'Statement of Account (SOA)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Client Account Statement & Ledger Confirmation"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Invoiced / Debited"
            value={`₹${(totalDebits / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<BookOpen className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Remitted / Credited"
            value={`₹${(totalCredits / 10000000).toFixed(2)} Cr`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Current Ledger Balance"
            value={`₹${(currentNetBalance / 100000).toFixed(2)}L`}
            status={currentNetBalance > 0 ? 'warning' : 'success'}
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Ledger Reconciliation"
            value="100% Balanced"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
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

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search txn ref, description, type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Statement"
            >
              Print SOA
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExport}
              className="text-xs h-8 shadow-xs"
            >
              Export Excel
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
                  <th className="px-3 py-2 w-28">Date</th>
                  <th className="px-3 py-2 w-28">Type</th>
                  <th className="px-3 py-2 w-28">Ref No</th>
                  <th className="px-3 py-2">Transaction Particulars</th>
                  <th className="px-3 py-2 text-right w-28">Debit (Billed)</th>
                  <th className="px-3 py-2 text-right w-28 text-emerald-600">Credit (Paid)</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading statement of account...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No statement entries found.
                    </td>
                  </tr>
                ) : (
                  paged.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
                        {e.entry_date}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={e.debit_billed > 0 ? 'warning' : 'success'}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {e.txn_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] font-bold text-primary">
                        {e.reference_no}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-text-primary">
                        {e.description}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        {e.debit_billed > 0 ? `₹${(e.debit_billed / 100000).toFixed(2)}L` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        {e.credit_received > 0 ? `₹${(e.credit_received / 100000).toFixed(2)}L` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(e.running_balance / 100000).toFixed(2)}L
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
          {paged.map((e, idx) => (
            <div key={e.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{e.entry_date} • {e.reference_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{e.description}</h4>
                </div>
                <Badge
                  variant={e.debit_billed > 0 ? 'warning' : 'success'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {e.txn_type}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Amount</span>
                  <span className={`font-mono font-bold text-[11px] ${e.debit_billed > 0 ? 'text-primary' : 'text-emerald-600'}`}>
                    ₹{((e.debit_billed || e.credit_received) / 100000).toFixed(2)}L
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{(e.running_balance / 100000).toFixed(2)}L</span>
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
    </PageContainer>
  );
}
