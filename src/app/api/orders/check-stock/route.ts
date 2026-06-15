// src/app/api/orders/check-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkStockInternal } from '@/lib/inventory';
import type { CheckStockRequest } from '@/types';

// POST /api/orders/check-stock
// Checks if a matching lens is available in inventory
export async function POST(request: NextRequest) {
  let body: CheckStockRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const response = await checkStockInternal(body);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown stock check error' },
      { status: 500 }
    );
  }
}
