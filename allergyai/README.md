# AllergyAI – Intelligent Food & Allergy Tracker

A React Native demo app for tracking meals and allergen exposure with real-time analysis.

## Quick Start

### Backend Server

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the backend server:
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

1. **Login** → Use pre-filled credentials (john@example.com / password)
2. **Dashboard** → View analytics with charts and stats
3. **Add Meal** → Enter meal description → Get allergen analysis
4. **Alerts** → Browse alerts with filtering (All/Flagged)
5. **Alert Details** → Tap any alert for detailed view

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

- **Frontend**: React Native, Expo, TypeScript, Victory Charts
- **Backend**: Node.js, Express, TypeScript
- **Storage**: Expo SecureStore
- **Testing**: Jest, React Native Testing Library
