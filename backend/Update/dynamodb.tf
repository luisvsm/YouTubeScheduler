resource "aws_dynamodb_table" "YouTubeScheduler" {
  name           = "YouTubeScheduler-Schedule"
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "ScheduleID"

  attribute {
    name = "ScheduleID"
    type = "S"
  }

  tags = {
    Name        = "YouTubeScheduler"
    Environment = "production"
  }
}
