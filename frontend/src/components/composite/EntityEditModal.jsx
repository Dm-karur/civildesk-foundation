import { X } from 'lucide-react';
import { Button } from '../ui/Button';

// Wrapper
export function EntityEditModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>
  );
}

// Header
function Header({ icon: Icon, title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-surface-muted/30 shrink-0">
      <div className="flex gap-4">
        {Icon && (
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-text-primary leading-none">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-text-secondary leading-tight mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {onClose && (
        <button 
          type="button"
          onClick={onClose}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-md transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Body (Scrollable container for the form content)
function Body({ children }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
      {children}
    </div>
  );
}

// Section
function Section({ title, description, children, noBorder = false }) {
  return (
    <div className={!noBorder ? 'border-b border-border/60 pb-8 last:border-0 last:pb-0' : ''}>
      <div className="mb-5">
        {title && (
          <h3 className="text-sm font-bold text-text-primary">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs text-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

// Grid (2 columns on desktop, 1 on mobile)
function Grid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ${className}`}>
      {children}
    </div>
  );
}

// Footer
function Footer({ children, onCancel, submitLabel = 'Save Changes', formId, isSubmitting = false }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface shrink-0 w-full">
      {children || (
        <>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSubmitting} 
            className="h-10 sm:h-9 px-5 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form={formId} 
            variant="primary" 
            disabled={isSubmitting} 
            className="h-10 sm:h-9 px-6 w-full sm:w-auto"
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </>
      )}
    </div>
  );
}

EntityEditModal.Header = Header;
EntityEditModal.Body = Body;
EntityEditModal.Section = Section;
EntityEditModal.Grid = Grid;
EntityEditModal.Footer = Footer;
