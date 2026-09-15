import { UnderConstructionPage } from './UnderConstructionPage';

export function BanksPage() {
  return (
    <UnderConstructionPage
      title="Banks Registry"
      moduleName="Settlement Banks"
      description="The application backend does not maintain a standalone database table for managing company Bank records. Bank account parameters are configured inline directly inside Client, Vendor, and Subcontractor settlement forms."
    />
  );
}
