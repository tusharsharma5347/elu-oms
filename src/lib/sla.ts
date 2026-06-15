// src/lib/sla.ts
import type { LensType, OrderStatus, SLAProgress } from '@/types';
import { differenceInHours, addHours, formatDistanceToNow } from 'date-fns';

export const SLA_HOURS: Record<LensType, number> = {
  SV: 24,
  BF: 48,
  Progressive: 72,
  KT: 96,
};

// Terminal statuses — no SLA tracking
const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];

export function getSLAHours(lensType: LensType): number {
  return SLA_HOURS[lensType] ?? 24;
}

export function calcExpectedDelivery(placedAt: Date, slaHours: number): Date {
  return addHours(placedAt, slaHours);
}

export function calcSLAProgress(
  placedAt: Date | string,
  slaHours: number,
  status: OrderStatus
): SLAProgress {
  const placed = typeof placedAt === 'string' ? new Date(placedAt) : placedAt;
  const now = new Date();

  const elapsed_hours = Math.max(0, differenceInHours(now, placed));
  const remaining_hours = slaHours - elapsed_hours;
  const percentage = Math.min(200, (elapsed_hours / slaHours) * 100); // Cap at 200% for display
  const is_overdue = elapsed_hours > slaHours;

  let color: SLAProgress['color'];
  if (TERMINAL_STATUSES.includes(status)) {
    color = 'green';
  } else if (percentage > 100) {
    color = 'pulsing-red';
  } else if (percentage > 85) {
    color = 'red';
  } else if (percentage > 60) {
    color = 'amber';
  } else {
    color = 'green';
  }

  return {
    elapsed_hours,
    remaining_hours,
    percentage,
    is_overdue,
    color,
  };
}

export function formatTimeRemaining(
  progress: SLAProgress,
  status: OrderStatus
): string {
  if (status === 'DELIVERED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';

  const { remaining_hours, is_overdue } = progress;

  if (is_overdue) {
    const overdueHours = Math.abs(remaining_hours);
    if (overdueHours < 1) return `< 1h OVERDUE`;
    if (overdueHours < 24) return `${overdueHours.toFixed(0)}h OVERDUE`;
    const days = Math.floor(overdueHours / 24);
    const hours = Math.round(overdueHours % 24);
    return `${days}d ${hours}h OVERDUE`;
  }

  const hours = Math.floor(remaining_hours);
  const minutes = Math.round((remaining_hours - hours) * 60);

  if (remaining_hours < 1) return `${minutes}m remaining`;
  if (remaining_hours < 24) return `${hours}h ${minutes}m remaining`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h remaining`;
}

export function calcAvgTAT(
  orders: Array<{ placed_at: string; actual_delivery: string | null; status: OrderStatus }>
): number {
  const delivered = orders.filter(
    (o) => o.status === 'DELIVERED' && o.actual_delivery
  );

  if (delivered.length === 0) return 0;

  const total = delivered.reduce((sum, o) => {
    const hrs = differenceInHours(
      new Date(o.actual_delivery!),
      new Date(o.placed_at)
    );
    return sum + hrs;
  }, 0);

  return Math.round(total / delivered.length);
}
