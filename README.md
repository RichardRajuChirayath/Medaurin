# 📱 Medaurin - Medicine Safety & Expense Tracker

**A production-ready Android app built with Next.js + Capacitor**

[![Android](https://img.shields.io/badge/Android-App-green)](./android)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Latest-blue)](https://capacitorjs.com/)

---

## 🎯 Quick Start

### For Testing (Development Mode):

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open Android app
npx cap open android

# 4. Click Play (▶️) in Android Studio
```

### For Play Store (Production Mode):

```bash
# 1. Deploy backend
deploy-production.bat

# 2. Update capacitor.config.json with your URL

# 3. Sync and build
npx cap sync android
npx cap open android

# 4. Build → Generate Signed APK
```

**📖 Detailed Guide:** [START_HERE.md](./START_HERE.md)

---

## ✨ Features

### Core Functionality
- 🔍 **Drug Interaction Checker** - FDA/NIH/RxNorm integration
- 📸 **OCR Medicine Scanner** - Tesseract.js (offline)
- 🎤 **Voice Input** - Whisper AI (offline)
- 💰 **Expense Tracker** - Bills, receipts, analytics
- 📊 **Visual Analytics** - Charts, graphs, insights

### Safety Features
- 🚫 **Double Dosing Prevention** - Tracks your medication logs
- 🛡️ **Health Profile Shield** - Allergy & condition checking (NIH data)
- 🌡️ **Weather Health Alerts** - UV, heat, cold warnings
- 👨‍⚕️ **Caregiver Dashboard** - Real-time patient monitoring

### Technical Features
- 📱 **Native Android App** - Capacitor-powered
- 🔔 **Push Notifications** - Firebase Cloud Messaging
- 💾 **Offline Support** - Service worker + caching
- 🔒 **Secure** - AES-256 encryption, session-based auth

---

## 🏗️ Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

**Backend:**
- Next.js API Routes
- PostgreSQL + Prisma
- FDA OpenFDA API
- NIH RxNorm + RxClass APIs

**Mobile:**
- Capacitor 6
- Android SDK 24+
- Native plugins (Camera, Storage, etc.)

**Deployment:**
- Vercel / Railway / Render
- Android Studio
- Google Play Store

---

## 📂 Project Structure

```
medaurin/
├── android/              # Native Android project
├── app/                  # Next.js app router
├── components/           # React components
├── lib/                  # Utilities & helpers
│   ├── capacitor-plugins.ts
│   └── drug-interaction-service.ts
├── prisma/              # Database schema
├── public/              # Static assets
│
├── capacitor.config.json    # Android config
├── next.config.mjs          # Next.js config
├── package.json             # Dependencies
│
└── [Documentation]
    ├── START_HERE.md             # 👈 START HERE!
    ├── ANDROID_QUICK_START.md
    ├── PRODUCTION_ANDROID_BUILD.md
    ├── ARCHITECTURE_GUIDE.md
    └── PROJECT_SUMMARY.md
```

---

## 🚀 Deployment

### 1. Deploy Backend

```bash
# Vercel (Recommended)
npm install -g vercel
vercel login
vercel --prod

# Railway (Includes Database)
npm install -g @railway/cli
railway login
railway up

# Render (Free Tier)
# Use their web dashboard
```

### 2. Update Android Config

Edit `capacitor.config.json`:
```json
{
  "server": {
    "url": "https://your-url.vercel.app"
  }
}
```

### 3. Build APK

```bash
npx cap sync android
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

**📖 Full Guide:** [PRODUCTION_ANDROID_BUILD.md](./PRODUCTION_ANDROID_BUILD.md)

---

## 📋 Environment Variables

Create `.env`:

```env
# Required
DATABASE_URL="postgresql://..."
SESSION_SECRET="min-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="another-secret"

# Optional (can enable anytime)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
BREVO_API_KEY="..."
OPENWEATHER_API_KEY="..."
```

**📖 Template:** [.env.example](./.env.example)

---

## 🧪 Testing

### Run Tests:
```bash
npm run lint
npm run build
```

### Test on Android:
```bash
npm run dev
npx cap open android
```

### Test on Real Device:
1. Enable USB debugging
2. Connect phone
3. Run from Android Studio

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [START_HERE.md](./START_HERE.md) | **👈 Start here!** Complete overview |
| [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md) | Run Android app in 5 minutes |
| [PRODUCTION_ANDROID_BUILD.md](./PRODUCTION_ANDROID_BUILD.md) | Build for Play Store |
| [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) | How everything works |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Complete feature list |
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | Deployment checklist |

---

## 🎯 Roadmap

- [x] Core drug interaction checker
- [x] Expense tracking
- [x] Caregiver dashboard
- [x] Health profile integration
- [x] Android app
- [ ] iOS app (coming soon)
- [ ] Multi-language support
- [ ] AI-powered insights

---

## 🔒 Security

- ✅ HTTPS only
- ✅ AES-256 encryption
- ✅ Session-based auth
- ✅ No API keys in frontend
- ✅ GDPR compliant
- ✅ User data isolation

---

## 💰 Cost

**Development:** FREE

**Production:**
- Hosting: $0-20/month (Vercel/Railway)
- Database: Included or $5/month
- APIs: FREE (FDA, NIH, Weather)

**Total: $0-20/month**

---

## 🆘 Support

1. Check documentation above
2. Review error logs in Android Studio
3. Search issues on GitHub
4. Check Capacitor docs
5. Google specific errors

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🎉 Acknowledgments

- **FDA OpenFDA** - Drug information
- **NIH RxNorm** - Drug normalization
- **NIH RxClass** - Contraindications
- **OpenWeatherMap** - Weather data
- **Firebase** - Cloud messaging

---

## ✅ Status

**Development:** ✅ Ready  
**Production:** ⏳ Deploy backend first  
**Play Store:** 📅 Ready when you are

---

**Built with ❤️ for safer medication management** 🏥💊

**Questions? Read [START_HERE.md](./START_HERE.md) first!** 📖