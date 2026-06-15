'use client';
// src/components/orders/SLABar.tsx
import { calcSLAProgress, formatTimeRemaining } from '@/lib/sla';
import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface SLABarProps {
  placedAt: string;
  slaHours: number;
  status: OrderStatus;
  showLabel?: boolean;
}

export function SLABar({ placedAt, slaHours, status, showLabel = true }: SLABarProps) {
  const progress = calcSLAProgress(placedAt, slaHours, status);
  const timeLabel = formatTimeRemaining(progress, status);

  const barWidth = Math.min(100, progress.percentage);

  const barColors: Record<typeof progress.color, string> = {
    'green': 'bg-green-600',
    'amber': 'bg-amber-500',
    'red': 'bg-red-600',
    'pulsing-red': 'bg-red-600 animate-pulse',
  };

  const textColors: Record<typeof progress.color, string> = {
    'green': 'text-green-600 font-medium',
    'amber': 'text-amber-700 font-medium',
    'red': 'text-red-600 font-medium',
    'pulsing-red': 'text-red-600 font-bold',
  };

  if (status === 'DELIVERED') {
    return (
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-green-600" style={{ width: '100%' }} />
        </div>
        {showLabel && <p className="text-xs text-green-600 font-medium">Delivered ✓</p>}
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-muted-foreground" style={{ width: `${barWidth}%` }} />
        </div>
        {showLabel && <p className="text-xs text-muted-foreground font-medium">Cancelled</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1 min-w-[120px]">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColors[progress.color])}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      {showLabel && (
        <p className={cn('text-xs', textColors[progress.color])}>
          {timeLabel}
        </p>
      )}
    </div>
  );
}
