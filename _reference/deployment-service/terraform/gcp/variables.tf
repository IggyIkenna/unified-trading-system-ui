variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

variable "bucket_prefix" {
  description = "Prefix for GCS bucket names"
  type        = string
}

variable "enable_memorystore" {
  description = "Provision Cloud Memorystore Redis instance (1 GB). Takes ~10 min. Off by default."
  type        = bool
  default     = false
}

variable "enable_secret_rotation" {
  description = "Deploy the secret-rotation Cloud Function and its Cloud Scheduler trigger. Requires unified-cloud-interface to be published to GCP Artifact Registry Python repo. Off by default."
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# PROTOCOL_* service environment variables
# These are injected into Cloud Run service definitions at deploy time.
# Values come from configs/services/{service-name}/{mode}.env files.
# ---------------------------------------------------------------------------

variable "protocol_data_sink_backend" {
  description = "PROTOCOL_DATA_SINK_BACKEND — storage backend for data sink (gcs | s3 | local)"
  type        = string
  default     = "gcs"
}

variable "protocol_data_source_backend" {
  description = "PROTOCOL_DATA_SOURCE_BACKEND — storage backend for data source (gcs | s3 | local)"
  type        = string
  default     = "gcs"
}

variable "protocol_event_bus_backend" {
  description = "PROTOCOL_EVENT_BUS_BACKEND — event bus backend (pubsub | sqs | local)"
  type        = string
  default     = "pubsub"
}

variable "protocol_config_store_backend" {
  description = "PROTOCOL_CONFIG_STORE_BACKEND — config/secrets store (secretmanager | ssm | local)"
  type        = string
  default     = "secretmanager"
}

# Per-service PROTOCOL_* env var overrides.
# Map of service-name -> map of env-var-name -> value.
# Merged on top of backend defaults when deploying Cloud Run services.
variable "protocol_service_env_overrides" {
  description = "Per-service PROTOCOL_* env overrides: {service-name -> {VAR -> value}}"
  type        = map(map(string))
  default     = {}
}
