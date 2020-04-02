variable "app_zip" {
}

variable "app_version" {
}

variable "LambdaEnvVars" {
  type    = map(string)
  default = {}
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_lambda_function" "youtubeScheduler" {
  function_name = "YouTubeSchedulerUpdate"

  # The bucket name as created earlier with "aws s3api create-bucket"
  s3_bucket = "youtube.scheduler.deploy"
  s3_key    = "v${var.app_version}/${var.app_zip}"

  # "main" is the filename within the zip file (main.js) and "handler"
  # is the name of the property under which the handler function was
  # exported in that file.
  handler     = "index.handler"
  runtime     = "nodejs10.x"
  memory_size = "512"
  timeout     = 10

  role = aws_iam_role.lambda_exec.arn

  environment {
    variables = var.LambdaEnvVars
  }

  tags = {
    Name        = "YouTubeScheduler"
    Environment = "production"
  }
}
resource "aws_iam_policy" "lambda_policy" {
  name        = "serverless_YouTubeSchedulerUpdate_policy"
  path        = "/"
  description = "IAM policy for DynamoDB and logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject"
        ],
        "Resource": "arn:aws:s3:::${var.ScheduleBucketName}/*"
    },
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

# IAM role which dictates what other AWS services the Lambda function
# may access.
resource "aws_iam_role" "lambda_exec" {
  name               = "serverless_YouTubeSchedulerUpdate_role"
  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowLambdaExecute",
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow"
        }
    ]
}
EOF

  tags = {
    Name        = "YouTubeScheduler"
    Environment = "production"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.youtubeScheduler.function_name
  principal     = "apigateway.amazonaws.com"

  # The "/*/*" portion grants access from any method on any resource
  # within the API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.youtubeScheduler.execution_arn}/*/*"
}
