variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"  # Tokyo — closest to Binance exchange
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
  description = "Prefix for S3 bucket names"
  type        = string
}

variable "enable_elasticache" {
  description = "Provision ElastiCache Redis (cache.t3.micro). Takes ~10 min. Off by default."
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# PROTOCOL_* service environment variables
# These are injected into ECS task definitions at deploy time.
# Values come from configs/services/{service-name}/{mode}.env files.
# ---------------------------------------------------------------------------

variable "protocol_data_sink_backend" {
  description = "PROTOCOL_DATA_SINK_BACKEND — storage backend for data sink (gcs | s3 | local)"
  type        = string
  default     = "s3"
}

variable "protocol_data_source_backend" {
  description = "PROTOCOL_DATA_SOURCE_BACKEND — storage backend for data source (gcs | s3 | local)"
  type        = string
  default     = "s3"
}

variable "protocol_event_bus_backend" {
  description = "PROTOCOL_EVENT_BUS_BACKEND — event bus backend (pubsub | sqs | local)"
  type        = string
  default     = "sqs"
}

variable "protocol_config_store_backend" {
  description = "PROTOCOL_CONFIG_STORE_BACKEND — config/secrets store (secretmanager | ssm | local)"
  type        = string
  default     = "ssm"
}

# Per-service PROTOCOL_* env var overrides.
variable "protocol_service_env_overrides" {
  description = "Per-service PROTOCOL_* env overrides: {service-name -> {VAR -> value}}"
  type        = map(map(string))
  default     = {}
}
