import { UnderConstructionPage } from './UnderConstructionPage';

export function EmailPage() {
  return (
    <UnderConstructionPage
      title="Email Settings"
      moduleName="SMTP Credentials"
      description="The application backend does not support dynamic SMTP or email integration setups. SMTP servers and mail credentials are loaded statically from the server Config/Email.php configurations."
    />
  );
}
