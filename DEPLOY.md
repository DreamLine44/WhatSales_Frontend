# WhatSales — Deployment Guide

Complete instructions for deploying the backend to **Railway** and the frontend to **Vercel**, then wiring up Meta's WhatsApp Cloud API.

---

## 1. Backend → Railway

### 1.1 Create the project

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub** → select your backend repo.
2. Railway auto-detects Node.js. Confirm the **Start Command** matches your `package.json` `start` script (e.g. `node src/index.js`).
3. Add a **MongoDB plugin** (or connect an Atlas cluster — paste the URI into `MONGODB_URI`).

### 1.2 Environment variables

Set these under **Railway → your service → Variables**:

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | Must be `production` |
| `MONGODB_URI` | ✅ | Full MongoDB connection string |
| `ENCRYPTION_KEY` | ✅ | 64 hex chars (32 bytes). Generates: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SUPER_ADMIN_API_KEY_HASH` | ✅ | SHA-256 hash of your super-admin key. Generate both at once: `node -e "const c=require('crypto'),k=c.randomBytes(32).toString('hex');console.log('KEY:',k,'\nHASH:',c.createHash('sha256').update(k).digest('hex'))"` — store the KEY securely, put the HASH here |
| `CORS_ORIGIN` | ✅ | Your Vercel frontend URL, e.g. `https://whatsales.vercel.app` |
| `GROQ_API_KEY` | ✅ | Groq API key for the AI intent classifier |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | Required for menu item images |
| `CLOUDINARY_API_KEY` | ⚠️ | Required for menu item images |
| `CLOUDINARY_API_SECRET` | ⚠️ | Required for menu item images |
| `SIMULATION_MODE` | — | Set to `false` in production (default) |
| `PORT` | — | Do NOT set — Railway injects it automatically |

> **Security:** Generate `ENCRYPTION_KEY` and `SUPER_ADMIN_API_KEY_HASH` fresh for each environment. Never reuse dev values in production.

### 1.3 Note your Railway URL

After a successful deploy, your backend is at:
```
https://your-app.up.railway.app
```
Save this — you'll need it for `VITE_API_URL` and for Meta webhook registration.

### 1.4 Verify the backend is healthy

```bash
curl https://your-app.up.railway.app/health
# Expected: { "ok": true }
```

---

## 2. Frontend → Vercel

### 2.1 Create the project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import your frontend repo.
2. Vercel auto-detects Vite. Confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`

### 2.2 Environment variables

Set these under **Vercel → your project → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Railway backend URL (no trailing slash), e.g. `https://your-app.up.railway.app` |
| `VITE_ADMIN_TENANT_ID` | The `_id` of the super-admin Tenant document in MongoDB (see `.env.example` for how to find it) |

> **Important:** Vite injects these at **build time**, not runtime. After changing them, trigger a fresh deploy via Vercel dashboard or `git push`.

### 2.3 SPA routing

The `vercel.json` in the repo already handles React Router's catch-all:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
No extra configuration needed.

### 2.4 Note your Vercel URL

After deploy:
```
https://whatsales.vercel.app   (or your custom domain)
```
Paste this into Railway's `CORS_ORIGIN`.

---

## 3. CORS — connecting frontend ↔ backend

In Railway → Variables, set:
```
CORS_ORIGIN=https://whatsales.vercel.app
```

The backend's `app.js` reads this and passes it to the `cors()` middleware. If you use a custom domain on Vercel, use that instead.

**Multiple origins** (e.g. Vercel preview URLs): check if your `app.js` supports a comma-separated list, or whitelist only the production domain.

---

## 4. Meta Webhook Registration

This connects Meta's WhatsApp Cloud API to your Railway backend so incoming messages are delivered.

### 4.1 Prerequisites

- A Meta **Business Account** with a **WhatsApp Business Account (WABA)**
- A **Phone Number** registered in that WABA
- Your Railway backend is live and responding at `/health`

### 4.2 Generate a Verify Token

The verify token is a string you invent — Meta echoes it back to confirm your endpoint. Make it random:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# e.g. a3f84c2b91d05e7f...
```

Keep this value — you need it in the next two steps.

### 4.3 Save credentials to the tenant

Before registering the webhook, save WhatsApp credentials to the tenant via the Admin panel:

1. Log in to `/admin` → **Tenants** → open the tenant → **Edit → WhatsApp tab**
2. Fill in:
   - **Phone Number ID** — the numeric ID from Meta for Developers → WhatsApp → API Setup (NOT the phone number itself or WABA ID)
   - **Access Token** — a permanent System User token from Meta Business Manager
   - **Verify Token** — the string you generated above
   - **Webhook Secret** — a separate random string for HMAC signature verification (generate another one)
   - **WhatsApp Phone Number** — the E.164 number, e.g. `+22012345678`
3. Click **Save Credentials**
4. Click **Verify WhatsApp** — this calls Meta's API and sets `onboardingStep → 3`

### 4.4 Register the webhook in Meta Developer Portal

1. Go to [developers.facebook.com](https://developers.facebook.com) → your app → **WhatsApp → Configuration → Webhook**
2. Click **Edit** and enter:
   - **Callback URL:** `https://your-app.up.railway.app/webhook`
   - **Verify Token:** the token from step 4.2
3. Click **Verify and Save**

Meta sends `GET /webhook?hub.challenge=...` to your backend. The backend decrypts the stored verify token and echoes the challenge. If verification succeeds, the webhook is confirmed.

### 4.5 Subscribe to webhook fields

After verification, enable these **Webhook Fields**:

- `messages` ✅ **Required** — incoming customer messages
- `message_deliveries` — optional delivery receipts
- `message_reads` — optional read receipts

### 4.6 Activate the tenant

1. Admin panel → **Tenants** → open the tenant → **Edit → Status tab**
2. Click **ACTIVE**

The tenant must have `onboardingStep >= 3` (credentials verified) before activation succeeds.

### 4.7 Test end-to-end

Send a WhatsApp message to your registered phone number. Within a few seconds you should get a bot reply.

**If nothing arrives**, check Railway logs (`railway logs --tail`):

| Symptom | Likely cause |
|---|---|
| `403` on webhook POST | `ENCRYPTION_KEY` mismatch, or verify token not saved to the tenant before registering |
| `404` on webhook POST | Wrong callback URL — confirm the path is `/webhook` (no tenant ID) |
| Bot silent, no errors | Tenant not ACTIVE, or `whatsapp.connected` is false — re-run Verify WhatsApp then activate |
| `invalid_phone_number_id` from Meta | You used the WABA ID, App ID, or phone number instead of the numeric Phone Number ID |

---

## 5. Post-deploy checklist

- [ ] `GET /health` → `{ "ok": true }`
- [ ] Frontend loads at Vercel URL, login page renders
- [ ] Super-admin login works with `VITE_ADMIN_TENANT_ID` + super-admin API key
- [ ] Create a test tenant from `/admin/tenants`
- [ ] Save WhatsApp credentials → Verify WhatsApp → activate
- [ ] Tenant logs in with their Tenant ID + API key
- [ ] Send a WhatsApp message → bot responds
- [ ] Railway logs show no `ENCRYPTION_KEY`, `MONGODB_URI`, or CORS errors
