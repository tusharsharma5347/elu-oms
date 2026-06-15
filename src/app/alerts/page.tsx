// src/app/alerts/page.tsx
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase';
import type { AlertLog, Order } from '@/types';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Alert Log',
  description: 'View all SLA breach alerts and predictions sent by the system.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 30;

async function getAlerts() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('alerts_log')
    .select('*, order:orders(id, order_number, customer_name, status, store:stores(name))')
    .order('sent_at', { ascending: false });

  return (data ?? []) as Array<AlertLog & { order: Order & { store: { name: string } } }>;
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/10 text-red-600 border border-red-500/20">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alert Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All SLA breach predictions and breach notifications
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-card border border-border px-4 py-2">
          <span className="text-sm text-muted-foreground font-medium">Total Alerts</span>
          <span className="text-sm font-bold text-foreground">{alerts.length}</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-border bg-card">
          <CheckCircle className="h-12 w-12 text-green-600/40 mb-4" />
          <p className="text-muted-foreground text-lg font-bold">No alerts sent yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Alerts are sent when orders exceed a 75% breach probability or miss SLA.
          </p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Order', 'Customer', 'Store', 'Alert Type', 'Channel', 'Sent At'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alerts.map((alert) => {
                const isBreach = alert.alert_type === 'SLA_BREACHED';
                return (
                  <tr
                    key={alert.id}
                    className={cn(
                      'hover:bg-muted/40 transition-colors',
                      isBreach ? 'bg-red-500/[0.02]' : 'bg-amber-500/[0.02]'
                    )}
                  >
                    <td className="px-4 py-3">
                      {alert.order ? (
                        <Link
                          href={`/orders/${alert.order.id}`}
                          className="font-mono text-xs text-primary hover:underline font-bold"
                        >
                          {alert.order.order_number}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-medium">
                      {alert.order?.customer_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {alert.order?.store?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          isBreach
                            ? 'bg-red-500/10 text-red-700 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                        )}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {isBreach ? 'SLA Breached' : 'Breach Predicted'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                      {alert.channel ?? 'email'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(alert.sent_at), 'dd MMM yyyy, hh:mm a')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
