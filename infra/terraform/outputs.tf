output "ecs_cluster_name" {
  value       = aws_ecs_cluster.krishimitra.name
  description = "ECS cluster name."
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

output "assets_bucket" {
  value       = aws_s3_bucket.assets.bucket
  description = "S3 bucket for static assets."
}

output "api_gateway_endpoint" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "HTTP API Gateway endpoint."
}

output "secrets_manager_name" {
  value       = aws_secretsmanager_secret.app_secrets.name
  description = "Secrets Manager secret name."
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "ECR repository URL for API images."
}
