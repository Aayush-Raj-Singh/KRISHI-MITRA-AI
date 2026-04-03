# Crop Model Artifacts

This directory contains the canonical local inference bundle for crop recommendation.

Tracked artifacts:

- `crop_model.joblib`: required runtime model bundle used by `app/services/crop_service.py`
- `crop_model_metadata.json`: model metadata/version info
- `crop_training_data.csv`: base training dataset
- `crop_training_data_*.csv`: season-specific training datasets used by retraining pipelines
- `model_stub.json`: lightweight stub metadata for fallback/testing workflows

Repository policy:

- keep the canonical runtime model and metadata under version control for local/demo reliability
- do not commit temporary exports, backup bundles, or experimental retraining outputs
- publish larger production model snapshots to the Terraform-managed models bucket when `enable_models_bucket=true`

Ignored patterns for this directory are defined in the repo root `.gitignore`.
