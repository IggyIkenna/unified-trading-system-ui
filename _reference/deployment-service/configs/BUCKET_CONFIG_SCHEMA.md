# Bucket Configuration Schema

This document describes the configuration schema for `configs/bucket_config.yaml`, which contains all bucket-related configuration extracted from `setup-buckets.py`.

## Configuration Structure

### `defaults`

Default values for cloud providers:

```yaml
defaults:
  gcp:
    project_id: test-project
    region: asia-northeast1
  aws:
    region: ap-northeast-1
```

### `shared_bucket_services`

Services that use shared buckets (no category dimension):

```yaml
shared_bucket_services:
  - features-calendar-service
  - features-onchain-service
  - ml-training-service
  # ... more services
```

### `service_categories`

Category restrictions and defaults for services:

```yaml
service_categories:
  restricted_categories:
    volatility: [cefi, tradfi] # No DEFI for volatility
  default_categories: [cefi, tradfi, defi]
```

### `infrastructure_buckets`

Bucket definitions for infrastructure services:

```yaml
infrastructure_buckets:
  gcp:
    - name_template: "terraform-state-{project_id}"
      service: infrastructure
      type: infrastructure
      category: ALL
  aws:
    - name_template: "unified-trading-terraform-state-{project_id}"
      service: infrastructure
      type: infrastructure
      category: ALL
```

### `aws_bucket_mappings`

Mapping from GCP template patterns to AWS bucket names:

```yaml
aws_bucket_mappings:
  instruments-store: "unified-trading-instruments-{category}-{account_id}"
  market-data-tick: "unified-trading-market-data-{category}-{account_id}"
  # ... more mappings
```

### `bucket_settings`

Cloud-specific bucket creation settings:

```yaml
bucket_settings:
  gcp:
    storage_class: STANDARD
    uniform_bucket_access: true
    versioning: true
    lifecycle_rules:
      production:
        age_days: 365
        action: SetStorageClass
        storage_class: NEARLINE
      test:
        age_days: 30
        action: SetStorageClass
        storage_class: NEARLINE
  aws:
    versioning: true
    encryption:
      algorithm: AES256
    # ... more settings
```

### `test_buckets`

Test bucket naming configuration:

```yaml
test_buckets:
  naming_pattern: "infix" # insert '-test' before project_id
  fallback_pattern: "suffix" # append '-test' if project_id not found
```

### `validation`

Validation rules for bucket configurations:

```yaml
validation:
  invalid_combinations:
    - template_contains: volatility
      invalid_category: defi
      reason: "No volatility for DEFI"
    - template_contains: onchain
      invalid_category: tradfi
      reason: "No onchain for TRADFI"
```

## Configuration Benefits

1. **Centralized Configuration**: All bucket-related settings in one place
2. **Environment Agnostic**: Easy to modify for different environments
3. **Validation**: Built-in validation prevents invalid configurations
4. **Maintainability**: Clear structure makes updates easier
5. **Reusability**: Configuration can be shared across tools

## Template Variables

The following variables are available for use in templates:

- `{project_id}` - GCP project ID or AWS account ID
- `{category}` - Category (cefi, tradfi, defi)
- `{category_lower}` - Category in lowercase
- `{account_id}` - AWS account ID

## Validation Rules

The configuration includes validation rules that prevent invalid combinations:

- No volatility services for DEFI category
- No onchain services for TRADFI category
- Required configuration sections must be present
