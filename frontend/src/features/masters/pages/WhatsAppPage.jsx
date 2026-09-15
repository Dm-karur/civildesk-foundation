import { UnderConstructionPage } from './UnderConstructionPage';

export function WhatsAppPage() {
  return (
    <UnderConstructionPage
      title="WhatsApp Configuration"
      moduleName="WhatsApp API Gateway"
      description="The application backend does not support configurable WhatsApp messaging credentials. WhatsApp notification dispatches are integrated directly inside backend messaging hooks."
    />
  );
}
