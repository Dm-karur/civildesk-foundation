import { useState } from 'react';
import { Building2, GitBranch, Search, Filter } from 'lucide-react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { CompanyProfileCard } from '../components/CompanyProfileCard';
import { BranchTable } from '../components/BranchTable';

export function CompanyBranchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <PageContainer>
      <PageHeader 
        title="Company & Branch Details" 
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Settings', to: '/settings/company-branch' },
          { label: 'Company & Branch' }
        ]}
      />

      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Section: Company Profile View */}
        <CompanyProfileCard />

        {/* Section Divider / Sub-header for Branches */}
        <div className="bg-surface border border-border rounded-sm p-2 mb-2 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xs bg-primary/10 flex items-center justify-center text-primary">
              <GitBranch className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-text-primary uppercase tracking-wide">
                Branch Network & Offices
              </h3>
              <p className="text-[10px] text-text-secondary">View operational branches and site offices linked to this company</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter branches..."
                className="h-7 w-48 pl-8 pr-2.5 text-[11px] rounded-xs border border-border bg-background focus:outline-none focus:border-focus"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Branch List View Table */}
        <div className="flex-1 min-h-0 flex flex-col">
          <BranchTable searchQuery={searchQuery} />
        </div>
      </div>
    </PageContainer>
  );
}
