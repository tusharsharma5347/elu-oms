// src/app/api/alerts/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendBreachAlert } from '@/lib/resend';
import { calcSLAProgress } from '@/lib/sla';
import type { SendAlertRequest, Order, AlertType } from '@/types';
import { differenceInHours } from 'date-fns';

const ALERT_COOLDOWN_HOURS = 6;

// POST /api/alerts/send
// Sends an email alert if not already sent within cooldown period
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  let body: SendAlertRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.order_id || !body.alert_type) {
    return NextResponse.json({ error: 'order_id and alert_type are required' }, { status: 400 });
  }

  // Check cooldown: no alert of same type in last 6 hours
  const { data: recentAlerts } = await supabase
    .from('alerts_log')
    .select('sent_at')
    .eq('order_id', body.order_id)
    .eq('alert_type', body.alert_type)
    .order('sent_at', { ascending: false })
    .limit(1);

  const lastAlert = recentAlerts?.[0];
  if (lastAlert) {
    const hoursSinceLast = differenceInHours(new Date(), new Date(lastAlert.sent_at));
    if (hoursSinceLast < ALERT_COOLDOWN_HOURS) {
      return NextResponse.json({
        skipped: true,
        reason: `Alert already sent ${hoursSinceLast}h ago (cooldown: ${ALERT_COOLDOWN_HOURS}h)`,
      });
    }
  }

  // Fetch order with store
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*, store:stores(*)')
    .eq('id', body.order_id)
    .single();

  if (orderError || !orderData) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orderData as Order & { store: { name: string } };
  const progress = calcSLAProgress(order.placed_at, order.sla_hours, order.status);

  // Parse AI reasoning if structured
  let aiReasoning = order.ai_reasoning ?? undefined;
  let aiRecommendedAction: string | undefined;
  if (aiReasoning?.startsWith('[')) {
    const actionIdx = aiReasoning.indexOf('Action: ');
    if (actionIdx > -1) {
      aiRecommendedAction = aiReasoning.slice(actionIdx + 8);
      aiReasoning = aiReasoning.slice(0, actionIdx).trim();
    }
  }

  const sent = await sendBreachAlert({
    order,
    alertType: body.alert_type as AlertType,
    hoursOverdue: progress.is_overdue ? Math.abs(progress.remaining_hours) : undefined,
    hoursRemaining: !progress.is_overdue ? progress.remaining_hours : undefined,
    aiReasoning,
    aiRecommendedAction,
  });

  if (sent) {
    // Log to alerts_log
    await supabase.from('alerts_log').insert({
      order_id: body.order_id,
      alert_type: body.alert_type,
      channel: 'email',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ sent: true });
  }

  return NextResponse.json({ sent: false, reason: 'Email send failed' }, { status: 500 });
}
