-- ============================================================
-- Migration 002: Seed Data
-- ELU Order Management System
-- ============================================================

-- ── SLA Config ────────────────────────────────────────────────────────────────
insert into sla_config (lens_type, sla_hours) values
  ('SV', 24),
  ('BF', 48),
  ('Progressive', 72),
  ('KT', 96)
on conflict (lens_type) do update set sla_hours = excluded.sla_hours;

-- ── Stores ────────────────────────────────────────────────────────────────────
insert into stores (id, name, location) values
  ('11111111-1111-1111-1111-111111111111', 'Delhi Central', 'Connaught Place, New Delhi'),
  ('22222222-2222-2222-2222-222222222222', 'Mumbai West', 'Linking Road, Bandra, Mumbai'),
  ('33333333-3333-3333-3333-333333333333', 'Bangalore South', 'Jayanagar 4th Block, Bangalore')
on conflict (id) do nothing;

-- ── Lens Inventory ───────────────────────────────────────────────────────────
-- SV lenses (most common, high stock)
insert into lens_inventory (lens_type, lens_index, power_sph_min, power_sph_max, power_cyl_min, power_cyl_max, coating, quantity, reorder_threshold) values
  ('SV', 1.5,  -6.0, 4.0, -2.0, 0.0, 'AR',           45, 8),
  ('SV', 1.5,  -6.0, 4.0, -2.0, 0.0, 'BlueCut',       38, 8),
  ('SV', 1.5,  -6.0, 4.0, -2.0, 0.0, 'None',          60, 10),
  ('SV', 1.56, -6.0, 4.0, -2.0, 0.0, 'AR',            32, 8),
  ('SV', 1.56, -6.0, 4.0, -2.0, 0.0, 'BlueCut',       28, 8),
  ('SV', 1.56, -6.0, 4.0, -2.0, 0.0, 'Photochromic',  15, 5),
  ('SV', 1.56, -6.0, 4.0, -2.0, 0.0, 'None',          42, 8),
  ('SV', 1.6,  -6.0, 4.0, -2.0, 0.0, 'AR',            22, 5),
  ('SV', 1.6,  -6.0, 4.0, -2.0, 0.0, 'BlueCut',       18, 5),
  ('SV', 1.6,  -6.0, 4.0, -2.0, 0.0, 'Photochromic',   8, 3),
  ('SV', 1.67, -6.0, 4.0, -2.0, 0.0, 'AR',            14, 4),
  ('SV', 1.67, -6.0, 4.0, -2.0, 0.0, 'BlueCut',       10, 4),
  ('SV', 1.67, -6.0, 4.0, -2.0, 0.0, 'None',          20, 5),

-- BF (bifocal) lenses
  ('BF', 1.5,  -4.0, 3.0, -1.5, 0.0, 'AR',            18, 5),
  ('BF', 1.5,  -4.0, 3.0, -1.5, 0.0, 'None',          25, 5),
  ('BF', 1.56, -4.0, 3.0, -1.5, 0.0, 'AR',            12, 4),
  ('BF', 1.56, -4.0, 3.0, -1.5, 0.0, 'BlueCut',        8, 3),
  ('BF', 1.6,  -4.0, 3.0, -1.5, 0.0, 'AR',             6, 3),
  ('BF', 1.6,  -4.0, 3.0, -1.5, 0.0, 'None',          10, 3),
  ('BF', 1.67, -4.0, 3.0, -1.5, 0.0, 'AR',             4, 2),

-- Progressive lenses (low stock, high value)
  ('Progressive', 1.5,  -4.0, 3.0, -1.5, 0.0, 'AR',           10, 3),
  ('Progressive', 1.5,  -4.0, 3.0, -1.5, 0.0, 'BlueCut',       7, 3),
  ('Progressive', 1.56, -4.0, 3.0, -1.5, 0.0, 'AR',            8, 3),
  ('Progressive', 1.56, -4.0, 3.0, -1.5, 0.0, 'Photochromic',  3, 2),
  ('Progressive', 1.6,  -4.0, 3.0, -1.5, 0.0, 'AR',            6, 2),
  ('Progressive', 1.67, -4.0, 3.0, -1.5, 0.0, 'AR',            4, 2),
  ('Progressive', 1.67, -4.0, 3.0, -1.5, 0.0, 'BlueCut',       2, 2),

-- KT (Kids/Trivex) lenses (specialty, limited stock)
  ('KT', 1.5,  -4.0, 2.0, -1.0, 0.0, 'AR',            8, 3),
  ('KT', 1.5,  -4.0, 2.0, -1.0, 0.0, 'BlueCut',        5, 3),
  ('KT', 1.56, -4.0, 2.0, -1.0, 0.0, 'AR',             3, 2),
  ('KT', 1.56, -4.0, 2.0, -1.0, 0.0, 'None',           6, 2),
  ('KT', 1.6,  -4.0, 2.0, -1.0, 0.0, 'AR',             0, 2),  -- OUT OF STOCK
  ('KT', 1.67, -4.0, 2.0, -1.0, 0.0, 'AR',             1, 2)   -- CRITICAL LOW
;

-- ── Orders (30 realistic orders) ─────────────────────────────────────────────
-- Note: placed_at offsets create realistic spread of timestamps

insert into orders (
  id, order_number, store_id, customer_name, customer_phone,
  right_sph, right_cyl, right_axis, right_add,
  left_sph, left_cyl, left_axis, left_add,
  pd, lens_type, lens_index, coating,
  frame_brand, frame_model, frame_color,
  lens_in_stock, sourcing_notes, status, sla_hours,
  placed_at, expected_delivery, actual_delivery,
  predicted_breach, breach_probability, ai_reasoning
) values
-- 1: Delhi, SV, delivered on time
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'ELU-20250610-0001',
  '11111111-1111-1111-1111-111111111111',
  'Ravi Kumar', '9876543210',
  -2.25, -0.50, 180, null, -2.00, -0.75, 170, null, 64.0,
  'SV', 1.56, 'AR', 'Ray-Ban', 'RB5154', 'Tortoise',
  true, null, 'DELIVERED', 24,
  now() - interval '5 days',
  now() - interval '4 days',
  now() - interval '4 days 2 hours',
  false, 0.08, 'Order completed well within SLA. Standard SV lens with AR coating, in stock.'
),
-- 2: Mumbai, Progressive, QC stage
(
  'aaaaaaaa-0002-0002-0002-000000000002',
  'ELU-20250611-0002',
  '22222222-2222-2222-2222-222222222222',
  'Priya Sharma', '9123456789',
  -1.50, -0.25, 90, 2.0, -1.75, -0.50, 85, 2.0, 62.0,
  'Progressive', 1.67, 'BlueCut', 'Titan', 'T-2045', 'Black',
  true, null, 'QC', 72,
  now() - interval '2 days 5 hours',
  now() + interval '1 day 19 hours',
  null,
  false, 0.22, 'Progressive lens in QC stage with 26 hours elapsed. On track within SLA window.'
),
-- 3: Bangalore, BF, lens sourcing - high risk
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  'ELU-20250611-0003',
  '33333333-3333-3333-3333-333333333333',
  'Anand Verma', '9988776655',
  -3.00, -1.00, 15, 2.5, -3.25, -1.25, 170, 2.5, 66.0,
  'BF', 1.6, 'AR', 'Lenskart', 'Rimless-Pro', 'Silver',
  false, 'Awaiting stock from Chennai warehouse', 'LENS_SOURCING', 48,
  now() - interval '1 day 20 hours',
  now() + interval '4 hours',
  null,
  true, 0.82, 'BF lens sourcing delayed with only 4h left in SLA. High risk of breach due to out-of-stock situation.'
),
-- 4: Delhi, KT, cutting & edging
(
  'aaaaaaaa-0004-0004-0004-000000000004',
  'ELU-20250612-0004',
  '11111111-1111-1111-1111-111111111111',
  'Meena Patel', '9012345678',
  -1.00, -0.25, 90, null, -0.75, 0.0, 0, null, 60.0,
  'KT', 1.5, 'BlueCut', 'Titan', 'Kids-K10', 'Blue',
  true, null, 'CUTTING_EDGING', 96,
  now() - interval '1 day',
  now() + interval '3 days',
  null,
  false, 0.12, 'KT lens cutting in progress with 72h SLA remaining. Risk is low.'
),
-- 5: Mumbai, SV, QC failed
(
  'aaaaaaaa-0005-0005-0005-000000000005',
  'ELU-20250610-0005',
  '22222222-2222-2222-2222-222222222222',
  'Suresh Gupta', '8765432109',
  -4.50, -1.50, 5, null, -4.75, -1.75, 175, null, 65.0,
  'SV', 1.67, 'AR', 'Oakley', 'OX8046', 'Matte Black',
  true, 'QC failed: power deviation', 'QC_FAILED', 24,
  now() - interval '3 days',
  now() - interval '2 days',
  null,
  true, 0.91, 'QC failed order with high-power lenses. SLA already breached, re-entering cutting & edging cycle.'
),
-- 6: Bangalore, Progressive, order placed just now
(
  'aaaaaaaa-0006-0006-0006-000000000006',
  'ELU-20250613-0006',
  '33333333-3333-3333-3333-333333333333',
  'Kavya Reddy', '7654321098',
  -0.50, -0.25, 170, 1.5, -0.75, -0.50, 160, 1.5, 63.0,
  'Progressive', 1.56, 'Photochromic', 'Ray-Ban', 'RB5228', 'Havana',
  false, null, 'ORDER_PLACED', 72,
  now() - interval '30 minutes',
  now() + interval '71 hours 30 minutes',
  null,
  false, 0.05, 'Fresh order, low risk. Sufficient SLA buffer available.'
),
-- 7: Delhi, SV, dispatched
(
  'aaaaaaaa-0007-0007-0007-000000000007',
  'ELU-20250612-0007',
  '11111111-1111-1111-1111-111111111111',
  'Amit Singh', '6543210987',
  -1.75, 0.0, 0, null, -2.00, -0.25, 180, null, 67.0,
  'SV', 1.5, 'None', 'Fastrack', 'FT-1234', 'Brown',
  true, null, 'DISPATCH', 24,
  now() - interval '23 hours',
  now() + interval '1 hour',
  null,
  false, 0.45, 'Order dispatched, expected delivery within SLA. Marginal risk but on track.'
),
-- 8: Mumbai, KT, critical breach risk
(
  'aaaaaaaa-0008-0008-0008-000000000008',
  'ELU-20250610-0008',
  '22222222-2222-2222-2222-222222222222',
  'Nisha Joshi', '5432109876',
  -2.50, -0.75, 10, null, -2.75, -0.75, 165, null, 61.0,
  'KT', 1.56, 'AR', 'Titan', 'Kids-K20', 'Pink',
  false, 'Specialty KT lens not available locally', 'LENS_SOURCING', 96,
  now() - interval '4 days',
  now() - interval '4 hours',
  null,
  true, 0.97, 'CRITICAL: KT lens sourcing severely delayed. SLA breached by 4h. Immediate escalation required.'
),
-- 9: Bangalore, BF, cutting & edging
(
  'aaaaaaaa-0009-0009-0009-000000000009',
  'ELU-20250612-0009',
  '33333333-3333-3333-3333-333333333333',
  'Deepak Malhotra', '4321098765',
  -2.00, -0.50, 75, 1.75, -1.75, -0.25, 100, 1.75, 64.5,
  'BF', 1.56, 'None', 'Lenskart House', 'Wayfarer-Classic', 'Tortoise',
  true, null, 'CUTTING_EDGING', 48,
  now() - interval '20 hours',
  now() + interval '28 hours',
  null,
  false, 0.18, 'BF lens cutting in progress, SLA well within bounds.'
),
-- 10: Delhi, Progressive, cancelled
(
  'aaaaaaaa-0010-0010-0010-000000000010',
  'ELU-20250609-0010',
  '11111111-1111-1111-1111-111111111111',
  'Sunita Kapoor', '3210987654',
  -3.50, -1.25, 20, 2.25, -3.75, -1.50, 160, 2.25, 63.5,
  'Progressive', 1.67, 'AR', 'Ray-Ban', 'RB5154', 'Black',
  false, 'Customer cancelled - frame not liked', 'CANCELLED', 72,
  now() - interval '6 days',
  now() - interval '3 days',
  null,
  false, 0.0, 'Order cancelled by customer.'
),
-- 11: Mumbai, SV, order placed
(
  'aaaaaaaa-0011-0011-0011-000000000011',
  'ELU-20250613-0011',
  '22222222-2222-2222-2222-222222222222',
  'Vikram Mehta', '9871234560',
  -0.25, 0.0, 0, null, -0.50, -0.25, 90, null, 65.0,
  'SV', 1.5, 'BlueCut', 'Lenskart', 'Hustlr-001', 'Black',
  true, null, 'CUTTING_EDGING', 24,
  now() - interval '2 hours',
  now() + interval '22 hours',
  null,
  false, 0.06, 'Low-power SV lens, in stock, cutting initiated immediately.'
),
-- 12: Bangalore, KT, delivered
(
  'aaaaaaaa-0012-0012-0012-000000000012',
  'ELU-20250607-0012',
  '33333333-3333-3333-3333-333333333333',
  'Rohit Nair', '9812340987',
  -1.25, -0.25, 90, null, -1.00, -0.50, 80, null, 59.0,
  'KT', 1.5, 'AR', 'Titan', 'Kids-K05', 'Red',
  true, null, 'DELIVERED', 96,
  now() - interval '7 days',
  now() - interval '3 days',
  now() - interval '3 days 5 hours',
  false, 0.04, 'Delivered on time.'
),
-- 13: Delhi, BF, QC
(
  'aaaaaaaa-0013-0013-0013-000000000013',
  'ELU-20250612-0013',
  '11111111-1111-1111-1111-111111111111',
  'Anjali Desai', '9901234567',
  -1.00, -0.50, 5, 1.5, -1.25, -0.25, 175, 1.5, 62.0,
  'BF', 1.5, 'AR', 'Fastrack', 'FT-BF-2', 'Brown',
  true, null, 'QC', 48,
  now() - interval '40 hours',
  now() + interval '8 hours',
  null,
  false, 0.38, 'QC in final stages, 8h of SLA remaining. Moderate risk.'
),
-- 14: Mumbai, Progressive, high breach risk 
(
  'aaaaaaaa-0014-0014-0014-000000000014',
  'ELU-20250611-0014',
  '22222222-2222-2222-2222-222222222222',
  'Kiran Bhat', '9765432108',
  -2.75, -1.00, 15, 2.0, -3.00, -1.25, 170, 2.0, 66.5,
  'Progressive', 1.6, 'Photochromic', 'Oakley', 'OX5145', 'Gunmetal',
  false, 'Photochromic progressive: supplier delay', 'LENS_SOURCING', 72,
  now() - interval '2 days 10 hours',
  now() + interval '14 hours',
  null,
  true, 0.78, 'Progressive photochromic lens sourcing delayed with 14h SLA remaining. High breach risk.'
),
-- 15: Bangalore, SV, dispatch
(
  'aaaaaaaa-0015-0015-0015-000000000015',
  'ELU-20250613-0015',
  '33333333-3333-3333-3333-333333333333',
  'Sanjay Pillai', '9654321087',
  -3.00, 0.0, 0, null, -3.25, -0.50, 180, null, 68.0,
  'SV', 1.6, 'AR', 'Ray-Ban', 'RB3547N', 'Gold',
  true, null, 'DISPATCH', 24,
  now() - interval '22 hours',
  now() + interval '2 hours',
  null,
  false, 0.51, 'Dispatched with 2h to SLA. Tight but on track if delivery completes on time.'
),
-- 16: Delhi, SV, lens sourcing - low risk
(
  'aaaaaaaa-0016-0016-0016-000000000016',
  'ELU-20250613-0016',
  '11111111-1111-1111-1111-111111111111',
  'Pooja Agarwal', '9543210876',
  -5.50, -1.75, 30, null, -5.75, -2.00, 150, null, 64.0,
  'SV', 1.67, 'BlueCut', 'Lenskart', 'Vincent-Chase', 'Purple',
  false, 'High-power 1.67 lens, ordered from supplier', 'LENS_SOURCING', 24,
  now() - interval '3 hours',
  now() + interval '21 hours',
  null,
  false, 0.31, 'High-power SV lens requires sourcing. 21h remaining in SLA. Manageable if sourced by evening.'
),
-- 17: Mumbai, KT, order placed 
(
  'aaaaaaaa-0017-0017-0017-000000000017',
  'ELU-20250613-0017',
  '22222222-2222-2222-2222-222222222222',
  'Arjun Rao', '9432109865',
  -1.50, -0.50, 90, null, -1.25, -0.25, 85, null, 61.5,
  'KT', 1.56, 'BlueCut', 'Titan', 'Kids-K30', 'Green',
  false, 'KT lens not in current stock, ordering from warehouse', 'ORDER_PLACED', 96,
  now() - interval '1 hour',
  now() + interval '95 hours',
  null,
  false, 0.08, 'Fresh KT order with full SLA window.'
),
-- 18: Bangalore, Progressive, cutting & edging
(
  'aaaaaaaa-0018-0018-0018-000000000018',
  'ELU-20250612-0018',
  '33333333-3333-3333-3333-333333333333',
  'Divya Menon', '9321098754',
  -1.00, -0.75, 100, 2.25, -0.75, -0.50, 95, 2.25, 63.0,
  'Progressive', 1.56, 'AR', 'Titan', 'T-Prog-1', 'Black',
  true, null, 'CUTTING_EDGING', 72,
  now() - interval '30 hours',
  now() + interval '42 hours',
  null,
  false, 0.19, 'Progressive lens cutting progressing well. Sufficient SLA time remaining.'
),
-- 19: Delhi, BF, delivered
(
  'aaaaaaaa-0019-0019-0019-000000000019',
  'ELU-20250608-0019',
  '11111111-1111-1111-1111-111111111111',
  'Rahul Jain', '9210987643',
  -2.50, -1.00, 180, 2.0, -2.25, -0.75, 5, 2.0, 65.5,
  'BF', 1.5, 'None', 'Fastrack', 'FT-BF-5', 'Silver',
  true, null, 'DELIVERED', 48,
  now() - interval '5 days',
  now() - interval '3 days',
  now() - interval '3 days 1 hour',
  false, 0.05, 'Delivered ahead of schedule.'
),
-- 20: Mumbai, SV, QC
(
  'aaaaaaaa-0020-0020-0020-000000000020',
  'ELU-20250613-0020',
  '22222222-2222-2222-2222-222222222222',
  'Lata Bhatt', '9109876532',
  -0.75, -0.25, 150, null, -1.00, 0.0, 0, null, 62.5,
  'SV', 1.5, 'AR', 'Lenskart', 'Hustlr-002', 'White',
  true, null, 'QC', 24,
  now() - interval '20 hours',
  now() + interval '4 hours',
  null,
  false, 0.55, 'SV lens in QC with 4h remaining. Should complete on time but monitoring advised.'
),
-- 21: Bangalore, KT, QC failed - overdue
(
  'aaaaaaaa-0021-0021-0021-000000000021',
  'ELU-20250609-0021',
  '33333333-3333-3333-3333-333333333333',
  'Manoj Kumar', '9098765421',
  -3.00, -0.75, 45, null, -3.25, -1.00, 135, null, 67.0,
  'KT', 1.5, 'AR', 'Titan', 'Kids-K40', 'Orange',
  true, 'Second QC failure: edge chipping', 'QC_FAILED', 96,
  now() - interval '5 days',
  now() - interval '1 day',
  null,
  true, 0.96, 'CRITICAL: Second QC failure on KT lens. SLA breached by 1 day. Customer escalation needed.'
),
-- 22: Delhi, Progressive, order placed
(
  'aaaaaaaa-0022-0022-0022-000000000022',
  'ELU-20250613-0022',
  '11111111-1111-1111-1111-111111111111',
  'Geeta Saxena', '9087654310',
  -0.25, -0.75, 80, 1.75, 0.0, -0.50, 90, 1.75, 62.0,
  'Progressive', 1.5, 'BlueCut', 'Ray-Ban', 'RB5383', 'Transparent',
  true, null, 'ORDER_PLACED', 72,
  now() - interval '45 minutes',
  now() + interval '71 hours 15 minutes',
  null,
  false, 0.04, 'Fresh progressive order, lens in stock. Very low risk.'
),
-- 23: Mumbai, BF, dispatch - tight SLA
(
  'aaaaaaaa-0023-0023-0023-000000000023',
  'ELU-20250613-0023',
  '22222222-2222-2222-2222-222222222222',
  'Harish Nambiar', '9076543209',
  -1.75, -0.50, 170, 1.5, -2.00, -0.75, 175, 1.5, 64.0,
  'BF', 1.56, 'AR', 'Lenskart', 'Classic-BF', 'Brown',
  true, null, 'DISPATCH', 48,
  now() - interval '46 hours',
  now() + interval '2 hours',
  null,
  true, 0.76, 'BF order dispatched with only 2h to SLA deadline. High risk if delivery is delayed.'
),
-- 24: Bangalore, SV, cutting & edging
(
  'aaaaaaaa-0024-0024-0024-000000000024',
  'ELU-20250613-0024',
  '33333333-3333-3333-3333-333333333333',
  'Shobha Iyer', '9065432198',
  -2.00, 0.0, 0, null, -2.25, -0.25, 180, null, 63.5,
  'SV', 1.56, 'None', 'Fastrack', 'FT-1567', 'Grey',
  true, null, 'CUTTING_EDGING', 24,
  now() - interval '10 hours',
  now() + interval '14 hours',
  null,
  false, 0.21, 'Standard SV cutting in progress with good SLA margin.'
),
-- 25: Delhi, KT, lens sourcing - critical
(
  'aaaaaaaa-0025-0025-0025-000000000025',
  'ELU-20250611-0025',
  '11111111-1111-1111-1111-111111111111',
  'Vishal Tiwari', '9054321087',
  -4.00, -1.25, 25, null, -4.25, -1.50, 155, null, 60.5,
  'KT', 1.6, 'AR', 'Titan', 'Kids-K50', 'Black',
  false, '1.6 KT out of stock nationally - special order placed', 'LENS_SOURCING', 96,
  now() - interval '3 days 10 hours',
  now() + interval '14 hours',
  null,
  true, 0.88, 'KT 1.6 special order with 14h remaining in SLA. Very high breach risk due to national stock-out.'
),
-- 26: Mumbai, Progressive, delivered
(
  'aaaaaaaa-0026-0026-0026-000000000026',
  'ELU-20250606-0026',
  '22222222-2222-2222-2222-222222222222',
  'Nalini Krishnan', '9043210976',
  -1.50, -1.00, 95, 2.0, -1.25, -0.75, 85, 2.0, 63.0,
  'Progressive', 1.6, 'AR', 'Oakley', 'OX8080', 'Polished Black',
  true, null, 'DELIVERED', 72,
  now() - interval '8 days',
  now() - interval '5 days',
  now() - interval '5 days 3 hours',
  false, 0.06, 'Delivered on time.'
),
-- 27: Bangalore, BF, order placed - weekend effect
(
  'aaaaaaaa-0027-0027-0027-000000000027',
  'ELU-20250613-0027',
  '33333333-3333-3333-3333-333333333333',
  'Ramesh Pillai', '9032109865',
  -3.50, -0.75, 10, 1.75, -3.25, -0.50, 170, 1.75, 65.0,
  'BF', 1.6, 'None', 'Lenskart', 'Classic-Round', 'Gold',
  false, null, 'ORDER_PLACED', 48,
  now() - interval '2 hours',
  now() + interval '46 hours',
  null,
  false, 0.15, 'Weekend order - slight risk of delay but within SLA.'
),
-- 28: Delhi, SV, dispatch - on time
(
  'aaaaaaaa-0028-0028-0028-000000000028',
  'ELU-20250613-0028',
  '11111111-1111-1111-1111-111111111111',
  'Ritu Sharma', '9021098754',
  -1.25, -0.25, 85, null, -1.50, -0.50, 90, null, 64.5,
  'SV', 1.5, 'BlueCut', 'Ray-Ban', 'RB5154', 'Blue',
  true, null, 'DISPATCH', 24,
  now() - interval '21 hours',
  now() + interval '3 hours',
  null,
  false, 0.42, 'Dispatched, expected on time delivery.'
),
-- 29: Mumbai, KT, QC - tight
(
  'aaaaaaaa-0029-0029-0029-000000000029',
  'ELU-20250612-0029',
  '22222222-2222-2222-2222-222222222222',
  'Sunil Fernandez', '9010987643',
  -2.00, -0.75, 75, null, -2.25, -1.00, 100, null, 62.0,
  'KT', 1.5, 'BlueCut', 'Titan', 'Kids-K60', 'Yellow',
  true, null, 'QC', 96,
  now() - interval '3 days 10 hours',
  now() + interval '14 hours',
  null,
  false, 0.49, 'KT lens QC in final check with 14h SLA remaining. Should pass first attempt.'
),
-- 30: Bangalore, Progressive, cutting & edging - at risk
(
  'aaaaaaaa-0030-0030-0030-000000000030',
  'ELU-20250611-0030',
  '33333333-3333-3333-3333-333333333333',
  'Lakshmi Venkat', '9009876532',
  -2.00, -1.25, 60, 2.5, -2.25, -1.50, 120, 2.5, 63.5,
  'Progressive', 1.67, 'BlueCut', 'Titan', 'T-Prog-2', 'Brown',
  true, 'Complex prescription - takes longer to cut', 'CUTTING_EDGING', 72,
  now() - interval '2 days 2 hours',
  now() + interval '22 hours',
  null,
  true, 0.73, 'High-power progressive with complex prescription in cutting stage. 22h left, risk elevated due to complexity.'
)
on conflict (id) do nothing;

-- ── Status History for key orders ─────────────────────────────────────────────
insert into order_status_history (order_id, from_status, to_status, reason, changed_at) values
-- Order 1 (delivered)
('aaaaaaaa-0001-0001-0001-000000000001', null, 'ORDER_PLACED', 'Order created', now() - interval '5 days'),
('aaaaaaaa-0001-0001-0001-000000000001', 'ORDER_PLACED', 'CUTTING_EDGING', 'Lens in stock, proceeding to cut', now() - interval '4 days 22 hours'),
('aaaaaaaa-0001-0001-0001-000000000001', 'CUTTING_EDGING', 'QC', 'Cutting complete', now() - interval '4 days 12 hours'),
('aaaaaaaa-0001-0001-0001-000000000001', 'QC', 'DISPATCH', 'QC passed', now() - interval '4 days 6 hours'),
('aaaaaaaa-0001-0001-0001-000000000001', 'DISPATCH', 'DELIVERED', 'Delivered to customer', now() - interval '4 days 2 hours'),
-- Order 5 (QC failed)
('aaaaaaaa-0005-0005-0005-000000000005', null, 'ORDER_PLACED', 'Order created', now() - interval '3 days'),
('aaaaaaaa-0005-0005-0005-000000000005', 'ORDER_PLACED', 'CUTTING_EDGING', 'Lens in stock', now() - interval '2 days 22 hours'),
('aaaaaaaa-0005-0005-0005-000000000005', 'CUTTING_EDGING', 'QC', 'Cutting complete', now() - interval '2 days 10 hours'),
('aaaaaaaa-0005-0005-0005-000000000005', 'QC', 'QC_FAILED', 'Power deviation outside tolerance', now() - interval '2 days 2 hours'),
-- Order 8 (critical breach)
('aaaaaaaa-0008-0008-0008-000000000008', null, 'ORDER_PLACED', 'Order created', now() - interval '4 days'),
('aaaaaaaa-0008-0008-0008-000000000008', 'ORDER_PLACED', 'LENS_SOURCING', 'KT lens not in local stock', now() - interval '3 days 22 hours'),
-- Order 21 (double QC failure)
('aaaaaaaa-0021-0021-0021-000000000021', null, 'ORDER_PLACED', 'Order created', now() - interval '5 days'),
('aaaaaaaa-0021-0021-0021-000000000021', 'ORDER_PLACED', 'CUTTING_EDGING', 'Lens in stock', now() - interval '4 days 22 hours'),
('aaaaaaaa-0021-0021-0021-000000000021', 'CUTTING_EDGING', 'QC', 'First cut complete', now() - interval '4 days 6 hours'),
('aaaaaaaa-0021-0021-0021-000000000021', 'QC', 'QC_FAILED', 'Edge chipping found', now() - interval '3 days 20 hours'),
('aaaaaaaa-0021-0021-0021-000000000021', 'QC_FAILED', 'CUTTING_EDGING', 'Re-entering cutting & edging', now() - interval '3 days 18 hours'),
('aaaaaaaa-0021-0021-0021-000000000021', 'CUTTING_EDGING', 'QC', 'Second cut complete', now() - interval '2 days 6 hours'),
('aaaaaaaa-0021-0021-0021-000000000021', 'QC', 'QC_FAILED', 'Second edge chipping - same defect', now() - interval '1 day 20 hours')
on conflict do nothing;

-- ── Alerts for breached orders ────────────────────────────────────────────────
insert into alerts_log (order_id, alert_type, channel, sent_at) values
('aaaaaaaa-0008-0008-0008-000000000008', 'SLA_BREACH_PREDICTED', 'email', now() - interval '6 hours'),
('aaaaaaaa-0008-0008-0008-000000000008', 'SLA_BREACHED', 'email', now() - interval '4 hours'),
('aaaaaaaa-0021-0021-0021-000000000021', 'SLA_BREACH_PREDICTED', 'email', now() - interval '1 day'),
('aaaaaaaa-0021-0021-0021-000000000021', 'SLA_BREACHED', 'email', now() - interval '20 hours'),
('aaaaaaaa-0005-0005-0005-000000000005', 'SLA_BREACHED', 'email', now() - interval '2 days')
on conflict do nothing;
