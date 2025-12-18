@echo off
echo 📱 Installing Capacitor for Android...

REM Core Capacitor
call npm install @capacitor/core @capacitor/cli

REM Android platform
call npm install @capacitor/android

REM Essential plugins
call npm install @capacitor/camera
call npm install @capacitor/filesystem
call npm install @capacitor/preferences
call npm install @capacitor/splash-screen
call npm install @capacitor/status-bar
call npm install @capacitor/keyboard
call npm install @capacitor/share
call npm install @capacitor/device
call npm install @capacitor/app
call npm install @capacitor/network

REM Notification plugins (already installed, but ensuring latest)
call npm install @capacitor/local-notifications
call npm install @capacitor/push-notifications

echo.
echo ✅ All Capacitor dependencies installed!
echo.
echo Next steps:
echo 1. Run: npx cap init "Medaurin" "com.medaurin.app" --web-dir=out
echo 2. Run: npx cap add android
echo 3. Run: npm run build:android
echo.
echo For detailed instructions, see: CAPACITOR_ANDROID_SETUP.md

pause
