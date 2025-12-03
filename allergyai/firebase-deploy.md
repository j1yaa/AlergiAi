# Firebase Deployment Instructions

## 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

## 2. Login to Firebase
```bash
firebase login
```

## 3. Initialize Firebase in project
```bash
firebase init firestore
```

## 4. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## 5. Create Composite Indexes (if needed)
Go to Firebase Console > Firestore > Indexes and create:
- Collection: `meals`, Fields: `userId` (Ascending), `createdAt` (Descending)
- Collection: `symptoms`, Fields: `userId` (Ascending), `createdAt` (Descending)  
- Collection: `alerts`, Fields: `userId` (Ascending), `timestamp` (Descending)

## Current Issues Fixed:
- ✅ Created proper Firestore security rules
- ✅ Fixed user document creation using setDoc with proper document ID
- ✅ Replaced query-based user lookups with direct document access
- ✅ Added missing Firestore imports (setDoc, doc, getDoc)