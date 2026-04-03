resource "aws_db_subnet_group" "postgres" {
  count       = var.enable_postgres && var.enable_network ? 1 : 0
  name        = "${var.project_name}-postgres-subnet"
  subnet_ids  = local.private_subnet_ids
  description = "PostgreSQL subnet group"
  tags        = local.tags
}

resource "aws_db_parameter_group" "postgres" {
  count  = var.enable_postgres ? 1 : 0
  name   = "${var.project_name}-postgres-params"
  family = var.postgres_parameter_family
  tags   = local.tags
}

resource "aws_db_instance" "postgres" {
  count                   = var.enable_postgres && var.enable_network ? 1 : 0
  identifier              = "${var.project_name}-postgres"
  engine                  = "postgres"
  engine_version          = var.postgres_engine_version
  instance_class          = var.postgres_instance_class
  allocated_storage       = var.postgres_allocated_storage
  max_allocated_storage   = var.postgres_max_allocated_storage
  storage_type            = var.postgres_storage_type
  db_name                 = var.postgres_db_name
  username                = var.postgres_master_username
  password                = var.postgres_master_password
  port                    = var.postgres_port
  multi_az                = var.postgres_multi_az
  publicly_accessible     = var.postgres_publicly_accessible
  backup_retention_period = var.postgres_backup_retention_days
  apply_immediately       = var.postgres_apply_immediately
  skip_final_snapshot     = var.postgres_skip_final_snapshot
  deletion_protection     = var.postgres_deletion_protection
  db_subnet_group_name    = aws_db_subnet_group.postgres[0].name
  vpc_security_group_ids  = [aws_security_group.postgres[0].id]
  parameter_group_name    = aws_db_parameter_group.postgres[0].name
  storage_encrypted       = true
  kms_key_id              = local.kms_key_arn

  tags = local.tags
}
