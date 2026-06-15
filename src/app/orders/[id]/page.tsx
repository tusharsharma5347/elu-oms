// src/app/orders/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import type { Order, OrderStatusHistory, AlertLog } from '@/types';
import { OrderDetailClient } from './OrderDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fresh for detail page

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select('order_number, customer_name')
    .eq('id', id)
    .single();

  if (!data) return { title: 'Order Not Found' };

  return {
    title: `${data.order_number} — ${data.customer_name}`,
    description: `Order detail for ${data.customer_name}`,
  };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [orderRes, historyRes, alertsRes] = await Promise.all([
    supabase.from('orders').select('*, store:stores(*)').eq('id', id).single(),
    supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('changed_at', { ascending: true }),
    supabase
      .from('alerts_log')
      .select('*')
      .eq('order_id', id)
      .order('sent_at', { ascending: false }),
  ]);

  if (orderRes.error || !orderRes.data) {
    notFound();
  }

  return (
    <OrderDetailClient
      order={orderRes.data as Order & { store: { name: string; location: string } }}
      history={(historyRes.data ?? []) as OrderStatusHistory[]}
      alerts={(alertsRes.data ?? []) as AlertLog[]}
    />
  );
}
