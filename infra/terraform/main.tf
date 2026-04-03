terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  access_key                  = var.aws_mock_mode ? "mock-access-key" : null
  secret_key                  = var.aws_mock_mode ? "mock-secret-key" : null
  token                       = var.aws_mock_mode ? "mock-session-token" : null
  skip_credentials_validation = var.aws_mock_mode
  skip_metadata_api_check     = var.aws_mock_mode
  skip_region_validation      = var.aws_mock_mode
  skip_requesting_account_id  = var.aws_mock_mode
}

provider "aws" {
  alias                       = "secondary"
  region                      = var.secondary_region != "" ? var.secondary_region : var.aws_region
  access_key                  = var.aws_mock_mode ? "mock-access-key" : null
  secret_key                  = var.aws_mock_mode ? "mock-secret-key" : null
  token                       = var.aws_mock_mode ? "mock-session-token" : null
  skip_credentials_validation = var.aws_mock_mode
  skip_metadata_api_check     = var.aws_mock_mode
  skip_region_validation      = var.aws_mock_mode
  skip_requesting_account_id  = var.aws_mock_mode
}

resource "aws_ecs_cluster" "krishimitra" {
  name = "${var.project_name}-cluster"
  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }
  tags = merge({ Project = var.project_name }, var.tags)
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}/api"
  retention_in_days = var.log_retention_days
  tags              = merge({ Project = var.project_name }, var.tags)
}

resource "aws_cloudwatch_event_rule" "weekly_price_refresh" {
  name                = "${var.project_name}-weekly-price-refresh"
  schedule_expression = "cron(0 2 ? * SUN *)"
  tags                = merge({ Project = var.project_name }, var.tags)
}

resource "aws_cloudwatch_event_rule" "quarterly_retrain" {
  name                = "${var.project_name}-quarterly-retrain"
  schedule_expression = "cron(30 1 1 JAN,APR,JUL,OCT ? *)"
  tags                = merge({ Project = var.project_name }, var.tags)
}

resource "aws_cloudwatch_event_rule" "daily_data_refresh" {
  name                = "${var.project_name}-daily-data-refresh"
  schedule_expression = "cron(0 1 * * ? *)"
  tags                = merge({ Project = var.project_name }, var.tags)
}

# EventBridge targets can point to API Gateway/Lambda/ECS task invocations.
# Keep target wiring configurable for hackathon and production environments.
resource "aws_cloudwatch_event_target" "weekly_target" {
  rule      = aws_cloudwatch_event_rule.weekly_price_refresh.name
  arn       = var.scheduler_target_arn
  role_arn  = var.scheduler_target_role_arn
  target_id = "weekly-price-refresh"
  input = jsonencode({
    operation = "weekly_price_refresh"
  })
}

resource "aws_cloudwatch_event_target" "quarterly_target" {
  rule      = aws_cloudwatch_event_rule.quarterly_retrain.name
  arn       = var.scheduler_target_arn
  role_arn  = var.scheduler_target_role_arn
  target_id = "quarterly-retrain"
  input = jsonencode({
    operation = "quarterly_full_retrain"
  })
}

resource "aws_cloudwatch_event_target" "daily_target" {
  rule      = aws_cloudwatch_event_rule.daily_data_refresh.name
  arn       = var.scheduler_target_arn
  role_arn  = var.scheduler_target_role_arn
  target_id = "daily-data-refresh"
  input = jsonencode({
    operation = "daily_external_data_refresh"
  })
}
