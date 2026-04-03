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
  - `app/services` for application business services
  - `microservices` for isolated service entrypoints and container build targets
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
    app/
    microservices/
    model-artifacts/
  frontend/
  mobile/
docs/
infra/
  terraform/
    environments/
      dev/
      prod/
packages/
  shared/
requirements.md
design.md
```

Folder roles:

- `apps/backend/app`: main FastAPI application code, schemas, services, and utilities
- `apps/backend/microservices`: deployable entrypoints that expose bounded backend surfaces without duplicating business logic
- `apps/backend/model-artifacts`: ignored runtime artifact root for trained models and generated metadata
- `packages/shared`: shared API contracts, validators, constants, and client helpers used by web and mobile
- `infra/terraform/environments`: environment-specific Terraform wrappers for `dev` and `prod`

## Tech stack

- Backend: FastAPI, Pydantic, `asyncpg`, PostgreSQL
- Web: React 18, TypeScript, Vite, MUI, React Query, Redux Toolkit
- Mobile: React Native, Expo, React Navigation, Zustand, Expo Secure Store
- Shared: TypeScript contracts, validators, client helpers
- Infra: Terraform and GitHub Actions

## Prerequisites

- Python 3.11+
- Node.js 20+
- Terraform 1.14+
- AWS CLI v2
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
MODEL_ARTIFACTS_ROOT=model-artifacts
```

Copy the example if needed and adjust credentials for your local pgAdmin/PostgreSQL instance:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Important notes:

- The backend now prefers `DATABASE_URL`
- `POSTGRES_DSN` is still accepted for backward compatibility
- production-style startup does not rely on an in-memory fallback
- model artifacts can be mounted outside source control through `MODEL_ARTIFACTS_ROOT`
- repo-tracked ML artifacts are still supported as development fallbacks

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

### 6. Set the backend runtime profile

The backend runtime is Bedrock-only:

```powershell
npm run backend:profile:bedrock
```

Validate the currently selected runtime profile:

```powershell
npm run backend:validate-runtime
```

For offline-safe profile validation without live AWS calls:

```powershell
$env:RUNTIME_VALIDATION_MOCK_MODE="true"
npm run backend:validate-runtime
Remove-Item Env:RUNTIME_VALIDATION_MOCK_MODE
```

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
VITE_ERROR_REPORTING_ENDPOINT=
VITE_APP_RELEASE=web-dev
VITE_DEV_HOST=127.0.0.1
```

`VITE_DEV_HOST` defaults to `127.0.0.1` to avoid exposing the Vite dev server on the network unless you explicitly opt in.

## Mobile setup

### 1. Configure the API host

Create `apps/mobile/.env`:

```text
API_BASE_URL=http://10.0.2.2:8000
EXPO_PUBLIC_ERROR_REPORTING_ENDPOINT=
EXPO_PUBLIC_APP_RELEASE=mobile-dev
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
- Mobile tokens are persisted with Expo Secure Store
- Access tokens are attached automatically to requests
- Refresh tokens are handled by the shared API client
- Mobile read flows use retry-aware API calls where it is safe to do so
- Feedback submissions support offline queueing and later sync

## CORS

Development mode allows broad origins, headers, and methods so the web app and React Native clients can talk to the API during local testing.

Production should use explicit origins and strong secrets.

## Validation

### Terraform

Local Terraform validation now uses the `infra/terraform/environments/dev` wrapper and its committed offline-safe var file.

```powershell
npm run infra:validate
```

That command runs:

- `terraform fmt`
- `terraform init -backend=false`
- `terraform validate`
- `terraform plan -refresh=false`

### Backend

```powershell
npm run backend:test
npm run backend:validate-runtime
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
npm run test:run
npx expo config --type public
```

### Security audit

```powershell
npm run security:check
```

This enforces the runtime dependency policy and fails on high/critical production npm vulnerabilities.

Current status:

- production/runtime npm graph: `0` vulnerabilities
- dev-tooling audit noise remains in the Vite/Vitest/PWA toolchain
- those remaining items are isolated to build/test tooling and require a coordinated major-version upgrade pass, not an emergency runtime fix

## AWS credential setup

Use AWS CLI profiles or environment variables. Do not hardcode credentials in the repo.

Recommended profile flow:

```powershell
aws configure sso
$env:AWS_PROFILE="your-profile"
```

Optional backend env values:

```text
AWS_PROFILE=your-profile
AWS_SHARED_CREDENTIALS_FILE=
AWS_VALIDATION_MOCK_MODE=true
AWS_VALIDATION_S3_BUCKET=
AWS_SECRETS_MANAGER_SECRET_ID=
```

Validate runtime wiring:

```powershell
npm run backend:validate-aws
```

If credentials are missing in local development, the validator now returns mocked/skipped statuses instead of crashing.

## Operations

- `/metrics` now exposes Prometheus-compatible latency, request, dependency, and client-error counters
- browser and mobile clients send crash reports to `/api/v1/public/client-errors`
- admins can inspect `/api/v1/diagnostics/observability` and `/api/v1/diagnostics/client-errors`
- the production runbook is in `docs/production-readiness.md`

## Troubleshooting

- `terraform plan` fails locally:
  Use `npm run infra:validate`. It already applies the repo's offline-safe validation var file.
- `npm run backend:validate-aws` reports skipped/mocked services:
  Set `AWS_PROFILE` or export real AWS credentials, then rerun.
- `npm run backend:validate-runtime` fails while you only want to verify profile wiring:
  Set `RUNTIME_VALIDATION_MOCK_MODE=true`, rerun the validator, then unset the variable.
- Frontend is not reachable from another device:
  Set `VITE_DEV_HOST=0.0.0.0` before `npm run frontend:dev`.
- Mobile cannot reach the backend on a real phone:
  Set `API_BASE_URL` in `apps/mobile/.env` to `http://<your-local-ip>:8000`.
- PostgreSQL is unavailable locally:
  Keep `ALLOW_INMEMORY_DB_FALLBACK=true` only for local/dev fallback scenarios, never for production.

## Notes

- Existing API contracts and business logic remain unchanged
- PostgreSQL remains the primary system of record
- The mobile app is a React Native implementation, not the older Capacitor workflow
- The shared TypeScript package keeps web and mobile API behavior aligned
