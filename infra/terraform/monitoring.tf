resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count               = var.enable_monitoring && local.alb_enabled ? 1 : 0
  alarm_name          = "${var.project_name}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "ALB 5xx responses detected"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  treat_missing_data  = "notBreaching"
  dimensions = {
    LoadBalancer = aws_lb.api[0].arn_suffix
  }
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  count               = var.enable_monitoring && local.alb_enabled ? 1 : 0
  alarm_name          = "${var.project_name}-alb-target-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "ALB target 5xx responses detected"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  treat_missing_data  = "notBreaching"
  dimensions = {
    LoadBalancer = aws_lb.api[0].arn_suffix
    TargetGroup  = aws_lb_target_group.api[0].arn_suffix
  }
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  count               = var.enable_monitoring && local.ecs_enabled ? 1 : 0
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "ECS CPU utilization high"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  treat_missing_data  = "notBreaching"
  dimensions = {
    ClusterName = aws_ecs_cluster.krishimitra.name
    ServiceName = aws_ecs_service.api[0].name
  }
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  count               = var.enable_monitoring && local.ecs_enabled ? 1 : 0
  alarm_name          = "${var.project_name}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = var.alarm_memory_threshold
  alarm_description   = "ECS memory utilization high"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  treat_missing_data  = "notBreaching"
  dimensions = {
    ClusterName = aws_ecs_cluster.krishimitra.name
    ServiceName = aws_ecs_service.api[0].name
  }
  tags = local.tags
}
