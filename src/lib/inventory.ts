// src/lib/inventory.ts
import { createAdminClient } from '@/lib/supabase';
import type { CheckStockRequest, CheckStockResponse } from '@/types';

/**
 * Checks if a matching lens is available in inventory by querying Supabase directly.
 */
export async function checkStockInternal(
  body: CheckStockRequest
): Promise<CheckStockResponse> {
  const supabase = createAdminClient();
  const {
    lens_type,
    lens_index,
    coating,
    right_sph,
    right_cyl,
    left_sph,
    left_cyl,
  } = body;

  // Use the worst-case power (highest absolute values) to determine range
  const rightSphVal = right_sph ?? 0;
  const leftSphVal = left_sph ?? 0;
  const rightCylVal = right_cyl ?? 0;
  const leftCylVal = left_cyl ?? 0;

  const targetSph =
    Math.abs(rightSphVal) >= Math.abs(leftSphVal) ? rightSphVal : leftSphVal;
  const targetCyl =
    Math.abs(rightCylVal) >= Math.abs(leftCylVal) ? rightCylVal : leftCylVal;

  // Build query: find matching inventory with power in range and qty > 0
  let query = supabase
    .from('lens_inventory')
    .select('*')
    .eq('lens_type', lens_type)
    .eq('lens_index', lens_index)
    .lte('power_sph_min', targetSph)
    .gte('power_sph_max', targetSph)
    .lte('power_cyl_min', targetCyl)
    .gte('power_cyl_max', targetCyl)
    .gt('quantity', 0);

  if (coating) {
    query = query.eq('coating', coating);
  }

  const { data, error } = await query
    .order('quantity', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[checkStockInternal]', error);
    throw new Error(error.message);
  }

  const match = data?.[0];
  return {
    inStock: !!match,
    inventoryId: match?.id ?? null,
    qty: match?.quantity ?? 0,
  };
}
