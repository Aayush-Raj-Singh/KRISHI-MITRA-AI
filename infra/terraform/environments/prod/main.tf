terraform {
  required_version = ">= 1.5.0"
}

locals {
  environment = "prod"
}

module "platform" {
  source = "../.."

  project_name              = "${var.project_name}-${local.environment}"
  aws_region                = var.aws_region
  secondary_region          = var.secondary_region
  aws_mock_mode             = var.aws_mock_mode
  scheduler_target_arn      = var.scheduler_target_arn
  scheduler_target_role_arn = var.scheduler_target_role_arn
  postgres_master_password  = var.postgres_master_password
  enable_network            = var.enable_network
  enable_nat_gateway        = var.enable_nat_gateway
  enable_alb                = var.enable_alb
  enable_ecs_service        = var.enable_ecs_service
  enable_monitoring         = var.enable_monitoring
  enable_postgres           = var.enable_postgres
  enable_redis              = var.enable_redis
  enable_cloudfront         = var.enable_cloudfront
  enable_route53            = var.enable_route53
  enable_cicd               = var.enable_cicd
  enable_models_bucket      = var.enable_models_bucket
  enable_apigw_integration  = var.enable_apigw_integration
  enable_waf                = var.enable_waf
  enable_multi_region       = var.enable_multi_region
  tags = merge(var.tags, {
    Environment = local.environment
  })
}
