# 📱 Capacitor Android App Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Android WebView (Capacitor)         │
│  ┌───────────────────────────────────────┐  │
│  │   Next.js Frontend (Static Export)   │  │
│  │  - Service Worker (Offline Cache)    │  │
│  │  - IndexedDB (Local Storage)         │  │
│  │  - Tesseract.js (Offline OCR)        │  │
│  └───────────────────────────────────────┘  │
│              ↕ Native Bridge                │
│  ┌───────────────────────────────────────┐  │
│  │     Capacitor Native Plugins          │  │
│  │  - Camera                             │  │
│  │  - Storage                            │  │
│  │  - Push Notifications                 │  │
│  │  - Local Notifications                │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
              ↕ HTTPS API Calls
┌─────────────────────────────────────────────┐
│       Backend API (Vercel/Railway)          │
│  - PostgreSQL Database                      │
│  - NIH/FDA APIs                             │
│  - Session Management                       │
└─────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Android Studio** - [Download](https://developer.android.com/studio)
3. **Java JDK 17** - [Download](https://adoptium.net/)
4. **Capacitor CLI** - Will install below

---

## 🚀 Step 1: Install Capacitor Dependencies

```bash
# Install Capacitor core
npm install @capacitor/core @capacitor/cli

# Install Android platform
npm install @capacitor/android

# Install essential plugins
npm install @capacitor/camera @capacitor/filesystem @capacitor/preferences
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
npm install @capacitor/share @capacitor/device @capacitor/app @capacitor/network

# Install notification plugins (already installed)
# @capacitor/local-notifications
# @capacitor/push-notifications
```

---

## 🏗️ Step 2: Configure Next.js for Static Export

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "build:static": "next build && next export",
    "build:android": "npm run build:static && npx cap sync android && npx cap open android",
    "start": "next start"
  }
}
```

Update `next.config.mjs` to enable static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static HTML export
  images: {
    unoptimized: true, // Required for static export
  },
  // ... rest of your config
}
```

---

## 📦 Step 3: Initialize Capacitor

```bash
# Initialize Capacitor
npx cap init "Medaurin" "com.medaurin.app" --web-dir=out

# Add Android platform
npx cap add android
```

---

## 🔧 Step 4: Configure Android Project

### 4.1 Update `android/app/build.gradle`

```gradle
android {
    namespace "com.medaurin.app"
    compileSdk 34
    
    defaultConfig {
        applicationId "com.medaurin.app"
        minSdk 24  // Android 7.0+
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4.2 Add Permissions in `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera features -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

</manifest>
```

---

## 🎨 Step 5: Add App Icons & Splash Screen

### Generate Icons

Use [icon.kitchen](https://icon.kitchen/) or [Capacitor Asset Generator](https://github.com/capacitor-community/capacitor-assets):

```bash
npm install -g @capacitor/assets

# Place your 1024x1024 icon as: resources/icon.png
# Place your 2732x2732 splash as: resources/splash.png

npx capacitor-assets generate
```

### Manual Icon Placement

Place icons in `android/app/src/main/res/`:
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

---

## 🔌 Step 6: Integrate Native Plugins

Create `lib/capacitor-plugins.ts`:

```typescript
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

// Check if running in native app
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android', 'ios', or 'web'

// Camera helper
export async function takePicture() {
  if (!isNative) {
    // Fallback to web file input
    return null;
  }
  
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: 'base64',
    source: 'camera',
  });
  
  return `data:image/jpeg;base64,${image.base64String}`;
}

// Pick from gallery
export async function pickImage() {
  if (!isNative) {
    return null;
  }
  
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: 'base64',
    source: 'photos',
  });
  
  return `data:image/jpeg;base64,${image.base64String}`;
}

// Save data locally
export async function saveLocal(key: string, value: string) {
  if (isNative) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

// Get local data
export async function getLocal(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
}

// Share content
export async function shareContent(title: string, text: string, url?: string) {
  if (isNative) {
    await Share.share({ title, text, url });
  } else {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!isNative) return false;
  
  const permission = await LocalNotifications.requestPermissions();
  return permission.display === 'granted';
}

// Schedule local notification
export async function scheduleNotification(title: string, body: string, time: Date) {
  if (!isNative) return;
  
  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id: Date.now(),
        schedule: { at: time },
        sound: 'default',
        attachments: undefined,
        actionTypeId: '',
        extra: {},
      },
    ],
  });
}

// Get device info
export async function getDeviceInfo() {
  if (!isNative) {
    return {
      platform: 'web',
      model: 'Unknown',
      manufacturer: 'Unknown',
      osVersion: 'Unknown',
    };
  }
  
  const info = await Device.getInfo();
  return {
    platform: info.platform,
    model: info.model,
    manufacturer: info.manufacturer,
    osVersion: info.osVersion,
  };
}

// Check network status
export async function getNetworkStatus() {
  if (isNative) {
    const status = await Network.getStatus();
    return status.connected;
  } else {
    return navigator.onLine;
  }
}
```

---

## 🌐 Step 7: Service Worker for Offline Support

Create `public/sw.js`:

```javascript
const CACHE_NAME = 'medaurin-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, cache fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
  );
});
```

Create `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Medaurin</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div>
    <h1>📱 You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="location.reload()" style="
      background: white;
      color: #6366f1;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
    ">Retry</button>
  </div>
</body>
</html>
```

---

## 🏗️ Step 8: Build & Sync

```bash
# 1. Build Next.js as static export
npm run build
npx next export  # This creates the 'out' folder

# 2. Sync with Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

---

## 🧪 Step 9: Testing

### Run on Emulator

1. Open Android Studio
2. Create/start an AVD (Android Virtual Device)
3. Click "Run" or press Shift+F10

### Run on Physical Device

1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect via USB
4. Click "Run" in Android Studio

### Live Reload Durante Development

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Run Android with live reload
npx cap run android --livereload --external
```

---

## 📦 Step 10: Build Release APK

### Generate Signing Key

```bash
# In android/app directory
keytool -genkey -v -keystore release-key.keystore -alias medaurin -keyalg RSA -keysize 2048 -validity 10000

# Enter password and organization details
```

### Configure Gradle for Signing

Update `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'medaurin'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Build Release APK

```bash
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 Step 11: Publish to Google Play Store

1. **Create Developer Account**: [$25 one-time fee](https://play.google.com/console)

2. **Prepare Store Listing**:
   - App name: Medaurin
   - Short description: (80 chars max)
   - Full description: (4000 chars max)
   - Screenshots: At least 2 (phone), recommended 8
   - Feature graphic: 1024x500
   - Icon: 512x512 (high-res)

3. **Content Rating**: Complete questionnaire

4. **Pricing**: Set as Free

5. **Upload APK/AAB**:
   ```bash
   # Build App Bundle (recommended for Play Store)
   cd android
   ./gradlew bundleRelease
   
   # Output: android/app/build/outputs/bundle/release/app-release.aab
   ```

6. **Review & Publish**: Submit for review

---

## 🎯 Performance Optimizations

### 1. Enable Proguard (Code Minification)

`android/app/proguard-rules.pro`:

```proguard
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
```

### 2. Optimize Images

Use WebP format for all images in `public/`:

```bash
# Convert PNG/JPG to WebP
npm install -g sharp-cli
sharp input.png -o output.webp
```

### 3. Enable Code Splitting

Next.js does this automatically, but ensure dynamic imports:

```typescript
// Instead of:
import HeavyComponent from './HeavyComponent'

// Use:
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
})
```

### 4. Preload Critical Resources

In `app/layout.tsx`:

```tsx
<head>
  <link rel="preconnect" href="https://your-api.com" />
  <link rel="dns-prefetch" href="https://rxnav.nlm.nih.gov" />
</head>
```

---

## 🔍 Debugging

### Android Logcat

```bash
# View logs
adb logcat | grep Capacitor

# Clear logs
adb logcat -c
```

### Chrome DevTools

1. Open Chrome
2. Navigate to `chrome://inspect`
3. Click "Inspect" on your app

---

## 📋 Final Checklist

Before publishing:

- [ ] Test on Android 7.0+ devices
- [ ] Test on different screen sizes
- [ ] Test offline functionality
- [ ] Test camera/file upload
- [ ] Test notifications
- [ ] Verify all API endpoints work with HTTPS
- [ ] Remove all console.logs
- [ ] Update version code/name
- [ ] Test install/uninstall flow
- [ ] Check app size (< 50MB ideal)
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] Create demo video for Play Store

---

## 🆘 Common Issues

### "Cannot find module 'capacitor'"
```bash
npm install @capacitor/core @capacitor/cli
```

### "Build failed: SDK not found"
- Install Android SDK via Android Studio
- Set ANDROID_HOME environment variable

### "WebView shows blank screen"
- Check `webDir: "out"` in `capacitor.config.json`
- Ensure `npm run build && next export` was run
- Check console logs in Chrome DevTools

### "App crashes on launch"
- Check AndroidManifest.xml permissions
- Verify MainActivity exists
- Check Logcat for errors

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)

---

**✅ You're Ready!** Your Medaurin app is now a production-grade Android application! 🎉
