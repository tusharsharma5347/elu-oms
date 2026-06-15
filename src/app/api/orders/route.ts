// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateOrderNumber } from '@/lib/order-utils';
import { getSLAHours, calcExpectedDelivery } from '@/lib/sla';
import { checkStockInternal } from '@/lib/inventory';
import type { CreateOrderRequest, Order } from '@/types';

// GET /api/orders — list orders with optional filters
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.getAll('status');
  const lens_type = searchParams.getAll('lens_type');
  const store_id = searchParams.getAll('store_id');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  let query = supabase
    .from('orders')
    .select('*, store:stores(*)')
    .order('placed_at', { ascending: false });

  if (status.length > 0) query = query.in('status', status);
  if (lens_type.length > 0) query = query.in('lens_type', lens_type);
  if (store_id.length > 0) query = query.in('store_id', store_id);
  if (date_from) query = query.gte('placed_at', date_from);
  if (date_to) query = query.lte('placed_at', date_to);

  const { data, error } = await query;

  if (error) {
    console.error('[GET /api/orders]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/orders — create a new order
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    let body: CreateOrderRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.store_id || !body.customer_name || !body.lens_type || !body.lens_index) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check stock
    let stockData;
    try {
      stockData = await checkStockInternal({
        lens_type: body.lens_type,
        lens_index: body.lens_index,
        coating: body.coating ?? null,
        right_sph: body.right_sph,
        right_cyl: body.right_cyl,
        left_sph: body.left_sph,
        left_cyl: body.left_cyl,
      });
    } catch (err) {
      console.error('[POST /api/orders] Stock check failed:', err);
      return NextResponse.json({ error: 'Failed to verify inventory' }, { status: 500 });
    }
    const lensInStock = stockData.inStock ?? false;

    // Get existing order numbers for today to generate unique order number
    const today = new Date().toISOString().split('T')[0];
    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('orders')
      .select('order_number')
      .gte('placed_at', `${today}T00:00:00Z`);

    if (todayOrdersError) {
      console.error('[POST /api/orders] Failed to fetch today\'s orders:', todayOrdersError);
      return NextResponse.json({ error: todayOrdersError.message }, { status: 500 });
    }

    const existingNumbers = (todayOrders ?? []).map((o: { order_number: string }) => o.order_number);
    const orderNumber = await generateOrderNumber(existingNumbers);

    const slaHours = getSLAHours(body.lens_type);
    const placedAt = new Date();
    const expectedDelivery = calcExpectedDelivery(placedAt, slaHours);
    const initialStatus = lensInStock ? 'CUTTING_EDGING' : 'LENS_SOURCING';

    // If CUTTING_EDGING and in stock, decrement inventory
    if (lensInStock && stockData.inventoryId) {
      const { error: rpcError } = await supabase.rpc('decrement_inventory', {
        inventory_id: stockData.inventoryId,
        amount: 1,
      });
      if (rpcError) {
        // Fallback if RPC not available or fails
        await supabase
          .from('lens_inventory')
          .update({ quantity: Math.max(0, stockData.qty - 1) })
          .eq('id', stockData.inventoryId);
      }
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        store_id: body.store_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone ?? null,
        right_sph: body.right_sph ?? null,
        right_cyl: body.right_cyl ?? null,
        right_axis: body.right_axis ?? null,
        right_add: body.right_add ?? null,
        left_sph: body.left_sph ?? null,
        left_cyl: body.left_cyl ?? null,
        left_axis: body.left_axis ?? null,
        left_add: body.left_add ?? null,
        pd: body.pd ?? null,
        lens_type: body.lens_type,
        lens_index: body.lens_index,
        coating: body.coating ?? null,
        frame_brand: body.frame_brand ?? null,
        frame_model: body.frame_model ?? null,
        frame_color: body.frame_color ?? null,
        lens_in_stock: lensInStock,
        sourcing_notes: body.sourcing_notes ?? null,
        status: initialStatus,
        sla_hours: slaHours,
        placed_at: placedAt.toISOString(),
        expected_delivery: expectedDelivery.toISOString(),
      })
      .select('*, store:stores(*)')
      .single();

    if (error) {
      console.error('[POST /api/orders] Insert failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log initial status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: initialStatus,
      reason: lensInStock
        ? 'Lens in stock — proceeding to cutting & edging'
        : 'Lens out of stock — initiating sourcing',
    });

    // Trigger AI prediction asynchronously (don't block response)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/predict-breach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      }).catch(console.error);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const errorObject = err instanceof Error ? err : new Error(String(err));
    console.error('[POST /api/orders] CRITICAL EXCEPTION:', errorObject);
    return NextResponse.json(
      {
        error: errorObject.message,
        stack: errorObject.stack,
      },
      { status: 500 }
    );
  }
}
