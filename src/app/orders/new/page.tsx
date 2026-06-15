'use client';
// src/app/orders/new/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import type { Store, LensType, Coating, CreateOrderRequest } from '@/types';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, PackagePlus, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LENS_TYPES: LensType[] = ['SV', 'BF', 'Progressive', 'KT'];
const LENS_INDICES = [1.5, 1.56, 1.6, 1.67, 1.74];
const COATINGS: Coating[] = ['AR', 'BlueCut', 'Photochromic', 'None'];

interface StockStatus {
  checking: boolean;
  inStock: boolean | null;
  qty: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockStatus, setStockStatus] = useState<StockStatus>({
    checking: false,
    inStock: null,
    qty: 0,
  });

  const [form, setForm] = useState({
    store_id: '',
    customer_name: '',
    customer_phone: '',
    right_sph: '',
    right_cyl: '',
    right_axis: '',
    right_add: '',
    left_sph: '',
    left_cyl: '',
    left_axis: '',
    left_add: '',
    pd: '',
    lens_type: '' as LensType | '',
    lens_index: '' as string,
    coating: '' as Coating | '',
    frame_brand: '',
    frame_model: '',
    frame_color: '',
    sourcing_notes: '',
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.from('stores').select('*').order('name').then(({ data }) => {
      setStores(data ?? []);
    });
  }, []);

  // Auto-check stock when lens details change
  useEffect(() => {
    if (!form.lens_type || !form.lens_index) return;

    const timer = setTimeout(async () => {
      setStockStatus({ checking: true, inStock: null, qty: 0 });
      try {
        const res = await fetch('/api/orders/check-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lens_type: form.lens_type,
            lens_index: parseFloat(form.lens_index),
            coating: form.coating || null,
            right_sph: form.right_sph ? parseFloat(form.right_sph) : undefined,
            right_cyl: form.right_cyl ? parseFloat(form.right_cyl) : undefined,
            left_sph: form.left_sph ? parseFloat(form.left_sph) : undefined,
            left_cyl: form.left_cyl ? parseFloat(form.left_cyl) : undefined,
          }),
        });
        const data = await res.json();
        setStockStatus({ checking: false, inStock: data.inStock, qty: data.qty });
      } catch {
        setStockStatus({ checking: false, inStock: null, qty: 0 });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [form.lens_type, form.lens_index, form.coating, form.right_sph, form.right_cyl, form.left_sph, form.left_cyl]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.store_id || !form.customer_name || !form.lens_type || !form.lens_index) {
      toast.error('Please fill in all required fields (Store, Customer, Lens Type, Index).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateOrderRequest = {
        store_id: form.store_id,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || undefined,
        right_sph: form.right_sph ? parseFloat(form.right_sph) : undefined,
        right_cyl: form.right_cyl ? parseFloat(form.right_cyl) : undefined,
        right_axis: form.right_axis ? parseInt(form.right_axis) : undefined,
        right_add: form.right_add ? parseFloat(form.right_add) : undefined,
        left_sph: form.left_sph ? parseFloat(form.left_sph) : undefined,
        left_cyl: form.left_cyl ? parseFloat(form.left_cyl) : undefined,
        left_axis: form.left_axis ? parseInt(form.left_axis) : undefined,
        left_add: form.left_add ? parseFloat(form.left_add) : undefined,
        pd: form.pd ? parseFloat(form.pd) : undefined,
        lens_type: form.lens_type as LensType,
        lens_index: parseFloat(form.lens_index),
        coating: (form.coating as Coating) || undefined,
        frame_brand: form.frame_brand.trim() || undefined,
        frame_model: form.frame_model.trim() || undefined,
        frame_color: form.frame_color.trim() || undefined,
        sourcing_notes: form.sourcing_notes.trim() || undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create order');
      }

      const order = await res.json();
      toast.success(`Order ${order.order_number} created!`);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };



  const inputClass =
    'bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50';

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Create New Order</h1>
            <p className="text-xs text-muted-foreground">
              Stock will be auto-checked and SLA will be set based on lens type
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer & Store */}
        <Section title="Customer & Store">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Store" required>
              <Select value={form.store_id} onValueChange={(v) => handleChange('store_id', v ?? '')}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select store..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-foreground hover:bg-muted">
                      {s.name} — {s.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Customer Name" required>
              <Input
                value={form.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
            </Field>
            <Field label="Phone Number">
              <Input
                value={form.customer_phone}
                onChange={(e) => handleChange('customer_phone', e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        {/* Prescription */}
        <Section title="Prescription">
          <div className="grid grid-cols-2 gap-6">
            {/* Right Eye */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                Right Eye (OD)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SPH">
                  <Input
                    type="number"
                    step="0.25"
                    value={form.right_sph}
                    onChange={(e) => handleChange('right_sph', e.target.value)}
                    placeholder="-2.00"
                    className={inputClass}
                  />
                </Field>
                <Field label="CYL">
                  <Input
                    type="number"
                    step="0.25"
                    value={form.right_cyl}
                    onChange={(e) => handleChange('right_cyl', e.target.value)}
                    placeholder="-0.50"
                    className={inputClass}
                  />
                </Field>
                <Field label="Axis">
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={form.right_axis}
                    onChange={(e) => handleChange('right_axis', e.target.value)}
                    placeholder="180"
                    className={inputClass}
                  />
                </Field>
                <Field label="ADD">
                  <Input
                    type="number"
                    step="0.25"
                    value={form.right_add}
                    onChange={(e) => handleChange('right_add', e.target.value)}
                    placeholder="2.00"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {/* Left Eye */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Left Eye (OS)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SPH">
                  <Input
                    type="number"
                    step="0.25"
                    value={form.left_sph}
                    onChange={(e) => handleChange('left_sph', e.target.value)}
                    placeholder="-2.00"
                    className={inputClass}
                  />
                </Field>
                <Field label="CYL">
                  <Input
                    type="number"
                    step="0.25"
                    value={form.left_cyl}
                    onChange={(e) => handleChange('left_cyl', e.target.value)}
                    placeholder="-0.50"
                    className={inputClass}
                  />
                </Field>
                <Field label="Axis">
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={form.left_axis}
                    onChange={(e) => handleChange('left_axis', e.target.value)}
                    placeholder="175"
                    className={inputClass}
                  />
                </Field>
                <Field label="ADD">
                  <Input
                    type="number"
                    step="0.25"
                    value={form.left_add}
                    onChange={(e) => handleChange('left_add', e.target.value)}
                    placeholder="2.00"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* PD */}
          <div className="max-w-32">
            <Field label="PD (mm)">
              <Input
                type="number"
                step="0.5"
                value={form.pd}
                onChange={(e) => handleChange('pd', e.target.value)}
                placeholder="64.0"
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        {/* Lens Specification */}
        <Section title="Lens Specification">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Lens Type" required>
              <Select
                value={form.lens_type}
                onValueChange={(v) => handleChange('lens_type', v ?? '')}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {LENS_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-foreground hover:bg-muted">
                      {t}
                      {t === 'SV' && ' — Single Vision (24h SLA)'}
                      {t === 'BF' && ' — Bifocal (48h SLA)'}
                      {t === 'Progressive' && ' — Progressive (72h SLA)'}
                      {t === 'KT' && ' — Kids/Trivex (96h SLA)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lens Index" required>
              <Select
                value={form.lens_index}
                onValueChange={(v) => handleChange('lens_index', v ?? '')}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select index..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {LENS_INDICES.map((i) => (
                    <SelectItem key={i} value={String(i)} className="text-foreground hover:bg-muted">
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Coating">
              <Select
                value={form.coating}
                onValueChange={(v) => handleChange('coating', v ?? '')}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select coating..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {COATINGS.map((c) => (
                    <SelectItem key={c} value={c} className="text-foreground hover:bg-muted">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Stock status indicator */}
          {(stockStatus.checking || stockStatus.inStock !== null) && (
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm border',
                stockStatus.checking
                  ? 'bg-muted/50 border-border text-muted-foreground'
                  : stockStatus.inStock
                  ? 'bg-green-500/10 border-green-500/20 text-green-700 font-medium'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-medium'
              )}
            >
              {stockStatus.checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking stock...
                </>
              ) : stockStatus.inStock ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  In Stock — {stockStatus.qty} units available. Order will proceed directly to Cutting
                  &amp; Edging.
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Out of Stock — Order will enter Lens Sourcing pipeline.
                </>
              )}
            </div>
          )}
        </Section>

        {/* Frame Details */}
        <Section title="Frame Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Frame Brand">
              <Input
                value={form.frame_brand}
                onChange={(e) => handleChange('frame_brand', e.target.value)}
                placeholder="Ray-Ban, Titan..."
                className={inputClass}
              />
            </Field>
            <Field label="Frame Model">
              <Input
                value={form.frame_model}
                onChange={(e) => handleChange('frame_model', e.target.value)}
                placeholder="RB5154"
                className={inputClass}
              />
            </Field>
            <Field label="Frame Color">
              <Input
                value={form.frame_color}
                onChange={(e) => handleChange('frame_color', e.target.value)}
                placeholder="Tortoise, Black..."
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        {/* Notes */}
        <Section title="Sourcing Notes">
          <Field label="Notes / Special Instructions">
            <Textarea
              value={form.sourcing_notes}
              onChange={(e) => handleChange('sourcing_notes', e.target.value)}
              placeholder="Any special handling, supplier preferences, or customer notes..."
              className={cn(inputClass, 'resize-none')}
              rows={3}
            />
          </Field>
        </Section>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/95 text-primary-foreground px-8 gap-2 font-bold uppercase tracking-wider"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border border-border bg-card p-6 space-y-4">
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-3">
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
    {children}
  </div>
);
