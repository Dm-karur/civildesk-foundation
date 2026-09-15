export const MOCK_WORKFLOWS = [
  {
    id: 1,
    name: 'Budget Approval',
    code: 'BUDGET_APPROVAL',
    module: 'BOQ & Project Budget',
    transaction: 'Project Budget',
    levels: 3,
    flow: [
      { step: 1, role: 'Project Manager', required: true },
      { step: 2, role: 'Finance Manager', required: true },
      { step: 3, role: 'Director', required: true }
    ],
    scope: 'Project',
    status: 'Active',
    description: 'Approval workflow for the initial project budget.'
  },
  {
    id: 2,
    name: 'Budget Revision Approval',
    code: 'BUDGET_REVISION',
    module: 'BOQ & Project Budget',
    transaction: 'Budget Revision',
    levels: 2,
    flow: [
      { step: 1, role: 'Project Manager', required: true },
      { step: 2, role: 'Finance Manager', required: true }
    ],
    scope: 'Project',
    status: 'Active',
    description: 'Approval for any revisions to an existing budget.'
  },
  {
    id: 3,
    name: 'Material Request Approval',
    code: 'MATERIAL_REQUEST',
    module: 'Materials & Inventory',
    transaction: 'Material Request',
    levels: 2,
    flow: [
      { step: 1, role: 'Site Engineer', required: true },
      { step: 2, role: 'Project Manager', required: true }
    ],
    scope: 'Project',
    status: 'Active',
    description: 'Workflow for approving on-site material requests.'
  },
  {
    id: 4,
    name: 'Purchase Order Approval',
    code: 'PO_APPROVAL',
    module: 'Procurement',
    transaction: 'Purchase Order',
    levels: 3,
    flow: [
      { step: 1, role: 'Project Manager', required: true },
      { step: 2, role: 'Finance Manager', required: true },
      { step: 3, role: 'Director', required: true }
    ],
    scope: 'Company',
    status: 'Active',
    description: 'Company-wide purchase order approval workflow.'
  },
  {
    id: 5,
    name: 'Daily Report Review',
    code: 'DAILY_REPORT',
    module: 'Daily Site Operations',
    transaction: 'Daily Report',
    levels: 2,
    flow: [
      { step: 1, role: 'Site Engineer', required: true },
      { step: 2, role: 'Project Manager', required: true }
    ],
    scope: 'Project',
    status: 'Active',
    description: 'Review and sign-off for daily site progress reports.'
  },
  {
    id: 6,
    name: 'Expense Request Approval',
    code: 'EXPENSE_REQUEST',
    module: 'Finance & Cost Control',
    transaction: 'Expense Request',
    levels: 2,
    flow: [
      { step: 1, role: 'Project Manager', required: true },
      { step: 2, role: 'Finance Manager', required: true }
    ],
    scope: 'Project',
    status: 'Active',
    description: 'Approval for project-specific expense claims.'
  },
  {
    id: 7,
    name: 'RA Bill Certification',
    code: 'RA_BILL',
    module: 'Subcontract Management',
    transaction: 'RA Bill',
    levels: 3,
    flow: [
      { step: 1, role: 'Site Engineer', required: true },
      { step: 2, role: 'Project Manager', required: true },
      { step: 3, role: 'Finance Manager', required: true }
    ],
    scope: 'Project',
    status: 'Active',
    description: 'Certification process for running account bills.'
  },
  {
    id: 8,
    name: 'Subcontract Payment Approval',
    code: 'SUBCONTRACT_PAYMENT',
    module: 'Subcontract Management',
    transaction: 'Payment',
    levels: 2,
    flow: [
      { step: 1, role: 'Project Manager', required: true },
      { step: 2, role: 'Finance Manager', required: true }
    ],
    scope: 'Company',
    status: 'Inactive',
    description: 'Final payment authorization for subcontractors.'
  }
];
