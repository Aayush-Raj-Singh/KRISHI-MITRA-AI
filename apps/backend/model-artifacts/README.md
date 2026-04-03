Production model artifacts should live outside the tracked source tree.

The backend now prefers `MODEL_ARTIFACTS_ROOT` for generated or deployed artifacts:

- `crop_model/crop_model.joblib`
- `price_model/artifacts/*`
- `price_model/models_metadata.json`
- `disease_model/plantvillage_efficientnet_b0.pt`

Repo-tracked artifacts under `apps/backend/ml` and `apps/backend/app/ml` are still supported as development fallbacks so local behavior does not break.
