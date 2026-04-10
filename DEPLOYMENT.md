# Smart Habit Tracker - Deployment Guide

This document outlines how to deploy the Microservices architecture to **Render.com**.

## Prerequisites
1. A GitHub repository with this project pushed.
2. A free [Render](https://render.com) account.
3. A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URL to host the production data.

## Step 1: Deploy MongoDB Atlas
1. Create a free M0 cluster on MongoDB Atlas.
2. Under "Database Access", create a database user and password.
3. Under "Network Access", allow IP access from anywhere (`0.0.0.0/0`).
4. Copy the connection string (e.g. `mongodb+srv://<user>:<password>@cluster0...`)

## Step 2: Deploy Backend Services
You will need to create **5 individual Web Services** on Render.

For **each** functional service (`user-service`, `habit-service`, `analytics-service`, `ai-service`), do the following:
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. **Root Directory**: `user-service` (or the respective folder names)
4. **Environment**: `Node`
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`
7. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas URL
   - `JWT_SECRET`: A very strong random string secure key

### Deploying the API Gateway
Once the 4 services above are live, copy their public Render URLs (they look like `https://service-name.onrender.com`).
Deploy the `api-gateway` exactly the same way, but set its Environment Variables to point to those live URLs:
- `USER_SERVICE_URL` = `https://your-live-user-service.onrender.com`
- `HABIT_SERVICE_URL` = `https://your-live-habit-service.onrender.com`
- `ANALYTICS_SERVICE_URL` = `https://your-live-analytics-service.onrender.com`
- `AI_SERVICE_URL` = `https://your-live-ai-service.onrender.com`

## Step 3: Deploy Frontend (Vite)
Before deploying, change the `API_URL` const in `frontend/src/api.js` from `localhost:5000` to your brand new Live API Gateway URL.

1. On Render, select **New +** -> **Static Site**.
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Publish Directory**: `frontend/dist`
5. If using React Router, ensure rewrites are configured under the Advanced tab (Catch-all `/*` rewriting to `/index.html`).

🚀 **Your fully functional microservices app is now live in production!**
