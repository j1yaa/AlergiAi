# AllergyAI – Intelligent Food & Allergy Tracker

A React Native demo app for tracking meals and allergen exposure with real-time analysis.

## Quick Start

### Backend Server

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Setup database:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:8080/api`

### Frontend App

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the Expo app:
   ```bash
   npm start
   ```

## Environment Setup

### Backend (.env)
```
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL="file:./dev.db"
```

### Frontend (.env)
```
API_BASE_URL=http://localhost:8080/api
```

## Demo Mode

The app includes a **Demo Mode** feature:
- When `DEMO_MODE = true` in `src/config/demo.ts`
- If API calls fail, the app automatically falls back to local mock data
- Shows "Demo data" toast when using fallback

## Demo Flow

1. **Register** → Create new account or use demo accounts
2. **Login** → Use credentials (john@example.com / password)
3. **Dashboard** → View analytics with charts and stats
4. **Add Meal** → Enter meal description → Get AI allergen analysis
5. **Alerts** → Browse alerts with filtering (All/Flagged)
6. **Alert Details** → Tap any alert for detailed view

## Database Features

- **SQLite** for development (zero setup)
- **Prisma ORM** for type-safe database access
- **User authentication** with JWT and bcrypt
- **Meal tracking** with AI analysis results
- **Alert system** with severity levels
- **Migration ready** for PostgreSQL production

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed

# View database (optional)
npx prisma studio
```

## API Routes

- `POST /api/auth/login` → Authentication
- `GET /api/meals` → Recent meals list
- `POST /api/meals/analyze` → Meal analysis (text/image)
- `GET /api/alerts` → Paginated alerts with filtering
- `GET /api/analytics/summary` → Dashboard statistics
- `GET /api/user/settings` → User preferences
- `PUT /api/user/settings` → Update preferences
- `GET /api/health` → Health check

## Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
npm test
```

## Project Structure

```
├── server/                 # Backend API
│   ├── src/
│   │   ├── index.ts       # Express server
│   │   ├── routes.ts      # API routes
│   │   ├── data.ts        # Mock data
│   │   └── types.ts       # TypeScript types
│   └── tests/             # Backend tests
├── src/                   # Frontend source
│   ├── api/               # API client & mocks
│   ├── screens/           # App screens
│   ├── navigation/        # Navigation setup
│   ├── types/             # TypeScript types
│   └── config/            # App configuration
└── __tests__/             # Frontend tests
```

## Branches

- `main` → Stable release
- `dev` → Development sprint
- `feature/*` → Feature branches

## Technologies

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: SQLite (development), PostgreSQL ready
- **Authentication**: JWT, bcrypt
- **Storage**: Expo SecureStore
- **Testing**: Jest, React Native Testing Library

## Dependencies

### Backend Dependencies
```json
{
  "@prisma/client": "^5.7.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2"
}
```

### Backend Dev Dependencies
```json
{
  "@types/bcryptjs": "^2.4.6",
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "@types/jest": "^29.5.8",
  "@types/jsonwebtoken": "^9.0.5",
  "@types/node": "^20.10.0",
  "jest": "^29.7.0",
  "prisma": "^5.7.0",
  "ts-jest": "^29.1.1",
  "ts-node-dev": "^2.0.0",
  "typescript": "^5.3.2"
}
```

### Frontend Dependencies
```json
{
  "@expo/vector-icons": "^15.0.2",
  "@react-navigation/bottom-tabs": "^7.4.0",
  "@react-navigation/elements": "^2.6.3",
  "@react-navigation/native": "^7.1.8",
  "@react-navigation/stack": "^7.1.1",
  "axios": "^1.6.2",
  "expo": "~54.0.13",
  "expo-constants": "~18.0.9",
  "expo-font": "~14.0.9",
  "expo-haptics": "~15.0.7",
  "expo-image": "~3.0.9",
  "expo-linking": "~8.0.8",
  "expo-secure-store": "~14.0.0",
  "expo-splash-screen": "~31.0.10",
  "expo-status-bar": "~3.0.8",
  "expo-symbols": "~1.0.7",
  "expo-system-ui": "~6.0.7",
  "expo-web-browser": "~15.0.8",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.4",
  "react-native-dotenv": "^3.4.9",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "^15.2.0",
  "react-native-web": "~0.21.0",
  "react-native-worklets": "0.5.1"
}
```
