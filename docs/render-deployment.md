# Render Deployment

This repository is prepared for Render with the root-level [render.yaml](../render.yaml).

It deploys:

- `krishimitra-ai-api`: FastAPI backend as a free Render web service
- `krishimitra-ai-web`: Vite frontend as a free Render static site

## What this setup assumes

- The frontend is deployed from `apps/frontend`.
- The backend is deployed from `apps/backend`.
- The backend uses in-memory fallback on Render by default for a zero-cost demo.
- The AI advisor service is hosted externally and exposed through `VITE_AI_ADVISOR_BASE_URL`.

This is suitable for demo and validation. It is not durable production infrastructure because in-memory backend state is lost whenever the service restarts.

## Import the Blueprint

1. Push this repository to GitHub.
2. In Render, select `New +` and then `Blueprint`.
3. Connect the repository and import the root [render.yaml](../render.yaml).
4. Render will create two services from the Blueprint.

## Values Render will ask you for

During initial Blueprint creation, Render prompts for the `sync: false` variables.

For `krishimitra-ai-api`:

- `PUBLIC_API_BASE_URL`
  - Use `https://krishimitra-ai-api.onrender.com/api/v1` if Render keeps the default service hostname.
- `PUBLIC_WS_URL`
  - Use `wss://krishimitra-ai-api.onrender.com/api/v1/ws/updates` if Render keeps the default service hostname.

For `krishimitra-ai-web`:

- `VITE_AI_ADVISOR_BASE_URL`
  - Set this to your externally hosted advisor root, for example `https://your-advisor-host.example.com`.

If Render assigns a different public hostname, update `PUBLIC_API_BASE_URL` and `PUBLIC_WS_URL` on the backend service after creation, then redeploy both services once.

## Post-deploy checks

After the first deploy:

1. Open the backend health endpoints:
   - `/health`
   - `/readyz`
2. Open the frontend site.
3. Verify:
   - registration and login
   - dashboard load
   - market intelligence load
   - advisory requests hit the external advisor service

## Free-tier limits

- Render free web services spin down after inactivity.
- The backend uses in-memory storage by default, so data resets on restart.
- AWS Bedrock requests are still billable if your external advisor or backend uses them.

## Upgrade path

When you want a durable deployment:

1. Add PostgreSQL and set `DATABASE_URL`.
2. Set `ALLOW_INMEMORY_DB_FALLBACK=false`.
3. Restrict `CORS_ORIGINS` to the frontend domain.
4. Add Redis if you want persistent cache or higher-throughput rate limiting.
5. Move secrets to Render secrets or AWS Secrets Manager.
