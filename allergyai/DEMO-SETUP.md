# 📱 Live Demo Setup Guide

## Option 1: Expo Go (Fastest - 2 minutes)

### Steps:
1. **Install Expo Go** on your phone:
   - iOS: App Store → Search "Expo Go"
   - Android: Google Play → Search "Expo Go"

2. **Start the development server:**
   ```bash
   cd /Users/krishnareddy/allergiai-app/AlergiAi-3/allergyai
   npx expo start
   ```

3. **Connect your phone:**
   - **iOS**: Open Camera app → Scan QR code from terminal
   - **Android**: Open Expo Go app → Scan QR code

4. **Demo ready!** App will load on your phone

---

## Option 2: EAS Build (Production-like)

### Steps:
1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Build for your platform:**
   ```bash
   # For iOS (TestFlight)
   eas build --platform ios --profile preview
   
   # For Android (APK)
   eas build --platform android --profile preview
   ```

4. **Install the build** on your phone when ready

---

## Quick Demo Checklist ✅

- [ ] Phone connected to same WiFi as laptop
- [ ] Expo Go app installed
- [ ] Development server running
- [ ] QR code scanned successfully
- [ ] App loads without errors

## Demo Features to Show:
- ✅ Firebase Authentication (Register/Login)
- ✅ Remember Me functionality
- ✅ Profile screen with user data
- ✅ Allergen management
- ✅ Smooth navigation and performance
- ✅ Real-time Firebase integration

## Troubleshooting:
- **Can't scan QR?** → Use tunnel mode: `npx expo start --tunnel`
- **Network issues?** → Ensure same WiFi network
- **App crashes?** → Check terminal for errors