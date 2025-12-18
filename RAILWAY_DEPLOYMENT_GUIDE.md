# 🚂 Railway Deployment Guide - Medaurin

This guide explains how to deploy Medaurin on Railway as a single, high-performance Node.js service (standalone mode).

## 📋 Prerequisites
1. A Railway account (linked to GitHub).
2. All code pushed to your GitHub repository.

---

## 🚀 Deployment Steps

### 1. Create a New Project on Railway
- Go to [Railway Dashboard](https://railway.app/).
- Click **"New Project"** -> **"Deploy from GitHub repo"**.
- Select your Medaurin repository.

### 2. Add PostgreSQL Database
- In your Railway project dashboard, click **"Add Service"** -> **"Database"** -> **"Add PostgreSQL"**.
- Railway will automatically provision a database and create a `${{PostgreSQL.DATABASE_URL}}` variable.

### 3. Connect Database to App
- Click on your **App Service** (the one from GitHub).
- Go to the **"Variables"** tab.
- Click **"New Variable"** -> **"Reference"** -> Select `DATABASE_URL` from the PostgreSQL service.
- Railway will handle the connection string automatically.

### 4. Configure Environment Variables
Add the following mandatory variables in the **"Variables"** tab of your App Service:

| Variable | Importance | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **MANDATORY** | Connection string (Reference from PG service). |
| `SESSION_SECRET` | **MANDATORY** | A long random string for auth security. |
| `NEXTAUTH_SECRET` | **MANDATORY** | Another random string for NextAuth. |
| `NEXT_PUBLIC_APP_URL` | **RECOMMENDED** | Your Railway app URL (e.g., `https://xxx.up.railway.app`). |
| `PORT` | Optional | Default is 3000, Railway provides this automatically. |

### 5. Deployment Process
- Railway will detect the `railway.json` file I created.
- **Build Phase**: It will run `npm run railway:build` (generates Prisma client and builds Next.js standalone).
- **Deploy Phase**: It will run `npm run prisma:migrate && npm start`.
  - This ensures your database schema is updated *before* the server starts.

---

## 🛠️ Optimization Details
- **Next.js 15**: The app was downgraded to Next.js 15.1.0 to ensure a stable production build on Railway.
- **Standalone Mode**: The app runs using Next.js standalone output, which is optimized for Node.js environments.
- **Stateless**: The server doesn't store files locally (it uses the Postgres database), making it safe for horizontal scaling.
- **Always-on**: This ignores serverless cold starts, providing a snappy experience for your users.

---

## ✅ Verification Checklist
- [ ] Check **Logs** tab: Look for "Prisma Migrate Deploy successful" and "Server started on port XXXX".
- [ ] Visit your URL: Ensure the home page loads.
- [ ] Try Login: Ensure the database connection and session management work.
- [ ] OCR Scan: Verify that heavy backend processing (Tesseract.js) works in the Node environment.

---

## 💡 Pro Tips for Hobby Plan
- If you upgrade to the **Hobby Plan**, you can increase memory limits if the OCR processing (which is CPU/RAM intensive) feels slow.
- You can add **Custom Domains** in the "Settings" tab of your app service.
