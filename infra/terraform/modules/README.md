Reusable Terraform modules can live under this directory as the infrastructure stack is broken into smaller domain-specific units.

Today, `infra/terraform` remains the validated shared platform module, and the environment wrappers under `infra/terraform/environments/*` compose it with environment-specific inputs.
