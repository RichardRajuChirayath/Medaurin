# 🚀 Production Deployment Guide

## CRITICAL: You Need a Backend Server

Your app has:
- Database (PostgreSQL)
- Authentication
- API routes (`/api/*`)
- Medicine interaction checker
- FCM notifications

**These CANNOT work offline - they need a server.**

---

## Step 1: Deploy Backend (Choose One)

### Option A: Vercel (Recommended - Easiest)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel Dashboard
# Go to: vercel.com/dashboard → Your Project → Settings → Environment Variables
# Add all variables from .env

# 5. Deploy to production
vercel --prod

# You'll get: https://medaurin.vercel.app (or similar)
```

### Option B: Railway (Includes Database)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add PostgreSQL
railway add

# 5. Deploy
railway up

# 6. Get your URL
railway domain

# You'll get: https://medaurin.up.railway.app (or similar)
```

### Option C: Render (Free Tier)

1. Go to render.com
2. New → Web Service
3. Connect your GitHub repo
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variables
7. Deploy

---

## Step 2: Note Your Production URL

After deployment, you'll have a URL like:
- `https://medaurin.vercel.app`
- `https://medaurin.up.railway.app`
- `https://medaurin.onrender.com`

**SAVE THIS URL!** You'll need it for the next steps.

---

## Step 3: Update Environment Variables

Create `.env.production`:

```env
# Your production database
DATABASE_URL="your-production-database-url"

# Session secret
SESSION_SECRET="production-secret-min-32-chars"

# Auth URLs (use your production domain)
NEXTAUTH_URL="https://medaurin.vercel.app"
NEXTAUTH_SECRET="another-secret-32-chars"

# Optional: Firebase, Brevo, Weather (same as development)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

---

## Important Notes

1. **Database Migration**: Run on production
   ```bash
   # Connect to production database
   DATABASE_URL="production-url" npx prisma migrate deploy
   ```

2. **Test Your APIs**: Verify all endpoints work
   ```bash
   curl https://medaurin.vercel.app/api/health
   ```

3. **CORS**: Next.js handles this automatically

---

## ✅ Once Backend is Deployed

Proceed to ANDROID_PRODUCTION_BUILD.md for the Android app setup.

**DO NOT build the Android app until your backend is live!**
