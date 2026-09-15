import { useState } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { ClientsFilterBar } from '../components/ClientsFilterBar';
import { ClientsTable } from '../components/ClientsTable';

export function ClientsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader 
        title="Clients Master" 
      />
      <div className="flex flex-col h-full overflow-hidden">
        <ClientsFilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          industryFilter={industryFilter}
          onIndustryChange={setIndustryFilter}
          onAddClient={() => setIsAddOpen(true)}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <ClientsTable 
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            industryFilter={industryFilter}
            isAddOpen={isAddOpen}
            setIsAddOpen={setIsAddOpen}
          />
        </div>
      </div>
    </PageContainer>
  );
}
