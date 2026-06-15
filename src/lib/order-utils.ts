// src/lib/order-utils.ts
import { format } from 'date-fns';
import type { OrderStatus } from '@/types';

// ── Order Number Generation ────────────────────────────────────────────────────

export async function generateOrderNumber(
  existingNumbers: string[]
): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `ELU-${today}-`;

  // Find highest sequence for today
  const todayNumbers = existingNumbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));

  const maxSeq = todayNumbers.length > 0 ? Math.max(...todayNumbers) : 0;
  const nextSeq = String(maxSeq + 1).padStart(4, '0');

  return `${prefix}${nextSeq}`;
}

// ── Status Transition Map ─────────────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ORDER_PLACED: ['LENS_SOURCING', 'CUTTING_EDGING', 'CANCELLED'],
  LENS_SOURCING: ['CUTTING_EDGING', 'CANCELLED'],
  CUTTING_EDGING: ['QC', 'CANCELLED'],
  QC: ['DISPATCH', 'QC_FAILED'],
  QC_FAILED: ['CUTTING_EDGING', 'CANCELLED'],
  DISPATCH: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return STATUS_TRANSITIONS[currentStatus] ?? [];
}

// ── Status Labels & Colors ────────────────────────────────────────────────────

export const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_PLACED: 'Order Placed',
  LENS_SOURCING: 'Lens Sourcing',
  CUTTING_EDGING: 'Cutting & Edging',
  QC: 'Quality Check',
  QC_FAILED: 'QC Failed',
  DISPATCH: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  ORDER_PLACED: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
    text: 'text-blue-700',
    border: 'border-blue-200/60',
  },
  LENS_SOURCING: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200/60',
    text: 'text-purple-700',
    border: 'border-purple-200/60',
  },
  CUTTING_EDGING: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
    text: 'text-amber-850',
    border: 'border-amber-200/60',
  },
  QC: {
    bg: 'bg-orange-50 text-orange-850 border-orange-200/60',
    text: 'text-orange-850',
    border: 'border-orange-200/60',
  },
  QC_FAILED: {
    bg: 'bg-red-50 text-red-700 border-red-200/60',
    text: 'text-red-700',
    border: 'border-red-200/60',
  },
  DISPATCH: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200/60',
    text: 'text-teal-700',
    border: 'border-teal-200/60',
  },
  DELIVERED: {
    bg: 'bg-green-50 text-green-700 border-green-200/60',
    text: 'text-green-700',
    border: 'border-green-200/60',
  },
  CANCELLED: {
    bg: 'bg-gray-50 text-gray-700 border-gray-200/60',
    text: 'text-gray-700',
    border: 'border-gray-200/60',
  },
};

export const STATUS_ICONS: Record<OrderStatus, string> = {
  ORDER_PLACED: '📋',
  LENS_SOURCING: '🔍',
  CUTTING_EDGING: '✂️',
  QC: '🔬',
  QC_FAILED: '❌',
  DISPATCH: '🚚',
  DELIVERED: '✅',
  CANCELLED: '🚫',
};

// ── Risk Level Colors ──────────────────────────────────────────────────────────

export const RISK_COLORS = {
  LOW: { bg: 'bg-green-50 text-green-700 border-green-200/60', text: 'text-green-700', border: 'border-green-200' },
  MEDIUM: { bg: 'bg-amber-50 text-amber-800 border-amber-200/60', text: 'text-amber-800', border: 'border-amber-200' },
  HIGH: { bg: 'bg-orange-50 text-orange-800 border-orange-200/60', text: 'text-orange-800', border: 'border-orange-200' },
  CRITICAL: { bg: 'bg-red-50 text-red-700 border-red-200/60', text: 'text-red-700', border: 'border-red-200' },
};

// ── Active Statuses ────────────────────────────────────────────────────────────

export const ACTIVE_STATUSES: OrderStatus[] = [
  'ORDER_PLACED',
  'LENS_SOURCING',
  'CUTTING_EDGING',
  'QC',
  'QC_FAILED',
  'DISPATCH',
];

export const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];
