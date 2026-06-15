// src/app/dashboard/page.tsx
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { OrderTable } from '@/components/orders/OrderTable';
import { calcSLAProgress, calcAvgTAT } from '@/lib/sla';
import { ACTIVE_STATUSES } from '@/lib/order-utils';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DashboardFilters } from './DashboardFilters';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Live order dashboard with SLA tracking and AI risk monitoring.',
};

// Revalidate every 60 seconds for fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function getDashboardData() {
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*, store:stores(*)')
    .order('placed_at', { ascending: false });

  const allOrders = (orders ?? []) as Order[];

  const activeOrders = allOrders.filter((o) =>
    ACTIVE_STATUSES.includes(o.status as OrderStatus)
  );

  const breachingSLA = activeOrders.filter((o) => {
    const progress = calcSLAProgress(o.placed_at, o.sla_hours, o.status);
    return progress.is_overdue;
  }).length;

  const atRisk = activeOrders.filter(
    (o) => (o.breach_probability ?? 0) > 0.5
  ).length;

  const avgTAT = calcAvgTAT(
    allOrders.map((o) => ({
      placed_at: o.placed_at,
      actual_delivery: o.actual_delivery,
      status: o.status as OrderStatus,
    }))
  );

  return {
    orders: allOrders,
    stats: {
      totalActive: activeOrders.length,
      breachingSLA,
      atRisk,
      avgTAT,
    },
  };
}

export default async function DashboardPage() {
  const { orders, stats } = await getDashboardData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time order tracking with AI-powered SLA predictions
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-primary hover:bg-primary/95 text-primary-foreground gap-2 font-bold uppercase tracking-wider">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsBar
        totalActive={stats.totalActive}
        breachingSLA={stats.breachingSLA}
        atRisk={stats.atRisk}
        avgTAT={stats.avgTAT}
      />

      {/* Orders table with client-side filters */}
      <div className="space-y-4">
        <DashboardFilters initialOrders={orders} />
      </div>
    </div>
  );
}
