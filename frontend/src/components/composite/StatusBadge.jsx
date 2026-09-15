import { Badge } from '../ui/Badge';

const statusMapping = {
  // Success
  success: 'success',
  completed: 'success',
  approved: 'success',
  
  // Warning
  warning: 'warning',
  'in-progress': 'warning',
  progress: 'warning',
  pending: 'warning',
  'on-hold': 'warning',
  
  // Error
  error: 'error',
  critical: 'error',
  rejected: 'error',
  
  // Info
  info: 'info',
  
  // Neutral
  neutral: 'neutral',
  draft: 'neutral',
};

export function StatusBadge({ status, label, ...props }) {
  const normalizedStatus = status?.toLowerCase() || 'neutral';
  const variant = statusMapping[normalizedStatus] || 'neutral';
  
  // If no explicit label is provided, format the status string
  const displayLabel = label || status?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Badge variant={variant} {...props}>
      {displayLabel}
    </Badge>
  );
}
