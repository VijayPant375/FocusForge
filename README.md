<div align="center">

# FocusForge - Gamified Habit Tracking Platform

**A full-stack microservices habit tracker with analytics, streak systems, templates, voice commands, and rule-based AI insights.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-Microservices-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=flat-square)](https://jwt.io)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-UI-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

**FocusForge** is a habit-building platform designed around consistency, focus, and momentum. It combines a polished React dashboard with a Node.js microservices backend so users can create habits, track completions, build streaks, view analytics, unlock achievements, and receive personalized insight messages based on their activity patterns.

Unlike a basic CRUD tracker, FocusForge includes habit chains, mood and energy check-ins, Pomodoro support, habit template bundles, achievement progression, downloadable share cards, and browser-based voice commands. The backend is split into dedicated services for authentication, habit operations, analytics, and insights, all routed through a central API gateway.

---

## Core Features

### Authentication and User Flow
- JWT-based authentication with register, login, and protected routes
- Per-user data isolation across habits and analytics
- Persistent session state stored in `localStorage`
- Profile endpoint for authenticated user retrieval

### Habit Management
- Create, edit, delete, and list habits
- Track habit name, description, category, and frequency
- Daily completion flow with duplicate-completion prevention
- Automatic streak and longest-streak calculation
- Category support for `health`, `productivity`, `mindfulness`, `learning`, `fitness`, and `other`

### Focus and Consistency Features
- Habit chains to link one habit to another
- Post-completion chain suggestions on the dashboard
- Reminder settings per habit with time and repeat days
- Mood and energy logging when marking a habit complete
- Built-in Pomodoro timer modal for focused sessions

### Analytics and Visualization
- Summary cards for total habits, completions, average streak, and completion rate
- Weekly progress analytics from the analytics service
- Habit consistency heatmap
- Radial category distribution chart
- Animated counters and circular progress indicators

### Gamification
- XP system based on completions, streaks, and perfect days
- Level progression with titles
- 20+ unlockable achievement badges
- Streak visuals and milestone-style feedback
- Celebration confetti on successful completion

### Productivity Experience
- One-click template bundles for fitness, learning, health, mindfulness, and productivity
- Shareable progress card export as PNG
- Voice commands powered by the browser Web Speech API
- Skeleton loading states and polished glassmorphism UI
- Dark and light theme toggle with saved preference

### AI Insights
- Personalized insight messages generated from user habit data
- Feedback based on streak strength, completion behavior, category concentration, and timing patterns
- Welcome state and fallback insights for new or low-activity users

> Important: the current "AI insights" service is **rule-based**, not LLM-powered. It analyzes habit data and returns generated motivational or pattern-based insight messages.

---

## Architecture

FocusForge follows a microservices architecture with a dedicated frontend, an API gateway, and four backend services.

```text
+------------------------------+
|           Frontend           |
|   React + Vite + Tailwind   |
+--------------+---------------+
               |
               v
+------------------------------+
|         API Gateway          |
| Routing, CORS, timeout,      |
| service forwarding           |
+------+---------+--------+----+
       |         |        |
       v         v        v
 +-----------+ +-----------+ +---------------+ +-----------+
 |   User    | |   Habit   | |   Analytics   | |    AI     |
 | Service   | | Service   | |    Service    | |  Service  |
 +-----------+ +-----------+ +---------------+ +-----------+
        \          |             |             /
         \         |             |            /
          +---------------------------------+
          |         MongoDB Database        |
          +---------------------------------+
```

### Service Breakdown

| Service | Port | Responsibility |
|---------|------|----------------|
| `frontend` | `5173` in dev / `80` in container | User interface, routing, dashboard, modals, charts |
| `api-gateway` | `5000` | Routes `/api/*` requests to downstream services |
| `user-service` | `5001` | Registration, login, JWT issuance, profile lookup |
| `habit-service` | `5002` | Habit CRUD, completion, streaks, chains, reminders, mood logging |
| `analytics-service` | `5003` | Habit statistics and weekly summary data |
| `ai-service` | `5004` | Rule-based insights generated from habit data |
| `mongodb` | `27017` | Persistent data store |

### Request Flow

```text
User Action in Dashboard
    ↓
Frontend API Layer (`frontend/src/api.js`)
    ↓
API Gateway (`/api/users`, `/api/habits`, `/api/analytics`, `/api/ai`)
    ↓
Target Microservice
    ↓
MongoDB Query / Update
    ↓
Response Back to Frontend
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18 | Component-based frontend |
| Vite | Fast dev server and build pipeline |
| Tailwind CSS | Utility-first styling |
| React Router DOM | Client-side routing |
| Axios | API communication |
| Recharts | Charts and visualization |
| React Hot Toast | Notifications |
| Canvas Confetti | Completion celebration effects |
| Lucide React | Icon usage |

### Backend

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime for backend services |
| Express.js | REST APIs and gateway |
| MongoDB | Persistent data store |
| Mongoose | ODM for schemas and database logic |
| JWT (`jsonwebtoken`) | Authentication tokens |
| bcryptjs | Password hashing |
| Morgan | API request logging in gateway |
| CORS | Cross-origin support |

### DevOps and Deployment

| Technology | Purpose |
|-----------|---------|
| Docker | Service containerization |
| Docker Compose | Local multi-service orchestration |
| Nginx | Frontend static serving in container |
| Render | Documented deployment target |
| PowerShell | Local Windows startup automation |

---

## Implemented Product Features

### Auth & Onboarding
- Split-screen modern Login and Register pages with dynamic visuals
- Protected dashboard route after authentication

### Dashboard Experience
- Sticky navbar with XP bar, user greeting, share action, achievements, theme switch, and logout
- Responsive two-column layout with habits on the left and analytics/insights on the right
- Animated skeleton loading placeholders for seamless first render
- Custom empty states to guide new users
- Bottom-right toaster notifications for AI insights and alerts

### Habit Cards & Management
- Enhanced Add Habit Modal with interactive emoji picker and category color selector
- Per-habit action buttons for complete, edit, delete, Pomodoro, and chain/reminder settings
- Completion state lock for habits already completed today
- Streak badge and category badge display
- Reminder badge display when enabled
- Chained habit label when linked

### Habit Templates
- Fitness Bundle
- Learning Bundle
- Health Bundle
- Mindfulness Bundle
- Productivity Bundle

### Voice Commands
- Complete an existing habit by voice
- Add a new habit by voice
- Open achievements/progress by voice
- Fuzzy matching against habit names

### Gamification Badges
- First habit milestones
- Total completion milestones
- Streak milestones
- Perfect day badge
- Category mastery badges
- Weekend completion badge
- Level-based badges
- Well-rounded category badge

### Insight Types
- Welcome prompt for new users
- Positive streak reinforcement
- Motivation prompts for low streak activity
- Perfect-day celebration
- Morning-pattern suggestions
- Long-streak praise
- Struggling-habit attention prompts
- Category balance suggestions

---

## API Endpoints

All frontend requests go through the API gateway at `http://localhost:5000/api`.

### User Service

```text
POST /api/users/register
POST /api/users/login
GET  /api/users/profile
```

### Habit Service

```text
POST   /api/habits
GET    /api/habits
PUT    /api/habits/:id
DELETE /api/habits/:id
POST   /api/habits/:id/complete
POST   /api/habits/:id/chain
DELETE /api/habits/:id/chain
PUT    /api/habits/:id/reminder
```

### Analytics Service

```text
GET /api/analytics/stats
GET /api/analytics/weekly
```

### AI Service

```text
GET /api/ai/insights
```

### Health Check

```text
GET /health
```

---

## Getting Started

### Prerequisites

- Node.js 16 or newer
- npm
- MongoDB local instance or Docker
- Docker and Docker Compose for the easiest setup

### Environment Variables

Create a root `.env` file based on `.env.example`:

```env
MONGO_INITDB_DATABASE=focusforge
JWT_SECRET=your_jwt_secret
USER_DB_URI=mongodb://mongodb:27017/focusforge-users
HABIT_DB_URI=mongodb://mongodb:27017/focusforge-habits
USER_SERVICE_URL=http://user-service:5001
HABIT_SERVICE_URL=http://habit-service:5002
ANALYTICS_SERVICE_URL=http://analytics-service:5003
AI_SERVICE_URL=http://ai-service:5004
```

> In Docker, service URLs point to container names. For non-Docker local development, use localhost-based URLs and MongoDB connection strings that match your machine.

---

## Docker Setup

Docker is the fastest way to run the full stack locally.

### Start Everything

```bash
docker-compose up --build
```

### Seed Demo Data

Seed the user service first, then the habit service:

```bash
docker-compose exec user-service npm run seed
docker-compose exec habit-service npm run seed
```

### Access the App

```text
Frontend: http://localhost:5173
API Gateway: http://localhost:5000
MongoDB: http://localhost:27017
```

### Stop Containers

```bash
docker-compose down
```

---

## Manual Local Development

### 1. Install Dependencies

```bash
cd api-gateway && npm install
cd ../user-service && npm install
cd ../habit-service && npm install
cd ../analytics-service && npm install
cd ../ai-service && npm install
cd ../frontend && npm install
```

### 2. Start Services

On Windows, you can use the provided startup script:

```powershell
.\start.ps1
```

This script:
- installs missing dependencies
- opens separate PowerShell windows
- starts all backend services
- starts the Vite frontend

If you prefer to run everything manually, open 6 terminals:

```bash
# Terminal 1
cd api-gateway && npm start

# Terminal 2
cd user-service && npm start

# Terminal 3
cd habit-service && npm start

# Terminal 4
cd analytics-service && npm start

# Terminal 5
cd ai-service && npm start

# Terminal 6
cd frontend && npm run dev
```

### 3. Seed Sample Data

```bash
cd user-service && npm run seed
cd ../habit-service && npm run seed
```

### 4. Open the App

```text
http://localhost:5173
```

---

## Demo Account

After seeding data, use the default test account:

```text
Email:    test@example.com
Password: password123
```

---

## Deployment Notes

The repository includes deployment notes for Render in [DEPLOYMENT.md](DEPLOYMENT.md).

### Render Strategy
- Deploy `user-service`, `habit-service`, `analytics-service`, and `ai-service` as separate Node web services
- Deploy `api-gateway` as its own Node service with upstream service URLs configured as environment variables
- Deploy the frontend as a static site after pointing it at the live API gateway. *(If deploying the frontend as a Docker container, ensure `ARG VITE_API_URL` is passed during build)*.
- **Important**: Backend Dockerfiles omit `EXPOSE` instructions to ensure Render's internal router correctly forwards traffic to the default `PORT=10000`.
- Use MongoDB Atlas for production data persistence

### Frontend API Configuration

The frontend reads:

```text
VITE_API_URL
```

If not set, it defaults to:

```text
http://localhost:5000/api
```

---

## Project Structure

```text
FocusForge/
|-- api-gateway/          # Gateway routing to backend services
|-- user-service/         # Auth, users, JWT issuing, seed data
|-- habit-service/        # Habit CRUD, completions, chains, reminders, mood data
|-- analytics-service/    # Stats and weekly summaries
|-- ai-service/           # Rule-based habit insights
|-- frontend/             # React + Vite application
|-- docker-compose.yml    # Local orchestration
|-- start.ps1             # Windows multi-service startup helper
|-- DEPLOYMENT.md         # Deployment notes
|-- DOCKER.md             # Quick Docker reference
|-- FUTURE_PLAN.md        # Feature roadmap and ideas
`-- README.md
```

### Frontend Highlights

```text
frontend/src/
|-- api.js
|-- App.jsx
|-- context/ThemeContext.jsx
|-- hooks/useGamification.js
|-- pages/
|   |-- Login.jsx
|   |-- Register.jsx
|   `-- Dashboard.jsx
`-- components/
    |-- AddHabitModal.jsx
    |-- EditHabitModal.jsx
    |-- DeleteConfirmModal.jsx
    |-- WeeklyChart.jsx
    |-- HabitHeatmap.jsx
    |-- RadialChart.jsx
    |-- PomodoroTimer.jsx
    |-- MoodCheckInModal.jsx
    |-- TemplatesModal.jsx
    |-- HabitChainModal.jsx
    |-- GamificationUI.jsx
    |-- ShareCardModal.jsx
    |-- VoiceCommands.jsx
    `-- ThemeToggle.jsx
```

---

## Roadmap

The repository already contains a broader roadmap in [FUTURE_PLAN.md](FUTURE_PLAN.md). At a high level:

### Already Implemented
- Microservices architecture
- JWT authentication
- Habit CRUD
- Habit streak tracking
- Analytics dashboard
- Theme switching
- Habit templates
- Voice commands
- XP and achievements
- Shareable progress card
- Mood and energy check-ins
- Habit chains
- Reminder settings
- Pomodoro integration

### Planned or Partial
- Browser push notifications
- richer AI coaching and predictive suggestions
- weekly mood trend chart
- social accountability features
- community-shared templates
- PWA/mobile-first improvements
- advanced export and import options
- onboarding flow
- broader deployment polish and marketing assets

---

## Limitations and Notes

- The insights service is rule-based rather than powered by an external AI model.
- Voice commands depend on browser speech recognition support and may not work in every browser.
- Reminder settings are stored in data and exposed in UI, but notification delivery is not yet implemented.
- There is currently no automated test suite included in the repository.
- The manual startup script is Windows-oriented; Linux and macOS users should launch services manually.

---

## Troubleshooting

### Services Not Responding

If the frontend shows network errors:
- make sure `api-gateway` is running
- make sure downstream services have started successfully
- inspect each terminal for service crash logs

### MongoDB Connection Errors

If a service cannot connect to MongoDB:
- verify MongoDB is running
- verify your connection strings are correct
- verify Docker service names are used only in Docker mode

### Seed Script Issues

If the seed process fails:
- run `npm run seed` in `user-service` first
- then run `npm run seed` in `habit-service`

### Frontend API Issues

If the frontend cannot reach the backend:
- confirm `VITE_API_URL` is correct
- confirm the gateway is reachable at `http://localhost:5000/api`

### Render 502 Bad Gateway / Connection Refused
- If using Docker deployments on Render, ensure backend `Dockerfile`s **do not** have an `EXPOSE` line that conflicts with your `PORT` environment variable.
- For the frontend, ensure `VITE_API_URL` is added as an `ARG` in the `Dockerfile` so it is bundled into the React app at build time instead of crashing the internal Nginx proxy.

---

## Contributing

If you extend the project:

1. Create a feature branch
2. Keep service boundaries clear
3. Update the README if you add new user-facing functionality
4. Verify the Docker workflow still works
5. Keep deployment docs aligned with any infrastructure changes

---

<div align="center">

**Built with ❤️ by [VijayPant375](https://github.com/VijayPant375)**

⭐ Star this repo if you find it helpful!

</div>
