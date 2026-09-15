import { UnderConstructionPage } from './UnderConstructionPage';

export function SystemSettingsPage() {
  return (
    <UnderConstructionPage
      title="System Settings"
      moduleName="Central Parameters"
      description="The application backend does not support dynamic database-backed system parameter configuration tables. Settings variables are loaded statically from CodeIgniter config files."
    />
  );
}
