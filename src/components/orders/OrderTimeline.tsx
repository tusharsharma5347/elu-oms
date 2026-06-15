'use client';
// src/components/orders/OrderTimeline.tsx
import type { OrderStatusHistory, OrderStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ICONS } from '@/lib/order-utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  history: OrderStatusHistory[];
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No status history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, idx) => {
        const isLast = idx === history.length - 1;
        const status = entry.to_status as OrderStatus;
        const colors = STATUS_COLORS[status];
        const icon = STATUS_ICONS[status];

        return (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base border-2 bg-card',
                  colors.border
                )}
              >
                {icon}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-sm font-semibold', colors.text)}>
                  {STATUS_LABELS[status]}
                </span>
                {entry.from_status && (
                  <span className="text-xs text-muted-foreground">
                    from {STATUS_LABELS[entry.from_status as OrderStatus]}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                {format(new Date(entry.changed_at), 'dd MMM yyyy, hh:mm a')}
              </p>
              {entry.reason && (
                <p className="text-sm text-foreground mt-1.5 bg-muted px-3 py-2">
                  {entry.reason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
