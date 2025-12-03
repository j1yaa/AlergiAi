# Demo Mode Testing

## Current Status: DEMO_MODE = true

### Testing Checklist:
- [ ] App loads without Firebase errors
- [ ] Registration works with demo data
- [ ] Login works with demo credentials
- [ ] Profile screen shows demo user data
- [ ] Navigation between screens works
- [ ] Logout functionality works

### Demo Data Available:
- **Demo User**: Demo User (demo@example.com)
- **Demo Allergens**: Peanuts, Shellfish
- **Demo Stats**: 5 meals, 2 alerts

### After Testing:
1. Verify all core functionality works
2. Test Firebase integration with real data
3. **IMPORTANT**: Disable demo mode by setting `DEMO_MODE = false`

### Known Issues to Fix:
- TypeScript errors in test files (non-critical)
- Window reference errors in AllergenScreen (fixed with type casting)