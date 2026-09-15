import { UnderDevelopment } from './UnderDevelopment';

export function UnderConstructionPage({ title, moduleName, description }) {
  return (
    <UnderDevelopment
      title={title}
      subtitle="This feature is under development"
      featureName="Coming Soon"
      description={description}
      statusDetails={{
        schema_status: 'MISSING',
        backend_model: 'NOT IMPLEMENTED',
        REST_endpoint: 'None registered in Routes.php',
      }}
    />
  );
}
export default UnderConstructionPage;
