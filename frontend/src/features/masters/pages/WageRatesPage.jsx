import { UnderConstructionPage } from './UnderConstructionPage';

export function WageRatesPage() {
  return (
    <UnderConstructionPage
      title="Standard Wage Rates"
      moduleName="Wage Rates Catalogue"
      description="The application does not maintain a standalone 'wage_rates' table. Instead, agreed wage rates and overtime rules are configured directly on worker profile records and project assignments."
    />
  );
}
