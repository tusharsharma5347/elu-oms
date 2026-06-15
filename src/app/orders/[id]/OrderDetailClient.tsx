'use client';
// src/app/orders/[id]/OrderDetailClient.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, OrderStatusHistory, AlertLog } from '@/types';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { SLABar } from '@/components/orders/SLABar';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { AIRiskPanel } from '@/components/orders/AIRiskPanel';
import { StatusUpdateModal } from '@/components/orders/StatusUpdateModal';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Phone,
  User,
  Eye,
  Glasses,
  Package,
  Bell,
  AlertTriangle,
  BrainCircuit,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { calcSLAProgress, formatTimeRemaining } from '@/lib/sla';
import { toast } from 'sonner';

interface OrderDetailClientProps {
  order: Order & { store: { name: string; location: string } };
  history: OrderStatusHistory[];
  alerts: AlertLog[];
}

function DataRow({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0 w-28">{label}</span>
      <span className={cn('text-sm text-foreground text-right font-medium', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/40">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function OrderDetailClient({
  order: initialOrder,
  history,
  alerts,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [modalOpen, setModalOpen] = useState(false);
  const [runningAI, setRunningAI] = useState(false);

  const progress = calcSLAProgress(order.placed_at, order.sla_hours, order.status);
  const timeLabel = formatTimeRemaining(progress, order.status);

  const runAIPrediction = async () => {
    setRunningAI(true);
    try {
      const res = await fetch('/api/ai/predict-breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      });
      if (!res.ok) throw new Error('Failed to run prediction');
      const data = await res.json();
      setOrder((prev) => ({
        ...prev,
        breach_probability: data.breach_probability,
        predicted_breach: data.predicted_breach,
        ai_reasoning: `[${data.risk_level}] ${data.reasoning} Action: ${data.recommended_action}`,
      }));
      toast.success('AI prediction refreshed');
    } catch {
      toast.error('Failed to run AI prediction');
    } finally {
      setRunningAI(false);
    }
  };

  const prescriptionStr = (sph?: number | null, cyl?: number | null, axis?: number | null, add?: number | null) => {
    const parts: string[] = [];
    if (sph !== null && sph !== undefined) parts.push(`SPH ${sph > 0 ? '+' : ''}${sph}`);
    if (cyl !== null && cyl !== undefined) parts.push(`CYL ${cyl}`);
    if (axis !== null && axis !== undefined) parts.push(`Axis ${axis}°`);
    if (add !== null && add !== undefined) parts.push(`ADD +${add}`);
    return parts.length > 0 ? parts.join(' / ') : '—';
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-2xl font-bold text-primary">
              {order.order_number}
            </span>
            <StatusBadge status={order.status} size="lg" />
            {order.predicted_breach && (
              <span className="flex items-center gap-1 text-xs text-red-700 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full font-medium">
                <AlertTriangle className="h-3 w-3" />
                Breach Predicted
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Placed {format(new Date(order.placed_at), 'dd MMM yyyy, hh:mm a')} ·{' '}
            {order.store?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runAIPrediction}
            disabled={runningAI}
            className="border-border text-muted-foreground hover:bg-muted gap-1.5"
          >
            <BrainCircuit className={cn('h-4 w-4', runningAI && 'animate-pulse')} />
            {runningAI ? 'Analyzing...' : 'Re-run AI'}
          </Button>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-bold uppercase tracking-wider"
          >
            <RefreshCw className="h-4 w-4" />
            Update Status
          </Button>
        </div>
      </div>

      {/* SLA Banner */}
      <div
        className={cn(
          'border p-4 flex items-center gap-6 flex-wrap',
          progress.color === 'pulsing-red'
            ? 'bg-red-500/10 border-red-500/20 text-red-700'
            : progress.color === 'red'
            ? 'bg-red-500/5 border-red-500/15 text-red-700'
            : progress.color === 'amber'
            ? 'bg-amber-500/5 border-amber-500/15 text-amber-800'
            : 'bg-muted/40 border-border text-foreground'
        )}
      >
        <div className="flex items-center gap-2.5">
          <Clock
            className={cn(
              'h-5 w-5',
              progress.color === 'pulsing-red' || progress.color === 'red'
                ? 'text-red-500'
                : progress.color === 'amber'
                ? 'text-amber-500'
                : 'text-green-600'
            )}
          />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">SLA Status</p>
            <p
              className={cn(
                'text-sm font-semibold',
                progress.color === 'pulsing-red' || progress.color === 'red'
                  ? 'text-red-600'
                  : progress.color === 'amber'
                  ? 'text-amber-600'
                  : 'text-green-600'
              )}
            >
              {timeLabel}
            </p>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <BoxSlaBarWrapper>
            <SLABar
              placedAt={order.placed_at}
              slaHours={order.sla_hours}
              status={order.status}
              showLabel={false}
            />
          </BoxSlaBarWrapper>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0h</span>
            <span>{order.sla_hours}h SLA</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-medium">Expected Delivery</p>
          <p className="text-sm text-foreground font-semibold">
            {format(new Date(order.expected_delivery), 'dd MMM, hh:mm a')}
          </p>
        </div>
        {order.actual_delivery && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">Actual Delivery</p>
            <p className="text-sm text-green-600 font-semibold">
              {format(new Date(order.actual_delivery), 'dd MMM, hh:mm a')}
            </p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <Section title="Customer" icon={<User className="h-4 w-4" />}>
            <DataRow label="Name" value={order.customer_name} />
            <DataRow label="Phone" value={order.customer_phone} />
            <div className="flex items-center gap-1.5 py-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground font-medium">
                {order.store?.name} — {order.store?.location}
              </span>
            </div>
          </Section>

          {/* Prescription */}
          <Section title="Prescription" icon={<Eye className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                  Right Eye (OD)
                </p>
                <p className="text-sm text-foreground font-mono">
                  {prescriptionStr(order.right_sph, order.right_cyl, order.right_axis, order.right_add)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 mb-2 uppercase tracking-wider">
                  Left Eye (OS)
                </p>
                <p className="text-sm text-foreground font-mono">
                  {prescriptionStr(order.left_sph, order.left_cyl, order.left_axis, order.left_add)}
                </p>
              </div>
            </div>
            {order.pd && (
              <div className="pt-3 mt-3 border-t border-border">
                <DataRow label="PD" value={`${order.pd} mm`} />
              </div>
            )}
          </Section>

          {/* Lens & Frame */}
          <Section title="Lens & Frame" icon={<Glasses className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <p className="text-xs text-muted-foreground font-bold mb-3 uppercase tracking-wider">Lens</p>
                <DataRow label="Type" value={order.lens_type} />
                <DataRow label="Index" value={order.lens_index} />
                <DataRow label="Coating" value={order.coating ?? 'None'} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold mb-3 uppercase tracking-wider">Frame</p>
                <DataRow label="Brand" value={order.frame_brand} />
                <DataRow label="Model" value={order.frame_model} />
                <DataRow label="Color" value={order.frame_color} />
              </div>
            </div>
          </Section>

          {/* Sourcing */}
          <Section title="Sourcing" icon={<Package className="h-4 w-4" />}>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full border',
                  order.lens_in_stock
                    ? 'bg-green-500/10 text-green-700 border-green-500/20'
                    : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                )}
              >
                {order.lens_in_stock ? '✓ In Stock' : '⏳ Out of Stock — Sourcing'}
              </span>
            </div>
            {order.sourcing_notes && (
              <p className="text-sm text-foreground bg-muted/50 p-3 border border-border">
                {order.sourcing_notes}
              </p>
            )}
          </Section>

          {/* Status History */}
          <Section title="Status Timeline" icon={<Clock className="h-4 w-4" />}>
            <OrderTimeline history={history} />
          </Section>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-5">
          {/* AI Risk Panel */}
          <AIRiskPanel order={order} />

          {/* Alerts */}
          <Section title="Alerts Sent" icon={<Bell className="h-4 w-4" />}>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No alerts sent.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2.5 text-xs border',
                      alert.alert_type === 'SLA_BREACHED'
                        ? 'bg-red-500/10 border-red-500/20 text-red-700 font-medium'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-medium'
                    )}
                  >
                    <span className="font-semibold">
                      {alert.alert_type === 'SLA_BREACHED' ? '🚨 SLA Breached' : '⚠️ Breach Predicted'}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(alert.sent_at), 'dd MMM, hh:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      <StatusUpdateModal
        order={order}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(updated) => {
          setOrder((prev) => ({ ...prev, ...updated }));
          router.refresh();
        }}
      />
    </div>
  );
}

// Simple wrapper to ensure the SLA bar itself inside details can be cleanly housed
function BoxSlaBarWrapper({ children }: { children: React.ReactNode }) {
  return <div className="[&>div]:rounded-none">{children}</div>;
}
