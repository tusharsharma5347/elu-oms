-- ============================================================
-- Migration 003: Disable RLS for Local Dev/Testing
-- This allows browser clients (anon role) to read/write data
-- ============================================================

alter table stores disable row level security;
alter table lens_inventory disable row level security;
alter table orders disable row level security;
alter table order_status_history disable row level security;
alter table sla_config disable row level security;
alter table alerts_log disable row level security;
