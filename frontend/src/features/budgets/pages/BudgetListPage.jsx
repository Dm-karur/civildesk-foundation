import { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, Clock, AlertCircle, IndianRupee, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { BudgetFilterBar } from '../components/BudgetFilterBar';
import { BudgetTable } from '../components/BudgetTable';
import { BudgetFormModal } from '../components/BudgetFormModal';
import { BudgetDetailModal } from '../components/BudgetDetailModal';
import { budgetsApi, projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function BudgetListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewingBudget, setViewingBudget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({ project_id: 'all', status: 'all' });
  const [projects, setProjects] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, totalAmount: 0 });

  useEffect(() => {
    projectsApi.list()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []));
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    budgetsApi.list()
      .then((res) => {
        const list = res?.data?.project_budgets ?? res?.project_budgets ?? res?.data?.data ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let draft = 0, submitted = 0, approved = 0, totalAmount = 0;
          list.forEach((b) => {
            const s = String(b.status_name || b.status || b.status_code || '').toLowerCase();
            const amt = Number(b.total_amount || b.grand_total || 0);
            totalAmount += amt;
            if (s.includes('draft')) draft++;
            else if (s.includes('submitted') || s.includes('review') || s.includes('pending')) submitted++;
            else if (s.includes('approved')) approved++;
          });
          setKpis({ total: list.length, draft, submitted, approved, totalAmount });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/budgets' },
    { label: 'Budget Summary' },
  ];

  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <PageContainer>
      <PageHeader title="Budget Summary" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* Top-aligned KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Project Budgets"
            value={kpis.total}
            status="primary"
            icon={<Wallet className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved Budgets"
            value={kpis.approved}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Approval"
            value={kpis.submitted}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Total Estimated Budget"
            value={`₹${(kpis.totalAmount / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <BudgetFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={() => setIsAddOpen(true)}
          canCreate={hasPermission('budget.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((c) => ({ ...c, [name]: value }))}
          projects={projects}
        />

        {/* Fluid Zero-Scroll Budget Table */}
        <BudgetTable
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingBudget}
          onView={setViewingBudget}
          filters={filters}
          onAction={refresh}
        />
      </div>

      <BudgetFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaveSuccess={refresh} />
      <BudgetFormModal isOpen={Boolean(editingBudget)} budget={editingBudget} onClose={() => setEditingBudget(null)} onSaveSuccess={refresh} />
      <BudgetDetailModal isOpen={Boolean(viewingBudget)} budget={viewingBudget} onClose={() => setViewingBudget(null)} onRefresh={refresh} />
    </PageContainer>
  );
}
