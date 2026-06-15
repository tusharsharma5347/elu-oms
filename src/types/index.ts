// src/types/index.ts

export type LensType = 'SV' | 'BF' | 'Progressive' | 'KT';
export type LensIndex = 1.5 | 1.56 | 1.6 | 1.67 | 1.74;
export type Coating = 'AR' | 'BlueCut' | 'Photochromic' | 'None';

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'LENS_SOURCING'
  | 'CUTTING_EDGING'
  | 'QC'
  | 'DISPATCH'
  | 'DELIVERED'
  | 'QC_FAILED'
  | 'CANCELLED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertType = 'SLA_BREACH_PREDICTED' | 'SLA_BREACHED';

// ── Database Row Types ────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface LensInventory {
  id: string;
  lens_type: LensType;
  lens_index: number;
  power_sph_min: number;
  power_sph_max: number;
  power_cyl_min: number;
  power_cyl_max: number;
  coating: Coating | null;
  quantity: number;
  reorder_threshold: number;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  customer_name: string;
  customer_phone: string | null;

  // Prescription
  right_sph: number | null;
  right_cyl: number | null;
  right_axis: number | null;
  right_add: number | null;
  left_sph: number | null;
  left_cyl: number | null;
  left_axis: number | null;
  left_add: number | null;
  pd: number | null;

  // Lens spec
  lens_type: LensType;
  lens_index: number;
  coating: Coating | null;
  frame_brand: string | null;
  frame_model: string | null;
  frame_color: string | null;

  // Sourcing
  lens_in_stock: boolean;
  sourcing_notes: string | null;

  // Status & SLA
  status: OrderStatus;
  sla_hours: number;
  placed_at: string;
  expected_delivery: string;
  actual_delivery: string | null;

  // AI prediction
  predicted_breach: boolean;
  breach_probability: number | null;
  ai_reasoning: string | null;

  created_at: string;
  updated_at: string;

  // Joined fields (from API)
  store?: Store;
}

export interface OrderWithStore extends Order {
  store: Store;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface SLAConfig {
  lens_type: LensType;
  sla_hours: number;
}

export interface AlertLog {
  id: string;
  order_id: string;
  alert_type: AlertType;
  sent_at: string;
  channel: string;
  order?: Order;
}

// ── API Request / Response Types ──────────────────────────────────────────────

export interface CheckStockRequest {
  lens_type: LensType;
  lens_index: number;
  coating: Coating | null;
  right_sph?: number | null;
  right_cyl?: number | null;
  left_sph?: number | null;
  left_cyl?: number | null;
}

export interface CheckStockResponse {
  inStock: boolean;
  inventoryId: string | null;
  qty: number;
}

export interface CreateOrderRequest {
  store_id: string;
  customer_name: string;
  customer_phone?: string;
  right_sph?: number;
  right_cyl?: number;
  right_axis?: number;
  right_add?: number;
  left_sph?: number;
  left_cyl?: number;
  left_axis?: number;
  left_add?: number;
  pd?: number;
  lens_type: LensType;
  lens_index: number;
  coating?: Coating;
  frame_brand?: string;
  frame_model?: string;
  frame_color?: string;
  sourcing_notes?: string;
}

export interface UpdateStatusRequest {
  status: OrderStatus;
  reason: string;
  changed_by?: string;
}

export interface PredictBreachRequest {
  order_id: string;
}

export interface PredictBreachResponse {
  breach_probability: number;
  predicted_breach: boolean;
  risk_level: RiskLevel;
  reasoning: string;
  recommended_action: string;
}

export interface SendAlertRequest {
  order_id: string;
  alert_type: AlertType;
}

// ── UI Types ──────────────────────────────────────────────────────────────────

export interface SLAProgress {
  elapsed_hours: number;
  remaining_hours: number;
  percentage: number;
  is_overdue: boolean;
  color: 'green' | 'amber' | 'red' | 'pulsing-red';
}

export interface DashboardStats {
  total_active: number;
  breaching_sla: number;
  at_risk: number;
  avg_tat_hours: number;
}

export interface OrderFilters {
  status?: OrderStatus[];
  lens_type?: LensType[];
  store_id?: string[];
  date_from?: string;
  date_to?: string;
}
