# Outputs for AWS EventBridge Scheduler Module

output "id" {
  description = "The ID of the EventBridge Schedule"
  value       = aws_scheduler_schedule.schedule.id
}

output "name" {
  description = "The name of the EventBridge Schedule"
  value       = aws_scheduler_schedule.schedule.name
}

output "arn" {
  description = "The ARN of the EventBridge Schedule"
  value       = aws_scheduler_schedule.schedule.arn
}

output "schedule" {
  description = "The schedule expression"
  value       = var.schedule
}

output "state" {
  description = "The state of the scheduler (ENABLED or DISABLED)"
  value       = aws_scheduler_schedule.schedule.state
}

output "scheduler_role_arn" {
  description = "The IAM role ARN used by the scheduler"
  value       = var.create_scheduler_role ? aws_iam_role.scheduler_role[0].arn : var.scheduler_role_arn
}

output "schedule_group_name" {
  description = "The schedule group name"
  value       = aws_scheduler_schedule.schedule.group_name
}
