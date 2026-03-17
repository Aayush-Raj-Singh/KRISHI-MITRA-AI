resource "aws_kms_key" "app" {
  count                   = var.enable_kms ? 1 : 0
  description             = "KMS key for KrishiMitra-AI secrets and data encryption."
  deletion_window_in_days = var.kms_key_deletion_window_in_days
  enable_key_rotation     = true
  tags                    = local.tags
}

resource "aws_kms_alias" "app" {
  count         = var.enable_kms ? 1 : 0
  name          = "alias/${var.project_name}-kms"
  target_key_id = aws_kms_key.app[0].key_id
}
