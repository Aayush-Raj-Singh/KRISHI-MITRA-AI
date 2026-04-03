variable "project_name" {
  type        = string
  description = "Project prefix for the production environment."
  default     = "krishimitra"
}

variable "aws_region" {
  type        = string
  description = "Primary AWS region for production."
  default     = "us-east-1"
}

variable "secondary_region" {
  type        = string
  description = "Optional secondary AWS region."
  default     = ""
}

variable "aws_mock_mode" {
  type        = bool
  description = "Keep false for live production plans."
  default     = false
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
  description = "RDS master password."
  sensitive   = true
}

variable "enable_network" {
  type    = bool
  default = true
}

variable "enable_nat_gateway" {
  type    = bool
  default = true
}

variable "enable_alb" {
  type    = bool
  default = true
}

variable "enable_ecs_service" {
  type    = bool
  default = true
}

variable "enable_monitoring" {
  type    = bool
  default = true
}

variable "enable_postgres" {
  type    = bool
  default = true
}

variable "enable_redis" {
  type    = bool
  default = true
}

variable "enable_cloudfront" {
  type    = bool
  default = true
}

variable "enable_route53" {
  type    = bool
  default = true
}

variable "enable_cicd" {
  type    = bool
  default = true
}

variable "enable_models_bucket" {
  type    = bool
  default = true
}

variable "enable_apigw_integration" {
  type    = bool
  default = true
}

variable "enable_waf" {
  type    = bool
  default = true
}

variable "enable_multi_region" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
