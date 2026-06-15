// src/app/api/cron/refresh-predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { ACTIVE_STATUSES } from '@/lib/order-utils';

// GET /api/cron/refresh-predictions
// Called every 2h by Vercel Cron to refresh AI predictions for all active orders
export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all active (non-terminal) orders
  const { data: activeOrders, error } = await supabase
    .from('orders')
    .select('id, order_number')
    .in('status', ACTIVE_STATUSES);

  if (error) {
    console.error('[cron/refresh-predictions]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not set' }, { status: 500 });
  }

  const results: Array<{ order_id: string; success: boolean; error?: string }> = [];

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < (activeOrders?.length ?? 0); i += batchSize) {
    const batch = activeOrders!.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (order: { id: string; order_number: string }) => {
        try {
          const res = await fetch(`${appUrl}/api/ai/predict-breach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: order.id }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            results.push({ order_id: order.id, success: false, error: errData.error });
          } else {
            results.push({ order_id: order.id, success: true });
          }
        } catch (err) {
          results.push({
            order_id: order.id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      })
    );

    // Small delay between batches to respect Gemini API rate limits
    if (i + batchSize < (activeOrders?.length ?? 0)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    processed: results.length,
    success: successCount,
    failed: failCount,
    results,
  });
}
