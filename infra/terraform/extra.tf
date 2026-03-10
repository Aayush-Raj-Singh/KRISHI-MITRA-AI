resource "aws_s3_bucket" "assets" {
  bucket = var.assets_bucket_name
  tags = {
    Project = var.project_name
    Purpose = "static-assets"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.project_name}-app-secrets"
  description = "Application secrets for KrishiMitra-AI"
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-http-api"
  protocol_type = "HTTP"
  description   = "API Gateway front door for KrishiMitra-AI"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-api"
  image_tag_mutability = "MUTABLE"
}

resource "aws_s3_bucket" "cicd_artifacts" {
  count  = var.enable_cicd ? 1 : 0
  bucket = var.cicd_artifacts_bucket
  tags = {
    Project = var.project_name
    Purpose = "cicd-artifacts"
  }
}

resource "aws_codebuild_project" "app_build" {
  count         = var.enable_cicd ? 1 : 0
  name          = "${var.project_name}-build"
  service_role  = var.codebuild_service_role_arn
  build_timeout = 30

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
  }

  source {
    type            = "CODEPIPELINE"
    buildspec       = "infra/buildspec.yml"
  }
}

resource "aws_codepipeline" "app_pipeline" {
  count    = var.enable_cicd ? 1 : 0
  name     = "${var.project_name}-pipeline"
  role_arn = var.codepipeline_service_role_arn

  artifact_store {
    location = aws_s3_bucket.cicd_artifacts[count.index].bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn        = var.codestar_connection_arn
        FullRepositoryId     = "${var.repository_owner}/${var.repository_name}"
        BranchName           = var.repository_branch
        OutputArtifactFormat = "CODE_ZIP"
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.app_build[count.index].name
      }
    }
  }
}
