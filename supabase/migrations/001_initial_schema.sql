-- ============================================================
-- Migration 001: Initial Schema
-- ELU Order Management System
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── stores ────────────────────────────────────────────────────────────────────
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  created_at timestamptz default now()
);

-- ── lens_inventory ────────────────────────────────────────────────────────────
create table if not exists lens_inventory (
  id uuid primary key default gen_random_uuid(),
  lens_type text not null check (lens_type in ('SV', 'BF', 'Progressive', 'KT')),
  lens_index float not null check (lens_index in (1.5, 1.56, 1.6, 1.67, 1.74)),
  power_sph_min float not null,
  power_sph_max float not null,
  power_cyl_min float not null,
  power_cyl_max float not null,
  coating text check (coating in ('AR', 'BlueCut', 'Photochromic', 'None')),
  quantity int not null default 0 check (quantity >= 0),
  reorder_threshold int default 5,
  updated_at timestamptz default now()
);

-- ── orders ────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  store_id uuid references stores(id),
  customer_name text not null,
  customer_phone text,

  -- prescription
  right_sph float,
  right_cyl float,
  right_axis int,
  right_add float,
  left_sph float,
  left_cyl float,
  left_axis int,
  left_add float,
  pd float,

  -- lens spec
  lens_type text not null check (lens_type in ('SV', 'BF', 'Progressive', 'KT')),
  lens_index float not null,
  coating text check (coating in ('AR', 'BlueCut', 'Photochromic', 'None')),
  frame_brand text,
  frame_model text,
  frame_color text,

  -- sourcing
  lens_in_stock boolean default false,
  sourcing_notes text,

  -- status & SLA
  status text not null default 'ORDER_PLACED' check (
    status in ('ORDER_PLACED', 'LENS_SOURCING', 'CUTTING_EDGING', 'QC', 'DISPATCH', 'DELIVERED', 'QC_FAILED', 'CANCELLED')
  ),

  sla_hours int not null,
  placed_at timestamptz default now(),
  expected_delivery timestamptz,
  actual_delivery timestamptz,

  -- AI prediction
  predicted_breach boolean default false,
  breach_probability float check (breach_probability >= 0 and breach_probability <= 1),
  ai_reasoning text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── order_status_history ─────────────────────────────────────────────────────
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);

-- ── sla_config ────────────────────────────────────────────────────────────────
create table if not exists sla_config (
  lens_type text primary key check (lens_type in ('SV', 'BF', 'Progressive', 'KT')),
  sla_hours int not null check (sla_hours > 0)
);

-- ── alerts_log ────────────────────────────────────────────────────────────────
create table if not exists alerts_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  alert_type text check (alert_type in ('SLA_BREACH_PREDICTED', 'SLA_BREACHED')),
  sent_at timestamptz default now(),
  channel text
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_store_id on orders(store_id);
create index if not exists idx_orders_placed_at on orders(placed_at desc);
create index if not exists idx_orders_lens_type on orders(lens_type);
create index if not exists idx_order_status_history_order_id on order_status_history(order_id);
create index if not exists idx_alerts_log_order_id on alerts_log(order_id);
create index if not exists idx_alerts_log_sent_at on alerts_log(sent_at desc);

-- ── auto-update updated_at ────────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at_column();

create trigger lens_inventory_updated_at
  before update on lens_inventory
  for each row
  execute function update_updated_at_column();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table stores enable row level security;
alter table lens_inventory enable row level security;
alter table orders enable row level security;
alter table order_status_history enable row level security;
alter table sla_config enable row level security;
alter table alerts_log enable row level security;

-- Allow authenticated users to read/write all tables
-- (for production: differentiate admin/staff roles further)
create policy "Authenticated users can read stores"
  on stores for select to authenticated using (true);

create policy "Authenticated users can read inventory"
  on lens_inventory for select to authenticated using (true);

create policy "Authenticated users can update inventory"
  on lens_inventory for update to authenticated using (true);

create policy "Authenticated users can read orders"
  on orders for select to authenticated using (true);

create policy "Authenticated users can insert orders"
  on orders for insert to authenticated with check (true);

create policy "Authenticated users can update orders"
  on orders for update to authenticated using (true);

create policy "Authenticated users can read history"
  on order_status_history for select to authenticated using (true);

create policy "Authenticated users can insert history"
  on order_status_history for insert to authenticated with check (true);

create policy "Authenticated users can read SLA config"
  on sla_config for select to authenticated using (true);

create policy "Authenticated users can read alerts"
  on alerts_log for select to authenticated using (true);

create policy "Authenticated users can insert alerts"
  on alerts_log for insert to authenticated with check (true);

-- Service role bypass (for API routes using service role key)
create policy "Service role bypass stores"
  on stores for all to service_role using (true);

create policy "Service role bypass inventory"
  on lens_inventory for all to service_role using (true);

create policy "Service role bypass orders"
  on orders for all to service_role using (true);

create policy "Service role bypass history"
  on order_status_history for all to service_role using (true);

create policy "Service role bypass sla_config"
  on sla_config for all to service_role using (true);

create policy "Service role bypass alerts"
  on alerts_log for all to service_role using (true);
