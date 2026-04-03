# KrishiMitra AI Mobile

The mobile app is a React Native application powered by Expo. It connects directly to the FastAPI backend and reuses the shared API contracts from `packages/shared`.

## Environment

Create `apps/mobile/.env` with an API host that your device can reach:

```text
API_BASE_URL=http://10.0.2.2:8000
EXPO_PUBLIC_ERROR_REPORTING_ENDPOINT=
EXPO_PUBLIC_APP_RELEASE=mobile-dev
```

Connection targets:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Real device: `http://<your-local-ip>:8000`

The app config appends `/api/v1` automatically, so the value should point at the backend host only.

## Run

```powershell
cd apps/mobile
npm install
npm run start
```

Native launch commands:

```powershell
npm run android
npm run ios
```

If you want local native project generation for Android or iOS tooling, use:

```powershell
npm run run:android
npm run run:ios
```

## Auth and storage

- Auth tokens are stored with Expo Secure Store
- Access tokens are attached automatically to API requests
- Refresh tokens are rotated through the shared API client
- Offline feedback is queued locally, retried with backoff, and synced when connectivity returns
