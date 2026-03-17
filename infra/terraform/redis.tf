resource "aws_elasticache_subnet_group" "redis" {
  count       = var.enable_redis && var.enable_network ? 1 : 0
  name        = "${var.project_name}-redis-subnet"
  subnet_ids  = local.private_subnet_ids
  description = "Redis subnet group"
  tags        = local.tags
}

resource "aws_elasticache_replication_group" "redis" {
  count                      = var.enable_redis && var.enable_network ? 1 : 0
  replication_group_id       = "${var.project_name}-redis"
  description                = "KrishiMitra-AI Redis"
  engine                     = "redis"
  engine_version             = var.redis_engine_version
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_num_cache_clusters
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis[0].name
  security_group_ids         = [aws_security_group.redis[0].id]
  automatic_failover_enabled = var.redis_num_cache_clusters > 1
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true
  kms_key_id                 = local.kms_key_arn
  multi_az_enabled           = var.redis_num_cache_clusters > 1
  tags                       = local.tags
}
