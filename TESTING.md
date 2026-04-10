# Smart Habit Tracker - Testing Guide

## Manual Testing & Health Checks

Since this project consists of 5 microservices plus a frontend, the fastest way to ensure everything is running correctly is via the built-in health checks and manual API endpoints.

### 1. Verify All Services are Online

You can quickly check if all services are responsive by curling their respective gateway routes:

```bash
# 1. API Gateway Identity
curl http://localhost:5000/health

# 2. User Service
curl -X POST http://localhost:5000/api/users/login -H "Content-Type: application/json" -d "{}"

# 3. Habit Service (Requires Auth, but will return 401 instead of 503 if online)
curl http://localhost:5000/api/habits

# 4. Analytics Service
curl http://localhost:5000/api/analytics/stats

# 5. AI Service
curl http://localhost:5000/api/ai/insights
```

If you receive `503 Service Offline` strings back from the Gateway, that specific microservice container/terminal has crashed and needs to be restarted.

### 2. End-to-End User Flow (Manual)

To verify the core loop is fully functional:
1. Load `http://localhost:5173`
2. Register a new test account (e.g. `tester@mail.com`).
3. Log in.
4. Click **+ Add Habit** and create a "Drink Water" habit.
5. Click the **Complete** button on the habit card. 
6. Refresh the page to ensure the Analytics Service picked up the completion (the Weekly Chart should update immediately).
7. Confirm the AI Insights refresh to encourage the user.
