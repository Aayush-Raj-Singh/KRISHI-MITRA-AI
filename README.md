# KrishiMitra AI

KrishiMitra AI is an agriculture decision-support platform with a FastAPI backend, a React web app, and a React Native mobile app. The existing business flows stay intact while the runtime wiring is cleaned up around PostgreSQL, shared API contracts, and mobile-first environment configuration.

## Overview

KrishiMitra AI supports farmers, extension officers, and administrators with:

- Authentication and profile management
- Dashboard and role-aware summaries
- Crop recommendation
- Price forecast
- Water optimization
- AI advisory chat
- Disease detection
- Feedback capture and outcome tracking

## Architecture

### Applications

- `apps/backend`
  - FastAPI
  - `asyncpg` PostgreSQL access with connection pooling
  - automatic schema/table bootstrap on startup
- `apps/frontend`
  - React + TypeScript + Vite
  - web and PWA experience
- `apps/mobile`
  - React Native + TypeScript + Expo
  - Android and iOS mobile experience

### Shared package

- `packages/shared`
  - endpoint constants
  - request/response contracts
  - validation helpers
  - authenticated API client factories

## Repository structure

```text
apps/
  backend/
  frontend/
  mobile/
docs/
infra/
packages/
  shared/
requirements.md
design.md
```

## Tech stack

- Backend: FastAPI, Pydantic, `asyncpg`, PostgreSQL
- Web: React 18, TypeScript, Vite, MUI, React Query, Redux Toolkit
- Mobile: React Native, Expo, React Navigation, Zustand, AsyncStorage
- Shared: TypeScript contracts, validators, client helpers
- Infra: Terraform and GitHub Actions

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- pgAdmin 4

## Backend setup

### 1. Create the PostgreSQL database

In pgAdmin 4:

1. Connect to your local PostgreSQL server
2. Create a database named `krishi_db` or point the backend `.env` at your existing database
3. Confirm the `postgres` user credentials you want to use

The backend auto-creates the required tables the first time it starts. After startup, pgAdmin should show tables including:

- `users`
- `recommendations`
- `feedback`
- `conversations`
- `outcomes`

### 2. Configure backend environment

`apps/backend/.env.example` contains the canonical development shape:

```text
DATABASE_URL=postgresql://postgres:password@localhost:5432/krishi_db
ALLOW_INMEMORY_DB_FALLBACK=false
CORS_ORIGINS=*
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*
```

Copy the example if needed and adjust credentials for your local pgAdmin/PostgreSQL instance:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Important notes:

- The backend now prefers `DATABASE_URL`
- `POSTGRES_DSN` is still accepted for backward compatibility
- production-style startup does not rely on an in-memory fallback

### 3. Install backend dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r apps/backend/requirements.txt
```

### 4. Run the backend

```powershell
cd apps/backend
..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify backend health

```text
GET /health
GET /health/db
```

`/health/db` verifies the live PostgreSQL connection and reports required table availability.

## Web setup

```powershell
npm install --legacy-peer-deps
cd apps/frontend
npm run dev
```

Typical frontend environment:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws/updates
```

## Mobile setup

### 1. Configure the API host

Create `apps/mobile/.env`:

```text
API_BASE_URL=http://10.0.2.2:8000
```

Use the correct host per runtime:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Real device: `http://<your-local-ip>:8000`

The mobile app appends `/api/v1` automatically through `apps/mobile/app.config.ts`.

### 2. Install and run the mobile app

```powershell
cd apps/mobile
npm install
npm run start
```

Launch targets:

```powershell
npm run android
npm run ios
```

For native project generation and local Android/iOS build tooling:

```powershell
npm run run:android
npm run run:ios
```

## Authentication and API behavior

- Web and mobile reuse the same backend APIs
- Mobile tokens are persisted with AsyncStorage
- Access tokens are attached automatically to requests
- Refresh tokens are handled by the shared API client
- Mobile read flows use retry-aware API calls where it is safe to do so
- Feedback submissions support offline queueing and later sync

## CORS

Development mode allows broad origins, headers, and methods so the web app and React Native clients can talk to the API during local testing.

Production should use explicit origins and strong secrets.

## Validation

### Backend

```powershell
$env:PYTHONPATH='apps/backend'
.\.venv\Scripts\python.exe -m pytest apps/backend/tests -q
```

### Shared package

```powershell
cd packages/shared
npm run typecheck
```

### Frontend

```powershell
cd apps/frontend
npm run typecheck
npm run test:run
npm run build
```

### Mobile

```powershell
cd apps/mobile
npm run typecheck
npx expo config --type public
```

## Notes

- Existing API contracts and business logic remain unchanged
- PostgreSQL remains the primary system of record
- The mobile app is a React Native implementation, not the older Capacitor workflow
- The shared TypeScript package keeps web and mobile API behavior aligned
