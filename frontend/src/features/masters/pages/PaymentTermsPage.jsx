import { UnderConstructionPage } from './UnderConstructionPage';

export function PaymentTermsPage() {
  return (
    <UnderConstructionPage
      title="Payment Terms"
      moduleName="Standard Payment Terms"
      description="The application backend does not maintain a standalone database table for payment term policies. Payment terms (in number of days) are configured inline directly on vendor/supplier and subcontractor profiles."
    />
  );
}
