'use client';
// src/components/orders/StatusBadge.tsx
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/order-utils';
import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size]
      )}
    >
      {label}
    </span>
  );
}
