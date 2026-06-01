# FocusForge — Render Deployment Guide

## Prerequisites

Before you start, have these ready:

| Item | Where to get it |
|---|---|
| MongoDB Atlas URI | [cloud.mongodb.com](https://cloud.mongodb.com) → Connect → Drivers → copy URI |
| Gemini API key | Already added to `ai-service/.env` locally |
| JWT Secret | Any long random string — use the **same value** across all services |
| GitHub repo pushed | All changes committed and pushed to GitHub |

> **Important**: The Atlas URI format looks like:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/focusforge?retryWrites=true&w=majority`
>
> In Atlas → Network Access, set **Allow access from anywhere** (`0.0.0.0/0`).
> Render uses dynamic IPs so static IP whitelisting won't work.

---

## Deployment Order

Deploy in this exact sequence — each step gives you a URL needed for the next.

### Step 1 — User Service

1. Render → **New** → **Web Service** → connect your GitHub repo
2. Settings:
   - **Name**: `focusforge-user-service`
   - **Root Directory**: `user-service`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Environment variables:
   ```
   MONGODB_URI  = <your Atlas URI>
   JWT_SECRET   = <your secret>
   PORT         = 10000
   ```
4. Deploy → wait for **Live** → **copy the URL**

---

### Step 2 — Habit Service

- **Name**: `focusforge-habit-service`
- **Root Directory**: `habit-service`
- **Build/Start**: `npm install` / `npm start`
- **Env vars**: same `MONGODB_URI`, `JWT_SECRET`, `PORT=10000`
- Copy the URL

---

### Step 3 — Analytics Service

- **Name**: `focusforge-analytics-service`
- **Root Directory**: `analytics-service`
- **Build/Start**: `npm install` / `npm start`
- **Env vars**: same `MONGODB_URI`, `JWT_SECRET`, `PORT=10000`
- Copy the URL

---

### Step 4 — AI Service

- **Name**: `focusforge-ai-service`
- **Root Directory**: `ai-service`
- **Build/Start**: `npm install` / `npm start`
- **Env vars**:
  ```
  MONGODB_URI    = <your Atlas URI>
  JWT_SECRET     = <your secret>
  GEMINI_API_KEY = <your Gemini API key>
  PORT           = 10000
  ```
- Copy the URL

---

### Step 5 — API Gateway

Now you have all 4 service URLs. Deploy the gateway:

- **Name**: `focusforge-api-gateway`
- **Root Directory**: `api-gateway`
- **Build/Start**: `npm install` / `npm start`
- **Env vars**:
  ```
  USER_SERVICE_URL      = https://focusforge-user-service.onrender.com
  HABIT_SERVICE_URL     = https://focusforge-habit-service.onrender.com
  ANALYTICS_SERVICE_URL = https://focusforge-analytics-service.onrender.com
  AI_SERVICE_URL        = https://focusforge-ai-service.onrender.com
  PORT                  = 10000
  ```
- Copy the URL

---

### Step 6 — Frontend (Static Site)

1. Render → **New** → **Static Site** → connect your GitHub repo
2. Settings:
   - **Name**: `focusforge-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Environment variable:
   ```
   VITE_API_URL = https://focusforge-api-gateway.onrender.com/api
   ```
4. Under **Advanced** → add a Rewrite Rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - (This makes React Router work on page refresh)
5. Deploy

---

## Quick Reference — Env Vars Per Service

| Service | `MONGODB_URI` | `JWT_SECRET` | `GEMINI_API_KEY` | `*_SERVICE_URL` | `VITE_API_URL` |
|---|:---:|:---:|:---:|:---:|:---:|
| user-service | ✅ | ✅ | — | — | — |
| habit-service | ✅ | ✅ | — | — | — |
| analytics-service | ✅ | ✅ | — | — | — |
| ai-service | ✅ | ✅ | ✅ | — | — |
| api-gateway | — | — | — | ✅ (all 4) | — |
| frontend (static) | — | — | — | — | ✅ |

---

## Post-Deployment Verification

| Check | How |
|---|---|
| Gateway health | `GET https://<gateway-url>/health` → `{"status":"API Gateway is running"}` |
| Frontend loads | Open Static Site URL in browser |
| Register + login | Create an account on the live URL |
| AI insights | Dashboard shows Gemini-generated text (not fallback) |
| Complete a habit | Coaching toast appears |
| Failure patterns | Renders in the sidebar |

---

## Common Issues

| Problem | Fix |
|---|---|
| Build failed | Check Render build logs — usually wrong Root Directory |
| `503 Service Offline` from gateway | Target service hasn't fully started — wait 1-2 min |
| AI insights show fallback text | Check `GEMINI_API_KEY` is set in `ai-service` env vars |
| Frontend API calls fail | Make sure `VITE_API_URL` ends with `/api` and gateway is live |
| MongoDB connection error | Whitelist `0.0.0.0/0` in Atlas → Network Access |
| Page 404 on refresh | Add the `/*` → `/index.html` rewrite rule on the Static Site |

---

🚀 After all 6 services are live, your app is deployed and resume-ready.
