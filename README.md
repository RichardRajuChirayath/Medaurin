<p align="center">
  <img src="https://img.shields.io/badge/Medaurin-Medicine%20Safety-667eea?style=for-the-badge&logoColor=white" alt="Medaurin"/>
</p>

<h1 align="center">💊 Medaurin</h1>
<h3 align="center">India's Most Advanced Medicine Safety & Expense Tracking Platform</h3>

<p align="center">
  <strong>🛡️ Check Drug Interactions • 🇮🇳 Verify Govt. Approval • 💰 Track Expenses • 👨‍⚕️ Caregiver Monitoring</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Capacitor-8.0-119EFF?style=flat-square&logo=capacitor" alt="Capacitor"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/✅-Production%20Ready-00C851?style=flat-square" alt="Production Ready"/>
  <img src="https://img.shields.io/badge/📱-Android%20Ready-3DDC84?style=flat-square" alt="Android"/>
  <img src="https://img.shields.io/badge/🔒-AES%20256%20Encrypted-FF6B6B?style=flat-square" alt="Encrypted"/>
  <img src="https://img.shields.io/badge/💰-100%25%20Free-FFD700?style=flat-square" alt="Free"/>
</p>

---

## 🌟 Why Medaurin?

> **The ONLY app in India** that combines drug interaction checking, government medicine verification, expense tracking, and caregiver monitoring — all in one beautiful, privacy-focused platform.

| Feature | Medaurin | Other Apps |
|---------|:--------:|:----------:|
| 🔍 Drug Interaction Checker | ✅ | ⚠️ Limited |
| 🇮🇳 CDSCO/NPPA Verification | ✅ | ❌ |
| 💰 Medicine Expense Tracker | ✅ | ❌ |
| 📸 OCR Medicine Scanning | ✅ | ⚠️ |
| 🎤 Offline Voice Input | ✅ | ❌ |
| 👨‍⚕️ Caregiver Dashboard | ✅ | ❌ |
| 🌡️ Weather Health Alerts | ✅ | ❌ |
| 🔒 100% Privacy Focused | ✅ | ⚠️ |

---

## ✨ Features at a Glance

### 🔬 Drug Interaction Checker
- **Multi-database validation** — FDA + NIH + RxNorm integration
- **6-Factor Risk Scoring** — Comprehensive safety assessment (0-100 scale)
- **Photo OCR** — Scan medicine labels with Tesseract.js (offline)
- **Voice Input** — Whisper AI powered speech recognition (offline)
- **Text-to-Speech** — Listen to results for accessibility
- **PDF Reports** — Generate shareable safety reports

### 🇮🇳 India Government Verification
> **FIRST & ONLY app** with real-time CDSCO & NPPA verification!

- **CDSCO Approval Check** — Detect banned medicines instantly
- **NPPA Price Validation** — Identify overpriced medicines (>20% ceiling)
- **Offline Verification** — Works without internet using local datasets
- **Real-time Alerts** — Get FCM notifications for banned/overpriced drugs

### 💰 Medicine Expense Tracker
- **OCR Bill Scanning** — Auto-extract details from pharmacy receipts
- **Email Invoice Import** — IMAP integration (Gmail/Outlook/Yahoo)
- **Pharmacy Finder** — OpenStreetMap powered with price insights
- **Budget Alerts** — Notifications at 80%/100% budget threshold
- **Analytics Dashboard** — Charts, insights & spending trends
- **Export Data** — Excel, CSV, and PDF formats

### 🛡️ Advanced Safety Features
- **Double Dosing Prevention** — Tracks medication logs to prevent overdose
- **Health Profile Shield** — Allergy & condition checking via NIH/RxClass API
- **Weather Health Alerts** — UV, heat & cold warnings based on medications
- **Smart Reminders** — Alarm mode with persistent notification sounds

### 👨‍⚕️ Caregiver Guardian Mode
- **Real-time Dashboard** — Monitor patients remotely
- **Live Status Tracking** — See medication adherence
- **Send Alerts/Nudges** — Remind family members to take medicines
- **Patient Invitation System** — Easy connection flow

### 🤖 AI-Powered Chatbot
- **40+ Pre-trained Q&A** — Across 8 categories
- **Smart Search** — Find answers instantly
- **Text-to-Speech** — Listen to responses
- **Context-Aware** — Understands follow-up questions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Android Studio (for mobile app)

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/RichardRajuChirayath/Medaurin.git
cd Medaurin

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# 4. Set up database
npx prisma migrate dev

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Android App

```bash
# 1. Build web assets
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Click Play (▶️) to run on emulator/device
```

📖 **Detailed Guide:** [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md)

---

## 🏗️ Architecture

```
medaurin/
├── 📱 android/               # Native Android project (Capacitor)
├── 🎨 app/                   # Next.js App Router
│   ├── api/                  # API routes
│   ├── auth/                 # Authentication pages
│   ├── caregiver/            # Caregiver dashboard
│   ├── expenses/             # Expense tracker
│   └── profile/              # User profile & health data
├── 🧩 components/            # React components (86 files)
│   ├── ui/                   # Shadcn UI components
│   ├── chatbot.tsx           # AI assistant
│   ├── caregiver-dashboard.tsx
│   ├── expense-tracker-card.tsx
│   └── ...
├── 📚 lib/                   # Utilities & services
│   ├── drug-interaction-service.ts
│   ├── india-medicine-verification.ts
│   ├── medicine-validator.ts
│   └── ...
├── 🗄️ prisma/               # Database schema
├── 📁 data/                  # Offline datasets (CDSCO, NPPA)
└── 📜 public/                # Static assets
```

---

## 🔧 Tech Stack

<table>
<tr>
<td>

**Frontend**
- Next.js 15 (App Router)
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Shadcn UI
- Recharts

</td>
<td>

**Backend**
- Next.js API Routes
- PostgreSQL + Prisma ORM
- Firebase Admin SDK
- AES-256 Encryption
- Session-based Auth

</td>
<td>

**AI/ML**
- Tesseract.js (OCR)
- Whisper AI (Speech)
- OpenFDA API
- NIH RxNorm/RxClass
- Text-to-Speech

</td>
</tr>
<tr>
<td>

**Mobile**
- Capacitor 8
- Android SDK 24+
- Native Camera
- Push Notifications
- Offline Support

</td>
<td>

**Maps & Location**
- OpenStreetMap
- Overpass API
- Google Maps Nav
- Geolocation

</td>
<td>

**Notifications**
- Firebase Cloud Messaging
- Service Workers
- Local Notifications
- Background Alerts

</td>
</tr>
</table>

---

## 📋 Environment Variables

Create a `.env` file in the root directory:

```env
# Required
DATABASE_URL="postgresql://user:pass@host:5432/medaurin"
SESSION_SECRET="your-32-character-minimum-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="another-secure-secret-key"

# Optional - Enable additional features
VAPID_PUBLIC_KEY="..."          # Push notifications
VAPID_PRIVATE_KEY="..."         # Push notifications
BREVO_API_KEY="..."             # Email magic links
OPENWEATHER_API_KEY="..."       # Weather health alerts
```

📖 **Full Template:** [.env.example](./.env.example)

---

## 🌐 Deployment

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: Railway
```bash
npm install -g @railway/cli
railway login
railway up
```

### Option 3: Self-Hosted
```bash
npm run build
npm start
```

### Android APK
```bash
npx cap sync android
cd android && ./gradlew assembleRelease
```
APK: `android/app/build/outputs/apk/release/app-release.apk`

📖 **Full Guide:** [PRODUCTION_ANDROID_BUILD.md](./PRODUCTION_ANDROID_BUILD.md)

---

## 🔒 Security & Privacy

| Security Feature | Status |
|-----------------|:------:|
| HTTPS Enforced | ✅ |
| AES-256 Encryption | ✅ |
| Session-based Authentication | ✅ |
| User Data Isolation | ✅ |
| No API Keys in Frontend | ✅ |
| GDPR Compliant | ✅ |
| Local OCR Processing | ✅ |
| Offline Voice Recognition | ✅ |

**No health data is ever sent to third-party servers** — All sensitive processing happens locally in your browser.

---

## 💰 Cost

| Component | Cost |
|-----------|:----:|
| Development | **FREE** |
| FDA/NIH/RxNorm APIs | **FREE** |
| OpenWeatherMap API | **FREE** |
| OpenStreetMap | **FREE** |
| Vercel Hosting | $0-20/mo |
| Database | Included or ~$5/mo |
| **Total** | **$0-25/month** |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [START_HERE.md](./START_HERE.md) | 👈 **Start here!** Complete overview |
| [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md) | Run Android app in 5 minutes |
| [PRODUCTION_ANDROID_BUILD.md](./PRODUCTION_ANDROID_BUILD.md) | Build for Play Store |
| [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) | How everything works |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Complete feature list |
| [INDIA_VERIFICATION_FEATURE.md](./INDIA_VERIFICATION_FEATURE.md) | CDSCO/NPPA verification |
| [EXPENSE_TRACKER_README.md](./EXPENSE_TRACKER_README.md) | Expense tracker guide |

---

## 🎯 Roadmap

### ✅ Completed
- [x] Core drug interaction checker with 6-factor risk scoring
- [x] India government verification (CDSCO/NPPA)
- [x] Medicine expense tracking with OCR
- [x] Caregiver guardian dashboard
- [x] Health profile integration
- [x] Android app with Capacitor
- [x] Push notifications (FCM)
- [x] Weather health alerts
- [x] AI chatbot assistant

### 🔜 Coming Soon
- [ ] iOS app support
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Generic medicine alternatives
- [ ] Prescription OCR scanning
- [ ] Telemedicine integration
- [ ] Health insurance claim integration

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FDA OpenFDA** — Drug information & label data
- **NIH RxNorm** — Drug name normalization
- **NIH RxClass** — Drug classifications & contraindications
- **NIH Drug Interaction API** — Interaction checking
- **OpenWeatherMap** — Weather data for health alerts
- **OpenStreetMap** — Pharmacy location data
- **Firebase** — Cloud messaging & notifications

---

<p align="center">
  <strong>Built with ❤️ for safer medication management 🏥💊</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made%20in-🇮🇳%20India-FF9933?style=for-the-badge" alt="Made in India"/>
</p>

<p align="center">
  <strong>100% Free • 100% Private • 100% Awesome</strong>
</p>

---

<p align="center">
  <sub>Questions? Check <a href="./START_HERE.md">START_HERE.md</a> first! 📖</sub>
</p>