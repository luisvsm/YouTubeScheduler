
locals {
  s3_origin_id = "myS3Origin"
}

variable "CertARN" {
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = "${var.ScheduleBucketName}.s3-website-us-east-1.amazonaws.com"
    origin_id   = local.s3_origin_id
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols = [
        "TLSv1",
        "TLSv1.1",
        "TLSv1.2",
      ]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  price_class = "PriceClass_200"

  tags = {
    Name        = "YouTubeScheduler"
    Environment = "production"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  aliases = [
    "schedule.quarantineshow.com",
  ]
  viewer_certificate {
    acm_certificate_arn      = var.CertARN
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.1_2016"
  }

}

output "CloudFrontDomain" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}
