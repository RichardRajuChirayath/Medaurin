#!/bin/bash

# Capacitor Android Setup Script
# This script installs all necessary Capacitor dependencies

echo "📱 Installing Capacitor for Android..."

# Core Capacitor
npm install @capacitor/core @capacitor/cli

# Android platform
npm install @capacitor/android

# Essential plugins
npm install @capacitor/camera
npm install @capacitor/filesystem
npm install @capacitor/preferences
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
npm install @capacitor/keyboard
npm install @capacitor/share
npm install @capacitor/device
npm install @capacitor/app
npm install @capacitor/network

# Notification plugins (already installed, but ensuring latest)
npm install @capacitor/local-notifications
npm install @capacitor/push-notifications

echo "✅ All Capacitor dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Run: npx cap init 'Medaurin' 'com.medaurin.app' --web-dir=out"
echo "2. Run: npx cap add android"
echo "3. Run: npm run build:android"
echo ""
echo "For detailed instructions, see: CAPACITOR_ANDROID_SETUP.md"
