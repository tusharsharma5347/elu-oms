'use client';
// src/components/orders/OrderTable.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { SLABar } from './SLABar';
import { StatusUpdateModal } from './StatusUpdateModal';
import { createClient } from '@/lib/supabase';
import type { Order, OrderFilters } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  PackageSearch,
} from 'lucide-react';

interface OrderTableProps {
  initialOrders?: Order[];
  filters?: OrderFilters;
}

export function OrderTable({ initialOrders, filters }: OrderTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders ?? []);
  const [loading, setLoading] = useState(!initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      filters?.status?.forEach((s) => params.append('status', s));
      filters?.lens_type?.forEach((l) => params.append('lens_type', l));
      filters?.store_id?.forEach((s) => params.append('store_id', s));
      if (filters?.date_from) params.set('date_from', filters.date_from);
      if (filters?.date_to) params.set('date_to', filters.date_to);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!initialOrders) {
      fetchOrders();
    } else {
      setOrders(initialOrders);
    }
  }, [initialOrders, fetchOrders]);

  // Real-time subscription via Supabase
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === (payload.new as Order).id
                  ? { ...o, ...(payload.new as Order) }
                  : o
              )
            );
            router.refresh();
          } else if (payload.eventType === 'INSERT') {
            fetchOrders();
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, router]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-muted" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-foreground text-lg font-semibold">No orders found</p>
        <p className="text-muted-foreground text-sm mt-1">
          Try adjusting your filters or create a new order.
        </p>
        <Button
          className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => router.push('/orders/new')}
        >
          Create Order
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Order #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Store
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Lens
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                  SLA
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                  AI Risk
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => {
                const isAtRisk = (order.breach_probability ?? 0) > 0.5;
                const isCritical = (order.breach_probability ?? 0) > 0.75;

                return (
                  <tr
                    key={order.id}
                    className={cn(
                      'group hover:bg-muted/40 transition-colors cursor-pointer',
                      isCritical && 'bg-red-500/[0.02] hover:bg-red-500/[0.05]',
                      isAtRisk && !isCritical && 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]'
                    )}
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isCritical && (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-mono text-xs text-indigo-600 font-semibold">
                          {order.order_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-xs">{order.customer_name}</p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-foreground/80">
                        {(order as Order & { store?: { name: string } }).store?.name ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-foreground/90 font-medium">{order.lens_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.lens_index} {order.coating && `· ${order.coating}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <SLABar
                        placedAt={order.placed_at}
                        slaHours={order.sla_hours}
                        status={order.status}
                      />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {order.breach_probability !== null ? (
                        <span
                          className={cn(
                            'text-xs font-bold tabular-nums',
                            (order.breach_probability ?? 0) < 0.5
                              ? 'text-green-600'
                              : (order.breach_probability ?? 0) < 0.75
                              ? 'text-amber-600'
                              : 'text-red-600'
                          )}
                        >
                          {Math.round((order.breach_probability ?? 0) * 100)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => {
                            setSelectedOrder(order);
                            setModalOpen(true);
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <StatusUpdateModal
          order={selectedOrder}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedOrder(null);
          }}
          onSuccess={(updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
            router.refresh();
          }}
        />
      )}
    </>
  );
}
