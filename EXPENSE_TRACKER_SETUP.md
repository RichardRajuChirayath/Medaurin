# 🚀 Medicine Expense Tracker - Quick Setup Guide

## ✅ Step 1: Database Migration

Run this command to update your database schema:

```bash
npx prisma db push
npx prisma generate
```

This will add:
- `MedicineExpense` table
- `EmailConfig` table  
- `medicineBudget` field to `User` table

---

## ✅ Step 2: Environment Variables

Add this line to your `.env.local` file:

```env
EMAIL_ENCRYPTION_KEY="mixsafe-secure-32char-key-2024"
```

**⚠️ IMPORTANT**: Change this to your own random 32-character string in production!

---

## ✅ Step 3: Restart Dev Server

```bash
npm run dev
```

---

## ✅ Step 4: Test the Features

### 4a. Manual Entry
1. **Login** to your account
2. Navigate to `/expenses`
3. Click **"Add"** button
4. Fill in medicine details
5. Save!

### 4b. OCR Bill Scanning
1. Go to `/expenses`
2. Click **"Import"** tab
3. Click **"Scan Bill (OCR)"**
4. Upload a photo of your medicine bill
5. Wait for extraction (10-30 seconds)
6. Verify extracted data
7. Click **"Save Expense"**

### 4c. Analytics
1. Go to `/expenses`
2. Click **"Analytics"** tab
3. View charts and insights
4. Change month using the selector

### 4d. Export
1. Go to `/expenses` → **"Overview"** tab
2. Scroll to **"Export Data"** section
3. Click **CSV**, **Excel**, or **PDF**
4. Check your Downloads folder

### 4e. Budget Alerts
1. Go to `/profile` (or create a budget API route)
2. Set your monthly medicine budget (e.g., ₹5000)
3. Add expenses
4. When you reach 80% or 100%, you'll get a **push notification via FCM**

---

## 🎨 Add to Main Dashboard (Optional)

### Option 1: Import the Card Component
```tsx
import { ExpenseTrackerCard } from "@/components/expense-tracker-card"

// In your dashboard page:
<ExpenseTrackerCard />
```

### Option 2: Simple Link
```tsx
import Link from "next/link"
import { Receipt } from "lucide-react"

<Link href="/expenses">
  <button className="...">
    <Receipt className="w-5 h-5" />
    Medicine Expenses
  </button>
</Link>
```

---

## 📊 Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Manual Entry | ✅ Complete | `/expenses` |
| OCR Bill Scan | ✅ Complete | `/expenses` → Import |
| Monthly Insights | ✅ Complete | `/expenses` → Analytics |
| Charts (Pie, Bar) | ✅ Complete | `/expenses` → Analytics |
| Export (CSV/Excel/PDF) | ✅ Complete | `/expenses` → Overview |
| Budget Alerts (FCM) | ✅ Complete | Auto-triggered |
| Pharmacy Map (OSM) | ⚙️ API Ready | Frontend TBD |
| Email Import (IMAP) | ⚙️ API Ready | Frontend TBD |

---

## 🔒 Security Checklist

✅ All APIs require authentication (`getSession()`)  
✅ User-scoped queries (can't access other users' data)  
✅ Email passwords encrypted with AES-256  
✅ Rate limiting on pharmacy search  
✅ File size limits on OCR uploads  
✅ Proper indexes for fast queries  

---

## 🐛 Troubleshooting

### "Module not found: recharts"
Run: `npm install recharts`

### "Module not found: xlsx"
Run: `npm install xlsx`

### "Module not found: jspdf"
Run: `npm install jspdf jspdf-autotable`

### "Module not found: tesseract.js"
Run: `npm install tesseract.js`

### OCR is slow
- Tesseract.js runs in the browser and takes 10-30 seconds
- This is normal for client-side OCR
- Consider showing a progress bar (already implemented!)

### Charts not rendering
- Check browser console for errors
- Ensure `recharts` is installed
- May need to wrap charts in `<ClientSideOnly>` component

---

## 📞 Need Help?

Check the full documentation: `EXPENSE_TRACKER_README.md`

---

**Happy Tracking! 💊📊**
