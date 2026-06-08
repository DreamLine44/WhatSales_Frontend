# WhatSales Frontend

React + Vite dashboard for the WhatSales WhatsApp Business Automation platform.

## What this is

The frontend provides two separate authenticated surfaces:

- **Tenant dashboard** (`/dashboard`, `/orders`, `/sessions`, etc.) — for individual business owners to manage their bot, orders, bookings, and customers
- **Super admin panel** (`/admin`, `/admin/tenants`) — for platform operators to create and manage tenants, configure WhatsApp credentials, and control tenant lifecycle

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in VITE_API_URL and VITE_ADMIN_TENANT_ID
npm run dev                  # runs on http://localhost:3000
```

## Environment variables

See `.env.example` for required variables and how to find their values.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (Railway in production, `http://localhost:5000` locally) |
| `VITE_ADMIN_TENANT_ID` | MongoDB `_id` of the super-admin tenant — routes login to the admin panel |

## Scripts

```bash
npm run dev      # development server with HMR
npm run build    # production build → dist/
npm run preview  # preview the production build locally
npm run lint     # ESLint
```

## Deployment

See [`DEPLOY.md`](./DEPLOY.md) for full instructions covering:
- Railway backend environment variables
- Vercel frontend environment variables and SPA routing
- CORS configuration
- Meta webhook registration (callback URL, verify token, field subscriptions)
- End-to-end onboarding walkthrough

## Architecture notes

- **Auth:** Tenant login uses `Tenant ID + API key` stored in `localStorage`. Admin login uses a super-admin API key stored in `sessionStorage` (cleared on tab close).
- **API layer:** `src/api.js` — two axios instances (`http` for tenant routes, `adminHttp` for `/admin/tenants/*`). Both read credentials from storage via interceptors.
- **Polling:** Dashboard overview refreshes every 120s; live sessions refresh every 60s; sidebar badge refreshes every 90s.
- **Business modes:** 13 modes (RESTAURANT, BAKERY, SALON, BARBERSHOP, COSMETICS, ELECTRONICS, FASHION, RETAIL, SUPERMARKET, PHARMACY, DELIVERY, SERVICES, GENERAL) — the `needsMenu`, `needsBookings`, `needsServices` helpers in `api.js` control which nav items and pages are shown per mode.
