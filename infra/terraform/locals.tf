locals {
  tags = merge({ Project = var.project_name }, var.tags)

  vpc_id             = try(aws_vpc.main[0].id, "")
  public_subnet_ids  = try(aws_subnet.public[*].id, [])
  private_subnet_ids = try(aws_subnet.private[*].id, [])

  kms_key_arn = var.enable_kms ? try(aws_kms_key.app[0].arn, null) : null

  alb_enabled = var.enable_network && var.enable_alb
  ecs_enabled = var.enable_ecs_service && local.alb_enabled

  api_image = var.container_image != "" ? var.container_image : "${aws_ecr_repository.api.repository_url}:latest"

  alb_endpoint = local.alb_enabled ? "http://${aws_lb.api[0].dns_name}" : ""

  alb_https_endpoint = (
    local.alb_enabled && var.enable_https_listener && var.acm_certificate_arn != ""
  ) ? "https://${aws_lb.api[0].dns_name}" : local.alb_endpoint

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

}
