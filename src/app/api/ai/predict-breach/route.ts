// src/app/api/ai/predict-breach/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { predictBreach } from '@/lib/gemini';
import { calcSLAProgress } from '@/lib/sla';
import { format } from 'date-fns';
import type { Order } from '@/types';

// POST /api/ai/predict-breach
// Runs Gemini prediction for a specific order and saves results
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  let body: { order_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.order_id) {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
  }

  // Fetch order + store
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*, store:stores(*)')
    .eq('id', body.order_id)
    .single();

  if (orderError || !orderData) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orderData as Order & { store: { name: string } };

  // Count QC failures from history
  const { data: history } = await supabase
    .from('order_status_history')
    .select('to_status')
    .eq('order_id', body.order_id)
    .eq('to_status', 'QC_FAILED');

  const qcFailureCount = history?.length ?? 0;

  // Calculate SLA progress
  const progress = calcSLAProgress(order.placed_at, order.sla_hours, order.status);
  const dayOfWeek = format(new Date(order.placed_at), 'EEEE');

  // Call Gemini
  const prediction = await predictBreach({
    order,
    storeName: order.store?.name ?? 'Unknown',
    qcFailureCount,
    hoursElapsed: progress.elapsed_hours,
    hoursRemaining: progress.remaining_hours,
    dayOfWeek,
  });

  // Save prediction to orders table
  const { error: saveError } = await supabase
    .from('orders')
    .update({
      predicted_breach: prediction.predicted_breach,
      breach_probability: prediction.breach_probability,
      ai_reasoning: `[${prediction.risk_level}] ${prediction.reasoning} Action: ${prediction.recommended_action}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.order_id);

  if (saveError) {
    console.error('[predict-breach] save error:', saveError);
  }

  // Check if alert should be sent
  if (prediction.breach_probability > 0.75) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const alertType = progress.is_overdue ? 'SLA_BREACHED' : 'SLA_BREACH_PREDICTED';
      fetch(`${appUrl}/api/alerts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: body.order_id, alert_type: alertType }),
      }).catch(console.error);
    }
  }

  return NextResponse.json({
    order_id: body.order_id,
    ...prediction,
  });
}
