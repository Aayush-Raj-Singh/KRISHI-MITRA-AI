data "aws_cloudfront_cache_policy" "assets_optimized" {
  count = var.enable_cloudfront ? 1 : 0
  name  = "Managed-CachingOptimized"
}

resource "aws_cloudfront_origin_access_control" "assets" {
  count                             = var.enable_cloudfront ? 1 : 0
  name                              = "${var.project_name}-assets-oac"
  description                       = "OAC for KrishiMitra static assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
  count               = var.enable_cloudfront ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "KrishiMitra static assets CDN"
  default_root_object = ""
  price_class         = var.cloudfront_price_class
  aliases             = length(var.cloudfront_aliases) > 0 ? var.cloudfront_aliases : null

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "assets-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.assets[0].id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "assets-s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.assets_optimized[0].id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.cloudfront_acm_certificate_arn != "" ? var.cloudfront_acm_certificate_arn : null
    cloudfront_default_certificate = var.cloudfront_acm_certificate_arn == ""
    ssl_support_method             = var.cloudfront_acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = local.tags
}

data "aws_iam_policy_document" "assets_bucket_policy" {
  count = var.enable_cloudfront ? 1 : 0
  statement {
    sid     = "AllowCloudFrontRead"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.assets.arn}/*"
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.assets[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets_bucket_policy[0].json
}

resource "aws_route53_record" "assets_alias_a" {
  for_each = var.enable_cloudfront && var.enable_route53 ? toset(var.cloudfront_aliases) : []
  zone_id  = var.route53_zone_id
  name     = each.value
  type     = "A"

  alias {
    name                   = aws_cloudfront_distribution.assets[0].domain_name
    zone_id                = aws_cloudfront_distribution.assets[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "assets_alias_aaaa" {
  for_each = var.enable_cloudfront && var.enable_route53 ? toset(var.cloudfront_aliases) : []
  zone_id  = var.route53_zone_id
  name     = each.value
  type     = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.assets[0].domain_name
    zone_id                = aws_cloudfront_distribution.assets[0].hosted_zone_id
    evaluate_target_health = false
  }
}
