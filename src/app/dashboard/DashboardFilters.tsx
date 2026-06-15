'use client';
// src/app/dashboard/DashboardFilters.tsx
import { useState, useMemo } from 'react';
import { OrderTable } from '@/components/orders/OrderTable';
import type { Order, OrderStatus, LensType } from '@/types';
import { STATUS_LABELS } from '@/lib/order-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: OrderStatus[] = [
  'ORDER_PLACED',
  'LENS_SOURCING',
  'CUTTING_EDGING',
  'QC',
  'QC_FAILED',
  'DISPATCH',
  'DELIVERED',
  'CANCELLED',
];

const LENS_TYPES: LensType[] = ['SV', 'BF', 'Progressive', 'KT'];

interface DashboardFiltersProps {
  initialOrders: Order[];
}

export function DashboardFilters({ initialOrders }: DashboardFiltersProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [selectedLensTypes, setSelectedLensTypes] = useState<LensType[]>([]);

  const stores = useMemo(() => {
    const map = new Map<string, string>();
    initialOrders.forEach((o) => {
      const store = (o as Order & { store?: { id: string; name: string } }).store;
      if (store) map.set(store.id, store.name);
    });
    return Array.from(map.entries());
  }, [initialOrders]);

  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  const toggleStatus = (s: OrderStatus) =>
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const toggleLens = (l: LensType) =>
    setSelectedLensTypes((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );

  const toggleStore = (id: string) =>
    setSelectedStores((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const clearAll = () => {
    setSelectedStatuses([]);
    setSelectedLensTypes([]);
    setSelectedStores([]);
  };

  const hasFilters =
    selectedStatuses.length > 0 ||
    selectedLensTypes.length > 0 ||
    selectedStores.length > 0;

  // Client-side filter
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((o) => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(o.status as OrderStatus)) return false;
      if (selectedLensTypes.length > 0 && !selectedLensTypes.includes(o.lens_type as LensType)) return false;
      if (selectedStores.length > 0) {
        const storeId = (o as Order & { store?: { id: string } }).store?.id;
        if (!storeId || !selectedStores.includes(storeId)) return false;
      }
      return true;
    });
  }, [initialOrders, selectedStatuses, selectedLensTypes, selectedStores]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Filters</span>
          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              className="ml-auto h-6 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>

        {/* Status filter */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={cn(
                  'text-xs px-2.5 py-1 border transition-all font-medium',
                  selectedStatuses.includes(s)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Lens Type filter */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Lens Type</p>
          <div className="flex flex-wrap gap-1.5">
            {LENS_TYPES.map((l) => (
              <button
                key={l}
                onClick={() => toggleLens(l)}
                className={cn(
                  'text-xs px-2.5 py-1 border transition-all font-medium',
                  selectedLensTypes.includes(l)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Store filter */}
        {stores.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Store</p>
            <div className="flex flex-wrap gap-1.5">
              {stores.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => toggleStore(id)}
                  className={cn(
                    'text-xs px-2.5 py-1 border transition-all font-medium',
                    selectedStores.includes(id)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">
          Showing <span className="text-foreground font-bold">{filteredOrders.length}</span> of{' '}
          <span className="text-foreground font-bold">{initialOrders.length}</span> orders
        </span>
        {hasFilters && (
          <Badge variant="outline" className="text-xs border-primary/30 text-primary rounded-none">
            Filtered
          </Badge>
        )}
      </div>

      <OrderTable initialOrders={filteredOrders} />
    </div>
  );
}
