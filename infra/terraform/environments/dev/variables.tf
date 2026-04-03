variable "project_name" {
  type        = string
  description = "Project prefix for the development environment."
  default     = "krishimitra"
}

variable "aws_region" {
  type        = string
  description = "AWS region for development infrastructure."
  default     = "us-east-1"
}

variable "secondary_region" {
  type        = string
  description = "Optional secondary AWS region."
  default     = ""
}

variable "aws_mock_mode" {
  type        = bool
  description = "Enable offline-friendly provider settings for local validation."
  default     = true
}

variable "scheduler_target_arn" {
  type        = string
  description = "Target ARN invoked by EventBridge schedules."
}

variable "scheduler_target_role_arn" {
  type        = string
  description = "IAM role ARN used by EventBridge to invoke targets."
}

variable "postgres_master_password" {
  type        = string
  description = "RDS master password used when PostgreSQL provisioning is enabled."
  sensitive   = true
}

variable "enable_network" {
  type    = bool
  default = false
}

variable "enable_nat_gateway" {
  type    = bool
  default = false
}

variable "enable_alb" {
  type    = bool
  default = false
}

variable "enable_ecs_service" {
  type    = bool
  default = false
}

variable "enable_monitoring" {
  type    = bool
  default = false
}

variable "enable_postgres" {
  type    = bool
  default = false
}

variable "enable_redis" {
  type    = bool
  default = false
}

variable "enable_cloudfront" {
  type    = bool
  default = false
}

variable "enable_route53" {
  type    = bool
  default = false
}

variable "enable_cicd" {
  type    = bool
  default = false
}

variable "enable_models_bucket" {
  type    = bool
  default = false
}

variable "enable_apigw_integration" {
  type    = bool
  default = false
}

variable "enable_waf" {
  type    = bool
  default = false
}

variable "enable_multi_region" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
