# Goal Tracker

An iPhone-first sales goal tracker built with Expo + React Native. Log a deal in one tap, watch every stat update instantly, and get milestone celebrations as you close in on your goal.

Default targets (edit anytime in **Settings**): **118 sales** → **88 installs** at 75% retention.

## Stack

- Expo + Expo Router (TypeScript, file-based routing)
- Zustand for state, persisted locally with AsyncStorage — the app is **local-first**: every add/edit writes to the device instantly and works fully offline, whether or not cloud sync is configured
- Firebase (Auth + Firestore) for optional cross-device cloud sync
- `expo-notifications` for daily pace reminders
- `react-native-svg` + `react-native-reanimated` for the progress ring, `react-native-confetti-cannon` for milestone celebrations

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your iPhone, or press `i` for the iOS Simulator (macOS + Xcode required), or `w` for a web preview.

## Cloud sync (optional)

The app works with zero configuration — everything saves to the device. To add cross-device sync via Firebase:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Anonymous** (the app signs in anonymously per-device; there's no login screen).
3. Enable **Firestore Database** (start in production mode; the app only ever reads/writes under `users/{uid}/...`, so a rule like below is sufficient):
   ```
   match /users/{uid}/{document=**} {
     allow read, write: if request.auth != null && request.auth.uid == uid;
   }
   ```
4. In the Firebase console, add a **Web app** to the project and copy its config values.
5. Copy `.env.example` to `.env` and fill in the `EXPO_PUBLIC_FIREBASE_*` values.
6. Restart `expo start`. Settings will show a "Cloud sync isn't configured" banner until this is done — it disappears once the env vars are picked up.

These are client-side config values, not secrets — Firebase web config is safe to ship in the app bundle. `.env` is still gitignored as a matter of hygiene.

## How the data model works

- `src/store/dealsStore.ts` / `settingsStore.ts` (Zustand) are the source of truth for the UI. Every mutation writes to AsyncStorage immediately, so the app is instantly responsive and fully usable offline.
- When Firebase is configured, each deal/settings write is also pushed to Firestore in the background; anything that fails (offline, etc.) is flagged `synced: false` and retried automatically on reconnect (`NetInfo` listener) or app foreground.
- On launch, the app pulls from Firestore and merges by `updatedAt` so the newer copy of each deal wins across devices.
- `src/lib/stats.ts` is a pure, dependency-free stats engine (pace, streaks, projections, milestones) — safe to unit test in isolation from the UI.

## Notifications

Local daily reminders are scheduled with `expo-notifications`. Because Expo's local scheduler can't compute fresh content at fire time, the app recomputes the reminder message (pace-aware: "ahead of schedule," "N more today," "only N left") and re-schedules it whenever the app is opened, a deal is added, or settings change — so the text is fresh as of your last session, even though it's technically a static local notification between opens. Not supported on web (Expo/browser limitation); iOS/Android only.

## Project layout

```
app/                  Expo Router screens (Home, Analytics, Settings, Add Deal modal)
src/components/       CircularProgress, BarChart, MilestoneOverlay, StatTile, etc.
src/store/            Zustand stores (deals, settings, ui/celebrations)
src/firebase/         Firebase config + Firestore sync helpers (no-op if unconfigured)
src/lib/              stats engine, date helpers, notifications, local storage
src/theme/            Dark, "premium fitness app" color/spacing/type system
```

## Future integration hooks

The data layer is intentionally decoupled from the UI so a later CRM sync, install-tracking webhook, commissions view, or team leaderboard can write into the same `deals`/`settings` Firestore collections without touching screens — the stats engine and UI both just read from the shared store.
