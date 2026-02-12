#!/bin/bash

echo "🔔 Setting up Meal Reminder Feature..."
echo ""

cd allergyai

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Rebuilding native modules..."
npx expo prebuild --clean

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npx expo run:ios' or 'npx expo run:android'"
echo "2. Open the app and navigate to Add Meal screen"
echo "3. Tap the bell icon to configure reminders"
echo ""
echo "📖 See MEAL-REMINDERS.md for detailed documentation"
