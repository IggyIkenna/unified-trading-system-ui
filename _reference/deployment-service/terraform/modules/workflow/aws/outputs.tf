# Outputs for AWS Step Functions Module

output "workflow_id" {
  description = "The ID (ARN) of the Step Functions state machine"
  value       = aws_sfn_state_machine.workflow.arn
}

output "workflow_name" {
  description = "The name of the Step Functions state machine"
  value       = aws_sfn_state_machine.workflow.name
}

output "workflow_arn" {
  description = "The ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.workflow.arn
}

output "workflow_revision_id" {
  description = "The revision ID of the state machine"
  value       = aws_sfn_state_machine.workflow.revision_id
}

output "workflow_status" {
  description = "The current status of the state machine"
  value       = aws_sfn_state_machine.workflow.status
}

output "role_arn" {
  description = "The IAM role ARN used by Step Functions"
  value       = var.create_role ? aws_iam_role.step_functions_role[0].arn : var.role_arn
}

output "log_group_arn" {
  description = "The CloudWatch Log Group ARN"
  value       = var.create_log_group ? aws_cloudwatch_log_group.workflow_logs[0].arn : var.log_group_arn
}

output "scheduler_job_name" {
  description = "The name of the EventBridge Scheduler (if created)"
  value       = var.schedule != null ? aws_scheduler_schedule.trigger[0].name : null
}

output "scheduler_arn" {
  description = "The ARN of the EventBridge Scheduler (if created)"
  value       = var.schedule != null ? aws_scheduler_schedule.trigger[0].arn : null
}

output "execution_url" {
  description = "URL to execute the workflow manually (AWS Console)"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/states/home?region=${data.aws_region.current.name}#/statemachines/view/${aws_sfn_state_machine.workflow.arn}"
}
