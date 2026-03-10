variable "project_name" {
  type        = string
  description = "Project prefix for AWS resources."
  default     = "krishimitra"
}

variable "aws_region" {
  type        = string
  description = "AWS region."
  default     = "us-east-1"
}

variable "scheduler_target_arn" {
  type        = string
  description = "Target ARN invoked by EventBridge schedules."
}

variable "scheduler_target_role_arn" {
  type        = string
  description = "IAM role ARN used by EventBridge to invoke target."
}

variable "assets_bucket_name" {
  type        = string
  description = "S3 bucket for static assets."
  default     = "krishimitra-assets"
}

variable "enable_cicd" {
  type        = bool
  description = "Enable AWS CodePipeline/CodeBuild resources."
  default     = false
}

variable "cicd_artifacts_bucket" {
  type        = string
  description = "S3 bucket for CI/CD artifacts."
  default     = "krishimitra-cicd-artifacts"
}

variable "codestar_connection_arn" {
  type        = string
  description = "CodeStar Connections ARN for source integration."
  default     = ""
}

variable "repository_owner" {
  type        = string
  description = "Repository owner for CodePipeline source."
  default     = ""
}

variable "repository_name" {
  type        = string
  description = "Repository name for CodePipeline source."
  default     = ""
}

variable "repository_branch" {
  type        = string
  description = "Repository branch for CodePipeline source."
  default     = "main"
}

variable "codebuild_service_role_arn" {
  type        = string
  description = "IAM role ARN for CodeBuild."
  default     = ""
}

variable "codepipeline_service_role_arn" {
  type        = string
  description = "IAM role ARN for CodePipeline."
  default     = ""
}
