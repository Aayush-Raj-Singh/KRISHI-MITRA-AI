resource "aws_security_group" "alb" {
  count       = local.alb_enabled ? 1 : 0
  name        = "${var.project_name}-alb-sg"
  description = "ALB security group"
  vpc_id      = local.vpc_id
  tags        = local.tags
}

resource "aws_security_group_rule" "alb_http" {
  count             = local.alb_enabled ? 1 : 0
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = var.alb_ingress_cidrs
  security_group_id = aws_security_group.alb[0].id
}

resource "aws_security_group_rule" "alb_https" {
  count             = local.alb_enabled && var.enable_https_listener ? 1 : 0
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.alb_ingress_cidrs
  security_group_id = aws_security_group.alb[0].id
}

resource "aws_security_group_rule" "alb_egress" {
  count             = local.alb_enabled ? 1 : 0
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb[0].id
}

resource "aws_security_group" "ecs_service" {
  count       = local.ecs_enabled ? 1 : 0
  name        = "${var.project_name}-ecs-sg"
  description = "ECS service security group"
  vpc_id      = local.vpc_id
  tags        = local.tags
}

resource "aws_security_group_rule" "ecs_ingress" {
  count                    = local.ecs_enabled ? 1 : 0
  type                     = "ingress"
  from_port                = var.app_port
  to_port                  = var.app_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb[0].id
  security_group_id        = aws_security_group.ecs_service[0].id
}

resource "aws_security_group_rule" "ecs_egress" {
  count             = local.ecs_enabled ? 1 : 0
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs_service[0].id
}

resource "aws_security_group" "redis" {
  count       = var.enable_redis && var.enable_network ? 1 : 0
  name        = "${var.project_name}-redis-sg"
  description = "Redis security group"
  vpc_id      = local.vpc_id
  tags        = local.tags
}

resource "aws_security_group_rule" "redis_ingress" {
  count                    = var.enable_redis && local.ecs_enabled ? 1 : 0
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_service[0].id
  security_group_id        = aws_security_group.redis[0].id
}

resource "aws_security_group_rule" "redis_egress" {
  count             = var.enable_redis && var.enable_network ? 1 : 0
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.redis[0].id
}

resource "aws_security_group" "postgres" {
  count       = var.enable_postgres && var.enable_network ? 1 : 0
  name        = "${var.project_name}-postgres-sg"
  description = "PostgreSQL security group"
  vpc_id      = local.vpc_id
  tags        = local.tags
}

resource "aws_security_group_rule" "postgres_ingress" {
  count                    = var.enable_postgres && local.ecs_enabled ? 1 : 0
  type                     = "ingress"
  from_port                = var.postgres_port
  to_port                  = var.postgres_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_service[0].id
  security_group_id        = aws_security_group.postgres[0].id
}

resource "aws_security_group_rule" "postgres_egress" {
  count             = var.enable_postgres && var.enable_network ? 1 : 0
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.postgres[0].id
}
