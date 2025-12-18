# 🔔 Setup Backend Notifications (Firebase Admin)

To enable the backend to send push notifications securely, you must provided a Firebase Service Account Key.

## 1. Generate Private Key
1. Go to **[Firebase Console](https://console.firebase.google.com/)**.
2. Select your project: **MixSafe** / Expensetracker (whichever you linked).
3. Click ⚙️ **Project Settings** > **Service accounts**.
4. Click **Generate new private key**.
5. Save the JSON file to your computer.

## 2. Set Environment Variable
You cannot just paste the file path. You have to pass the JSON **content**.

### **Option A: For Local Development (.env)**

1. Open your downloaded JSON file.
2. Copy the entire content: `{"type": "service_account", ...}`
3. Open your `.env` file in this project.
4. Add a new line:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```
   *Make sure it is all on **ONE LINE** and wrapped in single quotes.*

### **Option B: For Vercel / Production**

1. Go to your Vercel project settings > Environment Variables.
2. Key: `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Value: Paste the entire JSON content.

---

## 3. How to Automate Notifications (Cron Job)

Since this app is serverless (likely hosted on Vercel), the server isn't "always on" to check the time. We trigger it externally.

### **Using Vercel Cron (Easiest)**
1. Create a `vercel.json` in your root folder:
   ```json
   {
     "crons": [
       {
         "path": "/api/notifications/trigger",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```
   *(This runs the check every 15 minutes)*.

2. **For Development / Manual Testing:**
   - Just visit: `http://localhost:3000/api/notifications/trigger`
   - It will check current time matches against your scheduled medications.

### **Securing the Endpoint (Optional)**
If you want to prevent anyone from triggering the notifications by visiting the URL, set a `CRON_SECRET` environment variable in your `.env` and Vercel settings.
The API route checks for `?key=YOUR_SECRET` if this variable is set.

### **Important Note on Time:**
The current implementation checks the **Server Time** (UTC usually).
- If you set a reminder for "09:00", it sends when the server thinks it is 09:00.
- In production, ensure you align your reminders or update the code to handle Timezones if users are global.
