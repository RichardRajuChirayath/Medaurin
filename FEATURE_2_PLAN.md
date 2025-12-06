# Feature 2: Medication Reminders & Dosage Tracker

## 🎯 What We're Building:

### 1. Medications Page (`/medications`)
- List all user's medications
- Add new medication with:
  - Medicine name
  - Dosage (e.g., "500mg", "2 tablets")
  - Frequency (e.g., "twice daily", "three times daily")
  - Reminder times (select specific times like 09:00, 21:00)
  - Start date
  - Optional end date
  - Notes
- Edit/delete medications
- Toggle reminders on/off

### 2. Dosage Tracking
- "Mark as Taken" button for each medication
- Log doses with timestamp
- View today's schedule
- See compliance statistics

### 3. Browser Notifications
- Request notification permission
- Send reminder at scheduled times
- Click notification to mark as taken

### 4. Dosage Calendar/History
- View past logs
- See missed doses
- Weekly/monthly stats

## 📁 Files to Create:
1. `/app/api/medications/route.ts` - CRUD for medications
2. `/app/api/dosage-logs/route.ts` - Log doses
3. `/app/medications/page.tsx` - Main medications page
4. `/components/medication-card.tsx` - Display medication
5. `/components/add-medication-modal.tsx` - Add/edit form
6. `/hooks/use-notifications.ts` - Browser notifications

Let's build!
