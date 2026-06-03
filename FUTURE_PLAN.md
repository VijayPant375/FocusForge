# FocusForge Implementation Plan — Final Stretch

For use with Codex / Antigrav AI agents.

Goal: polish, demo-readiness, and resume-flex. Phases 1 and 2 (Gemini integration + Render deployment) are already complete and live. Do not touch anything related to the existing AI endpoints or Render service configuration unless a phase explicitly says so.

---

## Current State — Read Before Starting Anything

FocusForge is fully deployed and live. Verify this before touching any code:

- Live frontend: https://focusforge-frontend-piek.onrender.com
- All 5 microservices + API gateway are deployed as separate Web Services on Render
- Gemini 1.5 Flash is live in ai-service with three working endpoints:
  - `POST /api/ai/insights`
  - `POST /api/ai/failure-patterns`
  - `POST /api/ai/coaching-message`
- Frontend has been fully reworked: Duolingo/Habitica style, dark/light mode, glassmorphism navbar, XP hero card, toast notifications, skeleton loaders, habit cards with emoji/color, split-screen login/register

The following phases add net-new features only. Nothing in these phases modifies existing service logic, existing routes, or existing database schemas unless stated explicitly.

---

## Folder Structure Reference

```text
focusforge/
  api-gateway/
  user-service/
  habit-service/
  analytics-service/
  ai-service/
  frontend/
    src/
      api.js
      App.jsx
      context/ThemeContext.jsx
      hooks/useGamification.js
      pages/
        Login.jsx
        Register.jsx
        Dashboard.jsx
      components/
        AddHabitModal.jsx
        EditHabitModal.jsx
        DeleteConfirmModal.jsx
        WeeklyChart.jsx
        HabitHeatmap.jsx
        RadialChart.jsx
        PomodoroTimer.jsx        ← already exists, verify before creating
        MoodCheckInModal.jsx
        TemplatesModal.jsx
        HabitChainModal.jsx
        GamificationUI.jsx
        ShareCardModal.jsx
        VoiceCommands.jsx
        ThemeToggle.jsx
  docker-compose.yml
  start.ps1
  README.md
  FUTURE_PLAN.md
```

Before writing any new component, open the relevant file if it already exists. Several components listed above are already built. Do not recreate them.

---

## Phase 3 — Landing Page + Demo Mode

Estimated time: 3–4 hours  
Risk: LOW. This phase only adds new routes and a new page. It does not modify Dashboard.jsx, api.js, any backend service, or any existing route. The app flow for existing users is unchanged.

### 3.1 — Add a `/` landing page route

Open `frontend/src/App.jsx`. Currently the root route `/` likely points to the dashboard or login. You will:

1. Create a new file: `frontend/src/pages/Landing.jsx`
2. In `App.jsx`, add a route so that `/` renders `<Landing />` and the existing dashboard route stays at whatever path it currently uses (do not change existing routes, only add the new one)

The Landing page must include these sections in order:

**Hero section**
- App name: FocusForge
- Tagline: "Build habits that stick — powered by real AI coaching"
- Two buttons side by side:
  - "Try Demo" — clicking this triggers the demo login flow described in 3.2
  - "Sign Up" — links to the existing register page
- Below the buttons, a small line in muted text: "No account needed for demo"

**Architecture callout strip** (single horizontal band across the full width)
- Text: "5 independent microservices + API gateway — deployed on Render"
- This is the resume signal. It must be visible without scrolling on desktop.

**Features section** (3 cards in a row)
- Card 1: "AI-Powered Coaching" — Gemini 1.5 Flash analyzes your habits and gives personalized insights
- Card 2: "Streaks and XP" — Gamified progression, level titles, and 20+ achievement badges
- Card 3: "Analytics That Matter" — Heatmaps, weekly charts, failure pattern detection, and category breakdowns

**Tech stack badges** (small pill badges in a row)
- React 18, Node.js, MongoDB, Express, Gemini AI, Docker, Render

**Footer**
- Left: "Built by VijayPant375"
- Center: Live URL — https://focusforge-frontend-piek.onrender.com
- Right: GitHub link — https://github.com/VijayPant375

Style the landing page to match the existing TailwindCSS theme and dark/light mode. Read `ThemeContext.jsx` before writing any color classes so you use the same CSS variables or Tailwind classes the rest of the app uses. Do not introduce a new color system.

### 3.2 — Demo login flow

The "Try Demo" button should not navigate to the login page. It should trigger a login call inline.

In `Landing.jsx`, implement a `handleDemoLogin` async function:

```js
const handleDemoLogin = async () => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, {
      email: 'demo@focusforge.app',
      password: 'demo1234'
    });
    localStorage.setItem('token', res.data.token);
    navigate('/dashboard'); // use whatever path the current dashboard route is at
  } catch (err) {
    toast.error('Demo unavailable right now. Try signing up instead.');
  }
};
```

Check `api.js` to confirm the exact base URL pattern used elsewhere. Use the same pattern. Do not hardcode the API URL.

After login, on the dashboard, display a dismissable banner:

```text
"You're viewing the demo account. Data resets daily."
```

Add this banner inside `Dashboard.jsx`. It should only appear when the logged-in user's email is `demo@focusforge.app`. Check the profile endpoint response to get the email — the profile endpoint already exists at `GET /api/users/profile`. Read the existing profile-fetching logic in Dashboard.jsx before adding new fetch calls; reuse the existing call if one is already there.

Dismiss on click and store dismissal in `sessionStorage` (not `localStorage`) so the banner reappears on a fresh session.

### 3.3 — Demo account seed script

Create a file: `scripts/seedDemo.js` at the project root (not inside any service folder).

This script connects directly to MongoDB Atlas using the same `MONGODB_URI` that `user-service` and `habit-service` use. Read those services' `.env` files to confirm the exact variable name.

The script must:

1. Delete any existing user with email `demo@focusforge.app`
2. Delete all habits owned by that user's `_id`
3. Create a new user:
   - email: `demo@focusforge.app`
   - password: `demo1234` hashed with bcrypt (saltRounds: 10)
   - username: `DemoUser`
4. Create exactly 5 habits owned by that user's `_id`:
   - Morning Run (category: fitness)
   - Read 30 Mins (category: learning)
   - Drink Water (category: health)
   - Meditate (category: mindfulness)
   - Evening Stretch (category: fitness)
5. Generate 30 days of completion history for each habit. Use this pattern so the AI has something interesting to detect:
   - Morning Run: skipped every Monday and every Saturday — completed all other days
   - Read 30 Mins: completed every day
   - Drink Water: completed every day
   - Meditate: skipped days 5, 10, 15, 20, 25 (roughly weekly gaps)
   - Evening Stretch: completed only on weekdays, always skipped weekends

Before inserting any completion records, read the existing `Completion` or `HabitLog` schema in `habit-service/models/` to confirm the exact field names and data shape. Insert records that exactly match that schema. Do not guess field names.

Run the script locally first against the Atlas URI to verify it works before pushing to Render.

Add this to `package.json` at the project root (or create one if absent):

```json
"scripts": {
  "seed:demo": "node scripts/seedDemo.js"
}
```

### Phase 3 Verification Checklist

| Check | Expected result |
|---|---|
| Visit live URL (not `/app` or `/dashboard`) | Landing page loads |
| Architecture callout visible without scrolling on desktop | Yes |
| Click "Try Demo" | Logs in, redirects to dashboard, demo banner appears |
| Demo dashboard | 5 habits visible with 30 days of history |
| AI Insights on demo account | Gemini returns real text based on seed data |
| Failure patterns on demo account | Should mention Monday and weekend skip patterns |
| Click dismiss on demo banner | Banner disappears for the session |
| Refresh page on demo account | Banner reappears |
| Click "Sign Up" on landing | Navigates to existing register page |
| Footer GitHub link | Opens correct repo |

---

## Phase 4 — PWA Setup

Estimated time: 1–2 hours  
Risk: LOW. This is a build-time addition only. It does not change any component logic, routing, or backend. Existing functionality is completely unaffected. The only change is to `vite.config.ts` (or `.js`) and adding two icon files.

### 4.1 — Install vite-plugin-pwa

Run inside `frontend/` only:

```bash
cd frontend && npm install -D vite-plugin-pwa
```

### 4.2 — Update vite config

Open `frontend/vite.config.ts` (or `vite.config.js`). Add the PWA plugin. Do not remove or modify any existing plugin config — only append:

```ts
import { VitePWA } from 'vite-plugin-pwa';

// Inside the plugins array, add:
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
  manifest: {
    name: 'FocusForge',
    short_name: 'FocusForge',
    description: 'Gamified habit tracking powered by AI coaching',
    theme_color: '#6366f1',
    background_color: '#0f172a',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
})
```

### 4.3 — Add icons

Place two files in `frontend/public/`:
- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

Generate them at https://favicon.io or any favicon generator. The icon design does not matter. What matters is that both files exist and are the correct dimensions. The PWA install prompt will silently fail without them.

### 4.4 — Redeploy frontend on Render

After committing the icon files and the vite config change, push to GitHub. Render will auto-redeploy. No environment variable changes needed.

### Phase 4 Verification Checklist

| Check | Expected result |
|---|---|
| Open live URL in Chrome desktop | Install icon appears in the address bar |
| Click install | App opens as standalone window, no browser chrome |
| Open live URL on Android Chrome | "Add to Home Screen" prompt appears |
| Installed app start URL | Opens to landing page, not a blank screen |
| Existing app features after PWA install | All features work identically |

---

## Phase 5 — Pomodoro Timer Polish

Estimated time: 1 hour  
Risk: NONE. PomodoroTimer.jsx already exists. This phase only polishes it. No backend changes. No routing changes.

### 5.1 — Audit the existing component

Open `frontend/src/components/PomodoroTimer.jsx` and read it fully before making any changes. Identify what is already implemented and what is missing from this list:

Required features:
- Circular SVG countdown timer with animated `stroke-dashoffset`
- Three preset buttons: 25 min (Focus), 5 min (Short Break), 15 min (Long Break)
- Start, Pause, Reset controls
- Browser notification when timer completes

If any of these are already implemented, do not rewrite them. Only add what is missing.

### 5.2 — Browser notification on completion

If not already present, add this inside the timer completion handler:

```js
const notifyDone = async () => {
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification('FocusForge', {
      body: 'Session complete! Time for a break.',
      icon: '/icon-192.png'
    });
  }
};
```

Call `notifyDone()` when the timer reaches zero inside the `useEffect` that drives the countdown.

### 5.3 — Verify it is accessible from the dashboard

Confirm that `PomodoroTimer` is reachable from a habit card action (the per-habit Pomodoro button mentioned in the README). If it is already wired, leave it. If the button exists but does not open the timer, wire it up — find the button in `Dashboard.jsx` or the habit card component and ensure it opens the timer modal.

### Phase 5 Verification Checklist

| Check | Expected result |
|---|---|
| Click Pomodoro button on a habit card | Timer modal opens |
| Circular countdown renders | SVG ring animates smoothly |
| Click 5-min preset | Timer resets to 5:00 |
| Start, then Pause | Timer freezes at current time |
| Resume | Timer continues from where it paused |
| Timer reaches zero | Browser notification fires |
| Notification permission denied | No crash, timer still works |

---

## Phase 6 — Notification Service Activation

Estimated time: 2–3 hours  
Risk: MEDIUM. This touches `notification-service` which has not been changed before. It also adds a new frontend UI element. It does not touch any other service's routes or logic. The risk is limited to the notification service itself.

The README currently says: "Reminder settings are stored in data and exposed in UI, but notification delivery is not yet implemented." This is the gap. Fix it.

### 6.1 — Audit notification-service

Open `notification-service/` and read the existing code fully before writing anything. Understand what is already there. Do not rewrite working code.

### 6.2 — Scheduled reminder check

If not already implemented, add a cron job inside `notification-service` using the `node-cron` package:

```bash
cd notification-service && npm install node-cron
```

Every minute, the cron job should:
1. Fetch all habits that have a reminder set (from `habit-service` or MongoDB directly — use whichever pattern the service already uses for data access)
2. For each habit, check if the current time matches the habit's reminder time (within a 1-minute window)
3. If matched and the habit is not yet completed today, trigger a notification

For now, "trigger a notification" means logging to console: `[REMINDER] User {userId}: time to do "{habitName}"`. A real push notification requires a push service setup (Phase 7) — this phase just gets the logic working.

### 6.3 — In-app notification bell

Add a notification bell icon to the navbar in the frontend. When clicked, it opens a dropdown showing the last 5 reminder triggers for the current user. Store these in `localStorage` keyed by `userId`.

This requires a new `GET /api/notifications` endpoint in the API gateway that calls the notification service. Add this route to the gateway only if `notification-service` exposes it. Do not add a route in the gateway that points to a non-existent endpoint.

If the notification-service does not currently expose an HTTP endpoint for fetching notifications, add one:

```text
GET /notifications — returns last 10 pending reminders for a given userId (passed as query param or JWT)
```

### Phase 6 Verification Checklist

| Check | Expected result |
|---|---|
| Set a reminder on a habit | Reminder time saved |
| Wait until reminder time | Console log appears in notification-service |
| Notification bell in navbar | Renders and opens dropdown on click |
| Dropdown content | Shows habit name and reminder time |
| No reminders set | Dropdown shows "No reminders yet" |

---

## Phase 7 — README Overhaul

Estimated time: 45 minutes  
Risk: NONE. Docs only.

This is the last phase because the README should reflect the final state of the project.

### 7.1 — What to remove

Remove every instance of these phrases:
- "rule-based"
- "rule engine"
- "not LLM-powered"
- "Important: the current AI insights service is rule-based"

Also remove from the Limitations section: "The insights service is rule-based rather than powered by an external AI model."

Also remove from the ai-service description in the service breakdown table: "Rule-based habit insights"

### 7.2 — What to add or update

**At the very top, before anything else, add:**

```markdown
## 🚀 Live Demo

🌐 **[https://focusforge-frontend-piek.onrender.com](https://focusforge-frontend-piek.onrender.com)**

Demo credentials (pre-seeded with 30 days of habit history):
Email: demo@focusforge.app
Password: demo1234
```

**Update the subtitle/tagline** from:
> "A full-stack microservices habit tracker with analytics, streak systems, templates, voice commands, and rule-based AI insights"

To:
> "A production-deployed full-stack microservices habit tracker with gamification, analytics, and AI coaching powered by Google Gemini 1.5 Flash"

**Update badges** — add a Gemini AI badge and a Render badge. Remove nothing.

**Update the ai-service row** in the service breakdown table:
- Change description from "Rule-based habit insights" to "Gemini 1.5 Flash — insights, failure pattern detection, coaching messages"

**Add three new endpoints** to the AI Service section in the API Endpoints table:
```text
POST /api/ai/insights
POST /api/ai/failure-patterns
POST /api/ai/coaching-message
```

**Update the Limitations section** — remove the rule-based line. Replace with:
- "Voice commands depend on browser speech recognition and may not work in every browser."
- "Notification delivery is implemented as console-logged reminders; browser push notifications require a configured push service."
- "There is no automated test suite."

**Update the Roadmap** — move these from "Planned or Partial" to "Already Implemented":
- AI coaching and insights (Gemini 1.5 Flash)
- Pomodoro timer
- PWA / installable app
- Landing page with demo mode
- Failure pattern detection
- Coaching messages on completion and miss events

**Update the project description** in `ai-service/` in the Project Structure section from "Rule-based habit insights" to "Gemini-powered insights, coaching, and failure pattern detection"

### 7.3 — Formatting rules

Follow the existing README style exactly:
- Centered `<div align="center">` header block — keep it
- Badge row — keep it, update it
- Horizontal `---` dividers between sections — keep them
- Table formatting — keep it
- The footer "Built with ❤️ by VijayPant375" — keep it

Do not rewrite sections that do not need changes. Only touch what is listed above.

### Phase 7 Verification Checklist

| Check | Expected result |
|---|---|
| README opens on GitHub | Live demo link is visible above the fold |
| Demo credentials | Visible without scrolling |
| Search README for "rule-based" | Zero results |
| AI endpoints section | All 3 endpoints listed |
| Architecture section | Says "Gemini 1.5 Flash" not "rule engine" |
| Limitations section | No mention of rule-based AI |
| Roadmap "Already Implemented" | Includes Gemini AI, PWA, Pomodoro, Landing page |

---

## Phase Summary

| Phase | What it delivers | Time | Risk |
|---|---|---|---|
| 3 — Landing page + demo | Recruiter-friendly entry point, demo credentials, seed script | 3–4 hrs | Low |
| 4 — PWA | Installable app, resume line, mobile-ready | 1–2 hrs | None |
| 5 — Pomodoro polish | Complete the existing timer component | 1 hr | None |
| 6 — Notification service | Activate reminder logic, notification bell in navbar | 2–3 hrs | Medium |
| 7 — README overhaul | Accurate docs, live URL above the fold, demo credentials | 45 min | None |

Total estimated effort: 8–11 hours.

The project is resume-flex-ready after Phase 3 + Phase 4 + Phase 7. Phases 5 and 6 are polish that make it genuinely impressive. Do them in order.

---

## Global Rules for All Agents

1. Read existing files before writing new ones. If a file already exists, extend it — do not replace it.
2. Never hardcode API URLs. Always use `import.meta.env.VITE_API_URL` in the frontend.
3. Never commit `.env` files or API keys.
4. All Gemini API calls must have `try/catch` with a fallback string return. Never let an AI endpoint crash the frontend.
5. All inter-service communication goes through the API gateway. Frontend never calls a microservice directly.
6. Do not change any existing route paths in any service. Only add new ones.
7. Do not modify `docker-compose.yml` — it is for local dev and does not affect Render.
8. After any frontend change, run `npm run build` locally and verify it compiles before pushing.
9. After any backend change, check that the existing endpoints still return the same response shape as before.
10. When in doubt, read before writing.