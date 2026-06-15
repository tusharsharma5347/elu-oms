# ELU OMS — AI-Powered Order Management System

A production-ready, full-stack Order Management System for an eyewear fulfillment brand. Features real-time order tracking, AI-powered SLA breach prediction using Google Gemini, lens inventory management, and automated email alerts.

---

## Features

- **Order Dashboard** — Real-time order table with SLA progress bars, risk indicators, and live Supabase subscriptions
- **AI Breach Prediction** — Google Gemini 1.5 Pro analyzes each order and predicts SLA breach probability
- **Lens Inventory** — Track stock across lens types, indices, and coatings with inline quantity editing
- **Automated Alerts** — Resend emails when breach probability > 75% or order is overdue
- **Status Workflow** — Enforced status transitions with full audit history
- **Vercel Cron** — AI predictions refreshed every 2 hours for all active orders

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL + Realtime) |
| AI | Google Gemini 1.5 Pro (`@google/generative-ai`) |
| Email | Resend |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (free tier available)
- A [Resend](https://resend.com) account (optional — for email alerts)

---

## Setup

### 1. Clone & Install

```bash
cd "elu-oms"
npm install
```

### 2. Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```env
# Supabase — from your project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI — from aistudio.google.com
GEMINI_API_KEY=your-gemini-api-key

# Resend — from resend.com (optional)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=alerts@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron security (optional but recommended for production)
CRON_SECRET=any-random-string
```

### 3. Set Up the Database

In your Supabase project, go to **SQL Editor** and run the migrations in order:

```sql
-- Step 1: Run schema migration
-- Copy and paste contents of: supabase/migrations/001_initial_schema.sql

-- Step 2: Run seed data
-- Copy and paste contents of: supabase/migrations/002_seed.sql
```

This creates all tables, indexes, RLS policies, and seeds:
- 3 stores (Delhi Central, Mumbai West, Bangalore South)
- SLA config (SV: 24h, BF: 48h, Progressive: 72h, KT: 96h)
- 34 lens inventory SKUs
- 30 realistic orders across all statuses and risk levels

### 4. Enable Supabase Realtime

In your Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable replication for the `orders` table

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to the dashboard.

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main order dashboard with filters
│   ├── orders/
│   │   ├── new/            # Create order form
│   │   └── [id]/           # Order detail page
│   ├── inventory/          # Lens inventory management
│   ├── alerts/             # Alert log
│   └── api/
│       ├── orders/         # CRUD + check-stock
│       ├── ai/             # Gemini prediction endpoint
│       ├── alerts/         # Resend email endpoint
│       └── cron/           # Scheduled prediction refresh
├── components/
│   ├── orders/             # StatusBadge, SLABar, OrderTable, etc.
│   ├── inventory/          # InventoryTable
│   ├── dashboard/          # StatsBar
│   └── layout/             # Sidebar
├── lib/
│   ├── supabase.ts         # DB client
│   ├── gemini.ts           # AI prediction
│   ├── resend.ts           # Email alerts
│   ├── sla.ts              # SLA calculations
│   └── order-utils.ts      # Utilities & status maps
├── types/
│   └── index.ts            # TypeScript interfaces
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        └── 002_seed.sql
```

---

## SLA Rules

| Lens Type | SLA |
|---|---|
| SV (Single Vision) | 24 hours |
| BF (Bifocal) | 48 hours |
| Progressive | 72 hours |
| KT (Kids/Trivex) | 96 hours |

**SLA Bar Colors:**
- Green: < 60% elapsed
- Amber: 60–85% elapsed
- Red: 85–100% elapsed
- Pulsing Red: Overdue (> 100%)

---

## Status Workflow

```
ORDER_PLACED → LENS_SOURCING | CUTTING_EDGING
LENS_SOURCING → CUTTING_EDGING
CUTTING_EDGING → QC
QC → DISPATCH | QC_FAILED
QC_FAILED → CUTTING_EDGING  (re-loop)
DISPATCH → DELIVERED
```

---

## Deploy to Vercel

1. Push to GitHub
2. Connect repo in [Vercel dashboard](https://vercel.com)
3. Add all environment variables from `.env.example` under **Settings → Environment Variables**
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://elu-oms.vercel.app`)
5. Deploy!

The `vercel.json` configures a cron job to refresh AI predictions every 2 hours automatically.

> **Note:** Vercel Cron is available on the Hobby plan (1 cron per project) and Pro plan (unlimited). The cron will call `GET /api/cron/refresh-predictions` with the `Authorization: Bearer <CRON_SECRET>` header.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/orders` | GET | List orders (filterable) |
| `/api/orders` | POST | Create order |
| `/api/orders/[id]` | GET | Order detail + history |
| `/api/orders/[id]` | PATCH | Update status |
| `/api/orders/check-stock` | POST | Check lens inventory |
| `/api/ai/predict-breach` | POST | Run Gemini prediction |
| `/api/alerts/send` | POST | Send Resend alert |
| `/api/cron/refresh-predictions` | GET | Refresh all active order predictions |
