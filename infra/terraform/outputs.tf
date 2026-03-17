output "ecs_cluster_name" {
  value       = aws_ecs_cluster.krishimitra.name
  description = "ECS cluster name."
}

output "vpc_id" {
  value       = try(aws_vpc.main[0].id, null)
  description = "VPC ID."
}

output "public_subnet_ids" {
  value       = try(aws_subnet.public[*].id, [])
  description = "Public subnet IDs."
}

output "private_subnet_ids" {
  value       = try(aws_subnet.private[*].id, [])
  description = "Private subnet IDs."
}

output "scheduler_rules" {
  value = {
    weekly    = aws_cloudwatch_event_rule.weekly_price_refresh.name
    quarterly = aws_cloudwatch_event_rule.quarterly_retrain.name
    daily     = aws_cloudwatch_event_rule.daily_data_refresh.name
  }
  description = "EventBridge scheduler rule names."
}

output "api_log_group" {
  value       = aws_cloudwatch_log_group.api.name
  description = "CloudWatch log group for API tasks."
}

output "alb_dns_name" {
  value       = try(aws_lb.api[0].dns_name, null)
  description = "ALB DNS name."
}

output "alb_http_endpoint" {
  value       = local.alb_endpoint
  description = "ALB HTTP endpoint."
}

output "alb_https_endpoint" {
  value       = local.alb_https_endpoint
  description = "ALB HTTPS endpoint (when enabled)."
}

output "ecs_service_name" {
  value       = try(aws_ecs_service.api[0].name, null)
  description = "ECS service name."
}

output "redis_primary_endpoint" {
  value       = try(aws_elasticache_replication_group.redis[0].primary_endpoint_address, null)
  description = "Redis primary endpoint."
}

output "postgres_endpoint" {
  value       = try(aws_db_instance.postgres[0].endpoint, null)
  description = "PostgreSQL endpoint."
}

output "postgres_port" {
  value       = var.postgres_port
  description = "PostgreSQL port."
}

output "postgres_db_name" {
  value       = var.postgres_db_name
  description = "PostgreSQL database name."
}

output "assets_bucket" {
  value       = aws_s3_bucket.assets.bucket
  description = "S3 bucket for static assets."
}

output "models_bucket" {
  value       = try(aws_s3_bucket.models[0].bucket, null)
  description = "S3 bucket for ML models and datasets."
}

output "cloudfront_domain_name" {
  value       = try(aws_cloudfront_distribution.assets[0].domain_name, null)
  description = "CloudFront distribution domain name for assets."
}

output "cloudfront_distribution_id" {
  value       = try(aws_cloudfront_distribution.assets[0].id, null)
  description = "CloudFront distribution ID."
}

output "waf_web_acl_arn" {
  value       = try(aws_wafv2_web_acl.alb[0].arn, null)
  description = "WAFv2 Web ACL ARN."
}

output "route53_primary_record" {
  value       = try(aws_route53_record.primary[0].fqdn, null)
  description = "Route53 failover primary record."
}

output "api_gateway_endpoint" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "HTTP API Gateway endpoint."
}

output "secrets_manager_name" {
  value       = aws_secretsmanager_secret.app_secrets.name
  description = "Secrets Manager secret name."
}

output "secrets_manager_arn" {
  value       = aws_secretsmanager_secret.app_secrets.arn
  description = "Secrets Manager secret ARN."
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "ECR repository URL for API images."
}
