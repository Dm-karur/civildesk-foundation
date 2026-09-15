import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export function ConfirmDialog({
  open,
  isOpen,
  title,
  description,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  variant,
  loading = false,
  onConfirm,
  onCancel,
  className
}) {
  const isDialogActive = open || isOpen;
  const dialogMessage = description || message;
  const isDestructive = destructive || variant === 'danger';
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isDialogActive) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    if (isDialogActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isDialogActive, onCancel]);

  if (!isDialogActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
        aria-hidden="true"
      />
      
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative bg-surface rounded-xl shadow-3 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-1",
              isDestructive ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
            )}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <div className="flex-1 mt-1">
              <h3 id="dialog-title" className="text-lg font-semibold text-text-primary">
                {title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {dialogMessage}
              </p>
            </div>
            
            <button 
              onClick={onCancel}
              className="p-1 rounded-sm text-text-placeholder hover:text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-surface-muted border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "primary"} 
            onClick={onConfirm} 
            loading={loading}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
