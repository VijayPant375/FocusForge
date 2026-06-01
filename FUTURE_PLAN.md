# FocusForge Implementation Plan

For use with Codex / Antigrav AI agents

Goal: real LLM integration + live Render deployment = resume-ready project

## Context & Repo Structure

Before starting any phase, familiarize yourself with the codebase. FocusForge is a true microservices app: 5 independent services plus an API gateway. Each service is its own Node.js/Express app with its own `package.json`. Do not mix code across services.

Expected folder structure:

```text
focusforge/
  api-gateway/          <- Entry point, routes to other services
  habit-service/        <- CRUD for habits
  analytics-service/    <- Streaks, completion stats
  notification-service/ <- Reminders (not touched in this plan)
  ai-service/           <- Currently rule-based - this is what we replace
  frontend/             <- React 18 + Vite
```

The `ai-service` currently has a rule engine that produces insights based on `if/else` logic. The README acknowledges this. Replacing it with real Gemini API calls is the core goal of Phase 1.

## Phase 1 - Gemini AI Integration (`ai-service`)

Estimated time: 3-4 hours

Test before moving to Phase 2.

### 1.1 - Setup

- Install the Google Generative AI SDK inside `ai-service` only:

```bash
cd ai-service && npm install @google/generative-ai
```

- Add `GEMINI_API_KEY` to `ai-service/.env` and do not hardcode it anywhere:

```env
GEMINI_API_KEY=your_key_here
```

- Load it at the top of the service entry file using `process.env.GEMINI_API_KEY`.

Note: Never commit the `.env` file. Add it to `.gitignore` if not already there.

### 1.2 - Replace the rule engine

The current `ai-service` has a function, likely called something like `generateInsights` or `analyzeHabits`, that uses `if/else` rules to return strings. Replace its body with a Gemini API call.

The function receives habit data. Use it to build a prompt. Example prompt structure:

```text
You are a habit coach. Analyse this user's habit data and give 2-3 short,
specific insights. Be direct. No generic advice.

Habit data (last 30 days):
${JSON.stringify(habitData, null, 2)}

Return plain text. No markdown. Max 3 sentences per insight.
```

Use the `gemini-1.5-flash` model because it is fast and free-tier friendly. Basic call structure:

```js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const result = await model.generateContent(prompt);
const text = result.response.text();
```

Note: Keep the same function signature and return shape as before so the rest of the app does not break. Only the internals change.

### 1.3 - Failure pattern detection endpoint

Add a new endpoint to `ai-service`:

```text
POST /api/ai/failure-patterns
```

This endpoint receives habit history and asks Gemini to identify skip patterns. Example prompt:

```text
Analyse this habit completion history and identify patterns in missed days.
Be specific - name days of week, times, or sequences where skips cluster.
Return 2-3 bullet points in plain text.

Data: ${JSON.stringify(completionHistory)}
```

The endpoint should accept:

```json
{ "habitId": "...", "habitName": "...", "completionHistory": [{ "date": "...", "completed": true }] }
```

### 1.4 - Coaching messages endpoint

Add a new endpoint:

```text
POST /api/ai/coaching-message
```

This endpoint is called when a user completes or misses a habit. It returns a short motivational message.

Request body:

```json
{ "habitName": "...", "status": "...", "streak": 0, "mode": "supportive" }
```

`mode` is either `"supportive"` or `"tough"`.

Prompt template:

```text
You are a habit coach in ${mode} mode.
The user just ${status} their habit: '${habitName}'.
Current streak: ${streak} days.
Give ONE short coaching message (max 20 words). No hashtags. No emojis.
```

Note: Wrap all Gemini calls in `try/catch`. On error, return a fallback string so the frontend never breaks.

### 1.5 - Wire frontend to new endpoints

In the frontend, find where AI insights are currently displayed. Update the API calls to hit the new endpoints.

Three places to update:

- Main dashboard insights section: call the existing insights endpoint and verify it works with real data.
- Habit completion event: call `POST /api/ai/coaching-message` and show the response as a toast or inline message.
- Analytics page: add a section that calls `POST /api/ai/failure-patterns` and renders the result.

Note: All requests go through the `api-gateway`, not directly to `ai-service`. Check the gateway routing config before updating frontend URLs.

### Phase 1 Verification Checklist

| Check | Expected result |
| --- | --- |
| `GEMINI_API_KEY` set in `ai-service/.env` | Service starts without error |
| `POST /api/ai/insights` with sample habit data | Returns real Gemini-generated text, not rule-based strings |
| `POST /api/ai/failure-patterns` with history array | Returns pattern analysis mentioning specific days or patterns |
| `POST /api/ai/coaching-message` with `status=completed` | Returns short motivational sentence |
| `POST /api/ai/coaching-message` with `status=missed` | Returns a different, appropriate message |
| Gemini key missing or API down | Endpoints return fallback string and do not crash |
| Frontend dashboard loads | AI insights section shows real text |
| Complete a habit in frontend | Coaching message appears as toast or inline |

## Phase 2 - Render Deployment

Estimated time: 2 hours

Do this immediately after Phase 1 is verified locally.

### 2.1 - Pre-deployment checks

- Confirm each service has a start script in `package.json`, for example `"start": "node index.js"`.
- Confirm each service reads its port from `process.env.PORT` with a fallback.
- Confirm inter-service URLs are read from environment variables, not hardcoded.
- Confirm `GEMINI_API_KEY` is only in `.env`, not committed to git.

Note: Render injects `PORT` automatically. Services must not hardcode port numbers.

### 2.2 - Deploy each service on Render

Deploy as individual Web Services on Render. Repeat this for each of the 5 services plus the frontend:

- Create a new Web Service on `render.com`.
- Connect your GitHub repo (`VijayPant375/focusforge` or equivalent).
- Set Root Directory to the service folder, for example `ai-service`.
- Set Build Command to `npm install`.
- Set Start Command to `npm start`.
- Add environment variables for that service in the Render dashboard.

Environment variables to set per service:

| Service | Required env vars |
| --- | --- |
| `api-gateway` | `HABIT_SERVICE_URL`, `ANALYTICS_SERVICE_URL`, `AI_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `PORT` |
| `ai-service` | `GEMINI_API_KEY`, `PORT` |
| `habit-service` | `MONGODB_URI`, `PORT` |
| `analytics-service` | `MONGODB_URI`, `PORT` |
| `notification-service` | `PORT` plus any reminder config it uses |
| `frontend` | `VITE_API_BASE_URL` set to the `api-gateway` Render URL |

Note: Deploy `api-gateway` last, after all other services are live, so you have their URLs ready.

### 2.3 - Frontend deployment

The frontend is a Vite app. On Render, deploy it as a Static Site, not a Web Service:

- Build Command: `npm run build`
- Publish Directory: `dist`
- Set `VITE_API_BASE_URL` to your `api-gateway` Render URL before building

Note: Vite bakes env vars into the build. If you change `VITE_API_BASE_URL` after building, you must redeploy.

### Phase 2 Verification Checklist

| Check | Expected result |
| --- | --- |
| All 5 services plus frontend deployed on Render | Each shows "Live" status in the Render dashboard |
| Open the frontend Render URL in a browser | App loads with no console errors about missing API |
| Login and signup flow | Works end to end on the live URL |
| AI insights visible on dashboard | Real Gemini text, not placeholder or rule-based text |
| Complete a habit on the live URL | Coaching message appears |
| Failure patterns on analytics page | Renders correctly with live data |

## Phase 3 - Landing Page + Demo Mode

Estimated time: 3 hours

Only start after Phase 2 is verified.

### 3.1 - Landing page (separate route)

Create a landing page at the `/` route. Move the current login or dashboard entry to `/app`. The landing page is a marketing page and does not require auth.

Required sections on the landing page:

- Hero: app name, one-line description, and two CTAs, "Try Demo" and "Sign Up"
- Architecture callout: mention "5 microservices + API gateway" explicitly because this is the resume signal
- Features section: 3-4 feature highlights with icons, including AI-powered insights prominently
- Tech stack badges: Node.js, React, MongoDB, Docker, Gemini AI
- Footer: GitHub link and live URL

Note: Keep it simple. One page, no animations needed. Clean layout is enough.

### 3.2 - Demo mode

The demo account allows anyone to try the app without signing up. It must have pre-seeded habit history so AI insights generate immediately.

Backend: create a seed script at `scripts/seedDemo.js` that:

- Creates a user with email `demo@focusforge.app` and a fixed password
- Creates 5 habits, for example Morning Run, Read 30 mins, Drink Water, Meditate, Stretch
- Generates 30 days of completion history with realistic patterns, for example skipped Morning Run on Mondays and occasional missed weekends
- Inserts this data into MongoDB and runs once against the Atlas production DB

Frontend: the "Try Demo" button on the landing page should:

- Call `POST /api/auth/login` with `{ email: 'demo@focusforge.app', password: 'demo1234' }`
- Store the returned JWT and redirect to `/app/dashboard`
- Show a dismissable banner at the top: "You are in demo mode. Data resets daily."

Note: Add a daily cron job or Render scheduled job that re-runs the seed script to reset demo data. If cron setup is complex, skip the reset for now. Static demo data is fine for a resume project.

### Phase 3 Verification Checklist

| Check | Expected result |
| --- | --- |
| Visit live URL, not `/app` | Landing page loads, not the dashboard |
| "Try Demo" button | Logs in automatically and redirects to dashboard |
| Demo dashboard | Shows 5 habits and 30 days of history |
| AI insights on demo account | Gemini generates real insights based on seed data |
| Failure patterns on demo account | Shows a "you skip Morning Run on Mondays" style insight |
| "Sign Up" CTA | Redirects to signup form |
| GitHub link in footer | Goes to the correct repo |

## Phase 4 - PWA + Pomodoro Timer

Estimated time: 3 hours

Can be done in parallel with Phase 3.

### 4.1 - PWA setup

Use the `vite-plugin-pwa` package. It handles manifest and service worker generation automatically.

- Install inside `frontend/`:

```bash
npm install -D vite-plugin-pwa
```

- Add to `vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'FocusForge',
      short_name: 'FocusForge',
      theme_color: '#ffffff',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    }
  })
]
```

- Add `icon-192.png` and `icon-512.png` to `frontend/public/`.

Note: You can generate icons at any favicon generator site. The app just needs to be installable. Icon quality does not matter for the resume.

### 4.2 - Pomodoro timer

Add a timer component that lives on the habit detail page or dashboard. This is pure frontend, with no backend changes.

Requirements:

- Circular countdown timer using an SVG circle with `stroke-dashoffset` animation
- Three presets: 25 min (focus), 5 min (short break), 15 min (long break)
- Start, Pause, and Reset controls
- Browser notification via the Notifications API when the timer completes

Notification code:

```js
if (Notification.permission === 'default') {
  await Notification.requestPermission();
}

new Notification('FocusForge', { body: 'Session complete!' });
```

Note: The timer state should live in React state with `useState` and `useEffect` plus `setInterval`. Do not use any external timer library.

### Phase 4 Verification Checklist

| Check | Expected result |
| --- | --- |
| Open app in Chrome on desktop | Install prompt appears in the address bar |
| Install the app | Opens as a standalone window with no browser chrome |
| Pomodoro timer on habit page | Renders correctly and shows circular countdown |
| Start timer and wait for completion | Browser notification fires |
| Preset buttons `25/5/15` | Timer resets to the correct duration |
| Pause and resume | Timer continues from where it paused |

## Phase 5 - README Update

Estimated time: 30 minutes

Do this last.

Update the README to reflect what the project now actually is. Key things to update:

- Remove any mention of rule-based AI and replace it with "powered by Google Gemini 1.5 Flash"
- Add the live demo link, the Render frontend URL, prominently near the top
- Add a Demo credentials section with `demo@focusforge.app` / `demo1234`
- Update the tech stack section to include Gemini AI and PWA
- Update the architecture section to mention 5 microservices, an API gateway, and independent deployments on Render

Note: The README is often the first thing a recruiter or interviewer reads. The live URL and demo credentials should be visible without scrolling.

## Summary

| Phase | What it delivers | Time | Priority |
| --- | --- | --- | --- |
| 1 - Gemini integration | Real AI replacing rule engine | 3-4 hrs | Must do |
| 2 - Render deployment | Live URL on the internet | 2 hrs | Must do |
| 3 - Landing page + demo | Recruiter-friendly first impression | 3 hrs | High |
| 4 - PWA + Pomodoro | Installable app, extra resume line | 3 hrs | Medium |
| 5 - README update | Accurate docs, visible live link | 30 min | Do last |

Total estimated effort: about 12 hours across 2 days.

The project is resume-ready after Phase 1 plus Phase 2. Everything after that is polish.
