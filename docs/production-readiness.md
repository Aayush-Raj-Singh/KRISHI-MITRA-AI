# Production Readiness Runbook

This repo now ships with the operational pieces needed for a production-grade baseline:

- structured backend logs with request correlation
- `/health`, `/health/db`, and `/metrics`
- browser and mobile client-error ingest to the backend
- offline retry queues with exponential backoff on web and mobile
- secure mobile auth persistence via Expo Secure Store
- CI coverage for backend, frontend, shared package, mobile, Terraform, runtime npm security policy, and optional AWS runtime validation

## Environment files

Create these from the committed examples:

```powershell
Copy-Item apps\backend\.env.example apps\backend\.env
Copy-Item apps\frontend\.env.example apps\frontend\.env
Copy-Item apps\mobile\.env.example apps\mobile\.env
```

## Local validation

```powershell
npm install --include-workspace-root
.\.venv\Scripts\python.exe -m pip install -r apps/backend/requirements.txt
npm run ci:check
npm run infra:validate
```

`npm run infra:validate` uses `infra/terraform/environments/dev/local.validation.tfvars` to run `terraform fmt`, `init -backend=false`, `validate`, and an offline-safe `plan`.

## Runtime profile

The backend runtime is Bedrock-only:

```powershell
npm run backend:profile:bedrock
```

Validate the currently selected runtime profile:

```powershell
npm run backend:validate-runtime
```

For CI or offline-safe profile checks without live AWS calls:

```powershell
$env:RUNTIME_VALIDATION_MOCK_MODE="true"
npm run backend:validate-runtime
Remove-Item Env:RUNTIME_VALIDATION_MOCK_MODE
```

CI runs the Bedrock runtime profile through `apps/backend/scripts/validate_runtime_profile.py` with `RUNTIME_VALIDATION_MOCK_MODE=true` so the runtime-validation path stays green even when live provider credentials are unavailable.

## Runtime endpoints

- `GET /health`: liveness plus environment/uptime summary
- `GET /health/db`: PostgreSQL readiness and required-table coverage
- `GET /metrics`: Prometheus-compatible metrics
- `GET /api/v1/diagnostics/observability`: admin-only JSON observability snapshot
- `GET /api/v1/diagnostics/client-errors`: admin-only recent web/mobile error reports

If `METRICS_API_KEY` is set in backend env, scrape `/metrics` with header `X-Metrics-Key`.

## AWS validation

Preferred local setup uses AWS CLI profiles or environment variables. Example:

```powershell
aws configure sso
$env:AWS_PROFILE="your-profile"
```

Run AWS validation when you are using the Bedrock/AWS profile or when you need to verify AWS service wiring:

```powershell
npm run backend:validate-aws
```

The script checks STS identity, IAM visibility, Bedrock, Translate, S3, Secrets Manager, and SageMaker endpoint wiring.

If local credentials are missing and `AWS_VALIDATION_MOCK_MODE=true`, the validator returns mocked/skipped statuses instead of failing hard.

## Security audit

```powershell
npm run security:check
```

This enforces the runtime npm vulnerability policy and is wired into CI.

Current posture:

- runtime npm dependencies: `0` vulnerabilities
- remaining audit findings are dev-tooling only in the Vite/Vitest/PWA chain
- those should be handled as a coordinated major upgrade track, not mixed into routine runtime hardening

## Deployment checklist

1. Set `ENVIRONMENT=production`
2. Set strong `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY`
3. Set explicit `CORS_ORIGINS`
4. Disable `ALLOW_INMEMORY_DB_FALLBACK`
5. Configure `REDIS_URL`
6. Decide whether `/metrics` needs `METRICS_API_KEY`
7. Set `CLIENT_ERROR_INGEST_ENABLED=true`
8. Provide real OTP provider settings if MFA/password reset is enabled
9. Run `npm run security:check`, `npm run infra:validate`, `npm run backend:validate-runtime`, and provider-specific live validation such as `npm run backend:validate-aws` for the AWS/Bedrock profile
10. Verify `/health`, `/health/db`, `/metrics`, `/api/v1/diagnostics/runtime-profile`, and admin diagnostics after deploy

## Troubleshooting

- Terraform requests real AWS credentials during validation:
  use the committed `infra/terraform/environments/dev/local.validation.tfvars` through `npm run infra:validate`; it enables offline-safe mock mode.
- AWS validation is fully skipped locally:
  set `AWS_PROFILE` or real `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, then rerun.
- AWS validation shows inactive Bedrock/Translate checks:
  switch with `npm run backend:profile:bedrock` before requiring live AWS runtime checks.
- Runtime profile validation should stay offline-safe:
  set `RUNTIME_VALIDATION_MOCK_MODE=true` before `npm run backend:validate-runtime`.
- CI fails the security gate:
  fix runtime high/critical npm issues first; dev-tooling audit noise is reported separately and does not block by default.
