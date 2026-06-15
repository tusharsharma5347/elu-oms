# ELU OMS — Architecture Overview

## System Overview

ELU OMS is a single-repo, full-stack Next.js 16 application that manages the end-to-end lens order lifecycle for an eyewear fulfillment brand. It combines a real-time operations dashboard, AI-powered risk prediction, inventory management, and automated alerting in one deployable unit.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │ Order Detail │  │  Inventory / Alerts  │  │
│  │  (realtime)  │  │  (SSR + CSR) │  │       (SSR)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │ Supabase Realtime│ Fetch API                          │
└─────────┼──────────────────┼─────────────────────────────────────┘
          │                  │
┌─────────▼──────────────────▼─────────────────────────────────────┐
│                     NEXT.JS 16 (Vercel Edge/Node)                │
│                                                                  │
│  API Routes (Serverless Functions)                               │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │ /api/orders  │  │ /api/ai/      │  │ /api/cron/            │ │
│  │  GET, POST   │  │ predict-breach│  │ refresh-predictions   │ │
│  │  PATCH, [id] │  │   (Gemini)    │  │  (every 2h, Vercel)   │ │
│  └──────┬───────┘  └──────┬────────┘  └───────────────────────┘ │
│         │                 │           ┌───────────────────────┐  │
│  ┌──────┴──────┐          │           │ /api/alerts/send      │  │
│  │ check-stock │          │           │    (Resend email)     │  │
│  └─────────────┘          │           └───────────────────────┘  │
└─────────┬─────────────────┼──────────────────────────────────────┘
          │                 │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────────────┐
   │  Supabase   │   │  Google     │   │    Resend    │
   │ PostgreSQL  │   │  Gemini     │   │    Email     │
   │ + Realtime  │   │  1.5 Pro    │   │    API       │
   │ + Auth      │   │             │   │              │
   └─────────────┘   └─────────────┘   └──────────────┘
```

---

## Key Technology Decisions

### Google Gemini 1.5 Pro — AI Prediction
**Why:** Gemini 1.5 Pro offers excellent JSON-mode output reliability, strong reasoning for multi-factor analysis, and a generous free tier (via Google AI Studio), making it ideal for production use without upfront cost. The `responseMimeType: 'application/json'` setting ensures deterministic structured output without parsing heuristics.

**How it's used:** Each order is analyzed with a structured prompt covering elapsed time, SLA headroom, stock status, lens complexity, QC failure count, and day-of-week effects. Output is a JSON object with `breach_probability` (0–1), `risk_level` (LOW/MEDIUM/HIGH/CRITICAL), `reasoning`, and `recommended_action`.

**Trigger points:**
1. Order creation
2. Every status change
3. Vercel Cron every 2 hours for all active orders

### Supabase — Database, Auth, and Realtime
**Why:** Supabase provides PostgreSQL (for relational integrity of orders, inventory, and SLA config), built-in Row Level Security, Supabase Auth (email/password), and Realtime subscriptions — all in one managed service. This eliminates the need for a separate WebSocket server and simplifies the auth stack.

**Realtime:** The dashboard uses `postgres_changes` channel subscriptions so order status updates appear instantly for all connected operators without polling.

### Resend — Transactional Email
**Why:** Resend has a clean developer API, reliable deliverability, and a generous free tier (100 emails/day). The system sends HTML-formatted alerts with order details and a direct deep-link to the order detail page. A 6-hour cooldown per order prevents alert fatigue.

### Vercel — Deployment and Cron
**Why:** Next.js is first-party supported on Vercel with zero-config deployment, automatic Edge/Node function routing, and native Vercel Cron (configured via `vercel.json`). The cron runs `GET /api/cron/refresh-predictions` every 2 hours, processing active orders in batches of 5 to respect Gemini API rate limits.

---

## Data Model

```
stores ──< orders >── order_status_history
                 └──> alerts_log
lens_inventory (checked at order creation)
sla_config (seed: SV=24h, BF=48h, Progressive=72h, KT=96h)
```

**Key design decisions:**
- Inventory is only decremented when order reaches `CUTTING_EDGING` (not at placement) to prevent stock holds for sourcing-phase orders
- `order_status_history` provides full audit trail; QC failure count is derived by counting `to_status = 'QC_FAILED'` rows
- `alerts_log` enables deduplication: no alert of the same type is sent within 6 hours for the same order

---

## SLA Flow

```
Order Created
     │
     ▼
Check Inventory ─── In Stock ──► CUTTING_EDGING (decrement qty)
     │
     └── Out of Stock ──► LENS_SOURCING ──► CUTTING_EDGING
                                                    │
                                                    ▼
                                                   QC ──► QC_FAILED ──► CUTTING_EDGING (loop)
                                                    │
                                                    ▼
                                               DISPATCH ──► DELIVERED
```

---

## Security

- All API routes use the Supabase **service role key** (bypasses RLS) — never exposed to the client
- Client components use the **anon key** (subject to RLS policies)
- Cron endpoint is optionally protected with a `CRON_SECRET` bearer token
- Supabase RLS policies restrict unauthenticated access to all tables
