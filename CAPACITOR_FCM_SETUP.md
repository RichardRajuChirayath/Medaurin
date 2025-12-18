# Capacitor FCM Push Notification Setup

This guide covers how to set up Firebase Cloud Messaging (FCM) for Android and iOS using Capacitor.

## Prerequisites

1.  **Environment Variables**:
    Ensure `.env` contains:
    ```
    NEXT_PUBLIC_FIREBASE_VAPID_KEY="BKu_WbwUp9dNeUVywa50gOvbBLIsdWqY6EyRQt_wyNtcqy-Q917KLnZfknSYLenOX9X8sPoTCGtVp0Jnss2wwwg"
    ```
    *(Or your own key pair if you regenerated them)*.

2.  **Dependencies**:
    Running correctly in `package.json`:
    - `@capacitor/core`
    - `@capacitor/push-notifications` (Must be installed: `npm install @capacitor/push-notifications`)

---

## 1. Android Setup

### A. Add `google-services.json`
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Open **Project Settings** > **General**.
3.  Add an **Android App** if not already (use package name e.g., `com.mixsafe.app`).
4.  Download `google-services.json`.
5.  Place it in: `android/app/google-services.json`.

### B. Update Gradle Files

**`android/build.gradle`** (Project level):
```groovy
dependencies {
    // ...
    classpath 'com.google.gms:google-services:4.4.0' // Add this
}
```

**`android/app/build.gradle`** (App level):
```groovy
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // Add this at bottom

// ...
```

### C. Initialize Capacitor Plugin
Run:
```bash
npx cap update android
npx cap sync
```

---

## 2. iOS Setup

### A. Add `GoogleService-Info.plist`
1.  Go to Firebase Console > Project Settings.
2.  Add **iOS App** (use bundle ID e.g., `com.mixsafe.app`).
3.  Download `GoogleService-Info.plist`.
4.  Open Xcode (`npx cap open ios`).
5.  Drag & Drop `GoogleService-Info.plist` into the **App** folder in Xcode (ensure "Copy items if needed" is checked).

### B. Enable Capabilities
In Xcode:
1.  Select your App Target.
2.  Go to **Signing & Capabilities**.
3.  Click **+ Capability**.
4.  Add **Push Notifications**.
5.  Add **Background Modes** -> Check **Remote notifications**.

### C. Add Pods (Auto-handled by Capacitor usually)
If needed manually:
`ios/App/Podfile`:
```ruby
pod 'Firebase/Messaging'
```
Then `npx cap update ios`.

---

## 3. Testing Logic

The application uses a unified `useFcmToken` hook.

-   **Web/Localhost**: Uses `firebase-messaging-sw.js` service worker.
-   **Mobile**: Uses `@capacitor/push-notifications` native plugin.

### How to Test
1.  Login to the app.
2.  Go to the page where you added `<NotificationTester />` (or Profile > Notifications).
3.  Click "Enable Notifications".
4.  Wait for the **Device Token** to appear.
5.  Click **Send Test Push**.

If successful:
-   **Web**: You'll see a browser notification and toast.
-   **Mobile**: You'll receive a system tray notification.

---

## 4. Troubleshooting Localhost Web Push
-   Ensure `public/firebase-messaging-sw.js` exists.
-   Ensure `firebaseConfig` in `firebase-messaging-sw.js` matches `lib/firebase.ts`.
-   If you get "notifications blocked", check browser site settings.
-   If you get nothing, check Console > Application > Service Workers. Unregister potentially stale workers.
