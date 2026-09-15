import { useState } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { UsersFilterBar } from '../components/UsersFilterBar';
import { UsersTable } from '../components/UsersTable';

export function UsersListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader 
        title="User Master" 
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Administration', to: '/administration/users' },
          { label: 'Users' }
        ]}
      />
      <div className="flex flex-col h-full">
        <UsersFilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          roleFilter={roleFilter}
          onRoleChange={setRoleFilter}
          onAddUser={() => setIsAddOpen(true)}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <UsersTable 
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            roleFilter={roleFilter}
            isAddOpen={isAddOpen}
            setIsAddOpen={setIsAddOpen}
          />
        </div>
      </div>
    </PageContainer>
  );
}
