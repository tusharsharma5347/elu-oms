'use client';
// src/components/inventory/InventoryTable.tsx
import { useState, useEffect } from 'react';
import type { LensInventory } from '@/types';
import { createClient } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Pencil, Check, X, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';

function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 border border-red-500/20">
        OUT OF STOCK
      </span>
    );
  }
  if (qty <= threshold) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
        LOW STOCK
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 border border-green-500/20">
      IN STOCK
    </span>
  );
}

export function InventoryTable() {
  const [inventory, setInventory] = useState<LensInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCoating, setFilterCoating] = useState<string>('all');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('lens_inventory')
      .select('*')
      .order('lens_type')
      .order('lens_index')
      .then(({ data }) => {
        setInventory(data ?? []);
        setLoading(false);
      });
  }, []);

  const filteredInventory = inventory.filter((item) => {
    if (filterType !== 'all' && item.lens_type !== filterType) return false;
    if (filterCoating !== 'all' && item.coating !== filterCoating) return false;
    return true;
  });

  const handleEditSave = async (id: string) => {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Quantity must be a non-negative integer');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('lens_inventory')
      .update({ quantity: qty, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update quantity');
      return;
    }

    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
    setEditingId(null);
    toast.success('Quantity updated');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
          <SelectTrigger className="w-40 bg-card border-border text-foreground">
            <SelectValue placeholder="Lens Type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {['all', 'SV', 'BF', 'Progressive', 'KT'].map((t) => (
              <SelectItem key={t} value={t} className="text-foreground hover:bg-muted">
                {t === 'all' ? 'All Types' : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCoating} onValueChange={(v) => setFilterCoating(v ?? 'all')}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground">
            <SelectValue placeholder="Coating" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {['all', 'AR', 'BlueCut', 'Photochromic', 'None'].map((c) => (
              <SelectItem key={c} value={c} className="text-foreground hover:bg-muted">
                {c === 'all' ? 'All Coatings' : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center ml-auto">
          Showing {filteredInventory.length} of {inventory.length} items
        </div>
      </div>

      {/* Table */}
      {filteredInventory.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No inventory items match the current filters.</p>
        </div>
      ) : (
        <div className="border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Lens Type', 'Index', 'SPH Range', 'CYL Range', 'Coating', 'Qty', 'Status', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-muted/40 transition-colors',
                      item.quantity === 0 && 'bg-red-500/[0.02]',
                      item.quantity > 0 &&
                        item.quantity <= item.reorder_threshold &&
                        'bg-amber-500/[0.02]'
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{item.lens_type}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground/85">{item.lens_index}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {item.power_sph_min} to {item.power_sph_max}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {item.power_cyl_min} to {item.power_cyl_max}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{item.coating ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="h-7 w-20 bg-muted border-border text-foreground text-xs"
                            min={0}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-600 hover:bg-green-500/10"
                            onClick={() => handleEditSave(item.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            item.quantity === 0
                              ? 'text-red-600'
                              : item.quantity <= item.reorder_threshold
                              ? 'text-amber-600'
                              : 'text-foreground'
                          )}
                        >
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge qty={item.quantity} threshold={item.reorder_threshold} />
                    </td>
                    <td className="px-4 py-3">
                      {editingId !== item.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditQty(String(item.quantity));
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
