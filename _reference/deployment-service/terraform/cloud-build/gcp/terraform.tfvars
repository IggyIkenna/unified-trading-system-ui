# Terraform variables for Cloud Build triggers

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
github_owner = "IggyIkenna"

# Trigger on main branch only
branch_pattern = "^main$"

# Build machine type
machine_type = "E2_HIGHCPU_8"

# 30 minute timeout
timeout = "1800s"

# Use default Cloud Build service account
cloud_build_service_account = ""
