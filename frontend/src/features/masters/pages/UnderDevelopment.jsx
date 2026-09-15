import { Hammer, Clock, ArrowLeft, HelpCircle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';

export function UnderDevelopment({ title, subtitle, description, featureName, statusDetails }) {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Administration' },
    { label: title || 'Under Development' },
  ];

  return (
    <PageContainer>
      <PageHeader title={title || 'Under Development'} breadcrumbs={breadcrumbs} />

      <div className="flex flex-col items-center justify-center min-h-[480px] p-8 text-center bg-surface border border-border/80 rounded-xl shadow-lg max-w-2xl mx-auto my-8 transition-all hover:shadow-xl">
        {/* Animated Icon Container */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 relative">
            <Hammer className="w-10 h-10 text-primary animate-bounce duration-1000" />
            <Clock className="w-5 h-5 text-secondary absolute bottom-1 right-1 animate-spin duration-3000" />
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-[22px] font-bold text-text-primary mb-2">
          {subtitle || 'This feature is under development'}
        </h2>
        <p className="text-[14px] font-bold text-secondary tracking-wide uppercase px-2.5 py-0.5 rounded bg-secondary/15 mb-4 inline-block">
          {featureName || 'Coming Soon'}
        </p>

        {/* Description */}


        {/* Tech Specs Panel */}


        {/* Back Button */}
        <Button
          variant="outline"
          className="h-10 px-5 text-[13px] font-medium"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Previous Page
        </Button>
      </div>
    </PageContainer>
  );
}
export default UnderDevelopment;
