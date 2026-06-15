'use client';
// src/components/orders/StatusUpdateModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from './StatusBadge';
import { getValidTransitions, STATUS_LABELS } from '@/lib/order-utils';
import type { Order, OrderStatus } from '@/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StatusUpdateModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export function StatusUpdateModal({
  order,
  open,
  onClose,
  onSuccess,
}: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const validTransitions = getValidTransitions(order.status);

  const handleSubmit = async () => {
    if (!selectedStatus || !reason.trim()) {
      toast.error('Please select a status and provide a reason.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, reason: reason.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to update status');
      }

      const updated = await res.json();
      toast.success(`Status updated to "${STATUS_LABELS[selectedStatus]}"`);
      onSuccess(updated);
      onClose();
      setSelectedStatus('');
      setReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Update Order Status</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Order <span className="font-mono font-semibold text-indigo-600">{order.order_number}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current status */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Current Status</p>
            <StatusBadge status={order.status} size="md" />
          </div>

          {/* New status */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">New Status *</p>
            {validTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground/80 italic">
                No further transitions available.
              </p>
            ) : (
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus((val ?? '') as OrderStatus)}
              >
                <SelectTrigger className="bg-transparent border-border text-foreground">
                  <SelectValue placeholder="Select next status..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {validTransitions.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-foreground hover:bg-muted focus:bg-muted"
                    >
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
              Reason / Notes *
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly explain the status change..."
              className="bg-transparent border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedStatus || !reason.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
