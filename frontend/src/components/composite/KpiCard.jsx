import React, { isValidElement } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

export function KpiCard({
  label,
  value,
  description,
  linkText,
  icon,
  trend,
  trendDirection,
  status = 'primary',
  loading = false,
  className
}) {
  const isPositive = trendDirection === 'up';
  const isNegative = trendDirection === 'down';

  const iconBgClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
    neutral: 'bg-surface-muted text-text-secondary',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && icon.$$typeof)) {
      const IconComponent = icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return icon;
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse flex items-center gap-2.5 px-3 py-2", className)}>
        <div className="w-9 h-9 rounded-lg bg-surface-muted flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-2.5 bg-surface-muted rounded w-1/2 mb-1.5"></div>
          <div className="h-5 bg-surface-muted rounded w-1/3 mb-1.5"></div>
          <div className="h-2.5 bg-surface-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-row items-center gap-2.5 px-3 py-2", className)}>
      <div className={cn("w-9 h-9 rounded-lg flex flex-shrink-0 items-center justify-center [&>svg]:w-4 [&>svg]:h-4", iconBgClasses[status])}>
        {renderIcon()}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Removed truncate, reduced font size to 11px with tight line height */}
        <div className="text-[11px] font-medium text-text-secondary leading-tight pr-1 break-words">{label}</div>
        <div className="text-[15px] font-bold text-text-primary leading-tight mt-0.5">{value}</div>

        {/* Flex layout to keep description and trend horizontally aligned even when tight */}
        <div className="flex items-start justify-between gap-1 mt-1 min-w-0">
          {description && (
            <span className="text-[10px] text-text-secondary leading-tight line-clamp-2">
              {description}
            </span>
          )}
          {trend && (
            <span className={cn(
              "flex items-center text-[10px] font-medium whitespace-nowrap",
              isPositive ? "text-success" : isNegative ? "text-error" : "text-text-secondary"
            )}>
              {isPositive && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
              {isNegative && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
