# KrishiMitra AI System Audit

Audit date: 2026-03-17

## Scope

This report captures the remaining-gap pass completed after the initial hardening audit. It covers the repo state, the code changes applied in this pass, and the live AWS validation results from the currently configured account.

## Status Summary

| Area | Current status | Notes |
| --- | --- | --- |
| Dashboard PDF/XLSX export | Implemented and tested | Officer analytics exports now work through the dashboard UI and are covered by backend API tests. |
| Offline mutation queue | Implemented | Browser `localStorage` mutation queues were replaced with IndexedDB-backed queues. |
| Mobile shell | Implemented for Android/Capacitor | Build and sync succeed, native API routing is environment-aware, and Android now has safer local-network handling for emulator/dev use. |
| Production DB handling | Implemented | PostgreSQL now uses retry + fail-fast behavior; in-memory DB fallback remains development/test only. |
| Bedrock/Translate runtime guards | Implemented | Production no longer silently drops to mock/public fallbacks for advisory, translation, or OTP. |
| SageMaker runtime path | Implemented in code | Backend now supports direct SageMaker endpoint inference when enabled by environment. |
| Frontend regression coverage | Implemented | Protected route bootstrap and IndexedDB offline queue flows now have automated tests. |
| Infra validation | Implemented | Terraform init/validate is wired into CI/buildspec and passes locally. |

## What Was Fixed In This Pass

### Feature completion

- Kept dashboard PDF and XLSX export fully wired through the officer analytics UI and added backend API regression coverage for both formats.
- Consolidated officer analytics data loading to a single regional-insights request instead of separate overview, reliability, and risk calls.
- Auto-loaded officer analytics on first officer/admin dashboard visit so the section no longer starts empty by default.

### Mobile and offline

- Replaced localStorage-backed mutation queuing with IndexedDB-backed queue storage.
- Kept non-sensitive cache snapshots available for offline viewing while preventing queue data from falling back to browser local storage.
- Added Android network security configuration so emulator/local native development can reach `10.0.2.2`, `127.0.0.1`, and `localhost` without opening cleartext traffic globally.
- Added Android notification permission declaration for newer OS versions.
- Re-validated `npm run cap:sync` successfully against the current Capacitor shell.

### Security and runtime hardening

- Added explicit upload/export rate-limit buckets for disease image prediction and analytics report generation.
- Added strict production separation for fallback behavior:
  - advisory must use Bedrock or fail
  - translation must use AWS-backed services or fail
  - OTP delivery must use a real configured provider or fail
- Added production-safe PostgreSQL retry behavior with no silent production fallback to in-memory storage.
- Added optional SageMaker runtime inference support for crop recommendation and price forecasting, controlled by environment flags and endpoint names.
- Updated the checked-in default Bedrock fallback model from the retired Titan model to a currently supported Anthropic fallback model in code defaults and `.env.example`.

### Performance

- Reduced dashboard officer latency and redundant network traffic by using the aggregated `/dashboard/regional-insights` endpoint for overview, farmer attention, and feedback reliability.
- Refined Vite chunk splitting so the production build stays clean without circular chunk warnings.

### Testing and delivery

- Added frontend tests for:
  - protected route bootstrap from an existing token
  - logout-on-bootstrap-failure behavior
  - IndexedDB offline queue persistence and cleanup
- Added backend export API tests for PDF and XLSX report generation.
- Updated GitHub Actions and AWS buildspec to run:
  - backend tests
  - frontend typecheck
  - frontend tests
  - frontend production build
  - Capacitor sync
  - Terraform init/validate

## Live AWS Validation Results

Validation date: 2026-03-17

Validated with live AWS credentials from:

- Account: `130854680218`
- ARN: `arn:aws:iam::130854680218:user/Aayush`
- Region tested: `us-east-1`

### Verified working

- `aws sts get-caller-identity` succeeds.
- `aws bedrock list-foundation-models --region us-east-1 --by-provider anthropic` returns current Anthropic models, including:
  - `anthropic.claude-sonnet-4-20250514-v1:0`
  - `anthropic.claude-3-sonnet-20240229-v1:0`
  - `anthropic.claude-3-haiku-20240307-v1:0`

### Verified failing in the current AWS account

- Bedrock runtime invocation is still blocked for the currently configured primary model with `AccessDeniedException` and `INVALID_PAYMENT_INSTRUMENT`.
- The live validator in this workspace is still reading an older local env fallback model (`amazon.titan-text-express-v1`); the checked-in default and `.env.example` now use a supported Anthropic fallback instead.
- AWS Translate runtime currently fails with `SubscriptionRequiredException`.
- `aws sagemaker list-endpoints --region us-east-1` returned `[]`.
- `aws secretsmanager list-secrets --region us-east-1` returned no KrishiMitra/Krishi application secrets.

### Infra validation

- `terraform init -backend=false` succeeded in `infra/terraform`.
- `terraform validate` succeeded in `infra/terraform`.

## Current Codebase Validation

Validated in this workspace on 2026-03-17:

- Backend tests: `9 passed`
- Frontend tests: `6 passed`
- Frontend typecheck: passed
- Frontend production build: passed
- Capacitor sync: passed
- Terraform validate: passed

## Architecture Alignment After This Pass

### Aligned

- FastAPI backend, React frontend, AWS-oriented infrastructure, Redis-ready caching, JWT auth, and Postgres-backed persistence remain aligned with the design intent.
- Bedrock-backed advisory and a real SageMaker runtime path now both exist in code, with environment-controlled switching.
- Officer analytics export, offline support, and mobile packaging now better match the product requirements.

### Still divergent

- The runtime is still a modular monolith rather than a fully deployed microservice mesh.
- The active mobile strategy remains Capacitor over the web app, not separate React Native Android/iOS applications.
- Live AWS production readiness is currently blocked by the cloud account state, not by missing application code alone.

## Remaining Release Blockers

These are the real blockers still preventing a truthful "fully deployment-ready" statement:

1. The current AWS account is not yet Bedrock-runtime ready because model invocation is blocked by billing/subscription state.
2. AWS Translate is not yet subscribed/enabled for the current account.
3. No SageMaker endpoints are presently deployed in `us-east-1`.
4. No KrishiMitra application secret is currently configured in AWS Secrets Manager for this environment.
5. iOS native delivery was not validated in this workspace; Android/Capacitor is the validated mobile path.

## Recommended Next Release Actions

1. Update the deployed environment values so `BEDROCK_FALLBACK_MODEL_ID` uses a supported model everywhere, not only in checked-in defaults.
2. Provision or connect the real Secrets Manager secret, then set `AWS_SECRETS_MANAGER_SECRET_ID`.
3. Deploy crop and price SageMaker endpoints and enable `SAGEMAKER_RUNTIME_ENABLED=true` in the target environment.
4. Resolve AWS billing/subscription prerequisites for Bedrock and AWS Translate before production cutover.
5. Run one staging smoke test against live AWS with production-like env values before release sign-off.
