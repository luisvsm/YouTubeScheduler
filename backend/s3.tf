variable "ScheduleBucketName" {
  type    = string
  default = ""
}

resource "aws_s3_bucket" "ScheduleWebsite" {
  bucket = var.ScheduleBucketName
  acl    = "public-read"
  versioning {
    enabled = true
  }

  tags = {
    Name        = "YouTubeScheduler"
    Environment = "production"
  }

  website {
    error_document = "index.html"
    index_document = "index.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["https://schedule.quarantineshow.com", "https://quarantineshow.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource":"arn:aws:s3:::${var.ScheduleBucketName}/*"
        }
    ]
}
EOF

}

