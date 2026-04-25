# Kitchen Recipes RN

React Native + Expo port of the original Android Compose app in this repo.

## What is ported

- Google sign-in entry screen
- My Recipes, Explore, Favorites, Add Recipe, and AI Import tabs
- Recipe detail pages with likes, comments, ratings, timers, and version restore
- User profile pages
- Pantry, shopping list, meal plan, local drafts, and local version history
- Firebase Auth, Firestore, and Storage wiring

## Run in browser

```bash
cd react-native-web-app
npm install
npm run web
```

The Expo web server was verified to start successfully on `http://localhost:8081`.

## Build Android later

```bash
cd react-native-web-app
npx expo prebuild -p android
npx expo run:android
```

For cloud builds / APKs:

```bash
npx eas build -p android --profile preview
```

## Environment setup

Copy `.env.example` to `.env` and fill in your Firebase web config plus optional Gemini key.

Notes:

- The current code includes sensible defaults pulled from the existing Android Firebase setup where possible.
- For the smoothest Google sign-in behavior on web and Android, register a Firebase web app and confirm the OAuth client IDs match your Expo app setup.
