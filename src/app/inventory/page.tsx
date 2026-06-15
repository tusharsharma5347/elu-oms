// src/app/inventory/page.tsx
import type { Metadata } from 'next';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { createAdminClient } from '@/lib/supabase';
import { Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Lens Inventory',
  description: 'Manage lens stock levels across all types, indices, and coatings.',
};

export const dynamic = 'force-dynamic';

async function getInventorySummary() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('lens_inventory')
    .select('quantity, reorder_threshold');

  const items = (data ?? []) as Array<{ quantity: number; reorder_threshold: number }>;
  return {
    total: items.length,
    outOfStock: items.filter((i) => i.quantity === 0).length,
    lowStock: items.filter((i) => i.quantity > 0 && i.quantity <= i.reorder_threshold).length,
  };
}

export default async function InventoryPage() {
  const summary = await getInventorySummary();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 text-primary border border-primary/20">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lens Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage stock levels across all lens types and coatings
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2">
          <span className="text-sm text-muted-foreground font-medium">Total SKUs</span>
          <span className="text-sm font-bold text-foreground">{summary.total}</span>
        </div>
        {summary.outOfStock > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2">
            <span className="text-sm text-red-700 font-medium">Out of Stock</span>
            <span className="text-sm font-bold text-red-700">{summary.outOfStock}</span>
          </div>
        )}
        {summary.lowStock > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2">
            <span className="text-sm text-amber-700 font-medium">Low Stock</span>
            <span className="text-sm font-bold text-amber-700">{summary.lowStock}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <InventoryTable />
    </div>
  );
}
