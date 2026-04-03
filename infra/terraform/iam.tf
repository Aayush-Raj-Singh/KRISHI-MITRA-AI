data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  count              = var.enable_ecs_service ? 1 : 0
  name               = "${var.project_name}-ecs-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  count      = var.enable_ecs_service ? 1 : 0
  role       = aws_iam_role.ecs_task_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  count              = var.enable_ecs_service ? 1 : 0
  name               = "${var.project_name}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "ecs_task_policy" {
  statement {
    sid     = "SecretsManagerAccess"
    actions = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [
      aws_secretsmanager_secret.app_secrets.arn
    ]
  }

  statement {
    sid = "BedrockInvoke"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream"
    ]
    resources = ["*"]
  }

  statement {
    sid       = "TranslateText"
    actions   = ["translate:TranslateText"]
    resources = ["*"]
  }

  statement {
    sid       = "SageMakerInvoke"
    actions   = ["sagemaker:InvokeEndpoint"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "ecs_task" {
  count  = var.enable_ecs_service ? 1 : 0
  name   = "${var.project_name}-ecs-task-policy"
  policy = data.aws_iam_policy_document.ecs_task_policy.json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task" {
  count      = var.enable_ecs_service ? 1 : 0
  role       = aws_iam_role.ecs_task[0].name
  policy_arn = aws_iam_policy.ecs_task[0].arn
}
