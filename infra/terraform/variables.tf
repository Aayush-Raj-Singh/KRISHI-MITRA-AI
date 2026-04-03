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

variable "aws_mock_mode" {
  type        = bool
  description = "Enable offline-friendly provider settings for local validation and dry-run planning."
  default     = false
}

variable "secondary_region" {
  type        = string
  description = "Secondary AWS region for multi-region deployments."
  default     = ""
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

variable "enable_models_bucket" {
  type        = bool
  description = "Provision S3 bucket for ML models and datasets."
  default     = false
}

variable "models_bucket_name" {
  type        = string
  description = "S3 bucket for ML models and datasets."
  default     = "krishimitra-models"
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

variable "tags" {
  type        = map(string)
  description = "Tags applied to created resources."
  default     = {}
}

variable "enable_network" {
  type        = bool
  description = "Provision VPC, subnets, routes, and IGW."
  default     = true
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Provision NAT gateway for private subnet egress."
  default     = true
}

variable "enable_alb" {
  type        = bool
  description = "Provision an Application Load Balancer."
  default     = true
}

variable "enable_https_listener" {
  type        = bool
  description = "Enable HTTPS listener on the ALB (requires acm_certificate_arn)."
  default     = false
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for HTTPS listener."
  default     = ""
  validation {
    condition     = !(var.enable_https_listener && var.acm_certificate_arn == "")
    error_message = "acm_certificate_arn must be provided when enable_https_listener is true."
  }
}

variable "enable_ecs_service" {
  type        = bool
  description = "Provision ECS task definition and service."
  default     = true
}

variable "enable_container_insights" {
  type        = bool
  description = "Enable ECS cluster container insights."
  default     = true
}

variable "enable_apigw_integration" {
  type        = bool
  description = "Attach API Gateway HTTP API routes to the ALB."
  default     = false
}

variable "enable_redis" {
  type        = bool
  description = "Provision ElastiCache Redis replication group."
  default     = false
}

variable "enable_postgres" {
  type        = bool
  description = "Provision PostgreSQL RDS instance."
  default     = true
}

variable "enable_monitoring" {
  type        = bool
  description = "Provision CloudWatch alarms for ECS/ALB."
  default     = true
}

variable "enable_cloudfront" {
  type        = bool
  description = "Provision CloudFront distribution for static assets."
  default     = false
}

variable "cloudfront_price_class" {
  type        = string
  description = "CloudFront price class."
  default     = "PriceClass_100"
}

variable "cloudfront_aliases" {
  type        = list(string)
  description = "Optional CNAMEs for CloudFront distribution."
  default     = []
}

variable "cloudfront_acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN (us-east-1) for CloudFront custom domains."
  default     = ""
}

variable "enable_route53" {
  type        = bool
  description = "Create Route53 records for CloudFront aliases."
  default     = false
}

variable "enable_kms" {
  type        = bool
  description = "Create a KMS key for secrets/encryption-at-rest where supported."
  default     = false
}

variable "kms_key_deletion_window_in_days" {
  type        = number
  description = "KMS key deletion window."
  default     = 7
}

variable "log_retention_days" {
  type        = number
  description = "CloudWatch log retention (days)."
  default     = 14
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC."
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets."
  default     = ["10.20.0.0/24", "10.20.1.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets."
  default     = ["10.20.10.0/24", "10.20.11.0/24"]
}

variable "alb_ingress_cidrs" {
  type        = list(string)
  description = "CIDR blocks allowed to reach the ALB."
  default     = ["0.0.0.0/0"]
}

variable "app_port" {
  type        = number
  description = "Container port for the backend API."
  default     = 8000
}

variable "health_check_path" {
  type        = string
  description = "ALB target group health check path."
  default     = "/health"
}

variable "ecs_task_cpu" {
  type        = number
  description = "ECS task CPU units."
  default     = 512
}

variable "ecs_task_memory" {
  type        = number
  description = "ECS task memory (MiB)."
  default     = 1024
}

variable "ecs_desired_count" {
  type        = number
  description = "Desired ECS service tasks."
  default     = 2
}

variable "ecs_assign_public_ip" {
  type        = bool
  description = "Assign public IP to ECS tasks (useful for no NAT gateway)."
  default     = false
}

variable "container_image" {
  type        = string
  description = "Container image for API service. Defaults to ECR repository URL with :latest."
  default     = ""
}

variable "container_environment" {
  type        = map(string)
  description = "Environment variables passed to the container."
  default     = {}
}

variable "container_secrets" {
  type        = list(object({ name = string, valueFrom = string }))
  description = "Secrets injected into container (name/valueFrom)."
  default     = []
}

variable "redis_node_type" {
  type        = string
  description = "ElastiCache node type."
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  type        = string
  description = "ElastiCache Redis engine version."
  default     = "7.0"
}

variable "redis_num_cache_clusters" {
  type        = number
  description = "Number of cache nodes (1 enables primary only)."
  default     = 1
}

variable "postgres_port" {
  type        = number
  description = "PostgreSQL port."
  default     = 5432
}

variable "postgres_engine_version" {
  type        = string
  description = "PostgreSQL engine version."
  default     = "16.2"
}

variable "postgres_parameter_family" {
  type        = string
  description = "PostgreSQL parameter group family."
  default     = "postgres16"
}

variable "postgres_instance_class" {
  type        = string
  description = "RDS instance class for PostgreSQL."
  default     = "db.t3.medium"
}

variable "postgres_allocated_storage" {
  type        = number
  description = "Allocated storage (GiB)."
  default     = 50
}

variable "postgres_max_allocated_storage" {
  type        = number
  description = "Max allocated storage (GiB) for autoscaling."
  default     = 200
}

variable "postgres_storage_type" {
  type        = string
  description = "Storage type (gp2, gp3, io1)."
  default     = "gp3"
}

variable "postgres_master_username" {
  type        = string
  description = "PostgreSQL master username."
  default     = "krishimitra_admin"
}

variable "postgres_master_password" {
  type        = string
  description = "PostgreSQL master password."
  sensitive   = true
  default     = ""
  validation {
    condition     = !(var.enable_postgres && var.postgres_master_password == "")
    error_message = "postgres_master_password must be set when enable_postgres is true."
  }
}

variable "postgres_db_name" {
  type        = string
  description = "Primary application database name."
  default     = "krishimitra"
}

variable "postgres_multi_az" {
  type        = bool
  description = "Enable multi-AZ."
  default     = false
}

variable "postgres_publicly_accessible" {
  type        = bool
  description = "Allow public access to the database."
  default     = false
}

variable "postgres_backup_retention_days" {
  type        = number
  description = "Backup retention days."
  default     = 7
}

variable "postgres_apply_immediately" {
  type        = bool
  description = "Apply changes immediately."
  default     = true
}

variable "postgres_skip_final_snapshot" {
  type        = bool
  description = "Skip final snapshot on destroy."
  default     = true
}

variable "postgres_deletion_protection" {
  type        = bool
  description = "Enable deletion protection."
  default     = false
}

variable "app_secrets_json" {
  type        = string
  description = "Optional JSON payload to store in Secrets Manager."
  sensitive   = true
  default     = ""
}

variable "alarm_sns_topic_arn" {
  type        = string
  description = "SNS topic ARN for CloudWatch alarms."
  default     = ""
}

variable "alarm_cpu_threshold" {
  type        = number
  description = "CPU utilization alarm threshold."
  default     = 80
}

variable "alarm_memory_threshold" {
  type        = number
  description = "Memory utilization alarm threshold."
  default     = 80
}

variable "enable_waf" {
  type        = bool
  description = "Enable AWS WAFv2 protections for ALB."
  default     = false
}

variable "waf_rate_limit" {
  type        = number
  description = "WAF rate limit (requests per 5 minutes per IP)."
  default     = 2000
}

variable "enable_multi_region" {
  type        = bool
  description = "Enable multi-region DNS failover setup."
  default     = false
}

variable "secondary_region_lb_dns" {
  type        = string
  description = "DNS name of the secondary region ALB."
  default     = ""
}

variable "secondary_region_lb_zone_id" {
  type        = string
  description = "Hosted zone ID of the secondary region ALB."
  default     = ""
}

variable "primary_region_domain" {
  type        = string
  description = "Primary application domain (e.g., api.krishimitra.ai)."
  default     = ""
}

variable "route53_zone_id" {
  type        = string
  description = "Route53 hosted zone ID for application DNS records."
  default     = ""
}
