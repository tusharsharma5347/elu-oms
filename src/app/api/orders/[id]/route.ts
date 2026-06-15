// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getValidTransitions, STATUS_LABELS } from '@/lib/order-utils';
import type { UpdateStatusRequest, OrderStatus } from '@/types';

// GET /api/orders/[id] — order detail with history and alerts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [orderRes, historyRes, alertsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, store:stores(*)')
      .eq('id', id)
      .single(),
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

  if (orderRes.error) {
    if (orderRes.error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ error: orderRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    order: orderRes.data,
    history: historyRes.data ?? [],
    alerts: alertsRes.data ?? [],
  });
}

// PATCH /api/orders/[id] — update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  let body: UpdateStatusRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.status || !body.reason) {
    return NextResponse.json(
      { error: 'status and reason are required' },
      { status: 400 }
    );
  }

  // Fetch current order
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const validTransitions = getValidTransitions(currentOrder.status as OrderStatus);
  if (!validTransitions.includes(body.status as OrderStatus)) {
    return NextResponse.json(
      {
        error: `Invalid transition from ${currentOrder.status} to ${body.status}`,
        valid_transitions: validTransitions,
      },
      { status: 422 }
    );
  }

  // If transitioning to CUTTING_EDGING from QC_FAILED, add auto note
  let reason = body.reason;
  if (body.status === 'CUTTING_EDGING' && currentOrder.status === 'QC_FAILED') {
    reason = `Re-entering cutting & edging. ${reason}`;
  }

  // Update delivery timestamp if delivered
  const updatePayload: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };
  if (body.status === 'DELIVERED') {
    updatePayload.actual_delivery = new Date().toISOString();
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select('*, store:stores(*)')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log status history
  await supabase.from('order_status_history').insert({
    order_id: id,
    from_status: currentOrder.status,
    to_status: body.status,
    reason,
    changed_by: body.changed_by ?? null,
    changed_at: new Date().toISOString(),
  });

  // Trigger AI prediction re-run and alert check asynchronously
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    Promise.all([
      fetch(`${appUrl}/api/ai/predict-breach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: id }),
      }),
    ]).catch(console.error);
  }

  return NextResponse.json(updatedOrder);
}
