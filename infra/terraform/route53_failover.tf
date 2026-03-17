resource "aws_route53_health_check" "primary" {
  count             = var.enable_multi_region && local.alb_enabled ? 1 : 0
  fqdn              = aws_lb.api[0].dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  request_interval  = 30
  failure_threshold = 3
}

resource "aws_route53_record" "primary" {
  count          = var.enable_multi_region && local.alb_enabled && var.primary_region_domain != "" && var.route53_zone_id != "" ? 1 : 0
  zone_id        = var.route53_zone_id
  name           = var.primary_region_domain
  type           = "A"
  set_identifier = "primary"

  alias {
    name                   = aws_lb.api[0].dns_name
    zone_id                = aws_lb.api[0].zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary[0].id
}

resource "aws_route53_record" "secondary" {
  count          = var.enable_multi_region && var.primary_region_domain != "" && var.route53_zone_id != "" && var.secondary_region_lb_dns != "" && var.secondary_region_lb_zone_id != "" ? 1 : 0
  zone_id        = var.route53_zone_id
  name           = var.primary_region_domain
  type           = "A"
  set_identifier = "secondary"

  alias {
    name                   = var.secondary_region_lb_dns
    zone_id                = var.secondary_region_lb_zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "SECONDARY"
  }
}
