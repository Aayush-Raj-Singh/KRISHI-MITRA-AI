# KrishiMitra AI

KrishiMitra AI is a production-oriented rural decision intelligence platform for Indian agriculture. It combines a FastAPI backend, machine learning inference, Amazon Bedrock-backed advisory orchestration, a multilingual React web app, and a Capacitor Android shell to support farmers, extension officers, and administrators.

The repository has been aligned against `requirements.md` and `design.md`, then hardened through two upgrade passes. The current codebase includes secure auth flows, dashboard PDF/XLSX export, IndexedDB-based offline queuing, production-safe runtime guards, and automated backend/frontend/infra validation.

## Core capabilities

- User registration, login, refresh, logout, password reset, profile updates, and role-based access control
- Crop recommendation with personalization from historical farmer outcomes
- Price forecasting with historical context, confidence bands, and price-accuracy tracking
- Water optimization using crop, weather, soil moisture, and field area inputs
- Multilingual AI advisory using Amazon Bedrock-oriented orchestration and RAG context
- Officer analytics with consent-safe farmer risk views and report export in PDF/XLSX
- Disease image prediction with upload validation and advisory generation
- Offline-friendly web experience with IndexedDB-backed queueing and cached reads
- Responsive web app plus Capacitor Android packaging

## Repository layout

```text
apps/
  backend/    FastAPI app, ML assets, scripts, tests
  frontend/   React + TypeScript web app, PWA, Capacitor Android shell
  mobile/     Legacy/reference mobile notes and scaffolding
docs/
  system-audit-report.md
infra/
  terraform/  AWS infrastructure scaffold
  buildspec.yml
requirements.md
design.md
```

## Tech stack

- Backend: FastAPI, Pydantic, asyncpg/PostgreSQL, Redis-ready caching, structlog
- AI/ML: scikit-learn, Prophet, Amazon Bedrock integration, optional SageMaker inference path
- Frontend: React 18, TypeScript, MUI, Redux Toolkit, React Query, Chart.js, i18next, Vite
- Mobile delivery: Capacitor Android from `apps/frontend`
- Infra: Terraform, GitHub Actions, AWS buildspec

## Setup

### Prerequisites

- Python 3.11
- Node.js 20+
- PostgreSQL
- Redis optional for local cache/rate-limit backing
- AWS credentials only if you want live Bedrock, Translate, Secrets Manager, or SageMaker validation

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r apps/backend/requirements.txt
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and set the values needed for your environment.

Important backend env vars:

- `ENVIRONMENT=development|staging|production`
- `JWT_SECRET_KEY`
- `JWT_REFRESH_SECRET_KEY`
- `POSTGRES_DSN`
- `ALLOW_INMEMORY_DB_FALLBACK`
  - keep `true` only for local development/tests
  - set `false` in staging/production
- `AWS_REGION`
- `AWS_SECRETS_MANAGER_SECRET_ID`
- `BEDROCK_MODEL_ID`
- `BEDROCK_FALLBACK_MODEL_ID`
- `AWS_TRANSLATE_ENABLED`
- `PUBLIC_TRANSLATE_FALLBACK_ENABLED`
- `SAGEMAKER_RUNTIME_ENABLED`
- `SAGEMAKER_CROP_ENDPOINT`
- `SAGEMAKER_PRICE_ENDPOINT`

Run the backend:

```powershell
cd apps/backend
..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

If you are running tests or scripts from the repository root, set:

```powershell
$env:PYTHONPATH='apps/backend'
```

### Frontend

```powershell
cd apps/frontend
npm install
npm run dev
```

Optional frontend env vars:

```powershell
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws/updates
VITE_MOBILE_API_BASE_URL=http://10.0.2.2:8000/api/v1
VITE_MOBILE_WS_URL=ws://10.0.2.2:8000/api/v1/ws/updates
```

### Capacitor Android shell

```powershell
cd apps/frontend
npm run build
npm run cap:sync
npm run cap:open:android
```

The validated mobile path in this repo is the Capacitor shell generated from `apps/frontend`.

## Validation commands

### Backend

```powershell
$env:PYTHONPATH='apps/backend'
.\.venv\Scripts\python.exe -m pytest apps/backend/tests -q
```

### Frontend

```powershell
cd apps/frontend
npm run lint
npm run test:run
npm run build
npm run cap:sync
```

### AWS runtime validation

```powershell
$env:PYTHONPATH='apps/backend'
.\.venv\Scripts\python.exe apps/backend/scripts/validate_aws_runtime.py
```

### Terraform validation

```powershell
cd infra/terraform
terraform init -backend=false
terraform validate
```

## Current validated baseline

Validated on 2026-03-17 in this workspace:

- Backend tests: `9 passed`
- Frontend tests: `6 passed`
- Frontend typecheck: passed
- Frontend build: passed
- Capacitor sync: passed
- Terraform validate: passed

## CI and build validation

- GitHub Actions: `.github/workflows/ci.yml`
- AWS build validation: `infra/buildspec.yml`

Both now run backend tests, frontend typecheck/tests/build, Capacitor sync, and Terraform validation.

## AWS readiness note

The codebase now contains:

- Bedrock advisory integration
- Secrets Manager loading
- optional SageMaker runtime inference for crop and price flows

However, the currently validated AWS account is not fully production-ready yet:

- Bedrock runtime invocation is blocked by account billing/subscription state
- AWS Translate is not currently subscribed in that account
- no SageMaker endpoints were present in `us-east-1`
- no KrishiMitra app secret was configured in Secrets Manager during validation

See `docs/system-audit-report.md` for the exact live validation results.

## Documentation

- Product requirements: `requirements.md`
- System design: `design.md`
- Current audit and validation report: `docs/system-audit-report.md`
