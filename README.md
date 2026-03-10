# KrishiMitra-AI

AI-powered rural decision intelligence platform with:
- FastAPI backend (MongoDB + Motor async + Redis optional)
- React + TypeScript web app (PWA enabled)
- React Native / Expo mobile app

## 1. Prerequisites

- Python `3.11`
- Node.js `18+`
- MongoDB (local or remote URI)
- Redis (optional)
- AWS credentials (for live Bedrock + Translate)

## 2. Backend Setup

From repository root:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

Create `backend/.env` from `backend/.env.example` and set at minimum:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET_KEY`
- `JWT_REFRESH_SECRET_KEY`
- `ENVIRONMENT` (`development` or `production`)

Optional but recommended:

- `REDIS_URL`
- `AWS_REGION`
- `BEDROCK_MODEL_ID`
- `BEDROCK_FALLBACK_MODEL_ID`
- `MANDI_API_KEY`
- `WEATHER_API_URL` / `WEATHER_API_KEY`

Auth hardening envs:

- `AUTH_LOCKOUT_THRESHOLD`
- `AUTH_LOCKOUT_MINUTES`
- `OTP_PROVIDER` (`console`, `twilio`, or `smtp`)
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`) if using `smtp`

Run backend:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Health:

```bash
GET http://localhost:8000/health
```

## 3. Frontend Setup (Web)

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

Optional env in `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws/updates
```

Build check:

```bash
npm run build
```

## 4. Mobile Setup (Expo)

```bash
cd frontend-mobile
npm install
npm start
```

Optional env in `frontend-mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Type-check:

```bash
npx tsc --noEmit
```

## 5. API Response Contract

All endpoints return:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## 6. Core User Journey (Backend APIs)

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `POST /api/v1/recommendations/crop`
4. `POST /api/v1/recommendations/price-forecast`
5. `POST /api/v1/recommendations/water-optimization`
6. `POST /api/v1/advisory/chat`
7. `POST /api/v1/feedback/outcome`
8. Officer/Admin analytics:
   - `GET /api/v1/analytics/overview`
   - `GET /api/v1/analytics/farmers-needing-attention`

## 7. Operations Endpoints (Admin)

- `POST /api/v1/operations/schedule/trigger/weekly-price-refresh`
- `POST /api/v1/operations/schedule/trigger/quarterly-retrain`
- `POST /api/v1/operations/schedule/trigger/daily-data-refresh`
- `GET /api/v1/operations/schedule`

## 8. Data Integrations

- Weather: `GET /api/v1/integrations/weather`
- Mandi prices: `GET /api/v1/integrations/mandi-prices`
- Mandi catalog: `GET /api/v1/integrations/mandi-catalog`
- Integration audit log (admin): `GET /api/v1/integrations/audit`

## 9. Retraining Commands

From `backend/`:

```bash
# Weekly-ready price retrain
python -m ml.training.retrain_price_model

# Quarterly-ready full retrain
python -m ml.pipelines.retrain_all

# Seasonal crop refresh
python -m ml.pipelines.seasonal_crop_refresh
```

## 10. Validation Commands

From repository root:

```bash
# backend tests
cd backend
..\.venv\Scripts\python.exe -m pytest tests -q

# frontend build
cd ..\frontend
npm run build

# mobile type-check
cd ..\frontend-mobile
npx tsc --noEmit
```

## 11. Notes

- Bedrock integration is preserved with fallback to Titan and safe advisory fallback handling.
- RAG retrieval is active with semantic/TF-IDF backends and citation references in responses.
- Redis is optional; app falls back to in-process behavior when unavailable.
- Auth includes JWT access/refresh rotation, hashed OTPs, MFA hooks, and account lockout controls.

## 12. AWS IaC Scaffold (Terraform)

Terraform scaffold is included at `infra/terraform/` for:
- ECS cluster base resource
- CloudWatch log group
- EventBridge schedules for weekly/quarterly/daily operations

Example:

```bash
cd infra/terraform
terraform init
terraform plan -var "scheduler_target_arn=<target-arn>" -var "scheduler_target_role_arn=<role-arn>"
```
