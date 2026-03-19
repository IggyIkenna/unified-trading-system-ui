# Terraform configuration for UCI Cloud Abstraction — AWS bootstrap
# Creates S3 buckets, SQS queues, Athena workgroup, Glue databases/crawlers,
# Secrets Manager stubs, IAM role, and ECS cluster.
#
# Bucket naming follows cloud-providers.yaml two-tier model:
#   Group A (raw data)    — no env suffix; all envs share prod-level copy
#   Group B (derived data)— unified-trading-{domain}-{category}-{env}-{account_id}
#
# Run ONCE per environment before deploying any services to AWS.
# See scripts/bootstrap/bootstrap_aws.sh for idempotent setup.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.82"
    }
  }

  backend "s3" {
    # All three config values are passed at init time via -backend-config flags.
    # The bootstrap script passes:
    #   -backend-config="bucket=${BUCKET_PREFIX}-terraform-state-${ACCOUNT_ID}"
    #   -backend-config="key=terraform/state/${ENV}"   ← per-env isolation
    #   -backend-config="region=${REGION}"
    # Never hardcode key here — each environment must have its own state file.
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "unified-trading"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ---------------------------------------------------------------------------
# S3 Buckets — Group A: Raw data (no env suffix; all envs read from same copy)
# Naming: unified-trading-{domain}-{category}-{account_id}
# ---------------------------------------------------------------------------

locals {
  # Group A: raw data buckets — no env suffix, shared prod copy
  group_a_buckets = [
    "unified-trading-instruments-cefi-${var.aws_account_id}",
    "unified-trading-instruments-tradfi-${var.aws_account_id}",
    "unified-trading-instruments-defi-${var.aws_account_id}",
    "unified-trading-market-data-cefi-${var.aws_account_id}",
    "unified-trading-market-data-tradfi-${var.aws_account_id}",
    "unified-trading-market-data-defi-${var.aws_account_id}",
    "unified-trading-features-calendar-${var.aws_account_id}",
  ]

  # Group B: derived data buckets — per-env
  group_b_buckets = [
    "unified-trading-features-delta-one-cefi-${var.environment}-${var.aws_account_id}",
    "unified-trading-features-delta-one-tradfi-${var.environment}-${var.aws_account_id}",
    "unified-trading-features-delta-one-defi-${var.environment}-${var.aws_account_id}",
    "unified-trading-features-volatility-cefi-${var.environment}-${var.aws_account_id}",
    "unified-trading-features-volatility-tradfi-${var.environment}-${var.aws_account_id}",
    "unified-trading-features-onchain-cefi-${var.environment}-${var.aws_account_id}",
    "unified-trading-features-onchain-defi-${var.environment}-${var.aws_account_id}",
    "unified-trading-ml-models-${var.environment}-${var.aws_account_id}",
    "unified-trading-ml-predictions-${var.environment}-${var.aws_account_id}",
    "unified-trading-ml-configs-${var.environment}-${var.aws_account_id}",
    "unified-trading-strategy-cefi-${var.environment}-${var.aws_account_id}",
    "unified-trading-strategy-tradfi-${var.environment}-${var.aws_account_id}",
    "unified-trading-strategy-defi-${var.environment}-${var.aws_account_id}",
    "unified-trading-execution-cefi-${var.environment}-${var.aws_account_id}",
    "unified-trading-execution-tradfi-${var.environment}-${var.aws_account_id}",
    "unified-trading-execution-defi-${var.environment}-${var.aws_account_id}",
    # Deployment state + Athena results
    "${var.bucket_prefix}-${var.environment}-deployment-state",
  ]

  all_buckets = concat(local.group_a_buckets, local.group_b_buckets)

  # SQS topic names (mirroring GCP InternalPubSubTopic enum)
  sqs_topic_names = [
    "fill-events",
    "order-requests",
    "execution-results",
    "position-updates",
    "positions",
    "risk-alerts",
    "margin-warnings",
    "market-ticks",
    "order-book-updates",
    "derivative-tickers",
    "liquidations",
    "feature-updates",
    "strategy-signals",
    "ml-predictions",
    "service-lifecycle-events",
    "health-alerts",
    "circuit-breaker-events",
    "eod-settlement",
    "cascade-predictions",
    "features-mtf-ready",
    "features-delta-one-ready",
    "features-cross-instrument-ready",
    "sports-odds-ready",
    "secret-rotation-alerts",
  ]

  # Static secrets (env-independent)
  static_secret_names = [
    "tardis-api-key",
    "databento-api-key",
    "thegraph-api-key",
    "alchemy-api-key",
    "hyperliquid-aws-s3",
    "binance-read-api-key",
    "deribit-read-api-key",
    "betfair-app-key",
    "odds-api-key",
    "oddsjam-api-key",
    "opticodds-api-key",
    "metabet-api-key",
    "polymarket-private-key",
    "coinglass-api-key",
    "hyblock-api-key",
    "cryptoquant-api-key",
    "binance-write-api-key",
    "deribit-write-api-key",
    "anthropic-api-key",
    "pagerduty-api-key",
  ]

  # Env-scoped secrets
  env_secret_names = [
    "risk-api-key",
    "position-monitor-api-key",
  ]

  deployment_state_bucket = "${var.bucket_prefix}-${var.environment}-deployment-state"
}

resource "aws_s3_bucket" "unified_trading" {
  for_each = toset(local.all_buckets)
  bucket   = each.value
  tags     = { Name = each.value }
}

resource "aws_s3_bucket_versioning" "unified_trading" {
  for_each = toset(local.all_buckets)
  bucket   = each.value
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "unified_trading" {
  for_each = toset(local.all_buckets)
  bucket   = each.value
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "unified_trading" {
  for_each = toset(local.all_buckets)
  bucket   = each.value

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------------------------------------------------------------------------
# SQS FIFO Queues — one per topic (mirrors GCP Pub/Sub topics)
# Naming: unified-trading-{env}-{topic}.fifo
# ---------------------------------------------------------------------------

resource "aws_sqs_queue" "unified_trading" {
  for_each = toset(local.sqs_topic_names)

  name                        = "unified-trading-${var.environment}-${each.value}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true

  # 7-day visibility + retention to mirror GCP 7-day retention
  visibility_timeout_seconds  = 60
  message_retention_seconds   = 604800

  tags = {
    Name    = "unified-trading-${var.environment}-${each.value}"
    Purpose = "event-bus"
  }
}

# Dead-letter queues for each topic
resource "aws_sqs_queue" "unified_trading_dlq" {
  for_each = toset(local.sqs_topic_names)

  name                        = "unified-trading-${var.environment}-${each.value}-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days for DLQ

  tags = {
    Name    = "unified-trading-${var.environment}-${each.value}-dlq"
    Purpose = "event-bus-dlq"
  }
}

resource "aws_sqs_queue_redrive_policy" "unified_trading" {
  for_each  = toset(local.sqs_topic_names)
  queue_url = aws_sqs_queue.unified_trading[each.value].id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.unified_trading_dlq[each.value].arn
    maxReceiveCount     = 5
  })
}

# ---------------------------------------------------------------------------
# Athena — workgroup (BigQuery equivalent for external table queries)
# ---------------------------------------------------------------------------

resource "aws_athena_workgroup" "unified_trading" {
  name = "unified-trading-${var.environment}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${local.deployment_state_bucket}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }

  tags = { Name = "unified-trading-${var.environment}" }
}

# ---------------------------------------------------------------------------
# Glue Catalog Databases — mirrors BigQuery datasets
# Group A (raw): no env suffix; Group B (derived): per-env
# ---------------------------------------------------------------------------

resource "aws_glue_catalog_database" "raw" {
  for_each = toset([
    "instruments",
    "market_data",
    "features_calendar",
  ])

  name        = "${replace(var.bucket_prefix, "-", "_")}_${each.value}"
  description = "Unified Trading — ${each.value} (raw data, shared across envs)"
}

resource "aws_glue_catalog_database" "derived" {
  for_each = toset([
    "features",
    "ml_models",
    "ml_predictions",
    "strategy",
    "execution",
    "audit",
    "market_data_hft",
  ])

  name        = "${replace(var.bucket_prefix, "-", "_")}_${each.value}_${var.environment}"
  description = "Unified Trading — ${each.value} (${var.environment})"
}

# ---------------------------------------------------------------------------
# Glue IAM Role — for crawlers
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "glue_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["glue.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "glue_crawler" {
  name               = "unified-trading-glue-crawler-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.glue_assume_role.json
  tags               = { Name = "unified-trading-glue-crawler-${var.environment}" }
}

resource "aws_iam_role_policy_attachment" "glue_service" {
  role       = aws_iam_role.glue_crawler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

data "aws_iam_policy_document" "glue_s3_access" {
  statement {
    sid     = "S3BucketAccess"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      "arn:aws:s3:::unified-trading-*",
      "arn:aws:s3:::unified-trading-*/*",
      "arn:aws:s3:::uts-*",
      "arn:aws:s3:::uts-*/*",
    ]
  }
}

resource "aws_iam_role_policy" "glue_s3" {
  name   = "glue-s3-access"
  role   = aws_iam_role.glue_crawler.id
  policy = data.aws_iam_policy_document.glue_s3_access.json
}

# ---------------------------------------------------------------------------
# Glue Crawlers — one per raw-data domain (Group A)
# Group B tables are written by services with schema — crawlers optional
# ---------------------------------------------------------------------------

resource "aws_glue_crawler" "instruments" {
  database_name = aws_glue_catalog_database.raw["instruments"].name
  name          = "unified-trading-instruments-crawler"
  role          = aws_iam_role.glue_crawler.arn

  dynamic "s3_target" {
    for_each = ["cefi", "tradfi", "defi"]
    content {
      path = "s3://unified-trading-instruments-${s3_target.value}-${var.aws_account_id}/"
    }
  }

  schedule = "cron(0 3 * * ? *)"  # Daily at 03:00 UTC
  tags     = { Name = "unified-trading-instruments-crawler" }
}

resource "aws_glue_crawler" "market_data" {
  database_name = aws_glue_catalog_database.raw["market_data"].name
  name          = "unified-trading-market-data-crawler"
  role          = aws_iam_role.glue_crawler.arn

  dynamic "s3_target" {
    for_each = ["cefi", "tradfi", "defi"]
    content {
      path = "s3://unified-trading-market-data-${s3_target.value}-${var.aws_account_id}/"
    }
  }

  schedule = "cron(0 4 * * ? *)"  # Daily at 04:00 UTC
  tags     = { Name = "unified-trading-market-data-crawler" }
}

resource "aws_glue_crawler" "features_derived" {
  database_name = aws_glue_catalog_database.derived["features"].name
  name          = "unified-trading-features-${var.environment}-crawler"
  role          = aws_iam_role.glue_crawler.arn

  dynamic "s3_target" {
    for_each = [
      "unified-trading-features-delta-one-cefi-${var.environment}-${var.aws_account_id}",
      "unified-trading-features-delta-one-tradfi-${var.environment}-${var.aws_account_id}",
      "unified-trading-features-volatility-cefi-${var.environment}-${var.aws_account_id}",
      "unified-trading-features-volatility-tradfi-${var.environment}-${var.aws_account_id}",
    ]
    content {
      path = "s3://${s3_target.value}/"
    }
  }

  schedule = "cron(0 5 * * ? *)"  # Daily at 05:00 UTC
  tags     = { Name = "unified-trading-features-${var.environment}-crawler" }
}

# ---------------------------------------------------------------------------
# Secrets Manager — stub secrets (values populated out-of-band)
# ---------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "static" {
  for_each    = toset(local.static_secret_names)
  name        = "unified-trading/${var.environment}/${each.value}"
  description = "Unified Trading ${var.environment} — ${each.value} (populate manually)"
  tags        = { Name = each.value }
}

resource "aws_secretsmanager_secret" "env_scoped" {
  for_each    = toset(local.env_secret_names)
  name        = "unified-trading/${var.environment}/${each.value}-${var.environment}"
  description = "Unified Trading ${var.environment} — ${each.value} (populate manually)"
  tags        = { Name = "${each.value}-${var.environment}" }
}

# ---------------------------------------------------------------------------
# IAM role — unified-trading-role
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "unified_trading" {
  name               = "unified-trading-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags               = { Name = "unified-trading-role-${var.environment}" }
}

data "aws_iam_policy_document" "unified_trading_permissions" {
  # S3 access on all unified-trading buckets (wildcard — avoids 6144-char policy limit)
  statement {
    sid    = "S3UnifiedTradingBuckets"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::unified-trading-*",
      "arn:aws:s3:::unified-trading-*/*",
      "arn:aws:s3:::uts-*",
      "arn:aws:s3:::uts-*/*",
    ]
  }

  # Athena query execution
  statement {
    sid    = "AthenaQueryExecution"
    effect = "Allow"
    actions = [
      "athena:StartQueryExecution",
      "athena:GetQueryResults",
      "athena:GetQueryExecution",
    ]
    resources = [aws_athena_workgroup.unified_trading.arn]
  }

  # Glue catalog read (for Athena external table queries)
  statement {
    sid    = "GlueCatalogRead"
    effect = "Allow"
    actions = [
      "glue:GetDatabase",
      "glue:GetTable",
      "glue:GetTables",
      "glue:GetPartition",
      "glue:GetPartitions",
    ]
    resources = ["*"]
  }

  # SQS access — wildcard on unified-trading queues for this account/region
  statement {
    sid    = "SQSUnifiedTrading"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]
    resources = [
      "arn:aws:sqs:${var.aws_region}:${var.aws_account_id}:unified-trading-${var.environment}-*.fifo",
      "arn:aws:sqs:${var.aws_region}:${var.aws_account_id}:unified-trading-${var.environment}-*-dlq.fifo",
    ]
  }

  # Secrets Manager — read all unified-trading secrets for this environment
  statement {
    sid     = "SecretsManagerUnifiedTrading"
    effect  = "Allow"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:unified-trading/${var.environment}/*",
    ]
  }
}

resource "aws_iam_policy" "unified_trading" {
  name        = "unified-trading-policy-${var.environment}"
  description = "Permissions for unified-trading services (${var.environment})"
  policy      = data.aws_iam_policy_document.unified_trading_permissions.json
}

resource "aws_iam_role_policy_attachment" "unified_trading" {
  role       = aws_iam_role.unified_trading.name
  policy_arn = aws_iam_policy.unified_trading.arn
}

# ---------------------------------------------------------------------------
# ElastiCache (Redis) — optional; guarded by var.enable_elasticache
#
# Not enabled by default because:
#   1. Provisioning takes ~5-10 minutes
#   2. cache.t3.micro costs ~$13/month per env
#   3. Requires a VPC subnet group — we use default VPC for now
#
# To enable:
#   terraform apply -var="enable_elasticache=true" ...
#
# After enabling, REDIS_URL is stored in Secrets Manager under
#   unified-trading/{env}/redis-url
# ECS task definitions should inject it via:
#   aws secretsmanager get-secret-value --secret-id unified-trading/{env}/redis-url
# ---------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "unified_trading" {
  count      = var.enable_elasticache ? 1 : 0
  name       = "unified-trading-${var.environment}"
  subnet_ids = data.aws_subnets.default[0].ids

  tags = { Environment = var.environment }
}

resource "aws_security_group" "elasticache" {
  count       = var.enable_elasticache ? 1 : 0
  name        = "unified-trading-${var.environment}-elasticache"
  description = "ElastiCache Redis — allow inbound from ECS tasks in same VPC"
  vpc_id      = data.aws_vpc.default[0].id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default[0].cidr_block]
    description = "Redis from VPC"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Environment = var.environment }
}

resource "aws_elasticache_replication_group" "unified_trading" {
  count = var.enable_elasticache ? 1 : 0

  replication_group_id = "trading-cache-${var.environment}"
  description          = "Unified Trading Redis cache — ${var.environment}"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.t3.micro"
  num_cache_clusters   = 1
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.unified_trading[0].name
  security_group_ids = [aws_security_group.elasticache[0].id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = false  # requires TLS client config; add when services support it

  tags = { Environment = var.environment, ManagedBy = "terraform" }
}

# Store Redis URL in Secrets Manager so services read it via UCI
resource "aws_secretsmanager_secret" "redis_url" {
  count = var.enable_elasticache ? 1 : 0
  name  = "unified-trading/${var.environment}/redis-url"
  tags  = { Name = "redis-url", Environment = var.environment }
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  count     = var.enable_elasticache ? 1 : 0
  secret_id = aws_secretsmanager_secret.redis_url[0].id
  secret_string = "redis://${aws_elasticache_replication_group.unified_trading[0].primary_endpoint_address}:6379"
}

# Data sources needed when ElastiCache is enabled
data "aws_vpc" "default" {
  count   = var.enable_elasticache ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.enable_elasticache ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

# ---------------------------------------------------------------------------
# ECS cluster
# ---------------------------------------------------------------------------

resource "aws_ecs_cluster" "unified_trading" {
  name = "unified-trading-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "unified-trading-${var.environment}" }

  # NOTE: ECS task definitions are intentionally absent here.
  # See ARCHITECTURE.md "Deployment Model" section for rationale.
  # ECS task definitions are submitted at runtime by backends/aws_batch.py.
}
