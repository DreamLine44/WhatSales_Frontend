# WhatSales Dashboard — Frontend

A complete React dashboard for business owners to manage their WhatSales WhatsApp bot. Perfectly aligned with the WhatSales backend (`webhookController`, `adminCommandService`, `sessionService`, `moduleRouter`).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP | Axios (with JWT interceptor) |
| Charts | Recharts |
| Image upload | react-dropzone |
| Notifications | react-hot-toast |
| Icons | Lucide React |
| Dates | date-fns |
| Fonts | Syne (display) + DM Sans (body) |

---

## Setup

```bash
cd whatsales-dashboard
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend URL
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
```

---

## Backend Alignment

Every frontend action maps to a specific backend model or function:

### Tenant model (`Tenant.js`)
| UI Page | Field | Backend usage |
|---|---|---|
| WhatsApp Setup | `whatsapp.phoneNumberId` | `receiveWebhook()` — matches incoming messages to tenant |
| WhatsApp Setup | `whatsapp.accessToken` | `dispatcher.js` — sends outbound messages |
| WhatsApp Setup | `status: 'ACTIVE'` | Only ACTIVE tenants receive webhook events |

### BusinessConfig model (`BusinessConfig.js`)
| UI Page | Field | Backend usage |
|---|---|---|
| Business Info | `name`, `adminPhone`, `businessMode` | All modules — greeting, mode config, admin checks |
| Business Info | `payment.requireProof` | `webhookController` step 10 — DONE payment gate |
| Business Info | `payment.waveNumber` | Shown to customers during ORDER flow |
| Bot Messages | `customMessages.welcomeMessage` | `moduleRouter` GREET case |
| Bot Messages | `customMessages.closedMessage` | `webhookController` step 5 — hours enforcement |
| Bot Messages | `customMessages.loopFallback` | `checkAndHandleLoop()` — MAX_LOOP break message |
| Bot Messages | `customMessages.fallback` | `moduleRouter` FALLBACK/CLARIFY case |
| Hours | `hours.enabled` | `isWithinBusinessHours()` — fast exit when false |
| Hours | `hours.timezone` | `Intl.DateTimeFormat` in `isWithinBusinessHours()` |
| Hours | `hours.open`, `hours.close` | Default decimal hours (8 = 8:00am, 22.5 = 10:30pm) |
| Hours | `hours.days[day].closed` | Day-specific closed flag |
| Hours | `hours.days[day].open/close` | Day-specific hour overrides |

### Session model (`Session.js`)
| UI Page | Action | Backend mapping |
|---|---|---|
| Live Sessions | Resume Bot button | `sessionsApi.resumeBot(phone)` → mirrors `RESUME BOT <phone>` WhatsApp admin command in `adminCommandService.resumeBot()` |
| Live Sessions | humanMode count | `sessionsApi.humanModeCount()` → mirrors FIX-2.5 `countDocuments({ tenantId, humanMode: true })` |
| Sessions table | `currentFlow`, `step` | Session fields set by `sessionService.updateSession()` |
| Sessions table | `humanMode` | Set true by `moduleRouter` SUPPORT action, false by `resumeBot()` |
| Sessions table | `messageCount` | Atomically incremented by `updateSession($inc)` — FIX-2.4 / FIX-SES-7 |

### Order model (`Order.js`)
| UI Page | Action | Backend mapping |
|---|---|---|
| Orders | Approve button | `ordersApi.approve(shortId)` → backend mirrors `adminCommandService.confirmPayment()` |
| Orders | Reject button | `ordersApi.reject(shortId)` → backend mirrors `adminCommandService.rejectPayment()` |
| Orders table | `paymentStatus: 'proof_received'` | Set when customer sends payment screenshot (step 9) |
| Orders table | `paymentStatus: 'confirmed'` | Set by `confirmPayment()` after admin approves |
| Orders table | `status: 'pending'` | Reset by `rejectPayment()` so retry window stays open (FIX-CMD-2) |

### Booking model (`Booking.js`)
| UI Page | Action | Backend mapping |
|---|---|---|
| Bookings | Confirm button | `bookingsApi.confirm(shortId)` → mirrors `adminCommandService.confirmBooking()` |
| Bookings | Decline button | `bookingsApi.decline(shortId, reason)` → mirrors `adminCommandService.declineBooking(shortId, reason, ...)` |
| Bookings | Decline reason | Optional — matches `DECLINE BOOK <id> [reason]` text command format |

### Services (SVC_N passthrough IDs)
The bot's `FLOW_PASSTHROUGH_IDS` set includes `SVC_0` through `SVC_99` and any `SVC_N` regex match. Services are assigned IDs **in the order they appear in the services list** — the index in the UI (0-based) must match the `SVC_N` ID the flow engine uses. **Do not reorder services** without testing the booking flow.

---

## Backend API Routes Required

The frontend expects these REST endpoints on your backend:

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/tenant
PATCH  /api/tenant
POST   /api/tenant/whatsapp
POST   /api/tenant/webhook/test

GET    /api/business
PATCH  /api/business
PATCH  /api/business/hours
PATCH  /api/business/messages
PATCH  /api/business/payment
PATCH  /api/business/mode

GET    /api/business/menu
POST   /api/business/menu          (multipart/form-data — image upload)
PATCH  /api/business/menu/:id      (multipart/form-data)
DELETE /api/business/menu/:id
POST   /api/business/menu/reorder

GET    /api/business/services
POST   /api/business/services
PATCH  /api/business/services/:id
DELETE /api/business/services/:id

GET    /api/orders?paymentStatus=&search=
POST   /api/orders/:shortId/approve
POST   /api/orders/:shortId/reject
POST   /api/orders/:shortId/cancel
GET    /api/orders/stats

GET    /api/bookings?status=&search=
POST   /api/bookings/:shortId/confirm
POST   /api/bookings/:shortId/decline  { reason }
GET    /api/bookings/stats

GET    /api/sessions?humanMode=
POST   /api/sessions/resume-bot         { customerPhone }
GET    /api/sessions/human-mode-count

GET    /api/analytics/overview
GET    /api/analytics/revenue?period=7d
GET    /api/analytics/messages?period=7d
GET    /api/analytics/top-products
GET    /api/analytics/conversion
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000   # Your backend URL (no trailing slash)
VITE_APP_NAME=WhatSales
```

---

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx           — JWT auth
│   ├── RegisterPage.jsx        — 2-step: account + business info
│   ├── DashboardPage.jsx       — Overview, stats, pending proofs
│   ├── OrdersPage.jsx          — Approve/reject payments (mirrors adminCommandService)
│   ├── BookingsPage.jsx        — Confirm/decline bookings
│   ├── MenuPage.jsx            — CRUD with image upload (react-dropzone)
│   ├── ServicesPage.jsx        — SVC_N services for booking flows
│   ├── SessionsPage.jsx        — Human-mode management (mirrors RESUME BOT)
│   ├── AnalyticsPage.jsx       — Revenue, messages, funnel charts
│   ├── BusinessSetupPage.jsx   — BusinessConfig core fields
│   ├── BotConfigPage.jsx       — customMessages with live preview
│   ├── HoursPage.jsx           — Business hours (aligned with isWithinBusinessHours)
│   └── WhatsAppPage.jsx        — Tenant WhatsApp credentials + webhook URL
├── components/
│   ├── layout/
│   │   └── DashboardLayout.jsx — Sidebar + topbar layout
│   └── ui/
│       └── index.jsx           — Design system: Card, Button, Badge, Table, Modal…
├── services/
│   └── api.js                  — Axios client with JWT interceptor + all API methods
├── store/
│   └── AuthContext.jsx         — Auth state (user, tenant, login, logout)
└── App.jsx                     — Router + route protection
```
