# 🔥 Complete Firebase Setup Guide

## 1. Deploy Firestore Security Rules

### Copy the rules to Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **allergiai**
3. Go to **Firestore Database** → **Rules**
4. Replace the rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own meals
    match /meals/{mealId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can read/write their own symptoms
    match /symptoms/{symptomId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can read/write their own alerts
    match /alerts/{alertId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

5. Click **Publish**

## 2. Enable Authentication Methods

### Go to Authentication → Sign-in method:
- ✅ **Email/Password** - Enable this
- ✅ **Anonymous** - Enable for testing (optional)

## 3. Quick Test Mode (Temporary)

### If you need immediate access for demo:
Replace Firestore rules with this temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Remember to change back to secure rules after demo!**

## 4. Verify Setup

### Check these in Firebase Console:
- [ ] **Project ID**: allergiai
- [ ] **Authentication**: Email/Password enabled
- [ ] **Firestore**: Rules deployed
- [ ] **Firestore**: Database created in production mode

## 5. Test Connection

Run this to verify everything works:
```bash
node firebase-test.js
```

## Current Firebase Config:
- **Project ID**: allergiai
- **Auth Domain**: allergiai.firebaseapp.com
- **API Key**: AIzaSyAGXvMavBvpk4Fdg1ujB2r-MaxbIqZS0ak