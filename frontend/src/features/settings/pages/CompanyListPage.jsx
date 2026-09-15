import { useState } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { CompanyFilterBar } from '../components/CompanyFilterBar';
import { CompanyTable } from '../components/CompanyTable';

export function CompanyListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <PageContainer>
      <PageHeader 
        title="Company Settings" 
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Administration', to: '/administration/companies' },
          { label: 'Companies' }
        ]}
      />
      <div className="flex flex-col h-full">
        <CompanyFilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <CompanyTable 
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        </div>
      </div>
    </PageContainer>
  );
}
