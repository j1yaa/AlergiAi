# Android Setup Guide

## Development Commands
- `npm run android` - Start Android development server
- `npm run android:dev` - Start with dev client
- `npm run android:tunnel` - Start with tunnel for testing on physical device
- `npm run android:build` - Build Android APK
- `npm run prebuild` - Generate native Android project
- `npm run prebuild:clean` - Clean and regenerate native project

## Android-Specific Features
- Material Design components with elevation
- Platform-specific styling and theming
- Android permissions configured for camera and storage
- Optimized for Android API 23+ (Android 6.0+)
- Hermes JavaScript engine enabled for better performance

## Key Files
- `app.json` - Android configuration with permissions and SDK versions
- `src/utils/platform.ts` - Platform detection and styling utilities
- `src/components/AndroidCard.tsx` - Material Design card component
- `constants/theme.ts` - Android Material Design colors and spacing

## Testing on Android
1. Install Android Studio and set up Android SDK
2. Create Android Virtual Device (AVD) or connect physical device
3. Run `npm run android` to start development server
4. App will automatically open on Android device/emulator