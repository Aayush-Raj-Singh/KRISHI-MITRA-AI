`apps/backend/microservices` contains deployable FastAPI entrypoints for bounded service surfaces.

- `app/services` remains the backend's internal application service layer.
- `microservices/*/main.py` exposes thin API compositions for containerized deployment targets.
- Container builds use `apps/backend/microservices/Dockerfile`.
