import { CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw, ArrowRight, ShieldCheck, FileText, ShoppingBag, Truck } from 'lucide-react';

export function WorkflowTimeline({
  status = 'Draft',
  isBoqRequired = false,
  approvalHistory = [],
  sourceRefs = {},
  onNavigateDocument
}) {
  const normalizedStatus = String(status || '').toUpperCase();

  // Define steps dynamically based on isBoqRequired
  const steps = [
    { key: 'DRAFT', label: 'Site Supervisor', desc: 'Material Indent Raised', role: 'Site Supervisor' },
    { key: 'PENDING_SE', label: 'Site Engineer', desc: 'Technical Verification', role: 'Site Engineer' },
    ...(isBoqRequired ? [{ key: 'PENDING_BOQ', label: 'BOQ Approver', desc: 'BOQ Quantity Audit', role: 'BOQ Approver' }] : []),
    { key: 'PENDING_PM', label: 'Project Manager', desc: 'Final Request Approval', role: 'Project Manager' },
    { key: 'APPROVED', label: 'Approved MR', desc: 'Ready for Purchase Requisition', role: 'Accounts User' },
    { key: 'PR_CREATED', label: 'Purchase Requisition', desc: 'PR Formed & Approved', role: 'Accounts User' },
    { key: 'PO_CREATED', label: 'Purchase Order', desc: 'PO Dispatched to Vendor', role: 'Procurement' }
  ];

  // Determine current active step index
  let activeIndex = 0;
  if (normalizedStatus.includes('REJECT')) {
    activeIndex = -1; // Special handling for rejected
  } else if (normalizedStatus.includes('RETURN')) {
    activeIndex = 0; // Back to supervisor for resubmission
  } else if (normalizedStatus.includes('SUBMIT') || normalizedStatus.includes('PENDING SITE ENGINEER') || normalizedStatus.includes('PENDING_SITE_ENGINEER')) {
    activeIndex = 1;
  } else if (normalizedStatus.includes('BOQ')) {
    activeIndex = isBoqRequired ? 2 : 1;
  } else if (normalizedStatus.includes('PENDING PROJECT MANAGER') || normalizedStatus.includes('PENDING_PROJECT_MANAGER') || normalizedStatus.includes('PENDING PM')) {
    activeIndex = isBoqRequired ? 3 : 2;
  } else if (normalizedStatus.includes('APPROVED')) {
    if (sourceRefs.po_no) activeIndex = isBoqRequired ? 6 : 5;
    else if (sourceRefs.pr_no) activeIndex = isBoqRequired ? 5 : 4;
    else activeIndex = isBoqRequired ? 4 : 3;
  } else if (normalizedStatus.includes('ORDER') || normalizedStatus.includes('CONVERTED')) {
    activeIndex = steps.length - 1;
  }

  const isRejected = normalizedStatus.includes('REJECT');
  const isReturned = normalizedStatus.includes('RETURN');

  return (
    <div className="border border-border rounded-xl p-4 bg-surface-muted/30 shadow-xs mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-text-primary text-sm">Procurement Workflow Timeline</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">BOQ Verification Required:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isBoqRequired ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {isBoqRequired ? 'Yes (BOQ Approver Involved)' : 'No (Direct to PM)'}
          </span>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="relative pt-2 pb-1 px-4">
        {/* Background connector line */}
        <div className="absolute left-8 right-8 top-[26px] h-0.5 bg-border -z-0" />
        
        {/* Active progress connector line */}
        {activeIndex > 0 && !isRejected && (
          <div 
            className="absolute left-8 top-[26px] h-0.5 bg-primary -z-0 transition-all duration-500"
            style={{ width: `calc(${(activeIndex / (steps.length - 1)) * 100}% - 3rem)` }}
          />
        )}

        <div className="flex items-start justify-between relative z-10">
          {steps.map((step, idx) => {
            const isDone = !isRejected && activeIndex > idx;
            const isCurrent = !isRejected && activeIndex === idx;

            return (
              <div key={step.key} className="flex flex-col items-center text-center max-w-[100px]">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all duration-200 border-2 ${
                    isDone 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : isCurrent 
                        ? (isReturned ? 'bg-amber-500 text-white border-amber-500 ring-4 ring-amber-100' : 'bg-primary text-white border-primary ring-4 ring-primary/20')
                        : isRejected 
                          ? 'bg-surface text-text-tertiary border-border'
                          : 'bg-surface text-text-tertiary border-border'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    isReturned ? <RotateCcw className="w-4 h-4 text-white animate-spin-slow" /> : <Clock className="w-4 h-4 text-white" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <span className={`text-xs font-semibold mt-2 line-clamp-1 ${isCurrent ? 'text-primary' : isDone ? 'text-text-primary' : 'text-text-tertiary'}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Responsible Role & Next Action Banner */}
      <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
        isRejected 
          ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' 
          : isReturned 
            ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            : normalizedStatus.includes('APPROVED')
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
      }`}>
        <div className="flex items-center gap-2">
          {isRejected ? (
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          ) : isReturned ? (
            <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <div>
            <span className="font-bold block">Current Stage: {status}</span>
            <span>
              {isRejected 
                ? 'This material request has been rejected and will not proceed to procurement.' 
                : isReturned 
                  ? 'Returned to Site Supervisor for quantity/spec correction.' 
                  : normalizedStatus.includes('APPROVED')
                    ? 'Approved! Eligible for Accounts User to generate Purchase Requisition.'
                    : `Currently pending action by: ${steps[activeIndex]?.role || 'Assigned Officer'}`}
            </span>
          </div>
        </div>

        {/* Clickable Reference Chain */}
        {(sourceRefs.mr_no || sourceRefs.pr_no || sourceRefs.po_no) && (
          <div className="flex items-center gap-2 font-mono text-[11px] bg-surface/80 p-1.5 rounded-md border border-border">
            {sourceRefs.mr_no && <span className="text-primary font-bold">{sourceRefs.mr_no}</span>}
            {sourceRefs.pr_no && (
              <>
                <ArrowRight className="w-3 h-3 text-text-tertiary" />
                <span className="text-emerald-600 font-bold">{sourceRefs.pr_no}</span>
              </>
            )}
            {sourceRefs.po_no && (
              <>
                <ArrowRight className="w-3 h-3 text-text-tertiary" />
                <span className="text-purple-600 font-bold">{sourceRefs.po_no}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* History Log Table */}
      {approvalHistory && approvalHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-[11px] font-bold text-text-secondary block mb-2">Approval & Action History</span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {approvalHistory.map((log, hIdx) => (
              <div key={hIdx} className="flex items-center justify-between text-xs bg-surface p-2 rounded border border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{log.role || 'Officer'}</span>
                  <span className="text-text-tertiary">•</span>
                  <span className="text-text-secondary">{log.user_name || 'System User'}</span>
                  <span className="text-text-tertiary">•</span>
                  <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                    String(log.action).toLowerCase().includes('approve') ? 'bg-emerald-100 text-emerald-800' :
                    String(log.action).toLowerCase().includes('reject') ? 'bg-red-100 text-red-800' :
                    String(log.action).toLowerCase().includes('return') ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {log.action}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-text-tertiary block">{log.timestamp || new Date().toLocaleString()}</span>
                  {log.remarks && <span className="text-[11px] italic text-text-secondary block">"{log.remarks}"</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
