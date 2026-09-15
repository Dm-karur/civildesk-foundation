import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('[Route Error]', error);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-surface border border-border rounded-sm p-6 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        
        <div>
          <h2 className="text-[16px] font-bold text-text-primary">Something went wrong</h2>
          <p className="text-[12px] text-text-secondary mt-1">
            {error?.statusText || error?.message || 'An unexpected application error occurred.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="text-[11px] gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="text-[11px] gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
