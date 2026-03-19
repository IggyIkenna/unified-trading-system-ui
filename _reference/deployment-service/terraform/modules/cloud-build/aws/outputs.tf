# Outputs for AWS CodeBuild Module

output "project_id" {
  description = "CodeBuild project ID"
  value       = aws_codebuild_project.build.id
}

output "project_arn" {
  description = "CodeBuild project ARN"
  value       = aws_codebuild_project.build.arn
}

output "project_name" {
  description = "CodeBuild project name"
  value       = aws_codebuild_project.build.name
}

output "webhook_url" {
  description = "GitHub webhook URL (if enabled)"
  value       = var.github_webhook_enabled ? aws_codebuild_webhook.github[0].payload_url : ""
}

output "role_arn" {
  description = "IAM role ARN used by CodeBuild"
  value       = var.create_role ? aws_iam_role.codebuild_role[0].arn : var.role_arn
}
