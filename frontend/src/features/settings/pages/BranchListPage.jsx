import { useState } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { BranchFilterBar } from '../components/BranchFilterBar';
import { BranchTable } from '../components/BranchTable';
import { BranchFormModal } from '../components/BranchFormModal';

export function BranchListPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <PageContainer>
      <PageHeader
        title="Branch Master"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Administration', to: '/administration/branches' },
          { label: 'Branches' }
        ]}
      />
      <div className="flex flex-col h-full">
        <BranchFilterBar onAddClick={() => setIsAddModalOpen(true)} />
        <BranchTable refreshTrigger={refreshTrigger} />
      </div>

      <BranchFormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSaveSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </PageContainer>
  );
}
