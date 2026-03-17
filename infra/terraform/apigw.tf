resource "aws_apigatewayv2_integration" "alb_proxy" {
  count                  = var.enable_apigw_integration && local.alb_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = local.alb_https_endpoint
  payload_format_version = "1.0"
  timeout_milliseconds   = 29000
}

resource "aws_apigatewayv2_route" "proxy" {
  count     = var.enable_apigw_integration && local.alb_enabled ? 1 : 0
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.alb_proxy[0].id}"
}

resource "aws_apigatewayv2_route" "root" {
  count     = var.enable_apigw_integration && local.alb_enabled ? 1 : 0
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.alb_proxy[0].id}"
}
