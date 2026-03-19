# Outputs for AWS CodeBuild configuration

output "codebuild_role_arn" {
  description = "CodeBuild service role ARN"
  value       = aws_iam_role.codebuild_role.arn
}

output "github_connection_arn" {
  description = "GitHub CodeStar connection ARN"
  value       = aws_codestarconnections_connection.github.arn
}

output "github_connection_status" {
  description = "GitHub CodeStar connection status (must be AVAILABLE after manual authorization)"
  value       = aws_codestarconnections_connection.github.connection_status
}

output "codebuild_projects" {
  description = "Map of service names to CodeBuild project ARNs"
  value = {
    for name, project in aws_codebuild_project.services :
    name => project.arn
  }
}

output "codebuild_project_names" {
  description = "List of CodeBuild project names"
  value       = [for name, project in aws_codebuild_project.services : project.name]
}

output "webhook_urls" {
  description = "Webhook URLs for GitHub integration"
  value = {
    for name, webhook in aws_codebuild_webhook.services :
    name => webhook.payload_url
  }
}

output "setup_instructions" {
  description = "Post-apply setup instructions"
  value = <<-EOT
    ============================================================
    AWS CodeBuild Setup Complete!
    ============================================================

    REQUIRED: Manual steps to complete setup:

    1. Authorize GitHub Connection:
       - Go to AWS Console > Developer Tools > Connections
       - Find 'unified-trading-github' connection
       - Click 'Update pending connection' and authorize with GitHub

    2. Set GitHub Token Secret:
       aws secretsmanager put-secret-value \
         --secret-id github-token \
         --secret-string 'YOUR_GITHUB_TOKEN'

    3. Ensure buildspec.aws.yaml exists in each service repo

    4. Test a build:
       aws codebuild start-build --project-name instruments-service

    ============================================================
  EOT
}
