import { X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Wrapper
export function EntityDetailsModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-[calc(100vw-2rem)] sm:w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>
  );
}

// Header
function Header({ icon: Icon, title, subtitle, status, statusVariant = 'neutral', statusIcon: StatusIcon, onClose, extraBadges }) {
  return (
    <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-surface-muted/60">
      <div className="flex gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] font-bold text-text-primary leading-none">
              {title}
            </h2>
            {status && (
              <Badge 
                variant={statusVariant} 
                className="text-[9px] font-bold uppercase tracking-wider h-5 px-1.5 inline-flex items-center gap-1 leading-none font-sans"
              >
                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                {status}
              </Badge>
            )}
            {extraBadges}
          </div>
          {subtitle && (
            <p className="text-[11px] text-text-secondary font-mono leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-md transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Body
function Body({ children }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
      {children}
    </div>
  );
}

// Section
function Section({ title, icon: Icon, children, noBorder = false }) {
  return (
    <div className={!noBorder ? 'border-b border-border/60 pb-5 last:border-0 last:pb-0' : ''}>
      {(title || Icon) && (
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
          <span>{title}</span>
        </h3>
      )}
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

// Field
function Field({ label, value, secondaryValue, icon: Icon, fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-0.5 ${fullWidth ? 'w-full' : ''}`}>
      <span className="text-[9px] uppercase font-bold text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted mt-0.5" />}
        <div className="flex flex-col leading-tight">
          <span className="text-[12px] font-medium text-text-primary break-words">
            {value || '—'}
          </span>
          {secondaryValue && (
            <span className="text-[10px] text-text-muted mt-0.5">
              {secondaryValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Raw Content Block (for notes, addresses with formatting, etc.)
function ContentBlock({ label, children }) {
  return (
    <div className="bg-surface-muted/30 p-3 rounded-md border border-border/70">
      {label && <span className="text-[9px] uppercase font-bold text-text-secondary block mb-1.5">{label}</span>}
      <div className="text-[12px] text-text-primary leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// Footer
function Footer({ children, onClose }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface-muted/40 w-full shrink-0">
      {children || (
        <Button variant="outline" size="sm" onClick={onClose} className="h-10 sm:h-8 px-4 text-[12px] w-full sm:w-auto">
          Close
        </Button>
      )}
    </div>
  );
}

EntityDetailsModal.Header = Header;
EntityDetailsModal.Body = Body;
EntityDetailsModal.Section = Section;
EntityDetailsModal.Field = Field;
EntityDetailsModal.ContentBlock = ContentBlock;
EntityDetailsModal.Footer = Footer;
